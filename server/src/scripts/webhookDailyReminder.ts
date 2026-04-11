import db from "../db";
import { sendFeishuWebhookText } from "../services/feishuWebhook";
import {
  formatYmdInTimeZone,
  getTodayMedicationProgress,
} from "../services/todayProgress";

const userId = process.env.REMINDER_TARGET_USER_ID?.trim();
const webhookUrl = process.env.REMINDER_WEBHOOK_URL?.trim();
const timeZone = process.env.REMINDER_TZ?.trim() || "Asia/Shanghai";
const webhookText =
  process.env.REMINDER_WEBHOOK_TEXT?.trim() || "今天还没吃哦";

function fail(msg: string): never {
  console.error(msg);
  process.exit(1);
}

if (!userId) {
  fail("缺少环境变量 REMINDER_TARGET_USER_ID");
}
if (!webhookUrl) {
  fail("缺少环境变量 REMINDER_WEBHOOK_URL");
}

const userRow = db.query("SELECT id FROM users WHERE id = ?").get(userId);
if (!userRow) {
  fail(`用户不存在: ${userId}`);
}

const today = formatYmdInTimeZone(new Date(), timeZone);
const { progress } = getTodayMedicationProgress(userId, today);

if (progress.total === 0) {
  console.log(`[remind:webhook] ${today} 无应服时段，跳过`);
  process.exit(0);
}

if (progress.completed === progress.total) {
  console.log(`[remind:webhook] ${today} 已完成 ${progress.completed}/${progress.total}，跳过`);
  process.exit(0);
}

const ok = await sendFeishuWebhookText(webhookText);
if (!ok) {
  fail("Webhook 请求失败或未返回成功状态");
}

console.log(
  `[remind:webhook] 已提醒 ${today} 未完成 (${progress.completed}/${progress.total})`
);
process.exit(0);
