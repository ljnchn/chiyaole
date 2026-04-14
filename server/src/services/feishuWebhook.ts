import { formatYmdInTimeZone } from "./todayProgress";

/** 与提醒脚本一致：飞书自定义机器人 text 消息体 */
export function feishuTextMessageBody(text: string): string {
  return JSON.stringify({
    msg_type: "text",
    content: { text },
  });
}

export function getReminderWebhookUrl(): string | undefined {
  return process.env.REMINDER_WEBHOOK_URL?.trim();
}

/**
 * 与 `remind:webhook` 脚本一致：需同时配置 REMINDER_WEBHOOK_URL 与
 * REMINDER_TARGET_USER_ID，且仅向该用户推送（同一机器人、同一受众）。
 */
export function shouldSendCheckinFeishu(userId: string): boolean {
  const url = getReminderWebhookUrl();
  const target = process.env.REMINDER_TARGET_USER_ID?.trim();
  if (!url || !target) return false;
  return userId === target;
}

export async function sendFeishuWebhookText(text: string): Promise<boolean> {
  const url = getReminderWebhookUrl();
  if (!url) return false;

  const payload = feishuTextMessageBody(text);
  const maxRetries = 3;

  for (let retry = 0; retry <= maxRetries; retry += 1) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: payload,
      });
      const raw = await res.text();
      let parsed: unknown = raw;
      try {
        parsed = raw ? JSON.parse(raw) : undefined;
      } catch {
        // ignore JSON parse failure and keep raw body for logging
      }

      if (
        res.ok &&
        typeof parsed === "object" &&
        parsed !== null &&
        (parsed as { code?: number }).code === 0
      ) {
        console.log(JSON.stringify(parsed, null, 2));
        return true;
      }

      throw new Error(
        `[feishuWebhook] 响应异常 status=${res.status}, body=${raw || "<empty>"}`
      );
    } catch (error) {
      if (retry === maxRetries) {
        console.error(
          `[feishuWebhook] webhook 发送失败（已重试 ${maxRetries} 次）:`,
          error
        );
        return false;
      }
      console.warn(
        `[feishuWebhook] webhook 发送失败，准备第 ${retry + 1} 次重试`,
        error
      );
    }
  }

  return false;
}

export type CheckinNotifyContext = {
  date: string;
  timeZone: string;
};

/** YYYY-MM-DD →「M月D日」（无前导零） */
export function formatYmdAsMonthDay(ymd: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd);
  if (!m) return ymd;
  return `${parseInt(m[2], 10)}月${parseInt(m[3], 10)}日`;
}

/**
 * 今日 vs 补录：按 REMINDER_TZ 的「今天」与打卡 date 比较。
 * todayYmd 仅用于单测注入。
 */
export function buildCheckinFeishuText(
  ctx: CheckinNotifyContext,
  todayYmd?: string
): string {
  const today = todayYmd ?? formatYmdInTimeZone(new Date(), ctx.timeZone);
  if (ctx.date < today) {
    return `${formatYmdAsMonthDay(ctx.date)}已补录`;
  }
  return "今日已打卡";
}

export function notifyCheckinTakenFireAndForget(
  userId: string,
  ctx: CheckinNotifyContext
): void {
  if (!shouldSendCheckinFeishu(userId)) return;
  const text = buildCheckinFeishuText(ctx);
  void sendFeishuWebhookText(text).catch((e) =>
    console.error("[feishuWebhook] 打卡通知发送失败:", e)
  );
}
