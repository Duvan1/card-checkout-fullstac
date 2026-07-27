import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import helmet from 'helmet';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(
    helmet({
      contentSecurityPolicy: false,
    }),
  );

  app.use('/', (req, res, next) => {
    if (req.method === 'GET' && req.path === '/') {
      return res.status(200).json({ status: 'ok', service: 'card-checkout-backend' });
    }
    next();
  });

  app.setGlobalPrefix('api');

  const config = new DocumentBuilder()
    .setTitle('Card Checkout API')
    .setDescription('API de checkout con pasarela de pagos')
    .setVersion('1.0')
    .build();
    
  const document = SwaggerModule.createDocument(app, config);
  
  SwaggerModule.setup('docs', app, document);

  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  app.enableCors({
    origin: frontendUrl,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();