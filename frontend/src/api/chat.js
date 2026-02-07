import apiClient from './apiClient';

export const getChats = async () => {
    const response = await apiClient.get('/chat');
    return response.data;
};

export const createChat = async (userIds, name) => {
    const response = await apiClient.post('/chat', { userIds, name });
    return response.data;
};

export const getMessages = async (chatId) => {
    const response = await apiClient.get('/chat/message', { params: { chatId } });
    return response.data;
};

export const sendMessage = async (formData) => {
    const response = await apiClient.post('/chat/message', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return response.data;
};
