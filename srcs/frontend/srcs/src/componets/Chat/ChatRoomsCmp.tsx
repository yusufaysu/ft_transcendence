import { useState } from "react"
import "../../ui-design/styles/CmpMix.css"
import CreateChatRoom from "./CreateChatRoomCmp"
import MyChatRoomsCmp from "./MyChatRoomsCmp"
import SearchChatRoomCmp from "./SearchChatRoomCmp"
import ChatInvitationCmp from "./ChatInvitationCmp"

const ChatRoomsCmp = () => {

    const [chatTab, setChatTab] = useState<JSX.Element>(<MyChatRoomsCmp/>)

    return (
        <>
            <div className="roomsHeader">Sohbet Odaları</div>
            
            <div className="roomsBodyDiv">
                <div style={{display: "flex", flexDirection: "row"}}>
                    <button className="roomsButton" onClick={() => setChatTab(<MyChatRoomsCmp/>)}>Odalarım</button>
                    <button className="roomsButton" onClick={() => setChatTab(<ChatInvitationCmp/>)}>Davetiyeler</button>
                    <button className="roomsButton" onClick={() => setChatTab(<SearchChatRoomCmp/>)}>Oda ara</button>
                    <button className="roomsButton" onClick={() => setChatTab(<CreateChatRoom/>)}>Oda Kur</button>
                </div>
                <hr/>
                {chatTab}
            </div>
        </>
    )
}

export default ChatRoomsCmp