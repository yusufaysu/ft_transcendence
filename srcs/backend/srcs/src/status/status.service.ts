import { Injectable } from '@nestjs/common';

type Status = "ONLINE" | "OFFLINE" | "ATGAME" | "INGAME"

@Injectable()
export class StatusService {

    private usersOnline: Array<{id: number, onlineCount: number, inGameCount: number}> = [];

    async addUserOnline(userId: number, status: string): Promise<void> {
        if (this.usersOnline.some((user) => user.id == userId)) {
            const index: number = this.usersOnline.findIndex((user) => user.id == userId);
            if (status == 'ONLINE') {
                this.usersOnline[index].onlineCount++;
            }
            else if (status == 'INGAME') {
                this.usersOnline[index].inGameCount++;
            }
        }
        else {
            if (status == 'ONLINE') {
                this.usersOnline.push({id: userId, onlineCount: 1, inGameCount: 0});
            }
            else if (status == 'INGAME') {
                this.usersOnline.push({id: userId, onlineCount: 0, inGameCount: 1});
            }
        }
    }

    async removeUserOnline(userId: number, status: string): Promise<void> {
        const index: number = this.usersOnline.findIndex((user) => user.id == userId);
        if (index == -1) {return;}

        if (status == 'ONLINE') {
            this.usersOnline[index].onlineCount--;
        }
        else if (status == 'INGAME') {
            this.usersOnline[index].inGameCount--;
        }

        if (this.usersOnline[index].onlineCount == 0 && this.usersOnline[index].inGameCount == 0) {
            this.usersOnline.splice(index, 1);
        }
    }

    getUsersOnline(): Array<{id: number, status: Status}> {
        const userArray: Array<{id: number, status: Status}> = this.usersOnline.map((user) => {
            if (user.inGameCount > 0) {
                return ({id: user.id, status: "ATGAME"});
            }
            else {
                return ({id: user.id, status: "ONLINE"});
            }
        });
        return userArray;
    }

    strFix(str: string | string[]): string {
        if (Array.isArray(str)) {
            return null;
        }
        else {
            return str;
        }
    }
}