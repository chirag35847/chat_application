import axios from 'axios';

const apiClient = axios.create({
    baseURL: 'http://localhost:8000',
    headers: {
        'Content-Type': 'application/json',
    }
})


apiClient.interceptors.request.use((config) => {
    const token = localStorage.getItem('accessToken');
    if(token) {
        config.headers.Authorization = token;
    }
    return config;
})

// /user/refresh -> 401 ( refresh token expired ) -> /user/refresh -> 401 -> /user/refresh -> 401 -> /user/refresh

apiClient.interceptors.response.use((response) => response, async (error) => {
    const originalReq = error.config;
    if(error.response?.status === 401 && !originalReq._retry && originalReq.url !== '/user/refresh'){
        const refreshToken = localStorage.getItem('refreshToken');
        if(!refreshToken) {
            handleLogout();
            return Promise.reject(error);
        }

        try {
            const response = await axios.post(`http://localhost:8000/user/refresh`, {
                refreshToken
            })

            if (response.data.success) {
                const accessToken = response.data.data;
                localStorage.setItem('accessToken', accessToken);
                apiClient.defaults.headers.common['Authorization'] = accessToken; 
                originalReq.headers['Authorization'] = accessToken;
                return apiClient(originalReq);
            } else {
                handleLogout();
                return Promise.reject(error);
            }
        } catch (error) {
            handleLogout();
            return Promise.reject(error);
        }
    }

    return Promise.reject(error);
})


const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userId');
    if(window.location.pathname!=='/login') {
        window.location.href = "/login";
    }
}

export default apiClient;