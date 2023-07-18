import { Module } from "@nestjs/common";
import { GameController } from "./game.controller";
import { GameService } from './game.service';
import { GameGateway } from "./game.gateway";
import { QueueGateway } from "./queue.gateway";
import { QueueService } from "./queue.service";
import { UsersModule } from "src/users/users.module";

@Module({
    imports: [UsersModule],
    controllers: [GameController],
    providers: [GameGateway, GameService, QueueGateway, QueueService],
    exports: [GameService]
})
export class GameModule {}