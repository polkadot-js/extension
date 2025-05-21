// Copyright 2019-2025 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { AccountJson, AccountWithChildren } from '@polkadot/extension-base/background/types';
import type { Chain } from '@polkadot/extension-chains/types';
import type { IconTheme } from '@polkadot/react-identicon/types';
import type { SettingsStruct } from '@polkadot/ui-settings/types';
import type { KeypairType } from '@polkadot/util-crypto/types';

import { faUsb } from '@fortawesome/free-brands-svg-icons';
import { faCopy, faEye, faEyeSlash } from '@fortawesome/free-regular-svg-icons';
import { faCodeBranch, faQrcode } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { useCallback, useContext, useEffect, useRef, useState } from 'react';
import CopyToClipboard from 'react-copy-to-clipboard';

import { decodeAddress, encodeAddress } from '@polkadot/util-crypto';

import details from '../assets/details.svg';
import { useMetadata, useOutsideClick, useToast, useTranslation } from '../hooks/index.js';
import { showAccount } from '../messaging.js';
import { styled } from '../styled.js';
import { DEFAULT_TYPE } from '../util/defaultType.js';
import getParentNameSuri from '../util/getParentNameSuri.js';
import { AccountContext, SettingsContext } from './contexts.js';
import Identicon from './Identicon.js';
import Menu from './Menu.js';
import Svg from './Svg.js';

export interface Props {
  actions?: React.ReactNode;
  address?: string | null;
  children?: React.ReactNode;
  className?: string;
  genesisHash?: string | null;
  isExternal?: boolean | null;
  isHardware?: boolean | null;
  isHidden?: boolean;
  name?: string | null;
  parentName?: string | null;
  showVisibilityAction?: boolean
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

const ACCOUNTS_SCREEN_HEIGHT = 550;
const defaultRecoded = { account: null, formatted: null, prefix: 42, type: DEFAULT_TYPE };

function Address ({ actions, address, children, className, genesisHash, isExternal, isHardware, isHidden, name, parentName, showVisibilityAction = false, suri, toggleActions, type: givenType }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const { accounts } = useContext(AccountContext);
  const settings = useContext(SettingsContext);
  const [{ account, formatted, genesisHash: recodedGenesis, prefix, type }, setRecoded] = useState<Recoded>(defaultRecoded);
  const chain = useMetadata(genesisHash || recodedGenesis, true);

  const [showActionsMenu, setShowActionsMenu] = useState(false);
  const [moveMenuUp, setIsMovedMenu] = useState(false);
  const actIconRef = useRef<HTMLDivElement>(null);
  const actMenuRef = useRef<HTMLDivElement>(null);
  const { show } = useToast();

  useOutsideClick([actIconRef, actMenuRef], () => (showActionsMenu && setShowActionsMenu(!showActionsMenu)));

  useEffect((): void => {
    if (!address) {
      return setRecoded(defaultRecoded);
    }

    const account = findAccountByAddress(accounts, address);

    setRecoded(
      (
        chain?.definition.chainType === 'ethereum' ||
        account?.type === 'ethereum' ||
        (!account && givenType === 'ethereum')
      )
        ? { account, formatted: address, type: 'ethereum' }
        : recodeAddress(address, accounts, chain, settings)
    );
  }, [accounts, address, chain, givenType, settings]);

  useEffect(() => {
    if (!showActionsMenu) {
      setIsMovedMenu(false);
    } else if (actMenuRef.current) {
      const { bottom } = actMenuRef.current.getBoundingClientRect();

      if (bottom > ACCOUNTS_SCREEN_HEIGHT) {
        setIsMovedMenu(true);
      }
    }
  }, [showActionsMenu]);

  useEffect((): void => {
    setShowActionsMenu(false);
  }, [toggleActions]);

  const theme = (
    type === 'ethereum'
      ? 'ethereum'
      : (chain?.icon || 'polkadot')
  ) as IconTheme;

  const _onClick = useCallback(
    () => setShowActionsMenu(!showActionsMenu),
    [showActionsMenu]
  );

  const _onCopy = useCallback(
    () => show(t('Copied')),
    [show, t]
  );

  const _toggleVisibility = useCallback(
    (): void => {
      address && showAccount(address, isHidden || false).catch(console.error);
    },
    [address, isHidden]
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
          onCopy={_onCopy}
          prefix={prefix}
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
          {chain?.genesisHash && chain?.name && (
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
              <FontAwesomeIcon
                className='copyIcon'
                icon={faCopy}
                onClick={_onCopy}
                size='sm'
                title={t('copy address')}
              />
            </CopyToClipboard>
            {(actions || showVisibilityAction) && (
              <FontAwesomeIcon
                className={isHidden ? 'hiddenIcon' : 'visibleIcon'}
                icon={isHidden ? faEyeSlash : faEye}
                onClick={_toggleVisibility}
                size='sm'
                title={t('account visibility')}
              />
            )}
          </div>
        </div>
        {actions && (
          <>
            <div
              className='settings'
              onClick={_onClick}
              ref={actIconRef}
            >
              <Svg
                className={`detailsIcon ${showActionsMenu ? 'active' : ''}`}
                src={details}
              />
            </div>
            {showActionsMenu && (
              <Menu
                className={`movableMenu ${moveMenuUp ? 'isMoved' : ''}`}
                reference={actMenuRef}
              >
                {actions}
              </Menu>
            )}
          </>
        )}
      </div>
      {children}
    </div>
  );
}

export default styled(Address)<Props>`
  background: var(--boxBackground);
  border: 1px solid var(--boxBorderColor);
  box-sizing: border-box;
  border-radius: 4px;
  margin-bottom: 8px;
  position: relative;

  .banner {
    font-size: 12px;
    line-height: 16px;
    position: absolute;
    top: 0;

    &.chain {
      background: var(--primaryColor);
      border-radius: 0 0 0 10px;
      color: white;
      padding: 0.1rem 0.5rem 0.1rem 0.75rem;
      right: 0;
      z-index: 1;
    }
  }

  .addressDisplay {
    display: flex;
    justify-content: space-between;
    position: relative;

    .svg-inline--fa {
      width: 14px;
      height: 14px;
      margin-right: 10px;
      color: var(--accountDotsIconColor);
      &:hover {
        color: var(--labelColor);
        cursor: pointer;
      }
    }

    .hiddenIcon, .visibleIcon {
      position: absolute;
      right: 2px;
      top: -18px;
    }

    .hiddenIcon {
      color: var(--errorColor);
      &:hover {
        color: var(--accountDotsIconColor);
      }
    }
  }

  .externalIcon, .hardwareIcon {
    margin-right: 0.3rem;
    color: var(--labelColor);
    width: 0.875em;
  }

  .identityIcon {
    margin-left: 15px;
    margin-right: 10px;

    & svg {
      width: 50px;
      height: 50px;
    }
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

  img {
    max-width: 50px;
    max-height: 50px;
    border-radius: 50%;
  }

  .name {
    font-size: 16px;
    line-height: 22px;
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
    color: var(--labelColor);
    font-size: var(--inputLabelFontSize);
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
    color: var(--labelColor);
    font-size: 12px;
    line-height: 16px;
  }

  .detailsIcon {
    background: var(--accountDotsIconColor);
    width: 3px;
    height: 19px;

    &.active {
      background: var(--primaryColor);
    }
  }

  .deriveIcon {
    color: var(--labelColor);
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
      background: var(--boxBorderColor);
    }

    &:hover {
      cursor: pointer;
      background: var(--readonlyInputBackground);
    }
  }
`;
