import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { json } from 'express';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { MatchMonitorService } from './match-monitor/match-monitor.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 3000);

  app.setGlobalPrefix('api');
  app.use(
    json({
      verify: (req, _res, buffer) => {
        (req as { rawBody?: Buffer }).rawBody = Buffer.from(buffer);
      },
    }),
  );
  app.enableCors({
    origin: true,
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());

  app.get(MatchMonitorService).attach(app.getHttpServer());

  await app.listen(port, '0.0.0.0');
}

void bootstrap();
