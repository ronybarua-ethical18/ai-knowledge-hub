import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { CorsConfigService } from './config/cors.config';
import { env } from './config/env.config';
import { HttpExceptionFilter, TransformInterceptor } from './common';
import { setupSwagger } from './config/swagger.config';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  setupSwagger(app);

  const corsService = app.get(CorsConfigService);
  app.enableCors(corsService.getCorsOptions());
  app.setGlobalPrefix(env.config.GLOBAL_PREFIX);
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new TransformInterceptor());

  await app.listen(env.config.PORT);
}
bootstrap();
