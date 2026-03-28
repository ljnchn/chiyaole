/** 与小程序 utils/doseSchedule.js 保持一致的用药日规则 */

export const DOSE_INTERVAL_VALUES = [0, 1, 2, 3, 7] as const;
export type DoseIntervalDays = (typeof DOSE_INTERVAL_VALUES)[number];

export function legacyFrequencyToInterval(frequency: string): number {
  if (frequency === "隔日1次") return 2;
  if (frequency === "每周1次") return 7;
  if (frequency === "必要时") return 0;
  return 1;
}

/** 从行数据解析间隔天数（兼容无 dose_interval_days 的旧数据） */
export function getDoseIntervalDays(row: Record<string, unknown>): number {
  const raw = row.dose_interval_days;
  if (raw !== undefined && raw !== null && raw !== "") {
    const n = Number(raw);
    if ((DOSE_INTERVAL_VALUES as readonly number[]).includes(n)) return n;
  }
  return legacyFrequencyToInterval(String(row.frequency ?? ""));
}

/** 为满足旧版 SQLite CHECK，写入占位 frequency 文案 */
export function frequencyStubForDb(intervalDays: number): string {
  if (intervalDays === 2) return "隔日1次";
  if (intervalDays === 7) return "每周1次";
  if (intervalDays === 0) return "必要时";
  return "1日1次";
}

/** startDate、dateStr: YYYY-MM-DD；0=必要时视为每日可出现打卡 */
export function isMedicationDueOnDate(
  startDate: string,
  dateStr: string,
  intervalDays: number
): boolean {
  if (!startDate || dateStr < startDate) return false;
  if (intervalDays === 0) return true;
  const d0 = new Date(`${startDate}T12:00:00`);
  const d1 = new Date(`${dateStr}T12:00:00`);
  const diffDays = Math.round((d1.getTime() - d0.getTime()) / (24 * 60 * 60 * 1000));
  if (diffDays < 0) return false;
  const interval = intervalDays <= 0 ? 1 : intervalDays;
  return diffDays % interval === 0;
}

export function normalizeDoseIntervalInput(
  body: Record<string, unknown>
): number | undefined {
  const raw =
    body.doseIntervalDays !== undefined
      ? body.doseIntervalDays
      : body.doseInterval;
  if (raw === undefined || raw === null) return undefined;
  const n = typeof raw === "number" ? raw : parseInt(String(raw), 10);
  if (!Number.isFinite(n) || !(DOSE_INTERVAL_VALUES as readonly number[]).includes(n)) {
    return undefined;
  }
  return n;
}
