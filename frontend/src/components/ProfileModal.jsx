import React, { useState, useEffect } from 'react';
import { X, User, Mail, Shield, Loader2, LogOut } from 'lucide-react';
import { getProfile } from '../api/user';

const ProfileModal = ({ isOpen, onClose, onLogout }) => {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isOpen) {
            const fetchProfile = async () => {
                try {
                    setLoading(true);
                    const response = await getProfile();
                    if (response.success) {
                        setProfile(response.data);
                    }
                } catch (error) {
                    console.error('Error fetching profile:', error);
                } finally {
                    setLoading(false);
                }
            };
            fetchProfile();
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm transition-all duration-300">
            <div className="bg-[#222e35] w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-white/10 transform transition-all scale-100 animate-in fade-in zoom-in duration-200">
                <div className="p-4 bg-[#2a3942] flex items-center justify-between border-b border-white/5">
                    <div className="flex items-center gap-2">
                        <User className="w-5 h-5 text-[#00a884]" />
                        <h2 className="text-lg font-semibold text-[#e9edef]">User Profile</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-white/10 rounded-full transition-colors text-[#d1d7db]"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-8">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-12 text-[#8696a0]">
                            <Loader2 className="w-8 h-8 animate-spin mb-2" />
                            <p>Loading profile...</p>
                        </div>
                    ) : profile ? (
                        <div className="space-y-6">
                            <div className="flex flex-col items-center gap-4">
                                <div className="w-24 h-24 rounded-full bg-[#3b4a54] flex items-center justify-center text-white text-4xl font-bold shadow-xl border-4 border-[#00a884]">
                                    {profile.username?.substring(0, 2).toUpperCase()}
                                </div>
                                <div className="text-center">
                                    <h3 className="text-2xl font-bold text-[#e9edef]">{profile.username}</h3>
                                    <p className="text-[#00a884] font-medium">Member</p>
                                </div>
                            </div>

                            <div className="bg-[#111b21] rounded-xl p-4 space-y-4 border border-white/5">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-[#ffffff0a] rounded-lg">
                                        <Mail className="w-5 h-5 text-[#8696a0]" />
                                    </div>
                                    <div className="flex-1 overflow-hidden">
                                        <p className="text-xs text-[#8696a0] font-medium uppercase tracking-wider">Email Address</p>
                                        <p className="text-[#e9edef] truncate">{profile.email}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-[#ffffff0a] rounded-lg">
                                        <Shield className="w-5 h-5 text-[#8696a0]" />
                                    </div>
                                    <div className="flex-1 overflow-hidden">
                                        <p className="text-xs text-[#8696a0] font-medium uppercase tracking-wider">User ID</p>
                                        <p className="text-[#e9edef] text-sm font-mono truncate">{profile.id}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4">
                                <button
                                    onClick={onLogout}
                                    className="w-full flex items-center justify-center gap-2 py-3 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-xl font-bold transition-all border border-red-500/20"
                                >
                                    <LogOut className="w-5 h-5" />
                                    Logout Session
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-12 text-[#8696a0]">
                            <p>Failed to load profile details</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProfileModal;
