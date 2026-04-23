'use client';

import React, { useState } from 'react';
import { Avatar } from '@/components/ui';

export interface MessageTreeNode {
  id: string;
  authorId?: string;
  authorName: string;
  authorHandle?: string;
  authorAvatar?: string;
  authorFallback?: string;
  authorBadge?: React.ReactNode;
  avatarRing?: 'none' | 'story-unseen' | 'story-seen';
  content: string;
  timestampStr?: string;
  replies?: MessageTreeNode[];
  isOwner?: boolean;
}

export interface MessageTreeProps {
  data: MessageTreeNode[];
  onReply?: (nodeId: string, replyText: string) => void;
  onEdit?: (nodeId: string, newText: string) => void;
  onDelete?: (nodeId: string) => void;
  currentUserId?: string;
  hideRootInput?: boolean;
}

interface TreeGridProps {
  node: MessageTreeNode;
  replyingTo: string | null;
  setReplyingTo: (id: string | null) => void;
  editingId: string | null;
  setEditingId: (id: string | null) => void;
  editContent: string;
  setEditContent: (c: string) => void;
  replyText: string;
  setReplyText: (t: string) => void;
  onReply?: (id: string, text: string) => void;
  onEdit?: (id: string, text: string) => void;
  onDelete?: (id: string) => void;
}

