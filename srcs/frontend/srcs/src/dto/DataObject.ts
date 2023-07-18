export interface User {
  id: number,
  createdAt: Date,
  firstLogin: boolean,
  displayname: string,
  email: string,
  nickname: string,
  photoUrl: string
  twoFactorEnabled: boolean,
  twoFactorSecret: string,
  twoFactorQrCode: string,
  totalGame: number,
  totalWin: number,  
  chatRoomIds: Array<number>,
  friendIds: Array<number>,
  blockedUserIds: Array<number>,
  pongShapeStyle: number,
  pongColorStyle: number
}
  
export interface ChatRoom {
  id: number,
  name: string,
  ownerId: number,
  roomStatus: RoomStatus,
  userCount: number
}
  
export interface Game {
  id: number,
  playerOneId: number,
  playerTwoId: number
}

export interface GlobalRankUser {
  id: number;
  photoUrl: string;
  displayname: string;
  nickname: string;
  level: number;
  progression: number;
  globalRank: number;
}

export interface BGameHistory {
  createdAt: Date,
  playerOneId: number,
  playerTwoId: number,
  winnerId: number,
  playerOneScore: number,
  playerTwoScore: number
}

export interface FGameHistory {
  bGameHistory: BGameHistory,
  playerOneUser: User,
  playerOneTittle: Tittle,
  playerTwoUser: User,
  playerTwoTittle: Tittle
}

export interface Achievements {
  name: string,
  description?: string,
  xp: number,
  percentage: number
}

export interface Stats {
  globalRank: number,
  level: number,
  progression: number,
  xp: number,
}

export interface UserStatus {
  id: number,
  status: Status
}

export type Tittle = "ÇAYLAK" | "USTA" | "BÜYÜKUSTA" | "EFSANE" | "ŞANLI"
  
export type Status = "ONLINE" | "OFFLINE" | "ATGAME" | "INGAME"

export type RoomStatus = "PRIVATE" | "PUBLIC" | "PROTECTED"

export type RoomAuthority = "LEADER" | "ADMIN" | "NORMAL"

export interface RoomMember {
  user: User,
  status?: Status,
  muted?: Boolean,
  blocked?: Boolean,
  authority: RoomAuthority,
  gameInvite?: boolean
}

export interface ChatInvitation {
  senderId: number,
  senderName: string,
  receiverId: number,
  chatRoomId: string,
  chatRoomName: string
}

export interface RequestData {
  receiverId: number,
  senderId: number
}

export interface Point {
  x: number, 
  y: number
}

export interface Message {
  chatroomId: string,
  createdAt: Date,
  data: string
  userId: number,
  userDisplayname: string
}

export interface ChatBan {
  userId: number,
  userDisplayname: string,
  userNickname: string,
  createdAt: Date,
  chatroomId: string,
}

export interface DirectMessage {
  data: string,
  senderId: number,
  createdAt: Date
}