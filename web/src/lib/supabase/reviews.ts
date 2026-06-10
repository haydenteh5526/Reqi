import { createClient } from "@/lib/supabase/client";
import type { GameReviewResult } from "@/lib/engine";
import type { PgnGame } from "@/lib/engine/pgn";

export interface SavedReview {
  id: string;
  user_id: string;
  pgn: string;
  headers: Record<string, string>;
  moves: string[];
  review: GameReviewResult;
  created_at: string;
}

/**
 * Save a completed game review to Supabase.
 */
export async function saveReview(game: PgnGame, review: GameReviewResult): Promise<string | null> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("game_reviews")
    .insert({
      user_id: user.id,
      pgn: JSON.stringify(game),
      headers: game.headers,
      moves: game.moves,
      review,
    })
    .select("id")
    .single();

  if (error) { console.error("Save review error:", error); return null; }
  return data.id;
}

/**
 * Load a saved review by ID.
 */
export async function loadReview(id: string): Promise<SavedReview | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("game_reviews")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) return null;
  return data as SavedReview;
}

/**
 * List user's saved reviews.
 */
export async function listReviews(limit = 20): Promise<SavedReview[]> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("game_reviews")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) return [];
  return data as SavedReview[];
}

/**
 * SQL to create the table (run in Supabase SQL editor):
 *
 * create table game_reviews (
 *   id uuid default gen_random_uuid() primary key,
 *   user_id uuid references auth.users(id) not null,
 *   pgn text not null,
 *   headers jsonb default '{}',
 *   moves text[] not null,
 *   review jsonb not null,
 *   created_at timestamptz default now()
 * );
 *
 * alter table game_reviews enable row level security;
 * create policy "Users can read own reviews" on game_reviews for select using (auth.uid() = user_id);
 * create policy "Users can insert own reviews" on game_reviews for insert with check (auth.uid() = user_id);
 */
