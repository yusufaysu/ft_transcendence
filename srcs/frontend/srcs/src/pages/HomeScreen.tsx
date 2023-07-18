import { useEffect, useState } from "react"
import "../ui-design/styles/HomeScreen.css"
import UserInfoCmp from "../componets/Header/UserInfoCmp"
import axios from "axios"
import RandomMatchGameCmp from "../componets/Game/RandomMatchGameCmp"
import UserStatisticsCmp from "../componets/Header/UserStatisticsCmp"
import ChatRoomsCmp from "../componets/Chat/ChatRoomsCmp"
import FriendsRoomsCmp from "../componets/Friends/FriendsRoomsCmp"
import PageNotFoundCmp from "../componets/PageNotFoundCmp"
import { io } from "socket.io-client"
import useCurrentUser from "../services/Auth"

const HomeScreen = () => {

    const currentUser = useCurrentUser()
    const [tab, setTab] = useState<JSX.Element>(<UserInfoCmp/>)

    const goEditProfilePage = () => {
        window.location.assign(`/editprofile`)
    }

    const goMatchHistoryPage = () => {
        window.location.assign("/history")
    }

    const goGlobalRankPage = () => {
        window.location.assign("/rank")
    }

    const goAchievementsPage = () => {
        window.location.assign("/achievements")
    }

    const logout = () => {
        axios.get(`/auth/logout`).then(() => {
            window.location.assign("/")
        })
    }

    useEffect(() => {
        if (currentUser)
            io(`${process.env.REACT_APP_BACKEND_URI}/status`, {query: {userId: currentUser!!.id, status: "ONLINE"}, forceNew: true})
        // eslint-disable-next-line
    }, [currentUser])

    if (currentUser){
        return (
            <>
                <div style={{display: "flex", flexDirection: "column"}}>
                    <div style={{flex: "30vh"}}>
                        <div style={{display: "flex", flexDirection: "row"}}>
                            <div style={{width: "280px"}}>
                                <div style={{margin: "10px"}}>
                                    <img className="homeAvatarImg" src={currentUser.photoUrl} alt=""/>
                                    <img className="editProfileButton" onClick={goEditProfilePage} src={require("../ui-design/images/edit.png")} alt=""/>
                                </div>
                            </div>
                            <div style={{flex: 1}}>
                                <div style={{display: "flex", flexDirection: "column"}}>
                                    <div>
                                        <div style={{display: "flex", flexDirection: "row"}}>
                                            <div className="textTabDiv" onClick={() => setTab(<UserInfoCmp/>)}>Profil Bilgilerim</div>
                                            <div className="textTabDiv" onClick={() => setTab(<UserStatisticsCmp/>)}>İstatistiklerim</div>
                                            <img className="imgTabDiv" onClick={goMatchHistoryPage} src={require("../ui-design/images/history.png")} alt=""/>
                                            <img className="imgTabDiv" onClick={goAchievementsPage} src={require("../ui-design/images/achievements.png")} alt=""/>
                                            <img className="imgTabDiv" onClick={goGlobalRankPage} src={require("../ui-design/images/rank.png")} alt=""/>
                                            <img className="imgTabDiv" onClick={logout} src={require("../ui-design/images/logout.png")} alt=""/>
                                        </div>
                                    </div>
                                    <div>
                                        {tab}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div style={{flex: "70vh"}}>
                        <div style={{display: "flex", flexDirection: "row"}}>
                            <div className="roomsDiv">{<ChatRoomsCmp/>}</div>
                            <div className="roomsdiv">{<RandomMatchGameCmp/>}</div>
                            <div className="roomsDiv">{<FriendsRoomsCmp/>}</div>
                        </div>
                    </div>
                </div>
            </>
        )
    }
    else
        return (<PageNotFoundCmp/>)
}
export default HomeScreen