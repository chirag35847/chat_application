import React from 'react';
import { MessageSquare } from 'lucide-react';

const Sidebar = ({ unreadCount = 0 }) => {
    return (
        <div className="w-16 flex flex-col items-center py-4 bg-[#202c33] border-r border-[#ffffff1a] shrink-0 font-sans">
            <div className="flex flex-col gap-6 items-center w-full">
                <div className="p-2 bg-[#ffffff1a] rounded-full relative">
                    <MessageSquare className="w-6 h-6 text-[#d1d7db]" />
                    {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-[#25d366] text-[#0b141a] text-[10px] font-bold min-w-[16px] h-4 rounded-full flex items-center justify-center px-1">
                            {unreadCount}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Sidebar;
