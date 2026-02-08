import apiClient from "./apiClient";

export const getChats = async () => {
    const response = await apiClient.get('/chat')
    return response.data;
}

export const createChat = async (userIds, name) => {
    const response = await apiClient.post('/chat', {userIds, name});
    return response.data;
}