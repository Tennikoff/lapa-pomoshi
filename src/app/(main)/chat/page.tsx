"use client";

export const dynamic = "force-dynamic";

import Link from "next/link";
import profileStyles from "@/src/app/(main)/profile/profile.module.css";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import styles from "./chat.module.css";
import { fetchCurrentProfile } from "@/src/lib/currentProfile";
import { chatApi } from "@/src/lib/api/chat";
import { ApiError } from "@/src/lib/api/http";
import type { ChatListItemDto, ChatMessageDto } from "@/src/types/chat";
import {
  joinChat,
  leaveChat,
  sendMessage,
  subscribeReceiveMessage,
} from "@/src/lib/realtime/chatHub";

function pickFirstNonEmpty(...values: Array<string | null | undefined>) {
  for (const v of values) {
    const t = (v ?? "").toString().trim();
    if (t) return t;
  }
  return "";
}

function msgText(m: ChatMessageDto): string {
  const t = (m.message ?? "").trim();
  return t || "—";
}

function msgCreatedAt(m: ChatMessageDto): string {
  return m.createdAt ?? "";
}

function msgSenderName(m: ChatMessageDto): string {
  const t = (m.sender?.name ?? "").trim();
  return t || "Без имени";
}

function msgSenderId(m: ChatMessageDto): string {
  return (m.sender?.id ?? "").trim();
}

function formatTime(iso: string) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
}

