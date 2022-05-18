// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ChainRegistry, NetworkJson } from '@subwallet/extension-base/background/KoniTypes';
import FormatBalance from '@subwallet/extension-koni-ui/components/FormatBalance';
import { useTranslation } from '@subwallet/extension-koni-ui/components/translate';
import { SenderInputAddressType, TokenItemType } from '@subwallet/extension-koni-ui/components/types';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { toShort } from '@subwallet/extension-koni-ui/util';
import reformatAddress from '@subwallet/extension-koni-ui/util/reformatAddress';
import React, { useCallback, useMemo, useState } from 'react';
import styled from 'styled-components';

import InputAddress from './InputAddress';
import TokenDropdown from './TokenDropdown';

interface Props {
  className: string;
  onChange: (value: SenderInputAddressType) => void;
  initValue: SenderInputAddressType;
  chainRegistryMap: Record<string, ChainRegistry>;
  balance: string;
  balanceFormat: [number, string];
  isDonation?: boolean;
  networkMap: Record<string, NetworkJson>;
}

function getOptions (chainRegistryMap: Record<string, ChainRegistry>): TokenItemType[] {
  const options: TokenItemType[] = [];

  Object.keys(chainRegistryMap).forEach((networkKey) => {
    Object.keys(chainRegistryMap[networkKey].tokenMap).forEach((token) => {
      const tokenInfo = chainRegistryMap[networkKey].tokenMap[token];

      options.push({
        networkKey: networkKey,
        token: tokenInfo.symbol,
        decimals: tokenInfo.decimals,
        isMainToken: tokenInfo.isMainToken,
        specialOption: tokenInfo?.specialOption
      });
    });
  });

  return options;
}

function SenderInputAddress ({ balance, balanceFormat, chainRegistryMap, className = '', initValue, isDonation, networkMap, onChange }: Props): React.ReactElement {
  const { t } = useTranslation();
  const [{ address, networkKey, token }, setValue] = useState<SenderInputAddressType>(initValue);

  const networkPrefix = networkMap[networkKey].ss58Format;

  const formattedAddress = useMemo<string>(() => {
    return reformatAddress(address, networkPrefix);
  }, [address, networkPrefix]);

  const options: TokenItemType[] = getOptions(chainRegistryMap);

  const onChangeInputAddress = useCallback((address: string | null) => {
    if (address) {
      setValue((prev) => {
        const newVal = {
          ...prev,
          address
        };

        onChange(newVal);

        return newVal;
      });
    } else {
      // handle null case
    }
  }, [onChange]);

  const onChangeTokenValue = useCallback((tokenValueStr: string) => {
    const tokenVal = tokenValueStr.split('|');

    setValue((prev) => {
      const newVal = {
        ...prev,
        token: tokenVal[0],
        networkKey: tokenVal[1]
      };

      onChange(newVal);

      return newVal;
    });
  }, [onChange]);

  return (
    <div className={className}>
      <InputAddress
        className={'sender-input-address'}
        defaultValue={initValue.address}
        help={t<string>(isDonation ? 'The account you will donate from.' : 'The account you will send funds from.')}
        isSetDefaultValue={true}
        label={t<string>(isDonation ? 'Donate from account' : 'Send from account')}
        networkPrefix={networkPrefix}
        onChange={onChangeInputAddress}
        type='account'
        withEllipsis
      />

      <div className='sender-input-address__balance'>
        <FormatBalance
          format={balanceFormat}
          value={balance}
        />
      </div>

      <div className='sender-input-address__address'>
        {toShort(formattedAddress, 4, 4)}
      </div>

      <TokenDropdown
        className='sender-input-address__token-dropdown'
        networkMap={networkMap}
        onChangeTokenValue={onChangeTokenValue}
        options={options}
        value={`${token}|${networkKey}`}
      />
    </div>
  );
}

export default styled(SenderInputAddress)(({ theme }: ThemeProps) => `
  position: relative;
  margin-bottom: 10px;

  .sender-input-address__address {
    position: absolute;
    font-size: 14px;
    line-height: 26px;
    color: ${theme.textColor2};
    right: 70px;
    top: 36px;
    pointer-events: none;
  }

  .sender-input-address .key-pair__address {
    display: none;
  }

  .sender-input-address__balance {
    position: absolute;
    font-size: 15px;
    line-height: 26px;
    color: ${theme.textColor2};
    right: 70px;
    top: 8px;
    pointer-events: none;
  }

  .sender-input-address__token-dropdown {
    position: absolute;
    top: 0;
    right: 0;
    height: 72px;
  }

  .sender-input-address {
    .input-address-dropdown__input {
      width: 180px !important;
    }
  }

  .format-balance__value {
    font-weight: 400;
    font-size: 14px;
    color: ${theme.textColor};
  }

  .format-balance__postfix {
    color: ${theme.textColor2};
  }
`);
