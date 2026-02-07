import apiClient from './apiClient';

export const login = async (credentials) => {
    const response = await apiClient.post('/user/login', credentials);
    return response.data;
};

export const register = async (userData) => {
    const response = await apiClient.post('/user/register', userData);
    return response.data;
};

export const logout = async () => {
    const response = await apiClient.post('/user/logout');
    return response.data;
};

export const refresh = async (refreshToken) => {
    const response = await apiClient.post('/user/refresh', { refreshToken });
    return response.data;
};
