import React, { forwardRef } from 'react';
import { SearchIcon } from '@/components/icons';

export interface SearchBoxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
  onClear?: () => void;
  wrapperClassName?: string;
}

export const SearchBox = forwardRef<HTMLInputElement, SearchBoxProps>(
  ({ icon, onClear, wrapperClassName = '', className = '', value, onChange, ...props }, ref) => {
    
    // Check if the input is controlled or uncontrolled to display the clear button
    const hasValue = value !== undefined ? Boolean(value) : false;

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
          className={`w-full bg-noctvm-surface border border-noctvm-border rounded-xl py-3 pl-11 pr-10 text-sm text-white placeholder:text-noctvm-silver/50 focus:outline-none focus:border-noctvm-violet/50 focus:shadow-glow transition-all ${className}`}
          {...props}
        />

        {hasValue && onClear && (
          <button
            type="button"
            onClick={onClear}
            className="absolute right-3 p-1 rounded-full text-noctvm-silver/50 hover:text-white hover:bg-white/10 transition-colors"
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
