import { OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit, WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { Server, Socket } from 'socket.io'
import { StatusService } from "./status.service";
import { UsersService } from "src/users/users.service";
import { User } from "@prisma/client";

@WebSocketGateway({ cors: { origin: true, credentials: true }, namespace: 'status'})
export class StatusGateway implements OnGatewayInit, OnGatewayDisconnect, OnGatewayConnection {
    constructor(private statusService: StatusService, private userService: UsersService) {}

    @WebSocketServer()
    server: Server;

    afterInit(server: Server) {}

    async handleConnection(client: Socket) {
        const userId: number = parseInt(this.statusService.strFix(client.handshake.query.userId));
        const status: string = this.statusService.strFix(client.handshake.query.status);
        if (!userId || !status) {
            client.disconnect();
            return;
        }
        const user: User = await this.userService.findUserbyID(userId);
        if (!user) {
            client.disconnect();
            return;
        }
        await this.statusService.addUserOnline(user.id, status);
        this.server.emit('usersOnline', this.statusService.getUsersOnline());
    }

    async handleDisconnect(client: Socket) {
        const user: User = await this.userService.findUserbyID(parseInt(this.statusService.strFix(client.handshake.query.userId)));
        const status: string = this.statusService.strFix(client.handshake.query.status);
        if (!user || !status) {
            return;
        }
        await this.statusService.removeUserOnline(user.id, status);
        this.server.emit('usersOnline', this.statusService.getUsersOnline());
    }
}