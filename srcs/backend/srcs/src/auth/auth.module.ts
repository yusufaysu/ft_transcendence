import { Module } from "@nestjs/common";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { PassportModule } from "@nestjs/passport";
import { FtStrategy } from "./strategies/ft.strategy";
import { SessionSerializer } from "./serializers/session.serializer";
import { UsersModule } from "src/users/users.module";

@Module({
    imports: [UsersModule, PassportModule.register({
        session: true
    })],
    controllers: [AuthController],
    providers: [AuthService, FtStrategy, SessionSerializer],
})
export class AuthModule {}