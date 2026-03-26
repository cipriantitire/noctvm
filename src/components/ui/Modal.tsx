'use client';

import React, { useState, useEffect, useCallback, type MouseEvent } from 'react';
import { GlassPanel, IconButton } from '@/components/ui';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  zIndex?: number;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  showCloseButton?: boolean;
}

const maxWidthMap = {
  sm: 'sm:w-[400px]',
  md: 'sm:w-[560px]',
  lg: 'sm:w-[720px]',
  xl: 'sm:w-[960px]',
  '2xl': 'sm:w-[1280px]',
  full: 'sm:w-[95%] lg:w-[90%]'
};

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  zIndex = 100,
  maxWidth = 'md',
  showCloseButton = true
}: ModalProps) {
  const [isRendered, setIsRendered] = useState(isOpen);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsRendered(true);
      setIsClosing(false);
      document.body.style.overflow = 'hidden';
    } else if (isRendered) {
      setIsClosing(true);
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      // Clean up on unmount just in case
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, isRendered]);

  const handleClose = useCallback(() => {
    if (!isClosing) {
      onClose();
    }
  }, [isClosing, onClose]);

  // Handle ESC key
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, handleClose]);

  if (!isRendered) return null;

  return (
    <div
      className={`fixed inset-0 flex sm:items-center sm:justify-center p-0 sm:p-4 lg:p-8 ${isClosing ? 'animate-fade-out' : 'animate-fade-in'}`}
      style={{ zIndex }}
    >
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-md" 
        onClick={handleClose} 
      />

      {/* Modal Container */}
      <GlassPanel
        variant="modal"
        className={`relative w-full h-full ${maxWidthMap[maxWidth]} sm:h-auto sm:max-h-[90vh] sm:rounded-3xl overflow-hidden flex flex-col shadow-2xl shadow-black/80 ${
          isClosing ? 'animate-scale-out' : 'animate-scale-in'
        }`}
        style={{ zIndex: zIndex + 1 }}
        onClick={(e: MouseEvent<HTMLDivElement>) => e.stopPropagation()}
        onAnimationEnd={() => {
          if (isClosing) {
            setIsRendered(false);
          }
        }}
      >
        {/* Header Options */}
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-noctvm-border bg-noctvm-midnight/50 flex-shrink-0">
            <div className="flex-1">
              {typeof title === 'string' ? (
                <h2 className="font-heading text-xl font-bold text-white">{title}</h2>
              ) : (
                title
              )}
            </div>
            {showCloseButton && (
              <IconButton
                onClick={handleClose}
                title="Close"
                aria-label="Close modal"
                className="ml-4"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                   <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </IconButton>
            )}
          </div>
        )}

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto w-full">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="px-6 py-4 border-t border-noctvm-border bg-noctvm-midnight flex-shrink-0">
            {footer}
          </div>
        )}
      </GlassPanel>
    </div>
  );
}

export default Modal;
