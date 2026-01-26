import React from 'react';

const ChatListItem = ({ chat, isSelected, onClick }) => {
    return (
        <div
            onClick={onClick}
            className={`flex items-center gap-3 p-3 cursor-pointer transition-colors ${isSelected ? 'bg-[#2a3942]' : 'hover:bg-[#202c33]'}`}
        >
            <div className="w-12 h-12 rounded-full bg-slate-700 flex items-center justify-center text-lg font-semibold shrink-0">
                {chat.avatar}
            </div>
            <div className="flex-1 min-w-0 border-b border-[#ffffff1a] pb-3">
                <div className="flex justify-between items-center mb-1">
                    <span className="font-medium truncate">{chat.name}</span>
                    <span className={`text-xs ${chat.unread > 0 ? 'text-[#25d366]' : 'text-[#8696a0]'}`}>{chat.time}</span>
                </div>
                <div className="flex justify-between items-center">
                    <p className="text-sm text-[#8696a0] truncate">{chat.lastMsg}</p>
                    {chat.unread > 0 && (
                        <span className="bg-[#25d366] text-[#0b141a] text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                            {chat.unread}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ChatListItem;
