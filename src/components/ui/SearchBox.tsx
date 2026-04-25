import React, { forwardRef } from 'react';
import { SearchIcon } from '@/components/icons';

export interface SearchBoxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
  onClear?: () => void;
  wrapperClassName?: string;
  tone?: 'solid' | 'glass';
}

export const SearchBox = forwardRef<HTMLInputElement, SearchBoxProps>(
  ({ icon, onClear, wrapperClassName = '', className = '', tone = 'solid', value, onChange, style, ...props }, ref) => {
    
    // Check if the input is controlled or uncontrolled to display the clear button
    const hasValue = value !== undefined ? Boolean(value) : false;
    const toneClassName = tone === 'glass'
      ? 'appearance-none border-white/10 backdrop-blur-md shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_10px_24px_rgba(0,0,0,0.22)]'
      : 'bg-noctvm-surface border-noctvm-border';
    const toneStyle = tone === 'glass'
      ? { backgroundColor: 'rgba(10, 10, 10, 0.58)' }
      : undefined;

    return (
      <div className={`relative flex items-center w-full ${wrapperClassName}`}>
        <div className="absolute left-3.5 text-noctvm-silver/50 pointer-events-none">
          {icon || <SearchIcon className="w-4 h-4" />}
        </div>
        
        <input
          ref={ref}
          type="text"
          value={value}
          onChange={onChange}
          className={`w-full rounded-xl py-3 pl-11 pr-10 text-sm text-foreground placeholder:text-noctvm-silver/50 focus:outline-none focus:border-noctvm-violet/50 focus:shadow-glow transition-all ${toneClassName} ${className}`}
          style={{ ...toneStyle, ...style }}
          {...props}
        />

        {hasValue && onClear && (
          <button
            type="button"
            onClick={onClear}
            className="absolute right-3 p-1 rounded-full text-noctvm-silver/50 hover:text-foreground hover:bg-white/10 transition-colors"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    );
  }
);

SearchBox.displayName = 'SearchBox';
export default SearchBox;
