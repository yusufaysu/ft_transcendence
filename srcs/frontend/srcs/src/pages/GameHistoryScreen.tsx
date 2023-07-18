import { useEffect, useState } from "react"
import useCurrentUser from "../services/Auth"
import "../ui-design/styles/GameHistoryScreen.css"
import { FGameHistory, BGameHistory, User, Tittle } from "../dto/DataObject"
import axios from "axios"
import { calculateTittle } from "../componets/Header/UserStatisticsCmp"
import { EmptyPage } from "../componets/Friends/MyFriendsRoomCmp"
import { io } from "socket.io-client"
import PageNotFoundCmp from "../componets/PageNotFoundCmp"

export const historyView = (data: FGameHistory, userId: number, backBool: boolean) => {

    const goLookProfilePage = (userId: number) => {
        if (backBool)
            window.location.assign(`/profile/${userId}/history`)
    }

    return (
        <>
            <div className="historyDiv" >
                <div style={{flex: "1"}}>
                    <div style={{display: "flex", flexDirection: "row", alignItems: "center"}}>
                        <img className="historyRivalImg" onClick={() => goLookProfilePage(data.bGameHistory.playerOneId)} src={data.playerOneUser.photoUrl} alt=""/>
                        <div style={{fontSize: "1.5em", marginLeft: "10px"}}>
                            <div style={{marginBottom: "8px"}}>Ad: {data.playerOneUser.displayname}</div>
                            <div style={{marginTop: "8px"}}>Ünvan: {data.playerOneTittle}</div>
                        </div>
                    </div>
                </div>

                <div style={{margin: "10px"}}>
                    {
                        data.bGameHistory.winnerId === userId ?
                            <img style={{width: "100px"}} src={require("../ui-design/images/historyWin.png")} alt=""/>
                        :
                            <img style={{width: "100px"}} src={require("../ui-design/images/historyLose.png")} alt=""/>
                    }
                    <div style={{display: "flex", flexDirection: "row"}}>
                        <div className="skoreBox">{data.bGameHistory.playerOneScore}</div>
                        <div className="skoreBox">{data.bGameHistory.playerTwoScore}</div>
                    </div>
                </div>

                <div style={{flex: "1"}}>
                    <div style={{display: "flex", flexDirection: "row", justifyContent: "right", alignItems: "center"}}>    
                        <div style={{fontSize: "1.5em", marginRight: "15px"}}>
                            <div style={{marginBottom: "8px"}}>Ad: {data.playerTwoUser.displayname}</div>
                            <div style={{marginTop: "8px"}}>Ünvan: {data.playerTwoTittle}</div>
                        </div>
                        <img className="historyRivalImg" onClick={() => goLookProfilePage(data.bGameHistory.playerTwoId)} src={data.playerTwoUser.photoUrl} alt=""/>
                    </div>
                </div>
            </div>
        </>
    )
}

const GameHistoryCmp = () => {

    const currentUser = useCurrentUser()
    const [bGameHistory, setBGameHistory] = useState<Array<BGameHistory> | null>(null)
    const [fGameHistory, setFGameHistory] = useState<Array<FGameHistory> | null>(null)

    const setupFGameHistory = async () => {
        let fGameHistoryArray: Array<FGameHistory> = []
        for(const obj of bGameHistory!!){
            const playerOneUser: User = (await axios.get(`/users/getuser/${obj.playerOneId}`)).data
            const playerOneTittle: Tittle = calculateTittle((await axios.get(`/users/stats/${obj.playerOneId}`)).data.level)
            const playerTwoUser: User = await (await axios.get(`/users/getuser/${obj.playerTwoId}`)).data
            const playerTwoTittle: Tittle = calculateTittle((await axios.get(`/users/stats/${obj.playerTwoId}`)).data.level)
            fGameHistoryArray.push({
                bGameHistory: obj,
                playerOneUser: playerOneUser,
                playerOneTittle: playerOneTittle,
                playerTwoUser: playerTwoUser,
                playerTwoTittle: playerTwoTittle
            })
        }
        setFGameHistory(fGameHistoryArray)
    }

    useEffect(() => {

        if (currentUser)
            io(`${process.env.REACT_APP_BACKEND_URI}/status`, {query: {userId: currentUser!!.id, status: "ONLINE"}, forceNew: true})

        if (currentUser && !bGameHistory)
            axios.get(`/users/gamehistory/${currentUser.id}`).then(response => setBGameHistory(response.data))
        
        if (bGameHistory && !fGameHistory)
            setupFGameHistory()

        // eslint-disable-next-line
    }, [currentUser, bGameHistory, fGameHistory])

    const goHomePage = () => {
        window.location.assign("/home")
    }

    if (currentUser) {
        return (
            <>
                <div className="gameHistoryTabsDiv">
                    <img className="gameHistoryImgTabDiv" onClick={goHomePage} src={require("../ui-design/images/back.png")} alt=""/>
                    <div className="gameHistoryTextTabDiv">Maç Geçmişim</div>
                </div>
                {
                    !fGameHistory || fGameHistory?.length === 0 ?
                    EmptyPage(500, 200)
                    :
                        <div className="historyViewList">
                        {
                            fGameHistory?.map((value, index) => (
                                <div key={index}>
                                    {historyView(value, currentUser!!.id, true)}
                                </div>
                            ))
                        }
                    </div>
                }
            </>
        )
    }
    return (<PageNotFoundCmp/>)
}

export default GameHistoryCmp