// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { AccountJson, AccountWithChildren } from '@polkadot/extension-base/background/types';
import type { Chain } from '@polkadot/extension-chains/types';
import type { IconTheme } from '@polkadot/react-identicon/types';
import type { SettingsStruct } from '@polkadot/ui-settings/types';
import type { KeypairType } from '@polkadot/util-crypto/types';
import type { ThemeProps } from '../types';

import { faCodeBranch } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import check from '@polkadot/extension-koni-ui/assets/check.svg';
import Identicon from '@polkadot/extension-koni-ui/components/Identicon';
import { saveCurrentAccountAddress } from '@polkadot/extension-koni-ui/messaging';
import { RootState } from '@polkadot/extension-koni-ui/stores';
import { updateAccount } from '@polkadot/extension-koni-ui/stores/CurrentAccount';
import { decodeAddress, encodeAddress } from '@polkadot/util-crypto';

import useMetadata from '../hooks/useMetadata';
import useOutsideClick from '../hooks/useOutsideClick';
import useToast from '../hooks/useToast';
import useTranslation from '../hooks/useTranslation';
import { DEFAULT_TYPE } from '../util/defaultType';
import getParentNameSuri from '../util/getParentNameSuri';
import { AccountContext, ActionContext, SettingsContext } from './contexts';

export interface Props {
  actions?: React.ReactNode;
  address?: string | null;
  children?: React.ReactNode;
  className?: string;
  genesisHash?: string | null;
  isExternal?: boolean | null;
  isHidden?: boolean;
  name?: string | null;
  parentName?: string | null;
  suri?: string;
  toggleActions?: number;
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

// find an account in our list
function findAccountByAddress (accounts: AccountJson[], _address: string): AccountJson | null {
  return accounts.find(({ address }): boolean =>
    address === _address
  ) || null;
}

// recodes an supplied address using the prefix/genesisHash, include the actual saved account & chain
function recodeAddress (address: string, accounts: AccountWithChildren[], chain: Chain | null, settings: SettingsStruct): Recoded {
  // decode and create a shortcut for the encoded address
  const publicKey = decodeAddress(address);

  // find our account using the actual publicKey, and then find the associated chain
  const account = findSubstrateAccount(accounts, publicKey);
  const prefix = chain ? chain.ss58Format : (settings.prefix === -1 ? 42 : settings.prefix);

  // always allow the actual settings to override the display
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

function Address ({ address, children, className, genesisHash, isExternal, name, parentName, suri, type: givenType }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const [isSelected, setSelected] = useState(false);
  const { accounts } = useContext(AccountContext);
  const settings = useContext(SettingsContext);
  const [{ account, formatted, genesisHash: recodedGenesis, prefix, type }, setRecoded] = useState<Recoded>(defaultRecoded);
  const chain = useMetadata(genesisHash || recodedGenesis, true);
  const [showActionsMenu, setShowActionsMenu] = useState(false);
  const actionsRef = useRef<HTMLDivElement>(null);
  const { show } = useToast();
  const onAction = useContext(ActionContext);
  const currentAccount: AccountJson = useSelector((state: RootState) => state.currentAccount);
  const accountName = name || account?.name;
  const displayName = accountName || t('<unknown>');

  useOutsideClick(actionsRef, () => (showActionsMenu && setShowActionsMenu(!showActionsMenu)));

  useEffect((): void => {
    if (!address) {
      setRecoded(defaultRecoded);

      return;
    }

    const accountByAddress = findAccountByAddress(accounts, address);

    if (currentAccount?.address === address) {
      setSelected(true);
    } else {
      setSelected(false);
    }

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

  const _changeAccount = useCallback(
    () => {
      setSelected(true);

      if (address) {
        const accountByAddress = findAccountByAddress(accounts, address);

        if (accountByAddress) {
          saveCurrentAccountAddress(address).then(() => {
            updateAccount(accountByAddress);
          }).catch((e) => {
            console.error('There is a problem when set Current Account', e);
          });
        } else {
          console.error('There is a problem when change account');
        }
      }

      onAction('/');
    }, []
  );

  const toShortAddress = (_address: string | null, halfLength?: number) => {
    const address = (_address || '').toString();

    const addressLength = halfLength || 7;

    return address.length > 13 ? `${address.slice(0, addressLength)}…${address.slice(-addressLength)}` : address;
  };

  const parentNameSuri = getParentNameSuri(parentName, suri);

  return (
    <div
      className={className}
      onClick={_changeAccount}
    >
      {parentName && (
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
              {toShortAddress(parentNameSuri)}
            </div>
          </div>
        </>
      )
      }
      <div className={`${parentName ? 'infoRow parent-name' : 'infoRow'}`}>
        <div className='infoRow-icon-wrapper'>
          {isSelected
            ? (
              <img
                alt='check'
                src={check}
              />
            )
            : (
              <div className='uncheckedItem' />
            )
          }

          <Identicon
            className='identityIcon'
            iconTheme={theme}
            onCopy={_onCopy}
            prefix={prefix}
            size={32}
            value={formatted || address}
          />
        </div>
        <div className='info'>
          <div
            className='name'
            data-field='name'
          >
            <span title={displayName}>{displayName}</span>
          </div>
          <div className='koni-address-text'>{toShortAddress(formatted, 10)}</div>
          {chain?.genesisHash && (
            <div
              className='banner-chain'
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
        </div>
      </div>
      {children}
    </div>
  );
}

export default styled(Address)(({ theme }: ThemeProps) => `
  box-sizing: border-box;
  position: relative;
  padding: 8px 14px 8px 14px;
  border-radius: 8px;
  margin-top: 8px;
  &:hover {
      background-color: ${theme.accountHoverBackground};
      cursor: pointer;
  }

  .banner {
    position: absolute;
    top: 0;
    left: 93px;

    .parentName {
      font-size: 12px;
      line-height: 16px;
    }
  }

  .banner-chain {
    position: absolute;
    top: 10px;
    background: ${theme.chainBackgroundColor};
    border-radius: 4px;
    color: ${theme.chainTextColor};
    font-size: 15px;
    line-height: 24px;
    padding: 0 8px;
    right: 15px;
    z-index: 1;
    font-weight: 400;
  }

  .addressDisplay {
    display: flex;
    justify-content: space-between;
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

  .koni-address-text {
    color: ${theme.textColor2};
    font-weight: 400;
    font-size: 14px;
  }

  .externalIcon, .hardwareIcon {
    margin-right: 0.3rem;
    color: ${theme.labelColor};
    width: 0.875em;
  }

  .uncheckedItem {
    width: 24px;
  }

  .identityIcon {
    margin-left: 5px;
    margin-right: 10px;
  }

  .info {
    width: 100%;
  }

  .infoRow {
    display: flex;
    justify-content: flex-start;
    align-items: center;

    &.parent-name {
      margin-top: 4px
    }
  }

  .infoRow-icon-wrapper {
    display: flex;
    height: 100%;
    align-items: center;
  }

  .name {
    font-size: 15px;
    line-height: 24px;

    margin: 2px 0;
    overflow: hidden;
    text-overflow: ellipsis;
    width: 150px;
    white-space: nowrap;

    > span {
      font-weight: 500;
    }

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
    color: ${theme.labelColor};
    font-size: 12px;
    line-height: 16px;
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
