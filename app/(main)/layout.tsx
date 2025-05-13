// app/(main)/layout.tsx
"use client";

import StreamProvider from "@/providers/StreamProvider";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useEffect } from "react";
import Loading from "@/components/Loading";

const MainLayout = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) return <Loading />;

  return (
    <main className="animate-fade-in">
      <StreamProvider>{children}</StreamProvider>
    </main>
  );
};

export default MainLayout;
