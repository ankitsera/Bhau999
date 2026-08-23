import { API_URL } from "./variables"
import dayjs from "dayjs"

export const getToken = () => {
    const token = localStorage.getItem("token")
    return token
}
export const saveToken = (token) => {
    localStorage.setItem("token", token)
    localStorage.setItem("logged_at", dayjs())
}
export const removeToken = () => {
    localStorage.removeItem("token")
}
export const retrieveUser = async(id) => {
    try {
        let res = await fetch(`${API_URL}users/all-user-info/${id}/`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json"
            }
        })
        let data = await res.json()
        return data
    } catch (error) {
        console.log(error)
    }
}
