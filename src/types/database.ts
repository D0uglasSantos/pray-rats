export type MemberRole = "admin" | "member";
export type CheckinVisibility = "public" | "private";
export type CheckinStatus = "valid" | "pending" | "rejected";
export type PeriodType = "weekly" | "monthly" | "general";

export interface Profile {
  id: string;
  name: string;
  email: string;
  avatar_url: string | null;
  bio: string | null;
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
  points: number;
  visibility: CheckinVisibility;
  status: CheckinStatus;
  checked_in_at: string;
  created_at: string;
  updated_at: string;
  profile?: Profile;
  activity_type?: ActivityType;
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
}

export interface GroupWithRole extends Group {
  role: MemberRole;
}

export interface DashboardStats {
  todayCheckins: Checkin[];
  weeklyPoints: number;
  rankingPosition: number | null;
  currentStreak: number;
  totalCheckins: number;
}
