import { describe, it, expect } from "bun:test";
import {
  buildCheckinFeishuText,
  formatYmdAsMonthDay,
} from "../services/feishuWebhook";

const base = { date: "2026-04-11", timeZone: "Asia/Shanghai" };

describe("buildCheckinFeishuText", () => {
  it("同日为今日已打卡", () => {
    const text = buildCheckinFeishuText(base, "2026-04-11");
    expect(text).toBe("今日已打卡");
  });

  it("早于今日为 x月x日已补录", () => {
    const text = buildCheckinFeishuText(
      { ...base, date: "2026-04-10" },
      "2026-04-11"
    );
    expect(text).toBe("4月10日已补录");
  });
});

describe("formatYmdAsMonthDay", () => {
  it("去掉月日前导零", () => {
    expect(formatYmdAsMonthDay("2026-01-05")).toBe("1月5日");
  });
});
