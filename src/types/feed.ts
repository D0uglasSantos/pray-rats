export type FeedCursor = { checked_in_at: string; id: string };

export type FeedReactionSummary = {
  emoji: string;
  count: number;
  reactedByMe: boolean;
};

export type FeedComment = {
  id: string;
  checkin_id: string;
  user_id: string;
  body: string;
  created_at: string;
  profile: { name: string; avatar_url: string | null } | null;
};

export type FeedCheckin = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  points: number;
  checked_in_at: string;
  image_url: string | null;
  profile: { name: string; avatar_url: string | null } | null;
  activity_type: { name: string } | null;
  reactions?: FeedReactionSummary[];
  comments?: FeedComment[];
  myReaction?: string | null;
};

export type FeedResult = {
  items: FeedCheckin[];
  hasMore: boolean;
  nextCursor: FeedCursor | null;
};
