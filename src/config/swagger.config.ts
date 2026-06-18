import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export function setupSwagger(app: INestApplication): void {
  const config = new DocumentBuilder()
    .setTitle('Tesis SQL API')
    .setDescription(
      'API REST para la plataforma educativa de SQL. Gestiona cursos, módulos, actividades y validación SQL.',
    )
    .setVersion('1.0')
    .addTag('health', 'Estado del servicio')
    .addTag('cursos', 'Cursos disponibles')
    .addTag('modulos', 'Módulos de un curso')
    .addTag('actividades', 'Actividades de un módulo')
    .addTag('preguntas', 'Preguntas de actividades')
    .addTag('sql', 'Ejecución y validación SQL en sandbox')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
  });
}
