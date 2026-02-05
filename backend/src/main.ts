import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');

  // Global prefix /api/v1
  app.setGlobalPrefix('api/v1');

  // Security headers - protects against XSS, clickjacking, etc.
  app.use(helmet({
    contentSecurityPolicy: false, // Disable for Swagger UI compatibility
    crossOriginEmbedderPolicy: false, // Allow embedding resources
  }));

  // Enable CORS for frontend (Next.js)
  app.enableCors({
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Tenant-Id'],
    credentials: true,
  });

  // Global ValidationPipe - Security: whitelist removes unknown properties
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strip properties not in DTO
      forbidNonWhitelisted: true, // Throw error if unknown properties
      transform: true, // Auto-transform payloads to DTO types
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Swagger configuration
  const config = new DocumentBuilder()
    .setTitle('Inventory SaaS API')
    .setDescription(
      'API para el Sistema de Inventario SaaS Multi-tenant. ' +
      'Soporta Hoteles, Restaurantes y Retail.',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .addApiKey(
      { type: 'apiKey', name: 'X-Tenant-Id', in: 'header' },
      'tenant-id',
    )
    .addTag('Authentication', 'User login and JWT tokens')
    .addTag('Tenants', 'Tenant selection and management')
    .addTag('Products', 'Product catalog management')
    .addTag('Health', 'Endpoints de estado del sistema')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  const port = process.env.PORT ?? 3000;
  await app.listen(port);

  logger.log(`🚀 Application is running on: http://localhost:${port}`);
  logger.log(`📚 Swagger docs available at: http://localhost:${port}/api/docs`);
  logger.log(`❤️  Health check at: http://localhost:${port}/api/v1/health`);
}

bootstrap();
