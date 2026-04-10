import db from "../db";
import {
  getDoseIntervalDays,
  isMedicationDueOnDate,
} from "../utils/doseSchedule";

export type TodayCheckinSummary = {
  id: unknown;
  status: unknown;
  actualTime: unknown;
};

export type TodayProgressItem = {
  medicationId: unknown;
  medicationName: unknown;
  dosage: unknown;
  icon: unknown;
  color: unknown;
  scheduledTime: string;
  checkin: TodayCheckinSummary | null;
};

export type TodayMedicationProgress = {
  date: string;
  items: TodayProgressItem[];
  progress: {
    total: number;
    completed: number;
    percentage: number;
  };
};

/** 与 GET /checkins/today 一致的当日应服时段与完成度（today 为 YYYY-MM-DD） */
export function getTodayMedicationProgress(
  userId: string,
  today: string
): TodayMedicationProgress {
  const meds = db
    .query(
      "SELECT id, name, dosage, icon, color, times, start_date, frequency, dose_interval_days FROM medications WHERE user_id = ? AND status = 'active' AND start_date <= ?"
    )
    .all(userId, today) as Record<string, unknown>[];

  const todayCheckins = db
    .query("SELECT * FROM checkins WHERE user_id = ? AND date = ?")
    .all(userId, today) as Record<string, unknown>[];

  const checkinMap = new Map<string, Record<string, unknown>>();
  for (const ci of todayCheckins) {
    const key = `${ci.medication_id}_${ci.scheduled_time}`;
    checkinMap.set(key, ci);
  }

  const items: TodayProgressItem[] = [];
  let totalSlots = 0;
  let completed = 0;

  for (const med of meds) {
    if (
      !isMedicationDueOnDate(
        String(med.start_date),
        today,
        getDoseIntervalDays(med as Record<string, unknown>)
      )
    ) {
      continue;
    }

    const times: string[] = JSON.parse((med.times as string) || "[]");
    const slotTimes = times.length > 0 ? times : [""];
    for (const time of slotTimes) {
      totalSlots++;
      const key = `${med.id}_${time}`;
      const ci = checkinMap.get(key);

      items.push({
        medicationId: med.id,
        medicationName: med.name,
        dosage: med.dosage,
        icon: med.icon,
        color: med.color,
        scheduledTime: time,
        checkin: ci
          ? {
              id: ci.id,
              status: ci.status,
              actualTime: ci.actual_time,
            }
          : null,
      });

      if (ci && ci.status === "taken") completed++;
    }
  }

  return {
    date: today,
    items,
    progress: {
      total: totalSlots,
      completed,
      percentage: totalSlots > 0 ? Math.round((completed / totalSlots) * 100) : 0,
    },
  };
}

/** 脚本用：按 IANA 时区得到当地 YYYY-MM-DD */
export function formatYmdInTimeZone(d: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}
