import { useFormState } from 'react-hook-form';
import { Trans, useTranslation } from 'react-i18next';

import { useTelForm } from '../../hooks/register-steps/use-tel-form';
import { RegisterSteps } from '../register-frame';

import {
  Button,
  FunnelLayout,
  Label,
  LogClick,
  StepProgress,
  TelInput,
} from '@/features/core';

export function TelStep({
  onNext,
  onUndo,
}: Parameters<typeof useTelForm>[0] & { onUndo: () => void }) {
  const {
    form: { control },
    onSubmit,
  } = useTelForm({ onNext });

  const { isSubmitting, errors } = useFormState({ control });
  const { t } = useTranslation();

  return (
    <form onSubmit={onSubmit}>
      <FunnelLayout
        onUndo={onUndo}
        loading={isSubmitting}
        title={t('register.title')}
        stepTitle={
          <div className="flex flex-col items-start gap-5">
            <StepProgress
              currentStep={RegisterSteps.indexOf('tel')}
              totalSteps={RegisterSteps.length}
            />
            {t('register.steps.tel.title')}
          </div>
        }
        button={
          <LogClick event="register_tel_verify">
            <Button
              variant="primary"
              className="w-full"
              loading={isSubmitting}
              disabled // 휴대전화 본인인증 일시 중단
            >
              {t('register.steps.tel.button')}
            </Button>
          </LogClick>
        }
      >
        <p className="text-label text-warning-900 dark:text-warning-300">
          <Trans
            i18nKey="register.steps.tel.unavailable"
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
        <Label text={t('register.steps.tel.inputs.phone_number.label')}>
          <TelInput
            name="phoneNumber"
            control={control}
            placeholder={t(
              'register.steps.tel.inputs.phone_number.placeholder',
            )}
            error={errors.phoneNumber?.message}
            disabled={isSubmitting}
            defaultCountry="KR"
          />
        </Label>
      </FunnelLayout>
    </form>
  );
}
