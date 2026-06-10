import { cn } from '@/lib/utils';

/**
 * Sync runs only carry a user_id (no name/email), so the avatar shows a
 * deterministic initials placeholder derived from the id.
 */
const AVATAR_CLASSES = [
  'bg-sky-500/15 text-sky-300',
  'bg-emerald-500/15 text-emerald-300',
  'bg-amber-500/15 text-amber-300',
  'bg-rose-500/15 text-rose-300',
  'bg-violet-500/15 text-violet-300',
  'bg-cyan-500/15 text-cyan-300',
];

function colorIndex(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) % 9973;
  }
  return hash % AVATAR_CLASSES.length;
}

export function SyncUserAvatar({
  userId,
  className,
}: {
  userId: string;
  className?: string;
}) {
  const initials = userId
    .replace(/[^a-zA-Z0-9]/g, '')
    .slice(0, 2)
    .toUpperCase();

  return (
    <span
      title={userId}
      className={cn(
        'flex h-7 w-7 shrink-0 items-center justify-center rounded-full',
        'border border-zinc-700/60 font-mono text-[10px] font-semibold',
        AVATAR_CLASSES[colorIndex(userId)],
        className
      )}
    >
      {initials || '?'}
    </span>
  );
}
