// Copyright 2019-2023 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { AccountJson } from '@polkadot/extension-base/background/types';
import type { IconTheme } from '@polkadot/react-identicon/types';
import type { KeypairType } from '@polkadot/util-crypto/types';
import type { ThemeProps } from '../types';

import { faUsb } from '@fortawesome/free-brands-svg-icons';
import { faCodeBranch, faQrcode } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { MouseEvent, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { Link } from 'react-router-dom';
import styled from 'styled-components';

import details from '../assets/details.svg';
import exportIcon from '../assets/export.svg';
import subAccountIcon from '../assets/subAccount.svg';
import { ALEPH_ZERO_GENESIS_HASH } from '../constants';
import useMetadata from '../hooks/useMetadata';
import useOutsideClick from '../hooks/useOutsideClick';
import useToast from '../hooks/useToast';
import useTranslation from '../hooks/useTranslation';
import { DEFAULT_TYPE } from '../util/defaultType';
import { ellipsisName } from '../util/ellipsisName';
import getParentNameSuri from '../util/getParentNameSuri';
import { recodeAddress, Recoded } from '../util/recodeAddress';
import { Z_INDEX } from '../zindex';
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
  suri?: string;
  toggleActions?: number;
  type?: KeypairType;
  withExport?: boolean;
}

// find an account in our list
function findAccountByAddress(accounts: AccountJson[], _address: string): AccountJson | null {
  return accounts.find(({ address }): boolean => address === _address) || null;
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
  name,
  parentName,
  suri,
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
        <span
          className='name'
          title={displayName}
        >
          {displayName}
        </span>
      </>
    );
  };

  const parentNameSuri = getParentNameSuri(parentName, suri);

  const handleOnClick = useCallback(() => {
    if (!address) {
      return;
    }

    if (actions) {
      onAction(`/account/edit-menu/${address}${isExternal ? '?isExternal=true' : '?isExternal=false'}`);
    }

    if (withExport) {
      onAction(`/account/export/${address}`);
    }
  }, [address, actions, withExport, onAction, isExternal]);

  const onCopy = (_: string, isSuccessful: boolean) => {
    if (isSuccessful) {
      show(t<string>('Public address copied to your clipboard'), 'success');
    }
  };

  const onCopyClickStopPropagation = <T,>(e: MouseEvent<T>) => e.stopPropagation();

  return (
    <div
      className={className}
      onClick={handleOnClick}
    >
      <div className='infoRow'>
        <Identicon
          className='identityIcon'
          iconTheme={theme}
          isExternal={isExternal}
          prefix={prefix}
          value={formatted || address}
        />
        <div className='info'>
          {parentName ? (
            <>
              <div className='name-banner'>
                <FontAwesomeIcon
                  className='deriveIcon'
                  icon={faCodeBranch}
                />
                <div
                  className='parentName'
                  data-field='parent'
                  title={parentNameSuri}
                >
                  <Svg
                    className='subaccount-icon'
                    src={subAccountIcon}
                  />
                  <span>{parentNameSuri}</span>
                </div>
                <div className='displaced'>
                  <Name />
                </div>
              </div>
            </>
          ) : (
            <div data-field='name'>
              <Name />
            </div>
          )}
          {chain?.genesisHash && chain?.genesisHash !== ALEPH_ZERO_GENESIS_HASH && (
            <div
              className='banner chain'
              data-field='chain'
              style={chain.definition.color ? { backgroundColor: chain.definition.color } : undefined}
            >
              {chain.name.replace(' Relay Chain', '')}
            </div>
          )}
          <div className='addressDisplay'>
            <CopyToClipboard
              onCopy={onCopy}
              text={address || ''}
            >
              <div
                className='fullAddress'
                data-field='address'
                onClick={onCopyClickStopPropagation}
              >
                {ellipsisName(formatted || address) || t('<unknown>')}
              </div>
            </CopyToClipboard>
          </div>
        </div>
        {withExport && address && (
          <div
            className='export'
            onClick={_goTo(`/account/export/${address}`)}
          >
            <Svg
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
  ({ actions, theme, withExport }: Props) => `
  border: 1px solid ${theme.boxBorderColor};
  box-sizing: border-box;
  border-radius: 8px;
  position: relative;
  transition: background 0.2s ease;

  :hover {
    background: ${withExport || actions ? theme.menuBackground : 'transparent'};
    cursor: ${actions || withExport ? 'pointer' : 'default'};

    ${Identicon} {
      .icon {
        cursor: pointer;
      }
    }

    .detailsIcon {
      background: ${theme.headerIconBackgroundHover};
    }

    & .infoRow .export {
      color: ${theme.headerIconBackgroundHover};

      .exportIcon {
        background: ${theme.headerIconBackgroundHover};
      }
    }
  }

  .banner {
    font-size: 12px;
    line-height: 16px;
    max-width: 200px;
  }

  .name-banner{
    position: absolute;
    top: 0;
  }
  
  .chain {
    position: absolute;
    bottom: -1px;
    background: ${theme.boxBorderColor};
    border-radius: 8px 0px;
    color: ${theme.subTextColor};
    padding: 2px 8px;
    right: -1px;
    z-index: ${Z_INDEX.ADDRESS};
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
    flex-shrink: 0;
    margin-left: 16px;
    margin-right: 14px;
    width: 50px;

    & svg {
      width: 50px;
      height: 50px;
    }
  }

  .info {
    min-width: 0;
    border-radius: 8px;
  }

  .infoRow {
    min-width: 0;
    flex-grow: 1;
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
      right: 16px;
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100%;
      cursor: pointer;
      transition: 0.2s ease;

      .exportIcon {
        width: 16px;
        height: 16px;
        background: ${theme.primaryColor};
        transition: 0.2s ease;
      }

      :hover {
        color: ${theme.headerIconBackgroundHover};

        .exportIcon {
          background: ${theme.headerIconBackgroundHover};
        }
      }
    }

  }

  img {
    max-width: 50px;
    max-height: 50px;
    border-radius: 50%;
  }

  .name {
    display: block;
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
    color: ${theme.textColor};
    margin-right: 4px;
    max-width: 100%;
  } 

    &.displaced {
      padding-top: 10px;
    }
  }

  .parentName {
    box-sizing: border-box;
    display: flex;
    flex-direction: row;
    justify-content: flex-start;
    align-items: center;
    padding: 2px 4px;
    gap: 8px;
    position: absolute;
    height: 20px;
    top: -6px;
    color: ${theme.labelColor};
    font-size: ${theme.inputLabelFontSize};
    background: ${theme.menuBackground};
    border: 1px solid ${theme.boxBorderColor};
    border-radius: 2px;
    font-weight: 300;
    font-size: 13px;
    line-height: 130%;
    align-items: center;
    letter-spacing: 0.06em;

    .subaccount-icon {
      width: 14px;
      height: 14px;
      background: ${theme.iconNeutralColor};
    }

    span {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      max-width: 150px;
    }
  }

  .fullAddress {
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 162px;
    color: ${theme.subTextColor};
    font-size: 14px;
    line-height: 145%;
    font-weight: 300;
    letter-spacing: 0.07em;
    cursor: copy;
  }

  .detailsIcon {
    background: ${theme.accountDotsIconColor};
    width: 24px;
    height: 24px;

    
    &.active {
      background: ${theme.accountDotsIconColor};
    }

    &:hover {
      background: ${theme.headerIconBackgroundHover};
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
