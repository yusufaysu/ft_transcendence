import { useRef, useState } from "react"
import "../../ui-design/styles/CmpMix.css"
import { RoomStatus } from "../../dto/DataObject"
import axios from "axios"

const CreateChatRoomCmp = () => {

    const roomNameRef = useRef<HTMLInputElement>(null)
    const roomPassRef = useRef<HTMLInputElement>(null)
    const [roomStatus, setRoomStatus] = useState<RoomStatus>("PUBLIC")

    const createChatRoom = () => {

        const roomName = roomNameRef.current?.value
        const roomPass = roomPassRef.current?.value

        if ((roomName === "") || (roomStatus === "PROTECTED" && roomPass === ""))
            return

        const postData = { roomName: roomName, roomStatus: roomStatus, password: roomPass }
        axios.post("/chat/room/create", postData).then((response) => {
            window.location.assign(`/chat/${response.data.id}`)
        })
    }

    return (
        <>
            <div className="createRoomCenterDiv">
                <img style={{width: "100px"}} src={require("../../ui-design/images/team.png")} alt=""/>
                <select className="createRoomSelectMenu" onChange={event => setRoomStatus(event.target.value as RoomStatus)}>
                    <option>PUBLIC</option>
                    <option>PRIVATE</option>
                    <option>PROTECTED</option>
                </select>
                <input className="createRoomInput" ref={roomNameRef} type="text" placeholder="Oda Adı" />
                {
                    roomStatus === "PROTECTED" ?
                        <input className="createRoomInput" ref={roomPassRef} type="text" placeholder="Parola" />
                    :
                        null
                }
                <img className="createRoomOkeyImg" onClick={createChatRoom} src={require("../../ui-design/images/okey.png")} alt=""/>
            </div>
        </>
    )
}
export default CreateChatRoomCmp