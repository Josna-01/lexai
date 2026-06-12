import React, { useState, useRef, useEffect } from 'react';
import { Message, MessageBubble } from './MessageBubble';
import { VirtualKeyboard } from './VirtualKeyboard';
import { Citation } from './CitationTag';
import { 
  Send, Mic, MicOff, Keyboard as KeyboardIcon, 
  X, Paperclip, ShieldCheck, Scale, ArrowDown, Info 
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
        // High quality scale down to maximum 800px bounds (saves credit tokens and bandwidth)
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

        // Compress image to JPEG representation
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
    
    // Auto-focus input again
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
    <div className="flex flex-col h-full bg-slate-950 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden glass-panel">
      
      {/* Upper Brand Bar */}
      <div className="px-5 py-4 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-gradient-to-tr from-primary-600 to-accent-600 text-white shadow-md">
            <Scale size={20} />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-1.5 leading-none">
              LexAI Agent 
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <ShieldCheck size={9} /> Verified Laws
              </span>
            </h2>
            <p className="text-[10px] text-slate-400 mt-1">Indian Constitution & Legal Rights Companion</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-slate-500 font-bold bg-slate-900 border border-slate-800 px-2 py-1 rounded">
            Active Mode: {language === 'kn' ? 'ಕನ್ನಡ' : language === 'hi' ? 'हिन्दी' : 'English'}
          </span>
        </div>
      </div>

      {/* Main Conversation Stream */}
      <div 
        ref={feedRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-5 py-3 space-y-4 min-h-0 relative bg-slate-950/40"
      >
        {messages.length === 0 ? (
          // Onboarding Layout
          <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4 max-w-md mx-auto my-auto select-none">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-950 to-slate-900 border border-primary-500/20 flex items-center justify-center text-primary-400 shadow-xl">
              <Scale size={32} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Ask your legal queries</h3>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                Describe a situation in Kannada, Hindi, or English. LexAI parses official acts, explains your rights in simple terms, and cites precise sections.
              </p>
            </div>
            
            <div className="w-full grid grid-cols-1 gap-2.5 pt-3">
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-left text-[11px] leading-relaxed">
                <span className="font-bold text-accent-400 block mb-0.5">Example (Consumer Rights):</span>
                "I bought a mobile phone from an online seller but they sent a fake model and are refusing a refund."
              </div>
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-left text-[11px] leading-relaxed">
                <span className="font-bold text-accent-400 block mb-0.5">Example (Labor Rights):</span>
                "ನನ್ನ ಮಾಲೀಕರು ಕಳೆದ ಎರಡು ತಿಂಗಳಿಂದ ಸಂಬಳ ಕೊಟ್ಟಿಲ್ಲ, ನಾನು ಏನು ಮಾಡಬೇಕು? (My employer hasn't paid salary)"
              </div>
            </div>
            
            <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
              <Info size={11} />
              <span>Complies with Indian Legislation</span>
            </div>
          </div>
        ) : (
          // Conversation Feed
          messages.map((msg, idx) => (
            <MessageBubble 
              key={idx} 
              message={msg} 
              language={language}
              onCitationClick={handleCitationHighlight}
            />
          ))
        )}

        {/* Typing Loading Indicator */}
        {isLoading && (
          <div className="flex w-full mt-4 justify-start animate-fade-in-up">
            <div className="flex items-start max-w-[75%] gap-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-full border bg-primary-950 border-primary-500/30 text-accent-400 shrink-0">
                <Scale size={16} />
              </div>
              <div className="glass-panel border-primary-500/20 rounded-2xl rounded-tl-none px-4 py-3 shadow-lg flex items-center gap-1 h-10 select-none">
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
          className="absolute bottom-28 right-8 p-2 bg-primary-500 text-white rounded-full shadow-lg border border-primary-400 hover:bg-primary-600 transition-all z-10 animate-bounce active:scale-95"
        >
          <ArrowDown size={16} />
        </button>
      )}

      {/* Attached Image Thumbnail Bar */}
      {attachedImage && (
        <div className="px-5 py-2.5 bg-slate-900/90 border-t border-slate-800/80 flex items-center justify-between shrink-0">
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

      {/* Typing & Media Inputs Area */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/80 shrink-0">
        <div className="flex items-end gap-2 bg-slate-900 border border-slate-800 rounded-xl p-1.5 focus-within:border-primary-500/60 focus-within:ring-1 focus-within:ring-primary-500/40 transition-all">
          
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
            className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-colors shrink-0 cursor-pointer"
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
            className="flex-1 resize-none bg-transparent outline-none border-none py-1.5 px-1 text-slate-100 placeholder-slate-500 text-sm max-h-24 min-h-[36px]"
          />

          {/* Keyboard Toggle */}
          <button
            onClick={() => setIsKeyboardOpen(!isKeyboardOpen)}
            type="button"
            className={`p-2 rounded-lg transition-colors shrink-0 cursor-pointer ${
              isKeyboardOpen 
                ? 'bg-primary-950 text-accent-400 border border-primary-500/30' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
            title="Toggle Visual Typing Assistant"
          >
            <KeyboardIcon size={18} />
          </button>

          {/* Microphone STT Trigger */}
          <button
            onClick={toggleListening}
            type="button"
            className={`p-2 rounded-lg transition-colors shrink-0 cursor-pointer ${
              isListening 
                ? 'bg-rose-950 text-rose-400 border border-rose-500/30 animate-pulse-subtle' 
                : 'text-slate-400 hover:text-rose-400 hover:bg-slate-800/60'
            }`}
            title={isListening ? "Listening... click to stop" : "Voice input (Speech to Text)"}
          >
            {isListening ? <MicOff size={18} /> : <Mic size={18} />}
          </button>

          {/* Send Button */}
          <button
            onClick={handleSend}
            disabled={!inputText.trim() && !attachedImage}
            type="button"
            className={`p-2.5 rounded-lg shrink-0 transition-all ${
              (inputText.trim() || attachedImage)
                ? 'bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 text-white shadow-md cursor-pointer active:scale-95'
                : 'text-slate-600 bg-slate-950/20 border border-slate-900 cursor-not-allowed'
            }`}
          >
            <Send size={16} />
          </button>
        </div>
      </div>

      {/* Visual Typing Assistant Drawer */}
      <VirtualKeyboard
        isOpen={isKeyboardOpen}
        onKeyPress={handleKeyboardPress}
        onBackspace={handleKeyboardBackspace}
        onClose={() => setIsKeyboardOpen(false)}
      />

    </div>
  );
};
