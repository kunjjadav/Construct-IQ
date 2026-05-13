import api from "./axiosInstance";

export interface PhaseBreakdown {
  id: number;
  wbs_code: string;
  title: string;
  node_type: string;
  completion_pct: string;
  budget_weight: string;
  status: string;
  estimated_cost: string;
  earned_value_pct: string;
}

export interface SparklineDataPoint {
  date: string;
  pct: string;
  delta: string;
  ev: string;
  pv: string;
  ac: string;
  cpi: string | null;
  spi: string | null;
  tasks_completed: number;
  entries_logged: number;
}

export interface WBSHealth {
  total: number;
  completed: number;
  in_progress: number;
  not_started: number;
  on_hold: number;
}

export interface ResourceSummary {
  labor: {
    total_hours: string;
    total_headcount: number;
    total_entries: number;
  };
  materials: {
    total_entries: number;
  };
  machinery: {
    total_hours: string;
    total_idle_hours: string;
    total_entries: number;
  };
}

export interface EVMSnapshot {
  cpi: string | null;
  spi: string | null;
  health_status: string;
  health_label: string;
  earned_value: string;
  planned_value: string;
  actual_cost: string;
}

export interface RecentProgressEntry {
  id: number;
  wbs_code: string;
  task_title: string;
  reported_by: string;
  log_date: string;
  previous_pct: string;
  new_pct: string;
  delta_pct: string;
  description: string;
}

export interface ProgressSummaryResponse {
  project_id: number;
  project_name: string;
  overall_completion_pct: string;
  daily_delta_pct: string;
  delta_direction: "up" | "down" | "neutral";
  phase_breakdown: PhaseBreakdown[];
  sparkline_history: SparklineDataPoint[];
  wbs_health: WBSHealth;
  resource_summary: ResourceSummary;
  evm_snapshot: EVMSnapshot;
  recent_progress: RecentProgressEntry[];
  snapshot_date: string;
  has_wbs: boolean;
  total_leaf_tasks: number;
}

export const progressApi = {
  getSummary: async (
    projectId: number | string,
    historyDays: number = 14,
  ): Promise<ProgressSummaryResponse> => {
    const res = await api.get(`/api/projects/${projectId}/progress-summary/`, {
      params: { history_days: historyDays },
    });
    return res.data;
  },
};
