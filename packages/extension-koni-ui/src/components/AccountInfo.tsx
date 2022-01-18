// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { AccountJson, AccountWithChildren } from '@polkadot/extension-base/background/types';
import type { Chain } from '@polkadot/extension-chains/types';
import type { IconTheme } from '@polkadot/react-identicon/types';
import type { SettingsStruct } from '@polkadot/ui-settings/types';
import type { KeypairType } from '@polkadot/util-crypto/types';
import type { ThemeProps } from '../types';

import { faUsb } from '@fortawesome/free-brands-svg-icons';
import { faCodeBranch, faQrcode } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { useCallback, useContext, useEffect, useState } from 'react';
import CopyToClipboard from 'react-copy-to-clipboard';
import styled from 'styled-components';

import Identicon from '@polkadot/extension-koni-ui/components/Identicon';
import { decodeAddress, encodeAddress } from '@polkadot/util-crypto';

import cloneLogo from '../assets/clone.svg';
import useMetadata from '../hooks/useMetadata';
import useToast from '../hooks/useToast';
import useTranslation from '../hooks/useTranslation';
import { DEFAULT_TYPE } from '../util/defaultType';
import getParentNameSuri from '../util/getParentNameSuri';
import { AccountContext, SettingsContext } from './contexts';

export interface Props {
  address?: string | null;
  children?: React.ReactNode;
  className?: string;
  genesisHash?: string | null;
  isExternal?: boolean | null;
  isHardware?: boolean | null;
  isHidden?: boolean;
  name?: string | null;
  parentName?: string | null;
  suri?: string;
  type?: KeypairType;
}

interface Recoded {
  account: AccountJson | null;
  formatted: string | null;
  genesisHash?: string | null;
  prefix?: number;
  type: KeypairType;
}

// find an account in our list
function findSubstrateAccount (accounts: AccountJson[], publicKey: Uint8Array): AccountJson | null {
  const pkStr = publicKey.toString();

  return accounts.find(({ address }): boolean =>
    decodeAddress(address).toString() === pkStr
  ) || null;
}

function findAccountByAddress (accounts: AccountJson[], _address: string): AccountJson | null {
  return accounts.find(({ address }): boolean =>
    address === _address
  ) || null;
}

function recodeAddress (address: string, accounts: AccountWithChildren[], chain: Chain | null, settings: SettingsStruct): Recoded {
  const publicKey = decodeAddress(address);
  const account = findSubstrateAccount(accounts, publicKey);
  const prefix = chain ? chain.ss58Format : (settings.prefix === -1 ? 42 : settings.prefix);

  return {
    account,
    formatted: account?.type === 'ethereum'
      ? address
      : encodeAddress(publicKey, prefix),
    genesisHash: account?.genesisHash,
    prefix,
    type: account?.type || DEFAULT_TYPE
  };
}

const defaultRecoded = { account: null, formatted: null, prefix: 42, type: DEFAULT_TYPE };

function AccountInfo ({ address, children, className, genesisHash, isExternal, isHardware, name, parentName, suri, type: givenType }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const { accounts } = useContext(AccountContext);
  const settings = useContext(SettingsContext);
  const [{ account, formatted, genesisHash: recodedGenesis, prefix, type }, setRecoded] = useState<Recoded>(defaultRecoded);
  const chain = useMetadata(genesisHash || recodedGenesis, true);
  const { show } = useToast();

  useEffect((): void => {
    if (!address) {
      setRecoded(defaultRecoded);

      return;
    }

    const accountByAddress = findAccountByAddress(accounts, address);

    setRecoded(
      (
        chain?.definition.chainType === 'ethereum' ||
        accountByAddress?.type === 'ethereum' ||
        (!accountByAddress && givenType === 'ethereum')
      )
        ? { account: accountByAddress, formatted: address, type: 'ethereum' }
        : recodeAddress(address, accounts, chain, settings));
  }, [accounts, address, chain, givenType, settings]);

  const theme = (
    type === 'ethereum'
      ? 'ethereum'
      : (chain?.icon || 'polkadot')
  ) as IconTheme;

  const _onCopy = useCallback(
    () => show(t('Copied')),
    [show, t]
  );

  const Name = () => {
    const accountName = name || account?.name;
    const displayName = accountName || t('<unknown>');

    return (
      <>
        {!!accountName && (account?.isExternal || isExternal) && (
          (account?.isHardware || isHardware)
            ? (
              <FontAwesomeIcon
                className='hardwareIcon'
                icon={faUsb}
                rotation={270}
                title={t('hardware wallet account')}
              />
            )
            : (
              <FontAwesomeIcon
                className='externalIcon'
                icon={faQrcode}
                title={t('external account')}
              />
            )
        )}
        <span title={displayName}>{displayName}</span>
      </>);
  };

  const parentNameSuri = getParentNameSuri(parentName, suri);

  return (
    <div className={className}>
      <div className='infoRow'>
        <Identicon
          className='identityIcon'
          iconTheme={theme}
          isExternal={isExternal}
          prefix={prefix}
          size={48}
          value={formatted || address}
        />
        <div className='info'>
          {parentName
            ? (
              <>
                <div className='banner'>
                  <FontAwesomeIcon
                    className='deriveIcon'
                    icon={faCodeBranch}
                  />
                  <div
                    className='parentName'
                    data-field='parent'
                    title = {parentNameSuri}
                  >
                    {parentNameSuri}
                  </div>
                </div>
                <div className='name displaced'>
                  <Name />
                </div>
              </>
            )
            : (
              <div
                className='name'
                data-field='name'
              >
                <Name />
              </div>
            )
          }
          {chain?.genesisHash && (
            <div
              className='banner chain'
              data-field='chain'
              style={
                chain.definition.color
                  ? { backgroundColor: chain.definition.color }
                  : undefined
              }
            >
              {chain.name.replace(' Relay Chain', '')}
            </div>
          )}
          <div className='addressDisplay'>
            <div
              className='fullAddress'
              data-field='address'
            >
              {formatted || address || t('<unknown>')}
            </div>
            <CopyToClipboard text={(formatted && formatted) || ''}>
              <img
                alt='copy'
                className='account-info-copyIcon'
                onClick={_onCopy}
                src={cloneLogo}
              />
            </CopyToClipboard>
          </div>
        </div>
      </div>
      {children}
    </div>

  );
}

