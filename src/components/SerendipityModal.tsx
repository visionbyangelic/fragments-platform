import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { fetchRandomEntry, type Entry } from "@/lib/entries";
import { fetchRandomQuestion, type Question } from "@/lib/questions";
import { Sparkles, MessageCircleQuestionMark as MessageCircleQuestion, RefreshCw, X } from "lucide-react";
import { toast } from "sonner";
import { colorStyle, shapeClass } from "@/lib/entries";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profileId: string;
  ownerName: string;
}

type SerendipityItem =
  | { type: "fragment"; data: Entry }
  | { type: "question"; data: Question };

export function SerendipityModal({ open, onOpenChange, profileId, ownerName }: Props) {
  const [item, setItem] = useState<SerendipityItem | null>(null);
  const [loading, setLoading] = useState(false);

  async function getRandom() {
    setLoading(true);
    try {
      const coin = Math.random();
      if (coin < 0.5) {
        const entry = await fetchRandomEntry(profileId);
        if (entry) {
          setItem({ type: "fragment", data: entry });
          return;
        }
      }
      const question = await fetchRandomQuestion(profileId);
      if (question) {
        setItem({ type: "question", data: question });
        return;
      }
      const entry = await fetchRandomEntry(profileId);
      if (entry) {
        setItem({ type: "fragment", data: entry });
        return;
      }
      toast.error("Nothing found in the archive yet");
    } catch (err) {
      toast.error("Could not find a random memory");
    } finally {
      setLoading(false);
    }
  }

  function handleOpenChange(newOpen: boolean) {
    onOpenChange(newOpen);
    if (!newOpen) {
      setItem(null);
    }
  }

  function handleSurprise() {
    getRandom();
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl overflow-hidden border-none bg-transparent p-0 shadow-none">
        <div className="relative">
          <button
            onClick={() => handleOpenChange(false)}
            className="absolute right-4 top-4 z-10 rounded-full bg-card/80 p-2 text-foreground/70 backdrop-blur transition hover:bg-card"
          >
            <X className="h-5 w-5" />
            <span className="sr-only">Close</span>
          </button>

          <div className="absolute inset-0 -z-10 overflow-hidden rounded-3xl">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-accent/15 to-secondary/20 blur-3xl" />
          </div>

          <div className="glass max-h-[80vh] overflow-y-auto custom-scrollbar rounded-3xl p-8 sm:p-10">
            <DialogHeader className="mb-6 text-center">
              <div className="mx-auto mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary/20">
                <Sparkles className="h-8 w-8 text-primary" />
              </div>
              <DialogTitle className="font-serif text-4xl text-gradient">Serendipity</DialogTitle>
              <DialogDescription className="text-lg text-foreground/70">
                A random memory or conversation from the archive
              </DialogDescription>
            </DialogHeader>

            {item ? (
              <div className="mt-6 animate-unfold">
                {item.type === "fragment" ? (
                  <div
                    className={`p-6 sm:p-8 max-h-[50vh] overflow-y-auto custom-scrollbar ${shapeClass(item.data.shape)}`}
                    style={colorStyle(item.data.color)}
                  >
                    <p className="font-serif text-xl sm:text-2xl leading-relaxed whitespace-pre-wrap break-words">{item.data.message}</p>
                    <p className="mt-6 text-base italic opacity-70">
                      — {item.data.name?.trim() || "Anonymous"}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6 max-h-[50vh] overflow-y-auto custom-scrollbar pr-1">
                    <div className="glass rounded-3xl p-6">
                      <div className="mb-3 text-sm text-muted-foreground">
                        Asked by {item.data.is_anonymous ? "Anonymous soul" : item.data.name || "Someone"}
                      </div>
                      <p className="font-serif text-xl sm:text-2xl leading-snug whitespace-pre-wrap break-words">{item.data.question}</p>
                    </div>
                    <div className="letter-note animate-letter rounded-2xl p-6">
                      <p className="font-serif text-lg sm:text-xl leading-relaxed whitespace-pre-wrap break-words">{item.data.answer}</p>
                      <p className="mt-4 text-sm opacity-70">— {ownerName}</p>
                    </div>
                  </div>
                )}

                <div className="mt-8 flex justify-center">
                  <Button
                    onClick={handleSurprise}
                    disabled={loading}
                    variant="outline"
                    className="rounded-full border-primary/30 bg-primary/5 hover:bg-primary/10"
                  >
                    <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                    {loading ? "Searching…" : "Another one"}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="mt-10 text-center">
                <p className="mb-8 text-lg text-muted-foreground">
                  Let the archive surprise you with a random fragment or answered question.
                </p>
                <Button
                  onClick={handleSurprise}
                  disabled={loading}
                  size="lg"
                  className="rounded-full px-10"
                >
                  <Sparkles className="mr-2 h-5 w-5" />
                  {loading ? "Searching the archive…" : "Surprise me"}
                </Button>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
