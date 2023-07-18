import { BadRequestException, Body, Controller, Get, Param, Post, Session, UseGuards } from '@nestjs/common';
import { ChatService } from './chat.service';
import { AuthenticatedGuard } from 'src/auth/guards/authenticated.guard';
import { Chatroom, PrivateChatRequest, RoomStatus } from '@prisma/client';

@Controller('chat')
export class ChatController {
    constructor(private chatService: ChatService) {}

    @Post('room/create')
    @UseGuards(AuthenticatedGuard)
    async createRoom(@Body() body: { roomName: string, roomStatus: RoomStatus, password?: string }, @Session() session: Record<string, any>) {
        return (await this.chatService.createRoom(session.passport.user.id, body.roomName, body.roomStatus, body.password));
    }

    @Post('room/join')
    @UseGuards(AuthenticatedGuard)
    async joinRoom(@Body() body: { roomId: string, password?: string }, @Session() session: Record<string, any>) {
        return (await this.chatService.joinRoom(session.passport.user.id, body.roomId, body.password));
    }

    @Post('room/update')
    @UseGuards(AuthenticatedGuard)
    async updateRoom(@Body() body: { roomId: string, roomName: string, roomStatus: RoomStatus, password?: string }, @Session() session: Record<string, any>) {
        return (await this.chatService.updateRoom(session.passport.user.id, body.roomId, body.roomName, body.roomStatus, body.password));
    }

    @Get('room/find/:id')
    @UseGuards(AuthenticatedGuard)
    async getRoom(@Param('id') roomId: string){
        return (await this.chatService.findChatRoombyID(roomId))
    }

    @Get('room/all')
    @UseGuards(AuthenticatedGuard)
    async getAllRooms(): Promise<Array<Chatroom>> {
        return (await this.chatService.getAllRooms())
    }

    @Get('room/mychatrooms')
    @UseGuards(AuthenticatedGuard)
    async getMyChatRooms(@Session() session: Record<string, any>){
        return (await this.chatService.getMyChatRooms(session.passport.user.chatRoomIds))
    }

    // Private ChatRoom İstekleri
    @Get(':userId/received-requests')
    @UseGuards(AuthenticatedGuard)
    async getReceivedRequests(@Param('userId') userId: string): Promise<Array<PrivateChatRequest>> {
        return (await this.chatService.getReceivedRequests(parseInt(userId)))
    }

    @Post('send-request/:receiverId/:chatRoomId')
    @UseGuards(AuthenticatedGuard)
    async sendRequest(@Param('receiverId') receiverId: string, @Param('chatRoomId') chatRoomId: string, @Session() session: Record<string, any>): Promise<PrivateChatRequest> {
        return (await this.chatService.createChatRequest(session.passport.user.id, parseInt(receiverId), chatRoomId))
    }

    @Post('accept')
    @UseGuards(AuthenticatedGuard)
    async acceptRequest(@Body() requestData: { senderId: number, receiverId: number, chatRoomId: string }, @Session() session: Record<string, any>): Promise<boolean> {
        if (session.passport.user.id != requestData.receiverId)
            throw new BadRequestException('You have no permission to do that.')
        return (await this.chatService.acceptRequest(requestData))
    }

    @Post('reject')
    @UseGuards(AuthenticatedGuard)
    async rejectRequest(@Body() requestData: { senderId: number, receiverId: number, chatRoomId: string }, @Session() session: Record<string, any>): Promise<boolean> {
        if (session.passport.user.id != requestData.receiverId)
            throw new BadRequestException('You have no permission to do that.')
        return (await this.chatService.rejectRequest(requestData))
    }
}
