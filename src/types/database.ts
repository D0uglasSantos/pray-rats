export type MemberRole = "admin" | "member";
export type CheckinVisibility = "public" | "private";
export type CheckinStatus = "valid" | "pending" | "rejected";
export type PeriodType = "weekly" | "monthly" | "general";

export type AppTourStatus =
  | "pending"
  | "in_progress"
  | "completed"
  | "dismissed";

export interface AppTourState {
  version: number;
  status: AppTourStatus;
  step: number;
}

export interface Profile {
  id: string;
  name: string;
  email: string;
  avatar_url: string | null;
  bio: string | null;
  app_tour_version: number;
  app_tour_status: AppTourStatus;
  app_tour_step: number;
  app_tour_updated_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Group {
  id: string;
  name: string;
  description: string | null;
  cover_url: string | null;
  invite_code: string;
  start_date: string | null;
  end_date: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface GroupMember {
  id: string;
  group_id: string;
  user_id: string;
  role: MemberRole;
  joined_at: string;
  profile?: Profile;
}

export interface ActivityType {
  id: string;
  group_id: string;
  name: string;
  description: string | null;
  points: number;
  daily_limit: number | null;
  weekly_limit: number | null;
  is_active: boolean;
  is_private_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface Checkin {
  id: string;
  group_id: string;
  user_id: string;
  activity_type_id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  duration_minutes: number | null;
  distance_km: number | null;
  points: number;
  visibility: CheckinVisibility;
  status: CheckinStatus;
  checked_in_at: string;
  created_at: string;
  updated_at: string;
  batch_id: string | null;
  profile?: Profile;
  activity_type?: ActivityType;
}

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  read_at: string | null;
  created_at: string;
}

export interface PushSubscription {
  id: string;
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  created_at: string;
}

export interface GroupRanking {
  group_id: string;
  user_id: string;
  name: string;
  avatar_url: string | null;
  total_checkins: number;
  total_points: number;
  last_checkin_at?: string;
  week_start?: string;
  month_start?: string;
  rank_position?: number;
}

export interface GroupWithRole extends Group {
  role: MemberRole;
}

export interface UserFollow {
  id: string;
  follower_id: string;
  following_id: string;
  created_at: string;
}

export interface DashboardStats {
  todayCheckins: Checkin[];
  weeklyPoints: number;
  rankingPosition: number | null;
  currentStreak: number;
  totalCheckins: number;
}

export interface CheckinBatchEntry {
  id: string;
  group_id: string;
  group_name: string;
}

export interface CheckinEditContext {
  checkin: Checkin & {
    activity_type?: ActivityType | ActivityType[] | null;
  };
  batchEntries: CheckinBatchEntry[];
  activitiesByGroupId: Record<string, ActivityType[]>;
}
