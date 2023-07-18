import { OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit, WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { QueueService } from "./queue.service";

@WebSocketGateway({ cors: { origin: true, credentials: true }, namespace: 'queue'})
export class QueueGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
    constructor(private queueService: QueueService) {}

    @WebSocketServer()
    server: Server;

    afterInit(server: Server) {}

    async handleConnection(client: Socket) {
        const userId: number = parseInt(this.queueService.strFix(client.handshake.query.userId));
        await this.queueService.addToQueue(userId, this.server);
    }

    handleDisconnect(client: Socket) {
        const userId: number = parseInt(this.queueService.strFix(client.handshake.query.userId));
        this.queueService.removeFromQueue(userId);
    }
}