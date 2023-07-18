import { SubscribeMessage, WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { DirectService } from "./direct.service";
import { UsersService } from "src/users/users.service";
import { Game } from "@prisma/client";
import { GameService } from "src/game/game.service";
import { ConfigService } from "@nestjs/config";

@WebSocketGateway({cors: { origin: true, credentials: true }, namespace: "directChat"})
export class DirectGateway {

    constructor(private directService: DirectService, private usersService: UsersService, private gameService: GameService, private configService: ConfigService){}

    @WebSocketServer()
    server: Server

    async handleConnection(client: Socket){

        const senderId = parseInt(this.directService.strFix(client.handshake.query.senderId))
        const receiverId = parseInt(this.directService.strFix(client.handshake.query.receiverId))
        const uniqueIdentifier = this.directService.createUniqueIdentifier(senderId, receiverId)
        
        client.join(uniqueIdentifier)
        this.server.to(uniqueIdentifier).emit("allMessages", await this.directService.getAllMessages(uniqueIdentifier))
        this.server.to(uniqueIdentifier).emit("blockedUserIdsInRoom", await this.directService.getBlockedUserIdsInRoom(senderId, receiverId))
        this.server.to(uniqueIdentifier).emit("receiverStatus", await this.directService.getReceiverStatus(receiverId, uniqueIdentifier, this.server))
    }

    async handleDisconnect(client: Socket) {

        const senderId = parseInt(this.directService.strFix(client.handshake.query.senderId))
        const receiverId = parseInt(this.directService.strFix(client.handshake.query.receiverId))
        const uniqueIdentifier = this.directService.createUniqueIdentifier(senderId, receiverId)
        
        this.server.to(uniqueIdentifier).emit("receiverStatus", await this.directService.getReceiverStatus(senderId, uniqueIdentifier, this.server))
    }

    @SubscribeMessage("sendDirectMessage")
    async handleSendDirectMessage(client: Socket, data: string){
        
        const senderId = parseInt(this.directService.strFix(client.handshake.query.senderId))
        const receiverId = parseInt(this.directService.strFix(client.handshake.query.receiverId))
        const uniqueIdentifier = this.directService.createUniqueIdentifier(senderId, receiverId)

        if (await this.directService.createNewDirectMessage(senderId, uniqueIdentifier, data))
            this.server.to(uniqueIdentifier).emit("allMessages", await this.directService.getAllMessages(uniqueIdentifier))
    }

    @SubscribeMessage("blockUser")
    async handleBlockUser(client: Socket){

        const userId = parseInt(this.directService.strFix(client.handshake.query.senderId))
        const blockedUserId = parseInt(this.directService.strFix(client.handshake.query.receiverId))
        const uniqueIdentifier = this.directService.createUniqueIdentifier(userId, blockedUserId)

        if (await this.usersService.blockUser(userId, blockedUserId))
            this.server.to(uniqueIdentifier).emit("blockedUserIdsInRoom", await this.directService.getBlockedUserIdsInRoom(userId, blockedUserId))
    }

    @SubscribeMessage("unBlockUser")
    async handleUnBlockUser(client: Socket){

        const userId = parseInt(this.directService.strFix(client.handshake.query.senderId))
        const blockedUserId = parseInt(this.directService.strFix(client.handshake.query.receiverId))
        const uniqueIdentifier = this.directService.createUniqueIdentifier(userId, blockedUserId)

        if (await this.usersService.unBlockUser(userId, blockedUserId))
            this.server.to(uniqueIdentifier).emit("blockedUserIdsInRoom", await this.directService.getBlockedUserIdsInRoom(userId, blockedUserId))
    }

    @SubscribeMessage('gameInvite')
    async handlegameInvite(client: Socket) {

        const senderId = parseInt(this.directService.strFix(client.handshake.query.senderId))
        const receiverId = parseInt(this.directService.strFix(client.handshake.query.receiverId))
        const uniqueIdentifier = this.directService.createUniqueIdentifier(senderId, receiverId)

        this.server.to(uniqueIdentifier).emit("incomingGameInvite", receiverId)
    }

    @SubscribeMessage('gameInviteAccept')
    async handlegameInviteAccept(client: Socket) {

        const senderUser = await this.usersService.findUserbyID(parseInt(this.directService.strFix(client.handshake.query.senderId)))
        const receiverUser = await this.usersService.findUserbyID(parseInt(this.directService.strFix(client.handshake.query.receiverId)))
        const uniqueIdentifier = this.directService.createUniqueIdentifier(senderUser.id, receiverUser.id)

        const game: Game = await this.gameService.createGame(senderUser.id, receiverUser.id);
        if (!game) {
            this.server.to(uniqueIdentifier).emit("incomingGameInvite", null) // frontende game istegini 'kabul et' tıklayınca animasyonu kapatma istegi yollar
            return;
        }

        senderUser.currentGameId = game.id;
        receiverUser.currentGameId = game.id;
        await this.usersService.update(senderUser);
        await this.usersService.update(receiverUser);
        this.gameService.setCountDown(game.id);

        this.server.to(uniqueIdentifier).emit("gameBegin", `${this.configService.get<string>('REACT_APP_HOMEPAGE')}/game/${game.id}`)
    }

    @SubscribeMessage('gameInviteReject')
    async handlegameInviteReject(client: Socket) {
        
        const senderId = parseInt(this.directService.strFix(client.handshake.query.senderId))
        const receiverId = parseInt(this.directService.strFix(client.handshake.query.receiverId))
        const uniqueIdentifier = this.directService.createUniqueIdentifier(senderId, receiverId)

        this.server.to(uniqueIdentifier).emit("incomingGameInvite", null)
    }
}