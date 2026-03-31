'use client';

import { useEffect, useSyncExternalStore } from 'react';

// External store for shared authorization state
let authorizedSessionDetected = false;
let pendingAuthorizationRequest: Promise<boolean> | null = null;
const listeners = new Set<() => void>();

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): boolean {
  return authorizedSessionDetected;
}

function setAuthorized(value: boolean): void {
  if (authorizedSessionDetected !== value) {
    authorizedSessionDetected = value;
    for (const listener of listeners) listener();
  }
}

export function markBlogAdminAuthorized(): void {
  pendingAuthorizationRequest = null;
  setAuthorized(true);
}

export function clearBlogAdminAuthorization(): void {
  pendingAuthorizationRequest = null;
  setAuthorized(false);
}

async function fetchAuthorizationStatus(): Promise<boolean> {
  const response = await fetch('/api/blog/generate/auth', {
    cache: 'no-store',
    method: 'GET'
  });

  if (!response.ok) {
    return false;
  }

  const data: unknown = await response.json();
  const authorized =
    typeof data === 'object' &&
    data !== null &&
    'authorized' in data &&
    typeof data.authorized === 'boolean'
      ? data.authorized
      : false;

  setAuthorized(authorized);

  if (!authorized) {
    pendingAuthorizationRequest = null;
  }

  return authorized;
}

export function useBlogAdminAuthorization(initialAuthorized = false): boolean {
  const storeAuthorized = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  useEffect(() => {
    if (initialAuthorized || authorizedSessionDetected) {
      setAuthorized(true);
      return;
    }

    pendingAuthorizationRequest ??= fetchAuthorizationStatus().catch(() => {
      pendingAuthorizationRequest = null;
      return false;
    });

    let isCancelled = false;

    void pendingAuthorizationRequest.then((authorized) => {
      if (!isCancelled && authorized) {
        setAuthorized(true);
      }
    });

    return () => {
      isCancelled = true;
    };
  }, [initialAuthorized]);

  return storeAuthorized || initialAuthorized;
}
