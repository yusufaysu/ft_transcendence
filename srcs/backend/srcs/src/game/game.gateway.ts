import { OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit, SubscribeMessage, WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { GameService } from "./game.service";
import { RemoteSocket, Server, Socket } from "socket.io";
import { Inject, forwardRef } from "@nestjs/common";
import { Game, User } from "@prisma/client";
import { UsersService } from "src/users/users.service";
import { DefaultEventsMap } from "socket.io/dist/typed-events";

@WebSocketGateway({ cors: { origin: true, credentials: true }, namespace: 'game'})
export class GameGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
    constructor(@Inject(forwardRef(() => GameService)) private gameService: GameService, private userService: UsersService) {}

    @WebSocketServer()
    server: Server;

    afterInit(server: Server) {}

    async handleConnection(client: Socket) {

        const user: User = await this.userService.findUserbyID(parseInt(this.gameService.strFix(client.handshake.query.userId)));
        const game: Game = await this.gameService.findGameByID(this.gameService.strFix(client.handshake.query.gameId));

        if ((!game || !user)) {
            client.disconnect();
            return;
        }
        client.join(game.id);
        this.gameService.continueGame(game.id, user.id);
        await this.gameService.sendInitialData(client, game.id);
    }

    async handleDisconnect(client: Socket) {
        
        const game: Game = await this.gameService.findGameByID(this.gameService.strFix(client.handshake.query.gameId));

        const socketsInGame: RemoteSocket<DefaultEventsMap, any>[] = await this.server.in(game.id).fetchSockets();
        if (socketsInGame.length == 0) {
            await this.gameService.deleteGame(game.id);
        }
        else {
            let playerOneInGame: boolean = false;
            let playerTwoInGame: boolean = false;
            socketsInGame.forEach((socket) => {
                if (parseInt(this.gameService.strFix(socket.handshake.query.userId)) == game.playerOneId) {
                    playerOneInGame = true;
                }
                else if (parseInt(this.gameService.strFix(socket.handshake.query.userId)) == game.playerTwoId) {
                    playerTwoInGame = true;
                }
            });
            if (playerOneInGame && !playerTwoInGame) {
                this.gameService.pauseGame(game.id, game.playerTwoId);
            }
            else if (!playerOneInGame && playerTwoInGame) {
                this.gameService.pauseGame(game.id, game.playerOneId);
            }
        }
    }
    
    @SubscribeMessage('ready')
    async handleReady(client: Socket) {
        const userId: number = parseInt(this.gameService.strFix(client.handshake.query.userId));
        const gameId: string = this.gameService.strFix(client.handshake.query.gameId);
        await this.gameService.playerReady(userId, gameId);
    }

    @SubscribeMessage('playerOneMove')
    async handlePlayerOneMoveMouse(client: Socket, newY: number) {
        const gameId: string = this.gameService.strFix(client.handshake.query.gameId);
        this.gameService.playerOneMove(gameId, newY);
    }

    @SubscribeMessage('playerTwoMove')
    async handlePlayerTwoMoveMouse(client: Socket, newY: number) {
        const gameId: string = this.gameService.strFix(client.handshake.query.gameId);
        this.gameService.playerTwoMove(gameId, newY);
    }
}