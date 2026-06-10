import { useMemo } from 'react';
import { Link } from '@tanstack/react-router';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { useRecentSyncs } from '@/hooks/api/use-sync-status';
import { cn } from '@/lib/utils';
import {
  SOURCE_LABELS,
  STAGE_LABELS,
  RUN_STATUS_CLASSES,
  formatRunDuration,
  formatRelative,
} from '@/lib/utils/sync-format';
import { ROUTES } from '@/lib/constants/routes';
import type { SyncRunSummary, SyncStatusEvent } from '@/lib/api';
import { SyncUserAvatar } from './sync-user-avatar';

interface SyncRunDetailSheetProps {
  run: SyncRunSummary | null;
  onClose: () => void;
}

export function SyncRunDetailSheet({ run, onClose }: SyncRunDetailSheetProps) {
  return (
    <Sheet open={!!run} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full sm:max-w-xl border-zinc-800">
        {run && <SheetBody run={run} />}
      </SheetContent>
    </Sheet>
  );
}

function formatAbsolute(iso: string | null): string {
  if (!iso) return '—';
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString();
}

function SheetBody({ run }: { run: SyncRunSummary }) {
  const badgeClass =
    RUN_STATUS_CLASSES[run.status] ?? RUN_STATUS_CLASSES.in_progress;
  const inProgress = run.status === 'in_progress';

  return (
    <>
      <SheetHeader>
        <SheetTitle className="flex items-center gap-2">
          <span className="capitalize">{run.provider}</span>
          <span className="text-zinc-500 font-normal">
            {SOURCE_LABELS[run.source] ?? run.source}
          </span>
          <span
            className={cn(
              'rounded-full px-2 py-0.5 text-xs font-medium capitalize',
              badgeClass
            )}
          >
            {run.status.replace('_', ' ')}
          </span>
        </SheetTitle>
        <SheetDescription>
          <code className="font-mono text-[10px] break-all">{run.run_id}</code>
        </SheetDescription>
      </SheetHeader>

      <div className="overflow-y-auto px-4 pb-6 space-y-5 text-sm">
        <Field label="User">
          <Link
            to={ROUTES.user}
            params={{ userId: run.user_id }}
            className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 hover:underline"
          >
            <SyncUserAvatar userId={run.user_id} className="h-6 w-6" />
            <span className="font-mono text-xs break-all">{run.user_id}</span>
          </Link>
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Started">{formatAbsolute(run.started_at)}</Field>
          <Field label="Ended">{formatAbsolute(run.ended_at)}</Field>
          <Field label="Duration">
            <span className="tabular-nums">
              {formatRunDuration(run.started_at, run.ended_at)}
            </span>
          </Field>
          {inProgress && (
            <Field label="Last update">{formatRelative(run.last_update)}</Field>
          )}
          {inProgress && (
            <Field label="Stage">{STAGE_LABELS[run.stage] ?? run.stage}</Field>
          )}
          {run.items_processed !== null && (
            <Field label="Items">
              <span className="tabular-nums">
                {run.items_processed}
                {run.items_total !== null && ` / ${run.items_total}`}
              </span>
            </Field>
          )}
          {inProgress && run.progress !== null && (
            <Field label="Progress">
              <span className="tabular-nums">
                {Math.round(run.progress * 100)}%
              </span>
            </Field>
          )}
        </div>

        {run.message && (
          <Field label="Message">
            <p className="text-xs text-zinc-300">{run.message}</p>
          </Field>
        )}

        {run.error && (
          <Field label="Error">
            <pre className="text-xs text-rose-300 bg-rose-950/30 border border-rose-900/50 rounded-md p-3 overflow-x-auto whitespace-pre-wrap break-all">
              {run.error}
            </pre>
          </Field>
        )}

        <RunTimeline userId={run.user_id} runId={run.run_id} />
      </div>
    </>
  );
}

/**
 * Event-by-event timeline for the run, including the raw request/response
 * context (params, status codes, trace ids) each stage recorded in metadata.
 */
function RunTimeline({ userId, runId }: { userId: string; runId: string }) {
  const { data: events, isLoading } = useRecentSyncs(userId, 200);

  const runEvents = useMemo(
    () =>
      (events ?? [])
        .filter((e) => e.run_id === runId)
        .sort(
          (a, b) =>
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        ),
    [events, runId]
  );

  return (
    <Field label="Timeline">
      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-8 w-full rounded-md" />
          <Skeleton className="h-8 w-full rounded-md" />
        </div>
      ) : runEvents.length === 0 ? (
        <p className="text-xs text-zinc-500">
          No detailed events available for this run.
        </p>
      ) : (
        <ol className="space-y-3 border-l border-zinc-800 pl-4">
          {runEvents.map((event) => (
            <TimelineEvent key={event.event_id} event={event} />
          ))}
        </ol>
      )}
    </Field>
  );
}

function TimelineEvent({ event }: { event: SyncStatusEvent }) {
  const hasMetadata = Object.keys(event.metadata ?? {}).length > 0;

  return (
    <li className="relative">
      <span
        aria-hidden
        className="absolute -left-[21.5px] top-1.5 h-2 w-2 rounded-full bg-zinc-600"
      />
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-xs font-medium text-zinc-200">
          {STAGE_LABELS[event.stage] ?? event.stage}
        </span>
        <span className="text-[10px] text-zinc-500 tabular-nums">
          {formatAbsolute(event.timestamp)}
        </span>
      </div>
      {event.message && (
        <p className="mt-0.5 text-xs text-zinc-400">{event.message}</p>
      )}
      {hasMetadata && (
        <details className="mt-1">
          <summary className="cursor-pointer text-[10px] text-zinc-500 hover:text-zinc-300 select-none">
            Details
          </summary>
          <pre className="mt-1 text-[10px] text-zinc-300 bg-zinc-900/60 border border-zinc-800 rounded-md p-2 overflow-x-auto">
            {JSON.stringify(event.metadata, null, 2)}
          </pre>
        </details>
      )}
    </li>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <p className="text-[10px] uppercase tracking-wide text-zinc-500">
        {label}
      </p>
      <div>{children}</div>
    </div>
  );
}
