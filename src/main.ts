import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { setupSwagger } from './config/swagger.config';

// compression es CJS (export =); el default import falla en runtime sin esModuleInterop.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const compression = require('compression') as () => import('express').RequestHandler;

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(compression());

  app.enableCors({
    origin: true,
    credentials: true,
  });

  app.setGlobalPrefix('api');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  setupSwagger(app);

  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port, '0.0.0.0');
  console.log(`API disponible en http://0.0.0.0:${port}/api`);
  console.log(`Swagger disponible en http://localhost:${port}/docs`);
}
bootstrap();
