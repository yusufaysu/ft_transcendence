import { useEffect, useRef, useState } from "react"
import { ChatBan, ChatRoom, DirectMessage, Message, Point, RoomAuthority, RoomMember, RoomStatus, User } from "../dto/DataObject"
import Lottie from "lottie-react"
import "../ui-design/styles/ChatScreen.css"
import { useParams } from "react-router-dom"
import { Socket, io } from "socket.io-client"
import useCurrentUser from "../services/Auth"
import axios from "axios"
import SearchUserCmp from "../componets/Friends/SearchUserCmp"
import PageNotFoundCmp from "../componets/PageNotFoundCmp"

const allCommand = (socket: Socket, command: string, id?: number) => {
    if(id)
        socket.emit(command, id)
    else
        socket.emit(command)
}

const goLookProfilePage = (userId: number, roomId: string) => {
    window.location.assign(`/profile/${userId}/chat/${roomId}`)
}

const viewForNormal = (member: RoomMember, point: Point, socket: Socket, roomId: string): JSX.Element => {
    return (
        <>
            <div className="chatMenuDiv" style={{top: `${point.y}px`, left: `${point.x}px`}}>
                <div onClick={() => allCommand(socket, "gameInvite", member.user.id)} className="chatMenuListDiv">
                    <img style={{width: "25px"}} src={require("../ui-design/images/game-black.png")} alt=""/>
                    <div style={{marginLeft: "10px", fontSize: "1.2em"}}>Oyun isteği yolla</div>
                </div>
                <div onClick={() => goLookProfilePage(member.user.id, roomId)} className="chatMenuListDiv">
                    <img style={{width: "25px"}} src={require("../ui-design/images/eye.png")} alt=""/>
                    <div style={{marginLeft: "10px", fontSize: "1.2em"}}>Profili incele</div>
                </div>
                {
                    member.blocked ? 
                        <div onClick={() => allCommand(socket, "unBlockUser", member.user.id)} className="chatMenuListDiv">
                            <img style={{width: "25px"}} src={require("../ui-design/images/unblock.png")} alt=""/>
                            <div style={{marginLeft: "10px", fontSize: "1.2em"}}>Engeli kaldır</div>
                        </div>
                    :
                        <div onClick={() => allCommand(socket, "blockUser", member.user.id)} className="chatMenuListDiv">
                            <img style={{width: "25px"}} src={require("../ui-design/images/block.png")} alt=""/>
                            <div style={{marginLeft: "10px", fontSize: "1.2em"}}>Engelle</div>
                        </div>
                }
            </div>
        </>
    )
}

const viewForAdmin = (member: RoomMember, point: Point, socket: Socket, roomId: string): JSX.Element => {
    return (
        <>
            <div className="chatMenuDiv" style={{top: `${point.y}px`, left: `${point.x}px`}}>
                <div onClick={() => allCommand(socket, "gameInvite", member.user.id)} className="chatMenuListDiv">
                    <img style={{width: "25px"}} src={require("../ui-design/images/game-black.png")} alt=""/>
                    <div style={{marginLeft: "10px", fontSize: "1.2em"}}>Oyun isteği yolla</div>
                </div>
                <div onClick={() => goLookProfilePage(member.user.id, roomId)} className="chatMenuListDiv">
                    <img style={{width: "25px"}} src={require("../ui-design/images/eye.png")} alt=""/>
                    <div style={{marginLeft: "10px", fontSize: "1.2em"}}>Profili incele</div>
                </div>
                {
                    member.blocked ? 
                        <div onClick={() => allCommand(socket, "unBlockUser", member.user.id)} className="chatMenuListDiv">
                            <img style={{width: "25px"}} src={require("../ui-design/images/unblock.png")} alt=""/>
                            <div style={{marginLeft: "10px", fontSize: "1.2em"}}>Engeli kaldır</div>
                        </div>
                    :
                        <div onClick={() => allCommand(socket, "blockUser", member.user.id)} className="chatMenuListDiv">
                            <img style={{width: "25px"}} src={require("../ui-design/images/block.png")} alt=""/>
                            <div style={{marginLeft: "10px", fontSize: "1.2em"}}>Engelle</div>
                        </div>
                }
                {
                    member.muted ?
                        <div onClick={() => allCommand(socket, "unMuteUser", member.user.id)} className="chatMenuListDiv">
                            <img style={{width: "25px"}} src={require("../ui-design/images/unmute.png")} alt=""/>
                            <div style={{marginLeft: "10px", fontSize: "1.2em"}}>Susturmayı kaldır</div>
                        </div>
                    :
                        <div onClick={() => allCommand(socket, "muteUser", member.user.id)} className="chatMenuListDiv">
                            <img style={{width: "25px"}} src={require("../ui-design/images/mute.png")} alt=""/>
                            <div style={{marginLeft: "10px", fontSize: "1.2em"}}>Sustur  (30dk)</div>
                        </div>
                }
                <div onClick={() => allCommand(socket, "kickUser", member.user.id)} className="chatMenuListDiv">
                    <img style={{width: "25px"}} src={require("../ui-design/images/kick.png")} alt=""/>
                    <div style={{marginLeft: "10px", fontSize: "1.2em"}}>Çıkart</div>
                </div>
                <div  onClick={() => allCommand(socket, "banUser", member.user.id)} className="chatMenuListDiv">
                    <img style={{width: "25px"}} src={require("../ui-design/images/ban.png")} alt=""/>
                    <div style={{marginLeft: "10px", fontSize: "1.2em"}}>Banla</div>
                </div>
            </div>
        </>
    )
}

