import db from "../db";
import {
  getDoseIntervalDays,
  isMedicationDueOnDate,
} from "../utils/doseSchedule";

interface PendingReminder {
  openid: string;
  name: string;
  dosage: string;
  times: string;
  template_id: string;
}

export function getPendingReminders(): PendingReminder[] {
  const today = new Date().toISOString().split("T")[0];
  const rows = db
    .query(
      `SELECT u.openid, m.name, m.dosage, m.times, m.start_date, m.frequency, m.dose_interval_days, s.template_id
       FROM medications m
       JOIN users u ON m.user_id = u.id
       JOIN subscriptions s ON s.user_id = u.id AND s.status = 'accept'
       WHERE m.status = 'active'
       AND m.start_date <= ?
       AND json_extract(u.settings, '$.reminderEnabled') = 1`
    )
    .all(today) as Record<string, unknown>[];

  return rows.filter((r) =>
    isMedicationDueOnDate(
      String(r.start_date),
      today,
      getDoseIntervalDays(r)
    )
  ) as PendingReminder[];
}
