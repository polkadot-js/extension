import React from 'react';
import { Theme, ThemeProps } from '@subwallet/extension-koni-ui/types';
import { useTranslation } from 'react-i18next';
import { BackgroundIcon, Typography } from '@subwallet/react-ui';
import styled, { useTheme } from 'styled-components';
import { CheckCircle, PlusCircle } from 'phosphor-react';

interface Props extends ThemeProps {
  isSelected: boolean;
  index: number;
  stepName: string;
}

const Component = ({ className, isSelected, index, stepName }: Props) => {
  const { t } = useTranslation();
  const { token } = useTheme() as Theme;

  return (
    <div className={`${className}`}>
      {isSelected ? (
        <BackgroundIcon
          size={'lg'}
          phosphorIcon={CheckCircle}
          iconColor={token['green-6']}
          weight={'fill'}
          backgroundColor={'rgba(45, 167, 63, 0.1)'}
        />
      ) : (
        <BackgroundIcon
          size={'lg'}
          phosphorIcon={PlusCircle}
          iconColor={token.colorTextLight3}
          weight={'fill'}
          backgroundColor={'rgba(217, 217, 217, 0.1)'} />
      )}
      <div className={'staking-process-flex-wrapper'}>
        <Typography.Text
          className={`staking-process-text ${isSelected ? 'staking-process-selected-text' : ''}`}>
          {t('Step {{stepNumb}}:', { replace: { stepNumb: index + 1 } })}
        </Typography.Text>
        <Typography.Text
          className={`staking-process-text ${isSelected ? 'staking-process-selected-text' : ''}`}>
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
    },
  }
});

export default EarningProcessItem;
