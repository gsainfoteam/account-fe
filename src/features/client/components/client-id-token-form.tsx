import { Controller, useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { type Client } from '../hooks/use-client';
import { type ClientDetailsFormSchema } from '../hooks/use-client-details-form';
import { useClientMembers } from '../hooks/use-client-members';
import { hasRoleAtLeast } from '../utils/role';

import { Label, MultiStateSwitch, Switch } from '@/features/core';

const authMethods = [
  'none',
  'client_secret_basic',
  'client_secret_post',
] as const;

export function ClientIdTokenForm({ client }: { client: Client }) {
  const { t } = useTranslation();
  const { control } = useFormContext<ClientDetailsFormSchema>();
  const { currentUserRoleNumber } = useClientMembers(client.clientId);
  const isDeleted = client.deleteRequestedAt != null;
  const canManage = hasRoleAtLeast(currentUserRoleNumber, 'ADMIN');

  return (
    <div className="flex flex-col gap-4">
      <div className="text-title-3 text-basics-primary-label">
        {t('services.detail.openid.title')}
      </div>
      <div className="flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <div className="text-label-1 text-basics-primary-label">
            {t('services.detail.openid.enable')}
          </div>
          <Controller
            control={control}
            name="idTokenAllowed"
            render={({ field: { value, disabled, ...field } }) => (
              <Switch
                disabled={disabled || isDeleted || !canManage}
                checked={value}
                {...field}
              />
            )}
          />
        </div>
        <Controller
          control={control}
          name="tokenEndpointAuthMethod"
          render={({ field: { value, disabled, onChange } }) => (
            <Label text={t('services.detail.openid.auth_method')}>
              <MultiStateSwitch
                selected={authMethods.indexOf(value)}
                disabled={disabled || isDeleted || !canManage}
                onChangeIndex={(index) => onChange(authMethods[index])}
                labels={[...authMethods]}
              />
            </Label>
          )}
        />
      </div>
    </div>
  );
}
