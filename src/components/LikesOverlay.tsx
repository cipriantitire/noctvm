'use client';

import { useState, useEffect } from 'react';
import LikesSheet from './LikesSheet';
import LikesModal from './LikesModal';

interface LikesOverlayProps {
  postId: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function LikesOverlay({ postId, isOpen, onClose }: LikesOverlayProps) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  if (!isOpen) return null;

  return isMobile 
    ? <LikesSheet postId={postId} isOpen={isOpen} onClose={onClose} />
    : <LikesModal postId={postId} isOpen={isOpen} onClose={onClose} />;
}
