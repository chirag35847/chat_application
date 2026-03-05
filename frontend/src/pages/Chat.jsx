import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import ChatList from '../components/ChatList';
import ChatWindow from '../components/ChatWindow';
import { useNavigate } from 'react-router-dom';
import { logout } from '../api/auth';
import { getChats, markAsRead } from '../api/chat';
import NewChatModal from '../components/NewChatModal';
import ProfileModal from '../components/ProfileModal';
import { useSocket } from '../context/SocketContext';

const Chat = () => {
    const navigate = useNavigate();
    const [selectedChat, setSelectedChat] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [chats, setChats] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const socket = useSocket();

    const currentUserId = localStorage.getItem('userId');

    const formatChats = (rawChats) => {
        return rawChats.map(chat => {
            const otherUser = chat.isGroup
                ? null
                : chat.users.find(u => u.user.id !== currentUserId)?.user;

            const lastMessage = chat.messages ? chat.messages[0] : null;

            return {
                id: chat.id,
                name: chat.isGroup ? chat.name : (otherUser?.username || 'Unknown User'),
                lastMsg: lastMessage ? lastMessage.text : 'No messages yet',
                time: lastMessage ? new Date(lastMessage.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
                unread: chat.unreadCount || 0,
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

    // Socket logic
    useEffect(() => {
        if (!socket || !currentUserId) return;

        socket.emit('join_user', currentUserId);

        const handleNewChat = (newChat) => {
            // Check if chat already exists in list to avoid duplicates
            setChats(prev => {
                const exists = prev.find(c => c.id === newChat.id);
                if (exists) return prev;

                // Play new chat sound
                const audio = new Audio("/assets/audio/new-chat.mp3");
                audio.volume = 0.5;
                audio.play().catch(err => console.log('Audio autoplay blocked or failed:', err));

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
                return [formattedChat, ...prev];
            });
        };

        const handleReceiveMessage = (newMessage) => {
            const chatId = newMessage.chatId || newMessage.chat_id;
            const isMe = newMessage.senderId === currentUserId || newMessage.sender?.id === currentUserId;

            setChats(prev => {
                const chatIndex = prev.findIndex(c => c.id === chatId);
                if (chatIndex === -1) return prev;

                const updatedChats = [...prev];
                const chat = { ...updatedChats[chatIndex] };

                chat.lastMsg = newMessage.text;
                chat.time = new Date(newMessage.created_at || new Date()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                // Update unread count if not the selected chat and not sent by current user
                if (selectedChat?.id !== chatId && !isMe) {
                    chat.unread = (chat.unread || 0) + 1;
                } else if (selectedChat?.id === chatId && !isMe) {
                    // If we are already in the chat, mark the new message as read immediately on backend
                    markAsRead(chatId).catch(err => console.error("Failed to mark incoming message as read:", err));
                }

                updatedChats.splice(chatIndex, 1);
                return [chat, ...updatedChats];
            });
        };

        socket.on('new_chat', handleNewChat);
        socket.on('receive_message', handleReceiveMessage);

        return () => {
            socket.off('new_chat', handleNewChat);
            socket.off('receive_message', handleReceiveMessage);
        };
    }, [socket, currentUserId, selectedChat?.id]);

    const totalUnread = chats.reduce((acc, chat) => acc + (chat.unread || 0), 0);

    const handleSelectChat = (chat) => {
        setSelectedChat(chat);
        // Clear unread for the selected chat
        setChats(prev => prev.map(c => c.id === chat.id ? { ...c, unread: 0 } : c));
        // Call API to mark as read
        markAsRead(chat.id).catch(err => console.error("Failed to mark chat as read:", err));
    };

    const handleChatCreated = (newChat) => {
        // Formatted chat is already handled by handleNewChat socket event or we can handle it here for immediate UX
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

        // Ensure it's in the list (socket might have handled it but just in case)
        setChats(prev => {
            const exists = prev.find(c => c.id === newChat.id);
            if (exists) return prev;
            return [formattedChat, ...prev];
        });

        setSelectedChat(formattedChat);
    };

    return (
        <div className="flex h-screen w-full bg-[#0b141a] text-[#e9edef] selection:bg-indigo-500/30 overflow-hidden font-sans">
            <Sidebar
                unreadCount={totalUnread}
                onLogout={handleLogout}
                onProfileClick={() => setIsProfileOpen(true)}
            />
            <ChatList
                chats={chats}
                selectedChat={selectedChat}
                onSelectChat={handleSelectChat}
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

            <ProfileModal
                isOpen={isProfileOpen}
                onClose={() => setIsProfileOpen(false)}
                onLogout={handleLogout}
            />
        </div>
    );
};

export default Chat;
