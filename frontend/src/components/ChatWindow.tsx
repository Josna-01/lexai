import React, { useState, useRef, useEffect } from 'react';
import { Message, MessageBubble } from './MessageBubble';
import { VirtualKeyboard } from './VirtualKeyboard';
import { Citation } from './CitationTag';
import {
  Send, Mic, MicOff, Keyboard as KeyboardIcon,
  X, Paperclip, Scale, ArrowDown, Info
} from 'lucide-react';

interface ChatWindowProps {
  messages: Message[];
  isLoading: boolean;
  language: 'en' | 'hi' | 'kn';
  onSendMessage: (text: string, imageBase64?: string | null, imageMime?: string | null) => void;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ messages, isLoading, language, onSendMessage }) => {
  const [inputText, setInputText] = useState('');
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [attachedImageMime, setAttachedImageMime] = useState<string | null>(null);

  // Voice input state
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);

  // Keyboard state
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

  // Scroll handlers
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const feedRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [showScrollDown, setShowScrollDown] = useState(false);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;

      rec.onstart = () => setIsListening(true);
      rec.onend = () => setIsListening(false);
      rec.onerror = (e: any) => {
        console.error("Speech recognition error:", e.error);
        setIsListening(false);
      };
      rec.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputText(prev => prev + (prev ? ' ' : '') + transcript);
        if (inputRef.current) {
          inputRef.current.focus();
        }
      };
      setRecognition(rec);
    }
  }, []);

  // Handle Speech Toggle
  const toggleListening = () => {
    if (!recognition) {
      alert("Speech recognition (STT) is not supported in this browser. Try Google Chrome or Microsoft Edge!");
      return;
    }

    if (isListening) {
      recognition.stop();
    } else {
      // Configure Speech Recognition locale
      if (language === 'hi') {
        recognition.lang = 'hi-IN';
      } else if (language === 'kn') {
        recognition.lang = 'kn-IN';
      } else {
        recognition.lang = 'en-IN';
      }
      try {
        recognition.start();
      } catch (err) {
        console.error("Speech start error:", err);
      }
    }
  };

  // Scroll to bottom helper
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Handle feed scroll to show/hide "Scroll Down" helper button
  const handleScroll = () => {
    if (!feedRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = feedRef.current;
    // Show button if user scrolled up more than 150px
    const isScrolledUp = scrollHeight - scrollTop - clientHeight > 150;
    setShowScrollDown(isScrolledUp);
  };

  // File selection & downscaling
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert("Please select a valid image file!");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 800;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.75);
        setAttachedImage(compressedBase64);
        setAttachedImageMime('image/jpeg');
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Input submissions
  const handleSend = () => {
    if (!inputText.trim() && !attachedImage) return;

    onSendMessage(inputText, attachedImage, attachedImageMime);
    setInputText('');
    setAttachedImage(null);
    setAttachedImageMime(null);
    setIsKeyboardOpen(false);

    setTimeout(() => {
      inputRef.current?.focus();
    }, 50);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Virtual Keyboard interactions
  const handleKeyboardPress = (char: string) => {
    setInputText(prev => prev + char);
    inputRef.current?.focus();
  };

  const handleKeyboardBackspace = () => {
    setInputText(prev => prev.slice(0, -1));
    inputRef.current?.focus();
  };

  // Helper trigger for specific active citations
  const handleCitationHighlight = (citation: Citation) => {
    alert(`Source Selected:\nAct: ${citation.act}\nSection: ${citation.section || 'General'}\nHeading: ${citation.heading || 'N/A'}`);
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 relative w-full px-4 sm:px-6">
      
      {/* Scrollable Chat Feed */}
      <div
        ref={feedRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto pt-6 pb-32 space-y-6 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent relative"
      >
        {messages.length === 0 ? (
          // Onboarding Layout
          <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-6 max-w-3xl mx-auto my-auto select-none animate-fade-up">
            <div className="w-16 h-16 rounded-2xl bg-[#a855f7]/10 border border-[#a855f7]/20 flex items-center justify-center text-[#a855f7] shadow-[0_0_30px_rgba(168,85,247,0.15)]">
              <Scale size={32} />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold tracking-tight text-white font-display">Ask your legal queries</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Describe a situation in Kannada, Hindi, or English. LexAI parses official acts, explains your rights in simple terms, and cites precise sections.
              </p>
            </div>

            <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
              <div className="p-4.5 rounded-2xl bg-slate-900/40 border border-slate-800/60 text-left text-xs leading-relaxed hover:border-[#a855f7]/30 hover:bg-slate-900/60 hover:shadow-[0_4px_25px_rgba(168,85,247,0.05)] transition-all duration-300 cursor-pointer"
                   onClick={() => setInputText("I bought a mobile phone from an online seller but they sent a fake model and are refusing a refund.")}>
                <span className="font-bold text-[#a855f7] block mb-1">Example (Consumer Rights):</span>
                "I bought a mobile phone from an online seller but they sent a fake model and are refusing a refund."
              </div>
              <div className="p-4.5 rounded-2xl bg-slate-900/40 border border-slate-800/60 text-left text-xs leading-relaxed hover:border-[#a855f7]/30 hover:bg-slate-900/60 hover:shadow-[0_4px_25px_rgba(168,85,247,0.05)] transition-all duration-300 cursor-pointer"
                   onClick={() => setInputText("ನನ್ನ ಮಾಲೀಕರು ಕಳೆದ ಎರಡು ತಿಂಗಳಿಂದ ಸಂಬಳ ಕೊಟ್ಟಿಲ್ಲ, ನಾನು ಏನು ಮಾಡಬೇಕು?")}>
                <span className="font-bold text-[#a855f7] block mb-1">Example (Labor Rights):</span>
                "ನನ್ನ ಮಾಲೀಕರು ಕಳೆದ ಎರಡು ತಿಂಗಳಿಂದ ಸಂಬಳ ಕೊಟ್ಟಿಲ್ಲ, ನಾನು ಏನು ಮಾಡಬೇಕು? (My employer hasn't paid salary)"
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 pt-4">
              <Info size={12} className="text-slate-600" />
              <span>Complies with Indian Legislation</span>
            </div>
          </div>
        ) : (
          // Conversation Feed
          <div className="space-y-6 max-w-3xl mx-auto w-full">
            {messages.map((msg, idx) => (
              <MessageBubble
                key={idx}
                message={msg}
                language={language}
                onCitationClick={handleCitationHighlight}
              />
            ))}
          </div>
        )}

        {/* Typing Loading Indicator */}
        {isLoading && (
          <div className="flex w-full mt-4 justify-start max-w-3xl mx-auto w-full animate-fade-in-up">
            <div className="flex items-start max-w-[75%] gap-3">
              <div className="flex items-center justify-center w-9 h-9 rounded-xl border shrink-0 bg-[#a855f7]/10 border-[#a855f7]/30 text-[#a855f7] shadow-[0_0_15px_rgba(168,85,247,0.15)]">
                <Scale size={16} />
              </div>
              <div className="glass-premium rounded-2xl rounded-tl-none px-4 py-3 shadow-lg flex items-center gap-1 h-10 select-none">
                <span className="typing-dot"></span>
                <span className="typing-dot"></span>
                <span className="typing-dot"></span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Floating Scroll down button */}
      {showScrollDown && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-28 right-8 p-2 bg-[#a855f7] text-white rounded-full shadow-lg border border-[#a855f7]/30 hover:bg-[#c084fc] transition-all z-20 animate-bounce active:scale-95 cursor-pointer"
        >
          <ArrowDown size={16} />
        </button>
      )}

      {/* Fixed Floating Input Bar (Centered and Floating) */}
      <div className="absolute bottom-6 left-0 right-0 px-4 sm:px-6 z-20 pointer-events-none">
        <div className="max-w-3xl mx-auto w-full pointer-events-auto space-y-2.5">
          
          {/* Attached Image Thumbnail Bar */}
          {attachedImage && (
            <div className="px-4 py-2 bg-slate-900/90 border border-slate-800 rounded-2xl flex items-center justify-between shrink-0 shadow-2xl animate-fade-up">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg border border-slate-700 overflow-hidden shadow bg-slate-950">
                  <img src={attachedImage} alt="Attachment thumbnail" className="w-full h-full object-cover" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-300 block">Multimodal Attachment Loaded</span>
                  <span className="text-[9px] text-slate-500">Image will be parsed for legal context</span>
                </div>
              </div>
              <button
                onClick={() => {
                  setAttachedImage(null);
                  setAttachedImageMime(null);
                }}
                className="p-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border border-slate-700 transition-colors cursor-pointer"
                title="Remove attachment"
              >
                <X size={14} />
              </button>
            </div>
          )}

          {/* Pill-shaped Floating Glass Input Panel */}
          <div className="bg-[#0b1120]/55 border border-white/8 backdrop-blur-2xl rounded-full p-2 pl-4 pr-3 flex items-center gap-2 shadow-[0_15px_50px_rgba(0,0,0,0.5)] focus-within:border-[#a855f7]/40 transition-all">
            
            {/* File input (Hidden) */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageChange}
              accept="image/*"
              className="hidden"
            />

            {/* Paperclip upload trigger */}
            <button
              onClick={() => fileInputRef.current?.click()}
              type="button"
              className="p-2 rounded-full text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-colors shrink-0 cursor-pointer"
              title="Attach image of document/notice"
            >
              <Paperclip size={18} />
            </button>

            {/* Text Area Input */}
            <textarea
              ref={inputRef}
              rows={1}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                language === 'kn'
                  ? "ಕನ್ನಡದಲ್ಲಿ ನಿಮ್ಮ ಕಾನೂನು ಪ್ರಶ್ನೆಯನ್ನು ಕೇಳಿ..."
                  : language === 'hi'
                    ? "हिन्दी में अपना कानूनी प्रश्न पूछें..."
                    : "Type your legal query (English)..."
              }
              className="flex-1 resize-none bg-transparent outline-none border-none py-2 px-1 text-slate-100 placeholder-slate-500 text-sm max-h-24 min-h-[36px]"
            />

            {/* Keyboard Toggle */}
            <button
              onClick={() => setIsKeyboardOpen(!isKeyboardOpen)}
              type="button"
              className={`p-2 rounded-full transition-colors shrink-0 cursor-pointer ${isKeyboardOpen
                  ? 'bg-[#a855f7]/10 text-[#a855f7] border border-[#a855f7]/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                }`}
              title="Toggle Visual Typing Assistant"
            >
              <KeyboardIcon size={18} />
            </button>

            {/* Microphone STT Trigger */}
            <button
              onClick={toggleListening}
              type="button"
              className={`p-2 rounded-full transition-colors shrink-0 cursor-pointer ${isListening
                  ? 'bg-rose-950 text-rose-400 border border-rose-500/30 animate-pulse-subtle'
                  : 'text-slate-400 hover:text-rose-400 hover:bg-white/5'
                }`}
              title={isListening ? "Listening... click to stop" : "Voice input (Speech to Text)"}
            >
              {isListening ? <MicOff size={18} /> : <Mic size={18} />}
            </button>

            {/* Send Button (Glowing Pill) */}
            <button
              onClick={handleSend}
              disabled={!inputText.trim() && !attachedImage}
              type="button"
              className={`p-2.5 rounded-full shrink-0 transition-all ${(inputText.trim() || attachedImage)
                  ? 'bg-[#a855f7] text-white hover:bg-[#c084fc] shadow-[0_0_15px_rgba(168,85,247,0.3)] cursor-pointer active:scale-95'
                  : 'text-slate-600 bg-slate-900/20 border border-slate-800/40 cursor-not-allowed'
                }`}
            >
              <Send size={16} className={inputText.trim() || attachedImage ? 'text-white' : 'text-slate-600'} />
            </button>
          </div>

          {/* Virtual Keyboard Drawer (Floating) */}
          <VirtualKeyboard
            isOpen={isKeyboardOpen}
            onKeyPress={handleKeyboardPress}
            onBackspace={handleKeyboardBackspace}
            onClose={() => setIsKeyboardOpen(false)}
          />

        </div>
      </div>

    </div>
  );
};
