"use client";

import type { ActivityDraft } from "@/lib/activity-drafts";
import { ActivitySetupSection } from "@/components/groups/activities/activity-setup-section";

interface ActivitySetupEditorProps {
  activities: ActivityDraft[];
  onChange: (activities: ActivityDraft[]) => void;
  disabled?: boolean;
}

export function ActivitySetupEditor({
  activities,
  onChange,
  disabled = false,
}: ActivitySetupEditorProps) {
  return (
    <ActivitySetupSection
      activities={activities}
      onChange={onChange}
      disabled={disabled}
    />
  );
}
