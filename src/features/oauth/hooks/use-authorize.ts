import { useLoaderData, useSearch } from '@tanstack/react-router';
import { useCallback, useEffect, useMemo } from 'react';

import { checkRequiredScopeNotVerified, reportAuthorizeError } from '../utils';

import { useAuthorizeForm } from './use-authorize-form';

import { type components } from '@/@types/api-schema';
import { useAuth } from '@/features/auth';
import { type ClientScopeType } from '@/routes/_auth-required/authorize';

export const useAuthorize = ({
  client,
  scopes,
  hasConsent,
}: {
  client: components['schemas']['ClientPublicResDto'];
  scopes: string[];
  hasConsent: boolean | undefined;
}) => {
  const { user } = useAuth();
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

  const redirect = useCallback(
    (params: { error: string; errorDescription?: string }) =>
      reportAuthorizeError({ clientId, redirectUri, state, ...params }),
    [clientId, redirectUri, state],
  );

  const onCancel = useCallback(() => {
    redirect({ error: 'access_denied', errorDescription: 'user_cancelled' });
  }, [redirect]);

  const authorize = useCallback(
    (agreed: ClientScopeType[]) => {
      if (isRequiredScopeNotVerified) {
        return redirect({
          error: 'access_denied',
          errorDescription: 'verification_required',
        });
      }

      const query = new URLSearchParams(search);
      const granted = agreed.filter((scope) => clientScopes.includes(scope));
      query.set('scope', [...tokenScopes, ...granted].join(' '));
      window.location.href = `${import.meta.env.VITE_API_URL}/oauth/authorize?${query.toString()}`;
    },
    [clientScopes, isRequiredScopeNotVerified, redirect, search, tokenScopes],
  );

  // decided during render so the consent screen is never painted when it will not be used
  const decision = useMemo(() => {
    // without a consent record the backend denies even a client with no required scopes
    const consented =
      hasConsent === true &&
      requiredScopes.every((s) => scopes.includes(s)) &&
      !tokenScopes.includes('offline_access');

    if (prompt === 'none') {
      if (hasConsent === undefined) return 'server_error';
      if (!consented) return 'consent_required';
      if (isRequiredScopeNotVerified) return 'interaction_required';
      return 'authorize';
    }
    if (prompt === 'consent') return null;
    if (consented && !isRequiredScopeNotVerified) return 'authorize';
    return null;
  }, [
    hasConsent,
    isRequiredScopeNotVerified,
    prompt,
    requiredScopes,
    scopes,
    tokenScopes,
  ]);

  useEffect(() => {
    if (decision === 'authorize') authorize(scopes as ClientScopeType[]);
    else if (decision) redirect({ error: decision });
  }, [authorize, decision, redirect, scopes]);

  return {
    ...useAuthorizeForm({
      clientId: client.clientId,
      onDone: authorize,
    }),
    isRequiredScopeNotVerified,
    isDeciding: decision !== null,
    onCancel,
  };
};
