import { BadRequestException, Body, Controller, Get, Param, Post, Session, UseGuards } from "@nestjs/common";
import { FriendRequest, User } from "@prisma/client";
import { AuthenticatedGuard } from "src/auth/guards/authenticated.guard";
import { FriendsService } from "./friends.service";

@Controller('friends')
export class FriendsController {
    constructor(private friendsService: FriendsService) {}

    @Get('/myfriends')
    @UseGuards(AuthenticatedGuard)
    async getMyFriends(@Session() session: Record<string, any>){
        return (await this.friendsService.getUserFriends(session.passport.user.id))
    }

    @Get(':userId/sent-requests') // Kullanıcının attığı istekler
    @UseGuards(AuthenticatedGuard)
    async getSentRequests(@Param('userId') userId: string): Promise<Array<number>> {
        return (await this.friendsService.getSentRequests(parseInt(userId)))
    }

    @Get(':userId/received-requests')
    @UseGuards(AuthenticatedGuard)
    async getReceivedRequests(@Param('userId') userId: string): Promise<Array<User>> {
        return (await this.friendsService.getReceivedRequests(parseInt(userId)))
    }

    @Post('send-request/:receiverId')
    @UseGuards(AuthenticatedGuard)
    async sendRequest(@Param('receiverId') receiverId: string, @Session() session: Record<string, any>): Promise<FriendRequest> {
        return (await this.friendsService.createFriendRequest(session.passport.user.id, parseInt(receiverId)))
    }

    @Post('accept')
    @UseGuards(AuthenticatedGuard)
    async acceptRequest(@Body() requestData: { senderId: number, receiverId: number }, @Session() session: Record<string, any>): Promise<boolean> {
        if (session.passport.user.id != requestData.receiverId)
            throw new BadRequestException('You have no permission to do that.')
        return (await this.friendsService.acceptRequest(requestData))
    }

    @Post('reject')
    @UseGuards(AuthenticatedGuard)
    async rejectRequest(@Body() requestData: { senderId: number, receiverId: number }, @Session() session: Record<string, any>): Promise<boolean> {
        if (session.passport.user.id != requestData.receiverId)
            throw new BadRequestException('You have no permission to do that.')
        return (await this.friendsService.rejectRequest(requestData))
    }

    @Post("unfriend")
    @UseGuards(AuthenticatedGuard)
    async unFriend(@Body() body: {userId: number}, @Session() session: Record<string, any>){
        return (await this.friendsService.unFriend(session.passport.user.id, body.userId))
    }
}