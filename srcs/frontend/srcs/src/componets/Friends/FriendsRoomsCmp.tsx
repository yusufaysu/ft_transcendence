import { useState } from "react"
import "../../ui-design/styles/CmpMix.css"
import MyFriendsRoomCmp from "./MyFriendsRoomCmp"
import SearchUserCmp from "./SearchUserCmp"
import FriendsRequestCmp from "./FriendsRequestCmp"

const FriendsRoomsCmp = () => {

    const [friendsTab, setFriendsTab] = useState<JSX.Element>(<MyFriendsRoomCmp/>)

    return (
        <>
            <div className="roomsHeader">Kullanıcılar</div>

            <div className="roomsBodyDiv">
                <div style={{display: "flex", flexDirection: "row"}}>
                    <button className="roomsButton" onClick={() => setFriendsTab(<MyFriendsRoomCmp/>)}>Arkadaşlarım</button>
                    <button className="roomsButton" onClick={() => setFriendsTab(<FriendsRequestCmp/>)}>Arkadaşlık İstekleri</button>
                    <button className="roomsButton" onClick={() => setFriendsTab(<SearchUserCmp context="friends"/>)}>Kullanıcı ara</button>
                </div>
                <hr/>
                {friendsTab}
            </div>
        </>
    )
}

export default FriendsRoomsCmp