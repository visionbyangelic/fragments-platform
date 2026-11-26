import { supabase } from "@/integrations/supabase/client";

export type Question = {
  id: string;
  profile_id: string;
  name: string | null;
  question: string;
  answer: string | null;
  is_anonymous: boolean;
  is_published: boolean;
  answered_at: string | null;
  /** The sender's wall username when they were signed in. Only ever
      shown to the wall's owner, and only when is_anonymous is false. */
  sender_username: string | null;
  /** A stable id for the browser it came from (localStorage), so
      questions from the same browser can be linked even when the
      sender was not logged in. Never a name on its own. */
  sender_visitor_id: string | null;
  created_at: string;
  updated_at: string;
};

const sb = supabase as unknown as {
  from: (table: string) => any;
  channel: typeof supabase.channel;
  removeChannel: typeof supabase.removeChannel;
};

export async function fetchQuestions(profileId: string): Promise<Question[]> {
  const { data, error } = await sb
    .from("questions")
    .select("*")
    .eq("profile_id", profileId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Question[];
}

export async function submitQuestion(input: {
  profile_id: string;
  name: string | null;
  question: string;
  is_anonymous: boolean;
  /** The sender's own wall username. Only the caller ever passes
      their own — the database refuses anyone else's. Recorded even
      when is_anonymous is true; the owner only sees it when it is
      false, so the name is banked for a possible future reveal. */
  sender_username?: string | null;
  /** The browser's visitor id, if one could be made. */
  sender_visitor_id?: string | null;
}): Promise<string> {
  const cleanQuestion = input.question.trim();
  if (cleanQuestion.length < 3 || cleanQuestion.length > 800) {
    throw new Error("Question must be between 3 and 800 characters.");
  }

  const { data, error } = await sb
    .from("questions")
    .insert({
      profile_id: input.profile_id,
      name: input.is_anonymous ? null : input.name?.trim() || null,
      question: cleanQuestion,
      is_anonymous: input.is_anonymous,
      is_published: false,
      answer: null,
      answered_at: null,
      sender_username: input.sender_username ?? null,
      sender_visitor_id: input.sender_visitor_id ?? null,
    })
    .select("id")
    .single();
  if (error) throw error;
  return (data as { id: string }).id;
}

export async function answerQuestion(id: string, answer: string): Promise<void> {
  const cleanAnswer = answer.trim();
  if (cleanAnswer.length < 1 || cleanAnswer.length > 2000) {
    throw new Error("Answer must be between 1 and 2000 characters.");
  }

  const { error } = await sb
    .from("questions")
    .update({ answer: cleanAnswer, answered_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

export async function setQuestionPublished(id: string, is_published: boolean): Promise<void> {
  const { error } = await sb.from("questions").update({ is_published }).eq("id", id);
  if (error) throw error;
}

export async function deleteQuestion(id: string): Promise<void> {
  const { error } = await sb.from("questions").delete().eq("id", id);
  if (error) throw error;
}

export function subscribeToQuestions(onChange: () => void, profileId: string) {
  const channel = sb
    .channel(`questions-changes-${profileId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "questions",
        filter: `profile_id=eq.${profileId}`,
      },
      () => {
        onChange();
      },
    )
    .subscribe();
  return () => {
    sb.removeChannel(channel);
  };
}

export async function fetchRandomQuestion(profileId: string): Promise<Question | null> {
  const { count, error: countError } = await sb
    .from("questions")
    .select("id", { count: "exact", head: true })
    .eq("profile_id", profileId)
    .eq("is_published", true)
    .not("answer", "is", null);

  if (countError || !count || count === 0) return null;

  const randomOffset = Math.floor(Math.random() * count);

  const { data, error } = await sb
    .from("questions")
    .select("*")
    .eq("profile_id", profileId)
    .eq("is_published", true)
    .not("answer", "is", null)
    .range(randomOffset, randomOffset)
    .maybeSingle();

  if (error || !data) return null;
  return data as Question;
}
