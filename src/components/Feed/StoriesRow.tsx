import { Avatar } from '@/components/ui';
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
  const myStoryRing = myEntry ? (myEntry.hasNew ? 'story-unseen' : 'story-seen') : 'none';

  return (
    <div className="flex justify-center mb-4">
      <div className="flex gap-3 overflow-x-auto pb-3 scrollbar-hide px-2 py-3">
        {myEntry ? (
          <div className="relative flex-shrink-0">
            {showMyStoryDropdown && (
              <div className="fixed inset-0 z-popover" onClick={() => setShowMyStoryDropdown(false)} />
            )}
            <button
              type="button"
              ref={myStoryBtnRef}
              onClick={toggleMyStoryDropdown}
              className="flex flex-col items-center gap-1 relative z-20"
            >
              <Avatar
                src={myEntry.avatarUrl}
                alt={myEntry.name}
                fallback={myEntry.avatar}
                size="2xl"
                ring={myStoryRing}
                showAddStoryButton
                onAddStoryClick={() => {
                  setShowMyStoryDropdown(false);
                  onOpenCreateStory();
                }}
                className="w-16 h-16"
              />
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
            className="flex flex-col items-center gap-1 flex-shrink-0 cursor-pointer relative"
          >
            <Avatar
              src={user?.avatar_url || user?.avatarUrl}
              alt={user?.display_name || user?.email || 'Profile'}
              fallback={userInitial}
              size="2xl"
              ring="none"
              showAddStoryButton
              onAddStoryClick={() => onOpenCreateStory()}
              onClick={() => onOpenCreateStory()}
              className="w-16 h-16"
            />
            <span className="text-noctvm-micro text-noctvm-silver">Add Story</span>
          </div>
        )}

        {othersStoryUsers.map((su) => (
          <button
            type="button"
            key={su.id}
            onClick={() => onOpenStories(liveStoryUsers, liveStoryUsers.indexOf(su))}
            className="flex flex-col items-center gap-1 flex-shrink-0 cursor-pointer"
          >
            <Avatar
              src={su.avatarUrl}
              alt={su.name}
              fallback={su.avatar}
              size="2xl"
              ring={su.hasNew ? 'story-unseen' : 'story-seen'}
              className="w-16 h-16"
            />
            <span className="text-noctvm-micro text-noctvm-silver truncate max-w-[64px]">{su.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
