import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import ChatList from '../components/ChatList';
import ChatWindow from '../components/ChatWindow';
import { logout } from '../api/auth';
import { useNavigate } from 'react-router-dom';
import { getChats } from '../api/chat';
import NewChatModal from '../components/NewChatModal';

const Chat = () => {
    const [selectedChat, setSelectedChat] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [chats, setChats] = useState([]);
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const currentUserId = localStorage.getItem('userId');
    const [isModalOpen, setIsModalOpen] = useState(false);

    // const dummyInitialChats = [
    //     { id: 1, name: 'Alex Rivera', lastMsg: 'See you at the coffee shop!', time: '11:45 AM', unread: 2, avatar: 'AR', status: 'online' },
    //     { id: 2, name: 'Engineering Team', lastMsg: 'The production server is back up.', time: '10:30 AM', unread: 0, avatar: 'ET', status: '5 members' },
    //     { id: 3, name: 'Sarah Chen', lastMsg: 'Did you review the PR?', time: 'Yesterday', unread: 1, avatar: 'SC', status: 'online' },
    //     { id: 4, name: 'Mom', lastMsg: 'Don\'t forget to buy milk!', time: 'Yesterday', unread: 0, avatar: 'M', status: 'last seen recently' },
    //     { id: 5, name: 'Design Sync', lastMsg: 'Updated the figma files with new icons.', time: 'Monday', unread: 5, avatar: 'DS', status: '8 members' },
    //     { id: 6, name: 'Michael Scott', lastMsg: 'That\'s what she said!', time: 'Monday', unread: 0, avatar: 'MS', status: 'typing...' },
    //     { id: 7, name: 'Weekend Plans', lastMsg: 'Hiking on Saturday morning?', time: 'Sunday', unread: 0, avatar: 'WP', status: 'offline' },
    //     { id: 8, name: 'David Goggins', lastMsg: 'STAY HARD!', time: '05:00 AM', unread: 0, avatar: 'DG', status: 'online' },
    // ];

    // ojdnfvofemod

    const formatChats = (rawChats) => {
        console.log(rawChats)
        return rawChats.map(chat => {
            const otherUser = chat.isGroup ? null : chat.users.find(u=>u.user.id !== currentUserId)?.user;
            const lastMessage = chat.messages[0];

            return {
                id: chat.id,
                name: chat.isGroup ? chat.name : (otherUser?.username || 'Unknown User'),
                lastMsg: lastMessage ? lastMessage.text : "No messages yet",
                time: lastMessage ? new Date(lastMessage.created_at).toLocaleDateString([], {hour: '2-digit', minute: '2-digit'}): "",
                unread: 0, // TODO: implement this,
                avatar: chat.isGroup ? ( chat?.name?.substring(0,2).toUpperCase() || "G") : (otherUser?.username?.substring(0,2).toUpperCase() || "?"),
                status: chat.isGroup ? `${chat?.user?.length} members` : (otherUser?.isOnline ? 'online': 'offline'),
                isGroup: chat.isGroup,
                otherUser: otherUser
            }
        })
    }

    const fetchChats = async (query = '') => {
        try {
            setLoading(true);
            const response = await getChats();
            console.log(response)
            if(response.success) {
                let formatted = formatChats(response.data)
                if(query) {
                    formatted = formatted.filter(c => 
                        c.name.toLowercase().includes(query.toLowercase(query.toLowerCase()))
                    )
                }

                setChats(formatted);
            }
        } catch (error) {
            console.log('Error fetching chats:', error)
        } finally {
            setLoading(false);
        }
    }

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

    const handleLogout = async () => {
        try {
            await logout();
        } catch (error) {
            console.log("Logout error:", error);
        } finally {
            localStorage.removeItem("accessToken");
            localStorage.removeItem("refreshToken");
            localStorage.removeItem("userId");
            navigate("/login")
        }
    }

    const onNewChat = () => {
        setIsModalOpen(true)
    }

    const onChatCreated = (newChat) => {
        const otherUser = newChat.isGroup ? null : newChat.users.find(u => u.user.id !== currentUserId)?.user;

        const formattedChat = {
            id: newChat.id,
            name: newChat.isGroup ? newChat.name : (otherUser?.username || "Unknown User"),
            lastMsg: "no messages yet",
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            unread: 0,
            avatar: newChat.isGroup ? ( newChat?.name?.substring(0,2).toUpperCase() || "G") : (otherUser?.username?.substring(0,2).toUpperCase() || "?"),
            status: newChat.isGroup ? `${newChat.user.length} members` : (otherUser?.isOnline ? 'online': 'offline'),
            isGroup: newChat.isGroup,
            otherUser: otherUser
        }

        setChats(prev => [formattedChat, ...prev])
        setSelectedChat(formattedChat)
    }

    const totalUnread = chats.reduce((acc, chat) => acc + (chat.unread || 0), 0);

    return (
        <div className="flex h-screen w-full bg-[#0b141a] text-[#e9edef] selection:bg-indigo-500/30 overflow-hidden font-sans">
            <Sidebar unreadCount={totalUnread} onLogout={handleLogout} />
            <ChatList
                chats={chats}
                selectedChat={selectedChat}
                onSelectChat={setSelectedChat}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                onNewChat={onNewChat}
            />
            <ChatWindow
                selectedChat={selectedChat}
            />

            <NewChatModal
                isOpen={isModalOpen}
                onClose={()=>setIsModalOpen(false)}
                onChatCreated={onChatCreated}
            />

        </div>
    );
};

export default Chat;
