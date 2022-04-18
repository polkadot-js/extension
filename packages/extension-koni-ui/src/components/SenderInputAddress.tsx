// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React, { useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import { useTranslation } from '@polkadot/extension-koni-ui/components/translate';
import { SenderInputAddressType, TokenItemType } from '@polkadot/extension-koni-ui/components/types';
import { RootState } from '@polkadot/extension-koni-ui/stores';
import { ThemeProps } from '@polkadot/extension-koni-ui/types';
import reformatAddress from '@polkadot/extension-koni-ui/util/reformatAddress';

import InputAddress from './InputAddress';
import TokenDropdown from './TokenDropdown';

interface Props {
  className: string;
  setSenderValue: (value: SenderInputAddressType) => void;
}

function getShortenText (text: string, cut = 6) {
  return `${text.slice(0, cut)}…${text.slice(-cut)}`;
}

function SenderInputAddress ({ className = '', setSenderValue }: Props): React.ReactElement {
  const { t } = useTranslation();
  const { chainRegistry: chainRegistryMap,
    currentAccount: { account: currentAccount },
    currentNetwork: { isEthereum, networkKey, networkPrefix } } = useSelector((state: RootState) => state);
  const propSenderId = currentAccount?.address;
  const [value, setInputAddressValue] = useState<string | undefined>(propSenderId);
  let formattedAddress = '';
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

  let defaultValueStr: string;

  if (networkKey === 'all') {
    const defaultValue = options[0];

    defaultValueStr = `${defaultValue.token}|${defaultValue.networkKey}|${defaultValue.isMainToken ? '1' : '0'}`;
  } else {
    const defaultValue = options.find((opt) => opt.networkKey === networkKey);

    defaultValueStr = defaultValue ? `${defaultValue.token}|${defaultValue.networkKey}|${defaultValue.isMainToken ? '1' : '0'}` : '';
  }

  const [tokenValue, setTokenValue] = useState<string>('');

  useEffect(() => {
    setTokenValue(defaultValueStr);
  }, [defaultValueStr]);

  if (value && value !== '-') {
    formattedAddress = reformatAddress(value, networkPrefix, isEthereum);
  }

  const onChangeValue = useCallback((address: string) => {
    const senderInputValue: SenderInputAddressType = {
      address: address,
      token: 'DOT',
      isMainToken: true,
      networkKey: 'polkadot'
    };
    const tokenVal = tokenValue.split('|');

    senderInputValue.token = tokenVal[0];
    senderInputValue.networkKey = tokenVal[1];
    senderInputValue.isMainToken = tokenVal[2] === '1';

    setInputAddressValue(address);
    setSenderValue(senderInputValue);
  }, [setSenderValue, tokenValue]);

  const onChangeTokenValue = useCallback((tokenValueStr: string) => {
    const senderInputValue: SenderInputAddressType = {
      address: value || '',
      token: 'DOT',
      isMainToken: true,
      networkKey: 'polkadot'
    };

    const tokenVal = tokenValueStr.split('|');

    senderInputValue.token = tokenVal[0];
    senderInputValue.networkKey = tokenVal[1];
    senderInputValue.isMainToken = tokenVal[2] === '1';

    setTokenValue(tokenValueStr);
    setSenderValue(senderInputValue);
  }, [setSenderValue, value]);

  return (
    <div className={className}>
      <InputAddress
        className={'sender-input-address'}
        defaultValue={propSenderId}
        help={t<string>('The account you will send funds from.')}
        isEthereum={currentAccount?.type === 'ethereum'}
        isSetDefaultValue={true}
        label={t<string>('Send from account')}
        onChange={onChangeValue}
        setInputAddressValue={setInputAddressValue}
        type='account'
        withEllipsis
      />

      <div className='sender-input-address__balance'>
        1.0000 ACA
      </div>

      <div className='sender-input-address__address'>
        {getShortenText(formattedAddress, 4)}
      </div>

      <TokenDropdown
        className='sender-input-address__token-dropdown'
        onChangeTokenValue={onChangeTokenValue}
        options={options}
        tokenValue={tokenValue}
      />
    </div>
  );
}

export default styled(SenderInputAddress)(({ theme }: ThemeProps) => `
  border: 2px solid ${theme.boxBorderColor};
  height: 72px;
  border-radius: 8px;
  position: relative;
  margin-bottom: 10px;

  .sender-input-address__address {
    position: absolute;
    font-size: 15px;
    line-height: 26px;
    color: ${theme.textColor2};
    z-index: 10;
    right: 80px;
    top: 32px;
    pointer-events: none;
  }

  .sender-input-address__balance {
    position: absolute;
    font-size: 15px;
    line-height: 26px;
    color: ${theme.textColor2};
    z-index: 10;
    right: 80px;
    top: 8px;
    pointer-events: none;
  }

  .sender-input-address__token-dropdown {
    position: absolute;
    top: 0;
    right: 0;
    width: 72px;
    height: 72px;
  }
`);