const viewForLeader = (member: RoomMember, point: Point, socket: Socket, roomId: string): JSX.Element => {
    return (
        <>
            <div className="chatMenuDiv" style={{top: `${point.y}px`, left: `${point.x}px`}}>
                <div onClick={() => allCommand(socket, "gameInvite", member.user.id)} className="chatMenuListDiv">
                    <img style={{width: "25px"}} src={require("../ui-design/images/game-black.png")} alt=""/>
                    <div style={{marginLeft: "10px", fontSize: "1.2em"}}>Oyun isteği yolla</div>
                </div>
                <div onClick={() => goLookProfilePage(member.user.id, roomId)} className="chatMenuListDiv">
                    <img style={{width: "25px"}} src={require("../ui-design/images/eye.png")} alt=""/>
                    <div style={{marginLeft: "10px", fontSize: "1.2em"}}>Profili incele</div>
                </div>
                {
                    member.blocked ? 
                        <div onClick={() => allCommand(socket, "unBlockUser", member.user.id)} className="chatMenuListDiv">
                            <img style={{width: "25px"}} src={require("../ui-design/images/unblock.png")} alt=""/>
                            <div style={{marginLeft: "10px", fontSize: "1.2em"}}>Engeli kaldır</div>
                        </div>
                    :
                        <div onClick={() => allCommand(socket, "blockUser", member.user.id)} className="chatMenuListDiv">
                            <img style={{width: "25px"}} src={require("../ui-design/images/block.png")} alt=""/>
                            <div style={{marginLeft: "10px", fontSize: "1.2em"}}>Engelle</div>
                        </div>
                }
                {
                    member.muted ?
                        <div onClick={() => allCommand(socket, "unMuteUser", member.user.id)} className="chatMenuListDiv">
                            <img style={{width: "25px"}} src={require("../ui-design/images/unmute.png")} alt=""/>
                            <div style={{marginLeft: "10px", fontSize: "1.2em"}}>Susturmayı kaldır</div>
                        </div>
                    :
                        <div onClick={() => allCommand(socket, "muteUser", member.user.id)} className="chatMenuListDiv">
                            <img style={{width: "25px"}} src={require("../ui-design/images/mute.png")} alt=""/>
                            <div style={{marginLeft: "10px", fontSize: "1.2em"}}>Sustur  (30dk)</div>
                        </div>
                }
                <div onClick={() => allCommand(socket, "kickUser", member.user.id)} className="chatMenuListDiv">
                    <img style={{width: "25px"}} src={require("../ui-design/images/kick.png")} alt=""/>
                    <div style={{marginLeft: "10px", fontSize: "1.2em"}}>Çıkart</div>
                </div>
                <div onClick={() => allCommand(socket, "banUser", member.user.id)} className="chatMenuListDiv">
                    <img style={{width: "25px"}} src={require("../ui-design/images/ban.png")} alt=""/>
                    <div style={{marginLeft: "10px", fontSize: "1.2em"}}>Banla</div>
                </div>
                {
                    member.authority === "ADMIN" ?
                        <div onClick={() => allCommand(socket, "unsetAdmin", member.user.id)} className="chatMenuListDiv">
                            <img style={{width: "25px"}} src={require("../ui-design/images/admin2.png")} alt=""/>
                            <div style={{marginLeft: "10px", fontSize: "1.2em"}}>Adminlikten çıkart</div>
                        </div>
                    :
                        <div onClick={() => allCommand(socket, "setAdmin", member.user.id)} className="chatMenuListDiv">
                            <img style={{width: "25px"}} src={require("../ui-design/images/admin.png")} alt=""/>
                            <div style={{marginLeft: "10px", fontSize: "1.2em"}}>Admin yap</div>
                        </div>
                }
                <div onClick={() => allCommand(socket, "handOverOwnership", member.user.id)} className="chatMenuListDiv">
                    <img style={{width: "25px"}} src={require("../ui-design/images/leader-change.png")} alt=""/>
                    <div style={{marginLeft: "10px", fontSize: "1.2em"}}>Liderliği aktar</div>
                </div>
            </div>
        </>
    )
}

