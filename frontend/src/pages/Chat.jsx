import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import ChatList from '../components/ChatList';
import ChatWindow from '../components/ChatWindow';
import { useNavigate } from 'react-router-dom';
import { logout } from '../api/auth';
import { getChats } from '../api/chat';
import NewChatModal from '../components/NewChatModal';

const Chat = () => {
    const navigate = useNavigate();
    const [selectedChat, setSelectedChat] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [chats, setChats] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const currentUserId = localStorage.getItem('userId');

    const formatChats = (rawChats) => {
        return rawChats.map(chat => {
            const otherUser = chat.isGroup
                ? null
                : chat.users.find(u => u.user.id !== currentUserId)?.user;

            const lastMessage = chat.messages[0];

            return {
                id: chat.id,
                name: chat.isGroup ? chat.name : (otherUser?.username || 'Unknown User'),
                lastMsg: lastMessage ? lastMessage.text : 'No messages yet',
                time: lastMessage ? new Date(lastMessage.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
                unread: 0, // TODO: Implement unread count
                avatar: chat.isGroup ? 'G' : (otherUser?.username?.substring(0, 2).toUpperCase() || '?'),
                status: chat.isGroup ? `${chat.users.length} members` : (otherUser?.isOnline ? 'online' : 'offline'),
                isGroup: chat.isGroup,
                otherUser: otherUser
            };
        });
    };

    const fetchChats = async (query = '') => {
        try {
            setLoading(true);
            const response = await getChats();
            if (response.success) {
                let formatted = formatChats(response.data);
                if (query) {
                    formatted = formatted.filter(c =>
                        c.name.toLowerCase().includes(query.toLowerCase())
                    );
                }
                setChats(formatted);
            }
        } catch (error) {
            console.error('Error fetching chats:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        try {
            await logout();
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('userId');
            navigate('/login');
        }
    };

    // Initial load
    useEffect(() => {
        fetchChats();
    }, []);

    // Search logic with debounce
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchChats(searchQuery);
        }, 300);

        return () => clearTimeout(timer);
    }, [searchQuery]);

    const totalUnread = chats.reduce((acc, chat) => acc + (chat.unread || 0), 0);

    const handleChatCreated = (newChat) => {
        fetchChats();
        // The api returns the full chat object. We need to format it like our chats state
        const otherUser = newChat.isGroup
            ? null
            : newChat.users.find(u => u.user.id !== currentUserId)?.user;

        const formattedChat = {
            id: newChat.id,
            name: newChat.isGroup ? newChat.name : (otherUser?.username || 'Unknown User'),
            lastMsg: 'No messages yet',
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            unread: 0,
            avatar: newChat.isGroup ? 'G' : (otherUser?.username?.substring(0, 2).toUpperCase() || '?'),
            status: newChat.isGroup ? `${newChat.users.length} members` : (otherUser?.isOnline ? 'online' : 'offline'),
            isGroup: newChat.isGroup,
            otherUser: otherUser
        };
        setSelectedChat(formattedChat);
    };

    return (
        <div className="flex h-screen w-full bg-[#0b141a] text-[#e9edef] selection:bg-indigo-500/30 overflow-hidden font-sans">
            <Sidebar unreadCount={totalUnread} onLogout={handleLogout} />
            <ChatList
                chats={chats}
                selectedChat={selectedChat}
                onSelectChat={setSelectedChat}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                onNewChat={() => setIsModalOpen(true)}
            />
            <ChatWindow
                selectedChat={selectedChat}
                currentUserId={currentUserId}
            />

            <NewChatModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onChatCreated={handleChatCreated}
            />
        </div>
    );
};

export default Chat;
