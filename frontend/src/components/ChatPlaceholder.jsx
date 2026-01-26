import React from 'react';
import { ShieldCheck, MessageSquare } from 'lucide-react';

const ChatPlaceholder = () => {
    return (
        <div className="flex-1 flex flex-col items-center justify-center p-8 bg-[#222e35]/30">
            <div className="w- object-contain opacity-20 mb-8 filter grayscale invert">
                <MessageSquare className="w-24 h-24" />
            </div>
            <h1 className="text-3xl font-light text-[#e9edef] mb-3">Chat Application</h1>
            <p className="text-[#8696a0] text-sm text-center max-w-sm leading-relaxed">
                Send and receive messages without keeping your phone online. Use Chat App on up to 4 linked devices and 1 phone at the same time.
            </p>

            <div className="absolute bottom-10 flex items-center gap-2 text-[#8696a0] text-xs">
                <ShieldCheck className="w-4 h-4" />
                <span>End-to-end encrypted</span>
            </div>
        </div>
    );
};

export default ChatPlaceholder;
