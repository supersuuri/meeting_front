"use client";

import { SessionProvider } from "next-auth/react";
import { ReactNode } from "react";

interface Props {
  children: ReactNode;
}

export default function SessionClientProvider({ children }: Props) {
  return <SessionProvider>{children}</SessionProvider>;
}
