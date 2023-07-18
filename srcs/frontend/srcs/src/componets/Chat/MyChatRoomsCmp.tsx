import axios from "axios"
import { useEffect, useState } from "react"
import { ChatRoom } from "../../dto/DataObject"
import { EmptyPage } from "../Friends/MyFriendsRoomCmp"

const MyChatRoomsCmp = () => {

    const [chatRooms, setChatRooms] = useState<Array<ChatRoom> | null>(null)

    useEffect(() => {
        if (!chatRooms)
            axios.get("/chat/room/mychatrooms").then((response) => setChatRooms(response.data))
    })

    const goChatScreenPage = (roomId: number) => {
        window.location.assign(`/chat/${roomId}`)
    }

    return (
        <>
            {
                !chatRooms || chatRooms?.length === 0 ? EmptyPage(300, 50)
                :
                    <>
                        <div style={{display: "block", overflowY: "scroll", height: "40vh"}}>
                            {
                                chatRooms?.map((value, index) => (
                                    <div onClick={() => goChatScreenPage(value.id)} key={index}>
                                        <div className="listViewDiv">
                                            <img style={{width: "60px"}} src={require("../../ui-design/images/team.png")} alt=""/>
                                            <div className="listViewInfoDiv">
                                                <div>Oda adı: {value.name}</div>
                                                <div>Durum: {value.roomStatus}</div>
                                                <div>Üye: {value.userCount} kişi</div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            }
                        </div>
                    </>
            }
        </>
    )
}

export default MyChatRoomsCmp