export default function ChatPage() {
  const router = useRouter();
  const sp = useSearchParams();
  const taskIdFromUrl = (sp.get("taskId") || "").trim();

  const [loading, setLoading] = useState(true);
  const [meId, setMeId] = useState<string | null>(null);

  const [chats, setChats] = useState<ChatListItemDto[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  const [messagesLoading, setMessagesLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessageDto[]>([]);
  const [errorText, setErrorText] = useState<string | null>(null);

  const [draft, setDraft] = useState("");
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const selectedChat = useMemo(
    () => chats.find((c) => c.taskId === selectedTaskId) ?? null,
    [chats, selectedTaskId]
  );

  const loadChats = async () => {
    const res = await chatApi.chats(0, 50);
    setChats(res.chats ?? []);
  };

  const loadMessages = async (taskId: string) => {
    setMessagesLoading(true);
    try {
      const res = await chatApi.messages(taskId, 0, 200);
      setMessages(res.messages ?? []);
    } finally {
      setMessagesLoading(false);
    }
  };

  // init: auth + chats + subscribe signalR
  useEffect(() => {
    let cancelled = false;
    let unsub: null | (() => void) = null;

    (async () => {
      setLoading(true);
      setErrorText(null);

      try {
        const me = await fetchCurrentProfile();
        if (!me) {
          if (!cancelled) {
            setMeId(null);
            setChats([]);
          }
          return;
        }
        if (cancelled) return;
        setMeId(me.userId);

        const list = await chatApi.chats(0, 50);
        if (cancelled) return;

        setChats(list.chats ?? []);

        const nextId =
          (taskIdFromUrl &&
            (list.chats ?? []).some((x) => x.taskId === taskIdFromUrl) &&
            taskIdFromUrl) ||
          list.chats?.[0]?.taskId ||
          null;

        setSelectedTaskId(nextId);

        // SignalR subscribe (на входящие сообщения)
        unsub = await subscribeReceiveMessage(async (payload: unknown) => {
          // пока без знания схемы payload — просто синхронизируемся через REST
          console.log("[chatHub] incoming:", payload);

          try {
            // если чат открыт — обновим сообщения
            if (selectedTaskId) {
              await loadMessages(selectedTaskId);
              await chatApi.markRead(selectedTaskId).catch(() => {});
            }
            // и обновим список чатов (hasNewMessages)
            await loadChats();
          } catch {
            // ignore
          }
        });
      } catch (e) {
        if (cancelled) return;
        let msg = "Не удалось загрузить чаты";
        if (e instanceof ApiError) msg = e.message;
        else if (e instanceof Error) msg = e.message;
        setErrorText(msg);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      unsub?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // when selected chat changes: join + load history + markRead
  useEffect(() => {
    if (!selectedTaskId) {
      setMessages([]);
      return;
    }

    let cancelled = false;
    const currentId = selectedTaskId;

    (async () => {
      try {
        await joinChat(currentId);
      } catch {
        // join может быть необязателен
      }

      try {
        await loadMessages(currentId);
        await chatApi.markRead(currentId).catch(() => {});
        await loadChats();
      } catch (e) {
        if (cancelled) return;
        let msg = "Не удалось загрузить сообщения";
        if (e instanceof ApiError) msg = e.message;
        else if (e instanceof Error) msg = e.message;
        setErrorText(msg);
      }
    })();

    return () => {
      cancelled = true;
      leaveChat(currentId).catch(() => {});
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTaskId]);

  // scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length, selectedTaskId]);

  const onSelectChat = (taskId: string) => {
    setSelectedTaskId(taskId);
    router.replace(`/chat?taskId=${encodeURIComponent(taskId)}`);
  };

  const onSend = async () => {
    const text = draft.trim();
    if (!text || !selectedTaskId) return;

    setDraft("");

    try {
      await sendMessage(selectedTaskId, text);

      // Надёжная синхронизация: перезагрузим историю через REST
      await loadMessages(selectedTaskId);
      await chatApi.markRead(selectedTaskId).catch(() => {});
      await loadChats();
    } catch (e) {
      let msg = "Не удалось отправить сообщение";
      if (e instanceof ApiError) msg = e.message;
      else if (e instanceof Error) msg = e.message;
      alert(msg);
    }
  };

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <div className={styles.emptyBox}>Загрузка…</div>
        </div>
      </div>
    );
  }

  if (!meId) {
    return (
      <div className={profileStyles.page}>
        <div className={profileStyles.centerScreen}>
          <div className={profileStyles.centerBox}>
            <h2 style={{ margin: "0 0 6px" }}>Вы не вошли в аккаунт</h2>
            <p style={{ color: "#6C757D", margin: 0 }}>
              Войдите, чтобы увидеть чат.
            </p>

            <Link href="/login" className={`${profileStyles.btnLarge} ${profileStyles.btnLogin}`}>
              ВОЙТИ
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const title = selectedChat?.taskTitle ?? "Чат";

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.shell}>
          <aside className={styles.sidebar}>
            <div className={styles.sidebarHeader}>Чаты</div>

            <div className={styles.chatList}>
              {errorText ? <div className={styles.emptyBox}>{errorText}</div> : null}

              {!errorText && chats.length === 0 ? (
                <div className={styles.emptyBox}>Пока нет доступных чатов.</div>
              ) : null}

              {chats.map((c) => {
                const active = c.taskId === selectedTaskId;
                return (
                  <button
                    key={c.taskId}
                    type="button"
                    className={`${styles.chatItem} ${active ? styles.chatItemActive : ""}`}
                    onClick={() => onSelectChat(c.taskId)}
                    aria-pressed={active}
                  >
                    <div className={styles.avatar}>
                      {(c.taskTitle || "?").slice(0, 1).toUpperCase()}
                    </div>

                    <div className={styles.chatInfo}>
                      <div className={styles.chatNameRow}>
                        <div className={styles.chatName} title={c.taskTitle}>
                          {c.taskTitle}
                        </div>
                        {c.hasNewMessages ? (
                          <span className={styles.unread}>new</span>
                        ) : null}
                      </div>

                      <div className={styles.chatPreviewRow}>
                        <span className={styles.previewText}>
                          {c.hasNewMessages ? "Есть новые сообщения" : "Нет новых сообщений"}
                        </span>
                        <span className={styles.previewTime} />
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </aside>

          <main className={styles.window}>
            <header className={styles.windowHeader}>
              <div className={styles.avatar}>
                {(title || "?").slice(0, 1).toUpperCase()}
              </div>
              <h2 className={styles.windowTitle} title={title}>
                {title}
              </h2>
            </header>

            <section className={styles.messages} aria-label="Сообщения">
              {messagesLoading ? (
                <div className={styles.emptyBox}>Загрузка сообщений…</div>
              ) : null}

              {!messagesLoading && selectedTaskId && messages.length === 0 ? (
                <div className={styles.emptyBox}>Сообщений пока нет.</div>
              ) : null}

              {messages.map((m, idx) => {
                const senderId = msgSenderId(m);
                const mine = Boolean(senderId && meId && senderId === meId);
                const time = formatTime(msgCreatedAt(m));

                return (
                  <div
                    key={m.id ?? `${selectedTaskId}_${idx}`}
                    className={`${styles.msg} ${mine ? styles.msgMine : ""}`}
                  >
                    <div className={styles.msgTop}>
                      <span className={styles.msgAuthor}>{msgSenderName(m)}</span>
                      <span className={styles.msgTime}>{time}</span>
                    </div>
                    <div className={styles.msgText}>{msgText(m)}</div>
                  </div>
                );
              })}

              <div ref={bottomRef} />
            </section>

            <footer className={styles.inputArea}>
              <div className={styles.inputWrap}>
                <input
                  className={styles.input}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Сообщение…"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") onSend();
                  }}
                />
                <button
                  type="button"
                  className={styles.sendBtn}
                  onClick={onSend}
                  aria-label="Отправить"
                >
                  <svg className={styles.sendIcon} viewBox="0 0 24 24">
                    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                  </svg>
                </button>
              </div>
            </footer>
          </main>
        </div>
      </div>
    </div>
  );
}