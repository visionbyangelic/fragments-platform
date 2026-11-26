import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  type Entry,
  colorStyle,
  setEntryVisibility,
  setEntryFavorite,
  deleteEntry,
} from "@/lib/entries";
import { Eye, EyeOff, Trash2, Lock, Star, Pin, Reply, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { CUSTOM_THEME_NAME, THEMES, themeLabel } from "@/lib/themes";
import {
  renderFragmentCardPreview,
  shareFragmentCard,
} from "@/lib/share-card";
import type { CustomTheme } from "@/lib/custom-theme";
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
  /** The wall's username, for the share card's link. Without it the
      share button does not render. */
  wallUsername?: string;
  /** The wall's theme, so the share card wears the wall's colours. */
  wallTheme?: string;
  /** The wall's own colours when its theme is Custom. */
  customTheme?: CustomTheme | null;
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

/** A fragment as a shareable image, the same card maker the answered
    questions already have: live preview, pick a colour and a size,
    save a light JPEG. The image shows exactly what the wall shows —
    the words and the displayed name — and nothing else. */
function FragmentShareButton({
  message,
  author,
  wallUsername,
  ownerName,
  wallTheme,
  customTheme,
}: {
  message: string;
  author: string;
  wallUsername: string;
  ownerName: string;
  wallTheme: string;
  customTheme?: CustomTheme | null;
}) {
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useState(wallTheme);
  const [preview, setPreview] = useState<string | null>(null);
  const [rendering, setRendering] = useState(false);
  const [sharing, setSharing] = useState(false);

  // Live preview, re-drawn whenever the colour changes. Every card
  // is Compact — the small size is drawn from the same big canvas,
  // so it stays sharp on a phone and costs less data, and there is
  // no size choice to understand.
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setRendering(true);
    renderFragmentCardPreview(
      {
        message,
        author,
        username: wallUsername,
        displayName: ownerName,
        theme: wallTheme,
        customTheme,
      },
      { theme, size: "compact", customTheme },
    )
      .then((url) => {
        if (!cancelled) setPreview(url);
      })
      .catch(() => {
        if (!cancelled) setPreview(null);
      })
      .finally(() => {
        if (!cancelled) setRendering(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, theme, message, author, wallUsername, ownerName, wallTheme, customTheme]);

  async function handleShare() {
    setSharing(true);
    try {
      const how = await shareFragmentCard(
        {
          message,
          author,
          username: wallUsername,
          displayName: ownerName,
          theme: wallTheme,
          customTheme,
        },
        { theme, size: "compact", customTheme },
      );
      if (how === "downloaded") toast.success("Card saved. Post it anywhere 🤍");
      setOpen(false);
    } catch {
      toast.error("Could not make the card");
    } finally {
      setSharing(false);
    }
  }

  return (
    <div className="mt-3 flex justify-end">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => {
          setTheme(wallTheme);
          setOpen(true);
        }}
        className="rounded-full text-xs"
      >
        <Share2 className="mr-1.5 h-3.5 w-3.5" aria-hidden />
        Share as image
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl">Save your card</DialogTitle>
            <DialogDescription>
              Pick a colour, then save it. The file is a JPEG, so it
              stays light on data.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-2 flex justify-center">
            {preview ? (
              <img
                src={preview}
                alt="Preview of your fragment card"
                className="max-h-[46vh] w-auto rounded-xl shadow-lg"
              />
            ) : (
              <div className="flex h-64 w-48 items-center justify-center rounded-xl bg-muted text-sm text-muted-foreground">
                {rendering ? "Drawing your card…" : "Preview unavailable"}
              </div>
            )}
          </div>

          <div className="mt-5 space-y-2">
            <p className="text-sm font-medium">Colour</p>
            <div className="flex gap-2.5 overflow-x-auto pb-2" role="radiogroup" aria-label="Card colour">
              {wallTheme === CUSTOM_THEME_NAME && customTheme && (
                <button
                  key="custom"
                  type="button"
                  role="radio"
                  aria-checked={theme === CUSTOM_THEME_NAME}
                  aria-label="Custom — the wall's own colours"
                  title="Custom — the wall's own colours"
                  onClick={() => setTheme(CUSTOM_THEME_NAME)}
                  className={`h-10 w-10 shrink-0 rounded-full transition ${
                    theme === CUSTOM_THEME_NAME
                      ? "ring-2 ring-primary ring-offset-2 ring-offset-background"
                      : "ring-1 ring-border"
                  }`}
                  style={{
                    background: `linear-gradient(135deg, ${customTheme.bg}, ${customTheme.accent})`,
                  }}
                />
              )}
              {THEMES.map((t) => (
                <button
                  key={t.name}
                  type="button"
                  role="radio"
                  aria-checked={theme === t.name}
                  aria-label={t.label}
                  title={t.label}
                  onClick={() => setTheme(t.name)}
                  className={`h-10 w-10 shrink-0 rounded-full transition ${
                    theme === t.name
                      ? "ring-2 ring-primary ring-offset-2 ring-offset-background"
                      : "ring-1 ring-border"
                  }`}
                  style={{
                    background: `linear-gradient(135deg, ${t.card.bg[0]}, ${t.card.bg[2]})`,
                  }}
                />
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              {themeLabel(theme)} ·{" "}
              {theme === CUSTOM_THEME_NAME
                ? "Your colours, your wall"
                : (THEMES.find((t) => t.name === theme)?.blurb ?? "")}
            </p>
          </div>

          <div className="mt-6 flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)} className="rounded-full">
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleShare}
              disabled={sharing || rendering || !preview}
              className="rounded-full"
            >
              <Share2 className="mr-2 h-4 w-4" aria-hidden />
              {sharing ? "Making your card…" : "Share / Save image"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
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
  wallUsername,
  wallTheme,
  customTheme,
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

          {/* Shareable as an image — public fragments only. A private
              or hidden fragment never gets the button, so nothing
              hidden can leak out as a picture. */}
          {wallUsername && !entry.is_private && entry.is_visible && (
            <FragmentShareButton
              message={entry.message}
              author={displayName}
              wallUsername={wallUsername}
              ownerName={ownerName ?? wallUsername}
              wallTheme={wallTheme ?? "moonlight"}
              customTheme={customTheme}
            />
          )}

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
