import { PrismaClient, Role, ShiftStatus, AvailabilityType } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
const SALT_ROUNDS = 12;

async function main() {
  console.log('🌱 Seeding database...');

  // Create demo users with employees
  const adminPassword = await bcrypt.hash('Admin1234!', SALT_ROUNDS);
  const managerPassword = await bcrypt.hash('Manager1234!', SALT_ROUNDS);
  const employeePassword = await bcrypt.hash('Employee1234!', SALT_ROUNDS);

  // Admin
  const admin = await prisma.user.upsert({
    where: { email: 'admin@shiftplanner.com' },
    update: {},
    create: {
      email: 'admin@shiftplanner.com',
      name: 'Ahmet Yönetici',
      passwordHash: adminPassword,
      role: Role.ADMIN,
      employee: {
        create: {
          position: 'Genel Müdür',
          department: 'Yönetim',
          hourlyRate: 500,
          maxWeeklyHours: 45,
        },
      },
    },
  });

  // Manager
  const manager = await prisma.user.upsert({
    where: { email: 'manager@shiftplanner.com' },
    update: {},
    create: {
      email: 'manager@shiftplanner.com',
      name: 'Ayşe Vardiya',
      passwordHash: managerPassword,
      role: Role.MANAGER,
      employee: {
        create: {
          position: 'Vardiya Müdürü',
          department: 'Operasyon',
          hourlyRate: 350,
          maxWeeklyHours: 45,
        },
      },
    },
  });

  // Employees
  const employeeData = [
    { email: 'ali@shiftplanner.com', name: 'Ali Yılmaz', position: 'Barista', department: 'Mutfak', hourlyRate: 250 },
    { email: 'zeynep@shiftplanner.com', name: 'Zeynep Kara', position: 'Kasiyer', department: 'Ön Ofis', hourlyRate: 230 },
    { email: 'mehmet@shiftplanner.com', name: 'Mehmet Demir', position: 'Garson', department: 'Servis', hourlyRate: 240 },
    { email: 'elif@shiftplanner.com', name: 'Elif Çelik', position: 'Barista', department: 'Mutfak', hourlyRate: 250 },
    { email: 'can@shiftplanner.com', name: 'Can Öztürk', position: 'Garson', department: 'Servis', hourlyRate: 240 },
  ];

  for (const emp of employeeData) {
    await prisma.user.upsert({
      where: { email: emp.email },
      update: {},
      create: {
        email: emp.email,
        name: emp.name,
        passwordHash: employeePassword,
        role: Role.EMPLOYEE,
        employee: {
          create: {
            position: emp.position,
            department: emp.department,
            hourlyRate: emp.hourlyRate,
            maxWeeklyHours: 45,
          },
        },
      },
    });
  }

  // Create some sample shifts for the current week (2026-02-16 to 2026-02-22)
  const employees = await prisma.employee.findMany();

  const weekShifts = [
    // Monday
    { empIndex: 0, day: '2026-02-16', start: '08:00', end: '16:00' },
    { empIndex: 1, day: '2026-02-16', start: '08:00', end: '16:00' },
    { empIndex: 2, day: '2026-02-16', start: '12:00', end: '20:00' },
    { empIndex: 3, day: '2026-02-16', start: '16:00', end: '00:00' },
    // Tuesday
    { empIndex: 0, day: '2026-02-17', start: '08:00', end: '16:00' },
    { empIndex: 2, day: '2026-02-17', start: '08:00', end: '16:00' },
    { empIndex: 4, day: '2026-02-17', start: '12:00', end: '20:00' },
    { empIndex: 3, day: '2026-02-17', start: '16:00', end: '00:00' },
    // Wednesday
    { empIndex: 1, day: '2026-02-18', start: '08:00', end: '16:00' },
    { empIndex: 3, day: '2026-02-18', start: '08:00', end: '16:00' },
    { empIndex: 0, day: '2026-02-18', start: '12:00', end: '20:00' },
    { empIndex: 4, day: '2026-02-18', start: '16:00', end: '00:00' },
    // Thursday
    { empIndex: 0, day: '2026-02-19', start: '08:00', end: '16:00' },
    { empIndex: 1, day: '2026-02-19', start: '12:00', end: '20:00' },
    { empIndex: 2, day: '2026-02-19', start: '08:00', end: '16:00' },
    // Friday
    { empIndex: 2, day: '2026-02-20', start: '08:00', end: '16:00' },
    { empIndex: 3, day: '2026-02-20', start: '10:00', end: '18:00' },
    { empIndex: 4, day: '2026-02-20', start: '14:00', end: '22:00' },
    // Saturday - overnight shift
    { empIndex: 0, day: '2026-02-21', start: '10:00', end: '18:00' },
    { empIndex: 1, day: '2026-02-21', start: '22:00', end: '06:00' }, // overnight
  ];

  for (const shiftData of weekShifts) {
    const emp = employees[shiftData.empIndex];
    if (!emp) continue;

    let startTime = new Date(`${shiftData.day}T${shiftData.start}:00+03:00`);
    let endTime = new Date(`${shiftData.day}T${shiftData.end}:00+03:00`);

    // Handle overnight shifts
    if (endTime <= startTime) {
      endTime = new Date(endTime.getTime() + 24 * 60 * 60 * 1000);
    }

    await prisma.shift.create({
      data: {
        employeeId: emp.id,
        startTime,
        endTime,
        status: ShiftStatus.PUBLISHED,
      },
    });
  }

  // Create some availability blocks
  const allEmployees = await prisma.employee.findMany({ include: { user: true } });
  const aliEmployee = allEmployees.find((e) => e.user.name === 'Ali Yılmaz');
  const zeynepEmployee = allEmployees.find((e) => e.user.name === 'Zeynep Kara');

  if (aliEmployee) {
    // Ali is unavailable on Thursdays
    await prisma.availabilityBlock.create({
      data: {
        employeeId: aliEmployee.id,
        type: AvailabilityType.UNAVAILABLE,
        dayOfWeek: 4, // Thursday
        note: 'Doktor randevusu',
      },
    });
  }

  if (zeynepEmployee) {
    // Zeynep prefers not to work early mornings on Fridays
    await prisma.availabilityBlock.create({
      data: {
        employeeId: zeynepEmployee.id,
        type: AvailabilityType.PREFER_NOT,
        dayOfWeek: 5, // Friday
        startTime: new Date(Date.UTC(1970, 0, 1, 6, 0, 0)),
        endTime: new Date(Date.UTC(1970, 0, 1, 12, 0, 0)),
        note: 'Sabah erken müsait değilim',
      },
    });
  }

  console.log('✅ Seed completed!');
  console.log('');
  console.log('📋 Demo hesaplar:');
  console.log('  Admin:    admin@shiftplanner.com    / Admin1234!');
  console.log('  Manager:  manager@shiftplanner.com  / Manager1234!');
  console.log('  Employee: ali@shiftplanner.com      / Employee1234!');
  console.log('            zeynep@shiftplanner.com   / Employee1234!');
  console.log('            mehmet@shiftplanner.com   / Employee1234!');
  console.log('            elif@shiftplanner.com     / Employee1234!');
  console.log('            can@shiftplanner.com      / Employee1234!');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
