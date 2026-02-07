import React, { useEffect, useRef } from 'react';
import MessageBubble from './MessageBubble';

const MessageList = ({ messages = [], currentUserId }) => {
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Helper to format ISO strings to simple Time
    const formatTime = (isoString) => {
        try {
            return new Date(isoString).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (e) {
            return isoString;
        }
    };

    return (
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')] bg-repeat opacity-90 custom-scrollbar">
            <div className="flex justify-center mb-4">
                <span className="bg-[#182229] text-[11px] text-[#8696a0] px-3 py-1 rounded-lg uppercase tracking-wider font-medium">
                    Today
                </span>
            </div>

            {messages && messages.map((msg) => (
                <MessageBubble
                    key={msg.id}
                    text={msg.decryptedText}
                    time={formatTime(msg.created_at)}
                    isOwn={msg.sender?.id === currentUserId}
                    status={msg.status || 'read'}
                    fileName={msg.file_name}
                    fileType={msg.type}
                    url={msg.presignedUrl}
                />
            ))}
            <div ref={messagesEndRef} />
        </div>
    );
};

export default MessageList;
