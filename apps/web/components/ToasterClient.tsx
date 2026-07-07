"use client";

import { useEffect, useState } from "react";
import { Toaster } from "react-hot-toast";

// react-hot-toast's container div resolves its `id` differently on the
// server (null) vs the client (`_rht_toaster`), causing a hydration
// mismatch. It has no reason to exist during SSR — no toast can be queued
// before the user interacts — so render it client-only, after mount.
export default function ToasterClient() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return null;
  return <Toaster />;
}