export default styled(AccountInfo)(({ theme }: ThemeProps) => `
  border: 2px solid ${theme.boxBorderColor};
  box-sizing: border-box;
  border-radius: 8px;
  padding: 0 15px 8px 15px;
  position: relative;

  .banner {
    font-size: 12px;
    line-height: 16px;
    position: absolute;
    top: 10px;

    &.chain {
      background: ${theme.chainBackgroundColor};
      border-radius: 4px;
      color: ${theme.chainTextColor};
      font-size: 15px;
      line-height: 24px;
      padding: 0 8px;
      right: 15px;
      z-index: 1;
    }
  }

  .addressDisplay {
    display: flex;
    justify-content: space-between;
    align-items: center;
    position: relative;

    .svg-inline--fa {
      width: 14px;
      height: 14px;
      margin-right: 10px;
      color: ${theme.accountDotsIconColor};
      &:hover {
        color: ${theme.labelColor};
        cursor: pointer;
      }
    }

    .hiddenIcon, .visibleIcon {
      position: absolute;
      right: 2px;
      top: -18px;
    }

    .hiddenIcon {
      color: ${theme.errorColor};
      &:hover {
        color: ${theme.accountDotsIconColor};
      }
    }
  }

  .externalIcon, .hardwareIcon {
    margin-right: 0.3rem;
    color: ${theme.labelColor};
    width: 0.875em;
  }

  .identityIcon {
    margin-right: 10px;
  }

  .info {
    width: 100%;
  }

  .infoRow {
    display: flex;
    flex-direction: row;
    justify-content: flex-start;
    align-items: center;
    height: 72px;
    border-radius: 4px;
  }

  .name {
    font-size: 18px;
    line-height: 30px;
    font-weight: 500;
    color: ${theme.textColor};
    margin: 2px 0;
    overflow: hidden;
    text-overflow: ellipsis;
    width: 300px;
    white-space: nowrap;

    &.displaced {
      padding-top: 10px;
    }
  }

  .parentName {
    color: ${theme.labelColor};
    font-size: ${theme.inputLabelFontSize};
    line-height: 14px;
    overflow: hidden;
    padding: 0.25rem 0 0 0.8rem;
    text-overflow: ellipsis;
    width: 270px;
    white-space: nowrap;
  }

  .fullAddress {
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 225px;
    color: ${theme.textColor2};
    font-size: 15px;
    line-height: 24px;
    font-weight: 400;
  }

  .account-info-copyIcon {
    cursor: pointer;
  }

  .detailsIcon {
    background: ${theme.accountDotsIconColor};
    width: 3px;
    height: 19px;

    &.active {
      background: ${theme.primaryColor};
    }
  }

  .deriveIcon {
    color: ${theme.labelColor};
    position: absolute;
    top: 5px;
    width: 9px;
    height: 9px;
  }

  .movableMenu {
    margin-top: -20px;
    right: 28px;
    top: 0;

    &.isMoved {
      top: auto;
      bottom: 0;
    }
  }

  .settings {
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100%;
    width: 40px;

    &:before {
      content: '';
      position: absolute;
      left: 0;
      top: 25%;
      bottom: 25%;
      width: 1px;
      background: ${theme.boxBorderColor};
    }

    &:hover {
      cursor: pointer;
      background: ${theme.readonlyInputBackground};
    }
  }
`);
