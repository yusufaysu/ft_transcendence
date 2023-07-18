import { useEffect, useState } from "react"
import useCurrentUser from "../../services/Auth"
import "../../ui-design/styles/CmpMix.css"
import { Stats, Tittle } from "../../dto/DataObject"
import axios from "axios"

export const calculateTittle = (level: number): Tittle => {
    if (level >= 11 )
        return ("ŞANLI")
    else if (level >= 8)
        return ("EFSANE")
    else if (level >= 5)
        return("BÜYÜKUSTA")
    else if (level >= 3)
        return("USTA")
    else
        return("ÇAYLAK")
}

const UserStatisticsCmp = () => {

    const currentUser = useCurrentUser()
    const [stats, setStats] = useState<Stats | null>(null)
    const [totalLose, setTotalLose] = useState<number | null>(null)
    const [winRate, setWinRate] = useState<number | null>(null)

    useEffect(() => {
        if (currentUser){

            setTotalLose(currentUser!!.totalGame - currentUser!!.totalWin)

            if (!stats)
                axios.get(`/users/stats/${currentUser.id}`).then(response => setStats(response.data))

            if (currentUser.totalGame !== 0)
                setWinRate((currentUser!!.totalWin / currentUser!!.totalGame) * 100)
            else
                setWinRate(0)
        }
    }, [currentUser, stats])

    return (
        <>
            <div style={{display: "flex", flexDirection: "column"}}>
                <div style={{display: "flex", flexDirection: "row", margin: "30px"}}>
                    <div style={{flex: 1}}>
                        <div style={{display: "flex", flexDirection: "row"}}>
                            <img className="img2" src={require("../../ui-design/images/all.png")} alt=""/>
                            <div className="text2">Toplam maç: {currentUser?.totalGame}</div>
                        </div>
                    </div>
                    <div style={{flex: 1}}>
                        <div style={{display: "flex", flexDirection: "row"}}>
                            <img className="img2" src={require("../../ui-design/images/win.png")} alt=""/>
                            <div className="text2">Kazanılan: {currentUser?.totalWin}</div>
                        </div>
                    </div>
                    <div style={{flex: 1}}>
                        <div style={{display: "flex", flexDirection: "row"}}>
                            <img className="img2" src={require("../../ui-design/images/lose.png")} alt=""/>
                            <div className="text2">Kaybedilen: {totalLose}</div>
                        </div>
                    </div>
                </div>
                <div style={{display: "flex", flexDirection: "row", margin: "30px"}}>
                    <div style={{flex: 1}}>
                        <div style={{display: "flex", flexDirection: "row"}}>
                            <img className="img2" src={require("../../ui-design/images/percent.png")} alt=""/>
                            <div className="text2">Kazanma oranı: {winRate}</div>
                        </div>
                    </div>
                    <div style={{flex: 1}}>
                        <div style={{display: "flex", flexDirection: "row"}}>
                            <img className="img2" src={require("../../ui-design/images/title.png")} alt=""/>
                            <div className="text2">Ünvan: {calculateTittle(stats?.level ? stats.level : 0)}</div>
                        </div>
                    </div>
                    <div style={{flex: 1}}>
                        <div style={{display: "flex", flexDirection: "row"}}>
                            <img className="img2" src={require("../../ui-design/images/rank.png")} alt=""/>
                            <div className="text2">Global sıralama: {stats?.globalRank}</div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}

export default UserStatisticsCmp