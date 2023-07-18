import { Controller, Get, Param, Session, UseGuards } from "@nestjs/common";
import { AuthenticatedGuard } from "src/auth/guards/authenticated.guard";
import { GameService } from "./game.service";

@Controller('game')
export class GameController{
    constructor(private gameService: GameService) {}

    @Get('join/:gameID')
    @UseGuards(AuthenticatedGuard)
    async joinGame(@Param('gameID') gameId: string, @Session() session: Record<string, any>) {
        return (await this.gameService.joinGame(session.passport.user.id, gameId));
    }

    @Get('players/:gameID')
    @UseGuards(AuthenticatedGuard)
    async whichPlayer(@Param('gameID') gameId: string) {
        return (await this.gameService.getPlayers(gameId));
    }

    @Get('createTime/:gameID')
    @UseGuards(AuthenticatedGuard)
    async createTime(@Param('gameID') gameId: string) {
        return (await this.gameService.createTime(gameId));
    }
}