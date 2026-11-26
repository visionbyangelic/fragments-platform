import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  answerQuestion,
  deleteQuestion,
  setQuestionPublished,
  type Question,
} from "@/lib/questions";
import { CircleCheck as CheckCircle2, MessageCircleQuestionMark as MessageCircleQuestion, Send, Share2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  CARD_SIZES,
  renderAnswerCardPreview,
  shareAnswerCard,
  type CardSize,
} from "@/lib/share-card";
import { CUSTOM_THEME_NAME, THEMES, themeLabel } from "@/lib/themes";
import type { CustomTheme } from "@/lib/custom-theme";

interface Props {
  questions: Question[];
  isOwner: boolean;
  ownerName: string;
  editMode?: boolean;
  wallUsername: string;
  wallTheme: string;
  /** The wall's own colours when its theme is Custom. */
  customTheme?: CustomTheme | null;
}

function ShareCardButton({
  question,
  wallUsername,
  ownerName,
  wallTheme,
  customTheme,
}: {
  question: Question;
  wallUsername: string;
  ownerName: string;
  wallTheme: string;
  customTheme?: CustomTheme | null;
}) {
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useState(wallTheme);
  const [size, setSize] = useState<CardSize>("story");
  const [preview, setPreview] = useState<string | null>(null);
  const [rendering, setRendering] = useState(false);
  const [sharing, setSharing] = useState(false);

  // Live preview, re-drawn whenever the colour or size changes.
  useEffect(() => {
    if (!open || !question.answer) return;
    let cancelled = false;
    setRendering(true);
    renderAnswerCardPreview(
      {
        question: question.question,
        answer: question.answer,
        username: wallUsername,
        displayName: ownerName,
        theme: wallTheme,
        customTheme,
      },
      { theme, size, customTheme },
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
  }, [open, theme, size, question, wallUsername, ownerName, wallTheme, customTheme]);

  async function handleShare() {
    if (!question.answer) return;
    setSharing(true);
    try {
      const how = await shareAnswerCard(
        {
          question: question.question,
          answer: question.answer,
          username: wallUsername,
          displayName: ownerName,
          theme: wallTheme,
          customTheme,
        },
        { theme, size, customTheme },
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
    <div className="mt-4 flex justify-end">
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
              Pick a colour and a size, then save it. The file is a JPEG,
              so it stays light on data.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-2 flex justify-center">
            {preview ? (
              <img
                src={preview}
                alt="Preview of your answer card"
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
            <div className="flex flex-wrap gap-2.5" role="radiogroup" aria-label="Card colour">
              {wallTheme === CUSTOM_THEME_NAME && customTheme && (
                <button
                  key="custom"
                  type="button"
                  role="radio"
                  aria-checked={theme === CUSTOM_THEME_NAME}
                  aria-label="Custom — the wall's own colours"
                  title="Custom — the wall's own colours"
                  onClick={() => setTheme(CUSTOM_THEME_NAME)}
                  className={`h-10 w-10 rounded-full transition ${
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
                  className={`h-10 w-10 rounded-full transition ${
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

          <div className="mt-4 space-y-2">
            <p className="text-sm font-medium">Size</p>
            <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Card size">
              {(Object.keys(CARD_SIZES) as CardSize[]).map((key) => (
                <button
                  key={key}
                  type="button"
                  role="radio"
                  aria-checked={size === key}
                  onClick={() => setSize(key)}
                  className={`rounded-2xl border px-3 py-2.5 text-left transition ${
                    size === key
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card/40"
                  }`}
                >
                  <span className="block text-sm font-medium">{CARD_SIZES[key].label}</span>
                  <span
                    className={`mt-0.5 block text-xs ${
                      size === key ? "text-primary-foreground/80" : "text-muted-foreground"
                    }`}
                  >
                    {CARD_SIZES[key].blurb}
                  </span>
                </button>
              ))}
            </div>
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

function askerName(q: Question) {
  if (q.is_anonymous || !q.name?.trim()) return "Anonymous soul";
  return q.name;
}

const LETTER_COLORS = ["letter-note", "letter-note-pink", "letter-note-blue", "letter-note-aged"];

function getLetterColor(index: number): string {
  return LETTER_COLORS[index % LETTER_COLORS.length];
}

function QuestionAdminControls({ question }: { question: Question }) {
  const queryClient = useQueryClient();
  const [answer, setAnswer] = useState(question.answer ?? "");
  const [busy, setBusy] = useState(false);

  function refreshQuestions() {
    queryClient.invalidateQueries({ queryKey: ["questions"] });
  }

  async function saveAnswer() {
    setBusy(true);
    try {
      await answerQuestion(question.id, answer);
      toast.success("Answer saved");
      refreshQuestions();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save answer");
    } finally {
      setBusy(false);
    }
  }

  async function togglePublish() {
    if (!question.answer && !answer.trim()) {
      toast.error("Write an answer before publishing");
      return;
    }
    setBusy(true);
    try {
      if (answer.trim() && answer.trim() !== question.answer) {
        await answerQuestion(question.id, answer);
      }
      await setQuestionPublished(question.id, !question.is_published);
      toast.success(question.is_published ? "Answer unpublished" : "Answer published");
      refreshQuestions();
    } catch {
      toast.error("Could not update publish status");
    } finally {
      setBusy(false);
    }
  }

  async function removeQuestion() {
    setBusy(true);
    try {
      await deleteQuestion(question.id);
      toast.success("Question deleted");
      refreshQuestions();
    } catch {
      toast.error("Could not delete question");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-5 border-t border-border pt-5">
      <Textarea
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        placeholder="Write your answer…"
        rows={4}
        maxLength={2000}
        className="resize-none bg-card/60"
      />
      <div className="mt-4 flex flex-wrap gap-2">
        <Button type="button" size="sm" disabled={busy} onClick={saveAnswer} className="rounded-full">
          <Send className="mr-2 h-3.5 w-3.5" aria-hidden /> Save answer
        </Button>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          disabled={busy}
          onClick={togglePublish}
          className="rounded-full"
        >
          <CheckCircle2 className="mr-2 h-3.5 w-3.5" aria-hidden />
          {question.is_published ? "Unpublish" : "Publish"}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="destructive"
          disabled={busy}
          onClick={removeQuestion}
          className="rounded-full"
        >
          <Trash2 className="mr-2 h-3.5 w-3.5" aria-hidden /> Delete
        </Button>
      </div>
    </div>
  );
}

export function QASection({ questions, isOwner, ownerName, editMode, wallUsername, wallTheme, customTheme }: Props) {
  const visibleQuestions = isOwner
    ? questions
    : questions.filter((q) => q.is_published && q.answer);
  const unansweredCount = questions.filter((q) => !q.answer).length;

  return (
    <section className="mx-auto max-w-5xl animate-float-up" aria-labelledby="ama-title">
      <div className="mb-12 text-center">
        <MessageCircleQuestion className="mx-auto mb-4 h-8 w-8 text-primary" aria-hidden />
        <p className="text-sm font-medium uppercase tracking-[0.25em] text-primary">The Q&A</p>
        <h2 id="ama-title" className="mt-3 font-serif text-5xl text-gradient sm:text-6xl">
          Asked &amp; answered
        </h2>
        <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-foreground/75">
          Questions people have left on this wall, with {ownerName}&rsquo;s answers.
          Want to ask one? Leave a fragment and flip on “ask a question”.
        </p>
        {isOwner && (
          <p className="mt-4 text-sm font-medium text-primary">
            Owner view: {unansweredCount} waiting for an answer
          </p>
        )}
      </div>

      <div className="mx-auto max-w-3xl">
        <div className="space-y-8">
          {visibleQuestions.length === 0 ? (
            <div className="glass rounded-4xl p-8 text-center text-muted-foreground">
              No answered questions yet.
            </div>
          ) : (
            visibleQuestions.map((q, idx) => (
              <article key={q.id} className="relative">
                {/* Question card - glass style */}
                <div className="glass rounded-3xl p-6 sm:p-7">
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
                    <span>Asked by {askerName(q)}</span>
                    {isOwner && (
                      <span className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
                        {q.is_published ? "Published" : "Draft"}
                      </span>
                    )}
                  </div>
                  <h3 className="font-serif text-2xl leading-snug text-foreground/90 whitespace-pre-wrap break-words">{q.question}</h3>

                  {q.answer ? (
                    <div
                      className={`animate-letter mt-6 rounded-2xl p-5 max-h-[400px] overflow-y-auto custom-scrollbar ${getLetterColor(idx)}`}
                      style={{ animationDelay: `${idx * 100}ms` }}
                    >
                      <p className="font-serif text-xl leading-relaxed whitespace-pre-wrap break-words" style={{ fontFamily: "var(--font-serif)" }}>
                        {q.answer}
                      </p>
                      <p className="mt-4 text-sm opacity-70">— {ownerName}</p>
                    </div>
                  ) : isOwner && <p className="mt-5 text-sm text-muted-foreground">Not answered yet.</p>}

                  {q.answer && q.is_published && (
                    <ShareCardButton
                      question={q}
                      wallUsername={wallUsername}
                      ownerName={ownerName}
                      wallTheme={wallTheme}
                      customTheme={customTheme}
                    />
                  )}

                  {isOwner && editMode && <QuestionAdminControls question={q} />}
                </div>
              </article>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
