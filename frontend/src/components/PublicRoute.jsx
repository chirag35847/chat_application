import { Navigate } from "react-router-dom";

const PublicRoute = ({children}) => {
    const token = localStorage.getItem("accessToken")

    if(token) {
        return <Navigate to='/chat'/>;
    }

    return children;
}

export default PublicRoute;