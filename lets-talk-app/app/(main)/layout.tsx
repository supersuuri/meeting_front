// app/(main)/layout.tsx
'use client';

import StreamProvider from "@/providers/StreamProvider";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useEffect } from "react";
import Loading from "@/components/Loading";

const MainLayout = ({
  children
}: {
  children: React.ReactNode
}) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) return <Loading />;

  if (!isAuthenticated) {
    return (
      <main className="flex flex-col items-center p-5 gap-10 animate-fade-in">
        <section className="flex flex-col items-center">
          <Image
            src='/assets/logo.svg'
            width={100}
            height={100}
            alt="Logo"
          />
          <h1 className="text-lg font-extrabold text-sky-1 lg:text-2xl">
            Connect, Communicate, Collaborate in Real-Time
          </h1>
        </section>
        <p>Redirecting to login...</p>
      </main>
    );
  }

  return (
    <main className="animate-fade-in">
      <StreamProvider>
        {children}
      </StreamProvider>
    </main>
  );
};

export default MainLayout;