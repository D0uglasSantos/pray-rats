"use client";

import { useCallback, useEffect, useState } from "react";
import { setActiveGroup } from "@/actions/auth";

const STORAGE_KEY = "pray_rats_active_group";

export function useActiveGroup(groups: { id: string }[]) {
  const [activeGroupId, setActiveGroupIdState] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && groups.some((g) => g.id === stored)) {
      setActiveGroupIdState(stored);
    } else if (groups[0]) {
      setActiveGroupIdState(groups[0].id);
    }
  }, [groups]);

  const setActiveGroupId = useCallback(async (groupId: string) => {
    setActiveGroupIdState(groupId);
    localStorage.setItem(STORAGE_KEY, groupId);
    await setActiveGroup(groupId);
  }, []);

  return { activeGroupId, setActiveGroupId };
}
