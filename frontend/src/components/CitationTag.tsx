import React from 'react';

export interface Citation {
  act: string;
  section?: string | null;
  heading?: string | null;
  year?: number | null;
}

interface CitationTagProps {
  citation: Citation;
  onClick?: () => void;
}

export const CitationTag: React.FC<CitationTagProps> = ({ citation, onClick }) => {
  const { act, section, year } = citation;
  
  // Create display label
  const label = `${act}${year ? `, ${year}` : ''}${section ? ` - Sec ${section}` : ''}`;
  
  return (
    <button
      onClick={onClick}
      type="button"
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-primary-900/40 text-primary-300 border border-primary-500/20 hover:border-primary-400/40 hover:bg-primary-900/60 transition-all duration-200 cursor-pointer shadow-sm shadow-black/10"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 20 20"
        fill="currentColor"
        className="w-3.5 h-3.5"
      >
        <path
          fillRule="evenodd"
          d="M10 2a.75.75 0 0 1 .75.75v5.59l1.95-2.1a.75.75 0 1 1 1.1 1.02l-3.25 3.5a.75.75 0 0 1-1.1 0L6.2 7.76a.75.75 0 1 1 1.1-1.02l1.95 2.1V2.75A.75.75 0 0 1 10 2Zm-4 9.25a.75.75 0 0 0-1.5 0v2.5A2.25 2.25 0 0 0 6.75 16h6.5A2.25 2.25 0 0 0 15.5 13.75v-2.5a.75.75 0 0 0-1.5 0v2.5a.75.75 0 0 1-.75.75h-6.5a.75.75 0 0 1-.75-.75v-2.5Z"
          clipRule="evenodd"
        />
      </svg>
      {label}
    </button>
  );
};
