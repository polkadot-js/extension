// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { Number } from '@subwallet/react-ui';
import BigN from 'bignumber.js';
import CN from 'classnames';
import React from 'react';
import styled from 'styled-components';

import { InfoItemBase } from './types';

export interface NumberInfoItem extends Omit<InfoItemBase, 'valueColorSchema'> {
  value: string | number | BigN,
  suffix?: string,
  decimals?: number,
  valueColorSchema?: InfoItemBase['valueColorSchema'] | 'even-odd'
}

const Component: React.FC<NumberInfoItem> = (props: NumberInfoItem) => {
  const { className, decimals = 0, label, suffix, value, valueColorSchema = 'default' } = props;

  return (
    <div className={CN(className, '__row -type-number')}>
      <div className={'__col'}>
        <div className={'__label'}>
          {label}
        </div>
      </div>
      <div className={'__col -to-right'}>
        <Number
          className={`__number-item __value -schema-${valueColorSchema}`}
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

const NumberItem = styled(Component)<NumberInfoItem>(({ theme: { token } }: NumberInfoItem) => {
  return {};
});

export default NumberItem;
