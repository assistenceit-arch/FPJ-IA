import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');

  // CORS: el frontend (Next.js) corre en un puerto distinto al backend, así
  // que el navegador exige que el backend autorice explícitamente el
  // origen. En desarrollo local Next.js suele usar 3000 o 3001 (el que
  // esté libre); en producción se agrega la URL real vía FRONTEND_URL.
  const origenesPermitidos = [
    'http://localhost:3000',
    'http://localhost:3001',
    process.env.FRONTEND_URL,
  ].filter((origen): origen is string => Boolean(origen));

  app.enableCors({
    origin: origenesPermitidos,
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  await app.listen(process.env.PORT ?? 3000);
}

void bootstrap();