const chatMenu = (currentUserAuthority: RoomAuthority, member: RoomMember, point: Point, socket: Socket, currentUser: User, roomId: string): JSX.Element => {
    
    if (currentUser.id === member.user.id)
        return (<></>)
    else if (currentUserAuthority === "LEADER")
        return (viewForLeader(member, point, socket, roomId))
    else if (currentUserAuthority === "ADMIN"){
        if (member.authority === "LEADER" || member.authority === "ADMIN")
            return (viewForNormal(member, point, socket, roomId))
        else
            return (viewForAdmin(member, point, socket, roomId))
    }
    else
        return (viewForNormal(member, point, socket, roomId))
}

const memberList = (member: RoomMember, socket: Socket) => {
    return (
        <>
            {
                member.gameInvite ?
                    <Lottie style={{width: "50px"}} animationData={require("../ui-design/animation/game.json")}/>
                :
                    <img style={{width: "50px", height: "50px", borderRadius: "25px", objectFit: "cover"}} src={member.user.photoUrl} alt=""/> 
            }
            
            <div style={{display: "flex", flexDirection: "column", marginLeft: "10px", marginTop: "4px"}}>

                <div style={{display: "flex", flexDirection: "row"}}>
                    <div style={{fontSize: "1.1em"}}>{member.user.displayname}</div>
                    {!member.gameInvite && member.muted && <img style={{width: "25px", height: "25px", marginLeft: "10px"}} src={require("../ui-design/images/muted.png")} alt=""/>}
                    {!member.gameInvite && member.blocked && <img style={{width: "25px", height: "25px", marginLeft: "10px"}} src={require("../ui-design/images/blocked.png")} alt=""/>}
                </div>
                {
                    member.status === "ONLINE" ? 
                        <div style={{fontSize: "1.1em", color: "green"}}>{member.status}</div>
                    :
                        <div style={{fontSize: "1.1em", color: "red"}}>{member.status}</div>
                }
            </div>
            {
                member.gameInvite ? 
                    <>
                        <img className="chatGameInviteRejectImg" onClick={() => allCommand(socket, "gameInviteReject")} src={require("../ui-design/images/reject.png")} alt=""/>
                        <img className="chatGameInviteAcceptImg" onClick={() => allCommand(socket, "gameInviteAccept", member.user.id)} src={require("../ui-design/images/accept.png")} alt=""/>
                    </>
                :
                    member.authority !== "NORMAL" ? 
                    <>
                        {
                            member.authority === "LEADER" ?
                                <img style={{width: "37.5px", height: "37.5px", marginRight: "10px", marginLeft: "auto"}} src={require("../ui-design/images/owner.png")} alt=""/>
                            :
                                <img style={{width: "37.5px", height: "37.5px", marginRight: "10px", marginLeft: "auto"}} src={require("../ui-design/images/admins.png")} alt=""/>
                        }
                    </>
                    :
                        null
            }
        </>
    )
}

