import { useEffect, useState } from "react"
import { User } from "../../dto/DataObject"
import axios from "axios"
import useCurrentUser from "../../services/Auth"

const SearchUserCmp = (props: {context: "friends" | "chat", chatRoomId?: string, chatRoomUserIds?: Array<number>}) => {

    const currentUser = useCurrentUser()
    const [allUsers, setAllUsers] = useState<Array<User> | null>()
    const [filterArray, setFilterArray] = useState<Array<User>>([])

    const onChangeText = (searchText: string) => {
        if (allUsers && searchText && searchText.length !== 0){
            const userArray: Array<User> = []
            allUsers.forEach((value) => {
                if (value.nickname.includes(searchText) && value.id !== currentUser?.id){
                    if(props.context === "friends" && !currentUser?.friendIds.includes(value.id))
                        userArray.push(value)
                    else if (props.context === "chat" && !props.chatRoomUserIds?.includes(value.id))
                        userArray.push(value)
                }
            })
            setFilterArray(userArray)
        }
        else
            setFilterArray([])
    }

    const sendRequestOrInvitations = async (value: User) => {
        
        setFilterArray(filterArray.filter(predicate => predicate !== value))
        
        if (props.context === "friends")
            await axios.post(`/friends/send-request/${value.id}`)
        else
            await axios.post(`/chat/send-request/${value.id}/${props.chatRoomId}`)
    }

    const goLookProfilePage = (userId: number) => {
        if (props.context === "friends")
            window.location.assign(`/profile/${userId}/home`)
        else
            window.location.assign(`/profile/${userId}/chat/${props.chatRoomId}`)
    }

    useEffect(() => {
        if (!allUsers)
            axios.get(`/users/`).then(response => setAllUsers(response.data))
    }, [allUsers, filterArray])

    return (
        <>
            <div className="searchBarBox">
                <input onChange={event =>  onChangeText(event.target.value)} className="searchBar" type="text" placeholder="Kullanıcı adı"/>
                <img className="searchImg" src={require("../../ui-design/images/search.png")} alt=""/>
            </div>

            <div style={{display: "block", overflowY: "scroll", height: "30vh", marginTop: "10px"}}>
                {
                    filterArray?.map((value, index) => (
                        <div key={index}>
                            <div className="listViewDiv">
                                <img onClick={() => goLookProfilePage(value.id)} className="friendsAvatarImg" src={value.photoUrl} alt=""/>
                                <div className="listViewInfoDiv">
                                    <div>Ad: {value.displayname}</div>
                                    <div>Nickname: {value.nickname}</div>
                                </div>
                                {
                                    props.context === "friends" ? 
                                        <img className="addFriendImg" onClick={() => sendRequestOrInvitations(value)} src={require("../../ui-design/images/addfriend.png")} alt=""/>
                                    :
                                        <img className="addFriendImg" onClick={() => sendRequestOrInvitations(value)} src={require("../../ui-design/images/addfriend-black.png")} alt=""/>
                                }
                            </div>
                        </div>
                    ))
                }
            </div>
        </>
    )
}

export default SearchUserCmp