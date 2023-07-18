import { Body, Controller, FileTypeValidator, Get, MaxFileSizeValidator, Param, ParseFilePipe, Post, Put, Session, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { UsersService } from './users.service';
import { User } from '@prisma/client';
import { FileInterceptor } from '@nestjs/platform-express';
import { Express } from 'express'
import { AuthenticatedGuard } from 'src/auth/guards/authenticated.guard';

@Controller('users')
export class UsersController {
    constructor(private userService: UsersService) {}

    @Get()
    @UseGuards(AuthenticatedGuard)
    async getAllUsers(){
        return (await this.userService.allUsers())
    }

    @Get('current')
    @UseGuards(AuthenticatedGuard)
    getCurrentUser(@Session() session: Record<string, any>) {
        return (this.userService.currentUser(session))
    }

    @Get('getuser/:userId')
    @UseGuards(AuthenticatedGuard)
    async findUserbyID(@Param("userId") userId: string) {
        return (await this.userService.findUserbyID(parseInt(userId)))
    }

    @Get('currentgameid/:userId')
    @UseGuards(AuthenticatedGuard)
    async getCurrentGameId(@Param("userId") userId: string) {
        return (await this.userService.getCurrentGameId(parseInt(userId)))
    }

    @Put("/update")
    @UseGuards(AuthenticatedGuard)
    async updateUserInfo(@Body() newUserInfo: Partial<User>): Promise<boolean> {
        return (await this.userService.update(newUserInfo))
    }

    @Post('upload/avatar')
    @UseGuards(AuthenticatedGuard)
    @UseInterceptors(FileInterceptor('avatar', { dest: 'public/uploads' }))
    async uploadAvatar(
        @UploadedFile(
        new ParseFilePipe({
            validators: [
                new MaxFileSizeValidator({ maxSize: 5242880 }),
                new FileTypeValidator({ fileType: '(jpeg|jpg|png)$' })
            ]
        })
        )
        file: Express.Multer.File,
        @Session() session: Record<string, any>
    ) {
        return (await this.userService.uploadAvatar(session.passport.user.id, file))
    }

    @Post('blockuser')
    @UseGuards(AuthenticatedGuard)
    async blockUser(@Session() session: Record<string, any>, @Body() body: {blockedUserId: number}): Promise<boolean> {
        return (await this.userService.blockUser(session.passport.user.id, body.blockedUserId))
    }

    @Post('unblockuser')
    @UseGuards(AuthenticatedGuard)
    async unBlockUser(@Session() session: Record<string, any>, @Body() body: {blockedUserId: number}): Promise<boolean> {
        return (await this.userService.unBlockUser(session.passport.user.id, body.blockedUserId))
    }

    @Get('gamehistory/:userId')
    @UseGuards(AuthenticatedGuard)
    async getGameHistory(@Param("userId") userId: string) {
        return (await this.userService.getGameHistory(parseInt(userId)));
    }

    @Get('achievements/:userId')
    @UseGuards(AuthenticatedGuard)
    async getAchievements(@Param("userId") userId: string) {
        return (await this.userService.getAchievements(parseInt(userId)));
    }

    @Get('stats/:userId')
    @UseGuards(AuthenticatedGuard)
    async getStats(@Param("userId") userId: string) {
        return (await this.userService.getStats(parseInt(userId)));
    }

    @Get('globalrank')
    @UseGuards(AuthenticatedGuard)
    async getGlobalRank() {
        return (await this.userService.getGlobalRank());
    }
}