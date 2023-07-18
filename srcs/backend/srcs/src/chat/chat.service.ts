import { BadRequestException, Inject, Injectable, forwardRef } from '@nestjs/common';
import { BanObject, Chatroom, Message, MuteObject, Prisma, PrivateChatRequest, RoomStatus, User } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import * as bcrypt from 'bcrypt'
import { UsersService } from 'src/users/users.service';
import { RemoteSocket, Server } from 'socket.io';
import { DefaultEventsMap } from 'socket.io/dist/typed-events';
import { ChatGateway } from './chat.gateway';

@Injectable()
export class ChatService {
    constructor (private prismaService: PrismaService, private userService: UsersService, @Inject(forwardRef(() => ChatGateway)) private chatGateway: ChatGateway) {}

    async getAllRooms(): Promise<Array<Chatroom>> {
        return (await this.prismaService.chatroom.findMany())
    }

    async getMyChatRooms(chatRoomIds: Array<string>): Promise<Array<Chatroom>> {
        let chatRooms: Array<Chatroom> = []
        for (const roomId of chatRoomIds)
            chatRooms.push(await this.findChatRoombyID(roomId))
        return (chatRooms)
    }

    async findChatRoombyID(chatRoomId: string): Promise<Chatroom> {
        return this.prismaService.chatroom.findUnique({
            where: {
                id: chatRoomId
            }
        })
    }

    async update(newChatRoomInfo: Partial<Chatroom>): Promise<boolean> { // newChatRoomInfo içinde kesinlikle id olmalı
        try{
            await this.prismaService.chatroom.update({
                where: {
                    id: newChatRoomInfo.id
                },
                data: newChatRoomInfo
            })
        }
        catch (error) {
            return false
        }
        return true
    }

    async createRoom(userId: number, roomName: string, roomStatus: RoomStatus, password?: string): Promise<Chatroom> {
        
        if (roomStatus === RoomStatus.PROTECTED && password === null)   // Bu Kontrol frontende yapıldı
            throw new BadRequestException('Password needed.');
        
        const chatRoom = await this.prismaService.chatroom.create({
            data: {
                name: roomName,
                ownerId: userId,
                roomStatus: roomStatus
            }
        });

        if (roomStatus == RoomStatus.PROTECTED) {
            const hashedPassword = await this.hashPassword(password);
            chatRoom.password = hashedPassword;
            await this.update(chatRoom);
        }

        const user: User = await this.userService.findUserbyID(userId);
        user.chatRoomIds.push(chatRoom.id);
        await this.userService.update(user);

        return (chatRoom);
    }

    async joinRoom(userId: number, roomId: string, password?: string, privateRoom: boolean = false): Promise<Chatroom> {

        const chatRoom: Chatroom = await this.findChatRoombyID(roomId);

        if (chatRoom.roomStatus === RoomStatus.PRIVATE && !privateRoom)
            throw new BadRequestException('Private odaya katılamazsın');

        if (chatRoom.roomStatus === RoomStatus.PROTECTED) {
            
            if (password === null || password === undefined)  // Bu Kontrol frontende yapıldı
                throw new BadRequestException('Şifre gerekli.');
            
            const isPassCorrect: boolean = await this.comparePassword(password, chatRoom.password);
            if (!isPassCorrect)
                throw new BadRequestException('Yanlış parola !');
        }

        if ((await this.getBannedUserIdsInRoom(chatRoom.id)).includes(userId))
            throw new BadRequestException('Sen bu kanaldan banlandın !');

        const user: User = await this.userService.findUserbyID(userId);
        if (!user.chatRoomIds.includes(roomId)) {   // Bu Kontrol frontende yapıldı
            user.chatRoomIds.push(roomId);
            chatRoom.userCount++;
            await this.userService.update(user);
            await this.update(chatRoom);
        }

        this.chatGateway.server.to(chatRoom.id).emit('allUsersInRoom', await this.getAllUsersInRoom(chatRoom.id));        
        return (chatRoom);
    }