const ChatSetting = (props: {data: ChatRoom}) => {

    const [roomStatus, setRoomStatus] = useState<RoomStatus>("PUBLIC")
    const roomNameInputRef = useRef<HTMLInputElement>(null)
    const roomPassInputRef = useRef<HTMLInputElement>(null)
    const selectRef = useRef<HTMLSelectElement>(null)

    const updateRoom = () => {

        const roomName = roomNameInputRef.current?.value
        const roomPass = roomPassInputRef.current?.value

        if (roomName === "" || (roomStatus === "PROTECTED" && roomPass === ""))
            return
        
        const postData = { roomId: props.data.id, roomName: roomName, roomStatus: roomStatus, password: roomPass }
        axios.post("/chat/room/update", postData).then((response) => {
            if (response.data === true)
                window.location.assign(`/chat/${props.data.id}`)
        })
    }

    useEffect(() => {
        setRoomStatus(props.data.roomStatus)
        selectRef.current!!.value = props.data.roomStatus as string
        roomNameInputRef.current!!.value = props.data.name
        // eslint-disable-next-line
    }, [])

    return (
        <>
            <div className="chatSettingsCenterDiv">
                <img style={{width: "200px", marginLeft: "auto", marginRight: "auto", display: "block"}} src={require("../ui-design/images/shield.png")} alt=""/>
                <select ref={selectRef} className="chatSettingsSelectDiv" value={roomStatus} onChange={event => setRoomStatus(event.target.value as RoomStatus)}>
                    <option>PUBLIC</option>
                    <option>PRIVATE</option>
                    <option>PROTECTED</option>
                </select>
                <input ref={roomNameInputRef} className="chatSettingsInput" type="text" placeholder="Oda Adı" />
                {
                    roomStatus === "PROTECTED" ?
                        <input ref={roomPassInputRef} className="chatSettingsInput" type="text" placeholder="Parola" />
                    :
                        null
                }
                <img onClick={updateRoom} className="chatSettingsNextImg" src={require("../ui-design/images/okey.png")} alt=""/>
            </div>
        </>
    )
}

const isMessageType = (obj: any): obj is Message => {
    return (obj.userDisplayname !== undefined ? true : false)
}

export const MessageUi = (direction: "right" | "left", message: Message | DirectMessage) => {

    const date = new Date(message.createdAt)
    const messageDate = date.getHours() + ":" + date.getMinutes()
    let messageInfo: string = ""
    
    if (isMessageType(message))
        messageInfo = message.userDisplayname + " - "
    messageInfo += messageDate

    if (direction === "right") {
        return (
            <>
                <div style={{display: "flex", justifyContent: "right"}}>
                    <div className="chatScreenMessageDiv" style={{backgroundColor: "steelblue", borderTopRightRadius: "0px"}}>
                        <div style={{wordBreak: "break-all",  fontSize: "1.4em"}}>{message.data}</div>
                        <div style={{textAlign: "right",  fontSize: "1.2em", marginTop: "10px"}}>{messageInfo}</div>
                    </div>
                </div>
            </>
        )
    }
    else {
        return (
            <>
                <div style={{display: "flex", justifyContent: "left"}}>
                    <div className="chatScreenMessageDiv" style={{backgroundColor: "rgb(176, 58, 58)", borderTopLeftRadius: "0px"}}>
                        <div style={{wordBreak: "break-all",  fontSize: "1.4em"}}>{message.data}</div>
                        <div style={{textAlign: "right",  fontSize: "1.2em", marginTop: "10px"}}>{messageInfo}</div>
                    </div>
                </div>
            </>
        )
    }
}

export const timeSplit = (date: Date): string => {
    return (`${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`)
}

