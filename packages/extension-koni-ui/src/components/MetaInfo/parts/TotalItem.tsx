// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { Number } from '@subwallet/react-ui';
import BigN from 'bignumber.js';
import CN from 'classnames';
import React from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

import { InfoItemBase } from './types';

export interface TotalInfoItem extends Omit<InfoItemBase, 'label' | 'valueColorSchema'> {
  value: string | number | BigN,
  suffix?: string,
  decimals?: number
}

const Component: React.FC<TotalInfoItem> = (props: TotalInfoItem) => {
  const { className, decimals = 0, suffix, value } = props;

  const { t } = useTranslation();

  return (
    <div className={CN(className, '__row -type-total}')}>
      <div className={'__col __label-col'}>
        <div className={'__label'}>
          {t('Total')}
        </div>
      </div>
      <div className={'__col __value-col -to-right'}>
        <Number
          className={'__balance-item __value -schema-even-odd'}
          decimal={decimals}
          decimalOpacity={1}
          intOpacity={1}
          suffix={suffix}
          unitOpacity={1}
          value={value}
        />
      </div>
    </div>
  );
};

const TotalItem = styled(Component)<TotalInfoItem>(({ theme: { token } }: TotalInfoItem) => {
  return {};
});

export default TotalItem;
