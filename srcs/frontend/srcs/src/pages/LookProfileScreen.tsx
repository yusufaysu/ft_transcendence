import { useParams } from "react-router-dom"
import "../ui-design/styles/LookProfileScreen.css"
import "../ui-design/styles/CmpMix.css"
import { BGameHistory, FGameHistory, Stats, Status, Tittle, User, UserStatus } from "../dto/DataObject"
import { useEffect, useState } from "react"
import axios from "axios"
import useCurrentUser from "../services/Auth"
import { historyView } from "./GameHistoryScreen"
import { timeSplit } from "./ChatScreen"
import { calculateTittle } from "../componets/Header/UserStatisticsCmp"
import { Socket, io } from "socket.io-client"
import PageNotFoundCmp from "../componets/PageNotFoundCmp"

const UserStatisticsCmp = (props: {data: User}) => {

    const [userStats, setUserStats] = useState<Stats | null>(null)
    const totalLose = props.data.totalGame - props.data.totalWin
    let winRate: number = 0
    
    if (props.data.totalGame !== 0)
        winRate = (props.data.totalWin / props.data.totalGame) * 100

    useEffect(() => {
        if (!userStats)
            axios.get(`/users/stats/${props.data.id}`).then(response => setUserStats(response.data))
        // eslint-disable-next-line
    }, [userStats])

    return (
        <>
            <div style={{display: "flex", flexDirection: "column"}}>
                <div style={{display: "flex", flexDirection: "row", margin: "30px"}}>
                    <div style={{flex: 1}}>
                        <div style={{display: "flex", flexDirection: "row"}}>
                            <img className="img2" src={require("../ui-design/images/all.png")} alt=""/>
                            <div className="text2">Toplam maç: {props.data.totalGame}</div>
                        </div>
                    </div>
                    <div style={{flex: 1}}>
                        <div style={{display: "flex", flexDirection: "row"}}>
                            <img className="img2" src={require("../ui-design/images/win.png")} alt=""/>
                            <div className="text2">Kazanılan: {props.data.totalWin}</div>
                        </div>
                    </div>
                    <div style={{flex: 1}}>
                        <div style={{display: "flex", flexDirection: "row"}}>
                            <img className="img2" src={require("../ui-design/images/lose.png")} alt=""/>
                            <div className="text2">Kaybedilen: {totalLose}</div>
                        </div>
                    </div>
                </div>
                <div style={{display: "flex", flexDirection: "row", margin: "30px"}}>
                    <div style={{flex: 1}}>
                        <div style={{display: "flex", flexDirection: "row"}}>
                            <img className="img2" src={require("../ui-design/images/percent.png")} alt=""/>
                            <div className="text2">Kazanma oranı: {winRate}</div>
                        </div>
                    </div>
                    <div style={{flex: 1}}>
                        <div style={{display: "flex", flexDirection: "row"}}>
                            <img className="img2" src={require("../ui-design/images/title.png")} alt=""/>
                            <div className="text2">Ünvan: {calculateTittle(userStats?.level ? userStats.level : 0)}</div>
                        </div>
                    </div>
                    <div style={{flex: 1}}>
                        <div style={{display: "flex", flexDirection: "row"}}>
                            <img className="img2" src={require("../ui-design/images/rank.png")} alt=""/>
                            <div className="text2">Global sıralama: {userStats?.globalRank}</div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}

const UserInfoCmp = (props: {data: User, socket: Socket}) => {
    
    const [usersStatus, setUsersStatus] = useState<Array<UserStatus> | null>(null)

    const getUserStatus = (userId: number): Status | undefined => {
        return (usersStatus?.find(predicate => predicate.id === userId)?.status)
    }

    useEffect(() => {
        if (!usersStatus)
            props.socket.on("usersOnline", (data) => setUsersStatus(data))
        // eslint-disable-next-line
    }, [usersStatus])
    
    return (
        <>
            <div style={{display: "flex", flexDirection: "column"}}>
                <div className="infoRowDiv">
                    <img className="img2" src={require("../ui-design/images/user.png")} alt=""/>
                    <div className="text2">Ad: {props.data?.displayname}</div>
                </div>

                <div className="infoRowDiv">
                    <img className="img2" src={require("../ui-design/images/nickname.png")} alt=""/>
                    <div className="text2">Kullanıcı adı: {props.data?.nickname}</div>
                </div>

                <div className="infoRowDiv">
                    <img className="img2" src={require("../ui-design/images/calendar.png")} alt=""/>
                    <div className="text2">Şu tarihten beri üye: {timeSplit(new Date(props.data.createdAt))}</div>
                </div>

                <div className="infoRowDiv">
                    <img className="img2" src={require("../ui-design/images/wifi-signal.png")} alt=""/>
                    <div className="text2">Durum: {
                        getUserStatus(props.data.id) === "ONLINE" ? 
                            <span style={{color: "green"}}> Çevrimiçi</span>
                        :
                            getUserStatus(props.data.id) === "ATGAME" ?
                                <span style={{color: "blueviolet"}}> Oyunda</span>
                            :
                                <span style={{color: "red"}}> Çevrimdışı</span>
                    }</div>
                </div>
            </div>
        </>
    )
}

const LookProfileScreen = () => {

    const currentUser = useCurrentUser()
    const { userId, backPage, backPageArg } = useParams()
    const [userInfo, setUserInfo] = useState<User | null>(null)
    const [tab, setTab] = useState<JSX.Element | null>(null)
    const [socket, setSocket] = useState<Socket | null>(null)
    const [userBGameHistory, setUserBGameHistory] = useState<Array<BGameHistory> | null>(null)
    const [userFGameHistory, setUserFGameHistory] = useState<Array<FGameHistory> | null>(null)
    const [blockStatus, setBlockStatus] = useState<boolean | null>(null)
    const [friendStatus, setFriendStatus] = useState<"friend" | "noFriend" | "waitRequest" | null>(null)

    const setupUserFGameHistory = async () => {
        let userFGameHistoryArray: Array<FGameHistory> = []
        for(const obj of userBGameHistory!!){
            const playerOneUser: User = (await axios.get(`/users/getuser/${obj.playerOneId}`)).data
            const playerOneTittle: Tittle = calculateTittle((await axios.get(`/users/stats/${obj.playerOneId}`)).data.level)
            const playerTwoUser: User = await (await axios.get(`/users/getuser/${obj.playerTwoId}`)).data
            const playerTwoTittle: Tittle = calculateTittle((await axios.get(`/users/stats/${obj.playerTwoId}`)).data.level)
            userFGameHistoryArray.push({
                bGameHistory: obj,
                playerOneUser: playerOneUser,
                playerOneTittle: playerOneTittle,
                playerTwoUser: playerTwoUser,
                playerTwoTittle: playerTwoTittle
            })
        }
        setUserFGameHistory(userFGameHistoryArray)
    }

    const backButton = () => {
        if (backPageArg)
            window.location.assign(`/${backPage}/${backPageArg}`)
        else {
            window.location.assign(`/${backPage}`)
        }
    }

    const addFriend = async () => {
        await axios.post(`/friends/send-request/${userInfo!!.id}`)
        setFriendStatus("waitRequest")
    }

    const unFriend = () => {
        axios.post(`/friends/unfriend`, {userId: userInfo!!.id}).then(() => {
            setFriendStatus("noFriend")
        })
    }

    const unblock = () => {
        axios.post("/users/unblockuser", {blockedUserId: userInfo!!.id}).then((response) => {
            if (response.data)
                setBlockStatus(false)
        })
    }

    const block = () => {
        axios.post("/users/blockuser", {blockedUserId: userInfo!!.id}).then((response) => {
            if (response.data)
                setBlockStatus(true)
        })
    }

    useEffect(() => {

        if (currentUser && !socket)
            setSocket(io(`${process.env.REACT_APP_BACKEND_URI}/status`, {query: {userId: currentUser!!.id, status: "ONLINE"}, forceNew: true}))

        if (!userInfo)
            axios.get(`/users/getuser/${userId}`).then((response) => setUserInfo(response.data))

        if (userInfo && socket && !tab)
            setTab(<UserInfoCmp data={userInfo} socket={socket}/>)
        
        if (userInfo && currentUser && !blockStatus){
            if (currentUser.blockedUserIds.includes(userInfo.id))
                setBlockStatus(true)
            else
                setBlockStatus(false)
        }

        if (currentUser && userInfo && !friendStatus){
            if (currentUser.friendIds.includes(userInfo.id))
                setFriendStatus("friend")
            else{
                axios.get(`/friends/${currentUser.id}/sent-requests`).then((response) => {
                    if (response.data.includes(userInfo.id))
                        setFriendStatus("waitRequest")
                    else
                        setFriendStatus("noFriend")
                })
            }
        }

        if (!userBGameHistory)
            axios.get(`/users/gamehistory/${userId}`).then(response => setUserBGameHistory(response.data))

        if (userBGameHistory && !userFGameHistory)
            setupUserFGameHistory()

        // eslint-disable-next-line
    }, [currentUser, socket, userInfo, tab, blockStatus, friendStatus, userBGameHistory, userFGameHistory])

    if (currentUser){
        return (
            <>
                <div style={{display: "flex", flexDirection: "column"}}>
                    <div style={{flex: "30vh"}}>
                        <div style={{display: "flex", flexDirection: "row"}}>
                            <img onClick={backButton} className="lookProfileImgTabDiv" src={require("../ui-design/images/back.png")} alt=""/>
                            <img className="lookProfileAvatarImg" src={userInfo?.photoUrl} alt=""/>
                            <div style={{flex: 1}}>
                                <div style={{display: "flex", flexDirection: "column"}}>
                                    <div>
                                        <div style={{display: "flex", flexDirection: "row"}}>
                                            <div className="lookProfileTextTabDiv" onClick={() => setTab(<UserInfoCmp data={userInfo!!} socket={socket!!}/>)}>Profil Bilgileri</div>
                                            <div className="lookProfileTextTabDiv" onClick={() => setTab(<UserStatisticsCmp data={userInfo!!}/>)}>İstatistikler</div>
                                            {
                                                friendStatus === "friend" ? 
                                                    <img onClick={unFriend} className="lookProfileImgTabDiv" src={require("../ui-design/images/unfriend-black.png")} alt=""/>
                                                :
                                                    friendStatus === "noFriend" ?
                                                        <img onClick={addFriend} className="lookProfileImgTabDiv" src={require("../ui-design/images/addfriend-black.png")} alt=""/>
                                                    : 
                                                        <img className="lookProfileImgTabDiv" src={require("../ui-design/images/hourglass.png")} alt=""/>
                                            }
                                            {
                                                blockStatus ? 
                                                    <img className="lookProfileImgTabDiv" onClick={unblock} src={require("../ui-design/images/unblock.png")} alt=""/>
                                                :
                                                    <img className="lookProfileImgTabDiv" onClick={block} src={require("../ui-design/images/block.png")} alt=""/>
                                            }
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
                        
                        <div className="lookProfileHistoryHeader">Son Oynanan Oyunlar</div>
                        
                        <div className="lookProfileHistoryViewList">
                            {
                                userFGameHistory?.map((value, index) => (
                                    <div key={index}>
                                        {historyView(value, userInfo!!.id, false)}
                                    </div>
                                ))
                            }
                        </div>
                    </div>
                </div>
            </>
        )
    }
    return (<PageNotFoundCmp/>)
}

export default LookProfileScreen