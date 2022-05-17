// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { TokenItemType } from '@subwallet/extension-koni-ui/components/types';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import React, { useCallback } from 'react';
import styled from 'styled-components';

import Dropdown from './Dropdown';
import TokenItem from './TokenItem';
import { NetworkJson } from '@subwallet/extension-base/background/KoniTypes';
import { TokenTransformOptionType } from '@subwallet/web-runner/components/TokenDropdown/types';

interface Props {
  className?: string;
  options: TokenItemType[];
  onChangeTokenValue: (tokenValueStr: string) => void;
  value: string;
  networkMap: Record<string, NetworkJson>;
}

// eslint-disable-next-line no-empty-pattern
function TokenDropdown ({ className = '', networkMap, onChangeTokenValue, options, value }: Props): React.ReactElement {
  const formatOptLabel = useCallback(({ label, networkKey, networkName }: TokenTransformOptionType) => {
    return (
      <TokenItem
        networkKey={networkKey}
        networkName={networkName}
        symbol={label}
      />
    );
  }, []);

  return (
    <div className={className}>
      <Dropdown
        className='input-address__dropdown'
        formatOptLabel={formatOptLabel}
        networkMap={networkMap}
        onChange={onChangeTokenValue}
        options={options}
        value={value}
      />
    </div>
  );
}

export default React.memo(styled(TokenDropdown)(({ theme }: ThemeProps) => `
  `));
