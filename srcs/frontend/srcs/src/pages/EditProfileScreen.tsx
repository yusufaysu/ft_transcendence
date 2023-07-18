import { User } from "../dto/DataObject"
import "../ui-design/styles/EditProfileScreen.css"
import React, { useEffect, useRef, useState } from "react"
import axios from "axios"
import PageNotFoundCmp from "../componets/PageNotFoundCmp"
import useCurrentUser from "../services/Auth"
import { io } from "socket.io-client"

const pathToFile = async (path: string, filename: string): Promise<File> => {
    const data = await (await fetch(path)).blob()
    return (new File([data], filename, {type: "image/png"}))
}

const avatarImgArray: Array<string> = [
    "avatar-1.png", "avatar-2.png",
    "avatar-3.png", "avatar-4.png",
    "avatar-5.png", "avatar-6.png",
    "avatar-7.png", "avatar-8.png",
    "avatar-9.png", "avatar-10.png",
    "avatar-11.png", "avatar-12.png",
    "avatar-13.png", "avatar-14.png",
    "avatar-15.png", "avatar-16.png",
    "avatar-17.png"
]

const EditProfileScreen = () => {

    const currentUser = useCurrentUser()
    const displaynameInputRef = useRef<HTMLInputElement>(null)
    const nicknameInputRef = useRef<HTMLInputElement>(null)
    const [localImgFile, setLocalImgFile] = useState<File | null>(null)
    const [previewImg, setPreviewImg] = useState<string | null>(null)
    const [warningMessage, setWarnnigMessage] = useState<string>("")

    const disableFirstLogin = async () => {
        const newUserInfo: Partial<User> = {
            id: currentUser?.id,
            firstLogin: false
        }
        await axios.put(`/users/update`, newUserInfo)
    }

    useEffect(() => {
        if (currentUser){
            displaynameInputRef.current!!.value = currentUser.displayname
            nicknameInputRef.current!!.value = currentUser.nickname
            setPreviewImg(currentUser.photoUrl)
            io(`${process.env.REACT_APP_BACKEND_URI}/status`, {query: {userId: currentUser.id, status: "ONLINE"}, forceNew: true})
            disableFirstLogin()
        }
        // eslint-disable-next-line
    }, [currentUser])

    const updateProfileInfo = async() => {

        const newNickname = nicknameInputRef.current!!.value
        const newDisplayname = displaynameInputRef.current!!.value

        if (newDisplayname !== "" && newNickname !== ""){

            const newUserInfo: Partial<User> = {
                id: currentUser?.id,
                displayname: newDisplayname,
                nickname: newNickname
            }
    
            await axios.put(`/users/update`, newUserInfo).then( async (resultCode) => {
                if(resultCode.data === true){

                    if (localImgFile != null){
                        const form = new FormData()
                        form.append("avatar", localImgFile)
                        await axios.post(`/users/upload/avatar`, form)
                    }
                    window.location.assign(`/home`)
                }else{
                    setWarnnigMessage("Bu nickname önceden alınmış !")
                }
            })
        }else {
            setWarnnigMessage("Gerekli bilgiler eksik olamaz !")
        }
    }

    const setImgData = async (event?: React.ChangeEvent<HTMLInputElement> | null, value?: string) => {
        if (event && event.target.files){
            setLocalImgFile(event.target.files[0])
            setPreviewImg(URL.createObjectURL(event.target.files[0]))
        }
        if (value){
            setPreviewImg(require(`../ui-design/images/avatar/${value}`))
            setLocalImgFile(await pathToFile(require(`../ui-design/images/avatar/${value}`), value))
        }
    }

    if(currentUser){
        return (
            <>
                <div className="previewDiv">
                    <img className="previewProfileImg" src={previewImg!!} alt=""/>
                    <div className="selectImgButton" >
                        <input className="hideInputView" onChange={event => setImgData(event)} type="file" accept="image/png, image/jpg, image/jpeg, image/webp"/>
                    </div>
                </div>
                <div className="warningMessage">{warningMessage}</div>
            
                <div className="avatarScroolDiv">
                    {
                        avatarImgArray.map((value, index) => (
                            <img className="avatarImgs" onClick={() => setImgData(null, value)} key={index} src={require("../ui-design/images/avatar/" + value)} alt=""/>
                        ))
                    }
                </div>
    
                <input className="inputBox" ref={displaynameInputRef} type="text" placeholder="Adınız:"/>
                <input className="inputBox" ref={nicknameInputRef} type="text" placeholder="Kullanıcı adınız:"/>
                <button className="editProfileSaveButton" onClick={updateProfileInfo}>Kaydet</button>
            </>
        )
    }
    else
        return(<PageNotFoundCmp/>)
}
export default EditProfileScreen