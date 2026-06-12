import React, { useState, useEffect } from 'react';
import { Citation, CitationTag } from './CitationTag';
import { Volume2, VolumeX, Shield, User } from 'lucide-react';

export interface Message {
  role: 'user' | 'assistant';
  content: string;
  citations?: Citation[];
  image_base64?: string | null;
  image_mime_type?: string | null;
}

interface MessageBubbleProps {
  message: Message;
  language: 'en' | 'hi' | 'kn';
  onCitationClick?: (citation: Citation) => void;
}

// Simple helper to format text (bolding, line breaks, bullet points)
const formatMessageContent = (text: string) => {
  if (!text) return '';
  
  // Escape HTML
  let formatted = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Bold markdown
  formatted = formatted.replace(/\*\*([^*]+)\*\*/g, '<strong class="font-bold text-accent-300">$1</strong>');
  
  // Bullet points
  formatted = formatted.replace(/^\s*[-*]\s+([^\n]+)/gm, '<li class="ml-4 list-disc text-slate-300 my-1">$1</li>');
  
  // Handle newlines
  formatted = formatted.replace(/\n/g, '<br />');

  return formatted;
};

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message, language, onCitationClick }) => {
  const { role, content, citations, image_base64 } = message;
  const isAssistant = role === 'assistant';
  
  const [isPlaying, setIsPlaying] = useState(false);

  // Stop reading if component unmounts
  useEffect(() => {
    return () => {
      if (isAssistant && isPlaying) {
        window.speechSynthesis.cancel();
      }
    };
  }, [isPlaying, isAssistant]);

  const toggleSpeech = () => {
    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      return;
    }

    // Clean text for speech synthesizer (remove markdown bold tags and citations)
    let cleanText = content
      .replace(/\[([^\]]+)\]/g, '') // remove citations
      .replace(/\*\*([^*]+)\*\*/g, '$1') // remove bold formatting
      .replace(/[-*]\s+/g, ''); // remove bullet markdown

    const utterance = new SpeechSynthesisUtterance(cleanText);
    
    // Select language locale
    if (language === 'hi') {
      utterance.lang = 'hi-IN';
    } else if (language === 'kn') {
      utterance.lang = 'kn-IN';
    } else {
      utterance.lang = 'en-IN'; // Indian English helper
    }

    // Attempt to select correct browser voice
    const voices = window.speechSynthesis.getVoices();
    const voice = voices.find(v => v.lang.toLowerCase() === utterance.lang.toLowerCase() || v.lang.startsWith(utterance.lang));
    if (voice) {
      utterance.voice = voice;
    }

    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => setIsPlaying(false);

    setIsPlaying(true);
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className={`flex w-full mt-4 ${isAssistant ? 'justify-start' : 'justify-end'} animate-fade-in-up`}>
      <div className={`flex items-start max-w-[85%] sm:max-w-[75%] gap-3 ${!isAssistant && 'flex-row-reverse'}`}>
        
        {/* Avatar */}
        <div className={`flex items-center justify-center w-8 h-8 rounded-full border shrink-0 shadow-inner ${
          isAssistant 
            ? 'bg-primary-950 border-primary-500/30 text-accent-400' 
            : 'bg-slate-800 border-slate-700 text-slate-300'
        }`}>
          {isAssistant ? <Shield size={16} /> : <User size={16} />}
        </div>

        {/* Message bubble */}
        <div className="flex flex-col gap-1.5">
          <div className={`rounded-2xl px-4 py-3 shadow-lg ${
            isAssistant 
              ? 'glass-panel border-primary-500/20 text-slate-100 rounded-tl-none' 
              : 'bg-gradient-to-br from-primary-600 to-primary-800 text-white rounded-tr-none border border-primary-500/30'
          }`}>
            
            {/* Embedded Image preview if sent by user */}
            {image_base64 && (
              <div className="mb-3 max-w-full rounded-lg overflow-hidden border border-slate-700/50 shadow-md">
                <img 
                  src={image_base64} 
                  alt="User uploaded attachment" 
                  className="max-h-60 object-contain w-full bg-slate-900/50" 
                />
              </div>
            )}

            {/* Content text */}
            <div 
              className="text-sm leading-relaxed break-words"
              dangerouslySetInnerHTML={{ __html: formatMessageContent(content) }}
            />
            
            {/* Click-to-Speak Controller */}
            {isAssistant && (
              <div className="flex justify-end mt-2 pt-1 border-t border-slate-800/60">
                <button
                  type="button"
                  onClick={toggleSpeech}
                  className={`flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md transition-colors ${
                    isPlaying 
                      ? 'bg-accent-500/20 text-accent-300 border border-accent-500/30 animate-pulse-subtle' 
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                  }`}
                  title={isPlaying ? "Stop speech" : "Read response aloud"}
                >
                  {isPlaying ? (
                    <>
                      <VolumeX size={12} />
                      <span>Stop Voice</span>
                    </>
                  ) : (
                    <>
                      <Volume2 size={12} />
                      <span>Speak ({language.toUpperCase()})</span>
                    </>
                  )}
                </button>
              </div>
            )}

          </div>

          {/* Citations section */}
          {isAssistant && citations && citations.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-1 px-1">
              <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold self-center mr-1">Sources:</span>
              {citations.map((cit, idx) => (
                <CitationTag 
                  key={idx} 
                  citation={cit} 
                  onClick={() => onCitationClick && onCitationClick(cit)} 
                />
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
