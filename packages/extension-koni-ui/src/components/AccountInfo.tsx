// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { IconTheme } from '@polkadot/react-identicon/types';
import type { KeypairType } from '@polkadot/util-crypto/types';
import type { Recoded, ThemeProps } from '../types';

import { faUsb } from '@fortawesome/free-brands-svg-icons';
import { faCodeBranch, faQrcode } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { NetworkJson } from '@subwallet/extension-base/background/KoniTypes';
import cloneLogo from '@subwallet/extension-koni-ui/assets/clone.svg';
import Identicon from '@subwallet/extension-koni-ui/components/Identicon';
import { RootState } from '@subwallet/extension-koni-ui/stores';
import { accountAllRecoded, defaultRecoded, isAccountAll, recodeAddress } from '@subwallet/extension-koni-ui/util';
import Avatar from 'boring-avatars';
import React, { useCallback, useContext, useEffect, useState } from 'react';
import CopyToClipboard from 'react-copy-to-clipboard';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import { AccountContext } from '../contexts';
import useToast from '../hooks/useToast';
import useTranslation from '../hooks/useTranslation';
import getParentNameSuri from '../util/getParentNameSuri';

export interface Props {
  address?: string | null;
  className?: string;
  genesisHash?: string | null;
  isExternal?: boolean | null;
  isHardware?: boolean | null;
  name?: string | null;
  parentName?: string | null;
  suri?: string;
  showCopyBtn?: boolean
  type?: KeypairType;
  isShowAddress?: boolean;
  isShowBanner?: boolean;
  iconSize?: number;
  isEthereum?: boolean;
  addressHalfLength?: number;
}

function AccountInfo ({ address, addressHalfLength, className, genesisHash, iconSize = 32, isEthereum, isExternal, isHardware, isShowAddress = true, isShowBanner = true, name, parentName, showCopyBtn = true, suri, type: givenType }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const { accounts } = useContext(AccountContext);
  const [{ account,
    formatted,
    genesisHash: recodedGenesis,
    isEthereum: _isEthereum,
    prefix }, setRecoded] = useState<Recoded>(defaultRecoded);
  const networkMap = useSelector((state: RootState) => state.networkMap);
  const { show } = useToast();
  const accountName = name || account?.name;
  const displayName = accountName || t('<unknown>');
  const { settings: { accountAllLogo } } = useSelector((state: RootState) => state);
  const randomVariant = window.localStorage.getItem('randomVariant') as 'beam' | 'marble' | 'pixel' | 'sunset' | 'ring';
  const randomNameForLogo = window.localStorage.getItem('randomNameForLogo') as string;
  const _isAccountAll = address && isAccountAll(address);

  const getNetworkInfoByGenesisHash = useCallback((hash?: string | null): NetworkJson | null => {
    if (!hash) {
      return null;
    }

    for (const n in networkMap) {
      if (!Object.prototype.hasOwnProperty.call(networkMap, n)) {
        continue;
      }

      const networkInfo = networkMap[n];

      if (networkInfo.genesisHash === hash) {
        return networkInfo;
      }
    }

    return null;
  }, [networkMap]);

  const networkInfo = getNetworkInfoByGenesisHash(genesisHash || recodedGenesis);

  useEffect((): void => {
    if (!address) {
      setRecoded(defaultRecoded);

      return;
    }

    if (_isAccountAll) {
      setRecoded(accountAllRecoded);

      return;
    }

    setRecoded(recodeAddress(address, accounts, networkInfo, givenType));
  }, [accounts, _isAccountAll, address, networkInfo, givenType]);

  const iconTheme = ((!!isEthereum || _isEthereum) ? 'ethereum' : (networkInfo?.icon || 'polkadot')) as IconTheme;

  const _onCopy = useCallback(
    () => show(t('Copied')),
    [show, t]
  );

  const toShortAddress = (_address: string | null, halfLength?: number) => {
    const address = (_address || '').toString();

    const addressLength = halfLength || 7;

    if (address.length > addressLength * 2) {
      return address;
    }

    return address.length > 13 ? `${address.slice(0, addressLength)}…${address.slice(-addressLength)}` : address;
  };

  const Name = () => {
    return (
      <>
        {!!accountName && (account?.isExternal || isExternal) && (
          (account?.isHardware || isHardware)
            ? (
              <FontAwesomeIcon
                className='hardwareIcon'
                // @ts-ignore
                icon={faUsb}
                rotation={270}
                title={t('hardware wallet account')}
              />
            )
            : (
              <FontAwesomeIcon
                className='externalIcon'
                // @ts-ignore
                icon={faQrcode}
                title={t('external account')}
              />
            )
        )}
        <span title={displayName}>{_isAccountAll ? t<string>('All Accounts') : displayName}</span>
      </>);
  };

  const parentNameSuri = getParentNameSuri(parentName, suri);

  return (
    <div className={className}>
      <div className='account-info-row'>
        {_isAccountAll
          ? accountAllLogo
            ? <img
              alt='all-account-icon'
              className='account-info__all-account-icon'
              src={accountAllLogo}
            />
            : <div className='account-info__all-account-icon'>
              <Avatar
                colors={['#5F545C', '#EB7072', '#F5BA90', '#F5E2B8', '#A2CAA5']}
                name={randomNameForLogo}
                size={34}
                variant={randomVariant}
              />
            </div>
          : <Identicon
            className='account-info-identity-icon'
            iconTheme={iconTheme}
            isExternal={isExternal}
            prefix={prefix}
            size={iconSize}
            value={formatted || address}
          />}
        <div className='account-info'>
          {parentName
            ? (
              <>
                <div className='account-info-derive-name'>
                  <FontAwesomeIcon
                    className='account-info-derive-icon'
                    // @ts-ignore
                    icon={faCodeBranch}
                  />
                  <div
                    className='account-info-parent-name'
                    data-field='parent'
                    title={parentNameSuri}
                  >
                    {parentNameSuri}
                  </div>
                </div>
                <div className='account-info__name displaced'>
                  <Name />
                </div>
              </>
            )
            : (
              <div
                className='account-info__name'
                data-field='name'
              >
                <Name />
              </div>
            )
          }
          {networkInfo?.genesisHash && isShowBanner && (
            <div
              className='account-info-banner account-info-chain'
              data-field='chain'
            >
              {networkInfo.chain.replace(' Relay Chain', '')}
            </div>
          )}
          <div className='account-info-address-display'>
            {isShowAddress && <div
              className='account-info-full-address'
              data-field='address'
            >
              {_isAccountAll ? t<string>('All Accounts') : toShortAddress(formatted || address || t('<unknown>'), addressHalfLength)}
            </div>}
            {showCopyBtn && <CopyToClipboard text={(formatted && formatted) || ''}>
              <img
                alt='copy'
                className='account-info-copy-icon'
                onClick={_onCopy}
                src={cloneLogo}
              />
            </CopyToClipboard>}
          </div>
        </div>
      </div>
    </div>

  );
}

