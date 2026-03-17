// backend/src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));
  
  // Update CORS configuration
  app.enableCors({
    origin: ['http://localhost:3000', 'http://192.168.150.243:3000'], // Add your frontend URLs
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });
  
  app.setGlobalPrefix('api');
  
  const port = process.env.PORT || 4000;
  await app.listen(port);
  
  console.log(`Application running on: http://localhost:${port}`);
}
bootstrap();