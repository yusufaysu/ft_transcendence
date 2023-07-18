import { OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit, SubscribeMessage, WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { Server, Socket } from 'socket.io'
import { ChatService } from "./chat.service";
import { Chatroom, Game, User } from "@prisma/client";
import { UsersService } from "src/users/users.service";
import { GameService } from "src/game/game.service";
import { ConfigService } from "@nestjs/config";

const GROUP_MUTE_TIME: number = 1800000 // 30dk

@WebSocketGateway({ cors: { origin: true, credentials: true }, namespace: 'chat'})
export class ChatGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
    constructor(private chatService: ChatService, private userService: UsersService, private gameService: GameService, private configService: ConfigService) {}

    @WebSocketServer()
    server: Server;

    afterInit(server: Server) {}

    async handleConnection(client: Socket) {

        const user: User = await this.userService.findUserbyID(parseInt(this.chatService.strFix(client.handshake.query.userId)));
        const chatRoom: Chatroom = await this.chatService.findChatRoombyID(this.chatService.strFix(client.handshake.query.roomId));
        
        if (!user || !chatRoom || !user.chatRoomIds.includes(chatRoom.id)) {
            client.disconnect();
            return;
        }
        client.join(chatRoom.id);

        this.server.to(chatRoom.id).emit('onlineUserIdsInRoom', await this.chatService.getOnlineUserIdsInRoom(chatRoom.id, this.server));
        this.server.to(client.id).emit('adminUserIdsInRoom', chatRoom.adminIds);
        this.server.to(chatRoom.id).emit('mutedUserIdsInRoom', await this.chatService.getMutedUserIdsInRoom(chatRoom.id));
        this.server.to(client.id).emit('ownerIdInRoom', chatRoom.ownerId);
        this.server.to(client.id).emit('allUserIdsInRoom', await this.chatService.getAllUserIdsInRoom(chatRoom.id));
        this.server.to(client.id).emit('allUsersInRoom', await this.chatService.getAllUsersInRoom(chatRoom.id));
        this.server.to(client.id).emit('allMessages', await this.chatService.getAllMessages(chatRoom.id));
        this.server.to(client.id).emit('blockUserIds', user.blockedUserIds);
    }

    async handleDisconnect(client: Socket) {
        const chatRoomId: string = this.chatService.strFix(client.handshake.query.roomId)
        this.server.to(chatRoomId).emit('onlineUserIdsInRoom', await this.chatService.getOnlineUserIdsInRoom(chatRoomId, this.server));
    }

    @SubscribeMessage('newMessageToServer')
    async handleNewMessage(client: Socket, message: string) {

        const user: User = await this.userService.findUserbyID(parseInt(this.chatService.strFix(client.handshake.query.userId)));
        const chatRoomId: string = this.chatService.strFix(client.handshake.query.roomId)

        if ((await this.chatService.getMutedUserIdsInRoom(chatRoomId)).includes(user.id))
            throw new Error("You can't send messages right now. You are muted.");

        await this.chatService.createNewMessage(user, chatRoomId, message);
        this.server.to(chatRoomId).emit('allMessages', await this.chatService.getAllMessages(chatRoomId));
    }

    @SubscribeMessage('setAdmin')
    async handleSetAdmin(client: Socket, newAdminId: number) {
        
        const userId: number = parseInt(this.chatService.strFix(client.handshake.query.userId));
        const chatRoom: Chatroom = await this.chatService.findChatRoombyID(this.chatService.strFix(client.handshake.query.roomId));

        if (chatRoom.ownerId != userId) {
            throw new Error('You need to be channel owner to execute this command.');
        }
        else if (chatRoom.adminIds.includes(newAdminId)) {
            throw new Error('The user is already an admin of this channel.');
        }
        else if (!(await this.chatService.getAllUserIdsInRoom(chatRoom.id)).includes(newAdminId)) {
            throw new Error('The user needs to be in channel to be promoted as an admin.');
        }

        chatRoom.adminIds.push(newAdminId);
        await this.chatService.update(chatRoom);
        this.server.to(chatRoom.id).emit('adminUserIdsInRoom', chatRoom.adminIds);
    }

    @SubscribeMessage('unsetAdmin')
    async handleUnsetAdmin(client: Socket, adminId: number) {
        
        const userId: number = parseInt(this.chatService.strFix(client.handshake.query.userId));
        const chatRoom: Chatroom = await this.chatService.findChatRoombyID(this.chatService.strFix(client.handshake.query.roomId));

        if (chatRoom.ownerId != userId) {
            throw new Error('You need to be channel owner to execute this command.');
        }
        else if (!chatRoom.adminIds.includes(adminId)) {
            throw new Error('The user is not an admin.');
        }
         else if (!(await this.chatService.getAllUserIdsInRoom(chatRoom.id)).includes(adminId)) {
            throw new Error('The user needs to be in channel to be promoted as an admin.');
        }

        chatRoom.adminIds.splice(chatRoom.adminIds.indexOf(adminId), 1);
        await this.chatService.update(chatRoom);
        this.server.to(chatRoom.id).emit('adminUserIdsInRoom', chatRoom.adminIds);
    }

    @SubscribeMessage('kickUser')
    async handleKickUser(client: Socket, kickedUserId: number) {       // Hata yok

        const userId: number = parseInt(this.chatService.strFix(client.handshake.query.userId));
        const chatRoom: Chatroom = await this.chatService.findChatRoombyID(this.chatService.strFix(client.handshake.query.roomId));

        if (!chatRoom.adminIds.includes(userId) && userId != chatRoom.ownerId) {
            throw new Error('You need to be owner/admin to execute this command.');
        }
        else if (chatRoom.adminIds.includes(kickedUserId) && userId != chatRoom.ownerId) {
            throw new Error("You can't kick the channel owner or an admin.");
        }
        else if (!(await this.chatService.getAllUserIdsInRoom(chatRoom.id)).includes(kickedUserId)) {
            throw new Error('The user needs to be in channel to be kicked.');
        }

        if (await this.chatService.kickUser(kickedUserId, chatRoom)){
            this.server.to(chatRoom.id).emit('allUserIdsInRoom', await this.chatService.getAllUserIdsInRoom(chatRoom.id));
            this.server.to(chatRoom.id).emit('allUsersInRoom', await this.chatService.getAllUsersInRoom(chatRoom.id));
            this.server.to(chatRoom.id).emit('adminUserIdsInRoom', chatRoom.adminIds);
        }

        const clientsOfUser = await this.chatService.userIdtoClients(kickedUserId, chatRoom.id, this.server);
        clientsOfUser.forEach((client) => client.disconnect());
    }

    @SubscribeMessage('muteUser')
    async handleMuteUser(client: Socket, mutedUserId: number) {

        const userId: number = parseInt(this.chatService.strFix(client.handshake.query.userId));
        const chatRoom: Chatroom = await this.chatService.findChatRoombyID(this.chatService.strFix(client.handshake.query.roomId));

        if (!chatRoom.adminIds.includes(userId) && userId != chatRoom.ownerId) {
            throw new Error('You need to be admin to execute this command.');
        }
        else if (chatRoom.adminIds.includes(mutedUserId) && userId != chatRoom.ownerId) {
            throw new Error("You can't mute the channel owner or an admin.");
        }
        else if (!(await this.chatService.getAllUserIdsInRoom(chatRoom.id)).includes(mutedUserId)) {
            throw new Error('The user needs to be in channel to be muted.');
        }

        await this.chatService.createNewMute(mutedUserId, Date.now() + GROUP_MUTE_TIME, chatRoom.id);
        this.server.to(chatRoom.id).emit('mutedUserIdsInRoom', await this.chatService.getMutedUserIdsInRoom(chatRoom.id));
    }

    @SubscribeMessage('unMuteUser')
    async handleUnMuteUser(client: Socket, mutedUserId: number) {       // Altuğnun kontrolleri eksik

        const userId: number = parseInt(this.chatService.strFix(client.handshake.query.userId));
        const chatRoomId: string = this.chatService.strFix(client.handshake.query.roomId)

        if (await this.chatService.unMute(mutedUserId, chatRoomId))
            this.server.to(chatRoomId).emit('mutedUserIdsInRoom', await this.chatService.getMutedUserIdsInRoom(chatRoomId));
    }

    @SubscribeMessage('banUser')
    async handleBanUser(client: Socket, bannedUserId: number) {

        const userId: number = parseInt(this.chatService.strFix(client.handshake.query.userId));
        const chatRoom: Chatroom = await this.chatService.findChatRoombyID(this.chatService.strFix(client.handshake.query.roomId));

        if (!chatRoom.adminIds.includes(userId) && userId != chatRoom.ownerId) {
            throw new Error('You need to be admin to execute this command.');
        }
        else if (chatRoom.adminIds.includes(bannedUserId) && userId != chatRoom.ownerId) {
            throw new Error("You can't ban the channel owner or an admin.");
        }
        else if (!(await this.chatService.getAllUserIdsInRoom(chatRoom.id)).includes(bannedUserId)) {
            throw new Error('The user needs to be in channel to be banned.');
        }

        if (await this.chatService.createNewBan(bannedUserId, chatRoom)){
            this.server.to(chatRoom.id).emit('allUserIdsInRoom', await this.chatService.getAllUserIdsInRoom(chatRoom.id));
            this.server.to(chatRoom.id).emit('allUsersInRoom', await this.chatService.getAllUsersInRoom(chatRoom.id));
            this.server.to(chatRoom.id).emit('bannedUsersInRoom', await this.chatService.getBannedUsersInRoom(chatRoom.id));
            this.server.to(chatRoom.id).emit('adminUserIdsInRoom', chatRoom.adminIds);
        }

        const clientsOfUser = await this.chatService.userIdtoClients(bannedUserId, chatRoom.id, this.server);
        clientsOfUser.forEach((client) => client.disconnect());
    }

    @SubscribeMessage('getBannedUsersInRoom')
    async handleGetBannedUsersInRoom(client: Socket) {
        const chatRoomId: string = this.chatService.strFix(client.handshake.query.roomId)
        this.server.to(chatRoomId).emit('bannedUsersInRoom', await this.chatService.getBannedUsersInRoom(chatRoomId))
    }

    @SubscribeMessage('unBanUser')
    async handleUnBanUser(client: Socket, bannedUserId: number) {       // Altuğnun kontrolleri eksik
        
        const userId: number = parseInt(this.chatService.strFix(client.handshake.query.userId));
        const chatRoomId: string = this.chatService.strFix(client.handshake.query.roomId)

        if (await this.chatService.unBan(bannedUserId, chatRoomId))
            this.server.to(chatRoomId).emit('bannedUsersInRoom', await this.chatService.getBannedUsersInRoom(chatRoomId))
    }

    @SubscribeMessage('blockUser')
    async handleBlockUser(client: Socket, blockedUserId: number) {      // Hata Yok

        const user: User = await this.userService.findUserbyID(parseInt(this.chatService.strFix(client.handshake.query.userId)));
        const chatRoomId: string = this.chatService.strFix(client.handshake.query.roomId)

        if (!(await this.chatService.getAllUserIdsInRoom(chatRoomId)).includes(blockedUserId)) {
            throw new Error('The user needs to be in channel to be blocked.');
        }
        else if (user.blockedUserIds.includes(blockedUserId)) {
            throw new Error('The user is already blocked.');
        }
        
        if (await this.userService.blockUser(user.id, blockedUserId))
            this.server.to(client.id).emit('blockUserIds', await this.chatService.getBlockUserIds(user.id));
    }

    @SubscribeMessage('unBlockUser')
    async handleUnBlockUser(client: Socket, blockedUserId: number) {       // Altuğnun Kontrolleri eksik

        const userId: number = parseInt(this.chatService.strFix(client.handshake.query.userId));
        const chatRoomId: string = this.chatService.strFix(client.handshake.query.roomId)

        if (await this.userService.unBlockUser(userId, blockedUserId))
            this.server.to(client.id).emit('blockUserIds', await this.chatService.getBlockUserIds(userId));
    }

    @SubscribeMessage('handOverOwnership')
    async handleHandOverOwnership(client: Socket, newOwnerId: number) {     // Hata Yok

        const userId: number = parseInt(this.chatService.strFix(client.handshake.query.userId));
        const chatRoom: Chatroom = await this.chatService.findChatRoombyID(this.chatService.strFix(client.handshake.query.roomId));

        if (chatRoom.ownerId != userId) {
            throw new Error('You need to be channel owner to execute this command.');
        }
        else if (!(await this.chatService.getAllUserIdsInRoom(chatRoom.id)).includes(newOwnerId)) {
            throw new Error('The user needs to be in channel to be prometed as channel owner.');
        }

        if (await this.chatService.changeGroupOwner(chatRoom, userId, newOwnerId)){
            this.server.to(chatRoom.id).emit('ownerIdInRoom', chatRoom.ownerId);
            this.server.to(chatRoom.id).emit('adminUserIdsInRoom', chatRoom.adminIds);
        }
    }

    @SubscribeMessage('leaveRoom')
    async handleLeaveRoom(client: Socket) {     // Hata Yok
        
        const user: User = await this.userService.findUserbyID(parseInt(this.chatService.strFix(client.handshake.query.userId)));
        const chatRoom: Chatroom = await this.chatService.findChatRoombyID(this.chatService.strFix(client.handshake.query.roomId));
        
        const clientsOfUser = await this.chatService.userIdtoClients(user.id, chatRoom.id, this.server);
        clientsOfUser.forEach((client) => client.disconnect());

        if (await this.chatService.leaveRoom(user, chatRoom)) {
            const updatedChatRoom = await this.chatService.findChatRoombyID(this.chatService.strFix(client.handshake.query.roomId));
            this.server.to(chatRoom.id).emit('adminUserIdsInRoom', updatedChatRoom.adminIds);
            this.server.to(chatRoom.id).emit('ownerIdInRoom', updatedChatRoom.ownerId);
            this.server.to(chatRoom.id).emit('allUsersInRoom', await this.chatService.getAllUsersInRoom(updatedChatRoom.id));
            this.server.to(chatRoom.id).emit('allUserIdsInRoom', await this.chatService.getAllUserIdsInRoom(chatRoom.id));
        }
    }

    // Chat oyun davetiye gönderme.
    @SubscribeMessage('gameInvite')
    async handlegameInvite(client: Socket, userId: number) {
        const selfUser: User = await this.userService.findUserbyID(parseInt(this.chatService.strFix(client.handshake.query.userId)));
        const chatRoomId: string = this.chatService.strFix(client.handshake.query.roomId);
        const user: User = await this.userService.findUserbyID(userId);

        if (!user || !selfUser)
            return;

        const clientsOfUser = await this.chatService.userIdtoClients(user.id, chatRoomId, this.server);
        clientsOfUser.forEach((client) => {
            client.emit('incomingGameInvite', selfUser.id);
        });
    }

    @SubscribeMessage('gameInviteAccept')
    async handlegameInviteAccept(client: Socket, userId: number) {
        const selfUser: User = await this.userService.findUserbyID(parseInt(this.chatService.strFix(client.handshake.query.userId)));
        const chatRoomId: string = this.chatService.strFix(client.handshake.query.roomId);
        const user: User = await this.userService.findUserbyID(userId);

        if (!user || !selfUser)
            return;

        const game: Game = await this.gameService.createGame(user.id, selfUser.id);
        if (!game) {
            client.emit('incomingGameInvite', null); // frontende game istegini 'kabul et' tıklayınca animasyonu kapatma istegi yollar
            return;
        }

        user.currentGameId = game.id;
        selfUser.currentGameId = game.id;
        await this.userService.update(user);
        await this.userService.update(selfUser);
        
        this.gameService.setCountDown(game.id);

        const clientsOfUser = await this.chatService.userIdtoClients(user.id, chatRoomId, this.server);
        clientsOfUser.forEach((client) => {
            client.emit('gameBegin', `${this.configService.get<string>('REACT_APP_HOMEPAGE')}/game/${game.id}`);
        });
        client.emit('gameBegin', `${this.configService.get<string>('REACT_APP_HOMEPAGE')}/game/${game.id}`);
    }

    @SubscribeMessage('gameInviteReject')
    async handlegameInviteReject(client: Socket) {
        client.emit('incomingGameInvite', null);
    }
}