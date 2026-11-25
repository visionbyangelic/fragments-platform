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
