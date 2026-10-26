import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module.js';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  app.enableCors({
    origin: true,
    credentials: true,
  });

  // 托管前端静态文件 (dist/public/)
  const publicDir = path.join(__dirname, 'public');
  app.useStaticAssets(publicDir);

  const port = process.env.PORT ?? 6227;
  const appUrl = process.env.APP_URL || `http://localhost:${port}`;

  await app.listen(port);
  console.log(`MCAP Server running on ${appUrl}`);
}
await bootstrap();
