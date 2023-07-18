import { User } from "@prisma/client";

const AP_WIDTH = 16; // Aspect Ratio Width
const AP_HEIGHT = 9; // Aspect Ratio Height
const GRID_SIZE = 64;

export const GAME_FPS = 60;
export const COUNTDOWN_SECONDS = 20;
export const STARTING_SECONDS = 3;
export const PAUSE_WAIT_SECONDS = 10;
export const GAME_END_SCORE = 5;

export const WIN_XP = 300;
export const LOSE_XP = 200;

export enum GameState {
    WAITINGTOSTART,
    STARTING,
    PLAYING,
    PAUSED,
    ABORTED,
    FINISHEDP1,
    FINISHEDP2
}

export enum Direction {
    UP,
    DOWN
}

export class Paddle {
    userId: number;
    name: string;
    isReady: boolean = false;
    width: number = 0.2;
    height: number = 2;
    x: number;
    y: number = (AP_HEIGHT / 2) - (this.height / 2);
    score: number = 0;
    speed: number = 0.2 * 60 / GAME_FPS;

    constructor(userId: number, name: string, side: string) {
        this.userId = userId;
        this.name = name;
        if (side == 'left') {
            this.x = 0.5;
        }
        else {
            this.x = (AP_WIDTH - 0.5) - this.width;
        }
    }

    scoreUp(game: GameObject) {
        this.score++;
        game.sendScore = true;
    }

    changePosition(newY: number) {
        this.y = newY;
        if (this.y < 0.2) {
            this.y = 0.2;
        }
        else if (this.y + this.height > (AP_HEIGHT - 0.2)) {
            this.y = (AP_HEIGHT - 0.2) - this.height;
        }
    }

    resetPosition() {
        this.y = (AP_HEIGHT / 2) - (this.height / 2);
    }
}

export class Ball {
    maxSpeed: number = 0.5 * 60 / GAME_FPS;
    speedIncrease: number = 0.008 * 60 / GAME_FPS;
    initialSpeed: number = 0.15 * 60 / GAME_FPS;
    speed: number = this.initialSpeed * 0.6;
    width: number = 0.2;
    height: number = 0.2;
    x: number = (AP_WIDTH / 2) - (this.height / 2);
    y: number = (AP_HEIGHT / 2) - (this.width / 2);
    dx: number = Math.floor(Math.random() * 2) === 0 ? -1 : 1;
    dy: number = Math.floor(Math.random() * 2) === 0 ? -1 : 1;
    gameRef: GameObject;
    
    constructor (game: GameObject) {
        this.gameRef = game;
    }

    updateBallPosition(paddleOne: Paddle, paddleTwo: Paddle) {
        this.x += this.dx * this.speed;
        this.y += this.dy * this.speed;

        // Top and Bottom Collisions
        if (this.y < 0) {
            this.y = 0;
            this.dy *= -1;
        }
        else if (this.y + this.height > AP_HEIGHT) {
            this.y = AP_HEIGHT - this.height;
            this.dy *= -1;
        }

        // Paddle Collisions
        if (this.checkCollision(this, paddleOne)) {
            this.x = paddleOne.x + paddleOne.width;
            this.dx *= -1;
            this.increaseSpeed();
        }
        else if (this.checkCollision(this, paddleTwo)) {
            this.x = paddleTwo.x - this.width;
            this.dx *= -1;
            this.increaseSpeed();
        }

        // Score Collisions
        if (this.x < -1) {
            paddleTwo.scoreUp(this.gameRef);
            this.resetBall();
        }
        else if (this.x + this.width > AP_WIDTH + 1) {
            paddleOne.scoreUp(this.gameRef);
            this.resetBall();
        }
    }

    private checkCollision(obj1: Ball | Paddle, obj2: Ball | Paddle): boolean {
        const obj1Left = obj1.x;
        const obj1Right = obj1.x + obj1.width;
        const obj1Top = obj1.y;
        const obj1Bottom = obj1.y + obj1.height;

        const obj2Left = obj2.x;
        const obj2Right = obj2.x + obj2.width;
        const obj2Top = obj2.y;
        const obj2Bottom = obj2.y + obj2.height;

        if (obj1Right < obj2Left || obj1Left > obj2Right || obj1Bottom < obj2Top || obj1Top > obj2Bottom) {
            return false;
        }
        return true;
    }

    private increaseSpeed() {
        this.speed += this.speedIncrease;
        if (this.speed > this.maxSpeed) {
            this.speed = this.maxSpeed;
        }
    }

    resetBall() {
        this.speed = this.initialSpeed;
        this.x = (AP_WIDTH / 2) - (this.height / 2);
        this.y = (AP_HEIGHT / 2) - (this.width / 2);
        this.dx = Math.floor(Math.random() * 2) === 0 ? -1 : 1;
        this.dy = Math.floor(Math.random() * 2) === 0 ? -1 : 1;
    }
}

export class GameObject {
    intervalId: NodeJS.Timer;
    gameState: GameState = GameState.WAITINGTOSTART;
    playerOne: Paddle;
    playerTwo: Paddle;
    ball: Ball;
    gridSize: number = GRID_SIZE;

    sendScore: boolean = false;
    waitingUserId: number;

    countdownIntervalId: NodeJS.Timer;
    countdownInSeconds: number = COUNTDOWN_SECONDS;

    deleting: boolean = false;

    constructor(playerOneUser: User, playerTwoUser: User) {
        this.playerOne = new Paddle(playerOneUser.id, playerOneUser.nickname, 'left');
        this.playerTwo = new Paddle(playerTwoUser.id, playerTwoUser.nickname, 'right');
        this.ball = new Ball(this);
    }
}