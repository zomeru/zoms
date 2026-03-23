'use client';

import { useEffect, useState } from 'react';

let authorizedSessionDetected = false;
let pendingAuthorizationRequest: Promise<boolean> | null = null;

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

  if (authorized) {
    authorizedSessionDetected = true;
  } else {
    pendingAuthorizationRequest = null;
  }

  return authorized;
}

export function useBlogAdminAuthorization(initialAuthorized = false): boolean {
  const [isAuthorized, setIsAuthorized] = useState(initialAuthorized || authorizedSessionDetected);

  useEffect(() => {
    if (initialAuthorized || authorizedSessionDetected) {
      authorizedSessionDetected = true;
      setIsAuthorized(true);
      return;
    }

    pendingAuthorizationRequest ??= fetchAuthorizationStatus().catch(() => {
      pendingAuthorizationRequest = null;
      return false;
    });

    let isCancelled = false;

    void pendingAuthorizationRequest.then((authorized) => {
      if (!isCancelled) {
        setIsAuthorized(authorized);
      }
    });

    return () => {
      isCancelled = true;
    };
  }, [initialAuthorized]);

  return isAuthorized;
}
