'use client';

import { useState, useEffect } from 'react';
import TaggedUsersModal from './TaggedUsersModal';
import TaggedUsersSheet from './TaggedUsersSheet';

interface TaggedUsersOverlayProps {
  handles: string[];
  isOpen: boolean;
  onClose: () => void;
}

export default function TaggedUsersOverlay({ handles, isOpen, onClose }: TaggedUsersOverlayProps) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  return isMobile 
    ? <TaggedUsersSheet handles={handles} isOpen={isOpen} onClose={onClose} />
    : <TaggedUsersModal handles={handles} isOpen={isOpen} onClose={onClose} />;
}
