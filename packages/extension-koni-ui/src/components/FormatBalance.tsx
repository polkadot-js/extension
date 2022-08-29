// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { Compact } from '@polkadot/types';

import { BalanceFormatType } from '@subwallet/extension-koni-ui/components/types';
import React from 'react';
import styled from 'styled-components';

import { BN, BN_ZERO, formatBalance } from '@polkadot/util';

interface Props {
  children?: React.ReactNode;
  className?: string;
  format: BalanceFormatType; // decimals | symbol | symbol Alt
  isShort?: boolean;
  newRule?: boolean;
  label?: React.ReactNode;
  labelPost?: LabelPost;
  value?: Compact<any> | BN | string | null | 'all';
  withCurrency?: boolean;
  withSi?: boolean;
}

// for million, 2 * 3-grouping + comma
const M_LENGTH = 6 + 1;
const K_LENGTH = 3 + 1;

type LabelPost = string | React.ReactNode

function createElement (prefix: string, postfix: string, unit: string, label: LabelPost = '', isShort = false, newRule = true): React.ReactNode {
  const length = newRule ? (parseFloat(prefix) >= 1 ? 2 : 4) : 4;
  const postfixLength = (postfix && postfix.length > length) ? postfix.length : length;

  return <><span className='format-balance__front-part'>{`${prefix}${isShort ? '' : '.'}`}{!isShort &&
  <span className='format-balance__postfix'>{`${(postfix || '').padStart(postfixLength, '0')}`.substring(0, length)}</span>}</span><span
    className='format-balance__unit'
  > {unit}</span>{label}</>;
}

function applyFormat (value: Compact<any> | BN | string, [decimals, symbol, symbolAlt]: BalanceFormatType, withCurrency = true, withSi?: boolean, _isShort?: boolean, labelPost?: LabelPost, newRule = true): React.ReactNode {
  const [prefix, postfix] = formatBalance(value, { decimals, forceUnit: '-', withSi: false }).split('.');
  const isShort = _isShort || (withSi && prefix.length >= K_LENGTH);
  const unitPost = withCurrency ? (symbolAlt || symbol) : '';

  if (prefix.length > M_LENGTH) {
    const [major, rest] = formatBalance(value, { decimals, withUnit: false }).split('.');
    const length = newRule ? (parseFloat(major) >= 1 ? 2 : 4) : 4;
    const minor = rest.substr(0, length);
    const unit = rest.substr(4);

    return <><span className='format-balance__front-part'>{major}.<span className='format-balance__postfix'>{minor}</span></span><span
      className='format-balance__unit'
    >{unit}{unit ? unitPost : ` ${unitPost}`}</span>{labelPost || ''}</>;
  }

  return createElement(prefix, postfix, unitPost, labelPost, isShort, newRule);
}

function FormatBalance ({ children,
  className = '',
  format,
  isShort,
  label,
  labelPost,
  newRule = false,
  value,
  withCurrency,
  withSi }: Props): React.ReactElement<Props> {
  return (
    <div className={`format-balance ${className}`}>
      {label ? <>{label}&nbsp;</> : ''}
      <span className='format-balance__value'>{
        value
          ? applyFormat(value, format, withCurrency, withSi, isShort, labelPost, newRule)
          : applyFormat(BN_ZERO, format, withCurrency, withSi, isShort, labelPost, newRule)
      }</span>{children}
    </div>
  );
}

export default React.memo(styled(FormatBalance)`

  .format-balance__postfix {
    opacity: 0.6;
  }
`);
