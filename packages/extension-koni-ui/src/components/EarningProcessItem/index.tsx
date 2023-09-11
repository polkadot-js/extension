// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { Theme, ThemeProps } from '@subwallet/extension-koni-ui/types';
import { BackgroundIcon, Typography } from '@subwallet/react-ui';
import { CheckCircle, PlusCircle } from 'phosphor-react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import styled, { useTheme } from 'styled-components';

interface Props extends ThemeProps {
  isSelected: boolean;
  index: number;
  stepName: string;
}

const Component = ({ className, index, isSelected, stepName }: Props) => {
  const { t } = useTranslation();
  const { token } = useTheme() as Theme;

  return (
    <div className={className}>
      {isSelected
        ? (
          <BackgroundIcon
            backgroundColor={'rgba(45, 167, 63, 0.1)'}
            iconColor={token['green-6']}
            phosphorIcon={CheckCircle}
            size={'lg'}
            weight={'fill'}
          />
        )
        : (
          <BackgroundIcon
            backgroundColor={'rgba(217, 217, 217, 0.1)'}
            iconColor={token.colorTextLight3}
            phosphorIcon={PlusCircle}
            size={'lg'}
            weight={'fill'}
          />
        )}
      <div className={'staking-process-flex-wrapper'}>
        <Typography.Text
          className={`staking-process-text ${isSelected ? 'staking-process-selected-text' : ''}`}
        >
          {t('Step {{stepNumb}}:', { replace: { stepNumb: index } })}
        </Typography.Text>
        <Typography.Text
          className={`staking-process-text ${isSelected ? 'staking-process-selected-text' : ''}`}
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
      color: token['green-6']
    },

    '.staking-process-flex-wrapper': {
      display: 'flex',
      alignItems: 'center',
      gap: token.paddingSM
    }
  };
});

export default EarningProcessItem;