const TreeGridItem = ({
  node,
  replyingTo,
  setReplyingTo,
  editingId,
  setEditingId,
  editContent,
  setEditContent,
  replyText,
  setReplyText,
  onReply,
  onEdit,
  onDelete
}: TreeGridProps) => {
  const [showOptions, setShowOptions] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div className="grid grid-cols-[24px_minmax(0,1fr)] w-full relative animate-fade-in group/node">
      
      {/* 
        MAIN THREAD VERTICAL LINE 
        Only draw it if we have replies and the thread is not collapsed.
        This now only spans from the avatar down to where the replies section begins.
        The per-child elbow containers draw their own vertical continuation segments.
      */}

      {/* HEADER: AVATAR & META */}
      <div 
        className="contents cursor-pointer select-none group/header"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        {/* Avatar goes cleanly into the 24px column. Notice it has bg-noctvm-background so it hides the line underneath! */}
        <div className="w-[24px] h-[24px] flex justify-center items-center relative z-10 bg-noctvm-background">
          <Avatar 
            src={node.authorAvatar} 
            fallback={node.authorFallback || node.authorName[0]}
            size="sm"
            ring={node.avatarRing || 'none'}
            className="w-[24px] h-[24px]"
          />
        </div>
        {/* Meta text goes into the 1fr column. WE ADD ml-3 HERE, to push the text away from the Avatar! */}
        <div className="min-w-0 ml-3 flex items-center h-[24px]">
          <span className="font-bold text-xs text-white tracking-tight truncate group-hover/header:underline decoration-white/30">
            {node.authorHandle || node.authorName}
          </span>
          {node.authorBadge && (
            <span className="ml-1 inline-flex flex-shrink-0">{node.authorBadge}</span>
          )}
          {node.timestampStr && (
            <span className="text-noctvm-label text-noctvm-silver/50 font-medium tracking-tight ml-1.5 flex-shrink-0">
              • {node.timestampStr}
            </span>
          )}
          {isCollapsed && (
            <span className="text-noctvm-label text-noctvm-violet ml-2 font-black italic flex-shrink-0">
              [+] {node.replies ? node.replies.length + 1 : 1} Comments
            </span>
          )}
        </div>
      </div>

      {!isCollapsed && (
        <>
          {/* BODY */}
          <div className="contents">
            {/* Left column stem — always clickable to collapse this node. Visible line only when replies exist. */}
            <div 
              className="relative cursor-pointer"
              onClick={() => setIsCollapsed(true)}
              title="Collapse"
            >
              {node.replies && node.replies.length > 0 && (
                <div className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-[2px] bg-[hsl(240_5%_26%)]" />
              )}
            </div>
            
            {/* Body text goes into 1fr column. WE ADD ml-3 HERE too, so it aligns with the username! */}
            <div className="min-w-0 ml-3 mt-1 pb-1 relative z-10">
              {editingId === node.id ? (
                <div className="space-y-2 mt-1 pr-4 mb-2">
                  <input
                    type="text"
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="w-full bg-noctvm-surface border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-noctvm-violet/40 transition-all shadow-inner"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && onEdit) {
                        onEdit(node.id, editContent);
                        setEditingId(null);
                      }
                    }}
                  />
                  <div className="flex justify-end gap-3 px-2">
                    <button onClick={() => { setEditingId(null); setEditContent(''); }} className="text-noctvm-caption text-noctvm-silver hover:text-white uppercase font-black tracking-widest transition-colors">Cancel</button>
                    <button onClick={() => { 
                        if (onEdit) onEdit(node.id, editContent); 
                        setEditingId(null); 
                      }} 
                      className="text-noctvm-caption text-noctvm-violet hover:text-white uppercase font-black tracking-widest transition-colors">
                      Save
                    </button>
                  </div>
                </div>
              ) : (
                <div 
                  className="text-xs text-white/80 leading-relaxed pr-8 relative group/body"
                  onMouseEnter={() => setIsHovered(true)}
                  onMouseLeave={() => setIsHovered(false)}
                >
                  {node.content}

                  {/* Popover Options on Hover */}
                  {!editingId && (onEdit || onDelete) && node.isOwner !== false && (
                    <div className={`absolute right-0 top-0 group/menu transition-all z-20 ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
                      <button 
                        onClick={() => setShowOptions(!showOptions)}
                        className={`p-1 transition-colors ${showOptions ? 'text-white' : 'text-noctvm-silver/40 hover:text-white'}`}
                        title="Options"
                      >
                        <svg className="w-5 h-5 font-black" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 12h.01M12 12h.01M19 12h.01" /></svg>
                      </button>
                      
                      {showOptions && (
                        <div className="absolute right-0 top-full mt-1 flex flex-col bg-noctvm-midnight border border-noctvm-border rounded-xl shadow-2xl overflow-hidden min-w-[140px] z-modal animate-fade-in pointer-events-auto">
                          {onEdit && (
                            <button 
                              onClick={() => { setEditingId(node.id); setEditContent(node.content); setShowOptions(false); }} 
                              className="px-4 py-3 text-xs text-left text-white hover:bg-white/5 font-black uppercase tracking-wider transition-colors border-b border-white/5"
                            >
                              Edit
                            </button>
                          )}
                          {onDelete && (
                            <button 
                              onClick={() => { onDelete(node.id); setShowOptions(false); }} 
                              className="px-4 py-3 text-xs text-left text-red-500 hover:bg-red-500/10 font-black uppercase tracking-wider transition-colors"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      )}
                      {showOptions && <div className="fixed inset-0 z-[-1]" onClick={() => setShowOptions(false)} />}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ACTIONS ROW */}
          <div className="contents">
            {/* Left column stem — always clickable to collapse this node. Visible line only when replies exist. */}
            <div 
              className="relative cursor-pointer"
              onClick={() => setIsCollapsed(true)}
              title="Collapse"
            >
              {node.replies && node.replies.length > 0 && (
                <div className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-[2px] bg-[hsl(240_5%_26%)]" />
              )}
            </div>
            <div className="min-w-0 ml-3 pb-3 relative z-10">
              {!editingId && (
                <div className="flex items-center gap-4">
                  {onReply && (
                    <button 
                      onClick={() => setReplyingTo(replyingTo === node.id ? null : node.id)}
                      className={`text-noctvm-label font-bold transition-all flex items-center gap-1.5 ${replyingTo === node.id ? 'text-noctvm-violet scale-105' : 'text-noctvm-silver/60 hover:text-white'}`}
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>
                      Reply
                    </button>
                  )}
                </div>
              )}

              {/* Reply Input Box */}
              {replyingTo === node.id && (
                <div className="mt-2 mb-4 relative animate-slide-up">
                  <input
                    type="text"
                    autoFocus
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder={`Reply to ${node.authorHandle || node.authorName}...`}
                    className="w-full bg-black/40 border border-white/5 rounded-2xl px-4 py-2 text-xs text-white focus:outline-none focus:border-noctvm-violet/40 pr-16 transition-all shadow-inner"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && onReply) {
                        onReply(node.id, replyText);
                        setReplyingTo(null);
                        setReplyText('');
                      }
                    }}
                  />
                  <button
                    onClick={() => {
                      if (onReply) onReply(node.id, replyText);
                      setReplyingTo(null);
                      setReplyText('');
                    }}
                    disabled={!replyText.trim()}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-noctvm-label font-bold text-noctvm-violet hover:text-white hover:scale-105 active:scale-[0.96] disabled:opacity-30 disabled:scale-100 transition-all"
                  >
                    Post
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* REPLIES */}
          {node.replies && node.replies.length > 0 && (
             <div className="contents">
               {node.replies.map((reply, index) => {
                 const isLast = index === node.replies!.length - 1;
                 return (
                   <React.Fragment key={reply.id}>
                     
                     {/* 
                       THE ELBOW
                       Each child draws its own vertical + horizontal connector.
                       - Non-last children: vertical line runs full height (top to bottom)
                         connecting to the next sibling below.
                       - Last child: vertical line only runs from top to the elbow
                         junction point (12px), then stops. No masking needed.
                       The elbow curve connects the vertical to the child.
                       All lines are 100% opaque to prevent overlap artifacts.
                     */}
                     <div className="elbow relative w-[24px] pointer-events-none z-10">
                       {/* Vertical continuation — only non-last children need this to connect to the next sibling */}
                       {!isLast && (
                         <div className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-[2px] bg-[hsl(240_5%_26%)]" />
                       )}
                       {/* L-shaped elbow: border-l is the vertical stroke through the elbow height, border-b is the horizontal arm */}
                       <div className="absolute right-0 top-0 w-[13px] h-[12px] border-l-[2px] border-b-[2px] border-[hsl(240_5%_26%)] rounded-bl-[12px]" />
                     </div>
                     
                     {/* 
                       THE CHILD
                       Flushed with the left column so the elbow connects cleanly.
                     */}
                     <div className="min-w-0 pb-3">
                       <TreeGridItem 
                        node={reply} 
                        replyingTo={replyingTo}
                        setReplyingTo={setReplyingTo}
                        editingId={editingId}
                        setEditingId={setEditingId}
                        editContent={editContent}
                        setEditContent={setEditContent}
                        replyText={replyText}
                        setReplyText={setReplyText}
                        onReply={onReply}
                        onEdit={onEdit}
                        onDelete={onDelete}
                       />
                     </div>

                   </React.Fragment>
                 )
               })}
             </div>
          )}
        </>
      )}
    </div>
  );
};

export function MessageTree({
  data,
  onReply,
  onEdit,
  onDelete,
  hideRootInput = false
}: MessageTreeProps) {
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [replyText, setReplyText] = useState('');
  const [rootText, setRootText] = useState('');

  return (
    <div className="w-full flex flex-col pt-2">
      {!hideRootInput && (
        <div className="relative group mb-6">
          <input
            type="text"
            value={rootText}
            onChange={(e) => setRootText(e.target.value)}
            placeholder="Write a message..."
            className="w-full bg-noctvm-surface border border-noctvm-border rounded-xl px-5 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-noctvm-violet/40 focus:border-noctvm-violet/40 transition-all pr-24"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && onReply && rootText.trim()) {
                onReply('root', rootText);
                setRootText('');
              }
            }}
          />
          <button
            onClick={() => {
              if (onReply && rootText.trim()) {
                onReply('root', rootText);
                setRootText('');
              }
            }}
            disabled={!rootText.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-white text-black px-4 py-1.5 rounded-lg text-xs font-bold shadow-lg hover:scale-105 active:scale-[0.96] disabled:opacity-30 disabled:scale-100 transition-all"
          >
            Post
          </button>
        </div>
      )}

      {data.length === 0 ? (
        <div className="py-8 text-center bg-white/[0.02] rounded-xl border border-dashed border-white/5">
          <p className="text-noctvm-label text-noctvm-silver/40 font-bold uppercase tracking-widest">No messages yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {data.map((node) => (
            <TreeGridItem 
              key={node.id} 
              node={node} 
              replyingTo={replyingTo}
              setReplyingTo={setReplyingTo}
              editingId={editingId}
              setEditingId={setEditingId}
              editContent={editContent}
              setEditContent={setEditContent}
              replyText={replyText}
              setReplyText={setReplyText}
              onReply={onReply}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default MessageTree;
