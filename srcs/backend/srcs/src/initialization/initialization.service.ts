import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class InitializationService {
    constructor(private prismaService: PrismaService) {}

    async initialize() {
        await this.createAchievements();
    }

    private async createAchievements() {
        const existingAchievements = await this.prismaService.achievement.findMany();

        const predefinedAchievements: Array<{ name: string, description?: string, xp: number }> = [
            {name: "İlk Galibiyet", description: "Bir oyunda galip gel.", xp: 500},
            {name: "Alışıyoruz", description: "Toplamda on galibiyete ulaş.", xp: 1500},
            {name: "Kalite", description: "Toplamda yirmi beş galibiyete ulaş.", xp: 3000},
            {name: "Pong'un Sefiri", description: "Toplamda elli galibiyete ulaş.", xp: 10000},
            {name: "Oyuncu", description: "Toplamda on oyun oyna.", xp: 1000},
            {name: "Bilgili", description: "Toplamda yirmi beş oyun oyna.", xp: 2000},
            {name: "Deneyimli", description: "Toplamda elli oyun oyna.", xp: 4000},
            {name: "Pong Bağımlısı", description: "Toplamda yüz oyun oyna.", xp: 8000},
            {name: "Mükemmel Defans", description: "Bir oyunda hiç skor vermeden galip gel.", xp: 1000},
            {name: "Galibiyet Zinciri", description: "Üst üste beş oyunda galip gel.", xp: 2500},
            {name: "Ultra Galibiyet Zinciri", description: "Üst üste on oyunda galip gel.", xp: 5000},
            {name: "Küllerinden Yeniden Doğ", description: "Skor alamadığın bir maçtan sonra skor vermeden bir oyun kazan.", xp: 1000},
        ];

        const newAchievements = predefinedAchievements.filter(
            (achievement) =>!existingAchievements.some(
                (existingAchievement) => existingAchievement.name === achievement.name
            )
        );

        if (newAchievements.length > 0) {
            await this.prismaService.achievement.createMany({
                data: newAchievements
            })
        }
    }
}
