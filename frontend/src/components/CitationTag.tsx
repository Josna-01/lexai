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
  purple?: boolean;
}

export const CitationTag: React.FC<CitationTagProps> = ({ citation, onClick, purple }) => {
  const { act, section, year } = citation;

  // Create display label
  const label = `${act}${year ? `, ${year}` : ''}${section ? ` - Sec ${section}` : ''}`;

  return (
    <button
      onClick={onClick}
      type="button"
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#0B1120]/80 transition-all duration-300 cursor-pointer shadow-[0_2px_8px_rgba(0,0,0,0.4)] hover:-translate-y-0.5 ${
        purple
          ? 'text-[#a855f7] border border-[#a855f7]/25 hover:border-[#a855f7]/45 hover:bg-[#a855f7]/5'
          : 'text-[#F5C518] border border-[#F5C518]/25 hover:border-[#F5C518]/45 hover:bg-[#F5C518]/5'
      }`}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 20 20"
        fill="currentColor"
        className="w-3.5 h-3.5 opacity-80"
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
