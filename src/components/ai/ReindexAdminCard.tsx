"use client";

import type React from "react";
import { useState } from "react";

import { TerminalCard } from "@/components/ui/TerminalCard";
import {
  CLIENT_ERROR_MESSAGES,
  getClientErrorMessage,
  getResponseErrorMessage
} from "@/lib/errorMessages";

interface ReindexAdminCardProps {
  initialAuthorized: boolean;
}

interface ReindexResult {
  processed: number;
  runId: string;
  skipped: number;
  updated: number;
}

// This component intentionally keeps the terminal auth and run state machine inline.
const ReindexAdminCard: React.FC<ReindexAdminCardProps> = ({ initialAuthorized }) => {
  const [secret, setSecret] = useState("");
  const [documentId, setDocumentId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isAuthorized, setIsAuthorized] = useState(initialAuthorized);
  const [isRunning, setIsRunning] = useState(false);
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [lastResult, setLastResult] = useState<ReindexResult | null>(null);
  const [statusMessage, setStatusMessage] = useState(
    initialAuthorized
      ? "Session restored from secure local cookie. Reindex commands unlocked."
      : "Enter the AI reindex secret, then press Enter to unlock the run commands."
  );

  const handleUnlock = async (event: React.SyntheticEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setError(null);

    if (!secret.trim()) {
      setError(CLIENT_ERROR_MESSAGES.TOKEN_REQUIRED);
      return;
    }

    setIsUnlocking(true);

    try {
      const response = await fetch("/api/ai/reindex/auth", {
        body: JSON.stringify({ secret }),
        headers: {
          "Content-Type": "application/json"
        },
        method: "POST"
      });

      if (!response.ok) {
        throw new Error(await getResponseErrorMessage(response, "Failed to unlock AI reindex"));
      }

      setIsAuthorized(true);
      setSecret("");
      setStatusMessage("Reindex session authorized. Commands unlocked for this browser.");
    } catch (err) {
      const errorMessage = getClientErrorMessage(err);
      setError(errorMessage);
      setStatusMessage("Authorization failed. The reindex panel remains locked.");
    } finally {
      setIsUnlocking(false);
    }
  };

  const handleForget = async (): Promise<void> => {
    setError(null);

    try {
      await fetch("/api/ai/reindex/auth", {
        method: "DELETE"
      });
    } finally {
      setDocumentId("");
      setIsAuthorized(false);
      setLastResult(null);
      setSecret("");
      setStatusMessage("Reindex session cleared. Enter the secret again to unlock commands.");
    }
  };

  const handleRun = async (mode: "full" | "targeted"): Promise<void> => {
    const normalizedDocumentId = documentId.trim();

    if (mode === "targeted" && normalizedDocumentId.length === 0) {
      setError("Enter a document id or slug before running a targeted reindex.");
      return;
    }

    setError(null);
    setIsRunning(true);

    try {
      const response = await fetch("/api/ai/reindex", {
        body:
          mode === "targeted"
            ? JSON.stringify({ documentId: normalizedDocumentId })
            : JSON.stringify({}),
        headers: {
          "Content-Type": "application/json"
        },
        method: "POST"
      });

      if (!response.ok) {
        throw new Error(await getResponseErrorMessage(response, "Failed to run AI reindex"));
      }

      const result = (await response.json()) as ReindexResult;
      setLastResult(result);
      setStatusMessage(
        mode === "targeted"
          ? `Targeted reindex completed for ${normalizedDocumentId}.`
          : "Full reindex completed."
      );
    } catch (err) {
      const errorMessage = getClientErrorMessage(err);
      setError(errorMessage);
      setStatusMessage("Reindex failed. Review the output and try again.");
    } finally {
      setIsRunning(false);
    }
  };

  const handleUnlockSubmit = (event: React.SyntheticEvent<HTMLFormElement>): void => {
    handleUnlock(event).catch(() => {
      // Errors are handled within handleUnlock.
    });
  };

  return (
    <TerminalCard
      title="ai-reindex.sh"
      className="shadow-[0_24px_80px_rgba(0,0,0,0.28)]"
      bodyClassName="p-5 font-mono text-sm"
    >
      <div className="mb-5 border-code-border border-b pb-4">
        <div className="flex items-center gap-3 text-sm text-text-primary">
          <span className="text-terminal-green">$</span>
          <span>ai_reindex --scope manual --mode targeted-or-full</span>
        </div>
        <p className="mt-3 text-text-muted text-xs leading-relaxed">
          Authenticate independently from blog generation to run full or targeted reindex jobs.
        </p>
      </div>

      <form onSubmit={handleUnlockSubmit}>
        <label htmlFor="ai-reindex-secret" className="sr-only">
          AI reindex secret
        </label>
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="flex min-w-0 flex-1 items-center gap-3 rounded-md border border-code-border bg-surface-elevated/45 px-4 py-3">
            <span className="text-terminal-green">&gt;</span>
            <input
              id="ai-reindex-secret"
              type="password"
              value={secret}
              onChange={(event) => {
                setSecret(event.target.value);
              }}
              disabled={isAuthorized || isRunning || isUnlocking}
              placeholder={isAuthorized ? "session unlocked" : "enter AI reindex secret"}
              autoComplete="off"
              className="min-w-0 flex-1 bg-transparent text-text-primary outline-none placeholder:text-text-muted disabled:cursor-not-allowed"
            />
          </div>

          {!isAuthorized && (
            <button
              type="submit"
              disabled={isRunning || isUnlocking}
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
          <>
            <div className="mt-4 rounded-md border border-code-border bg-surface-elevated/45 px-4 py-3">
              <label
                htmlFor="ai-reindex-document-id"
                className="mb-2 block text-text-muted text-xs"
              >
                Document id or slug
              </label>
              <input
                id="ai-reindex-document-id"
                type="text"
                value={documentId}
                onChange={(event) => {
                  setDocumentId(event.target.value);
                }}
                disabled={isRunning || isUnlocking}
                placeholder="blog:post-slug or post-slug"
                autoComplete="off"
                className="w-full bg-transparent text-text-primary outline-none placeholder:text-text-muted disabled:cursor-not-allowed"
              />
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  void handleRun("full");
                }}
                disabled={isRunning || isUnlocking}
                className="rounded-md border border-terminal-green/40 bg-terminal-green/10 px-4 py-2 text-terminal-green text-xs uppercase tracking-[0.18em] transition-colors hover:cursor-pointer hover:bg-terminal-green/15 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isRunning ? "Running..." : "Run Full"}
              </button>
              <button
                type="button"
                onClick={() => {
                  void handleRun("targeted");
                }}
                disabled={isRunning || isUnlocking}
                className="rounded-md border border-terminal-blue/40 bg-terminal-blue/10 px-4 py-2 text-terminal-blue text-xs uppercase tracking-[0.18em] transition-colors hover:cursor-pointer hover:bg-terminal-blue/15 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isRunning ? "Running..." : "Run Targeted"}
              </button>
              <button
                type="button"
                onClick={() => {
                  void handleForget();
                }}
                disabled={isRunning || isUnlocking}
                className="rounded-md border border-code-border px-4 py-2 text-text-muted text-xs uppercase tracking-[0.18em] transition-colors hover:cursor-pointer hover:border-border-hover hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-50"
              >
                Forget
              </button>
            </div>
          </>
        )}

        {lastResult && (
          <div className="mt-4 rounded-md border border-code-border bg-surface-elevated/45 px-4 py-3 text-text-muted text-xs">
            <p>run-id {lastResult.runId}</p>
            <p>
              processed {lastResult.processed} | updated {lastResult.updated} | skipped{" "}
              {lastResult.skipped}
            </p>
          </div>
        )}
      </div>
    </TerminalCard>
  );
};

export { ReindexAdminCard };