    async updateRoom(ownerId: number, chatRoomId: string, newRoomName: string, newRoomStatus: RoomStatus, newPassword?: string): Promise<boolean>{

        const chatRoom: Chatroom = await this.findChatRoombyID(chatRoomId)

        if (newRoomStatus === "PROTECTED" && newPassword === null)   // Bu Kontrol frontende yapıldı
            throw new BadRequestException('Password needed.');
        else if (chatRoom.ownerId !== ownerId)
            throw new BadRequestException('You not owner this channel.');

        chatRoom.name = newRoomName
        chatRoom.roomStatus = newRoomStatus
        chatRoom.password = null

        if (newRoomStatus === "PROTECTED"){
            const hashedPassword = await this.hashPassword(newPassword);
            chatRoom.password = hashedPassword;
        }
        await this.update(chatRoom)
        return (true)
    }

    async hashPassword(password: string): Promise<string> {
        const salt: string = await bcrypt.genSalt();
        const hash: string = await bcrypt.hash(password, salt);
        return (hash);
    }

    comparePassword(password: string, hash: string): boolean {
        return (bcrypt.compare(password, hash));
    }

    strFix(str: string | string[]): string {
        return (Array.isArray(str) ? null : str)
    }

    async getAllMessages(chatRoomId: string): Promise<Array<Message>>{
        return await this.prismaService.message.findMany({
            where: {
                chatroomId: chatRoomId
            }
        });
    }

    async createNewMessage(user: User, chatRoomId: string, message: string): Promise<Message> {

        const msg: Message = await this.prismaService.message.create({
            data: {
                userId: user.id,
                userDisplayname: user.displayname,
                data: message,
                chatroom: { connect: { id: chatRoomId } }
            }
        });
        await this.databaseDeleteOldMessages(chatRoomId);
        return (msg);
    }

    async createNewMute(userId: number, expireDate: number, chatRoomId: string): Promise<MuteObject> {
        return this.prismaService.muteObject.create({
            data: {
                userId: userId,
                expireDate: expireDate,
                chatroom: { connect: { id: chatRoomId } }
            }
        });
    }

    async createNewBan(bannedUserId: number, chatRoom: Chatroom): Promise<BanObject> {

        const bannedUser: User = await this.userService.findUserbyID(bannedUserId)

        if (chatRoom.adminIds.includes(bannedUserId)) // Tekmelenen kişi eğer adminse
            chatRoom.adminIds.splice(chatRoom.adminIds.indexOf(bannedUserId), 1) // Adminliğinden çıkart

        bannedUser.chatRoomIds.splice(bannedUser.chatRoomIds.indexOf(chatRoom.id), 1);
        chatRoom.userCount--
        
        await this.update(chatRoom)
        await this.userService.update(bannedUser);
        
        return this.prismaService.banObject.create({
            data: {
                userId: bannedUser.id,
                userDisplayname: bannedUser.displayname,
                userNickname: bannedUser.nickname,
                chatroom: { connect: { id: chatRoom.id } }
            }
        });
    }

    async databaseDeleteOldMessages(chatRoomId: string) {
        const messages: Array<Message> = await this.getAllMessages(chatRoomId)
        while (messages.length > 30) {
            const delMsgId = messages[0].id;
            await this.prismaService.message.delete({
                where: {
                    id: delMsgId
                }
            });
            messages.splice(0, 1);
        }
    }

    async getOnlineUserIdsInRoom(chatRoomId: string, server: Server): Promise<Array<number>> {
        const clientsInRoom: RemoteSocket<DefaultEventsMap, any>[] = await server.in(chatRoomId).fetchSockets();
        const userIdsInRoom: Array<number> = clientsInRoom.map((obj) => parseInt(this.strFix(obj.handshake.query.userId)));
        const uniqueUserIdsInRoom: Array<number> = [...new Set(userIdsInRoom)];
        return (uniqueUserIdsInRoom);
    }

    async getAllUserIdsInRoom(chatRoomId: string): Promise<Array<number>>{ // Bu daha optimize şekilde yazılabilir
        const usersInfo = await this.getAllUsersInRoom(chatRoomId)
        let userIds: Array<number> = []
        for (const user of usersInfo)
            userIds.push(user.id)
        return (userIds)
    }

    async getAllUsersInRoom(chatRoomId: string): Promise<Array<User>> {
        return await this.prismaService.user.findMany({
            where: {
                chatRoomIds: {
                    has: chatRoomId
                }
            }
        });
    }

    async getMutedUserIdsInRoom(chatRoomId: string): Promise<Array<number>> {
        await this.updateMutes(chatRoomId);
        const muteObjects: Array<MuteObject> = await this.getMutedUsersInRoom(chatRoomId)
        const mutedUsers: Array<number> = muteObjects.map((obj) => {
            return obj.userId;
        });
        return (mutedUsers);
    }