const ChatAllBanList = (props: {socket: Socket}) => {

    const [bannedUsers, setBannedUsers] = useState<Array<ChatBan> | null>(null)

    useEffect(() => {
        allCommand(props.socket, "getBannedUsersInRoom")
        props.socket.on("bannedUsersInRoom", (data) => setBannedUsers(data))
        // eslint-disable-next-line
    }, [])

    return (
        <>
            <div className="chatAllBanListCenterDiv">
                
                <div className="chatAllBanListHeaderDiv">
                    <div className="chatAllBanListHeaderListDiv" style={{borderTopLeftRadius: "10px", borderBottomLeftRadius: "10px"}}>Full İsim</div>
                    <div className="chatAllBanListHeaderListDiv">Kullanıcı Adı</div>
                    <div className="chatAllBanListHeaderListDiv">Ban Tarihi</div>
                    <div className="chatAllBanListHeaderListDiv" style={{borderTopRightRadius: "10px", borderBottomRightRadius: "10px"}}></div>
                </div>

                <div className="chatAllBanListScrollDiv">
                    {
                        bannedUsers?.length === 0 ?
                            <div className="chatAllBanListUsersDiv">
                                <div className="chatAllBanListUserListDiv" style={{borderTopLeftRadius: "10px", borderBottomLeftRadius: "10px", wordBreak: "break-all"}}>-</div>
                                <div className="chatAllBanListUserListDiv" style={{wordBreak: "break-all"}}>-</div>
                                <div className="chatAllBanListUserListDiv">-</div>
                                <button className="chatAllBanListUnBanButton">Banı Kaldır</button>
                            </div>
                        :
                            bannedUsers?.map((value, index) => (
                                <div key={index} className="chatAllBanListUsersDiv">
                                    <div className="chatAllBanListUserListDiv" style={{borderTopLeftRadius: "10px", borderBottomLeftRadius: "10px", wordBreak: "break-all"}}>{value.userDisplayname}</div>
                                    <div className="chatAllBanListUserListDiv" style={{wordBreak: "break-all"}}>{value.userNickname}</div>
                                    <div className="chatAllBanListUserListDiv">{timeSplit(new Date(value.createdAt))}</div>
                                    <button onClick={() => allCommand(props.socket, "unBanUser", value.userId)} className="chatAllBanListUnBanButton">Banı Kaldır</button>
                                </div>
                            ))
                    }
                </div>
            </div>
        </>
    )
}

const ChatAddMember = (props: {chatRoomId: string, chatRoomUserIds: Array<number>}) => {
    return (
        <>
            <div  className="chatAddMemberCenterDiv">
                <SearchUserCmp context="chat" chatRoomId={props.chatRoomId} chatRoomUserIds={props.chatRoomUserIds}/>
            </div>
        </>
    )
}

