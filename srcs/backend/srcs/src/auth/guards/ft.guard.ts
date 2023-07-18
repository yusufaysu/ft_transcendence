import { ExecutionContext, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { AuthGuard } from "@nestjs/passport";
import * as jwt from 'jsonwebtoken';

@Injectable()
export class FtAuthGuard extends AuthGuard('42') {
    
    constructor(private configService: ConfigService) {
        super();
    }

    async canActivate(context: ExecutionContext) {
        
        const request = context.switchToHttp().getRequest();
        const response = context.switchToHttp().getResponse();
        
        if (request.isAuthenticated())
            response.redirect(this.configService.get<string>("REACT_APP_HOMEPAGE") + "/home");
        else {

            const activate = (await super.canActivate(context)) as boolean; // Validate fonksiyonu burada cağırılıyor
            const twoFactorOkCookie = request.cookies['twoFactorOkCookie'];
            let twoFactorOk: boolean;

            if (!twoFactorOkCookie) 
                twoFactorOk = false;
            else {
                const userIdStr = jwt.verify(twoFactorOkCookie, this.configService.get<string>('JWT_SECRET'));
                if (parseInt(userIdStr) === request.user.id)
                    twoFactorOk = true;
                else
                    twoFactorOk = false;
            }

            const twoFactorEnabled = request.user.twoFactorEnabled;
            if (twoFactorEnabled && !twoFactorOk) {
                const token = jwt.sign(request.user, this.configService.get<string>('JWT_SECRET'));    
                response.cookie('twoFactorCookie', token, { httpOnly: true, secure: false });
                response.redirect(this.configService.get<string>('REACT_APP_2FA_PAGE'));
                return (false);
            }

            await super.logIn(request);
            return (activate);
        }
    }     
}