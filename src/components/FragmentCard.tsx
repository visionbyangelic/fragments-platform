import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  type Entry,
  colorStyle,
  setEntryVisibility,
  setEntryFavorite,
  deleteEntry,
} from "@/lib/entries";
import { Eye, EyeOff, Trash2, Lock, Star, Pin, Reply } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  REACTION_KINDS,
  toggleReaction,
  type ReactionCounts,
  type ReactionKind,
} from "@/lib/reactions";
import { deleteReply, saveReply } from "@/lib/replies";
import { getVisitorId } from "@/lib/visitor";
import type { Collection } from "@/lib/collections";

interface Props {
  entry: Entry;
  index: number;
  isOwner: boolean;
  editMode?: boolean;
  /** The wall owner's display name, for the reply line. */
  ownerName?: string;
  /** Reactions for this fragment, fetched by the parent for the whole list. */
  reactions?: ReactionCounts;
  /** The owner's public reply, if one was written. */
  reply?: string | null;
  /** After a reaction or reply changes, so the parent refetches. */
  onReacted?: () => void;
  /** Whether this fragment is the wall's featured one. */
  featured?: boolean;
  /** Owner only: pin or unpin this fragment as the featured one. */
  onFeature?: () => void;
  /** Owner only: the collections this fragment can be filed into. */
  collections?: Collection[];
  /** Ids of the collections this fragment is already in. */
  inCollections?: string[];
  /** Owner only: add or remove this fragment from a collection. */
  onCollectionToggle?: (collectionId: string, inIt: boolean) => void;
}

