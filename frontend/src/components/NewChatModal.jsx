import React, { useState, useEffect } from 'react';
import { X, Search, UserPlus, Loader2, CheckCircle2, Circle, Users } from 'lucide-react';
import { searchUsers } from '../api/user';
import { createChat } from '../api/chat';
import { useSocket } from '../context/SocketContext';

const NewChatModal = ({ isOpen, onClose, onChatCreated }) => {
    const socket = useSocket();
    const [searchTerm, setSearchTerm] = useState('');
    const [users, setUsers] = useState([]);
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [chatName, setChatName] = useState('');
    const [loading, setLoading] = useState(false);
    const [creating, setCreating] = useState(false);

    useEffect(() => {
        if (!isOpen) {
            setSearchTerm('');
            setUsers([]);
            setSelectedUsers([]);
            setChatName('');
            return;
        }
    }, [isOpen]);

    useEffect(() => {
        const fetchUsers = async () => {
            if (!searchTerm.trim()) {
                setUsers([]);
                return;
            }

            setLoading(true);
            try {
                const response = await searchUsers(searchTerm);
                if (response.success) {
                    setUsers(response.data);
                }
            } catch (error) {
                console.error('Error searching users:', error);
            } finally {
                setLoading(false);
            }
        };

        const timer = setTimeout(fetchUsers, 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    const toggleUser = (user) => {
        if (selectedUsers.find(u => u.id === user.id)) {
            setSelectedUsers(selectedUsers.filter(u => u.id !== user.id));
        } else {
            setSelectedUsers([...selectedUsers, user]);
        }
    };

    const handleCreateChat = async () => {
        if (selectedUsers.length === 0) return;
        if (selectedUsers.length > 1 && !chatName.trim()) return;

        setCreating(true);
        try {
            const userIds = selectedUsers.map(u => u.id);
            const response = await createChat(
                userIds,
                selectedUsers.length > 1 ? chatName : undefined,
                {
                    headers: {
                        'X-Socket-ID': socket?.id
                    }
                }
            );
            if (response.success) {
                onChatCreated(response.data);
                onClose();
            }
        } catch (error) {
            console.error('Error creating chat:', error);
        } finally {
            setCreating(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm transition-all duration-300">
            <div className="bg-[#222e35] w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-white/10 transform transition-all scale-100 animate-in fade-in zoom-in duration-200">
                <div className="p-4 bg-[#2a3942] flex items-center justify-between border-b border-white/5">
                    <div className="flex items-center gap-2">
                        <Users className="w-5 h-5 text-[#00a884]" />
                        <h2 className="text-lg font-semibold text-[#e9edef]">
                            {selectedUsers.length > 1 ? 'New Group' : 'New Chat'}
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-white/10 rounded-full transition-colors text-[#d1d7db]"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-4 space-y-4">
                    {selectedUsers.length > 1 && (
                        <div className="animate-in slide-in-from-top-2 duration-300">
                            <label className="text-sm font-medium text-[#8696a0] mb-1.5 block">Group Name</label>
                            <input
                                type="text"
                                placeholder="Enter group subject..."
                                value={chatName}
                                onChange={(e) => setChatName(e.target.value)}
                                className="w-full bg-[#202c33] text-[#e9edef] px-4 py-2.5 rounded-xl border-none outline-none focus:ring-2 focus:ring-[#00a884] transition-all placeholder:text-[#8696a0]"
                                autoFocus
                            />
                        </div>
                    )}

                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#8696a0]" />
                        <input
                            type="text"
                            placeholder="Add members name..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-[#202c33] text-[#e9edef] pl-11 pr-4 py-2.5 rounded-xl border-none outline-none focus:ring-2 focus:ring-[#00a884] transition-all placeholder:text-[#8696a0]"
                        />
                    </div>

                    {selectedUsers.length > 0 && (
                        <div className="flex flex-wrap gap-2 py-1 max-h-24 overflow-y-auto custom-scrollbar">
                            {selectedUsers.map(user => (
                                <div key={user.id} className="flex items-center gap-1.5 bg-[#00a884]/20 text-[#00a884] px-3 py-1.5 rounded-full text-sm font-medium animate-in zoom-in duration-200">
                                    <span>{user.username}</span>
                                    <X
                                        className="w-4 h-4 cursor-pointer hover:text-white transition-colors"
                                        onClick={() => toggleUser(user)}
                                    />
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-12 text-[#8696a0]">
                            <Loader2 className="w-8 h-8 animate-spin mb-2" />
                            <p>Searching for users...</p>
                        </div>
                    ) : users.length > 0 ? (
                        <div className="py-2 border-t border-white/5">
                            {users.map((user) => {
                                const isSelected = selectedUsers.find(u => u.id === user.id);
                                return (
                                    <div
                                        key={user.id}
                                        className={`flex items-center justify-between px-4 py-3 cursor-pointer transition-colors group ${isSelected ? 'bg-[#202c33]' : 'hover:bg-[#202c33]'}`}
                                        onClick={() => toggleUser(user)}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg transition-colors ${isSelected ? 'bg-[#00a884]' : 'bg-[#3b4a54]'}`}>
                                                {user.username.substring(0, 2).toUpperCase()}
                                            </div>
                                            <div>
                                                <h3 className="text-[#e9edef] font-medium">{user.username}</h3>
                                                <p className="text-sm text-[#8696a0]">{user.email}</p>
                                            </div>
                                        </div>
                                        <div className="text-[#00a884]">
                                            {isSelected ? <CheckCircle2 className="w-6 h-6" /> : <Circle className="w-6 h-6 text-[#3b4a54] group-hover:text-[#8696a0]" />}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : searchTerm ? (
                        <div className="text-center py-12 text-[#8696a0]">
                            <p>No users found matching "{searchTerm}"</p>
                        </div>
                    ) : (
                        <div className="text-center py-12 text-[#8696a0]">
                            <div className="bg-[#202c33] w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/5">
                                <Search className="w-8 h-8" />
                            </div>
                            <p>Find people to chat with</p>
                        </div>
                    )}
                </div>

                {selectedUsers.length > 0 && (
                    <div className="p-4 bg-[#2a3942] border-t border-white/5">
                        <button
                            onClick={handleCreateChat}
                            disabled={creating || (selectedUsers.length > 1 && !chatName.trim())}
                            className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg ${creating || (selectedUsers.length > 1 && !chatName.trim())
                                ? 'bg-[#3b4a54] text-[#8696a0] cursor-not-allowed'
                                : 'bg-[#00a884] text-white hover:bg-[#06cf9c] active:scale-[0.98]'
                                }`}
                        >
                            {creating ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    <span>Creating...</span>
                                </>
                            ) : (
                                <>
                                    <UserPlus className="w-5 h-5" />
                                    <span>Create {selectedUsers.length > 1 ? 'Group' : 'Chat'}</span>
                                </>
                            )}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default NewChatModal;
