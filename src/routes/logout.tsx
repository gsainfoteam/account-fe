import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useEffect } from 'react';
import { z } from 'zod';

import { useAuth } from '@/features/auth';

const LogoutPage = () => {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const { client_id, post_logout_redirect_uri, state } = Route.useSearch();

  useEffect(() => {
    void signOut(false).then((ok) => {
      if (!ok) return;
      if (!client_id || !post_logout_redirect_uri)
        return navigate({ to: '/auth/login', replace: true });

      // the backend checks post_logout_redirect_uri against the client's registered URLs, which this page cannot see
      const query = new URLSearchParams({
        client_id,
        post_logout_redirect_uri,
      });
      if (state) query.set('state', state);
      window.location.href = `${import.meta.env.VITE_API_URL}/oauth/logout/redirect?${query.toString()}`;
    });
  }, [client_id, navigate, post_logout_redirect_uri, signOut, state]);

  return null;
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
