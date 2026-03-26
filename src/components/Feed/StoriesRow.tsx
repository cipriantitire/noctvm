import Image from 'next/image';
import type { StoryUser } from '../StoriesViewerModal';

interface StoriesRowProps {
  user: any;
  liveStoryUsers: StoryUser[];
  onOpenStories: (users: StoryUser[], index: number) => void;
  onOpenCreateStory: () => void;
  showMyStoryDropdown: boolean;
  setShowMyStoryDropdown: (val: boolean) => void;
  dropdownPos: { top: number; left: number } | null;
  myStoryBtnRef: React.RefObject<HTMLButtonElement>;
  toggleMyStoryDropdown: () => void;
}

export function StoriesRow({
  user,
  liveStoryUsers,
  onOpenStories,
  onOpenCreateStory,
  showMyStoryDropdown,
  setShowMyStoryDropdown,
  dropdownPos,
  myStoryBtnRef,
  toggleMyStoryDropdown,
}: StoriesRowProps) {
  const myEntry = user ? liveStoryUsers.find(su => su.id === user.id) : null;
  const othersStoryUsers = liveStoryUsers.filter(su => su.id !== user?.id);
  const userInitial = user ? (user.display_name || user.email || 'N')[0].toUpperCase() : 'N';

  return (
    <div className="flex justify-center mb-4">
      <div className="flex gap-3 overflow-x-auto pb-3 scrollbar-hide px-2 py-3">
        {myEntry ? (
          <div className="relative flex-shrink-0">
            {showMyStoryDropdown && (
              <div className="fixed inset-0 z-popover" onClick={() => setShowMyStoryDropdown(false)} />
            )}
            <button
              ref={myStoryBtnRef}
              onClick={toggleMyStoryDropdown}
              className="flex flex-col items-center gap-1 relative z-20"
            >
              <div className="w-16 h-16 rounded-full p-0.5 bg-gradient-to-br from-noctvm-violet via-purple-500 to-pink-500">
                <div className="w-full h-full rounded-full bg-noctvm-black p-0.5">
                  <div className="w-full h-full rounded-full overflow-hidden bg-gradient-to-br from-noctvm-violet/30 to-purple-500/30 flex items-center justify-center">
                    {myEntry.avatarUrl ? (
                      <Image src={myEntry.avatarUrl} alt="" fill className="object-cover" unoptimized />
                    ) : (
                      <span className="text-white font-bold text-lg">{myEntry.avatar}</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="absolute bottom-5 right-0 w-5 h-5 rounded-full bg-noctvm-violet border-2 border-noctvm-black flex items-center justify-center z-20">
                <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
              </div>
              <span className="text-noctvm-caption text-noctvm-silver max-w-[60px] truncate">My Story</span>
            </button>
            {showMyStoryDropdown && dropdownPos && (
              <div
                className="fixed z-modal frosted-glass rounded-xl shadow-xl overflow-hidden min-w-[140px]"
                style={{ top: dropdownPos.top, left: dropdownPos.left, transform: 'translateX(-50%)' }}
              >
                <button
                  onClick={() => { setShowMyStoryDropdown(false); onOpenCreateStory(); }}
                  className="w-full px-4 py-2.5 text-xs text-white hover:bg-noctvm-midnight text-left flex items-center gap-2"
                >
                  <svg className="w-3.5 h-3.5 text-noctvm-violet" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                  Add to Story
                </button>
                <div className="h-px bg-noctvm-border" />
                <button
                  onClick={() => { setShowMyStoryDropdown(false); onOpenStories(liveStoryUsers, liveStoryUsers.indexOf(myEntry)); }}
                  className="w-full px-4 py-2.5 text-xs text-white hover:bg-noctvm-midnight text-left flex items-center gap-2"
                >
                  <svg className="w-3.5 h-3.5 text-noctvm-violet" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>
                  View My Story
                </button>
              </div>
            )}
          </div>
        ) : (
          <div
            onClick={() => onOpenCreateStory()}
            className="flex flex-col items-center gap-1 flex-shrink-0 cursor-pointer relative"
          >
            <div className="w-16 h-16 rounded-full overflow-hidden bg-noctvm-surface border border-noctvm-border flex items-center justify-center relative">
              {user?.avatar_url || user?.avatarUrl ? (
                <Image src={user.avatar_url || user.avatarUrl} alt="" fill className="object-cover" unoptimized />
              ) : (
                <span className="text-white font-bold text-lg">{userInitial}</span>
              )}
            </div>
            <div className="absolute bottom-5 right-0 w-5 h-5 rounded-full bg-noctvm-violet border-2 border-noctvm-black flex items-center justify-center z-20">
              <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
            </div>
            <span className="text-noctvm-micro text-noctvm-silver">Add Story</span>
          </div>
        )}

        {othersStoryUsers.map((su) => (
          <div
            key={su.id}
            onClick={() => onOpenStories(liveStoryUsers, liveStoryUsers.indexOf(su))}
            className="flex flex-col items-center gap-1 flex-shrink-0 cursor-pointer"
          >
            <div className="w-16 h-16 rounded-full border border-noctvm-border flex items-center justify-center overflow-hidden bg-noctvm-midnight relative">
              {su.avatarUrl ? (
                <Image src={su.avatarUrl} alt="" fill className="object-cover" unoptimized />
              ) : (
                <div className={`w-full h-full bg-gradient-to-br ${su.color} flex items-center justify-center`}>
                  <span className="text-sm font-bold text-white">{su.avatar}</span>
                </div>
              )}
            </div>
            <span className="text-noctvm-micro text-noctvm-silver truncate max-w-[64px]">{su.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