    async userIdtoClients(userId: number, chatRoomId: string, server: Server): Promise<RemoteSocket<DefaultEventsMap, any>[]> {
        const socketsInRoom: RemoteSocket<DefaultEventsMap, any>[] = await server.in(chatRoomId).fetchSockets();
        const clientsOfUser: RemoteSocket<DefaultEventsMap, any>[] = socketsInRoom.filter((obj) => parseInt(this.strFix(obj.handshake.query.userId)) == userId);
        return (clientsOfUser);
    }

    async getMutedUsersInRoom(roomId: string): Promise<Array<MuteObject>> {
        return await this.prismaService.muteObject.findMany({
            where: {
                chatroomId: roomId
            }
        });
    }

    async updateMutes(roomId: string): Promise<void> {
        const muteObjects: Array<MuteObject> = await this.getMutedUsersInRoom(roomId)
        for (const obj of muteObjects) {
            if (obj.expireDate <= Date.now()) {
                await this.prismaService.muteObject.delete({
                    where: {
                        id: obj.id
                    }
                });
            }
        }
    }

    async getBannedUsersInRoom(roomId: string): Promise<Array<BanObject>> {
        return await this.prismaService.banObject.findMany({
            where: {
                chatroomId: roomId
            }
        });
    }

    async getBannedUserIdsInRoom(roomId: string): Promise<Array<number>> {
        const banObjects: Array<BanObject> = await this.getBannedUsersInRoom(roomId)
        const bannedUsers: Array<number> = banObjects.map((obj) => {
            return obj.userId;
        });
        return (bannedUsers);
    }

    async leaveRoom(user: User, chatRoom: Chatroom): Promise<boolean> { // Hata Yok
        
        if (chatRoom.ownerId === user.id) {
            
            let newOwner = chatRoom.adminIds[0];

            if (newOwner === undefined) { // Eğer grupta hiç admin yoksa
                const usersIds: Array<number> = await this.getAllUserIdsInRoom(chatRoom.id)
                usersIds.forEach((id) => {
                    if (id != user.id) {
                        newOwner = id; // Yeni owner normal üyelerden biri olsun
                        return;
                    }
                });
            }

            if (newOwner === undefined) { // Yine owner yoksa grubu sil
                user.chatRoomIds.splice(user.chatRoomIds.indexOf(chatRoom.id), 1);
                await this.userService.update(user);
                await this.deleteChatRoom(chatRoom);
                return (false);
            }
            else
                chatRoom.ownerId = newOwner;

            if (chatRoom.adminIds.includes(newOwner))
                chatRoom.adminIds.splice(chatRoom.adminIds.indexOf(newOwner), 1);
        }

        if (chatRoom.adminIds.includes(user.id))
            chatRoom.adminIds.splice(chatRoom.adminIds.indexOf(user.id), 1);
        
        user.chatRoomIds.splice(user.chatRoomIds.indexOf(chatRoom.id), 1);
        chatRoom.userCount--;
        await this.update(chatRoom);
        await this.userService.update(user);
        return (true);
    }

    async deleteChatRoom(chatRoom: Chatroom) {      // Hata Yok
        await this.prismaService.message.deleteMany({
            where: {
                chatroomId: chatRoom.id
            }
        });
        await this.prismaService.banObject.deleteMany({
            where: {
                chatroomId: chatRoom.id
            }
        });
        await this.prismaService.muteObject.deleteMany({
            where: {
                chatroomId: chatRoom.id
            }
        });
        await this.prismaService.chatroom.delete({
            where: {
                id: chatRoom.id
            }
        })
    }

    async kickUser(kickedUserId: number, chatRoom: Chatroom): Promise<boolean> {      // Hata Yok

        const kickedUser: User = await this.userService.findUserbyID(kickedUserId)

        if (chatRoom.adminIds.includes(kickedUser.id)) // Tekmelenen kişi eğer adminse
            chatRoom.adminIds.splice(chatRoom.adminIds.indexOf(kickedUser.id), 1) // Adminliğinden çıkart
        
        kickedUser.chatRoomIds.splice(kickedUser.chatRoomIds.indexOf(chatRoom.id), 1)
        chatRoom.userCount--

        await this.userService.update(kickedUser)
        await this.update(chatRoom)
        return (true)
    }

