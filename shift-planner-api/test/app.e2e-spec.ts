/// <reference types="jest" />
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import cookieParser from 'cookie-parser';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Shift Planner API (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let adminToken: string;
  let managerToken: string;
  let employeeToken: string;
  let testEmployeeId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.use(cookieParser());
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    );

    await app.init();

    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    await app.close();
  });

  // ============================================================
  // Test 1: Auth Flow - Login, Me, Refresh, Logout
  // ============================================================
  describe('Auth Flow', () => {
    it('POST /api/auth/login - should login as admin', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'admin@shiftplanner.com',
          password: 'Admin1234!',
        })
        .expect(200);

      expect(res.body).toHaveProperty('accessToken');
      expect(res.body.user).toHaveProperty('email', 'admin@shiftplanner.com');
      expect(res.body.user).toHaveProperty('role', 'ADMIN');
      adminToken = res.body.accessToken;
    });

    it('POST /api/auth/login - should login as manager', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'manager@shiftplanner.com',
          password: 'Manager1234!',
        })
        .expect(200);

      managerToken = res.body.accessToken;
    });

    it('POST /api/auth/login - should login as employee', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'ali@shiftplanner.com',
          password: 'Employee1234!',
        })
        .expect(200);

      employeeToken = res.body.accessToken;
    });

    it('POST /api/auth/login - should fail with wrong password', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'admin@shiftplanner.com',
          password: 'WrongPassword!',
        })
        .expect(401);
    });

    it('GET /api/auth/me - should return current user', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('email', 'admin@shiftplanner.com');
      expect(res.body).toHaveProperty('role', 'ADMIN');
      expect(res.body).toHaveProperty('employee');
    });

    it('GET /api/auth/me - should fail without token', async () => {
      await request(app.getHttpServer())
        .get('/api/auth/me')
        .expect(401);
    });
  });

  // ============================================================
  // Test 2: Shift Overlap Detection
  // ============================================================
  describe('Shift Overlap Detection', () => {
    let createdShiftId: string;

    it('should get employees to use for testing', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/employees')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.length).toBeGreaterThan(0);
      testEmployeeId = res.body[0].id;
    });

    it('POST /api/shifts - should create a shift', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/shifts')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          employeeId: testEmployeeId,
          startTime: '2026-03-02T09:00:00+03:00',
          endTime: '2026-03-02T17:00:00+03:00',
          position: 'barista',
        })
        .expect(201);

      expect(res.body).toHaveProperty('id');
      expect(res.body).toHaveProperty('employeeId', testEmployeeId);
      createdShiftId = res.body.id;
    });

    it('POST /api/shifts - should fail with overlapping shift (409)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/shifts')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          employeeId: testEmployeeId,
          startTime: '2026-03-02T10:00:00+03:00',
          endTime: '2026-03-02T14:00:00+03:00',
          position: 'kasiyer',
        })
        .expect(409);

      expect(res.body).toHaveProperty('code', 'SHIFT_OVERLAP');
    });

    it('POST /api/shifts - non-overlapping same-day shift should succeed', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/shifts')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          employeeId: testEmployeeId,
          startTime: '2026-03-02T18:00:00+03:00',
          endTime: '2026-03-02T22:00:00+03:00',
          position: 'garson',
        })
        .expect(201);

      expect(res.body).toHaveProperty('id');
    });

    // Cleanup
    afterAll(async () => {
      if (createdShiftId) {
        await prisma.shift.updateMany({
          where: {
            employeeId: testEmployeeId,
            startTime: { gte: new Date('2026-03-02') },
            endTime: { lte: new Date('2026-03-03') },
          },
          data: { status: 'CANCELLED' },
        });
      }
    });
  });

  // ============================================================
  // Test 3: Availability Override Flow
  // ============================================================
  describe('Availability Override', () => {
    let blockId: string;

    it('POST /api/availability - employee creates unavailability', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/availability')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          type: 'UNAVAILABLE',
          dayOfWeek: 4, // Thursday — 2026-03-05 is Thursday
          note: 'Doktor randevusu',
        })
        .expect(201);

      expect(res.body).toHaveProperty('id');
      blockId = res.body.id;
    });

    it('POST /api/shifts - should fail when employee is unavailable (422)', async () => {
      // Get employee id for Ali
      const empRes = await request(app.getHttpServer())
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${employeeToken}`)
        .expect(200);

      const aliEmployeeId = empRes.body.employee.id;

      const res = await request(app.getHttpServer())
        .post('/api/shifts')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          employeeId: aliEmployeeId,
          startTime: '2026-03-05T09:00:00+03:00',
          endTime: '2026-03-05T17:00:00+03:00',
          position: 'barista',
          forceOverride: false,
        })
        .expect(422);

      expect(res.body).toHaveProperty('code', 'AVAILABILITY_CONFLICT');
    });

    it('POST /api/shifts - should succeed with forceOverride', async () => {
      const empRes = await request(app.getHttpServer())
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${employeeToken}`)
        .expect(200);

      const aliEmployeeId = empRes.body.employee.id;

      const res = await request(app.getHttpServer())
        .post('/api/shifts')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          employeeId: aliEmployeeId,
          startTime: '2026-03-05T09:00:00+03:00',
          endTime: '2026-03-05T17:00:00+03:00',
          forceOverride: true,
        })
        .expect(201);

      expect(res.body).toHaveProperty('id');
      expect(res.body.warnings).toContain(
        'Müsaitlik çakışması yönetici tarafından geçersiz kılındı (override)',
      );
    });

    // Cleanup
    afterAll(async () => {
      if (blockId) {
        await prisma.availabilityBlock.deleteMany({
          where: { id: blockId },
        });
      }
      await prisma.shift.updateMany({
        where: {
          startTime: { gte: new Date('2026-03-05') },
          endTime: { lte: new Date('2026-03-06') },
        },
        data: { status: 'CANCELLED' },
      });
    });
  });

  // ============================================================
  // Test 4: Weekly Schedule
  // ============================================================
  describe('Weekly Schedule', () => {
    it('GET /api/schedule/week - should return weekly schedule', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/schedule/week?start=2026-02-16')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('weekStart', '2026-02-16');
      expect(res.body).toHaveProperty('weekEnd', '2026-02-22');
      expect(res.body).toHaveProperty('employees');
      expect(Array.isArray(res.body.employees)).toBe(true);
      expect(res.body.employees.length).toBeGreaterThan(0);

      // Check employee structure
      const firstEmp = res.body.employees[0];
      expect(firstEmp).toHaveProperty('id');
      expect(firstEmp).toHaveProperty('name');
      expect(firstEmp).toHaveProperty('totalHours');
      expect(firstEmp).toHaveProperty('days');
      expect(Object.keys(firstEmp.days)).toHaveLength(7);
    });
  });

  // ============================================================
  // Test 5: Authorization - Employee cannot create shifts
  // ============================================================
  describe('Authorization', () => {
    it('POST /api/shifts - employee should get 403', async () => {
      await request(app.getHttpServer())
        .post('/api/shifts')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          employeeId: testEmployeeId,
          startTime: '2026-03-10T09:00:00+03:00',
          endTime: '2026-03-10T17:00:00+03:00',
        })
        .expect(403);
    });

    it('GET /api/employees - employee should get 403', async () => {
      await request(app.getHttpServer())
        .get('/api/employees')
        .set('Authorization', `Bearer ${employeeToken}`)
        .expect(403);
    });

    it('GET /api/reports/weekly-hours - employee should get 403', async () => {
      await request(app.getHttpServer())
        .get('/api/reports/weekly-hours?start=2026-02-16')
        .set('Authorization', `Bearer ${employeeToken}`)
        .expect(403);
    });

    it('GET /api/schedule/week - employee CAN access schedule', async () => {
      await request(app.getHttpServer())
        .get('/api/schedule/week?start=2026-02-16')
        .set('Authorization', `Bearer ${employeeToken}`)
        .expect(200);
    });
  });

  // ============================================================
  // Test 6: Overnight Shift
  // ============================================================
  describe('Overnight Shift', () => {
    it('POST /api/shifts - should handle overnight shift (22:00-06:00)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/shifts')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          employeeId: testEmployeeId,
          startTime: '2026-03-07T22:00:00+03:00',
          endTime: '2026-03-07T06:00:00+03:00', // next day
          position: 'gece nöbeti',
        })
        .expect(201);

      expect(res.body).toHaveProperty('id');
      // End time should be 06:00 next day
      const endTime = new Date(res.body.endTime);
      const startTime = new Date(res.body.startTime);
      expect(endTime.getTime()).toBeGreaterThan(startTime.getTime());
    });

    afterAll(async () => {
      await prisma.shift.updateMany({
        where: {
          startTime: { gte: new Date('2026-03-07') },
          endTime: { lte: new Date('2026-03-09') },
        },
        data: { status: 'CANCELLED' },
      });
    });
  });

  // ============================================================
  // Test 7: Health Check
  // ============================================================
  describe('Health Check', () => {
    it('GET /api/health - should return ok', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/health')
        .expect(200);

      expect(res.body).toHaveProperty('status', 'ok');
      expect(res.body).toHaveProperty('uptime');
    });
  });
});
