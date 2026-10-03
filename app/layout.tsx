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
  title: "Cartograph — Deterministic Codebase Mapping",
  description: "Parses public GitHub repositories into complete AST-resolved dependency maps.",
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
        <ClerkProvider
          appearance={{
            variables: {
              colorPrimary: "#3b82f6",
              borderRadius: "0.375rem",
              fontFamily: "var(--font-geist-sans)",
            },
            elements: {
              userButtonPopoverCard: "!bg-[var(--panel)] !border !border-[var(--panel-border)] !text-[var(--color-foreground)] shadow-xl",
              userButtonPopoverMain: "!bg-[var(--panel)] !text-[var(--color-foreground)]",
              userButtonPopoverFooter: "!bg-[var(--panel-elevated)] !border-t !border-[var(--panel-border)]",
              userButtonPopoverActionButton: "!text-[var(--color-foreground)] hover:!bg-[var(--panel-elevated)]",
              userButtonPopoverActionButtonText: "!text-[var(--color-foreground)]",
              userButtonPopoverActionButtonIcon: "!text-[var(--color-muted)]",
              userPreviewMainIdentifier: "!text-[var(--color-foreground)]",
              userPreviewSecondaryIdentifier: "!text-[var(--color-muted)]",
              organizationSwitcherPopoverCard: "!bg-[var(--panel)] !border !border-[var(--panel-border)] !text-[var(--color-foreground)] shadow-xl",
              organizationSwitcherPopoverMain: "!bg-[var(--panel)] !text-[var(--color-foreground)]",
              organizationSwitcherPopoverActions: "!bg-[var(--panel)]",
              organizationSwitcherPopoverActionButton: "!text-[var(--color-foreground)] hover:!bg-[var(--panel-elevated)]",
              organizationSwitcherTrigger:
                "px-2.5 py-1 rounded text-xs font-sans border border-[var(--panel-border)] bg-[var(--panel)] hover:bg-[var(--panel-elevated)] text-[var(--color-foreground)] transition-colors cursor-pointer",
              organizationPreviewTextContainer: "font-sans",
              userButtonTrigger: "cursor-pointer rounded-full",
            },
          }}
        >
          <header className="border-b border-[var(--panel-border)] bg-[var(--panel)] px-4 sm:px-6 py-2.5 flex items-center justify-between transition-colors sticky top-0 z-40">
            <div className="flex items-center gap-4 sm:gap-6">
              <Link
                href="/"
                className="flex items-center gap-2 group text-[var(--color-foreground)] hover:opacity-85 transition-opacity"
              >
                <span className="w-2.5 h-2.5 rounded-[2px] bg-[var(--color-foreground)] inline-block transition-transform group-hover:scale-105" />
                <span className="font-mono text-xs font-bold tracking-wider uppercase">
                  cartograph
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 border border-[var(--panel-border)] text-[var(--color-muted)] rounded">
                  ast
                </span>
              </Link>
              <Show when="signed-in">
                <div className="flex items-center text-xs">
                  <OrganizationSwitcher
                    hidePersonal={false}
                    afterCreateOrganizationUrl="/"
                    afterSelectOrganizationUrl="/"
                    afterLeaveOrganizationUrl="/"
                  />
                </div>
              </Show>
            </div>

            <div className="flex items-center gap-3 text-xs">
              <ThemeToggle />
              <Show when="signed-out">
                <SignInButton mode="modal">
                  <button className="px-2.5 py-1 rounded border border-[var(--panel-border)] hover:bg-[var(--panel-elevated)] text-[var(--color-foreground)] font-sans transition-colors cursor-pointer text-xs">
                    Sign in
                  </button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <button className="px-2.5 py-1 rounded bg-[var(--color-foreground)] text-[var(--color-background)] font-sans font-medium hover:opacity-90 transition-opacity cursor-pointer text-xs">
                    Sign up
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