import axios from "axios";
import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import PageNotFoundCmp from "../componets/PageNotFoundCmp";
import { Socket, io } from "socket.io-client";
import { User } from "../dto/DataObject";
import "../ui-design/styles/GameScreen.css"
import chroma from "chroma-js";
import mouse from "../ui-design/images/mouse.png";

const AP_WIDTH = 16;
const AP_HEIGHT = 9;

function ScoreBoard({ playerOneName, playerOneScore, playerTwoName, playerTwoScore }: { playerOneName: string | undefined, playerOneScore: number | undefined, playerTwoName: string | undefined, playerTwoScore: number | undefined }){
  return(
    <div className='scoreBoard'>
      <div className="non-highlightable">{playerOneName}:{playerOneScore}</div>
      <div className='non-highlightable'>VS</div>
      <div className="non-highlightable">{playerTwoName}:{playerTwoScore}</div>
    </div>
  )
}

const GameScreen = () => {
  enum GameState {
    WAITINGTOSTART,
    STARTING,
    PLAYING,
    PAUSED,
    FINISHEDWIN,
    FINISHEDLOSE,
    ABORTED
  }

  const COLOR_STYLE_COUNT = 10;
  enum ColorStyle {
    DEFAULT,
    PAPERBACK,
    MAC,
    CASIO,
    IBM,
    GOOP,
    URINE,
    NOKIA,
    SANGRE,
    PORT
  }

  const SHAPE_STYLE_COUNT = 2;
  enum ShapeStyle {
    CLASSIC,
    MODERN
  }

  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [socket, setSocket] = useState<Socket | null>(null)
  const [socketListen, setSocketListen] = useState<boolean>(false)
  const [connectControl, setConnectControl] = useState<boolean>(false)
  const [cursorState, setCursorState] = useState<boolean>(true);
  const { gameId } = useParams()

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  interface Position {
    x: number;
    y: number;
  }

  interface Paddle {
    id: number;
    name: string;
    isReady: boolean;
    position: Position;
    score: number;
    width: number;
    height: number;
    speed: number;
  }

  interface Ball {
    position: Position;
    width: number;
    height: number;
  }

  interface Game {
    gameState: GameState;
    ball: Ball;
    playerPaddle: Paddle;
    opponentPaddle: Paddle;
    gridSize: number;
    countdown: number;
  }

  interface Button {
    states: GameState[];
    width: number;
    height: number;
    x: number;
    y: number;
    text: string;
    hover: boolean;
    active: boolean;
    onclick: Function;
  }

  interface ColorPalette {
    background: string,
    paddle: string,
    ball: string,
    net: string,
    text: string,
    button: string,
    buttonText: string,
    buttonHighlight: string
  }

  let gameData: Game;
  const [playerOneName, setPlayerOneName] = useState<string>();
  const [playerTwoName, setPlayerTwoName] = useState<string>();
  const [playerOneScore, setPlayerOneScore] = useState<number>();
  const [playerTwoScore, setPlayerTwoScore] = useState<number>();

  const buttons: Array<Button> = [
    { // READY BUTTON
      states: [GameState.WAITINGTOSTART],
      width: 1.5,
      height: 0.75,
      x: (AP_WIDTH/2 - 0.75),
      y: (AP_HEIGHT/2 - 0.375) + 3,
      text: 'HAZIR',
      hover: false,
      active: true,
      onclick: () => {
        if (!socket) {return;}
        gameData.playerPaddle.isReady = true;
        socket.emit('ready');
        buttons[0].active = false;
      }
    },
    { // GOTO HOMEPAGE BUTTON
      states: [GameState.FINISHEDWIN, GameState.FINISHEDLOSE, GameState.ABORTED],
      width: 1.5,
      height: 0.75,
      x: (AP_WIDTH/2 - 0.75),
      y: (AP_HEIGHT/2 - 0.375) + 3,
      text: 'GERİ DÖN',
      hover: false,
      active: true,
      onclick: () => {
        window.location.assign("/home");
        buttons[1].active = false;
      }
    },
    { // NEXT COLOR STYLE
      states: [GameState.WAITINGTOSTART],
      width: 0.5,
      height: 0.5,
      x: (AP_WIDTH/2 - 0.25) - 2,
      y: (AP_HEIGHT/2 - 0.25) + 1.5,
      text: '>>',
      hover: false,
      active: true,
      onclick: () => {
        if (!currentUser) {return;}
        currentUser.pongColorStyle++;
        if (currentUser.pongColorStyle >= COLOR_STYLE_COUNT) {
          currentUser.pongColorStyle = 0;
        }
        axios.put('/users/update', currentUser);
      }
    },
    { // PREV COLOR STYLE
      states: [GameState.WAITINGTOSTART],
      width: 0.5,
      height: 0.5,
      x: (AP_WIDTH/2 - 0.25) - 6,
      y: (AP_HEIGHT/2 - 0.25) + 1.5,
      text: '<<',
      hover: false,
      active: true,
      onclick: () => {
        if (!currentUser) {return;}
        currentUser.pongColorStyle--;
        if (currentUser.pongColorStyle < 0) {
          currentUser.pongColorStyle = COLOR_STYLE_COUNT - 1;
        }
        axios.put('/users/update', currentUser);
      }
    },
    { // NEXT SHAPE STYLE
      states: [GameState.WAITINGTOSTART],
      width: 0.5,
      height: 0.5,
      x: (AP_WIDTH/2 - 0.25) - 2,
      y: (AP_HEIGHT/2 - 0.25) - 0.5,
      text: '>>',
      hover: false,
      active: true,
      onclick: () => {
        if (!currentUser) {return;}
        currentUser.pongShapeStyle++;
        if (currentUser.pongShapeStyle >= SHAPE_STYLE_COUNT) {
          currentUser.pongShapeStyle = 0;
        }
        axios.put('/users/update', currentUser);
      }
    },
    { // PREV SHAPE STYLE
      states: [GameState.WAITINGTOSTART],
      width: 0.5,
      height: 0.5,
      x: (AP_WIDTH/2 - 0.25) - 6,
      y: (AP_HEIGHT/2 - 0.25) - 0.5,
      text: '<<',
      hover: false,
      active: true,
      onclick: () => {
        if (!currentUser) {return;}
        currentUser.pongShapeStyle--;
        if (currentUser.pongShapeStyle < 0) {
          currentUser.pongShapeStyle = SHAPE_STYLE_COUNT - 1;
        }
        axios.put('/users/update', currentUser);
      }
    }
  ];

  const getColorPalette = (styleNumber: number): ColorPalette => {
    let colorPalette: ColorPalette;

    switch (styleNumber) {
      case ColorStyle.PORT:
        colorPalette = {
          background: '#10368f',
          paddle: '#ff8e42',
          ball: '#ff8e42',
          net: '#ff8e42',
          text: '#ff8e42',
          button: '#ff8e42',
          buttonText: '#10368f',
          buttonHighlight: 'yellow'
        }
        break;
      case ColorStyle.SANGRE:
        colorPalette = {
          background: '#120628',
          paddle: '#610e0e',
          ball: '#610e0e',
          net: '#610e0e',
          text: '#610e0e',
          button: '#610e0e',
          buttonText: '#120628',
          buttonHighlight: 'yellow'
        }
        break;
      case ColorStyle.NOKIA:
        colorPalette = {
          background: '#43523d',
          paddle: '#c7f0d8',
          ball: '#c7f0d8',
          net: '#c7f0d8',
          text: '#c7f0d8',
          button: '#c7f0d8',
          buttonText: '#43523d',
          buttonHighlight: 'yellow'
        }
        break;
      case ColorStyle.URINE:
        colorPalette = {
          background: '#002f40',
          paddle: '#ffd500',
          ball: '#ffd500',
          net: '#ffd500',
          text: '#ffd500',
          button: '#ffd500',
          buttonText: '#002f40',
          buttonHighlight: 'yellow'
        }
        break;
      case ColorStyle.GOOP:
        colorPalette = {
          background: '#210009',
          paddle: '#00ffae',
          ball: '#00ffae',
          net: '#00ffae',
          text: '#00ffae',
          button: '#00ffae',
          buttonText: '#210009',
          buttonHighlight: 'yellow'
        }
        break;
      case ColorStyle.IBM:
        colorPalette = {
          background: '#323c39',
          paddle: '#d3c9a1',
          ball: '#d3c9a1',
          net: '#d3c9a1',
          text: '#d3c9a1',
          button: '#d3c9a1',
          buttonText: '#323c39',
          buttonHighlight: 'yellow'
        }
        break;
      case ColorStyle.CASIO:
        colorPalette = {
          background: '#83b07e',
          paddle: '#000000',
          ball: '#000000',
          net: '#000000',
          text: '#000000',
          button: '#000000',
          buttonText: '#83b07e',
          buttonHighlight: 'yellow'
        }
        break;
      case ColorStyle.MAC:
        colorPalette = {
          background: '#8bc8fe',
          paddle: '#051b2c',
          ball: '#051b2c',
          net: '#051b2c',
          text: '#051b2c',
          button: '#051b2c',
          buttonText: '#8bc8fe',
          buttonHighlight: 'yellow'
        }
        break;
      case ColorStyle.PAPERBACK:
        colorPalette = {
          background: '#382b26',
          paddle: '#b8c2b9',
          ball: '#b8c2b9',
          net: '#b8c2b9',
          text: '#b8c2b9',
          button: '#b8c2b9',
          buttonText: '#382b26',
          buttonHighlight: 'yellow'
        }
        break;
      default:
        colorPalette = {
          background: 'black',
          paddle: 'white',
          ball: 'white',
          net: 'lightgrey',
          text: 'lightgrey',
          button: 'red',
          buttonText: 'white',
          buttonHighlight: 'yellow'
        }
        break;
    }

    return colorPalette;
  }

  let image = new Image();
  image.src = mouse;

  const draw = (game: Game | undefined) => {
    if (!game) {return;}

    const canvas = canvasRef.current;
    if (!canvas || !currentUser) {return;}
    const context = canvas.getContext('2d');
    if (!context) {return;}

    const scale: number = canvas.width / AP_WIDTH;
    const colorPalette: ColorPalette = getColorPalette(currentUser.pongColorStyle);

    context.clearRect(0, 0, canvas.width, canvas.height);

    context.fillStyle = colorPalette.background;
    context.fillRect(0, 0, canvas.width, canvas.height);

    //scoreboardın altını ve canvasın altını boyuyor
    context.fillStyle = 'white';
    context.fillRect(0, 0, (AP_WIDTH * scale), 8);
    context.fillRect(0, (AP_HEIGHT * scale) - 8, (AP_WIDTH * scale), (AP_HEIGHT * scale));

    const buttonRoundRadius = 15;
    buttons.forEach((bt) => {
      if (bt.states.includes(game.gameState)) {
        if (bt.hover && bt.active) {
          const highlightSize = 0.05;
          context.fillStyle = colorPalette.buttonHighlight;
          if (currentUser.pongShapeStyle === ShapeStyle.CLASSIC) {
            context.fillRect((bt.x - highlightSize / 2) * scale, (bt.y - highlightSize / 2) * scale, (bt.width + highlightSize) * scale, (bt.height + highlightSize) * scale);
          }
          else if (currentUser.pongShapeStyle === ShapeStyle.MODERN) {
            context.beginPath();
            context.roundRect((bt.x - highlightSize / 2) * scale, (bt.y - highlightSize / 2) * scale, (bt.width + highlightSize) * scale, (bt.height + highlightSize) * scale, buttonRoundRadius);
            context.stroke();
            context.fill();
          }
        }
        if (!bt.active) {
          context.fillStyle = chroma(colorPalette.button).darken(4).hex()
          if (currentUser.pongShapeStyle === ShapeStyle.CLASSIC) {
            context.fillRect(bt.x * scale, bt.y * scale, bt.width * scale, bt.height * scale);
          }
          else if (currentUser.pongShapeStyle === ShapeStyle.MODERN) {
            context.beginPath();
            context.roundRect(bt.x * scale, bt.y * scale, bt.width * scale, bt.height * scale, buttonRoundRadius);
            context.stroke();
            context.fill();
          }
          context.fillStyle = chroma(colorPalette.buttonText).darken(4).hex()
        }
        else {
          context.fillStyle = colorPalette.button;
          if (currentUser.pongShapeStyle === ShapeStyle.CLASSIC) {
            context.fillRect(bt.x * scale, bt.y * scale, bt.width * scale, bt.height * scale);
          }
          else if (currentUser.pongShapeStyle === ShapeStyle.MODERN) {
            context.beginPath();
            context.roundRect(bt.x * scale, bt.y * scale, bt.width * scale, bt.height * scale, buttonRoundRadius);
            context.stroke();
            context.fill();
          }
          context.fillStyle = colorPalette.buttonText;
        }
        const fontSize = 0.3 * scale;
        context.font = `${fontSize.toString()}px Arial`;
        context.textAlign = 'center';
        context.fillText(bt.text, (bt.x + bt.width / 2) * scale, (bt.y + bt.height / 2 + 0.1) * scale);
      }
    });

    if (game.gameState === GameState.PLAYING) {
      setCursorState(false);
      drawGame(game, canvas, context, scale, colorPalette);
    }
    else if (game.gameState === GameState.WAITINGTOSTART) {
      setCursorState(true);
      drawMenu(game, canvas, context, scale, colorPalette);
    }
    else if (game.gameState === GameState.ABORTED) {
      setCursorState(true);
      drawAbortedMenu(game, canvas, context, scale, colorPalette);
    }
    else if (game.gameState === GameState.STARTING) {
      setCursorState(true);
      drawStartingMenu(game, canvas, context, scale, colorPalette);
    }
    else if (game.gameState === GameState.PAUSED) {
      setCursorState(true);
      drawPausedMenu(game, canvas, context, scale, colorPalette);
    }
    else if (game.gameState === GameState.FINISHEDWIN) {
      setCursorState(true);
      drawFinishedWin(game, canvas, context, scale, colorPalette);
    }
    else if (game.gameState === GameState.FINISHEDLOSE) {
      setCursorState(true);
      drawFinishedLose(game, canvas, context, scale, colorPalette);
    }
  }

  const drawGame = (game: Game | undefined, canvas: HTMLCanvasElement, context: CanvasRenderingContext2D, scale: number, colorPalette: ColorPalette) => {
    if (!game || !canvas || !context || !currentUser) {return;}

    const playerPaddle = game.playerPaddle;
    const opponentPaddle = game.opponentPaddle;
    const ball = game.ball;

    context.fillStyle = colorPalette.paddle;
    if (currentUser.pongShapeStyle === ShapeStyle.CLASSIC) {
      context.fillRect(playerPaddle.position.x * scale, playerPaddle.position.y * scale, playerPaddle.width * scale, playerPaddle.height * scale);
      context.fillRect(opponentPaddle.position.x * scale, opponentPaddle.position.y * scale, opponentPaddle.width * scale, opponentPaddle.height * scale);
    }
    else if (currentUser.pongShapeStyle === ShapeStyle.MODERN) {
      context.beginPath();
      context.roundRect(playerPaddle.position.x * scale, playerPaddle.position.y * scale, playerPaddle.width * scale, playerPaddle.height * scale, 100);
      context.roundRect(opponentPaddle.position.x * scale, opponentPaddle.position.y * scale, opponentPaddle.width * scale, opponentPaddle.height * scale, 100);
      context.stroke();
      context.fill();
    }

    context.fillStyle = colorPalette.ball;
    if (currentUser.pongShapeStyle === ShapeStyle.CLASSIC) {
      context.fillRect(ball.position.x * scale, ball.position.y * scale, ball.width * scale, ball.height * scale)
    }
    else if (currentUser.pongShapeStyle === ShapeStyle.MODERN) {
      context.beginPath();
      context.arc((ball.position.x + ball.width / 2) * scale, (ball.position.y + ball.height / 2) * scale, ball.width / 2 * scale, 0, 2 * Math.PI);
      context.stroke();
      context.fill();
    }

    //net i çiziyor
    context.fillStyle = colorPalette.net;
    for (let i = scale/8; i < canvas.height - scale/8; i += scale/8 * 2) {
      context.fillRect(canvas.width / 2 - scale/8 / 2, i, scale/8, scale/8);
    }
  }

  const drawMenu = (game: Game | undefined, canvas: HTMLCanvasElement, context: CanvasRenderingContext2D, scale: number, colorPalette: ColorPalette) => {
    if (!game || !canvas || !context || !currentUser) {return;}

    const playerPaddle = game.playerPaddle;
    const opponentPaddle = game.opponentPaddle;
    const ball = game.ball;

    let colorStyleString = '';
    switch (currentUser.pongColorStyle) {
      case ColorStyle.PORT:
        colorStyleString = 'PORT';
        break;
      case ColorStyle.SANGRE:
        colorStyleString = 'SANGRE';
        break;
      case ColorStyle.NOKIA:
        colorStyleString = 'NOKIA';
        break;
      case ColorStyle.URINE:
        colorStyleString = 'URINE';
        break;
      case ColorStyle.GOOP:
        colorStyleString = 'GOOP';
        break;
      case ColorStyle.IBM:
        colorStyleString = 'IBM';
        break;
      case ColorStyle.CASIO:
        colorStyleString = 'CASIO';
        break;
      case ColorStyle.MAC:
        colorStyleString = 'MAC';
        break;
      case ColorStyle.PAPERBACK:
        colorStyleString = 'PAPERBACK';
        break;
      default:
        colorStyleString = 'DEFAULT';
        break;
    }
    context.fillStyle = colorPalette.text;
    context.font = `${0.5 * scale}px Arial`;
    context.textAlign = 'center';
    context.fillText(colorStyleString, (AP_WIDTH / 2 - 4) * scale, (AP_HEIGHT / 2 + 1.5 + 0.175) * scale);
    context.fillStyle = 'white';
    context.fillRect((AP_WIDTH / 2 - 6) * scale, (AP_HEIGHT / 2 + 1) * scale, 4 * scale, 2);
    context.font = `${0.35 * scale}px Arial`;
    context.fillText("Renk Stili", (AP_WIDTH / 2 - 4) * scale, (AP_HEIGHT / 2 + 0.5 + 0.3) * scale)

    let shapeStyleString = '';
    switch (currentUser.pongShapeStyle) {
      case ShapeStyle.MODERN:
        shapeStyleString = 'MODERN';
        break;
      default:
        shapeStyleString = 'CLASSIC';
        break;
    }
    context.fillStyle = colorPalette.text;
    context.font = `${0.5 * scale}px Arial`;
    context.textAlign = 'center';
    context.fillText(shapeStyleString, (AP_WIDTH / 2 - 4) * scale, (AP_HEIGHT / 2 - 0.5 + 0.175) * scale);
    context.fillStyle = 'white';
    context.fillRect((AP_WIDTH / 2 - 6) * scale, (AP_HEIGHT / 2 - 1) * scale, 4 * scale, 2);
    context.font = `${0.35 * scale}px Arial`;
    context.fillText("Şekil Stili", (AP_WIDTH / 2 - 4) * scale, (AP_HEIGHT / 2 - 1.5 + 0.3) * scale)

    context.fillStyle = colorPalette.paddle;
    if (currentUser.pongShapeStyle === ShapeStyle.CLASSIC) {
      context.fillRect((AP_WIDTH / 2 + 2) * scale, (AP_HEIGHT / 2 - 0.5) * scale, playerPaddle.width * scale, playerPaddle.height * scale);
      context.fillRect((AP_WIDTH / 2 + 5) * scale, (AP_HEIGHT / 2 - 0.5) * scale, opponentPaddle.width * scale, opponentPaddle.height * scale);
    }
    else if (currentUser.pongShapeStyle === ShapeStyle.MODERN) {
      context.beginPath();
      context.roundRect((AP_WIDTH / 2 + 2) * scale, (AP_HEIGHT / 2 - 0.5) * scale, playerPaddle.width * scale, playerPaddle.height * scale, 100);
      context.roundRect((AP_WIDTH / 2 + 5) * scale, (AP_HEIGHT / 2 - 0.5) * scale, opponentPaddle.width * scale, opponentPaddle.height * scale, 100);
      context.stroke();
      context.fill();
    }

    context.fillStyle = colorPalette.ball;
    if (currentUser.pongShapeStyle === ShapeStyle.CLASSIC) {
      context.fillRect((AP_WIDTH / 2 + 3.5) * scale, ((AP_HEIGHT / 2 - 0.5) + playerPaddle.height / 2 - ball.height / 2) * scale, ball.width * scale, ball.height * scale)
    }
    else if (currentUser.pongShapeStyle === ShapeStyle.MODERN) {
      context.beginPath();
      context.arc((AP_WIDTH / 2 + 3.5 + ball.width / 2) * scale, ((AP_HEIGHT / 2 - 0.5) + playerPaddle.height / 2) * scale, ball.width / 2 * scale, 0, 2 * Math.PI);
      context.stroke();
      context.fill();
    }

    let leftOverSeconds: number = game.countdown;
    if (leftOverSeconds < 0) {leftOverSeconds = 0;}

    context.fillStyle = colorPalette.text;
    context.font = `${1.5 * scale}px Arial`;
    context.textAlign = 'center';
    context.fillText(leftOverSeconds.toFixed(), AP_WIDTH / 2 * scale, 2.1 * scale);

    context.fillStyle = colorPalette.text;
    context.font = `${0.3 * scale}px Arial`;
    if (!playerPaddle.isReady) {
      context.fillText("Hazır olmanız bekleniyor...", AP_WIDTH / 2 * scale, (AP_HEIGHT / 2 + 3.9) * scale);
    }
    else if (!opponentPaddle.isReady) {
      context.fillText("Rakibinizin hazır olması bekleniyor...", AP_WIDTH / 2 * scale, (AP_HEIGHT / 2 + 3.9) * scale);
    }

    const imgWidth = 1 * scale;
    if (playerPaddle.position.x < opponentPaddle.position.x) {
      context.drawImage(image, ((AP_WIDTH / 2 - 5.5 - (0.5)) * scale), (AP_HEIGHT / 10 * scale), imgWidth, imgWidth);
    }
    else {
      context.drawImage(image, ((AP_WIDTH / 2 + 5.5 - (0.5)) * scale), (AP_HEIGHT / 10 * scale), imgWidth, imgWidth);
    }
  }

  const drawAbortedMenu = (game: Game | undefined, canvas: HTMLCanvasElement, context: CanvasRenderingContext2D, scale: number, colorPalette: ColorPalette) => {
    if (!game || !canvas || !context) {return;}

    context.fillStyle = colorPalette.text;
    context.font = `${1.5 * scale}px Arial`;
    context.textAlign = 'center';
    context.fillText("Oyun İptal Edildi", AP_WIDTH / 2 * scale, AP_HEIGHT / 2 * scale);
  }

  const drawStartingMenu = (game: Game | undefined, canvas: HTMLCanvasElement, context: CanvasRenderingContext2D, scale: number, colorPalette: ColorPalette) => {
    if (!game || !canvas || !context) {return;}

    let leftOverSeconds: number = game.countdown;
    if (leftOverSeconds < 0) {leftOverSeconds = 0;}

    context.fillStyle = colorPalette.text;
    context.font = `${3 * scale}px Arial`;
    context.textAlign = 'center';
    context.fillText(leftOverSeconds.toFixed(), AP_WIDTH / 2 * scale, AP_HEIGHT / 2 * scale);

    context.font = `${1 * scale}px Arial`;
    context.fillText("Oyun Başlıyor...", AP_WIDTH / 2 * scale, (AP_HEIGHT / 2 + 2) * scale);
  }

  const drawPausedMenu = (game: Game | undefined, canvas: HTMLCanvasElement, context: CanvasRenderingContext2D, scale: number, colorPalette: ColorPalette) => {
    if (!game || !canvas || !context) {return;}

    let leftOverSeconds: number = game.countdown;
    if (leftOverSeconds < 0) {leftOverSeconds = 0;}

    context.fillStyle = colorPalette.text;
    context.font = `${3 * scale}px Arial`;
    context.textAlign = 'center';
    context.fillText(leftOverSeconds.toFixed(), AP_WIDTH / 2 * scale, AP_HEIGHT / 2 * scale);

    context.font = `${1 * scale}px Arial`;
    context.fillText("Rakibinizin Bağlantısı Koptu...", AP_WIDTH / 2 * scale, (AP_HEIGHT / 2 + 2) * scale);
  }

  const drawFinishedWin = (game: Game | undefined, canvas: HTMLCanvasElement, context: CanvasRenderingContext2D, scale: number, colorPalette: ColorPalette) => {
    if (!game || !canvas || !context) {return;}

    context.fillStyle = colorPalette.text;
    context.font = `${1.5 * scale}px Arial`;
    context.textAlign = 'center';
    context.fillText("ZAFER", AP_WIDTH / 2 * scale, AP_HEIGHT / 2 * scale);
  }

  const drawFinishedLose = (game: Game | undefined, canvas: HTMLCanvasElement, context: CanvasRenderingContext2D, scale: number, colorPalette: ColorPalette) => {
    if (!game || !canvas || !context) {return;}

    context.fillStyle = colorPalette.text;
    context.font = `${1.5 * scale}px Arial`;
    context.textAlign = 'center';
    context.fillText("BOZGUN", AP_WIDTH / 2 * scale, AP_HEIGHT / 2 * scale);
  }

  const listen = (game: Game | undefined, canvas: HTMLCanvasElement, context: CanvasRenderingContext2D) => {
    if (!game || !socket) {return;}

    const playerPaddle = game.playerPaddle;
    const opponentPaddle = game.opponentPaddle;

    window.addEventListener('resize', () => resizeCanvas(game, canvas, context));

    document.addEventListener('mousemove', (e) => {
      if (game.gameState === GameState.PLAYING) {
        const newY = (e.y - 175) / (canvas.width / AP_WIDTH);
        playerPaddle.position.y = newY;
        paddleControl(playerPaddle);
        if (playerPaddle.position.x < opponentPaddle.position.x) {
          socket.emit('playerOneMove', newY)
        }
        else {
          socket.emit('playerTwoMove', newY)
        }
      }
    });

    function isIntersect(pos: {x: number, y: number}, btn: Button, scale: number) {
      if ((pos.x >= btn.x * scale && pos.x < btn.x * scale + btn.width * scale) && (pos.y >= btn.y * scale && pos.y < btn.y * scale + btn.height * scale)) {
        return true;
      }
      return false;
    }

    canvas.addEventListener('mousemove', (e) => {
      buttons.forEach((bt) => {
        if (bt.states.includes(game.gameState)) {
          const collision: boolean = isIntersect({x: e.offsetX, y: e.offsetY}, bt, canvas.width / AP_WIDTH);
          if (collision && bt.hover === false) {
            bt.hover = true;
            requestAnimationFrame(() => draw(gameData));
          }
          else if (!collision && bt.hover === true) {
            bt.hover = false;
            requestAnimationFrame(() => draw(gameData));
          }
        }
      })
    });

    canvas.addEventListener('click', (e) => {
      buttons.forEach((bt) => {
        if (bt.states.includes(game.gameState)) {
          const collision: boolean = isIntersect({x: e.offsetX, y: e.offsetY}, bt, canvas.width / AP_WIDTH);
          if (collision && bt.active) {
            bt.onclick();
            requestAnimationFrame(() => draw(gameData));
          }
        }
      })
    })

  }

  const initialize = (game: Game | undefined) => {
    const canvas = canvasRef.current;
    if (!canvas || !currentUser) {return;}
    const context = canvas.getContext('2d');
    if (!context) {return;}

    resizeCanvas(game, canvas, context);
    listen(game, canvas, context);
  }

  const paddleControl = (paddle: Paddle) => { // Bu kısımın backendle aynı olması lazım
    if (paddle.position.y < 0.2) {
      paddle.position.y = 0.2;
    }
    else if (paddle.position.y + paddle.height > 8.8) {
      paddle.position.y = 8.8 - paddle.height;
    }
  }

  const resizeCanvas = (game: Game | undefined, canvas: HTMLCanvasElement, context: CanvasRenderingContext2D) => {
    const howBig: number = 85;

    let scaledWidth: number;
    let scaledHeight: number;
    const windowWidth = (window.innerWidth < 850) ? 850 : window.innerWidth;
    const windowHeight = (window.innerHeight < 500) ? 500 : window.innerHeight;
    if (AP_WIDTH / AP_HEIGHT > windowWidth / windowHeight) {
      scaledWidth = windowWidth / 100 * howBig;
      scaledHeight = scaledWidth * AP_HEIGHT / AP_WIDTH;
    }
    else {
      scaledHeight = windowHeight / 100 * howBig;
      scaledWidth = scaledHeight * AP_WIDTH / AP_HEIGHT;
    }

    canvas.width = scaledWidth;
    canvas.height = scaledHeight;

    requestAnimationFrame(() => draw(game));
  }

  useEffect(() => {
    if (!connectControl) {
      axios.get(`/game/join/${gameId}`).then((response) => {setConnectControl(response.data)})
    }
    if (connectControl && !currentUser) {
      axios.get(`/users/current`).then((response) => {setCurrentUser(response.data)});
    }
    if (currentUser && !socket) {
      setSocket(io(`${process.env.REACT_APP_BACKEND_URI}/game`, {query: {userId: currentUser.id, gameId: gameId}, forceNew: true}))
      io(`${process.env.REACT_APP_BACKEND_URI}/status`, {query: {userId: currentUser.id, status: "INGAME"}, forceNew: true})
    }
    if (socket && !socketListen) {
      socket.on("gameDataInitial", (data) => {
        // eslint-disable-next-line
        gameData = JSON.parse(data);
        if (gameData.playerPaddle.position.x < gameData.opponentPaddle.position.x) {
          setPlayerOneName(gameData.playerPaddle.name);
          setPlayerOneScore(gameData.playerPaddle.score);
          setPlayerTwoName(gameData.opponentPaddle.name);
          setPlayerTwoScore(gameData.opponentPaddle.score);
        }
        else {
          setPlayerTwoName(gameData.playerPaddle.name);
          setPlayerTwoScore(gameData.playerPaddle.score);
          setPlayerOneName(gameData.opponentPaddle.name);
          setPlayerOneScore(gameData.opponentPaddle.score);
        }
        initialize(gameData);
        socket.off("gameDataInitial");
      });
      socket.on("countdown", (data: number) => {
        gameData.countdown = data;
        requestAnimationFrame(() => draw(gameData));
      });
      socket.on("gameStarting", () => {
        gameData.gameState = GameState.STARTING;
      });
      socket.on("gamePaused", () => {
        gameData.gameState = GameState.PAUSED;
      });
      socket.on("gameStarted", () => {
        gameData.gameState = GameState.PLAYING;
      });
      socket.on("gameData", (data) => {
        const dataJSON = JSON.parse(data);
        gameData.ball.position.x = dataJSON.ball.x;
        gameData.ball.position.y = dataJSON.ball.y;
        gameData.opponentPaddle.position.y = dataJSON.opponentPaddle.y;
        if (dataJSON.hasOwnProperty('playerPaddle')) {
          gameData.playerPaddle.score = dataJSON.playerPaddle.score;
          gameData.opponentPaddle.score = dataJSON.opponentPaddle.score;
          if (gameData.playerPaddle.position.x < gameData.opponentPaddle.position.x) {
            setPlayerOneScore(gameData.playerPaddle.score);
            setPlayerTwoScore(gameData.opponentPaddle.score);
          }
          else {
            setPlayerOneScore(gameData.opponentPaddle.score);
            setPlayerTwoScore(gameData.playerPaddle.score);
          }
        }
        requestAnimationFrame(() => draw(gameData));
      });
      socket.on("opponentReady", () => {
        gameData.opponentPaddle.isReady = true;
        socket.off("opponentReady");
      });
      socket.on("gameAborted", () => {
        gameData.gameState = GameState.ABORTED;
        requestAnimationFrame(() => draw(gameData));
        socket.off("gameAborted");
        socket.disconnect();
      });
      socket.on("win", () => {
        gameData.gameState = GameState.FINISHEDWIN;
        requestAnimationFrame(() => draw(gameData));
        socket.off("win");
        socket.disconnect();
      });
      socket.on("lose", () => {
        gameData.gameState = GameState.FINISHEDLOSE;
        requestAnimationFrame(() => draw(gameData));
        socket.off("lose");
        socket.disconnect();
      });
      setSocketListen(true);
    }
  }, [connectControl, currentUser, socket])

  useEffect(() => {
  }, [playerOneName, playerOneScore, playerTwoName, playerTwoScore])
  
  if (connectControl) {
    return (
      <div className={`gameRoot ${cursorState ? '' : 'noCursor'}`}>
        <div className="gameTable">
          <ScoreBoard playerOneName={playerOneName} playerOneScore={playerOneScore} playerTwoName={playerTwoName} playerTwoScore={playerTwoScore}/>
          <canvas id="game" ref={canvasRef}></canvas>
        </div>
      </div>
    );
  }
  else {
    return (<PageNotFoundCmp/>)
  }
}

export default GameScreen;