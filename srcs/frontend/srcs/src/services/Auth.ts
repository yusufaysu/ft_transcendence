import { useEffect, useState } from "react"
import { User } from "../dto/DataObject"
import axios from "axios"

const useCurrentUser = (): User | null => {
    const [ currentUser, setCurrentUser ] = useState<User | null>(null)

    useEffect(() => {
        axios.get(`/users/current`).then(response => setCurrentUser(response.data))
    }, [])
        
    return (currentUser)
}

export default useCurrentUser