import React from 'react';
import ChatListItem from './ChatListItem';
import ChatListHeader from './ChatListHeader';
import SearchBar from './SearchBar';

const ChatList = ({ chats, selectedChat, onSelectChat, searchQuery, setSearchQuery }) => {
    return (
        <div className="w-[400px] flex flex-col bg-[#111b21] border-r border-[#ffffff1a]">
            <div className="p-4 flex flex-col gap-4">
                <ChatListHeader />
                <SearchBar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar">
                {chats.map((chat) => (
                    <ChatListItem
                        key={chat.id}
                        chat={chat}
                        isSelected={selectedChat?.id === chat.id}
                        onClick={() => onSelectChat(chat)}
                    />
                ))}
            </div>
        </div>
    );
};

export default ChatList;
