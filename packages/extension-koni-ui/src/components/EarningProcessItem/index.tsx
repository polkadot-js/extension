// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { EarningStepStatus } from '@subwallet/extension-koni-ui/reducer';
import { Theme, ThemeProps } from '@subwallet/extension-koni-ui/types';
import { ActivityIndicator, BackgroundIcon, Typography } from '@subwallet/react-ui';
import { CheckCircle, PlusCircle, WarningCircle, XCircle } from 'phosphor-react';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import styled, { useTheme } from 'styled-components';

interface Props extends ThemeProps {
  isSelected: boolean;
  index: number;
  stepName: string;
  stepStatus?: EarningStepStatus
}

const Component = ({ className, index, isSelected, stepName, stepStatus }: Props) => {
  const { t } = useTranslation();
  const { token } = useTheme() as Theme;

  const stepStatusIcon = useMemo(() => {
    switch (stepStatus) {
      case EarningStepStatus.SUBMITTING:
        return (
          <div style={{ width: '32px', height: '32px', justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator
              prefixCls={'ant'}
              size={'24px'}
            />
          </div>
        );
      case EarningStepStatus.ERROR:
        return (
          <BackgroundIcon
            backgroundColor={token.colorErrorBg}
            iconColor={token.colorError}
            phosphorIcon={XCircle}
            size={'lg'}
            weight={'fill'}
          />
        );
      case EarningStepStatus.SUCCESS:
        return (
          <BackgroundIcon
            backgroundColor={'rgba(45, 167, 63, 0.1)'}
            iconColor={token['green-6']}
            phosphorIcon={CheckCircle}
            size={'lg'}
            weight={'fill'}
          />
        );
      case EarningStepStatus.PROCESSING:
        return (
          <BackgroundIcon
            backgroundColor={token.colorPrimaryBg}
            iconColor={token.colorPrimary}
            phosphorIcon={WarningCircle}
            size={'lg'}
            weight={'fill'}
          />
        );
      case EarningStepStatus.QUEUED:
      default:
        return (
          <BackgroundIcon
            backgroundColor={'rgba(217, 217, 217, 0.1)'}
            iconColor={token.colorTextLight3}
            phosphorIcon={PlusCircle}
            size={'lg'}
            weight={'fill'}
          />
        );
    }
  }, [token, stepStatus]);

  const stepTextClassName = useMemo(() => {
    switch (stepStatus) {
      case EarningStepStatus.SUBMITTING:
        return 'staking-process-loading-text';
      case EarningStepStatus.ERROR:
        return 'staking-process-fail-text';
      case EarningStepStatus.SUCCESS:
        return 'staking-process-success-text';
      case EarningStepStatus.PROCESSING:
        return 'staking-process-selected-text';
      case EarningStepStatus.QUEUED:
      default:
        return '';
    }
  }, [stepStatus]);

  return (
    <div className={className}>
      {stepStatusIcon}
      <div className={'staking-process-flex-wrapper'}>
        <Typography.Text
          className={`staking-process-text ${stepTextClassName}`}
        >
          {t('Step {{stepNumb}}:', { replace: { stepNumb: index + 1 } })}
        </Typography.Text>
        <Typography.Text
          className={`staking-process-text ${stepTextClassName}`}
        >
          {stepName}
        </Typography.Text>
      </div>

    </div>
  );
};

const EarningProcessItem = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {
    display: 'flex',
    alignItems: 'center',
    gap: token.paddingSM,

    '.staking-process-text': {
      fontWeight: '600',
      color: token.colorTextLight4
    },

    '.staking-process-selected-text': {
      color: token.colorPrimary
    },

    '.staking-process-success-text': {
      color: token['green-6']
    },

    '.staking-process-fail-text': {
      color: token.colorError
    },

    '.staking-process-loading-text': {
      color: token.colorTextLight4
    },

    '.staking-process-flex-wrapper': {
      display: 'flex',
      alignItems: 'center',
      gap: token.paddingSM
    }
  };
});

export default EarningProcessItem;
