import { Avatar } from '@/components/ui';
import type { StoryUser } from '../StoriesViewerModal';

interface StoriesRowProps {
  user: any;
  liveStoryUsers: StoryUser[];
  onOpenStories: (users: StoryUser[], index: number) => void;
  onOpenCreateStory: () => void;
}

export function StoriesRow({
  user,
  liveStoryUsers,
  onOpenStories,
  onOpenCreateStory,
}: StoriesRowProps) {
  const myEntry = user ? liveStoryUsers.find(su => su.id === user.id) : null;
  const othersStoryUsers = liveStoryUsers.filter(su => su.id !== user?.id);
  const userInitial = user ? (user.display_name || user.email || 'N')[0].toUpperCase() : 'N';
  const myStoryRing = myEntry ? (myEntry.hasNew ? 'story-unseen' : 'story-seen') : 'none';
  const myStoryIndex = myEntry ? liveStoryUsers.findIndex(su => su.id === myEntry.id) : -1;

  const openMyStoryViewer = () => {
    if (!myEntry || myStoryIndex < 0) return;
    onOpenStories(liveStoryUsers, myStoryIndex);
  };

  return (
    <div className="flex justify-start mb-4">
      <div className="flex gap-3 overflow-x-auto pb-3 scrollbar-hide px-2 py-3">
        {myEntry ? (
          <div
            className="relative flex-shrink-0 flex flex-col items-center gap-1 cursor-pointer"
            role="button"
            tabIndex={0}
            onClick={openMyStoryViewer}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                openMyStoryViewer();
              }
            }}
          >
            <Avatar
              src={myEntry.avatarUrl}
              alt={myEntry.name}
              fallback={myEntry.avatar}
              size="2xl"
              ring={myStoryRing}
              showAddStoryButton
              onAddStoryClick={onOpenCreateStory}
              className="w-16 h-16"
            />
            <span className="text-noctvm-caption text-noctvm-silver max-w-[60px] truncate">My Story</span>
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
