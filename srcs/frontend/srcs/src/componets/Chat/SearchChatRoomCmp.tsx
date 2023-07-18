import { useEffect, useRef, useState } from "react"
import { ChatRoom } from "../../dto/DataObject"
import axios from "axios"
import useCurrentUser from "../../services/Auth"

const SearchChatRoomCmp = () => {
    
    const currentUser = useCurrentUser()
    const roomPassRef = useRef<HTMLInputElement>(null)
    const [allChatRooms, setAllChatRooms] = useState<Array<ChatRoom> | null>(null)
    const [filterArray, setFilterArray] = useState<Array<ChatRoom>>([])
    const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null)
    const [warningMessage, setWarningMessage] = useState<string>("")

    useEffect(() => {
        if (!allChatRooms)
            axios.get("/chat/room/all").then(response => setAllChatRooms(response.data))
    }, [allChatRooms, filterArray])

    const onChangeText = (searchText: string) => {
        if (allChatRooms && searchText && searchText.length !== 0){
            const roomArray: Array<ChatRoom> = []
            allChatRooms.forEach((value) => {
                if (value.name.includes(searchText)){
                    if(!(currentUser?.chatRoomIds.includes(value.id)) && value.roomStatus !== "PRIVATE")
                        roomArray.push(value)
                }
            })
            setFilterArray(roomArray)
        }
        else
            setFilterArray([])
    }

    const joinRoom = () => {

        const roomPass = roomPassRef.current?.value

        if (selectedRoom!!.roomStatus === "PROTECTED" && roomPass === "")
            return setWarningMessage("Gerekli bilgiler boş olamaz !")

        const postData = { roomId: selectedRoom!!.id, password: roomPass }

        axios.post("/chat/room/join", postData).then((response) => {
            window.location.assign(`/chat/${response.data.id}`)
        }).catch((error) => {
            setWarningMessage(error.response.data.message)
            if (selectedRoom!!.roomStatus !== "PROTECTED")
                setSelectedRoom(null)
        })
    }

    const viewForProtected: JSX.Element = <>
        <div className="joinRoomCenterDiv">
            <img style={{width: "110px"}} src={require("../../ui-design/images/shield.png")} alt=","/>
            <div style={{marginTop: "20px", fontSize: "1.2em", color: "red"}}>{warningMessage}</div>
            <input className="joinRoomInput" ref={roomPassRef} type="text" placeholder="Parola"/>
            <div style={{display: "flex", flexDirection: "row"}}>
                <img className="joinRoomOkeyAndBackImg" onClick={() => { setSelectedRoom(null); setWarningMessage("") }} src={require("../../ui-design/images/back2.png")} alt=""/>
                <img className="joinRoomOkeyAndBackImg" onClick={() => joinRoom()} src={require("../../ui-design/images/okey.png")} alt=""/>
            </div>
        </div>
    </>

    return (
        <>
            {
                selectedRoom ?
                    selectedRoom.roomStatus === "PROTECTED" ?
                        viewForProtected
                    :
                        joinRoom()
                :
                    <>
                        <div className="searchBarBox">
                            <input className="searchBar" onChange={(event) => onChangeText(event.target.value)}  type="text" placeholder="Oda adı"/>
                            <img className="searchImg" src={require("../../ui-design/images/search.png")} alt=""/>
                        </div>

                        <div style={{textAlign: "center", marginBottom: "6px", fontSize: "1.2em", color: "red"}}>{warningMessage}</div>

                        <div style={{display: "block", overflowY: "scroll", height: "30vh"}}>
                            {
                                filterArray?.map((value, index) => (
                                    <div onClick={() => setSelectedRoom(value)} key={index}>
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

export default SearchChatRoomCmp