import "../ui-design/styles/LoginScreen.css"

const LoginScreen = () => {

    const login = async () => {
        window.location.assign(`${process.env.REACT_APP_BACKEND_URI}/auth/login`)
    }

    return (
        <>
            <div className="loginCenterDiv">
                <img className="loginLogo" src={require("../ui-design/images/logo.png")} alt=""/>
                <h1 className="loginHeader">Pong Oyuna Hoşgeldin !</h1>
                <button className="loginButton" onClick={login}>İntra Girişi</button>
            </div>
        </>
    )
}

export default LoginScreen