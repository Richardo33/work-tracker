"use client";

import { useEffect, useMemo, useState } from "react";

type Props = {
  value: string | Date | null | undefined;
  locale?: string;
  showTime?: boolean;
  placeholder?: string;
  className?: string;
};

function safeDate(value: Props["value"]) {
  if (!value) return null;
  const d = typeof value === "string" ? new Date(value) : value;
  return isNaN(d.getTime()) ? null : d;
}

export default function ClientDateTime({
  value,
  locale = "id-ID",
  showTime = true,
  placeholder = "…",
  className,
}: Props) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const d = useMemo(() => safeDate(value), [value]);

  if (!mounted) return <span className={className}>{placeholder}</span>;
  if (!d) return <span className={className}>-</span>;

  const datePart = new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "short",
  }).format(d);

  if (!showTime) return <span className={className}>{datePart}</span>;

  const timePart = new Intl.DateTimeFormat(locale, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(d);

  return <span className={className}>{`${datePart} · ${timePart}`}</span>;
}
