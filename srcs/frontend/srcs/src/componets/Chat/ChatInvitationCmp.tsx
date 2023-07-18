import { useEffect, useState } from "react"
import { ChatInvitation } from "../../dto/DataObject"
import { EmptyPage } from "../Friends/MyFriendsRoomCmp"
import useCurrentUser from "../../services/Auth"
import axios from "axios"

const ChatInvitationCmp = () => {

    const currentUser = useCurrentUser()
    const [invitations, setInvitations] = useState<Array<ChatInvitation> | null>(null)

    useEffect(() => {
        if (currentUser && !invitations)
            axios.get(`/chat/${currentUser.id}/received-requests`).then(response => setInvitations(response.data))
    }, [currentUser, invitations])

    const rejectRequest = async (value: ChatInvitation) => {
        if ((await axios.post("/chat/reject", value)).data)
            setInvitations(invitations!!.filter(predicate => predicate !== value))
    }

    const acceptRequest = async (value: ChatInvitation) => {
        if ((await axios.post("/chat/accept", value)).data)
            window.location.assign(`/chat/${value.chatRoomId}`)
    }

    return (
        <>
            {
                !invitations || invitations?.length === 0 ? EmptyPage(300, 50)
                :
                    <>
                        <div style={{display: "block", overflowY: "scroll", height: "40vh"}}>
                            {
                                invitations?.map((value, index) => (
                                    <div key={index}>
                                        <div className="listViewDiv">
                                            <img style={{width: "60px"}} src={require("../../ui-design/images/team.png")} alt=""/>
                                            <div className="listViewInfoDiv">
                                                <div><span style={{fontWeight: "bold"}}>{value.senderName}, </span>seni <span style={{fontWeight: "bold"}}>{value.chatRoomName} </span>sohbet odasına davet etti.</div>
                                            </div>
                                            <img className="rejectImg" onClick={() => rejectRequest(value)} src={require("../../ui-design/images/reject.png")} alt=""/>
                                            <img className="acceptImg" onClick={() => acceptRequest(value)} src={require("../../ui-design/images/accept.png")} alt=""/>
                                        </div>
                                    </div>
                                ))
                            }
                        </div>
                    </>
            }
        </>
    )
}

export default ChatInvitationCmp