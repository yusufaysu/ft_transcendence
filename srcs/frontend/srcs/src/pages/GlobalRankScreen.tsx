import { useEffect, useState } from "react"
import "../ui-design/styles/GlobalRankScreen.css"
import { ProgressBar } from "./AchievementsScreen"
import { GlobalRankUser } from "../dto/DataObject"
import axios from "axios"
import { io } from "socket.io-client"
import useCurrentUser from "../services/Auth"
import PageNotFoundCmp from "../componets/PageNotFoundCmp"

const RankViewList = (data: GlobalRankUser) => {

    const goLookProfilePage = (userId: number) => {
        window.location.assign(`/profile/${userId}/rank`)
    }

    return (
        <>
            <div className="rankViewDiv">

                {
                    data.globalRank === 1 ?
                        <img style={{width: "100px", height: "100px", marginRight: "10px"}} src={require("../ui-design/images/gold-medal.png")} alt=""/>
                    :
                        data.globalRank === 2 ?
                            <img style={{width: "100px", height: "100px", marginRight: "10px"}} src={require("../ui-design/images/silver-medal.png")} alt=""/>
                        :
                            data.globalRank === 3 ?
                                <img style={{width: "100px", height: "100px", marginRight: "10px"}} src={require("../ui-design/images/bronze-medal.png")} alt=""/>
                            :
                                <img style={{width: "100px", height: "100px", marginRight: "10px"}} src={require("../ui-design/images/normal-medal.png")} alt=""/>
                }
                <img className="globalRankUserImg" onClick={() => goLookProfilePage(data.id)} src={data.photoUrl} alt=""/>
                <div className="rankViewUserInfoDiv">
                    <div style={{display: "flex", flexDirection: "row", flex: 1}}>
                        <div style={{display: "flex", flexDirection: "row", alignItems: "center", flex: 1}}>
                            <img style={{width: "30px"}} src={require("../ui-design/images/user.png")} alt=""/>
                            <div style={{marginLeft: "10px", fontSize: "1.3em"}}>: {data.displayname}</div>
                        </div>
                        <div style={{display: "flex", flexDirection: "row", alignItems: "center", flex: 1}}>
                            <img style={{width: "30px"}} src={require("../ui-design/images/nickname.png")} alt=""/>
                            <div style={{marginLeft: "10px", fontSize: "1.3em"}}>: {data.nickname}</div>
                        </div>
                        <div style={{display: "flex", flexDirection: "row", alignItems: "center", flex: 1}}>
                            <img style={{width: "30px"}} src={require("../ui-design/images/title.png")} alt=""/>
                            <div style={{marginLeft: "10px", fontSize: "1.3em"}}>: {data.level} Level</div>
                        </div>
                        <div style={{display: "flex", flexDirection: "row", alignItems: "center", flex: 1}}>
                            <img style={{width: "30px"}} src={require("../ui-design/images/rank.png")} alt=""/>
                            <div style={{marginLeft: "10px", fontSize: "1.4em"}}>: {data.globalRank}</div>
                        </div>
                    </div>
                    <div style={{display: "flex", flexDirection: "row", alignItems: "center", flex: 1}}>
                        <ProgressBar height={30} percent={data.progression}/>
                        <img style={{width: "50px", marginLeft: "10px"}} src={require("../ui-design/images/level-up.png")} alt=""/>
                    </div>
                </div>
            </div>
        </>
    )
}

const GlobalRankScreen = () => {

    const currentUser = useCurrentUser()
    const [rankList, setRankList] = useState<Array<GlobalRankUser> | null>(null)

    const goHomePage = () => {
        window.location.assign("/home")
    }

    useEffect(() => {

        if (currentUser)
            io(`${process.env.REACT_APP_BACKEND_URI}/status`, {query: {userId: currentUser!!.id, status: "ONLINE"}, forceNew: true})

        if (!rankList)
            axios.get("/users/globalrank").then(response => setRankList(response.data))
    }, [currentUser, rankList])

    if (currentUser) {
        return (
            <>
                <div style={{display: "flex", flexDirection: "row", marginRight: "100px"}}>
                    <img className="rankImgTabDiv" onClick={goHomePage} src={require("../ui-design/images/back.png")} alt=""/>
                    <div className="rankTextTabDiv">Global Sıralama</div>
                </div>
    
                <div className="rankViewListDiv">
                    {
                        rankList?.map((value, index) => (
                            <div key={index}>
                                {RankViewList(value)}
                            </div>
                        ))
                    }
                </div>
            </>
        )
    }
    return (<PageNotFoundCmp/>)
}

export default GlobalRankScreen