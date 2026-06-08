export type FeedCursor = { checked_in_at: string; id: string };

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
};

export type FeedResult = {
  items: FeedCheckin[];
  hasMore: boolean;
  nextCursor: FeedCursor | null;
};
