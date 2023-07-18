import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { PrismaSessionStore } from '@quixo3/prisma-session-store';
import  { PrismaClient } from '@prisma/client';
import * as session from 'express-session';
import * as passport from 'passport';
import * as cookieParser from 'cookie-parser';

var hour = 3600000;

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(cookieParser());
  app.use(session({
    name: 'NESTJS_SESSION',
    secret: 'secret-key',
    resave: false,
    saveUninitialized: false,
    store: new PrismaSessionStore(
      new PrismaClient(),
      {
        ttl: hour * 3,
        checkPeriod: 60 * 1000,  // 1dk
        dbRecordIdIsSessionId: true,
        dbRecordIdFunction: undefined,
      }
    ),
  }))

  app.use(passport.initialize());
  app.use(passport.session());

  app.enableCors({ // cors policy açık olmazsa backend istek kabul etmiyor.
    origin: true,
    credentials: true
  })

  await app.listen(3001);
}
bootstrap();