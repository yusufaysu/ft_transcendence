import { Module, OnModuleInit } from '@nestjs/common';
import { AppController } from './app.controller';
import { ConfigModule } from '@nestjs/config';
import { UsersModule } from './users/users.module';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { ChatModule } from './chat/chat.module';
import { StatusModule } from './status/status.module';
import { GameModule } from './game/game.module';
import { InitializationService } from './initialization/initialization.service';

@Module({
  
  imports: [ ConfigModule.forRoot({
    isGlobal: true
  }), 
  ServeStaticModule.forRoot({
    rootPath: join(__dirname, '..', 'public'),
    serveRoot: '/public'
  }),
  PrismaModule, AuthModule, UsersModule, ChatModule, StatusModule, GameModule],

  controllers: [AppController],
  providers: [InitializationService],

})
export class AppModule implements OnModuleInit {
  constructor (private initializationService: InitializationService) {}

  async onModuleInit() {
    await this.initializationService.initialize();
  }
}