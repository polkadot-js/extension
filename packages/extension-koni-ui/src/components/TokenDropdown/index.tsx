// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React, { useCallback } from 'react';
import styled from 'styled-components';

import { TokenItemType } from '@polkadot/extension-koni-ui/components/types';
import { ThemeProps } from '@polkadot/extension-koni-ui/types';

import Dropdown from './Dropdown';
import TokenItem from './TokenItem';

interface Props {
  className?: string;
  options: TokenItemType[];
  onChangeTokenValue: (tokenValueStr: string) => void;
  value: string;
}

// eslint-disable-next-line no-empty-pattern
function TokenDropdown ({ className = '', onChangeTokenValue, options, value }: Props): React.ReactElement {
  const formatOptLabel = useCallback((label: string, value: string, networkKey: string) => {
    return (
      <TokenItem
        networkKey={networkKey}
        symbol={label}
      />
    );
  }, []);

  return (
    <div className={className}>
      <Dropdown
        className='input-address__dropdown'
        formatOptLabel={formatOptLabel}
        onChange={onChangeTokenValue}
        options={options}
        value={value}
      />
    </div>
  );
}

export default React.memo(styled(TokenDropdown)(({ theme }: ThemeProps) => `
  `));
