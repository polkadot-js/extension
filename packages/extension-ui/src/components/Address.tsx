// Copyright 2019-2023 @polkadot/extension-ui authors & contributors
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
import React, { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';

import { decodeAddress, encodeAddress } from '@polkadot/util-crypto';

import details from '../assets/details.svg';
import exportIcon from '../assets/export.svg';
import viewOff from '../assets/viewOff.svg';
import useMetadata from '../hooks/useMetadata';
import useOutsideClick from '../hooks/useOutsideClick';
import useToast from '../hooks/useToast';
import useTranslation from '../hooks/useTranslation';
import { showAccount } from '../messaging';
import { DEFAULT_TYPE } from '../util/defaultType';
import { ellipsisName } from '../util/ellipsisName';
import getParentNameSuri from '../util/getParentNameSuri';
import { AccountContext, ActionContext, SettingsContext } from './contexts';
import Identicon from './Identicon';
import Menu from './Menu';
import Svg from './Svg';

export interface Props extends ThemeProps {
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
  showVisibilityAction?: boolean;
  suri?: string;
  toggleActions?: number;
  type?: KeypairType;
  withExport?: boolean;
}

interface Recoded {
  account: AccountJson | null;
  formatted: string | null;
  genesisHash?: string | null;
  prefix?: number;
  type: KeypairType;
}

// find an account in our list
function findSubstrateAccount(accounts: AccountJson[], publicKey: Uint8Array): AccountJson | null {
  const pkStr = publicKey.toString();

  return accounts.find(({ address }): boolean => decodeAddress(address).toString() === pkStr) || null;
}

// find an account in our list
function findAccountByAddress(accounts: AccountJson[], _address: string): AccountJson | null {
  return accounts.find(({ address }): boolean => address === _address) || null;
}

// recodes an supplied address using the prefix/genesisHash, include the actual saved account & chain
function recodeAddress(
  address: string,
  accounts: AccountWithChildren[],
  chain: Chain | null,
  settings: SettingsStruct
): Recoded {
  // decode and create a shortcut for the encoded address
  const publicKey = decodeAddress(address);

  // find our account using the actual publicKey, and then find the associated chain
  const account = findSubstrateAccount(accounts, publicKey);
  const prefix = chain ? chain.ss58Format : settings.prefix === -1 ? 42 : settings.prefix;

  // always allow the actual settings to override the display
  return {
    account,
    formatted: account?.type === 'ethereum' ? address : encodeAddress(publicKey, prefix),
    genesisHash: account?.genesisHash,
    prefix,
    type: account?.type || DEFAULT_TYPE
  };
}

const ACCOUNTS_SCREEN_HEIGHT = 550;
const defaultRecoded = { account: null, formatted: null, prefix: 42, type: DEFAULT_TYPE };

function Address({
  actions,
  address,
  children,
  className,
  genesisHash,
  isExternal,
  isHardware,
  isHidden,
  name,
  parentName,
  suri,
  // showVisibilityAction = false,
  toggleActions,
  type: givenType,
  withExport
}: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const { accounts } = useContext(AccountContext);
  const settings = useContext(SettingsContext);
  const [{ account, formatted, genesisHash: recodedGenesis, prefix, type }, setRecoded] =
    useState<Recoded>(defaultRecoded);
  const chain = useMetadata(genesisHash || recodedGenesis, true);

  const [showActionsMenu, setShowActionsMenu] = useState(false);
  const [moveMenuUp, setIsMovedMenu] = useState(false);
  const actIconRef = useRef<HTMLDivElement>(null);
  const actMenuRef = useRef<HTMLDivElement>(null);
  const { show } = useToast();
  const onAction = useContext(ActionContext);
  const _goTo = useCallback((path: string) => () => onAction(path), [onAction]);

  useOutsideClick([actIconRef, actMenuRef], () => showActionsMenu && setShowActionsMenu(!showActionsMenu));

  useEffect((): void => {
    if (!address) {
      return setRecoded(defaultRecoded);
    }

    const account = findAccountByAddress(accounts, address);

    setRecoded(
      chain?.definition.chainType === 'ethereum' ||
        account?.type === 'ethereum' ||
        (!account && givenType === 'ethereum')
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

  const theme = (type === 'ethereum' ? 'ethereum' : chain?.icon || 'polkadot') as IconTheme;

  const _onClick = useCallback(() => setShowActionsMenu(!showActionsMenu), [showActionsMenu]);

  const _onCopy = useCallback(() => show(t<string>('Public address copied to your clipboard'), 'success'), [show, t]);

  const _toggleVisibility = useCallback((): void => {
    if (address) {
      showAccount(address, isHidden || false).catch(console.error);
    }
  }, [address, isHidden]);

  const Name = () => {
    const accountName = name || account?.name;
    const displayName = accountName || t('<unknown>');

    return (
      <>
        {!!accountName &&
          (account?.isExternal || isExternal) &&
          (account?.isHardware || isHardware ? (
            <FontAwesomeIcon
              className='hardwareIcon'
              icon={faUsb}
              rotation={270}
              title={t('hardware wallet account')}
            />
          ) : (
            <FontAwesomeIcon
              className='externalIcon'
              icon={faQrcode}
              title={t('external account')}
            />
          ))}
        <span title={displayName}>{displayName}</span>
      </>
    );
  };

  const parentNameSuri = getParentNameSuri(parentName, suri);

  const _ellipsisName = useCallback(ellipsisName, [ellipsisName]);

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
          {parentName ? (
            <>
              <div className='banner'>
                <FontAwesomeIcon
                  className='deriveIcon'
                  icon={faCodeBranch}
                />
                <div
                  className='parentName'
                  data-field='parent'
                  title={parentNameSuri}
                >
                  {parentNameSuri}
                </div>
              </div>
              <div className='name displaced'>
                <Name />
              </div>
            </>
          ) : (
            <div
              className='name'
              data-field='name'
            >
              <Name />
            </div>
          )}
          {chain?.genesisHash && (
            <div
              className='banner chain'
              data-field='chain'
              style={chain.definition.color ? { backgroundColor: chain.definition.color } : undefined}
            >
              {chain.name.replace(' Relay Chain', '')}
            </div>
          )}
          <div className='addressDisplay'>
            <div
              className='fullAddress'
              data-field='address'
            >
              {_ellipsisName(formatted) || _ellipsisName(address) || t('<unknown>')}
            </div>
            {isHidden && (
              <img
                className='hiddenIcon'
                onClick={_toggleVisibility}
                src={viewOff}
              />
            )}
          </div>
        </div>
        {withExport && address && (
          <div
            className='export'
            onClick={_goTo(`/account/export/${address}`)}
          >
            <img
              className='exportIcon'
              src={exportIcon}
            />
            {t<string>('Export')}
          </div>
        )}
        {actions && (
          <>
            <Link to={`/account/edit-menu/${address || ''}${isExternal ? '?isExternal=true' : '?isExternal=false'}`}>
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
            </Link>
          </>
        )}
      </div>
      {children}
    </div>
  );
}

export default styled(Address)(
  ({ isHidden, theme }: Props) => `
  border: 1px solid ${theme.boxBorderColor};
  box-sizing: border-box;
  border-radius: 8px;
  margin-bottom: 8px;
  position: relative;

  .banner {
    font-size: 12px;
    line-height: 16px;
    position: absolute;
    top: 0;

    &.chain {
      background: ${theme.primaryColor};
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
      color: ${theme.accountDotsIconColor};
      &:hover {
        cursor: pointer;
      }
    }

    .hiddenIcon, .visibleIcon {
      position: absolute;
      right: 16px;
      top: -8px;
    }
   
    .hiddenIcon {
      color: ${theme.errorColor};
      &:hover {
        cursor: pointer;
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
    margin-left: 16px;
    margin-right: 14px;
    width: 50px;
    opacity: ${isHidden ? 0.6 : 1};

    & svg {
      width: 50px;
      height: 50px;
    }
  }

  .info {
    max-width: 200px;
    border-radius: 8px;
  }

  .infoRow {
    display: flex;
    flex-direction: row;
    justify-content: flex-start;
    align-items: center;
    height: 80px;
    border-radius: 8px;

    .export {
      color: ${theme.primaryColor};
      font-family: ${theme.secondaryFontFamily};
      font-weight: 500;
      font-size: 14px;
      line-height: 135%;
      letter-spacing: 0.06em;
      gap: 8px;
      position: absolute;
      right: 28px;
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100%;
      cursor: pointer;

      .exportIcon {
        width: 16px;
        height: 16px;
      } 
    }

  }

  img {
    max-width: 50px;
    max-height: 50px;
    border-radius: 50%;
  }

  .name {
    font-size: 16px;
    line-height: 125%;
    letter-spacing: 0.06em;
    font-family: ${theme.secondaryFontFamily};
    font-weight: 500;
    margin: 2px 0;
    overflow: hidden;
    text-overflow: ellipsis;
    width: 300px;
    white-space: nowrap;
    color: ${isHidden ? theme.subTextColor : theme.textColor};
    opacity: ${isHidden ? 0.6 : 1};
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
    max-width: 100px;
    color: ${theme.subTextColor};
    font-size: 14px;
    line-height: 145%;
    font-weight: 300;
    letter-spacing: 0.07em;
    opacity: ${isHidden ? 0.5 : 1};}  
  }

  .detailsIcon {
    background: ${theme.accountDotsIconColor};
    width: 24px;
    height: 24px;

    &.active {
      background: ${theme.accountDotsIconColor};
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

    &:hover {
      cursor: pointer;
    }
  }
`
);