    async changeGroupOwner(chatRoom: Chatroom, oldOwnerId: number, newOwnerId: number): Promise<boolean> {      // Hata Yok
        
        chatRoom.ownerId = newOwnerId; // Yeni lideri belirle
        chatRoom.adminIds.push(oldOwnerId) // Eski liderin yetkisini adminliğe düşür
        
        if (chatRoom.adminIds.includes(newOwnerId)) // Eğer yeni lider önceden admin ise onun adminliten çıkart terfi aldı çünkü
            chatRoom.adminIds.splice(chatRoom.adminIds.indexOf(newOwnerId), 1)
        
        await this.update(chatRoom);
        return (true)
    }

    async getBlockUserIds(userId): Promise<Array<number>> {         // Hata Yok
        return ((await this.userService.findUserbyID(userId)).blockedUserIds)
    }

    async unMute(userId: number, chatRoomId: string): Promise<boolean> {        // Yanlış olabilir altuga sor
        const muteObject = await this.prismaService.muteObject.findFirst({
            where: {
                userId: userId,
                chatroomId: chatRoomId
            }
        })
        await this.prismaService.muteObject.delete({
            where: {
                id: muteObject.id
            }
        })
        return (true)
    }

    async unBan(userId: number, chatRoomId: string): Promise<boolean> {        // Yanlış olabilir altuğa sor
        const banObject = await this.prismaService.banObject.findFirst({
            where: {
                userId: userId,
                chatroomId: chatRoomId
            }
        })
        await this.prismaService.banObject.delete({
            where: {
                id: banObject.id
            }
        })
        return (true)
    }

    // Private Chat İstekleri
    async createChatRequest(senderId: number, receiverId: number, chatRoomId: string) : Promise<PrivateChatRequest> {
        
        if ((await this.getAllUserIdsInRoom(chatRoomId)).includes(receiverId))
            throw new BadRequestException("The person you invited is already in the room.");

        if (senderId == receiverId)
            throw new BadRequestException("You can't send a chat request to yourself.");

        return this.prismaService.privateChatRequest.create({
            data: {
                sender: { connect: { id: senderId } },
                senderName: (await this.userService.findUserbyID(senderId)).displayname,
                receiver: { connect: { id: receiverId } },
                chatRoomId: chatRoomId,
                chatRoomName: (await this.findChatRoombyID(chatRoomId)).name
            }
        }).catch(e => {
            if (e.code == 'P2025')
                throw new BadRequestException('There is no user with that id.');
            if (e instanceof Prisma.PrismaClientKnownRequestError) {
                throw new BadRequestException('The user already has a request from that chatroom.');
            }
            throw e;
        })
    }

    async acceptRequest(requestData: { senderId: number, receiverId: number, chatRoomId: string }): Promise<boolean> {
        const request = await this.prismaService.privateChatRequest.findUnique({
            where: {
                receiverId_chatRoomId: {
                    receiverId: requestData.receiverId,
                    chatRoomId: requestData.chatRoomId
                }
            }
        })

        if (request == null)
            throw new BadRequestException("You can't accept a request that doesn't exist.");

        await this.joinRoom(requestData.receiverId, requestData.chatRoomId, undefined, true);
        await this.prismaService.privateChatRequest.delete({
            where: {
                receiverId_chatRoomId: {
                    receiverId: requestData.receiverId,
                    chatRoomId: requestData.chatRoomId
                }
            }
        })
        return (true)
    }

    async rejectRequest(requestData: { senderId: number, receiverId: number, chatRoomId: string }): Promise<boolean> {
        const request = await this.prismaService.privateChatRequest.findUnique({
            where: {
                receiverId_chatRoomId: {
                    receiverId: requestData.receiverId,
                    chatRoomId: requestData.chatRoomId
                }
            }
        });

        if (request == null)
            throw new BadRequestException("You can't reject a request that doesn't exist.")

        await this.prismaService.privateChatRequest.delete({
            where: {
                receiverId_chatRoomId: {
                    receiverId: requestData.receiverId,
                    chatRoomId: requestData.chatRoomId
                }
            }
        })
        return (true)
    }

    async getReceivedRequests(userId: number): Promise<Array<PrivateChatRequest>> {
        const requests: Array<PrivateChatRequest> = await this.prismaService.privateChatRequest.findMany({
            where: {
                receiverId: userId
            }
        });
        return (requests);
    }
}
