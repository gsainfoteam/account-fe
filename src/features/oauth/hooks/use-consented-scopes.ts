import { useMemo } from 'react';

import { $api } from '@/features/core';

export const useConsentedScopes = (clientId: string) => {
  const { data, isLoading, error } = $api.useQuery('get', '/user/consent');
  const consent = useMemo(
    () => data?.list.find((c) => c.clientUuid === clientId),
    [data, clientId],
  );

  return {
    scopes: consent?.scopes ?? [],
    hasConsent: consent !== undefined,
    isLoading,
    error,
  };
};
