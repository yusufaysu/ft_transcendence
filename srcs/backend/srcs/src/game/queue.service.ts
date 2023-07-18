import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Game, User } from '@prisma/client';
import { RemoteSocket, Server } from 'socket.io';
import { DefaultEventsMap } from 'socket.io/dist/typed-events';
import { GameService } from './game.service';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class QueueService {
    constructor(private gameService: GameService, private configService: ConfigService, private userService: UsersService) {}

    private queueList: Set<number> = new Set([]);

    async addToQueue(userId: number, server: Server) {
        this.queueList.add(userId);

        if (this.queueList.size >= 2) {
            const [playerOne, playerTwo] = this.queueList;
            const game: Game = await this.gameService.createGame(playerOne, playerTwo);

            const playerOneUser: User = await this.userService.findUserbyID(playerOne);
            const playerTwoUser: User = await this.userService.findUserbyID(playerTwo);
            playerOneUser.currentGameId = game.id;
            playerTwoUser.currentGameId = game.id;
            await this.userService.update(playerOneUser);
            await this.userService.update(playerTwoUser);
            
            this.gameService.setCountDown(game.id);

            const playerOneClients = await this.userIdtoClients(playerOne, server);
            const playerTwoClients = await this.userIdtoClients(playerTwo, server);
            this.removeFromQueue(playerOne);
            this.removeFromQueue(playerTwo);

            playerOneClients.forEach((socket) => {
                socket.emit('matchFound', `${this.configService.get<string>('REACT_APP_HOMEPAGE')}/game/${game.id}`); // frontendde o linke redirect olmaları lazım
            });

            playerTwoClients.forEach((socket) => {
                socket.emit('matchFound', `${this.configService.get<string>('REACT_APP_HOMEPAGE')}/game/${game.id}`); // frontendde o linke redirect olmaları lazım
            });

        }
    }

    removeFromQueue(userId: number) {
        this.queueList.delete(userId);
    }

    strFix(str: string | string[]): string {
        if (Array.isArray(str)) {
            return null;
        }
        else {
            return str;
        }
    }

    async userIdtoClients(userId: number, server: Server): Promise<RemoteSocket<DefaultEventsMap, any>[]> {
        const socketsInQueue: RemoteSocket<DefaultEventsMap, any>[] = await server.fetchSockets();
        const clientsOfUser: RemoteSocket<DefaultEventsMap, any>[] = socketsInQueue.filter((obj) => parseInt(this.strFix(obj.handshake.query.userId)) == userId);
        return clientsOfUser;
    }

}