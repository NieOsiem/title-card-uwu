
import { MODULE_ID } from "./settings.js";

const SOCKET_NAME = `module.${MODULE_ID}`;

/** Registered once in main.js. Calls TitleCard.show on every client. */
export function registerSocketListener(onReceive) {
  game.socket.on(SOCKET_NAME, (payload) => {
    onReceive(payload);
  });
}

/**
 * Broadcast a show-card payload to all connected clients.
 * Also triggers the callback locally so the GM's screen matches players.
 *
 * @param {object}   payload
 * @param {Function} onReceive - Same handler passed to registerSocketListener
 */
export function broadcastTitleCard(payload, onReceive) {
  if (!game.user.isGM) {
    ui.notifications.warn(game.i18n.localize("INVINCIBLE.Notifications.GMOnly"));
    return;
  }
  game.socket.emit(SOCKET_NAME, payload);
  // GM renders locally via the same path as every other client
  onReceive(payload);
}
