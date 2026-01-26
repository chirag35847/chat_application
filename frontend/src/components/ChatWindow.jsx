import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ChatHeader from './ChatHeader';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import ChatPlaceholder from './ChatPlaceholder';

const ChatWindow = ({ selectedChat }) => {
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState([]);

    // TODO: This should come from an AuthContext or similar after real login integration
    const currentUserId = "current-logged-in-user-id";

    useEffect(() => {
        if (selectedChat) {
            // TODO: Real API call: GET /chat/message?chatId=${selectedChat.id}
            // The mapping below follows the backend structure in app.js app.get('/chat/message')
            const history = [
                {
                    id: "msg-1",
                    decryptedText: `Hey! ${selectedChat.lastMsg || ''}`,
                    type: "TEXT",
                    created_at: new Date(Date.now() - 3600000).toISOString(),
                    sender: { id: "other-user-id", username: selectedChat.name },
                    presignedUrl: null
                },
                {
                    id: "msg-2",
                    decryptedText: "I've uploaded the project requirements PDF.",
                    type: "PDF",
                    created_at: new Date(Date.now() - 1800000).toISOString(),
                    sender: { id: currentUserId, username: "You" },
                    presignedUrl: "https://example.com/mock-pdf-url",
                    file_name: "Requirements.pdf"
                },
                {
                    id: "msg-3",
                    decryptedText: "Thanks! I'll check it out.",
                    type: "TEXT",
                    created_at: new Date(Date.now() - 600000).toISOString(),
                    sender: { id: "other-user-id", username: selectedChat.name },
                    presignedUrl: null
                },
                {
                    id: "msg-4",
                    decryptedText: null,
                    type: "VOICENOTE",
                    created_at: new Date(Date.now() - 300000).toISOString(),
                    sender: { id: "other-user-id", username: selectedChat.name },
                    presignedUrl: "https://example.com/mock-audio-url",
                    file_name: "voice-note.mp3"
                }
            ];
            setMessages(history);
        }
    }, [selectedChat]);

    const handleSendMessage = async ({ text, file }) => {
        if (!text?.trim() && !file) return;

        // 1. Create a "Loading" or "Sending" local state if we had one
        const tempId = Date.now().toString();
        const placeholderMessage = {
            id: tempId,
            decryptedText: text || '',
            type: file ? (file.type.includes('pdf') ? "PDF" : (file.type.startsWith('audio/') ? "VOICENOTE" : "FILE")) : "TEXT",
            created_at: new Date().toISOString(),
            sender: { id: currentUserId, username: "You" },
            presignedUrl: file ? URL.createObjectURL(file) : null, // Temp local URL
            file_name: file ? file.name : null,
            status: 'sending'
        };

        setMessages(prev => [...prev, placeholderMessage]);

        // 2. Simulate API Call
        // TODO: const formData = new FormData();
        // ... (append chatId, text, attachment)
        // const response = await axios.post('/chat/message', formData);

        // Simulating the backend response as described by the user
        setTimeout(() => {
            const apiResponse = {
                id: "real-db-id-" + tempId,
                decryptedText: text || '',
                type: placeholderMessage.type,
                created_at: new Date().toISOString(),
                sender: { id: currentUserId, username: "You" },
                // The API returns the real presigned URL for the uploaded file
                presignedUrl: file ? "https://example.com/real-presigned-url-from-api" : null,
                file_name: file ? file.name : null,
                status: 'sent'
            };

            // 3. Update the messages state: replace placeholder with real API data
            setMessages(prev => prev.map(m => m.id === tempId ? apiResponse : m));

            // Optional: Cleanup local object URL
            if (placeholderMessage.presignedUrl && placeholderMessage.presignedUrl.startsWith('blob:')) {
                URL.revokeObjectURL(placeholderMessage.presignedUrl);
            }
        }, 1500);
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
                        <MessageList messages={messages} currentUserId={currentUserId} />
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
