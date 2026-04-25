"use client";

import { useRouter } from "next/navigation";
import type React from "react";
import { useState } from "react";
import toast, { Toaster } from "react-hot-toast";

import {
  clearBlogAdminAuthorization,
  markBlogAdminAuthorized
} from "@/components/blog/useBlogAdminAuthorization";
import { TerminalCard } from "@/components/ui/TerminalCard";
import {
  CLIENT_ERROR_MESSAGES,
  getClientErrorMessage,
  getResponseErrorMessage
} from "@/lib/errorMessages";

interface BlogGenerateButtonProps {
  initialAuthorized: boolean;
}

// This component intentionally keeps the terminal auth state machine inline.
const BlogGenerateButton: React.FC<BlogGenerateButtonProps> = ({ initialAuthorized }) => {
  const router = useRouter();
  const [secret, setSecret] = useState("");
  const [isAuthorized, setIsAuthorized] = useState(initialAuthorized);
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [statusMessage, setStatusMessage] = useState(
    initialAuthorized
      ? "Session restored from secure local cookie. Generator unlocked."
      : "Enter the blog generation secret, then press Enter to unlock the run command."
  );
  const [error, setError] = useState<string | null>(null);

  const handleUnlock = async (event: React.SyntheticEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setError(null);

    if (!secret.trim()) {
      setError(CLIENT_ERROR_MESSAGES.TOKEN_REQUIRED);
      return;
    }

    setIsUnlocking(true);

    try {
      const response = await fetch("/api/blog/generate/auth", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ secret })
      });

      if (!response.ok) {
        throw new Error(await getResponseErrorMessage(response, "Failed to unlock blog generator"));
      }

      setIsAuthorized(true);
      markBlogAdminAuthorized();
      setSecret("");
      setStatusMessage("Session authorized. Run command unlocked and persisted for this browser.");
    } catch (err) {
      const errorMessage = getClientErrorMessage(err);
      setError(errorMessage);
      setStatusMessage("Authorization failed. The session remains locked.");
    } finally {
      setIsUnlocking(false);
    }
  };

  const handleForget = async (): Promise<void> => {
    setError(null);

    try {
      await fetch("/api/blog/generate/auth", {
        method: "DELETE"
      });
    } finally {
      clearBlogAdminAuthorization();
      setIsAuthorized(false);
      setSecret("");
      setStatusMessage("Session cleared. Enter the secret again to unlock the run command.");
    }
  };

  const handleGenerateBlog = async (token: string): Promise<void> => {
    const toastId = toast.loading("Generating blog post with AI...");

    try {
      const response = await fetch("/api/blog/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          triggerMode: "manual"
        })
      });

      if (!response.ok) {
        throw new Error(await getResponseErrorMessage(response, "Failed to generate blog post"));
      }

      toast.success("Blog post generated successfully!", { id: toastId });
      router.refresh();
    } catch (err) {
      const errorMessage = getClientErrorMessage(err);
      toast.error(errorMessage, { id: toastId });
      throw err;
    }
  };

  const handleRun = async (): Promise<void> => {
    setError(null);
    setIsGenerating(true);

    try {
      await handleGenerateBlog("");
      setStatusMessage("Generation job completed. Blog list refreshed.");
    } catch (err) {
      const errorMessage = getClientErrorMessage(err);
      setError(errorMessage);
      setStatusMessage("Generation job failed. Review the output and try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUnlockSubmit = (event: React.SyntheticEvent<HTMLFormElement>): void => {
    handleUnlock(event).catch(() => {
      // Errors are handled within handleUnlock.
    });
  };

  return (
    <>
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 4000,
          style: {
            background: "var(--color-surface-elevated)",
            color: "var(--color-text-primary)",
            border: "1px solid var(--color-border)"
          },
          success: {
            iconTheme: {
              primary: "var(--color-primary)",
              secondary: "var(--color-text-primary)"
            }
          },
          error: {
            iconTheme: {
              primary: "var(--color-terminal-red)",
              secondary: "var(--color-text-primary)"
            }
          }
        }}
      />

      <div className="mb-8 flex justify-center">
        <TerminalCard
          title="blog-generator.sh"
          className="w-full shadow-[0_24px_80px_rgba(0,0,0,0.28)]"
          bodyClassName="p-5 font-mono text-sm"
        >
          <div className="mb-5 border-code-border border-b pb-4">
            <div className="flex items-center gap-3 text-sm text-text-primary">
              <span className="text-terminal-green">$</span>
              <span>generate_blog --provider ai --publish draft</span>
            </div>
            <p className="mt-3 text-text-muted text-xs leading-relaxed">
              Authenticate once in this terminal to unlock blog generation on this browser.
            </p>
          </div>

          <form onSubmit={handleUnlockSubmit}>
            <label htmlFor="blog-generator-secret" className="sr-only">
              Blog generation secret
            </label>
            <div className="flex flex-col gap-3 md:flex-row md:items-center">
              <div className="flex min-w-0 flex-1 items-center gap-3 rounded-md border border-code-border bg-surface-elevated/45 px-4 py-3">
                <span className="text-terminal-green">&gt;</span>
                <input
                  id="blog-generator-secret"
                  type="password"
                  value={secret}
                  onChange={(event) => {
                    setSecret(event.target.value);
                  }}
                  disabled={isUnlocking || isGenerating || isAuthorized}
                  placeholder={isAuthorized ? "session unlocked" : "enter blog generation secret"}
                  autoComplete="off"
                  className="min-w-0 flex-1 bg-transparent text-text-primary outline-none placeholder:text-text-muted disabled:cursor-not-allowed"
                />
              </div>

              {!isAuthorized && (
                <button
                  type="submit"
                  disabled={isUnlocking || isGenerating}
                  className="rounded-md border border-code-border px-4 py-3 text-text-muted text-xs uppercase tracking-[0.18em] transition-colors hover:cursor-pointer hover:border-terminal-green/50 hover:text-terminal-green disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isUnlocking ? "Authorizing..." : "Enter"}
                </button>
              )}
            </div>
          </form>

          {error && (
            <div className="mt-4 rounded-md border border-terminal-red/40 bg-terminal-red/10 px-4 py-3">
              <p className="text-terminal-red text-xs leading-relaxed">{error}</p>
            </div>
          )}

          <div className="mt-4 border-code-border border-t pt-4">
            <div className="flex items-start gap-3 text-text-muted text-xs leading-relaxed">
              <span className="pt-0.5 text-terminal-blue">{"//"}</span>
              <p>{statusMessage}</p>
            </div>

            {isAuthorized && (
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    void handleRun();
                  }}
                  disabled={isGenerating || isUnlocking}
                  className="rounded-md border border-terminal-green/40 bg-terminal-green/10 px-4 py-2 text-terminal-green text-xs uppercase tracking-[0.18em] transition-colors hover:cursor-pointer hover:bg-terminal-green/15 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isGenerating ? "Running..." : "Run"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    void handleForget();
                  }}
                  disabled={isGenerating || isUnlocking}
                  className="rounded-md border border-code-border px-4 py-2 text-text-muted text-xs uppercase tracking-[0.18em] transition-colors hover:cursor-pointer hover:border-border-hover hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Forget
                </button>
              </div>
            )}
          </div>
        </TerminalCard>
      </div>
    </>
  );
};

export { BlogGenerateButton };
