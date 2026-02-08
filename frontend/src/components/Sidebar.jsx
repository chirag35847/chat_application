import React from 'react';
import { MessageSquare, LogOut } from 'lucide-react';

const Sidebar = ({ unreadCount = 0, onLogout }) => {
    return (
        <div className="w-16 flex flex-col items-center py-6 bg-[#202c33] border-r border-[#ffffff1a] shrink-0 font-sans h-full justify-between">
            <div className="flex flex-col gap-6 items-center w-full">
                <div className="p-2 bg-[#ffffff1a] rounded-full relative cursor-pointer hover:bg-[#ffffff26] transition-colors">
                    <MessageSquare className="w-6 h-6 text-[#d1d7db]" />
                    {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-[#25d366] text-[#0b141a] text-[10px] font-bold min-w-[16px] h-4 rounded-full flex items-center justify-center px-1">
                            {unreadCount}
                        </span>
                    )}
                </div>
            </div>

            <button
                onClick={onLogout}
                className="p-3 text-[#d1d7db] hover:text-red-400 hover:bg-[#ffffff1a] rounded-full transition-all group relative"
                title="Logout"
            >
                <LogOut className="w-6 h-6" />
                <span className="absolute left-full ml-2 px-2 py-1 bg-[#233138] text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity">
                    Logout
                </span>
            </button>
        </div>
    );
};

export default Sidebar;
