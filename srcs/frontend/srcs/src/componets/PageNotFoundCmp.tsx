import { useEffect, useState } from "react"
import Lottie from "lottie-react"
import "../ui-design/styles/CmpMix.css"

const loading = (): JSX.Element => {
    return(
        <Lottie style={{width: "150px"}} animationData={require("../ui-design/animation/loading.json")} />   
    )
}

const notFound = (): JSX.Element => {
    return(
        <Lottie style={{width: "700px"}} animationData={require("../ui-design/animation/404.json")} />   
    )
}

const PageNotFoundCmp = () => {

    const [animation, setAnimation] = useState<JSX.Element>(loading)

    useEffect(() => {
        setInterval(() => setAnimation(notFound), 1000)
    }, [animation])

    return (
        <>
            <div className="centerDiv">
                {animation}
            </div>
        </>
    )
}

export default PageNotFoundCmp