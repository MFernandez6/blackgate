"use client";

import { useEffect, useRef } from "react";
import { signOut } from "next-auth/react";
import {
  STAFF_CLOSED_KEY,
  STAFF_IDLE_MS,
  STAFF_LOCK_KEY,
  STAFF_TAB_KEY,
  STAFF_TABS_KEY,
} from "@/lib/session-security";

const ACTIVITY_EVENTS: Array<keyof WindowEventMap> = [
  "mousemove",
  "mousedown",
  "keydown",
  "touchstart",
  "scroll",
  "click",
  "wheel",
];

function storageGet(store: Storage, key: string) {
  try {
    return store.getItem(key);
  } catch {
    return null;
  }
}

function storageSet(store: Storage, key: string, value: string) {
  try {
    store.setItem(key, value);
  } catch {
    // private mode
  }
}

function storageRemove(store: Storage, key: string) {
  try {
    store.removeItem(key);
  } catch {
    // private mode
  }
}

function tabId() {
  const existing = storageGet(sessionStorage, STAFF_TAB_KEY);
  if (existing) return existing;
  const id = crypto.randomUUID();
  storageSet(sessionStorage, STAFF_TAB_KEY, id);
  return id;
}

function readTabs(): Record<string, number> {
  try {
    const raw = storageGet(localStorage, STAFF_TABS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, number>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeTabs(tabs: Record<string, number>) {
  storageSet(localStorage, STAFF_TABS_KEY, JSON.stringify(tabs));
}

function registerTab() {
  const tabs = readTabs();
  const now = Date.now();
  const id = tabId();
  for (const [other, seen] of Object.entries(tabs)) {
    if (other !== id && now - seen > 30_000) delete tabs[other];
  }
  tabs[id] = now;
  writeTabs(tabs);
}

function unregisterTab() {
  const tabs = readTabs();
  delete tabs[tabId()];
  writeTabs(tabs);
  return Object.keys(tabs).length;
}

/**
 * Staff session watchdog: idle logout, leftover-window logout, and
 * no resume from a cached page after the last BLACKGATE window closes.
 */
export function IdleSessionGuard() {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastActivityRef = useRef(Date.now());
  const signingOutRef = useRef(false);

  useEffect(() => {
    const leave = (reason: "idle" | "closed" | "expired") => {
      if (signingOutRef.current) return;
      signingOutRef.current = true;
      storageRemove(localStorage, STAFF_CLOSED_KEY);
      void signOut({ callbackUrl: `/login?reason=${reason}` });
    };

    const sameTabLock = storageGet(sessionStorage, STAFF_LOCK_KEY);
    const closedMarker = storageGet(localStorage, STAFF_CLOSED_KEY);
    if (sameTabLock) {
      storageRemove(localStorage, STAFF_CLOSED_KEY);
    } else if (closedMarker) {
      storageSet(sessionStorage, STAFF_LOCK_KEY, "1");
      leave("closed");
      return;
    }
    storageSet(sessionStorage, STAFF_LOCK_KEY, "1");

    const clear = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };

    const remaining = () =>
      Math.max(0, STAFF_IDLE_MS - (Date.now() - lastActivityRef.current));

    const arm = () => {
      lastActivityRef.current = Date.now();
      clear();
      timerRef.current = setTimeout(() => leave("idle"), STAFF_IDLE_MS);
    };

    const onActivity = () => arm();

    const onVisibility = () => {
      if (document.visibilityState !== "visible") return;
      if (remaining() <= 0) {
        leave("idle");
        return;
      }
      clear();
      timerRef.current = setTimeout(() => leave("idle"), remaining());
    };

    const onPageShow = (event: PageTransitionEvent) => {
      if (sameTabLock || storageGet(sessionStorage, STAFF_LOCK_KEY)) {
        storageRemove(localStorage, STAFF_CLOSED_KEY);
      }
      if (event.persisted && remaining() <= 0) {
        leave("expired");
      }
    };

    const onPageHide = () => {
      const remainingTabs = unregisterTab();
      if (remainingTabs === 0) {
        storageSet(localStorage, STAFF_CLOSED_KEY, String(Date.now()));
      }
    };

    arm();
    registerTab();
    const heartbeat = window.setInterval(registerTab, 10_000);

    for (const event of ACTIVITY_EVENTS) {
      window.addEventListener(event, onActivity, { passive: true });
    }
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pageshow", onPageShow);
    window.addEventListener("pagehide", onPageHide);

    return () => {
      clear();
      window.clearInterval(heartbeat);
      for (const event of ACTIVITY_EVENTS) {
        window.removeEventListener(event, onActivity);
      }
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pageshow", onPageShow);
      window.removeEventListener("pagehide", onPageHide);
    };
  }, []);

  return null;
}
