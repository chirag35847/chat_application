import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import ChatList from '../components/ChatList';
import ChatWindow from '../components/ChatWindow';

const Chat = () => {
    const [selectedChat, setSelectedChat] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [chats, setChats] = useState([]);

    const dummyInitialChats = [
        { id: 1, name: 'Alex Rivera', lastMsg: 'See you at the coffee shop!', time: '11:45 AM', unread: 2, avatar: 'AR', status: 'online' },
        { id: 2, name: 'Engineering Team', lastMsg: 'The production server is back up.', time: '10:30 AM', unread: 0, avatar: 'ET', status: '5 members' },
        { id: 3, name: 'Sarah Chen', lastMsg: 'Did you review the PR?', time: 'Yesterday', unread: 1, avatar: 'SC', status: 'online' },
        { id: 4, name: 'Mom', lastMsg: 'Don\'t forget to buy milk!', time: 'Yesterday', unread: 0, avatar: 'M', status: 'last seen recently' },
        { id: 5, name: 'Design Sync', lastMsg: 'Updated the figma files with new icons.', time: 'Monday', unread: 5, avatar: 'DS', status: '8 members' },
        { id: 6, name: 'Michael Scott', lastMsg: 'That\'s what she said!', time: 'Monday', unread: 0, avatar: 'MS', status: 'typing...' },
        { id: 7, name: 'Weekend Plans', lastMsg: 'Hiking on Saturday morning?', time: 'Sunday', unread: 0, avatar: 'WP', status: 'offline' },
        { id: 8, name: 'David Goggins', lastMsg: 'STAY HARD!', time: '05:00 AM', unread: 0, avatar: 'DG', status: 'online' },
    ];

    // Simulated API call function
    const fetchChats = (query = '') => {
        // TODO: Replace with actual API call (e.g., axios.get('/chats', { params: { q: query } }))
        console.log(`API Call: Fetching chats ${query ? `with query: ${query}` : '(all)'}`);

        if (!query) {
            setChats(dummyInitialChats);
        } else {
            const filtered = dummyInitialChats.filter(c =>
                c.name.toLowerCase().includes(query.toLowerCase())
            );
            setChats(filtered);
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

    return (
        <div className="flex h-screen w-full bg-[#0b141a] text-[#e9edef] selection:bg-indigo-500/30 overflow-hidden font-sans">
            <Sidebar unreadCount={totalUnread} />
            <ChatList
                chats={chats}
                selectedChat={selectedChat}
                onSelectChat={setSelectedChat}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
            />
            <ChatWindow
                selectedChat={selectedChat}
            />

        </div>
    );
};

export default Chat;
