import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: ['http://localhost:3000'],
  });

  const port = Number(process.env.PORT) || 3001;
  await app.listen(port);

  console.log(`API is running on http://localhost:${port}`);
}
bootstrap();
