import React from 'react';
import { Search as SearchIcon, MoreVertical } from 'lucide-react';

const ChatHeader = ({ selectedChat }) => {
    if (!selectedChat) return null;

    return (
        <div className="h-16 bg-[#202c33] flex items-center px-4 gap-4 border-b border-[#ffffff1a]">
            <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center font-bold">
                {selectedChat.avatar}
            </div>
            <div className="flex-1">
                <h2 className="font-semibold">{selectedChat.name}</h2>
                <p className="text-xs text-[#8696a0]">{selectedChat.status || 'offline'}</p>
            </div>
            <div className="flex gap-6 text-[#d1d7db]">
                <SearchIcon className="w-5 h-5 cursor-pointer hover:text-white transition-colors" />
                <MoreVertical className="w-5 h-5 cursor-pointer hover:text-white transition-colors" />
            </div>
        </div>
    );
};

export default ChatHeader;
