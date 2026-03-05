import apiClient from './apiClient';

export const searchUsers = async (query) => {
    const response = await apiClient.get('/user/search', { params: { username: query } });
    return response.data;
};

export const getProfile = async () => {
    const response = await apiClient.get('/user/me');
    return response.data;
};
