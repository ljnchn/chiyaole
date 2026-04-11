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
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: feishuTextMessageBody(text),
  });
  return res.ok;
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
