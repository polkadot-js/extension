// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { useCountdown } from '@subwallet/extension-koni-ui/hooks/common/useCountdown';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import React from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

type Props = ThemeProps;

const targetTime = 1705380018000;

const Component: React.FC<Props> = ({ className }: Props) => {
  const { t } = useTranslation();
  const [days, hours, minutes, seconds] = useCountdown(targetTime);

  return (
    <div className={className}>
      <div className={'__time-item'}>
        <div className={'__time-item-number'}>{`${days}`.padStart(2, '0')}</div>
        <div className={'__time-item-unit'}>
          {days < 2 ? t('day') : t('days')}
        </div>
      </div>
      <div className={'__time-separator'}>:</div>
      <div className={'__time-item'}>
        <div className={'__time-item-number'}>{`${hours}`.padStart(2, '0')}</div>
        <div className={'__time-item-unit'}>
          {hours < 2 ? t('hour') : t('hours')}
        </div>
      </div>
      <div className={'__time-separator'}>:</div>
      <div className={'__time-item'}>
        <div className={'__time-item-number'}>{`${minutes}`.padStart(2, '0')}</div>
        <div className={'__time-item-unit'}>
          {minutes < 2 ? t('minute') : t('minutes')}
        </div>
      </div>
      <div className={'__time-separator'}>:</div>
      <div className={'__time-item'}>
        <div className={'__time-item-number'}>{`${seconds}`.padStart(2, '0')}</div>
        <div className={'__time-item-unit'}>
          {seconds < 2 ? t('second') : t('seconds')}
        </div>
      </div>
    </div>
  );
};

const Countdown = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {
    display: 'flex',

    '.__time-item': {
      textAlign: 'center'
    },

    '.__time-item-number': {
      fontSize: token.fontSizeHeading3,
      lineHeight: token.lineHeightHeading3,
      fontWeight: token.headingFontWeight,
      color: token.colorTextLight1
    },

    '.__time-item-unit': {
      fontSize: token.sizeSM,
      lineHeight: token.lineHeightSM,
      color: token.colorTextLight4,
      textTransform: 'uppercase'
    },

    '.__time-separator': {
      fontSize: token.fontSizeHeading3,
      lineHeight: token.lineHeightHeading3,
      color: token.colorTextLight4,
      alignSelf: 'top',
      paddingLeft: token.padding,
      paddingRight: token.padding
    }
  };
});

export default Countdown;
