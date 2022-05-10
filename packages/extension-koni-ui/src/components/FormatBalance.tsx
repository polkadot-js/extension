// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { Compact } from '@polkadot/types';

import React from 'react';
import styled from 'styled-components';

import { BN, BN_ZERO, formatBalance } from '@polkadot/util';

interface Props {
  children?: React.ReactNode;
  className?: string;
  format: [number, string];
  isShort?: boolean;
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

function createElement (prefix: string, postfix: string, unit: string, label: LabelPost = '', isShort = false): React.ReactNode {
  return <><span className='format-balance__front-part'>{`${prefix}${isShort ? '' : '.'}`}{!isShort &&
  <span className='format-balance__postfix'>{`0000${postfix || ''}`.slice(-4)}</span>}</span><span
    className='format-balance__unit'
  > {unit}</span>{label}</>;
}

function applyFormat (value: Compact<any> | BN | string, [decimals, token]: [number, string], withCurrency = true, withSi?: boolean, _isShort?: boolean, labelPost?: LabelPost): React.ReactNode {
  const [prefix, postfix] = formatBalance(value, { decimals, forceUnit: '-', withSi: false }).split('.');
  const isShort = _isShort || (withSi && prefix.length >= K_LENGTH);
  const unitPost = withCurrency ? token : '';

  if (prefix.length > M_LENGTH) {
    const [major, rest] = formatBalance(value, { decimals, withUnit: false }).split('.');
    const minor = rest.substr(0, 4);
    const unit = rest.substr(4);

    return <><span className='format-balance__front-part'>{major}.<span className='format-balance__postfix'>{minor}</span></span><span
      className='format-balance__unit'
    >{unit}{unit ? unitPost : ` ${unitPost}`}</span>{labelPost || ''}</>;
  }

  return createElement(prefix, postfix, unitPost, labelPost, isShort);
}

function FormatBalance ({ children,
  className = '',
  format,
  isShort,
  label,
  labelPost,
  value,
  withCurrency,
  withSi }: Props): React.ReactElement<Props> {
  return (
    <div className={`format-balance ${className}`}>
      {label ? <>{label}&nbsp;</> : ''}
      <span className='format-balance__value'>{
        value
          ? applyFormat(value, format, withCurrency, withSi, isShort, labelPost)
          : applyFormat(BN_ZERO, format, withCurrency, withSi, isShort, labelPost)
      }</span>{children}
    </div>
  );
}

export default React.memo(styled(FormatBalance)`

`);
