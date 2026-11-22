import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FRAGMENT_COLORS,
  FRAGMENT_SHAPES,
  submitEntry,
} from "@/lib/entries";
import { submitQuestion } from "@/lib/questions";
import { toast } from "sonner";

interface Props {
  profileId: string;
  ownerName: string;
}

export function SubmissionForm({ profileId, ownerName }: Props) {
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [anonymous, setAnonymous] = useState(false);
  const [asQuestion, setAsQuestion] = useState(false);
  const [sealed, setSealed] = useState(false);
  const [sealDate, setSealDate] = useState("");
  const [color, setColor] = useState<string>(FRAGMENT_COLORS[0].value);
  const [shape, setShape] = useState<string>(FRAGMENT_SHAPES[0].value);
  const [submitting, setSubmitting] = useState(false);

  const maxLength = asQuestion ? 800 : 3000;
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const clean = message.trim();
    if (!clean) {
      toast.error(asQuestion ? "Write a real question first" : "Please write a message");
      return;
    }
    if (asQuestion && clean.length < 3) {
      toast.error("Write a real question first");
      return;
    }
    if (sealed && !sealDate) {
      toast.error("Pick the day this fragment should open");
      return;
    }
    setSubmitting(true);
    try {
      if (asQuestion) {
        await submitQuestion({
          profile_id: profileId,
          name: anonymous ? null : name.trim() || null,
          question: clean,
          is_anonymous: anonymous,
        });
        toast.success(`Question sent for ${ownerName} to answer ✨`);
      } else {
        await submitEntry({
          profile_id: profileId,
          name: anonymous ? null : name.trim() || null,
          message: clean,
          color,
          shape,
          reveal_date: sealed ? new Date(`${sealDate}T00:00:00`).toISOString() : null,
        });
        toast.success(
          sealed ? "Your fragment is sealed until its day comes 🔒" : "Your fragment has been added 🤍",
        );
      }
      setName("");
      setMessage("");
      setAnonymous(false);
      setAsQuestion(false);
      setSealed(false);
      setSealDate("");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Something went wrong. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="glass rounded-4xl p-8 sm:p-10">
      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">Your name</Label>
          <Input
            id="name"
            value={anonymous ? "" : name}
            onChange={(e) => setName(e.target.value)}
            disabled={anonymous}
            placeholder={anonymous ? "Anonymous" : "Who is this from?"}
            className="bg-white/60"
          />
          <div className="flex items-center gap-3 pt-1">
            <Switch id="anon" checked={anonymous} onCheckedChange={setAnonymous} />
            <Label htmlFor="anon" className="text-sm text-muted-foreground">
              Leave anonymously
            </Label>
          </div>
          <div className="flex items-center gap-3 pt-1">
            <Switch id="as-question" checked={asQuestion} onCheckedChange={setAsQuestion} />
            <Label htmlFor="as-question" className="text-sm text-muted-foreground">
              Ask a question {ownerName} can answer
            </Label>
          </div>
          {!asQuestion && (
            <div className="flex items-center gap-3 pt-1">
              <Switch id="sealed" checked={sealed} onCheckedChange={setSealed} />
              <Label htmlFor="sealed" className="text-sm text-muted-foreground">
                Seal it until a future day
              </Label>
            </div>
          )}
          {!asQuestion && sealed && (
            <div className="space-y-2 pt-1">
              <Label htmlFor="seal-date">Opens on</Label>
              <Input
                id="seal-date"
                type="date"
                min={tomorrow}
                value={sealDate}
                onChange={(e) => setSealDate(e.target.value)}
                className="bg-white/60"
              />
              <p className="text-xs text-muted-foreground">
                Nobody can read it before that day, not even {ownerName}.
              </p>
            </div>
          )}
        </div>

        {!asQuestion && (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Color</Label>
              <Select value={color} onValueChange={setColor}>
                <SelectTrigger className="bg-white/60">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FRAGMENT_COLORS.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Shape</Label>
              <Select value={shape} onValueChange={setShape}>
                <SelectTrigger className="bg-white/60">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FRAGMENT_SHAPES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
      </div>

      <div className="mt-6 space-y-2">
        <div className="flex justify-between text-sm">
          <Label htmlFor="message">{asQuestion ? "Your question" : "Your message"}</Label>
          <span className="text-xs text-muted-foreground">
            {message.length}/{maxLength}
          </span>
        </div>
        <Textarea
          id="message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={
            asQuestion
              ? "Ask anything…"
              : "Share a memory, a wish, or a few kind words…"
          }
          rows={5}
          className="bg-white/60 custom-scrollbar"
          maxLength={maxLength}
        />
      </div>

      <div className="mt-6 flex justify-end">
        <Button type="submit" size="lg" disabled={submitting} className="w-full rounded-full px-8 sm:w-auto">
          {submitting ? "Sending…" : asQuestion ? "Send question" : sealed ? "Seal this fragment" : "Leave a fragment"}
        </Button>
      </div>
    </form>
  );
}
