import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  type Entry,
  colorStyle,
  shapeClass,
  setEntryVisibility,
  setEntryFavorite,
  deleteEntry,
} from "@/lib/entries";
import { Eye, EyeOff, Trash2, Lock, Star } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";

interface Props {
  entry: Entry;
  index: number;
  isOwner: boolean;
  editMode?: boolean;
}

export function FragmentCard({ entry, index, isOwner, editMode }: Props) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

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

  return (
    <>
      <div
        className="mb-5 break-inside-avoid animate-float-up"
        style={{ animationDelay: `${Math.min(index * 60, 600)}ms` }}
      >
        <button
          onClick={() => setOpen(true)}
          style={colorStyle(entry.color)}
          className={`group relative block w-full p-6 text-left shadow-[var(--shadow-soft)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-glow)] ${shapeClass(
            entry.shape,
          )} ${hidden ? "opacity-50" : ""}`}
        >
          {entry.is_private && (
            <Lock className="mb-2 h-4 w-4 opacity-60" aria-hidden />
          )}
          {entry.is_favorite && (
            <Star className="mb-2 h-4 w-4 fill-current opacity-70" aria-hidden />
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
          {isOwner && entry.sender_username && (
            <p className="mt-1 text-xs font-medium opacity-70">
              Signed in as @{entry.sender_username}
            </p>
          )}

          {isOwner && editMode && (
            <div className="mt-4 flex gap-2 border-t border-black/5 pt-3">
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
              <span
                onClick={remove}
                role="button"
                tabIndex={0}
                className="inline-flex items-center gap-1 rounded-full bg-background/55 px-3 py-1 text-xs font-medium text-destructive backdrop-blur transition hover:bg-background/75"
              >
                <Trash2 className="h-3 w-3" /> Delete
              </span>
            </div>
          )}
        </button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="glass border-none p-0 sm:max-w-2xl overflow-hidden">
          <div
            className={`animate-unfold p-6 sm:p-10 max-h-[80vh] overflow-y-auto custom-scrollbar ${shapeClass(
              entry.shape,
            )}`}
            style={colorStyle(entry.color)}
          >
            <DialogHeader>
              <DialogTitle className="sr-only">Fragment from {displayName}</DialogTitle>
              <DialogDescription className="sr-only">A message left in the archive</DialogDescription>
            </DialogHeader>
            <p className="font-serif text-xl sm:text-2xl leading-relaxed whitespace-pre-wrap break-words">{entry.message}</p>
            <p className="mt-6 text-base italic opacity-70">— {displayName}</p>
            {isOwner && entry.sender_username && (
              <p className="mt-1 text-sm font-medium opacity-70">
                Signed in as @{entry.sender_username}
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
