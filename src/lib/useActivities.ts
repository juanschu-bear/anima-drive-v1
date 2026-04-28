// useActivities.ts — fetches the activity feed for the current user.

import { useEffect, useState } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import type { AdActivityRow } from "@/lib/database.types";

export interface ActivityItem {
  id: string;
  type: AdActivityRow["type"];
  message: string;
  ageKey: string;
  rawCreatedAt: string;
}

interface UseActivitiesResult {
  activities: ActivityItem[];
  loading: boolean;
  error: string | null;
  isMock: boolean;
  refresh: () => Promise<void>;
}

// Mock activity items used when Supabase isn't wired or there's no user.
const MOCK_ACTIVITIES: ActivityItem[] = [
  { id: "m1", type: "categorized", message: "act_categorized", ageKey: "act_time_2m",  rawCreatedAt: "" },
  { id: "m2", type: "uploaded",    message: "act_upload",      ageKey: "act_time_14m", rawCreatedAt: "" },
  { id: "m3", type: "exported",    message: "act_export",      ageKey: "act_time_1h",  rawCreatedAt: "" },
  { id: "m4", type: "extracted",   message: "act_contract",    ageKey: "act_time_3h",  rawCreatedAt: "" },
];

function ageKeyForRow(createdAt: string): string {
  const ageMs = Date.now() - new Date(createdAt).getTime();
  const min = ageMs / 60000;
  if (min < 5) return "act_time_2m";
  if (min < 30) return "act_time_14m";
  if (min < 90) return "act_time_1h";
  return "act_time_3h";
}

export function useActivities(limit = 8): UseActivitiesResult {
  const { user } = useAuth();
  const [activities, setActivities] = useState<ActivityItem[]>(MOCK_ACTIVITIES);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const configured = isSupabaseConfigured();
  const isMock = !configured || !user;

  const refresh = async () => {
    if (isMock) {
      setActivities(MOCK_ACTIVITIES);
      return;
    }
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase
      .from("ad_activities")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);
    setLoading(false);
    if (err) {
      setError(err.message);
      return;
    }
    const rows = (data ?? []) as AdActivityRow[];
    setActivities(
      rows.map((row) => ({
        id: row.id,
        type: row.type,
        message: row.message,
        ageKey: ageKeyForRow(row.created_at),
        rawCreatedAt: row.created_at,
      })),
    );
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, configured, limit]);

  return { activities, loading, error, isMock, refresh };
}
