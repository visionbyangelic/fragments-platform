import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  answerQuestion,
  deleteQuestion,
  setQuestionPublished,
  type Question,
} from "@/lib/questions";
import { CircleCheck as CheckCircle2, MessageCircleQuestionMark as MessageCircleQuestion, Send, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface Props {
  questions: Question[];
  isOwner: boolean;
  ownerName: string;
  editMode?: boolean;
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

export function QASection({ questions, isOwner, ownerName, editMode }: Props) {
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
