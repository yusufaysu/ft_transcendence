import { Controller, Get } from '@nestjs/common';

@Controller('/')
export class AppController {

  @Get()
  running(): string {
    return ("ft_transcendence backend running...");
  }
}