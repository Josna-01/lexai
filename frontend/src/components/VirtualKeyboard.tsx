import React, { useState } from 'react';
import { Keyboard, X, Delete } from 'lucide-react';

interface VirtualKeyboardProps {
  onKeyPress: (char: string) => void;
  onBackspace: () => void;
  onClose: () => void;
  isOpen: boolean;
}

const HINDI_VOWELS = ['अ', 'आ', 'इ', 'ई', 'उ', 'ऊ', 'ऋ', 'ए', 'ऐ', 'ओ', 'औ', 'अं', 'अः'];
const HINDI_CONSONANTS = [
  'क', 'ख', 'ग', 'घ', 'ङ', 
  'च', 'छ', 'ज', 'झ', 'ञ', 
  'ट', 'ठ', 'ड', 'ढ', 'ण', 
  'त', 'थ', 'द', 'ध', 'न', 
  'प', 'फ', 'ब', 'भ', 'म', 
  'य', 'र', 'ल', 'व', 'श', 
  'ष', 'स', 'ह', 'क्ष', 'त्र', 'ज्ञ'
];
const HINDI_MATRAS = ['ा', 'ि', 'ी', 'ु', 'ू', 'ृ', 'े', 'ै', 'ो', 'ौ', 'ं', 'ः', '्'];

const KANNADA_VOWELS = ['ಅ', 'ಆ', 'ಇ', 'ಈ', 'ಉ', 'ಊ', 'ಋ', 'ಎ', 'ಏ', 'ಐ', 'ಒ', 'ಓ', 'ಔ', 'ಅಂ', 'ಅಃ'];
const KANNADA_CONSONANTS = [
  'ಕ', 'ಖ', 'ಗ', 'ಘ', 'ಙ',
  'ಚ', 'ಛ', 'ಜ', 'ಝ', 'ಞ',
  'ಟ', 'ಠ', 'ಡ', 'ಢ', 'ಣ',
  'ತ', 'ಥ', 'ದ', 'ಧ', 'ನ',
  'ಪ', 'ಫ', 'ಬ', 'ಭ', 'ಮ',
  'ಯ', 'ರ', 'ಲ', 'ವ', 'ಶ',
  'ಷ', 'ಸ', 'ಹ', 'ಳ', 'ಕ್ಷ', 'ಜ್ಞ'
];
const KANNADA_MATRAS = ['ಾ', 'ಿ', 'ೀ', 'ು', 'ೂ', 'ೃ', 'ೆ', 'ೇ', 'ೈ', 'ೊ', 'ೋ', 'ೌ', 'ಂ', 'ಃ', '್'];

export const VirtualKeyboard: React.FC<VirtualKeyboardProps> = ({ onKeyPress, onBackspace, onClose, isOpen }) => {
  const [layout, setLayout] = useState<'hi' | 'kn'>('hi');

  if (!isOpen) return null;

  const vowels = layout === 'hi' ? HINDI_VOWELS : KANNADA_VOWELS;
  const consonants = layout === 'hi' ? HINDI_CONSONANTS : KANNADA_CONSONANTS;
  const matras = layout === 'hi' ? HINDI_MATRAS : KANNADA_MATRAS;

  return (
    <div className="border-t border-slate-800 bg-slate-950/95 backdrop-blur-md p-3 select-none animate-fade-in-up shadow-2xl relative">
      {/* Keyboard Header / Controls */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <Keyboard size={16} className="text-accent-400" />
          <span className="text-xs font-semibold text-slate-300">LexAI Typing Assistant</span>
          
          {/* Language Selector Tabs */}
          <div className="flex ml-4 rounded-lg bg-slate-900 p-0.5 border border-slate-800">
            <button
              onClick={() => setLayout('hi')}
              className={`text-[10px] font-bold px-2.5 py-1 rounded-md transition-colors ${
                layout === 'hi' 
                  ? 'bg-primary-500 text-white shadow-md' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              हिन्दी (Hindi)
            </button>
            <button
              onClick={() => setLayout('kn')}
              className={`text-[10px] font-bold px-2.5 py-1 rounded-md transition-colors ${
                layout === 'kn' 
                  ? 'bg-primary-500 text-white shadow-md' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              ಕನ್ನಡ (Kannada)
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Backspace key */}
          <button
            onClick={onBackspace}
            type="button"
            className="flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 bg-slate-900 border border-slate-800 rounded-lg text-rose-400 hover:bg-slate-800 hover:text-rose-300 transition-colors shadow-sm"
          >
            <Delete size={12} />
            <span>Clear</span>
          </button>
          {/* Close button */}
          <button
            onClick={onClose}
            type="button"
            className="p-1 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent hover:border-slate-800 transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Keyboard Layout Grid */}
      <div className="max-h-48 overflow-y-auto space-y-3 pb-1.5 pr-0.5">
        {/* Vowels */}
        <div>
          <div className="text-[9px] uppercase tracking-wider text-slate-500 font-bold mb-1">Vowels</div>
          <div className="flex flex-wrap gap-1">
            {vowels.map((char) => (
              <button
                key={char}
                onClick={() => onKeyPress(char)}
                type="button"
                className="w-8 h-8 flex items-center justify-center bg-slate-900 hover:bg-primary-950 border border-slate-800 hover:border-primary-500/50 rounded-lg text-sm text-slate-200 hover:text-accent-300 font-medium active:scale-95 transition-all shadow-sm"
              >
                {char}
              </button>
            ))}
          </div>
        </div>

        {/* Matras/Modifiers */}
        <div>
          <div className="text-[9px] uppercase tracking-wider text-slate-500 font-bold mb-1">Modifiers / Matras</div>
          <div className="flex flex-wrap gap-1">
            {matras.map((char) => (
              <button
                key={char}
                onClick={() => onKeyPress(char)}
                type="button"
                className="w-8 h-8 flex items-center justify-center bg-slate-900 hover:bg-primary-950 border border-slate-800 hover:border-primary-500/50 rounded-lg text-sm text-slate-200 hover:text-accent-300 font-medium active:scale-95 transition-all shadow-sm"
              >
                {char}
              </button>
            ))}
          </div>
        </div>

        {/* Consonants */}
        <div>
          <div className="text-[9px] uppercase tracking-wider text-slate-500 font-bold mb-1">Consonants</div>
          <div className="flex flex-wrap gap-1">
            {consonants.map((char) => (
              <button
                key={char}
                onClick={() => onKeyPress(char)}
                type="button"
                className="w-8 h-8 flex items-center justify-center bg-slate-900 hover:bg-primary-950 border border-slate-800 hover:border-primary-500/50 rounded-lg text-sm text-slate-200 hover:text-accent-300 font-medium active:scale-95 transition-all shadow-sm"
              >
                {char}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
