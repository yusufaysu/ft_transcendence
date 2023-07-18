import { Body, Controller, Get, Post, Req, Res, Session, UseGuards } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { FtAuthGuard } from "./guards/ft.guard";
import { AuthenticatedGuard } from "./guards/authenticated.guard";
import { Response } from "express";
import { Request } from "express-session";

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) {}

    @Get('login')
    @UseGuards(FtAuthGuard)
    login() {}

    @Get('callback')
    @UseGuards(FtAuthGuard)
    callback(@Session() session: Record<string, any>, @Res() res: Response) {
        this.authService.callback(session.passport.user.firstLogin, res)
    }

    @Get('logout')
    @UseGuards(AuthenticatedGuard)
    logoff(@Session() session: Record<string, any>) {
        this.authService.logout(session)
    }

    @Get('2fa/status')
    async isTwoFa(@Req() req: Request) {
        return (await this.authService.isTwoFa(req));
    }

    @Get('2fa/generate')
    @UseGuards(AuthenticatedGuard)
    async generateTwoFaSecret(@Session() session: Record<string, any>) {
        return (await this.authService.generateTwoFa(session.passport.user.id))
    }

    @Get('2fa/showqr')
    @UseGuards(AuthenticatedGuard)
    async showQrTwoFa(@Session() session: Record<string, any>) {
        return (await this.authService.showQrTwoFa(session.passport.user.id))
    }

    @Post('2fa/verify')
    @UseGuards(AuthenticatedGuard)
    async verifyTwoFa(@Body() body: {code: string}, @Session() session: Record<string, any>) {
        return (await this.authService.verifyTwoFa(session.passport.user.id, body.code))
    }

    @Post('2fa/validate')
    async validateTwoFa(@Req() req: Request, @Res() res: Response, @Body() body: {code: string}) {
        return (this.authService.validateTwoFa(req, res, body.code))
    }

    @Post('2fa/disable')
    @UseGuards(AuthenticatedGuard)
    async disableTwoFa(@Session() session: Record<string, any>) {
        return (await this.authService.disableTwoFa(session.passport.user.id))
    }
}