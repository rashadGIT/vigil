import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug'],
  });

  // Security headers
  app.use(helmet());

  // Global validation — whitelist strips unknown props, forbidNonWhitelisted throws on extras
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Dashboard CORS — credentialed, specific origins (D-14)
  app.enableCors({
    origin: [
      'https://app.velaapp.com',
      /\.velaapp\.com$/,
      'http://localhost:3000',
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-dev-user', 'x-vela-internal-key'],
  });
  // Intake endpoint CORS is applied per-route via @Header() in intake.controller.ts

  // Swagger — dev only (D-13)
  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('Vela API')
      .setDescription('Funeral Home Operations Platform')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
  }

  const port = parseInt(process.env.PORT ?? '3001', 10);
  await app.listen(port);
  Logger.log(`Vela API listening on http://localhost:${port}`, 'Bootstrap');
}

void bootstrap();
