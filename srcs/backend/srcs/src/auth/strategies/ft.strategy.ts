import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy, Profile } from 'passport-42'
import { PrismaService } from "src/prisma/prisma.service";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class FtStrategy extends PassportStrategy(Strategy, '42') {
    constructor(private prisma: PrismaService, configService: ConfigService) {
        super({
            clientID: configService.get<string>('INTRA_API_CLIENT_ID'),
            clientSecret: configService.get<string>('INTRA_API_CLIENT_SECRET'),
            callbackURL: configService.get<string>('INTRA_API_CALLBACK_URL'),
        });
    }

    async validate(accessToken: string, refreshToken: string, profile: Profile) {
        let nickname = profile._json.login;
        let i: number = 1;
        while (true) {
            try {
                const user = await this.prisma.user.upsert({
                    where: {
                        id: profile._json.id,
                    },
                    update: {
    
                    },
                    create: {
                        id: profile._json.id,
                        displayname: profile._json.displayname,
                        email: profile._json.email,
                        nickname: nickname,
                        photoUrl: profile._json.image.link
                    },
                });

                return (user);
            }
            catch (error) {
                if (error.code == 'P2002') {
                    nickname = profile._json.login;
                    nickname += i++;
                }
            }
        }
    }
}