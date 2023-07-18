import { BadRequestException,  Injectable} from "@nestjs/common";
import { FriendRequest, Prisma, User } from "@prisma/client";
import { PrismaService } from "src/prisma/prisma.service";
import { UsersService } from "./users.service";

@Injectable()
export class FriendsService {
    constructor(private prismaService: PrismaService, private userService: UsersService) {}

    async createFriendRequest(senderId: number, receiverId: number) : Promise<FriendRequest> {

        if ((await this.getFriends(senderId)).includes(receiverId))
            throw new BadRequestException('You are already friends with that user.');
        else if (senderId == receiverId)
            throw new BadRequestException("You can't send a friend request to yourself.");

        let uniqueIdentifier: string

        if (senderId < receiverId)
            uniqueIdentifier = `${senderId}_${receiverId}`
        else 
            uniqueIdentifier = `${receiverId}_${senderId}`

        return this.prismaService.friendRequest.create({
            data: {
                sender: { connect: { id: senderId } },
                receiver: { connect: { id: receiverId } },
                uniqueIdentifier: uniqueIdentifier
            }
        }).catch(e => {
            if (e instanceof Prisma.PrismaClientKnownRequestError && Array.isArray(e.meta?.target)) {
                if (e.meta.target.includes('senderId'))
                    throw new BadRequestException('You already sent a friend request to that user.');
                else if (e.meta.target.includes('uniqueIdentifier'))
                    throw new BadRequestException('You already have a friend request from that user.');
            }
            if (e.code == 'P2025')
                throw new BadRequestException('There is no user with that id.');
            throw e;
        })
    }

    async acceptRequest(requestData: { senderId: number, receiverId: number }): Promise<boolean> {

        const request = await this.prismaService.friendRequest.findUnique({
            where: {
                senderId_receiverId: requestData
            }
        })

        if (request == null)
            throw new BadRequestException("You can't accept a request that doesn't exist.");

        const sender = await this.userService.findUserbyID(requestData.senderId)
        const receiver = await this.userService.findUserbyID(requestData.receiverId)

        sender.friendIds.push(requestData.receiverId);
        receiver.friendIds.push(requestData.senderId);

        await this.userService.update(sender);
        await this.userService.update(receiver);

        await this.prismaService.friendRequest.delete({
            where: {
                senderId_receiverId: requestData
            }
        })
        return (true)
    }

    async rejectRequest(requestData: { senderId: number, receiverId: number }): Promise<boolean> {
        
        const request = await this.prismaService.friendRequest.findUnique({
            where: {
                senderId_receiverId: requestData
            }
        })

        if (request == null)
            throw new BadRequestException("You can't reject a request that doesn't exist.")

        await this.prismaService.friendRequest.delete({
            where: {
                senderId_receiverId: requestData
            }
        })
        return (true)
    }

    async getFriends(userId: number): Promise<number[]> {
        return ((await this.userService.findUserbyID(userId)).friendIds)
    }

    async getSentRequests(userId: number): Promise<Array<number>> {
        const mySendRequests: Array<FriendRequest> = await this.findUserByID(userId).sentFriendRequests()
        let receiverIds: Array<number> = []
        for (const request of mySendRequests){
            receiverIds.push(request.receiverId)
        }
        return (receiverIds)
    }

    async getReceivedRequests(userId: number): Promise<Array<User>> {

        let usersInfo: Array<User> = []
        const friendRequest = await this.findUserByID(userId).receivedFriendRequests()
        
        for (const requestData of friendRequest)
            usersInfo.push(await this.userService.findUserbyID(requestData.senderId))
        return (usersInfo)
    }

    private findUserByID(userId: number) {
        return (this.prismaService.user.findUnique({
            where: {
                id: userId
            }
        }))
    }

    async unFriend(myID: number, otherID: number){
        const myFriendIds = (await this.userService.findUserbyID(myID)).friendIds
        const otherFriends = (await this.userService.findUserbyID(otherID)).friendIds
        myFriendIds.splice(myFriendIds.indexOf(otherID), 1)
        otherFriends.splice(otherFriends.indexOf(myID), 1)
        await this.userService.update({id: myID, friendIds: myFriendIds})
        await this.userService.update({id: otherID, friendIds: otherFriends})
    }

    async getUserFriends(userId: number): Promise<Array<User>> {
        const friendIds = (await this.userService.findUserbyID(userId)).friendIds // session test fix
        let usersInfo: Array<User> = []
        for(const id of friendIds)
            usersInfo.push(await this.userService.findUserbyID(id))
        return (usersInfo)
    }
}