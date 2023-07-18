import { useEffect, useState } from "react"
import "../ui-design/styles/AchievementsScreen.css"
import { Achievements, Stats } from "../dto/DataObject"
import axios from "axios"
import useCurrentUser from "../services/Auth"
import { io } from "socket.io-client"
import PageNotFoundCmp from "../componets/PageNotFoundCmp"

export const ProgressBar = (props: {height: number, percent?: number}) => {

    let barPercent: number = props.percent ? props.percent : 0

    if (barPercent < 10)
        barPercent = 10
    
    const lowerBar = {
        width: "100%",
        height: `${props.height / 3}px`,
        backgroundColor: "whitesmoke",
        borderRadius: `${props.height / 6}px`
    }

    const topBar = {
        width: `${barPercent}%`,
        color:"white",
        fontSize: "1.3em",
        display: "flex",
        justifyContent: "center",
        height: `${props.height}px`,
        alignItems: "center",
        backgroundColor: "blueviolet",
        marginTop: `-${props.height / 3}px`,
        borderRadius: `${props.height / 2}px`
    }

    return (
        <>
            <div style={lowerBar}>
                <div style={topBar}>{props.percent + "%"}</div>
            </div>
        </>
    )
}

const AchievementsViewList = (data: Achievements) => {
    return (
        <>
            <div className="achievementsViewDiv">
                <img style={{width: "150px"}} src={require("../ui-design/images/medal.png")} alt=""/>
                <div style={{display: "flex", flexDirection: "column", flex: 1}}>
                    <div style={{fontSize: "1.5em"}}><span style={{fontWeight: "bold"}}>Ad:</span> {data.name}</div>
                    <div style={{marginTop: "4px", fontSize: "1.5em"}}><span style={{fontWeight: "bold"}}>Açıklama:</span> {data.description}</div>
                    <div style={{marginTop: "4px", fontSize: "1.5em"}}><span style={{fontWeight: "bold"}}>Exp:</span> {data.xp}</div>
                    <div style={{display: "flex", flexDirection: "row", alignItems: "center"}}>
                        <ProgressBar height={35} percent={data.percentage}/>
                        <img style={{width: "50px", marginLeft: "10px"}} src={require("../ui-design/images/finish.png")} alt=""/>
                    </div>
                </div>
            </div>
        </>
    )
}

const AchievementsScreen = () => {

    const currentUser = useCurrentUser()
    const [achievementsList, setAchievementsList] = useState<Array<Achievements> | null>(null)
    const [stats, setStats] = useState<Stats | null>(null)

    useEffect(() => {

        if (currentUser)
            io(`${process.env.REACT_APP_BACKEND_URI}/status`, {query: {userId: currentUser!!.id, status: "ONLINE"}, forceNew: true})

        if (currentUser && !achievementsList)
            axios.get(`/users/achievements/${currentUser.id}`).then(response => setAchievementsList(response.data))

        if (currentUser && !stats)
            axios.get(`/users/stats/${currentUser.id}`).then(response => setStats(response.data))
    
    }, [currentUser, achievementsList, stats])

    const goHomePage = () => {
        window.location.assign("/home")
    }

    if (currentUser){
        return (
            <>
                <div style={{display: "flex", flexDirection: "row", marginRight: "100px"}}>
                    <img className="achievementsImgTabDiv" onClick={goHomePage} src={require("../ui-design/images/back.png")} alt=""/>
                    <div className="achievementsTextTabDiv">Başarılarım</div>
                </div>
    
                <div className="achievementsHeaderDiv">
                    <div style={{display: "flex", flexDirection: "row"}}>
                        <div className="achievementsHeaderRowDiv">
                            <img style={{width: "30px"}} src={require("../ui-design/images/title.png")} alt=""/>
                            <div style={{marginLeft: "10px", fontSize: "1.4em"}}>Level: {stats?.level}</div>
                        </div>
                        <div className="achievementsHeaderRowDiv">
                            <img style={{width: "30px"}} src={require("../ui-design/images/rank.png")} alt=""/>
                            <div style={{marginLeft: "10px", fontSize: "1.4em"}}>Global Sıralama: {stats?.globalRank}</div>
                        </div>
                    </div>
                    <div style={{display: "flex", flexDirection: "row", alignItems: "center", marginTop: "10px"}}>
                        <ProgressBar height={50} percent={stats?.progression}/>
                        <img style={{width: "60px", marginLeft: "10px"}} src={require("../ui-design/images/level-up.png")} alt=""/>
                    </div>
                </div>
    
                <div className="achievementsListDiv">
                    {
                        achievementsList?.map((value, index) => (
                            <div key={index}>
                                {AchievementsViewList(value)}
                            </div>
                        ))
                    }
                </div>
            </>
        )
    }
    return (<PageNotFoundCmp/>)
}

export default AchievementsScreen