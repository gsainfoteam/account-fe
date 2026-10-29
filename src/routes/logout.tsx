import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import { useAuth } from '@/features/auth';
import { Button, FunnelLayout } from '@/features/core';

const LogoutPage = () => {
  const { t } = useTranslation();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { client_id, post_logout_redirect_uri, state } = Route.useSearch();
  const [pending, setPending] = useState(false);
  const [failed, setFailed] = useState(false);

  const leave = useCallback(
    (fallback: '/' | '/auth/login') => {
      if (!client_id || !post_logout_redirect_uri)
        return navigate({ to: fallback, replace: true });

      // the backend checks post_logout_redirect_uri against the client's registered URLs, which this page cannot see
      const query = new URLSearchParams({
        client_id,
        post_logout_redirect_uri,
      });
      if (state) query.set('state', state);
      window.location.href = `${import.meta.env.VITE_API_URL}/oauth/logout/redirect?${query.toString()}`;
    },
    [client_id, navigate, post_logout_redirect_uri, state],
  );

  // also runs right after a successful signOut, which clears the token.
  // with no IdP session there is nothing a forged link could end, so the confirmation is skipped
  useEffect(() => {
    if (user === null) void leave('/auth/login');
  }, [leave, user]);

  const confirm = async () => {
    setPending(true);
    const ok = await signOut(false);
    setPending(false);
    setFailed(!ok);
  };

  return (
    <FunnelLayout
      hideUndo
      loading={!user || pending}
      title={t('logout.title')}
      stepTitle={t('logout.confirm.title')}
      description={
        failed ? t('logout.confirm.failed') : t('logout.confirm.description')
      }
      button={
        <div className="flex w-full gap-2">
          <Button
            variant="secondary"
            className="w-full"
            disabled={pending}
            onClick={() => void leave('/')}
          >
            {t('logout.confirm.cancel')}
          </Button>
          <Button
            variant="primary"
            className="w-full"
            disabled={pending}
            onClick={() => void confirm()}
          >
            {failed ? t('logout.confirm.retry') : t('logout.confirm.button')}
          </Button>
        </div>
      }
    />
  );
};

export const Route = createFileRoute('/logout')({
  component: LogoutPage,
  validateSearch: z
    .object({
      client_id: z.string().optional(),
      post_logout_redirect_uri: z.string().url().optional(),
      state: z.string().optional(),
      id_token_hint: z.string().optional(),
    })
    .refine(
      ({ client_id, post_logout_redirect_uri }) =>
        !post_logout_redirect_uri || client_id,
      {
        message: 'post_logout_redirect_uri requires client_id',
        path: ['client_id'],
      },
    ),
});
