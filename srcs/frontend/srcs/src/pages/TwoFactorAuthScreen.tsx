import Lottie from "lottie-react"
import "../ui-design/styles/TwoFactorAuthScreen.css"
import OTPInput from "react-otp-input"
import { useEffect, useState } from "react"
import axios from "axios"
import PageNotFoundCmp from "../componets/PageNotFoundCmp"

const TwoFactorAuthScreen = () => {

    const [otp, setOtp] = useState<string>("")
    const [twofaStatus, setTwofaStatus] = useState<boolean | null>(null)
    const [warningMessage, setWarningMesage] = useState<string>("")

    useEffect(() => {
        if (!twofaStatus)
            axios.get(`/auth/2fa/status`).then(response => setTwofaStatus(response.data))
    }, [twofaStatus])

    const twofaValidate = () => {
        if (otp.length === 6){
            axios.post(`/auth/2fa/validate`, {code: otp}).then((response) => {
                if (response.data === true)
                    window.location.assign(`${process.env.REACT_APP_BACKEND_URI}/auth/login`)
                else
                    setWarningMesage("Geçersiz kod")
            })
        }
        else
            setWarningMesage("Lütfen kodu eksiksiz giriniz")
    }

    if (twofaStatus){
        return (
            <>
                <div className="twofaCenterDiv">
                    <Lottie className="twofaAnimation" animationData={require("../ui-design/animation/shield.json")}/>
                    <div className="twofaWarninMessage">{warningMessage}</div>
                    <OTPInput inputStyle="twofaInput" inputType="number" value={otp} onChange={setOtp} numInputs={6} renderInput={(props) => <input {...props}/>}/>
                    <button className="twofaButton" onClick={twofaValidate}>Doğrula</button>
                </div>
            </>
        )
    }
    else
        return (<PageNotFoundCmp/>)
}

export default TwoFactorAuthScreen