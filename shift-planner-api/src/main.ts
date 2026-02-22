import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { RequestMethod } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { Logger } from 'nestjs-pino';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  // Pino logger
  app.useLogger(app.get(Logger));

  // Security
  app.use(helmet());
  app.use(cookieParser());

  // CORS
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const allowedOrigins = frontendUrl
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (error: Error | null, allow?: boolean) => void,
    ) => {
      if (!origin) {
        return callback(null, true);
      }
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error('CORS origin not allowed'), false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['X-Warnings'],
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());

  // API prefix
  app.setGlobalPrefix('api', {
    exclude: [{ path: '', method: RequestMethod.GET }],
  });

  // Swagger
  const config = new DocumentBuilder()
    .setTitle('Shift Planner API')
    .setDescription('Çalışan Vardiya Planlayıcı REST API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`🚀 Shift Planner API running on http://localhost:${port}`);
  console.log(`📖 Swagger docs: http://localhost:${port}/api/docs`);
}
bootstrap();
