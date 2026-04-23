"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchCurrentProfile } from "@/src/lib/currentProfile";
import { isOnboardingDone } from "@/src/lib/storage/onboarding";
import { getAccessToken } from "@/src/lib/tokenStorage";

export default function PostAuthPage() {
  const router = useRouter();
  const [text, setText] = useState("Загрузка...");

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      router.replace("/login");
      return;
    }

    (async () => {
      const profile = await fetchCurrentProfile();
      if (!profile) {
        router.replace("/login");
        return;
      }

      setText("Проверяем онбординг...");

      const done = isOnboardingDone(profile.userId);
      router.replace(done ? "/profile" : "/onboarding");
    })();
  }, [router]);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#00121c",
        color: "#fff",
        padding: 20,
      }}
    >
      <div style={{ opacity: 0.9 }}>{text}</div>
    </div>
  );
}