import { describe, it, expect, beforeEach } from "bun:test";
import db from "../db";
import {
  formatYmdInTimeZone,
  getTodayMedicationProgress,
} from "../services/todayProgress";

const TODAY = "2030-06-15";

function resetDb() {
  db.run("DELETE FROM checkins");
  db.run("DELETE FROM subscriptions");
  db.run("DELETE FROM medications");
  db.run("DELETE FROM users");
}

function seedUser(id: string) {
  db.run(
    "INSERT INTO users (id, openid) VALUES (?, ?)",
    [id, `openid_${id}`]
  );
}

describe("getTodayMedicationProgress", () => {
  beforeEach(() => {
    resetDb();
  });

  it("无药品时应服时段为 0", () => {
    seedUser("u_empty");
    const r = getTodayMedicationProgress("u_empty", TODAY);
    expect(r.progress.total).toBe(0);
    expect(r.progress.completed).toBe(0);
    expect(r.items).toEqual([]);
  });

  it("单时段未打卡则 completed 为 0", () => {
    seedUser("u1");
    db.run(
      `INSERT INTO medications (id, user_id, name, dosage, times, start_date, dose_interval_days, status)
       VALUES ('m1', 'u1', '维C', '1片', '["08:00"]', '2030-01-01', 1, 'active')`
    );
    const r = getTodayMedicationProgress("u1", TODAY);
    expect(r.progress.total).toBe(1);
    expect(r.progress.completed).toBe(0);
    expect(r.items[0].checkin).toBeNull();
  });

  it("已 taken 则计入 completed", () => {
    seedUser("u2");
    db.run(
      `INSERT INTO medications (id, user_id, name, dosage, times, start_date, dose_interval_days, status)
       VALUES ('m2', 'u2', '维C', '1片', '["08:00"]', '2030-01-01', 1, 'active')`
    );
    db.run(
      `INSERT INTO checkins (id, user_id, medication_id, date, scheduled_time, status)
       VALUES ('c2', 'u2', 'm2', ?, '08:00', 'taken')`,
      [TODAY]
    );
    const r = getTodayMedicationProgress("u2", TODAY);
    expect(r.progress.total).toBe(1);
    expect(r.progress.completed).toBe(1);
    expect(r.progress.percentage).toBe(100);
  });

  it("missed 不算 completed", () => {
    seedUser("u3");
    db.run(
      `INSERT INTO medications (id, user_id, name, dosage, times, start_date, dose_interval_days, status)
       VALUES ('m3', 'u3', '维C', '1片', '["08:00"]', '2030-01-01', 1, 'active')`
    );
    db.run(
      `INSERT INTO checkins (id, user_id, medication_id, date, scheduled_time, status)
       VALUES ('c3', 'u3', 'm3', ?, '08:00', 'missed')`,
      [TODAY]
    );
    const r = getTodayMedicationProgress("u3", TODAY);
    expect(r.progress.completed).toBe(0);
  });

  it("隔日服药在不应服日不产生时段", () => {
    seedUser("u4");
    db.run(
      `INSERT INTO medications (id, user_id, name, dosage, times, start_date, dose_interval_days, status)
       VALUES ('m4', 'u4', '药', '1片', '[]', '2030-06-14', 2, 'active')`
    );
    const r = getTodayMedicationProgress("u4", "2030-06-15");
    expect(r.progress.total).toBe(0);
  });
});

describe("formatYmdInTimeZone", () => {
  it("返回 YYYY-MM-DD 格式", () => {
    const s = formatYmdInTimeZone(new Date("2030-06-15T12:00:00Z"), "Asia/Shanghai");
    expect(s).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
