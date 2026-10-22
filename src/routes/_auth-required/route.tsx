import {
  Navigate,
  Outlet,
  createFileRoute,
  useRouter,
} from '@tanstack/react-router';
import { useEffect, useMemo } from 'react';

import { useAuth, useToken } from '@/features/auth';
import { reportAuthorizeError } from '@/features/oauth';

const cleanupAllFunnel = (href: string): string => {
  const url = new URL(href, window.location.origin);
  const params = url.searchParams;

  for (const key of params.keys()) {
    if (key.endsWith('-step')) {
      params.delete(key);
    }
  }

  url.search = params.toString();
  return url.pathname + url.search + url.hash;
};

// an authorize request with prompt=none must come back to the client instead of showing the login page
const silentAuthorizeOf = (href: string) => {
  const url = new URL(href, window.location.origin);
  const clientId = url.searchParams.get('client_id');
  const redirectUri = url.searchParams.get('redirect_uri');

  if (
    url.pathname !== '/authorize' ||
    url.searchParams.get('prompt') !== 'none'
  )
    return null;
  if (!clientId || !redirectUri) return null;

  return {
    clientId,
    redirectUri,
    state: url.searchParams.get('state') ?? undefined,
  };
};

const AuthRequiredLayout = () => {
  const { user } = useAuth();
  const { token } = useToken();
  const router = useRouter();

  const searchParams = useMemo(() => {
    const shouldRedirect = !token;
    return shouldRedirect
      ? { redirect: cleanupAllFunnel(router.history.location.href) }
      : {};
  }, [token, router.history.location.href]);

  const silentAuthorize = useMemo(
    () => silentAuthorizeOf(router.history.location.href),
    [router.history.location.href],
  );

  useEffect(() => {
    if (user === null && silentAuthorize)
      reportAuthorizeError({ ...silentAuthorize, error: 'login_required' });
  }, [user, silentAuthorize]);

  if (user === undefined) return null;
  if (user === null) {
    if (silentAuthorize) return null;
    return (
      <Navigate
        to="/auth/login"
        search={searchParams}
        replace
        viewTransition={{ types: ['reload'] }}
      />
    );
  }

  return <Outlet />;
};

export const Route = createFileRoute('/_auth-required')({
  component: AuthRequiredLayout,
});