const ChatScreen = () => {

    const currentUser = useCurrentUser()
    const [show, setShow] = useState<boolean>(false)
    const [point, setPoint] = useState<Point | null>(null)
    const [topBarButtonSelect, setTopBarButtonSelect] = useState<"messages" | "settings" | "banList" | "addMember">("messages")
    const { roomId } = useParams()
    const [usersIds, setUserIds] = useState<Array<number>>()
    const [usersInfo, setUsersInfo] = useState<Array<User>>()
    const [onlineIds, setOnlineIds] = useState<Array<number>>()
    const [adminIds, setAdminIds] = useState<Array<number>>()
    const [roomInfo, setRoomInfo] = useState<ChatRoom | null>(null)
    const [mutedIds, setMutedIds] = useState<Array<number>>()
    const [ownerId, setOwnerId] = useState<number | null>(null)
    const [incomingGameInviteId, setIncomingGameInviteId] = useState<number | null>(null)
    const [blockUserIds, setBlockUserIds] = useState<Array<number> | null>(null)
    const [members, setMembers] = useState<Array<RoomMember> | null>()
    const [currentUserAuthority, setCurrentUserAuthority] = useState<RoomAuthority | null>(null)
    const [socket, setSocket] = useState<Socket | null>(null)
    const [selectedContex, setSelectedContex] = useState<RoomMember | null>(null)
    const [allMessages, setAllMessages] = useState<Array<Message>>([])
    const [messages, setMessages] = useState<Array<Message>>([])
    const messageInputRef = useRef<HTMLInputElement>(null)
    const dummyRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (currentUser)
            io(`${process.env.REACT_APP_BACKEND_URI}/status`, {query: {userId: currentUser.id, status: "ONLINE"}, forceNew: true})
    }, [currentUser])

    const amIinTheGroup = () => {
        if (!(usersIds!!.includes(currentUser!!.id)))
            window.location.assign("/home")
    }

    const setupMembers = () => {
        
        const membersArray: Array<RoomMember> = []
        
        usersInfo!!.forEach((user) => {
            if (ownerId === user.id)
                membersArray.push({user: user, authority: "LEADER"})
            else if (adminIds!!.includes(user.id))
                membersArray.push({user: user, authority: "ADMIN"})
            else
                membersArray.push({user: user, authority: "NORMAL"})
        })
        
        membersArray.forEach((member) => {
            
            if (onlineIds!!.includes(member.user.id))
                member.status="ONLINE"
            else
                member.status="OFFLINE"

            if (mutedIds!!.includes(member.user.id))
                member.muted = true
            else
                member.muted = false
            
            if (blockUserIds!!.includes(member.user.id))
                member.blocked = true
            else
                member.blocked = false
            
            if (incomingGameInviteId && member.user.id === incomingGameInviteId)
                member.gameInvite = true
            else
                member.gameInvite = false
        })

        setMembers(membersArray)

        if (ownerId === currentUser!!.id)
            setCurrentUserAuthority("LEADER")
        else if (adminIds!!.includes(currentUser!!.id))
            setCurrentUserAuthority("ADMIN")
        else
            setCurrentUserAuthority("NORMAL")
    }

    const goHomePage = () => {
        window.location.assign("/home")
    }
    
    const sendMessage = () => {
        const data = messageInputRef.current?.value
        if (data !== "" && !(mutedIds?.includes(currentUser!!.id))){
            socket!!.emit("newMessageToServer", data)
            messageInputRef.current!!.value = ""
        }
    }

    const keyboardListener = (key: string) => {
        if (key === "Enter")
            sendMessage()
    }

    const leaveRoom = () => {
        allCommand(socket!!, "leaveRoom")
        goHomePage()
    }

    const topBarButtonSelectAlgorithm = (context: "settings" | "banList" | "addMember") => {
        if (context === "settings")
            topBarButtonSelect !== "settings" ? setTopBarButtonSelect("settings") : setTopBarButtonSelect("messages")
        else if (context === "banList")
            topBarButtonSelect !== "banList" ? setTopBarButtonSelect("banList") : setTopBarButtonSelect("messages")
        else if (context === "addMember")
            topBarButtonSelect !== "addMember" ? setTopBarButtonSelect("addMember") : setTopBarButtonSelect("messages")
    }

    useEffect(() => {

        dummyRef.current?.scrollIntoView({behavior: "smooth"})

        const eventListener = () => setShow(false)
        window.addEventListener("click", eventListener)

        if (!roomInfo)
            axios.get(`/chat/room/find/${roomId}`).then(response => setRoomInfo(response.data))

        if (currentUser && roomInfo) {
            if (!socket)
                setSocket(io(`${process.env.REACT_APP_BACKEND_URI}/chat`, {query: {userId: currentUser.id, roomId: roomId}, forceNew: true}))
        
            if (socket){
                socket.on("onlineUserIdsInRoom", (data) => setOnlineIds(data))
                socket.on("adminUserIdsInRoom", (data) => setAdminIds(data))
                socket.on("mutedUserIdsInRoom", (data) => setMutedIds(data))
                socket.on("ownerIdInRoom", (data) => setOwnerId(data))
                socket.on("allUsersInRoom", (data) => setUsersInfo(data))
                socket.on("allUserIdsInRoom", (data) => setUserIds(data))
                socket.on("allMessages", (data) => setAllMessages(data))
                socket.on("blockUserIds", (data) => setBlockUserIds(data))
                socket.on("incomingGameInvite", (data) => setIncomingGameInviteId(data))
                socket.on("gameBegin", (data) => window.location.assign(data))
            }

            if (allMessages && blockUserIds)
                setMessages(allMessages.filter(message => !(blockUserIds!!.includes(message.userId))))
            
            if (usersIds)
                amIinTheGroup()

            if(usersInfo && adminIds  && ownerId && onlineIds && mutedIds && blockUserIds)
                setupMembers()
        }

        return () => window.removeEventListener("click", eventListener)
        // eslint-disable-next-line
    }, [currentUser, roomInfo, socket, adminIds, usersInfo, mutedIds, ownerId, onlineIds, allMessages, usersIds, blockUserIds, incomingGameInviteId])

    if (currentUser){
        return (
            <>
                <div style={{display: "flex", flexDirection: "column"}}>
                    <div style={{display: "flex", flexDirection: "row", flex: "10vh", alignItems: "center"}} >
                        <img className="chatScreenBackImg" onClick={goHomePage} src={require("../ui-design/images/back.png")} alt=""/>
                        <div style={{display: "flex", flexDirection: "column"}}>
                            <div style={{color: "black", fontSize: "1.6em"}} >{roomInfo?.name}</div>
                            <div style={{color: "black", fontSize: "1.1em"}} >{members?.length} üye, {onlineIds?.length} çevrimiçi</div>
                        </div>
                        <div style={{marginRight: "50px", marginLeft: "auto", display: "flex", flexDirection: "row", alignItems: "center"}}>
                            {((ownerId === currentUser?.id || adminIds?.includes(currentUser!!.id)) && roomInfo?.roomStatus === "PRIVATE") && 
                                <img className="chatScreenTopBarImgs" onClick={() => topBarButtonSelectAlgorithm("addMember")} src={require("../ui-design/images/add-chat-user.png")} alt=""/>}
                            {(ownerId === currentUser?.id || adminIds?.includes(currentUser!!.id)) && <img className="chatScreenTopBarImgs" onClick={() => topBarButtonSelectAlgorithm("banList")} src={require("../ui-design/images/all-users-ban.png")} alt=""/>}
                            <img onClick={leaveRoom} className="chatScreenTopBarImgs" src={require("../ui-design/images/exit.png")} alt=""/>
                            {ownerId === currentUser?.id && <img className="chatScreenTopBarImgs" onClick={() => topBarButtonSelectAlgorithm("settings")} src={require("../ui-design/images/settings.png")} alt=""/>} 
                        </div>
                    </div>
                    <div style={{display: "flex", flexDirection: "row", flex: "90vh"}}>
                        <div style={{display: "flex", flexDirection: "column", flex: "3"}}>
                        
                            <div style={{display: "flex", flexDirection: "column", flex: "1"}}>
                                <div className="membersListBraceDiv">
                                    <img style={{width: "50px", height: "50px"}} src={require("../ui-design/images/team.png")} alt=""/>
                                    <div style={{color: "black", marginLeft: "10px"}}>Grup Üyeleri</div>
                                </div>
                                <div style={{height: "80vh", overflowX: "auto"}}>
                                    {
                                        members?.map((value, index) => (
                                            <div className="memberListDiv" key={index} onContextMenu={(context) => {
                                                context.preventDefault()
                                                setPoint({x: context.clientX, y: context.clientY})
                                                setShow(true)
                                                setSelectedContex(value)
                                                }}>
                                                {memberList(value, socket!!)}
                                            </div>
                                        ))
                                    }
                                    {show && chatMenu(currentUserAuthority!!, selectedContex!!, point!!, socket!!, currentUser!!, roomId!!)}
                                </div>
                            </div>
                        </div>

                        <div className="chatMessagesRoot">
                            {
                                topBarButtonSelect === "messages" ?
                                    <>
                                        <div style={{flex: "9"}}>
                                            <div style={{overflowX: "auto", height: "80vh"}}>
                                                {
                                                    messages.map((value, index) => (
                                                        <div key={index}>
                                                            {
                                                                value.userId === currentUser?.id ?
                                                                    MessageUi("right", value)
                                                                :
                                                                    MessageUi("left", value)
                                                            }
                                                        </div>
                                                    ))
                                                }
                                                <div ref={dummyRef}/>
                                            </div>
                                        </div>

                                        <div className="chatScreenLowerBar">
                                            <input onKeyDown={(event) => keyboardListener(event.key)} ref={messageInputRef} className="chatScreenInput" type="text" placeholder="Mesaj" />
                                            {
                                                mutedIds?.includes(currentUser!!.id) ?
                                                    <img className="chatScreenSendImg" src={require("../ui-design/images/nosend.png")} alt=""/>
                                                :
                                                    <img onClick={sendMessage} className="chatScreenSendImg" src={require("../ui-design/images/send.png")} alt=""/>
                                            }
                                        </div>
                                    </>
                                :
                                    topBarButtonSelect === "settings" ?
                                        <ChatSetting data={roomInfo!!}/>
                                    :
                                        topBarButtonSelect === "banList" ? 
                                            <ChatAllBanList socket={socket!!}/>
                                        :
                                            <ChatAddMember chatRoomId={roomId!!} chatRoomUserIds={usersIds!!}/>
                            }
                        </div>
                    </div> 
                </div>
            </>
        )
    }
    return (<PageNotFoundCmp/>)
}

export default ChatScreen