export default styled(AccountInfo)(({ theme }: ThemeProps) => `
  .account-info-banner {
    font-size: 12px;
    line-height: 16px;
    position: absolute;
    top: 10px;

    &.account-info-chain {
      background: ${theme.chainBackgroundColor};
      border-radius: 4px;
      color: ${theme.chainTextColor};
      font-size: 15px;
      line-height: 24px;
      padding: 0 8px;
      right: 15px;
      z-index: 1;
      text-overflow: ellipsis;
      overflow: hidden;
      max-width: 100px;
      white-space: nowrap;
    }
  }

  .account-info-derive-name {
    font-size: 12px;
    line-height: 16px;
    position: absolute;
    top: 0;
  }

  .account-info-address-display {
    display: flex;
    justify-content: space-between;
    align-items: center;
    position: relative;
  }

  .account-info__all-account-icon {
    width: 40px;
    min-width: 40px;
    height: 40px;
    border: 2px solid ${theme.checkDotColor};
    margin-right: 10px;
    padding: 2px;
    border-radius: 50%;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .account-info-address-display .svg-inline--fa {
    width: 14px;
    height: 14px;
    margin-right: 10px;
    color: ${theme.accountDotsIconColor};
    &:hover {
      color: ${theme.labelColor};
      cursor: pointer;
    }
  }

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

  .account-info-parent-name {
    position: absolute;
    color: ${theme.labelColor};
    overflow: hidden;
    padding: 2px 0 0 0.8rem;
    text-overflow: ellipsis;
    width: 270px;
    white-space: nowrap;
  }

  .account-info-full-address {
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 225px;
    color: ${theme.textColor2};
    font-size: 14px;
    line-height: 24px;
    font-weight: 400;
  }

  .account-info-copy-icon {
    cursor: pointer;
  }

  .account-info-derive-icon {
    color: ${theme.labelColor};
    position: absolute;
    top: 5px;
    width: 9px;
    height: 9px;
  }

  .externalIcon, .hardwareIcon {
    margin-right: 0.3rem;
    color: ${theme.labelColor};
    width: 0.875em;
  }
`);
