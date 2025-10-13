import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AppModule } from './app/app.module';
import { CorsConfigService } from './config/cors.config';
import { env } from './config/env.config';
import { HttpExceptionFilter, TransformInterceptor } from './common';
import { setupSwagger } from './config/swagger.config';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, {
    logger: ['log', 'error', 'warn', 'debug', 'verbose'],
  });
  setupSwagger(app);

  const corsService = app.get(CorsConfigService);
  app.enableCors(corsService.getCorsOptions());
  app.setGlobalPrefix(env.config.GLOBAL_PREFIX);
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new TransformInterceptor());
  app.useGlobalInterceptors(new LoggingInterceptor());

  await app.listen(env.config.PORT);

  const logger = new Logger('Bootstrap');
  logger.log(`Application is running on: http://localhost:${env.config.PORT}`);
}
bootstrap();
