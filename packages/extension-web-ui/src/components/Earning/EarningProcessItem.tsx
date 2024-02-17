// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { EarningStepStatus } from '@subwallet/extension-web-ui/reducer';
import { Theme, ThemeProps } from '@subwallet/extension-web-ui/types';
import { convertHexColorToRGBA } from '@subwallet/extension-web-ui/utils';
import { BackgroundIcon } from '@subwallet/react-ui';
import CN from 'classnames';
import { CheckCircle, PlusCircle, Spinner, XCircle } from 'phosphor-react';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import styled, { useTheme } from 'styled-components';

interface Props extends ThemeProps {
  index: number;
  stepName: string;
  stepStatus?: EarningStepStatus
}

const Component = ({ className, index, stepName, stepStatus }: Props) => {
  const { t } = useTranslation();
  const { token } = useTheme() as Theme;

  const stepStatusIcon = useMemo(() => {
    switch (stepStatus) {
      case EarningStepStatus.SUBMITTING:
        return (
          <BackgroundIcon
            backgroundColor={convertHexColorToRGBA(token['gold-6'], 0.1)}
            iconColor={token['gold-6']}
            phosphorIcon={Spinner}
            size={'lg'}
            weight={'fill'}
          />
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
            backgroundColor={convertHexColorToRGBA(token.colorSuccess, 0.1)}
            iconColor={token.colorSuccess}
            phosphorIcon={CheckCircle}
            size={'lg'}
            weight={'fill'}
          />
        );
      case EarningStepStatus.PROCESSING:
        return (
          <BackgroundIcon
            backgroundColor={convertHexColorToRGBA(token['gray-6'], 0.1)}
            iconColor={token['gray-6']}
            phosphorIcon={PlusCircle}
            size={'lg'}
            weight={'fill'}
          />
        );
      case EarningStepStatus.QUEUED:
      default:
        return (
          <BackgroundIcon
            backgroundColor={convertHexColorToRGBA(token['gray-6'], 0.1)}
            iconColor={token['gray-3']}
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
        return '-submitting';
      case EarningStepStatus.ERROR:
        return '-error';
      case EarningStepStatus.SUCCESS:
        return '-success';
      case EarningStepStatus.PROCESSING:
        return '-processing';
      case EarningStepStatus.QUEUED:
      default:
        return '';
    }
  }, [stepStatus]);

  return (
    <div className={className}>
      {stepStatusIcon}
      <div className={CN('__step-title', stepTextClassName)}>
        <span className={'__order'}>
          {t('Step {{stepNumb}}:', { replace: { stepNumb: index + 1 } })}
        </span>

        <span className={'__name'}>
          {stepName}
        </span>
      </div>
    </div>
  );
};

const EarningProcessItem = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {
    display: 'flex',
    alignItems: 'center',
    gap: token.paddingSM,

    '.__step-title': {
      display: 'flex',
      alignItems: 'center',
      gap: token.paddingSM,
      fontWeight: '600',
      color: token['gray-3'],
      fontSize: token.fontSize,
      lineHeight: token.lineHeight
    },

    '.__step-title.-processing': {
      color: token['gray-6']
    },

    '.__step-title.-success': {
      color: token.colorSuccess
    },

    '.__step-title.-error': {
      color: token.colorError
    },

    '.__step-title.-submitting': {
      color: token['gold-6']
    }
  };
});

export default EarningProcessItem;
