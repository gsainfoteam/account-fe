import { useFormState } from 'react-hook-form';
import { Trans, useTranslation } from 'react-i18next';

import { useVerifyPhoneNumberForm } from '../../hooks/use-verify-phone-number-form';

import { useAuth } from '@/features/auth';
import { Button, FunnelLayout, Label, TelInput } from '@/features/core';

export function TelStep({
  onNext,
}: Parameters<typeof useVerifyPhoneNumberForm>[0]) {
  const {
    form: { control },
    onSubmit,
  } = useVerifyPhoneNumberForm({ onNext });
  const { isSubmitting, errors } = useFormState({ control });
  const { t } = useTranslation();
  const { user } = useAuth();

  if (!user) return null;

  return (
    <form onSubmit={onSubmit}>
      <FunnelLayout
        title={t('verify_phone_number.title')}
        stepTitle={t('verify_phone_number.steps.tel.title')}
        button={
          <Button
            variant="primary"
            className="w-full"
            loading={isSubmitting}
            disabled // 휴대전화 본인인증 일시 중단
          >
            {t('verify_phone_number.steps.tel.button')}
          </Button>
        }
      >
        <div className="flex flex-col gap-5">
          <p className="text-label text-warning-900 dark:text-warning-300">
            <Trans
              i18nKey="verify_phone_number.steps.tel.unavailable"
              components={[
                <a
                  key="cs-link"
                  href="https://cs.gistory.me"
                  target="_blank"
                  rel="noreferrer"
                  className="underline"
                />,
              ]}
            />
          </p>
          <Label
            text={t('verify_phone_number.steps.tel.inputs.phone_number.label')}
          >
            <TelInput
              name="phoneNumber"
              control={control}
              placeholder={t(
                'verify_phone_number.steps.tel.inputs.phone_number.placeholder',
              )}
              error={errors.phoneNumber?.message || errors.root?.message}
              disabled={isSubmitting}
              defaultCountry="KR"
            />
          </Label>
        </div>
      </FunnelLayout>
    </form>
  );
}