function ReactionRow({
  entryId,
  reactions,
  onReacted,
}: {
  entryId: string;
  reactions: ReactionCounts | undefined;
  onReacted?: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const counts = reactions ?? { heart: 0, laugh: 0, warm: 0, mine: [] };

  async function react(kind: ReactionKind) {
    if (busy) return;
    setBusy(true);
    try {
      await toggleReaction(entryId, kind, getVisitorId());
      onReacted?.();
    } catch {
      toast.error("Could not react");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-4 flex flex-wrap gap-2">
      {REACTION_KINDS.map(({ kind, label, glyph }) => {
        const n = counts[kind];
        const mine = counts.mine.includes(kind);
        return (
          <button
            key={kind}
            onClick={() => react(kind)}
            disabled={busy}
            aria-label={label}
            aria-pressed={mine}
            title={label}
            className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium backdrop-blur transition ${
              mine
                ? "bg-primary text-primary-foreground"
                : "bg-background/55 hover:bg-background/75"
            }`}
          >
            <span aria-hidden>{glyph}</span>
            {n > 0 && <span>{n}</span>}
          </button>
        );
      })}
    </div>
  );
}

export function FragmentCard({
  entry,
  index,
  isOwner,
  editMode,
  ownerName,
  reactions,
  reply,
  onReacted,
  featured,
  onFeature,
  collections,
  inCollections,
  onCollectionToggle,
}: Props) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [replyOpen, setReplyOpen] = useState(false);
  const [replyText, setReplyText] = useState(reply ?? "");
  const [replySaving, setReplySaving] = useState(false);

  function refreshEntries() {
    queryClient.invalidateQueries({ queryKey: ["entries"] });
    queryClient.invalidateQueries({ queryKey: ["sealed"] });
  }
  const hidden = !entry.is_visible;
  const displayName = entry.name?.trim() ? entry.name : "Anonymous";

  async function toggleVisibility(e: React.MouseEvent) {
    e.stopPropagation();
    try {
      await setEntryVisibility(entry.id, !entry.is_visible);
      toast.success(entry.is_visible ? "Fragment hidden" : "Fragment shown");
      refreshEntries();
    } catch {
      toast.error("Could not update fragment");
    }
  }

  async function toggleFavorite(e: React.MouseEvent) {
    e.stopPropagation();
    try {
      await setEntryFavorite(entry.id, !entry.is_favorite);
      toast.success(entry.is_favorite ? "Removed from favourites" : "Kept as a favourite");
      refreshEntries();
    } catch {
      toast.error("Could not update fragment");
    }
  }

  async function remove(e: React.MouseEvent) {
    e.stopPropagation();
    try {
      await deleteEntry(entry.id);
      toast.success("Fragment removed");
      refreshEntries();
    } catch {
      toast.error("Could not remove fragment");
    }
  }

  async function submitReply() {
    setReplySaving(true);
    try {
      await saveReply(entry.id, replyText);
      toast.success("Your reply is public on the wall");
      setReplyOpen(false);
      onReacted?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save the reply");
    } finally {
      setReplySaving(false);
    }
  }

  async function removeReply() {
    setReplySaving(true);
    try {
      await deleteReply(entry.id);
      setReplyText("");
      setReplyOpen(false);
      onReacted?.();
    } catch {
      toast.error("Could not remove the reply");
    } finally {
      setReplySaving(false);
    }
  }

  return (
    <>
      <div
        className="mb-5 break-inside-avoid animate-float-up"
        style={{ animationDelay: `${Math.min(index * 60, 600)}ms` }}
      >
        <div
          style={colorStyle(entry.color)}
          className={`frag-card group relative w-full rounded-[var(--card-radius)] p-6 text-left shadow-[var(--shadow-soft)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-glow)] ${hidden ? "opacity-50" : ""}`}
        >
          <button onClick={() => setOpen(true)} className="block w-full text-left">
            {entry.is_private && (
              <Lock className="mb-2 h-4 w-4 opacity-60" aria-hidden />
            )}
            {entry.is_favorite && (
              <Star className="mb-2 h-4 w-4 fill-current opacity-70" aria-hidden />
            )}
            {featured && (
              <span className="mb-2 inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-primary-foreground">
                <Pin className="h-3 w-3" aria-hidden /> Featured
              </span>
            )}
            <p className="font-serif text-xl leading-snug line-clamp-6 whitespace-pre-wrap break-words">
              {entry.message}
            </p>
            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm italic opacity-70">— {displayName}</p>
              {entry.message.length > 150 && (
                <span className="text-xs font-medium opacity-50 transition-opacity group-hover:opacity-100">
                  Read full note →
                </span>
              )}
            </div>
            {isOwner && entry.sender_username && !entry.sender_hidden && (
              <p className="mt-1 text-xs font-medium opacity-70">
                Signed in as @{entry.sender_username}
              </p>
            )}
          </button>

          {reply && (
            <div className="mt-4 border-t border-black/5 pt-3">
              <p className="text-sm leading-relaxed">
                <span className="font-medium">{ownerName ?? "The wall's owner"} replied: </span>
                {reply}
              </p>
            </div>
          )}

          <ReactionRow entryId={entry.id} reactions={reactions} onReacted={onReacted} />

          {isOwner && editMode && (
            <div className="mt-4 flex flex-wrap gap-2 border-t border-black/5 pt-3">
              <span
                onClick={toggleVisibility}
                role="button"
                tabIndex={0}
                className="inline-flex items-center gap-1 rounded-full bg-background/55 px-3 py-1 text-xs font-medium backdrop-blur transition hover:bg-background/75"
              >
                {entry.is_visible ? (
                  <>
                    <EyeOff className="h-3 w-3" /> Hide
                  </>
                ) : (
                  <>
                    <Eye className="h-3 w-3" /> Show
                  </>
                )}
              </span>
              <span
                onClick={toggleFavorite}
                role="button"
                tabIndex={0}
                className="inline-flex items-center gap-1 rounded-full bg-background/55 px-3 py-1 text-xs font-medium backdrop-blur transition hover:bg-background/75"
              >
                <Star className="h-3 w-3" /> {entry.is_favorite ? "Unkeep" : "Keep"}
              </span>
              {onFeature && (
                <span
                  onClick={onFeature}
                  role="button"
                  tabIndex={0}
                  className="inline-flex items-center gap-1 rounded-full bg-background/55 px-3 py-1 text-xs font-medium backdrop-blur transition hover:bg-background/75"
                >
                  <Pin className="h-3 w-3" /> {featured ? "Unfeature" : "Feature"}
                </span>
              )}
              <span
                onClick={() => {
                  setReplyText(reply ?? "");
                  setReplyOpen(!replyOpen);
                }}
                role="button"
                tabIndex={0}
                className="inline-flex items-center gap-1 rounded-full bg-background/55 px-3 py-1 text-xs font-medium backdrop-blur transition hover:bg-background/75"
              >
                <Reply className="h-3 w-3" /> {reply ? "Edit reply" : "Reply"}
              </span>
              <span
                onClick={remove}
                role="button"
                tabIndex={0}
                className="inline-flex items-center gap-1 rounded-full bg-background/55 px-3 py-1 text-xs font-medium text-destructive backdrop-blur transition hover:bg-background/75"
              >
                <Trash2 className="h-3 w-3" /> Delete
              </span>
              {collections && collections.length > 0 && onCollectionToggle && (
                <select
                  aria-label="File into a collection"
                  value=""
                  onChange={(e) => {
                    if (e.target.value)
                      onCollectionToggle(e.target.value, (inCollections ?? []).includes(e.target.value));
                  }}
                  className="rounded-full bg-background/55 px-3 py-1 text-xs font-medium backdrop-blur transition hover:bg-background/75"
                >
                  <option value="">File into a collection…</option>
                  {collections.map((c) => (
                    <option key={c.id} value={c.id}>
                      {(inCollections ?? []).includes(c.id) ? "✓ " : ""}{c.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          {isOwner && editMode && replyOpen && (
            <div className="mt-3 space-y-2">
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Reply publicly, in your own words…"
                rows={3}
                maxLength={1000}
                className="w-full rounded-3xl border border-border bg-background/70 p-3 text-sm"
              />
              <div className="flex gap-2">
                <button
                  onClick={submitReply}
                  disabled={replySaving || !replyText.trim()}
                  className="rounded-full bg-primary px-4 py-1.5 text-xs font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
                >
                  {replySaving ? "Saving…" : "Post reply"}
                </button>
                {reply && (
                  <button
                    onClick={removeReply}
                    disabled={replySaving}
                    className="rounded-full bg-background/55 px-4 py-1.5 text-xs font-medium text-destructive backdrop-blur transition hover:bg-background/75"
                  >
                    Remove reply
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="glass border-none p-0 sm:max-w-2xl overflow-hidden">
          <div
            className={`frag-card animate-unfold rounded-[var(--card-radius)] p-6 sm:p-10 max-h-[80vh] overflow-y-auto custom-scrollbar`}
            style={colorStyle(entry.color)}
          >
            <DialogHeader>
              <DialogTitle className="sr-only">Fragment from {displayName}</DialogTitle>
              <DialogDescription className="sr-only">A message left in the archive</DialogDescription>
            </DialogHeader>
            <p className="font-serif text-xl sm:text-2xl leading-relaxed whitespace-pre-wrap break-words">{entry.message}</p>
            <p className="mt-6 text-base italic opacity-70">— {displayName}</p>
            {isOwner && entry.sender_username && !entry.sender_hidden && (
              <p className="mt-1 text-sm font-medium opacity-70">
                Signed in as @{entry.sender_username}
              </p>
            )}
            {reply && (
              <p className="mt-4 border-t border-black/5 pt-4 text-base leading-relaxed">
                <span className="font-medium">{ownerName ?? "The wall's owner"} replied: </span>
                {reply}
              </p>
            )}
            <ReactionRow entryId={entry.id} reactions={reactions} onReacted={onReacted} />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
