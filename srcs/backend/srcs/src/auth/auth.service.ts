import { Injectable, Req, Res, Session, UnauthorizedException } from "@nestjs/common";
import { UsersService } from "src/users/users.service";
import { Response } from "express";
import { Request } from "express-session";
import * as speakeasy from 'speakeasy';
import * as jwt from 'jsonwebtoken';
import * as qrcode from 'qrcode';
import { ConfigService } from "@nestjs/config";

@Injectable({})
export class AuthService {
    constructor(private userService: UsersService, private configService: ConfigService) {}

    callback(firstLogin: boolean, res: Response) {
        
        res.cookie('twoFactorOkCookie', '', { expires: new Date(0) })

        if (firstLogin)
            res.redirect(this.configService.get<string>("REACT_APP_HOMEPAGE") + "/editprofile")
        else
            res.redirect(this.configService.get<string>("REACT_APP_HOMEPAGE") + "/home")
    }

    logout(@Session() session: Record<string, any>) {
        session.destroy();
    }

    async isTwoFa(req: Request) {

        const token = req.cookies['twoFactorCookie']
        if (!token) 
            throw new UnauthorizedException('2FA Cookie is Not Set');

        const user = jwt.verify(token, this.configService.get<string>('JWT_SECRET'));
        const userDb = await this.userService.findUserbyID(user.id);
        return (userDb ? true : false)
    }

    async generateTwoFa(userId: number) {

        const secret = speakeasy.generateSecret()
        const twoFactorSecret = secret.base32

        await this.userService.update({
            id: userId,
            twoFactorSecret: twoFactorSecret,
            twoFactorQrCode: secret.otpauth_url
        })
        return (twoFactorSecret)
    }

    async showQrTwoFa(userId: number) {
        return (qrcode.toDataURL(await this.userService.userGetTwoFaQr(userId)))
    }

    async verifyTwoFa(userId: number, code: string) {
        
        const verified = speakeasy.totp.verify({
            secret: await this.userService.userGetTwoFaSecret(userId),
            encoding: 'base32',
            token: code
        })

        if (verified === true)
            this.userService.enableTwoFa(userId)

        return (verified)
    }

    validateTwoFa(@Req() req: Request, @Res() res: Response, code: string){
        
        const token = req.cookies['twoFactorCookie']
        if (!token) 
            throw new UnauthorizedException('2FA Cookie is Not Set');

        const user = jwt.verify(token, this.configService.get<string>('JWT_SECRET'))

        const validated = speakeasy.totp.verify({
            secret: user.twoFactorSecret,
            encoding: 'base32',
            token: code
        })

        if (!validated)
            return (res.send(false))

        const jwttoken = jwt.sign(user.id, this.configService.get<string>('JWT_SECRET'))
        res.cookie('twoFactorOkCookie', jwttoken, { httpOnly: true, secure: false })
        res.cookie('twoFactorCookie', '', { expires: new Date(0) })
        return (res.send(true))
    }

    async disableTwoFa(userId: number) {
        return (await this.userService.disableTwoFa(userId))
    }
}