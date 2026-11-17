import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/all-exceptions.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api/v1');
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      exceptionFactory: (errors) =>
        new BadRequestException({
          code: 'VALIDATION_ERROR',
          message: 'Проверьте поля формы',
          fields: Object.fromEntries(
            errors.map((e) => [e.property, Object.values(e.constraints ?? {})[0]]),
          ),
        }),
    }),
  );
  app.enableCors({ origin: 'http://localhost:3001' });

  await app.listen(process.env.PORT ?? 4000);
}
bootstrap();