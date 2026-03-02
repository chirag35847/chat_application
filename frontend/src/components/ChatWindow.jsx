import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ChatHeader from './ChatHeader';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import ChatPlaceholder from './ChatPlaceholder';
import { getMessages, sendMessage } from '../api/chat';
import { useSocket } from '../context/SocketContext';

const ChatWindow = ({ selectedChat, currentUserId }) => {
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(false);
    const socket = useSocket();
    const scrollRef = useRef(null);

    const fetchMessages = async (chatId) => {
        try {
            setLoading(true);
            const response = await getMessages(chatId);
            if (response.success) {
                // Reverse because backend returns desc (latest first)
                const formatted = response.data.reverse().map(msg => ({
                    ...msg,
                    decryptedText: msg.text, // Map 'text' to 'decryptedText' for UI compatibility
                    status: 'sent'
                }));
                setMessages(formatted);
            }
        } catch (error) {
            console.error('Error fetching messages:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (selectedChat?.id) {
            fetchMessages(selectedChat.id);

            if (socket) {
                socket.emit('join_chat', selectedChat.id);

                const handleReceiveMessage = (newMessage) => {
                    setMessages((prev) => {
                        // Avoid duplicates if the sender is also the current user
                        if (prev.find(m => m.id === newMessage.id)) return prev;

                        return [...prev, {
                            ...newMessage,
                            decryptedText: newMessage.text,
                            status: 'sent'
                        }];
                    });
                };

                socket.on('receive_message', handleReceiveMessage);

                return () => {
                    socket.off('receive_message', handleReceiveMessage);
                };
            }
        } else {
            setMessages([]);
        }
    }, [selectedChat?.id, socket]);

    const handleSendMessage = async ({ text, file }) => {
        if (!selectedChat || (!text?.trim() && !file)) return;

        const tempId = Date.now().toString();
        const placeholderMessage = {
            id: tempId,
            decryptedText: text || '',
            type: file ? (file.type.includes('pdf') ? "PDF" : (file.type.startsWith('audio/') ? "VOICENOTE" : "FILE")) : "TEXT",
            created_at: new Date().toISOString(),
            sender: { id: currentUserId, username: "You" },
            presignedUrl: file ? URL.createObjectURL(file) : null,
            file_name: file ? file.name : null,
            status: 'sending'
        };

        setMessages(prev => [...prev, placeholderMessage]);

        try {
            const formData = new FormData();
            formData.append('chatId', selectedChat.id);
            if (text) formData.append('text', text);
            if (file) formData.append('attachment', file);

            const response = await sendMessage(formData, {
                headers: {
                    'X-Socket-ID': socket?.id
                }
            });

            if (response.success) {
                const apiMsg = response.data;
                const formattedMsg = {
                    ...apiMsg,
                    decryptedText: text || '',
                    status: 'sent',
                    // Preserve local preview data since API response might not have presignedUrl immediately
                    presignedUrl: placeholderMessage.presignedUrl,
                    file_name: placeholderMessage.file_name
                };

                setMessages(prev => prev.map(m => m.id === tempId ? formattedMsg : m));
            } else {
                setMessages(prev => prev.map(m => m.id === tempId ? { ...m, status: 'error' } : m));
            }
        } catch (error) {
            console.error('Error sending message:', error);
            setMessages(prev => prev.map(m => m.id === tempId ? { ...m, status: 'error' } : m));
        } finally {
            if (placeholderMessage.presignedUrl && placeholderMessage.presignedUrl.startsWith('blob:')) {
                // We keep it for a bit so UI doesn't flicker, or revoke if replaced
            }
        }
    };

    return (
        <div className="flex-1 flex flex-col bg-[#0b141a] relative h-full overflow-hidden">
            <AnimatePresence mode="wait">
                {selectedChat ? (
                    <motion.div
                        key="chat-open"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex-1 flex flex-col h-full overflow-hidden"
                    >
                        <ChatHeader selectedChat={selectedChat} />
                        <div className="flex-1 overflow-hidden flex flex-col">
                            <MessageList messages={messages} currentUserId={currentUserId} />
                        </div>
                        <MessageInput
                            message={message}
                            setMessage={setMessage}
                            onSendMessage={handleSendMessage}
                        />
                    </motion.div>
                ) : (
                    <motion.div
                        key="chat-placeholder"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex-1 flex flex-col items-center justify-center p-8 bg-[#222e35]/30 h-full"
                    >
                        <ChatPlaceholder />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ChatWindow;
