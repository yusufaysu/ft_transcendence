import { useEffect, useState } from "react"
import { Status, User, UserStatus } from "../../dto/DataObject"
import axios from "axios"
import Lottie from "lottie-react"
import { Socket, io } from "socket.io-client"
import useCurrentUser from "../../services/Auth"

export const EmptyPage = (width: number, top: number): JSX.Element => {
    return (
        <Lottie style={{marginLeft: "auto", marginRight: "auto", width: `${width}px`, marginTop: `${top}px`}} animationData={require("../../ui-design/animation/empty.json")}/>
    )
}

const MyFriendsRoomCmp = () => {

    const currentUser = useCurrentUser()
    const [usersInfo, setUsersInfo] = useState<Array<User> | null>(null)
    const [usersStatus, setUsersStatus] = useState<Array<UserStatus> | null>(null)
    const [socket, setSocket] = useState<Socket | null>(null)

    const getUserStatus = (userId: number): Status | undefined => {
        return (usersStatus?.find(predicate => predicate.id === userId)?.status)
    }

    const unFriend = (value: User) => {
        axios.post(`/friends/unfriend`, {userId: value.id}).then(() => {
            setUsersInfo(usersInfo!!.filter(predicate => predicate !== value))
        })
    }

    const goDirectMessagePage = (userId: number) => {
        window.location.assign(`/directmessage/${userId}`)
    }

    const goLookProfilePage = (userId: number) => {
        window.location.assign(`/profile/${userId}/home`)
    }
    
    useEffect(() => {

        if (currentUser && !socket)
            setSocket(io(`${process.env.REACT_APP_BACKEND_URI}/status`, {query: {userId: currentUser!!.id, status: "ONLINE"}, forceNew: true}))

        if (socket && !usersStatus)
            socket.on("usersOnline", (data) => setUsersStatus(data))

        if (!usersInfo)
            axios.get(`/friends/myfriends`).then( response => setUsersInfo(response.data))
            
    }, [currentUser, socket, usersInfo, usersStatus])

    return(
        <>
            {
                !usersInfo || usersInfo?.length === 0 ? EmptyPage(300, 50)
                :
                    <div style={{display: "block", overflowY: "scroll", height: "40vh"}}>
                        {
                            usersInfo?.map((value, index) => (
                                <div key={index}>
                                    <div className="listViewDiv">
                                        <img onClick={() => goLookProfilePage(value.id)} className="friendsAvatarImg" src={value.photoUrl} alt=""/>
                                        <div onClick={() => goDirectMessagePage(value.id)} className="listViewInfoDiv">
                                            <div>Ad: {value.displayname}</div>
                                            <div>Durum:
                                                {
                                                    getUserStatus(value.id) === "ONLINE" ? 
                                                        <span style={{color: "green"}}> Çevrimiçi</span>
                                                    :
                                                        getUserStatus(value.id) === "ATGAME" ?
                                                            <span style={{color: "blueviolet"}}> Oyunda</span>
                                                        :
                                                            <span style={{color: "red"}}> Çevrimdışı</span>
                                                }
                                            </div>
                                        </div>
                                        <img className="unFriendImg" onClick={() => unFriend(value)} src={require("../../ui-design/images/unfriend.png")} alt=""/>
                                    </div>
                                </div>
                            ))
                        }
                    </div>
            }
        </>
    )
}

export default MyFriendsRoomCmp