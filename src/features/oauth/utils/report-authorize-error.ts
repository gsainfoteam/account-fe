// the backend checks redirect_uri against the client's registered URLs before redirecting,
// which this page cannot do because the public client info leaves the URLs out
export const reportAuthorizeError = ({
  clientId,
  redirectUri,
  state,
  error,
  errorDescription,
}: {
  clientId: string;
  redirectUri: string;
  state?: string;
  error: string;
  errorDescription?: string;
}) => {
  const query = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    error,
  });
  if (errorDescription) query.set('error_description', errorDescription);
  if (state) query.set('state', state);

  window.location.href = `${import.meta.env.VITE_API_URL}/oauth/authorize/error?${query.toString()}`;
};
