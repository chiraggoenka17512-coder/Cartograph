import {
  ClerkProvider,
  SignInButton,
  SignUpButton,
  Show,
  UserButton,
  OrganizationSwitcher,
} from "@clerk/nextjs";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeToggle } from "@/components/theme-toggle";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Cartograph",
  description: "Repository dependency map",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('cartograph-theme') || 'system';
                  var isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
                  var root = document.documentElement;
                  root.setAttribute('data-theme', theme);
                  if (isDark) {
                    root.classList.add('dark');
                    root.classList.remove('light');
                  } else {
                    root.classList.remove('dark');
                    root.classList.add('light');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col font-sans">
        <ClerkProvider>
          <header className="border-b border-[var(--panel-border)] bg-[var(--panel)] px-5 py-2 flex items-center justify-between transition-colors">
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="font-mono text-xs font-semibold tracking-wider uppercase text-[var(--color-foreground)] hover:opacity-80 transition-opacity"
              >
                cartograph
              </Link>
              <Show when="signed-in">
                <div className="flex items-center text-xs font-mono">
                  <OrganizationSwitcher
                    hidePersonal={false}
                    afterCreateOrganizationUrl="/"
                    afterSelectOrganizationUrl="/"
                    afterLeaveOrganizationUrl="/"
                    appearance={{
                      elements: {
                        rootBox: "flex items-center",
                        organizationSwitcherTrigger:
                          "px-2 py-1 rounded text-xs font-mono border border-[var(--panel-border)] hover:bg-[var(--muted)]/10 text-[var(--color-foreground)] transition-colors",
                      },
                    }}
                  />
                </div>
              </Show>
            </div>

            <div className="flex items-center gap-3 text-xs font-mono">
              <ThemeToggle />
              <Show when="signed-out">
                <SignInButton mode="modal">
                  <button className="px-2.5 py-1 rounded border border-[var(--panel-border)] hover:bg-[var(--muted)]/10 text-[var(--color-foreground)] transition-colors">
                    Sign In
                  </button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <button className="px-2.5 py-1 rounded bg-[var(--color-foreground)] text-[var(--color-background)] font-medium hover:opacity-90 transition-opacity">
                    Sign Up
                  </button>
                </SignUpButton>
              </Show>
              <Show when="signed-in">
                <UserButton
                  appearance={{
                    elements: {
                      userButtonAvatarBox: "w-6 h-6",
                    },
                  }}
                />
              </Show>
            </div>
          </header>

          <main className="flex-1 flex flex-col">{children}</main>
        </ClerkProvider>
      </body>
    </html>
  );
}