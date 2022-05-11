// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { Compact } from '@polkadot/types';
import type { Registry } from '@polkadot/types/types';

import React, { useMemo } from 'react';
import styled from 'styled-components';

import useTranslation from '@subwallet/extension-koni-ui/hooks/useTranslation';
import { BN, BN_ZERO, formatBalance } from '@polkadot/util';

interface Props {
  children?: React.ReactNode;
  className?: string;
  registry: Registry;
  format?: [number, string];
  formatIndex?: number;
  isShort?: boolean;
  label?: React.ReactNode;
  labelPost?: LabelPost;
  value?: Compact<any> | BN | string | null | 'all';
  valueFormatted?: string;
  withCurrency?: boolean;
  withSi?: boolean;
}

// for million, 2 * 3-grouping + comma
const M_LENGTH = 6 + 1;
const K_LENGTH = 3 + 1;

type LabelPost = string | React.ReactNode

function getFormat (registry: Registry, formatIndex = 0): [number, string] {
  const decimals = registry.chainDecimals;
  const tokens = registry.chainTokens;

  return [
    formatIndex < decimals.length
      ? decimals[formatIndex]
      : decimals[0],
    formatIndex < tokens.length
      ? tokens[formatIndex]
      : tokens[1]
  ];
}

function createElement (prefix: string, postfix: string, unit: string, label: LabelPost = '', isShort = false): React.ReactNode {
  return <>{`${prefix}${isShort ? '' : '.'}`}{!isShort && <span className='ui--FormatBalance-postfix'>{`0000${postfix || ''}`.slice(-4)}</span>}<span className='ui--FormatBalance-unit'> {unit}</span>{label}</>;
}

function splitFormat (value: string, label?: LabelPost, isShort?: boolean): React.ReactNode {
  const [prefix, postfixFull] = value.split('.');
  const [postfix, unit] = postfixFull.split(' ');

  return createElement(prefix, postfix, unit, label, isShort);
}

function applyFormat (value: Compact<any> | BN | string, [decimals, token]: [number, string], withCurrency = true, withSi?: boolean, _isShort?: boolean, labelPost?: LabelPost): React.ReactNode {
  const [prefix, postfix] = formatBalance(value, { decimals, forceUnit: '-', withSi: false }).split('.');
  const isShort = _isShort || (withSi && prefix.length >= K_LENGTH);
  const unitPost = withCurrency ? token : '';

  if (prefix.length > M_LENGTH) {
    const [major, rest] = formatBalance(value, { decimals, withUnit: false }).split('.');
    const minor = rest.substr(0, 4);
    const unit = rest.substr(4);

    return <>{major}.<span className='ui--FormatBalance-postfix'>{minor}</span><span className='ui--FormatBalance-unit'>{unit}{unit ? unitPost : ` ${unitPost}`}</span>{labelPost || ''}</>;
  }

  return createElement(prefix, postfix, unitPost, labelPost, isShort);
}

function FormatBalance ({ children, className = '', format, formatIndex, isShort, label, labelPost, registry, value, valueFormatted, withCurrency, withSi }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();

  const formatInfo = useMemo(
    () => format || getFormat(registry, formatIndex),
    [registry, format, formatIndex]
  );

  // labelPost here looks messy, however we ensure we have one less text node
  return (
    <div className={`ui--FormatBalance ${className}`}>
      {label ? <>{label}&nbsp;</> : ''}
      <span
        className='ui--FormatBalance-value'
        data-testid='balance-summary'
      >{
          valueFormatted
            ? splitFormat(valueFormatted, labelPost, isShort)
            : value
              ? value === 'all'
                ? <>{t<string>('everything')}{labelPost || ''}</>
                : applyFormat(value, formatInfo, withCurrency, withSi, isShort, labelPost)
              : applyFormat(BN_ZERO, formatInfo, withCurrency, withSi, isShort, labelPost)
        }</span>{children}
    </div>
  );
}

export default React.memo(styled(FormatBalance)`

`);
