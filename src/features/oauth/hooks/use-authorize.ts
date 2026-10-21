import { useLoaderData, useSearch } from '@tanstack/react-router';
import { useCallback, useEffect, useMemo } from 'react';

import { checkRequiredScopeNotVerified } from '../utils';

import { useAuthorizeForm } from './use-authorize-form';
import { useRecentLogin } from './use-recent-login';

import { type components } from '@/@types/api-schema';
import { useAuth } from '@/features/auth';
import { type ClientScopeType } from '@/routes/_auth-required/authorize';

export const useAuthorize = ({
  client,
  scopes,
}: {
  client: components['schemas']['ClientPublicResDto'];
  scopes: string[];
}) => {
  const { recentLogin } = useRecentLogin();
  const { user, signOut } = useAuth();
  const { clientId, clientScopes, tokenScopes, redirectUri, state } =
    useLoaderData({
      from: '/_auth-required/authorize',
    });
  const { prompt, ...search } = useSearch({
    from: '/_auth-required/authorize',
  });

  const requiredScopes = useMemo(
    () => clientScopes.filter((v) => client.scopes.includes(v)),
    [client.scopes, clientScopes],
  );

  const isRequiredScopeNotVerified = useMemo(
    () => checkRequiredScopeNotVerified(user, requiredScopes),
    [user, requiredScopes],
  );

  // the backend checks redirect_uri against the client's registered URLs before redirecting,
  // which this page cannot do because the public client info leaves the URLs out
  const redirect = useCallback(
    (params: { error: string; error_description?: string }) => {
      const query = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        ...params,
      });
      if (state) query.set('state', state);

      window.location.href = `${import.meta.env.VITE_API_URL}/oauth/authorize/error?${query.toString()}`;
    },
    [clientId, redirectUri, state],
  );

  const onCancel = useCallback(() => {
    redirect({
      error: 'access_denied',
      error_description: 'user_cancelled',
    });
  }, [redirect]);

  const authorize = useCallback(
    (agreed: ClientScopeType[]) => {
      if (isRequiredScopeNotVerified) {
        return redirect({
          error: 'access_denied',
          error_description: 'verification_required',
        });
      }

      const query = new URLSearchParams(search);
      query.set('scope', [...tokenScopes, ...agreed].join(' '));
      window.location.href = `${import.meta.env.VITE_API_URL}/oauth/authorize?${query.toString()}`;
    },
    [isRequiredScopeNotVerified, redirect, search, tokenScopes],
  );

  useEffect(() => {
    const consented = requiredScopes.every((s) => scopes.includes(s));

    const consentedScopes = (scopes as ClientScopeType[]) ?? [];

    if (prompt === 'none') {
      if (!user)
        // never happens, but just in case
        return redirect({
          error: 'access_denied',
          error_description: 'login_required',
        });
      if (!consented)
        return redirect({
          error: 'access_denied',
          error_description: 'consent_required',
        });
      if (tokenScopes.includes('offline_access'))
        return redirect({
          error: 'access_denied',
          error_description: 'consent_required',
        });
      if (isRequiredScopeNotVerified) return;
      return authorize(consentedScopes);
    }

    if (prompt === 'consent') return; // show consent screen

    if (consented) {
      if (tokenScopes.includes('offline_access')) return;
      if (isRequiredScopeNotVerified) return;
      return authorize(consentedScopes);
    }
  }, [
    authorize,
    clientId,
    scopes,
    isRequiredScopeNotVerified,
    prompt,
    recentLogin,
    redirect,
    requiredScopes,
    signOut,
    state,
    tokenScopes,
    user,
  ]);

  return {
    ...useAuthorizeForm({
      clientId: client.clientId,
      onDone: authorize,
    }),
    isRequiredScopeNotVerified,
    onCancel,
  };
};
