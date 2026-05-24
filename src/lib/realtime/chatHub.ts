"use client";

import {
  HubConnection,
  HubConnectionBuilder,
  HubConnectionState,
  HttpTransportType,
  LogLevel,
} from "@microsoft/signalr";
import { getAccessToken } from "@/src/lib/tokenStorage";
import type { ChatMessageDto } from "@/src/types/chat";

const HUB_URL =
  process.env.NEXT_PUBLIC_SIGNALR_URL ?? "https://pawofhelp.onrender.com/chathub";

// ✅ Реальные имена с твоих тестов
const JOIN_METHOD = "JoinChat";
const SEND_METHOD = "SendMessage";
const RECEIVE_EVENT = "ReceiveMessage";

// Leave-метод бэкенд не подтверждал — делаем безопасно через попытки
const LEAVE_CANDIDATES = ["LeaveChat", "Leave", "LeaveTask", "LeaveTaskChat"];

let connPromise: Promise<HubConnection> | null = null;

async function ensureStarted(conn: HubConnection) {
  if (conn.state === HubConnectionState.Connected) return;
  if (conn.state === HubConnectionState.Connecting) return;
  await conn.start();
}

export async function getChatHubConnection(): Promise<HubConnection> {
  if (connPromise) return connPromise;

  connPromise = (async () => {
    const conn = new HubConnectionBuilder()
      .withUrl(HUB_URL, {
        accessTokenFactory: () => getAccessToken() ?? "",
        // ✅ чтобы не было CORS на SSE/LongPolling, форсим WebSockets
        transport: HttpTransportType.WebSockets,
        // можно оставить false (будет negotiate) — negotiate у тебя 200
        // если хочешь вообще без negotiate: skipNegotiation: true
      })
      .withAutomaticReconnect([0, 2000, 5000, 10000])
      .configureLogging(LogLevel.Information)
      .build();

    conn.onreconnecting((e) => console.log("[chatHub] reconnecting", e));
    conn.onreconnected((id) => console.log("[chatHub] reconnected", id));
    conn.onclose((e) => console.log("[chatHub] closed", e));

    await ensureStarted(conn);
    return conn;
  })();

  return connPromise;
}

export async function joinChat(taskId: string) {
  const conn = await getChatHubConnection();
  await ensureStarted(conn);
  await conn.invoke(JOIN_METHOD, taskId); // ✅ подтверждено тестом
}

export async function leaveChat(taskId: string) {
  const conn = await getChatHubConnection();
  if (conn.state !== HubConnectionState.Connected) return;

  for (const m of LEAVE_CANDIDATES) {
    try {
      await conn.invoke(m, taskId);
      return;
    } catch {
      // ignore
    }
  }
}

export async function subscribeReceiveMessage(
  handler: (msg: ChatMessageDto) => void
): Promise<() => void> {
  const conn = await getChatHubConnection();

  conn.off(RECEIVE_EVENT);
  conn.on(RECEIVE_EVENT, (msg: ChatMessageDto) => {
    handler(msg);
  });

  return () => {
    conn.off(RECEIVE_EVENT);
  };
}

export async function sendMessage(taskId: string, text: string) {
  const conn = await getChatHubConnection();
  await ensureStarted(conn);

  const message = text.trim();
  if (!message) return;

  /**
   * ✅ В твоём payload поле называется "message".
   * Поэтому отправляем именно так.
   */
  await conn.invoke(SEND_METHOD, { taskId, message });
}