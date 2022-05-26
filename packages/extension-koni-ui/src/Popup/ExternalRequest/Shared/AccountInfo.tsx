// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { NetWorkInfo } from '@subwallet/extension-base/background/KoniTypes';
import { AccountJson } from '@subwallet/extension-base/background/types';
import { AccountContext } from '@subwallet/extension-koni-ui/components';
import Identicon from '@subwallet/extension-koni-ui/components/Identicon';
import useTranslation from '@subwallet/extension-koni-ui/hooks/useTranslation';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { getAccountInfoByNetwork } from '@subwallet/extension-koni-ui/util/findAccount';
import { AccountInfoByNetwork } from '@subwallet/extension-koni-ui/util/types';
import CN from 'classnames';
import React, { useCallback, useContext, useMemo } from 'react';
import styled from 'styled-components';

import { IconTheme } from '@polkadot/react-identicon/types';

interface Props extends ThemeProps{
  className?: string;
  address: string;
  network: NetWorkInfo;
}

const AccountInfo = (props: Props) => {
  const { address, className, network } = props;
  const { getAccountByAddress } = useContext(AccountContext);

  const { t } = useTranslation();
  const account = useMemo((): AccountJson | undefined => {
    return getAccountByAddress(address, network.genesisHash);
  }, [getAccountByAddress, address, network.genesisHash]);

  const info = useMemo((): AccountInfoByNetwork => {
    return getAccountInfoByNetwork(address, network);
  }, [address, network]);

  const iconTheme = useMemo(() => {
    return (network.isEthereum
      ? 'ethereum'
      : (network.icon || 'polkadot')
    ) as IconTheme;
  }, [network.icon, network.isEthereum]);

  const toShortAddress = useCallback((_address: string | null, halfLength?: number) => {
    const address = (_address || '').toString();

    const addressLength = halfLength || 7;

    return address.length > 13 ? `${address.slice(0, addressLength)}…${address.slice(-addressLength)}` : address;
  }, []);

  return (
    <div className={CN(className)}>
      <div className='account-info-row'>
        <Identicon
          className='account-info-identity-icon'
          iconTheme={iconTheme}
          prefix={info.networkPrefix}
          size={32}
          value={info.formattedAddress || address}
        />
        <div className='account-info'>
          <div
            className='account-info__name'
            data-field='name'
          >
            <span title={account?.name}>{account?.name}</span>
          </div>
          <div className='account-info-address-display'>
            <div
              className='account-info-full-address'
              data-field='address'
            >
              {toShortAddress(info.formattedAddress || address || t('<unknown>'), 10)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(styled(AccountInfo)(({ theme }: Props) => `
  .account-info-identity-icon {
    border: 2px solid ${theme.checkDotColor};
    margin-right: 10px;
  }

  .account-info {
    width: 100%;
  }

  .account-info-row {
    display: flex;
    flex-direction: row;
    justify-content: flex-start;
    align-items: center;
    height: 72px;
    border-radius: 4px;
  }

  .account-info__name {
    font-size: 15px;
    line-height: 24px;
    font-weight: 500;
    color: ${theme.textColor};
    margin: 2px 0;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 150px;
    white-space: nowrap;

    &.displaced {
      padding-top: 10px;
    }
  }
`));
