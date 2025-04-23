import axios from "axios";
import { endsWith, slice } from "lodash";

let BASE_URL = process.env.REACT_APP_API || "http://localhost:4000";
if (BASE_URL,endsWith("/")) {
    BASE_URL = BASE_URL/slice(0 , -1);
}

const api = axios.create({
    baseURL : BASE_URL,
    withCredentials: true,
})

export default api;
