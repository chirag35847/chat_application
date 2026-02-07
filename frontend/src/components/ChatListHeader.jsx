import React from 'react';
import { PlusSquare, MoreVertical } from 'lucide-react';

const ChatListHeader = ({ onNewChat }) => {
    return (
        <div className="flex justify-between items-center">
            <h1 className="text-xl font-bold">Chats</h1>
            <div className="flex gap-4">
                <PlusSquare
                    className="w-5 h-5 text-[#d1d7db] cursor-pointer hover:text-[#00a884] transition-colors"
                    onClick={onNewChat}
                />
                <MoreVertical className="w-5 h-5 text-[#d1d7db] cursor-pointer hover:text-[#00a884] transition-colors" />
            </div>
        </div>
    );
};

export default ChatListHeader;
