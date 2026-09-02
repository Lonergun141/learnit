import "server-only";

import { parseTelegramBotUsername } from "./contracts";

export function getTelegramBotUsername() {
  return parseTelegramBotUsername({
    TELEGRAM_BOT_USERNAME: process.env.TELEGRAM_BOT_USERNAME,
  });
}
