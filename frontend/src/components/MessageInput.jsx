import React, { useState, useRef, useEffect } from 'react';
import { Smile, Paperclip, Send, Mic, X, FileText, Trash2 } from 'lucide-react';
import EmojiPicker from 'emoji-picker-react';

const MessageInput = ({ message, setMessage, onSendMessage }) => {
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [audioBlob, setAudioBlob] = useState(null);

    const fileInputRef = useRef(null);
    const emojiPickerRef = useRef(null);
    const mediaRecorderRef = useRef(null);
    const timerRef = useRef(null);

    // Close emoji picker when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) {
                setShowEmojiPicker(false);
            }
        };

        if (showEmojiPicker) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showEmojiPicker]);

    const handleSend = () => {
        if (message.trim() || selectedFile || audioBlob) {
            onSendMessage({
                text: message,
                file: selectedFile || audioBlob
            });
            setMessage('');
            setSelectedFile(null);
            setAudioBlob(null);
            setShowEmojiPicker(false);
        }
    };

    // Voice Note Logic
    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorderRef.current = new MediaRecorder(stream);
            const chunks = [];

            mediaRecorderRef.current.ondataavailable = (e) => chunks.push(e.data);
            mediaRecorderRef.current.onstop = () => {
                const blob = new Blob(chunks, { type: 'audio/webm' });
                const file = new File([blob], `voice-note-${Date.now()}.webm`, { type: 'audio/webm' });
                setAudioBlob(file);
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorderRef.current.start();
            setIsRecording(true);
            setRecordingTime(0);
            timerRef.current = setInterval(() => {
                setRecordingTime(prev => prev + 1);
            }, 1000);
        } catch (err) {
            console.error("Error accessing microphone:", err);
            alert("Could not access microphone. Please check permissions.");
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            clearInterval(timerRef.current);
        }
    };

    const cancelRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            clearInterval(timerRef.current);
            setAudioBlob(null);
        }
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const onEmojiClick = (emojiData) => {
        setMessage(prev => prev + emojiData.emoji);
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedFile(file);
            setAudioBlob(null);
        }
        e.target.value = '';
    };

    return (
        <div className="relative bg-[#202c33] p-3 flex flex-col gap-2">
            {/* Selected File/Audio Preview */}
            {(selectedFile || audioBlob) && (
                <div className="flex items-center gap-3 bg-[#2a3942] p-2 rounded-lg mb-1 animate-in slide-in-from-bottom-2 duration-200">
                    <div className="bg-indigo-500/20 p-2 rounded-md">
                        {audioBlob ? <Mic className="w-5 h-5 text-indigo-400" /> : <FileText className="w-5 h-5 text-indigo-400" />}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm text-[#e9edef] truncate font-medium">
                            {audioBlob ? `Voice Note ${formatTime(recordingTime)}` : selectedFile.name}
                        </p>
                        <p className="text-[10px] text-[#8696a0]">
                            {audioBlob ? 'Ready to send' : `${(selectedFile.size / 1024).toFixed(1)} KB`}
                        </p>
                    </div>
                    <button
                        onClick={() => { setSelectedFile(null); setAudioBlob(null); }}
                        className="p-1 hover:bg-[#374045] rounded-full transition-colors"
                    >
                        <X className="w-4 h-4 text-[#8696a0]" />
                    </button>
                </div>
            )}

            <div className="flex items-center gap-4">
                {!isRecording ? (
                    <>
                        <div className="relative">
                            <Smile
                                className={`w-6 h-6 cursor-pointer transition-colors ${showEmojiPicker ? 'text-[#25d366]' : 'text-[#8696a0] hover:text-[#d1d7db]'}`}
                                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                            />
                            {showEmojiPicker && (
                                <div ref={emojiPickerRef} className="absolute bottom-12 left-0 z-50 shadow-2xl">
                                    <EmojiPicker
                                        theme="dark"
                                        onEmojiClick={onEmojiClick}
                                        skinTonesDisabled
                                        searchDisabled
                                        width={300}
                                        height={400}
                                        previewConfig={{ showPreview: false }}
                                    />
                                </div>
                            )}
                        </div>

                        <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                        <Paperclip
                            className={`w-6 h-6 cursor-pointer hover:text-[#d1d7db] transition-colors ${selectedFile ? 'text-indigo-400' : 'text-[#8696a0]'}`}
                            onClick={() => fileInputRef.current?.click()}
                        />

                        <div className="flex-1">
                            <input
                                type="text"
                                placeholder="Type a message"
                                className="w-full bg-[#2a3942] rounded-lg py-2.5 px-4 text-sm focus:outline-none placeholder-[#8696a0] text-white"
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                            />
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex items-center gap-4 bg-[#2a3942] rounded-lg py-2 px-4 animate-in fade-in duration-300">
                        <Trash2
                            className="w-5 h-5 text-red-500 cursor-pointer hover:scale-110 transition-transform"
                            onClick={cancelRecording}
                        />
                        <div className="flex-1 flex items-center gap-2">
                            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                            <span className="text-sm text-white font-mono">Recording {formatTime(recordingTime)}</span>
                        </div>
                        <button
                            onClick={stopRecording}
                            className="text-[#25d366] text-sm font-bold hover:underline"
                        >
                            Done
                        </button>
                    </div>
                )}

                {(message.trim() || selectedFile || audioBlob) ? (
                    <Send
                        className="w-6 h-6 text-indigo-400 cursor-pointer hover:scale-110 active:scale-95 transition-transform"
                        onClick={handleSend}
                    />
                ) : (
                    !isRecording && (
                        <Mic
                            className="w-6 h-6 text-[#8696a0] cursor-pointer hover:text-[#25d366] transition-colors"
                            onClick={startRecording}
                        />
                    )
                )}
            </div>
        </div>
    );
};

export default MessageInput;
