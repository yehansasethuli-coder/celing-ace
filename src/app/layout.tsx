
"use client";

import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import Header from "@/components/header";
import { cn } from '@/lib/utils';
import { ThemeProvider } from '@/components/theme-provider';
import { LanguageProvider } from '@/context/language-context';
import { FirebaseClientProvider, useAuth, useUser, initiateAnonymousSignIn } from '@/firebase';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

const AuthHandler = ({ children }: { children: React.ReactNode }) => {
  const auth = useAuth();
  const { user, isUserLoading } = useUser();

  useEffect(() => {
    if (!isUserLoading && !user && auth) {
      // For this app, we want everyone to have a temporary identity to save projects.
      // If they are not logged in, we sign them in anonymously.
      // When they create a real account, Firebase will link their anonymous data.
      initiateAnonymousSignIn(auth).catch(console.error);
    }
  }, [user, isUserLoading, auth]);

  // We show a loader while checking for an existing user session.
  // The anonymous sign-in is quick and happens in the background.
  if (isUserLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin" />
      </div>
    );
  }

  // Once the initial user check is done (user can be null, anonymous, or authenticated),
  // we render the rest of the app.
  return <>{children}</>;
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Noto+Sans:wght@400;700&family=Noto+Sans+Sinhala:wght@400;700&display=swap" rel="stylesheet" />
        <link rel="manifest" href="/manifest.webmanifest" />
        <meta name="theme-color" content="#ffffff" />
      </head>
      <body className={cn("min-h-screen bg-background font-body antialiased")}>
        <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
        >
          <LanguageProvider>
            <FirebaseClientProvider>
              <AuthHandler>
                <div className="relative flex min-h-screen flex-col">
                  <Header />
                  <main className="flex-1">{children}</main>
                </div>
                <Toaster />
              </AuthHandler>
            </FirebaseClientProvider>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
