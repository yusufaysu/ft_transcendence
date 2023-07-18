import { Module } from '@nestjs/common';
import { StatusGateway } from './status.gateway';
import { StatusService } from './status.service';
import { UsersModule } from 'src/users/users.module';
import { UsersService } from 'src/users/users.service';

@Module({
    imports: [UsersModule],
    providers: [StatusGateway, StatusService, UsersService]
})
export class StatusModule {}