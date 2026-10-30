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
    // undefined when the lookup failed, so a failure is not mistaken for a missing consent
    hasConsent: error ? undefined : consent !== undefined,
    isLoading,
    error,
  };
};
