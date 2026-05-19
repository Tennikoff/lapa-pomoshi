"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getAccessToken } from "@/src/lib/tokenStorage";

export function AuthAwareLink({
  authedHref,
  guestHref,
  className,
  children,
}: {
  authedHref: string;
  guestHref: string;
  className?: string;
  children: React.ReactNode;
}) {
  const [isAuthed, setIsAuthed] = useState<boolean>(() => Boolean(getAccessToken()));

  useEffect(() => {
    const sync = () => setIsAuthed(Boolean(getAccessToken()));
    // обновится после логина/логаута при возврате на вкладку
    window.addEventListener("focus", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("focus", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return (
    <Link href={isAuthed ? authedHref : guestHref} className={className}>
      {children}
    </Link>
  );
}