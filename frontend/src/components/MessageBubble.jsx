import React, { useState, useRef, useEffect } from 'react';
import { ShieldCheck, FileText, Download, Play, Pause } from 'lucide-react';

const VoiceNotePlayer = ({ url }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [duration, setDuration] = useState(0);
    const audioRef = useRef(new Audio(url));

    useEffect(() => {
        const audio = audioRef.current;

        const setAudioData = () => setDuration(audio.duration);
        const setAudioTime = () => setProgress((audio.currentTime / audio.duration) * 100);
        const onEnded = () => {
            setIsPlaying(false);
            setProgress(0);
        };

        audio.addEventListener('loadedmetadata', setAudioData);
        audio.addEventListener('timeupdate', setAudioTime);
        audio.addEventListener('ended', onEnded);

        return () => {
            audio.removeEventListener('loadedmetadata', setAudioData);
            audio.removeEventListener('timeupdate', setAudioTime);
            audio.removeEventListener('ended', onEnded);
            audio.pause();
        };
    }, [url]);

    const togglePlay = () => {
        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.play();
        }
        setIsPlaying(!isPlaying);
    };

    const formatTime = (time) => {
        if (isNaN(time)) return "0:00";
        const mins = Math.floor(time / 60);
        const secs = Math.floor(time % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="flex items-center gap-3 bg-black/20 p-2 rounded-full mb-2 pr-4 min-w-[220px]">
            <div
                onClick={togglePlay}
                className="bg-[#25d366] p-2 rounded-full cursor-pointer hover:scale-105 transition-transform shadow-lg active:scale-95"
            >
                {isPlaying ? (
                    <Pause className="w-4 h-4 text-[#0b141a] fill-current" />
                ) : (
                    <Play className="w-4 h-4 text-[#0b141a] fill-current ml-0.5" />
                )}
            </div>
            <div className="flex-1 h-1.5 bg-[#8696a0]/30 rounded-full relative overflow-hidden group/progress cursor-pointer">
                <div
                    className="absolute top-0 left-0 h-full bg-[#25d366] rounded-full transition-all duration-100"
                    style={{ width: `${progress}%` }}
                />
            </div>
            <span className="text-[10px] text-[#8696a0] font-mono min-w-[30px]">
                {isPlaying ? formatTime(audioRef.current.currentTime) : formatTime(duration)}
            </span>
        </div>
    );
};

const MessageBubble = ({ text, time, isOwn, status, fileName, fileType, url }) => {
    const isAudio = fileType === 'VOICENOTE' || (typeof fileType === 'string' && (fileType.startsWith('audio/') || fileType.includes('webm')));
    const isPdf = fileType === 'PDF' || (typeof fileType === 'string' && fileType.includes('pdf'));

    return (
        <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-4 px-4`}>
            <div
                className={`p-3 max-w-[70%] shadow-sm relative group ${isOwn
                    ? 'bg-[#005c4b] rounded-tl-xl rounded-b-xl'
                    : 'bg-[#202c33] rounded-tr-xl rounded-b-xl'
                    }`}
            >
                {/* Audio/Voice Note UI */}
                {url && isAudio && <VoiceNotePlayer url={url} />}

                {/* File Attachment UI (PDF or General Files) */}
                {url && !isAudio && (
                    <div className="flex items-center gap-3 bg-black/20 p-3 rounded-lg mb-2 border border-white/5">
                        <div className="bg-white/10 p-2 rounded-md">
                            <FileText className="w-5 h-5 text-indigo-300" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-[#e9edef] truncate">{fileName || 'Attached File'}</p>
                            <p className="text-[10px] text-[#8696a0] uppercase">{isPdf ? 'PDF Document' : 'File'}</p>
                        </div>
                        <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            download={fileName}
                            className="p-2 hover:bg-white/5 rounded-full transition-colors"
                        >
                            <Download className="w-4 h-4 text-[#8696a0] hover:text-white" />
                        </a>
                    </div>
                )}

                {/* Text Content */}
                {text && (
                    <p className="text-[14.5px] leading-relaxed pr-12 whitespace-pre-wrap break-words text-[#e9edef]">
                        {text}
                    </p>
                )}

                {/* Timestamp and Status Ticks */}
                <div className="absolute bottom-1 right-2 flex items-center gap-1">
                    <span className={`text-[10px] ${isOwn ? 'text-[#aebac1]' : 'text-[#8696a0]'}`}>
                        {time}
                    </span>
                    {isOwn && (
                        <ShieldCheck
                            className={`w-3 h-3 ${status === 'read' ? 'text-[#53bdeb]' :
                                    (status === 'delivered' ? 'text-[#aebac1]' : 'text-[#8696a0]')
                                }`}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

export default MessageBubble;
