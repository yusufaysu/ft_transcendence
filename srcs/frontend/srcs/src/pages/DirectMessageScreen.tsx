import { useEffect, useRef, useState } from "react"
import "../ui-design/styles/DirectMessage.css"
import { useParams } from "react-router-dom"
import useCurrentUser from "../services/Auth"
import { Socket, io } from "socket.io-client"
import { DirectMessage, User } from "../dto/DataObject"
import { MessageUi } from "./ChatScreen"
import axios from "axios"
import Lottie from "lottie-react"
import PageNotFoundCmp from "../componets/PageNotFoundCmp"

const DirectMessageScreen = () => {

    const dummyRef = useRef<HTMLDivElement>(null)
    const currentUser = useCurrentUser()
    const messageInputRef = useRef<HTMLInputElement>(null)
    const { userId } = useParams() // karşı tarafın idsi
    const [blockIds, setBlockIds] = useState<Array<number> | null>(null)
    const [socket, setSocket] = useState<Socket | null>()
    const [gameInvite, setGameInvite] = useState<boolean>(false)
    const [allMessages, setAllMessages] = useState<Array<DirectMessage> | null>(null)
    const [receiverUser, setReceiverUser] = useState<User | null>(null)
    const [receiverStatus, setReceiverStatus] = useState<boolean | null>(null)

    const goHomePage = () => {
        window.location.assign("/home")
    }

    const sendMessage = () => {
        const message = messageInputRef.current?.value
        if (message !== "" && !(blockIds?.includes(currentUser!!.id))){
            socket!!.emit("sendDirectMessage", message)
            messageInputRef.current!!.value = ""
        }
    }

    const keyboardListener = (key: string) => {
        if (key === "Enter")
            sendMessage()
    }

    const block = () => {
        socket!!.emit("blockUser")
    }

    const unblock = () => {
        socket!!.emit("unBlockUser")
    }

    const gameInviteReject = () => {
        socket!!.emit("gameInviteReject")
    }

    const gameInviteAccept = () => {
        socket!!.emit("gameInviteAccept")
    }

    const sendGameInvite = () => {
        socket!!.emit("gameInvite")
    }

    const goLookProfilePage = (userId: number) => {
        window.location.assign(`/profile/${userId}/directmessage/${userId}`)
    }

    useEffect(() => {

        dummyRef.current?.scrollIntoView({behavior: "smooth"})

        if (!receiverUser)
            axios.get(`/users/getuser/${userId}`).then((response) => setReceiverUser(response.data))

        if (currentUser && !socket)
            setSocket(io(`${process.env.REACT_APP_BACKEND_URI}/directChat`, {query: {senderId: currentUser!!.id, receiverId: userId}, forceNew: true}))

        if (socket){
            socket.on("blockedUserIdsInRoom", (data) => setBlockIds(data))
            socket.on("allMessages", (data) => setAllMessages(data))
            socket.on("gameBegin", (data) => window.location.assign(data))
            socket.on("receiverStatus", (data) => setReceiverStatus(data))
            socket.on("incomingGameInvite", (data) => {
                if (!data)
                    setGameInvite(false)
                else if (data === currentUser?.id)
                    setGameInvite(true)
            })
        }

    }, [currentUser, socket, allMessages, receiverUser, blockIds, userId, receiverStatus])

    if (currentUser){
        return (
            <>
                <div style={{display: "flex", flexDirection: "column"}}>
                    <div style={{display: "flex", flexDirection: "row", flex: "10vh", alignItems: "center"}} >
                        <img className="directMessageBackImg" onClick={goHomePage} src={require("../ui-design/images/back.png")} alt=""/>
                        <img className="directMessageUserImg" onClick={() => goLookProfilePage(receiverUser!!.id)} src={receiverUser?.photoUrl} alt=""/>
                        <div style={{display: "flex", flexDirection: "column", marginLeft: "10px"}}>
                            <div style={{color: "black", fontSize: "1.6em"}} >{receiverUser?.displayname}</div>
                            <div style={{color: "black", fontSize: "1.1em"}} >
                                {
                                    receiverStatus ?
                                        <span style={{color: "green"}}>Çevrimiçi</span>
                                    :
                                        <span style={{color: "red"}}>Çevrimdışı</span>
                                }
                            </div>
                        </div>
                        {
                            gameInvite ? 
                                <div className="direcMessageGameInviteView">
                                    <img className="directMessageRejectImg" onClick={gameInviteReject} src={require("../ui-design/images/reject.png")} alt=""/>
                                    <Lottie style={{width: "80px"}} animationData={require("../ui-design/animation/game.json")}/>
                                    <img className="directMessageAcceptImg" onClick={gameInviteAccept} src={require("../ui-design/images/accept.png")} alt=""/>
                                </div>
                            :
                                null
                        }
                        {
                            blockIds?.includes(parseInt(userId!!)) ? 
                                <img className="directMessageBlockImg" onClick={unblock} src={require("../ui-design/images/unblock.png")} alt=""/>
                            :
                                <img className="directMessageBlockImg" onClick={block} src={require("../ui-design/images/block.png")} alt=""/>
                        }
                    </div>
                    <div style={{display: "flex", flexDirection: "row", flex: "90vh"}}>
                        <div className="directMessagesRoot">   
                            <div style={{flex: "9"}}>
                                <div style={{overflowX: "auto", height: "80vh"}}>
                                    {
                                        allMessages?.map((value, index) => (
                                            <div key={index}>
                                                {
                                                    value.senderId === currentUser?.id ?
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
                            <div className="directMessageLowerBar">
                                <img className="directMessageSendAndGameImg" onClick={sendGameInvite} src={require("../ui-design/images/game-request.png")} alt=""/>
                                <input onKeyDown={(event) => keyboardListener(event.key)} ref={messageInputRef} className="chatScreenInput" type="text" placeholder="Mesaj"/>
                                {
                                    blockIds?.includes(currentUser!!.id) ?
                                        <img className="directMessageSendAndGameImg" src={require("../ui-design/images/nosend.png")} alt=""/>  
                                    :
                                        <img onClick={sendMessage} className="directMessageSendAndGameImg" src={require("../ui-design/images/send.png")} alt=""/>    
                                }
                            </div>
                        </div>
                    </div> 
                </div>
            </>
        )
    }
    return (<PageNotFoundCmp/>)
}

export default DirectMessageScreen