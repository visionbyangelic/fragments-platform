import { supabase } from "@/integrations/supabase/client";

// Polls: one question, 2 to 4 options, optional end date. One active
// poll per wall — creating a new one closes the one before it.
// A vote is ~120 bytes, so even thousands of votes are nothing
// against the free tier.

const sb = supabase as unknown as {
  from: (table: string) => any;
};

export type Poll = {
  id: string;
  profile_id: string;
  question: string;
  options: string[];
  expires_at: string | null;
  closed: boolean;
  created_at: string;
};

export type PollVote = {
  poll_id: string;
  visitor_id: string;
  option_index: number;
};

export function isPollOpen(poll: Poll): boolean {
  if (poll.closed) return false;
  if (poll.expires_at && new Date(poll.expires_at) <= new Date()) return false;
  return true;
}

export async function fetchPolls(profileId: string): Promise<Poll[]> {
  const { data, error } = await sb
    .from("polls")
    .select("*")
    .eq("profile_id", profileId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Poll[];
}

export async function fetchActivePoll(profileId: string): Promise<Poll | null> {
  try {
    const polls = await fetchPolls(profileId);
    return polls.find((p) => isPollOpen(p)) ?? null;
  } catch {
    return null;
  }
}

export async function createPoll(input: {
  profile_id: string;
  question: string;
  options: string[];
  expires_at?: string | null;
}): Promise<Poll> {
  const question = input.question.trim();
  const options = input.options.map((o) => o.trim()).filter(Boolean);
  if (question.length < 3 || question.length > 200) {
    throw new Error("Ask a real question (3 to 200 characters)");
  }
  if (options.length < 2 || options.length > 4) {
    throw new Error("Give 2 to 4 options");
  }
  if (options.some((o) => o.length > 60)) {
    throw new Error("Keep each option under 60 characters");
  }
  // One active poll per wall: the old one closes when a new one opens.
  const current = await fetchActivePoll(input.profile_id);
  if (current) {
    await sb.from("polls").update({ closed: true }).eq("id", current.id);
  }
  const { data, error } = await sb
    .from("polls")
    .insert({
      profile_id: input.profile_id,
      question,
      options,
      expires_at: input.expires_at ?? null,
      closed: false,
    })
    .select("*")
    .single();
  if (error) throw error;
  return data as Poll;
}

export async function closePoll(pollId: string): Promise<void> {
  const { error } = await sb.from("polls").update({ closed: true }).eq("id", pollId);
  if (error) throw error;
}

export async function deletePoll(pollId: string): Promise<void> {
  const { error } = await sb.from("polls").delete().eq("id", pollId);
  if (error) throw error;
}

export async function fetchVoteCounts(pollId: string): Promise<number[]> {
  const { data, error } = await sb
    .from("poll_votes")
    .select("option_index")
    .eq("poll_id", pollId);
  if (error) throw error;
  const counts: number[] = [];
  for (const row of (data ?? []) as { option_index: number }[]) {
    counts[row.option_index] = (counts[row.option_index] ?? 0) + 1;
  }
  return counts;
}

export async function fetchMyVote(pollId: string, visitorId: string | null): Promise<number | null> {
  if (!visitorId) return null;
  const { data, error } = await sb
    .from("poll_votes")
    .select("option_index")
    .eq("poll_id", pollId)
    .eq("visitor_id", visitorId)
    .maybeSingle();
  if (error) throw error;
  return (data as { option_index: number } | null)?.option_index ?? null;
}

export async function vote(pollId: string, optionIndex: number, visitorId: string | null): Promise<void> {
  if (!visitorId) throw new Error("Could not tell this browser apart — try again");
  const { error } = await sb
    .from("poll_votes")
    .insert({ poll_id: pollId, visitor_id: visitorId, option_index: optionIndex });
  if (error) {
    // The unique (poll_id, visitor_id) row: this browser already voted.
    if (String((error as { code?: string }).code) === "23505") {
      throw new Error("This browser already voted on this poll");
    }
    throw error;
  }
}
