import { useState } from "react";
import { toast } from "sonner";
import { Hourglass, Mail, MessageCircleQuestion, BarChart3, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { createPoll } from "@/lib/polls";
import { createCapsule } from "@/lib/capsules";
import { createLetter } from "@/lib/letters";
import { TEST_ACCOUNT_USERNAME, updateProfile, type Profile } from "@/lib/platform";
import { showSection } from "@/lib/social";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  profile: Profile;
  onCreated: () => void;
}

type View = "menu" | "poll" | "capsule" | "letter" | "question";

// The Create sheet: the middle button of the dashboard. One place to
// start the things a wall can hold — a poll, a time capsule, a letter
// to your future self, or the question box. Future Me is a
// placeholder and only the heaven test account sees it: the email
// that would deliver a letter waits for the domain.
export function CreateSheet({ open, onOpenChange, profile, onCreated }: Props) {
  const [view, setView] = useState<View>("menu");
  const [busy, setBusy] = useState(false);

  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptions, setPollOptions] = useState(["", ""]);
  const [pollDays, setPollDays] = useState("");

  const [capsuleTitle, setCapsuleTitle] = useState("");
  const [capsuleDate, setCapsuleDate] = useState("");

  const [letterText, setLetterText] = useState("");
  const [letterDate, setLetterDate] = useState("");

  const isTestAccount = profile.username === TEST_ACCOUNT_USERNAME;
  const qaOn = showSection(profile.sections, "qa");

  function close() {
    setView("menu");
    onOpenChange(false);
  }

  async function submitPoll(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const expires = pollDays ? new Date(Date.now() + Number(pollDays) * 86400000).toISOString() : null;
      await createPoll({
        profile_id: profile.id,
        question: pollQuestion,
        options: pollOptions,
        expires_at: expires,
      });
      toast.success("Your poll is live on your wall");
      onCreated();
      close();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not create the poll");
    } finally {
      setBusy(false);
    }
  }

  async function submitCapsule(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await createCapsule({ profile_id: profile.id, title: capsuleTitle, reveal_date: capsuleDate });
      toast.success("Your time capsule is sealed until its day");
      onCreated();
      close();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not create the capsule");
    } finally {
      setBusy(false);
    }
  }

  async function submitLetter(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await createLetter({ profile_id: profile.id, letter: letterText, deliver_date: letterDate });
      toast.success("Your letter is sealed until its day");
      onCreated();
      close();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save the letter");
    } finally {
      setBusy(false);
    }
  }

  async function toggleQuestionBox() {
    setBusy(true);
    try {
      await updateProfile(profile.id, {
        sections: { ...profile.sections, qa: !qaOn },
      });
      toast.success(qaOn ? "Question box hidden from your wall" : "Question box is back on your wall");
      onCreated();
      close();
    } catch {
      toast.error("Could not change that");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) close();
        else onOpenChange(true);
      }}
    >
      <DialogContent className="glass max-h-[85vh] overflow-y-auto border-none sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl">
            {view === "menu" ? "Create something" : view === "poll" ? "A poll" : view === "capsule" ? "A time capsule" : view === "letter" ? "Dear Future Me" : "Question box"}
          </DialogTitle>
          <DialogDescription>
            {view === "menu"
              ? "What would you like to leave behind?"
              : view === "poll"
                ? "Ask your visitors to vote. Results show after they vote."
                : view === "capsule"
                  ? "A date and a title. Friends contribute while it is sealed, and it opens itself on the day."
                  : view === "letter"
                    ? "A private letter to your future self. It waits for its day — the email that would deliver it is still to come, so for now it opens here."
                    : "Visitors ask, you answer. Switch the question box on or off your wall."}
          </DialogDescription>
        </DialogHeader>

        {view !== "menu" && (
          <button
            onClick={() => setView("menu")}
            className="inline-flex items-center gap-1 text-sm text-muted-foreground transition hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
        )}

        {view === "menu" && (
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setView("poll")}
              className="rounded-3xl border border-border bg-background/40 p-5 text-left transition hover:bg-background/70"
            >
              <BarChart3 className="mb-3 h-6 w-6 text-primary" aria-hidden />
              <p className="font-medium">A poll</p>
              <p className="mt-1 text-xs text-muted-foreground">Ask visitors to vote.</p>
            </button>
            {isTestAccount && (
              <button
                onClick={() => setView("letter")}
                className="rounded-3xl border border-border bg-background/40 p-5 text-left transition hover:bg-background/70"
              >
                <Mail className="mb-3 h-6 w-6 text-primary" aria-hidden />
                <p className="font-medium">Future me</p>
                <p className="mt-1 text-xs text-muted-foreground">Write a letter to yourself.</p>
              </button>
            )}
            <button
              onClick={() => setView("capsule")}
              className="rounded-3xl border border-border bg-background/40 p-5 text-left transition hover:bg-background/70"
            >
              <Hourglass className="mb-3 h-6 w-6 text-primary" aria-hidden />
              <p className="font-medium">Time capsule</p>
              <p className="mt-1 text-xs text-muted-foreground">Save something for later.</p>
            </button>
            <button
              onClick={() => setView("question")}
              className="rounded-3xl border border-border bg-background/40 p-5 text-left transition hover:bg-background/70"
            >
              <MessageCircleQuestion className="mb-3 h-6 w-6 text-primary" aria-hidden />
              <p className="font-medium">Question box</p>
              <p className="mt-1 text-xs text-muted-foreground">Invite people to ask you.</p>
            </button>
          </div>
        )}

        {view === "poll" && (
          <form onSubmit={submitPoll} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="poll-q">Your question</Label>
              <Input
                id="poll-q"
                value={pollQuestion}
                onChange={(e) => setPollQuestion(e.target.value)}
                placeholder="What's one thing that makes you happy?"
                maxLength={200}
                className="bg-background/70"
              />
            </div>
            {pollOptions.map((opt, i) => (
              <div key={i} className="space-y-2">
                <Label htmlFor={`poll-opt-${i}`}>Option {i + 1}</Label>
                <Input
                  id={`poll-opt-${i}`}
                  value={opt}
                  onChange={(e) =>
                    setPollOptions(pollOptions.map((o, j) => (j === i ? e.target.value : o)))
                  }
                  placeholder={i === 0 ? "Spring" : i === 1 ? "Summer" : `Option ${i + 1}`}
                  maxLength={60}
                  className="bg-background/70"
                />
              </div>
            ))}
            <div className="flex gap-2">
              {pollOptions.length < 4 && (
                <Button type="button" variant="secondary" onClick={() => setPollOptions([...pollOptions, ""])} className="rounded-full">
                  + Option
                </Button>
              )}
              {pollOptions.length > 2 && (
                <Button type="button" variant="ghost" onClick={() => setPollOptions(pollOptions.slice(0, -1))} className="rounded-full">
                  − Option
                </Button>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="poll-days">Closes after (optional)</Label>
              <select
                id="poll-days"
                value={pollDays}
                onChange={(e) => setPollDays(e.target.value)}
                className="w-full rounded-full border border-border bg-background/70 px-4 py-2.5 text-sm"
              >
                <option value="">Never — I will close it</option>
                <option value="1">1 day</option>
                <option value="3">3 days</option>
                <option value="7">7 days</option>
                <option value="30">30 days</option>
              </select>
            </div>
            <Button type="submit" disabled={busy} className="w-full rounded-full">
              {busy ? "Please wait…" : "Put the poll on my wall"}
            </Button>
          </form>
        )}

        {view === "capsule" && (
          <form onSubmit={submitCapsule} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="capsule-title">What is this capsule for?</Label>
              <Input
                id="capsule-title"
                value={capsuleTitle}
                onChange={(e) => setCapsuleTitle(e.target.value)}
                placeholder="Our graduation day"
                maxLength={80}
                className="bg-background/70"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="capsule-date">It opens on</Label>
              <Input
                id="capsule-date"
                type="date"
                value={capsuleDate}
                onChange={(e) => setCapsuleDate(e.target.value)}
                className="bg-background/70"
              />
              <p className="text-xs text-muted-foreground">
                Contributions stay sealed until the day — nobody can read
                them early, not even you.
              </p>
            </div>
            <Button type="submit" disabled={busy} className="w-full rounded-full">
              {busy ? "Please wait…" : "Seal the capsule"}
            </Button>
          </form>
        )}

        {view === "letter" && (
          <form onSubmit={submitLetter} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="letter-text">Dear future me…</Label>
              <Textarea
                id="letter-text"
                value={letterText}
                onChange={(e) => setLetterText(e.target.value)}
                placeholder="Write what you want your future self to remember…"
                rows={6}
                maxLength={5000}
                className="bg-background/70"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="letter-date">It arrives on</Label>
              <Input
                id="letter-date"
                type="date"
                value={letterDate}
                onChange={(e) => setLetterDate(e.target.value)}
                className="bg-background/70"
              />
              <p className="text-xs text-muted-foreground">
                For now it opens here, on your dashboard, on the day. The
                email that would deliver it is still to come.
              </p>
            </div>
            <Button type="submit" disabled={busy} className="w-full rounded-full">
              {busy ? "Please wait…" : "Seal the letter"}
            </Button>
          </form>
        )}

        {view === "question" && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              The question box is the Q&A tab on your wall: visitors ask,
              you answer, and you choose which answers go public.
              {qaOn ? " It is on your wall right now." : " It is hidden from your wall right now."}
            </p>
            <Button onClick={toggleQuestionBox} disabled={busy} className="w-full rounded-full">
              {busy ? "Please wait…" : qaOn ? "Hide the question box" : "Show the question box"}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
