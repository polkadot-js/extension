// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { ThemeProps } from '../../types';

import { faChevronDown } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import styled, { ThemeContext } from 'styled-components';

import { CurrentNetworkInfo } from '@polkadot/extension-base/background/KoniTypes';
import allAccountLogo from '@polkadot/extension-koni-ui/assets/all-account-icon.svg';
import ExpandDarkIcon from '@polkadot/extension-koni-ui/assets/icon/expand-dark.svg';
import ExpandLightIcon from '@polkadot/extension-koni-ui/assets/icon/expand-light.svg';
import { AccountContext, Link } from '@polkadot/extension-koni-ui/components';
import Identicon from '@polkadot/extension-koni-ui/components/Identicon';
import NetworkMenu from '@polkadot/extension-koni-ui/components/NetworkMenu';
import useGenesisHashOptions from '@polkadot/extension-koni-ui/hooks/useGenesisHashOptions';
import useIsPopup from '@polkadot/extension-koni-ui/hooks/useIsPopup';
import useMetadata from '@polkadot/extension-koni-ui/hooks/useMetadata';
import { showAccount, tieAccount, windowOpen } from '@polkadot/extension-koni-ui/messaging';
import AccountMenuSettings from '@polkadot/extension-koni-ui/partials/AccountMenuSettings';
import DetailHeader from '@polkadot/extension-koni-ui/partials/Header/DetailHeader';
import SubHeader from '@polkadot/extension-koni-ui/partials/Header/SubHeader';
import { RootState, store } from '@polkadot/extension-koni-ui/stores';
import { accountAllRecoded, isAccountAll } from '@polkadot/extension-koni-ui/util';
import { getLogoByGenesisHash } from '@polkadot/extension-koni-ui/util/logoByGenesisHashMap';
import reformatAddress from '@polkadot/extension-koni-ui/util/reformatAddress';
import { IconTheme } from '@polkadot/react-identicon/types';

import defaultAvatar from '../../assets/default-avatar.svg';
import logo from '../../assets/sub-wallet-logo.svg';
import useOutsideClick from '../../hooks/useOutsideClick';
import { Theme } from '../../types';

interface Props extends ThemeProps {
  children?: React.ReactNode;
  className?: string;
  showAdd?: boolean;
  showBackArrow?: boolean;
  showSearch?: boolean;
  showSettings?: boolean;
  smallMargin?: boolean;
  text?: React.ReactNode;
  isContainDetailHeader: boolean;
  showSubHeader?: boolean;
  subHeaderName?: string;
  showCancelButton?: boolean;
  isWelcomeScreen?: boolean;
  isShowZeroBalances?: boolean;
  toggleZeroBalances?: () => void;
  changeAccountCallback?: (address: string) => void;
}

function updateCurrentNetwork (currentNetwork: CurrentNetworkInfo): void {
  store.dispatch({ type: 'currentNetwork/update', payload: currentNetwork });
}

function Header ({ changeAccountCallback, children, className = '', isContainDetailHeader, isShowZeroBalances, isWelcomeScreen, showBackArrow, showCancelButton, showSubHeader, smallMargin = false, subHeaderName, toggleZeroBalances }: Props): React.ReactElement<Props> {
  const [isSettingsOpen, setShowSettings] = useState(false);
  const [isActionOpen, setShowAccountAction] = useState(false);
  const [isNetworkSelectOpen, setShowNetworkSelect] = useState(false);
  const currentAccount = useSelector((state: RootState) => state.currentAccount.account);
  const { isEthereum, networkPrefix } = useSelector((state: RootState) => state.currentNetwork);
  const [localGenesisHash, setLocalGenesisHash] = useState<string>('');
  const { accounts } = useContext(AccountContext);
  const genesisOptions = useGenesisHashOptions();
  const chain = useMetadata(currentAccount?.genesisHash, true);
  const [formattedAddress, setFormattedAddress] = useState<string | null>(null);
  const themeContext = useContext(ThemeContext as React.Context<Theme>);
  const popupTheme = themeContext.id;
  const setRef = useRef(null);
  const actionsRef = useRef(null);
  const netRef = useRef(null);
  const isPopup = useIsPopup();

  const _onWindowOpen = useCallback(
    () => windowOpen('/').catch(console.error),
    []
  );

  const _isAccountAll = currentAccount && isAccountAll(currentAccount.address);

  useEffect((): void => {
    if (!currentAccount) {
      return;
    }

    if (!currentAccount.address) {
      setFormattedAddress(null);

      return;
    }

    if (isAccountAll(currentAccount.address)) {
      setFormattedAddress(accountAllRecoded.formatted);

      return;
    }

    const formattedAddress = reformatAddress(currentAccount.address, networkPrefix, isEthereum);

    setFormattedAddress(formattedAddress);
  }, [accounts, currentAccount, currentAccount?.address, networkPrefix, isEthereum]);

  useEffect(() => {
    let isSync = true;

    if (_isAccountAll) {
      let networkSelected;

      const accountAllNetworkGenesisHash = window.localStorage.getItem('accountAllNetworkGenesisHash');

      if (!accountAllNetworkGenesisHash) {
        networkSelected = genesisOptions[0];
      } else {
        networkSelected = genesisOptions.find((opt) => opt.value === accountAllNetworkGenesisHash);

        if (!networkSelected) {
          window.localStorage.setItem('accountAllNetworkGenesisHash', '');
          networkSelected = genesisOptions[0];
        }
      }

      if (networkSelected) {
        updateCurrentNetwork({
          networkPrefix: networkSelected.networkPrefix,
          icon: networkSelected.icon,
          genesisHash: networkSelected.value,
          networkKey: networkSelected.networkKey,
          isEthereum: networkSelected.isEthereum
        });

        setLocalGenesisHash(networkSelected.value);
      }

      return;
    }

    (async () => {
      let networkSelected;

      if (!currentAccount || !currentAccount?.genesisHash) {
        networkSelected = genesisOptions[0];
      } else {
        networkSelected = genesisOptions.find((opt) => opt.value === currentAccount.genesisHash);

        if (!networkSelected) {
          await tieAccount(currentAccount.address, null);
          networkSelected = genesisOptions[0];
        }
      }

      if (isSync && networkSelected) {
        updateCurrentNetwork({
          networkPrefix: networkSelected.networkPrefix,
          icon: networkSelected.icon,
          genesisHash: networkSelected.value,
          networkKey: networkSelected.networkKey,
          isEthereum: networkSelected.isEthereum
        });

        setLocalGenesisHash(networkSelected.value);
      }
    })();

    return () => {
      isSync = false;
    };
  }, [currentAccount, currentAccount?.genesisHash, _isAccountAll, accounts, genesisOptions]);

  const getNetworkKey = useCallback(
    (genesisHash: string) => {
      let networkKey = '';

      if (currentAccount) {
        genesisHash = genesisHash || '';
        const currentNetwork = genesisOptions.find((opt) => opt.value === genesisHash);

        networkKey = currentNetwork ? currentNetwork.text : '';
      }

      return networkKey;
    }, [currentAccount, genesisOptions]
  );

  const _toggleZeroBalances = useCallback(
    (): void => {
      toggleZeroBalances && toggleZeroBalances();
      setShowAccountAction(false);
    },
    [toggleZeroBalances]
  );

  const theme = (
    currentAccount?.type === 'ethereum'
      ? 'ethereum'
      : (chain?.icon || 'polkadot')
  ) as IconTheme;

  const _onChangeGenesis = useCallback(
    async (genesisHash: string, networkPrefix: number, icon: string, networkKey: string, isEthereum: boolean): Promise<void> => {
      if (currentAccount) {
        if (!isAccountAll(currentAccount.address)) {
          await tieAccount(currentAccount.address, genesisHash || null);
        } else {
          window.localStorage.setItem('accountAllNetworkGenesisHash', genesisHash);
        }

        updateCurrentNetwork({
          networkPrefix,
          icon,
          genesisHash,
          networkKey,
          isEthereum
        });

        setLocalGenesisHash(genesisHash);
      }

      setShowNetworkSelect(false);
    },
    [currentAccount]
  );

  useOutsideClick(setRef, (): void => {
    isSettingsOpen && setShowSettings(false);
  });

  useOutsideClick(actionsRef, (): void => {
    isActionOpen && setShowAccountAction(!isActionOpen);
  });

  useOutsideClick(netRef, (): void => {
    isNetworkSelectOpen && setShowNetworkSelect(!isNetworkSelectOpen);
  });

  const _toggleSettings = useCallback(
    (): void => {
      setShowSettings((isSettingsOpen) => !isSettingsOpen);
    },
    []
  );

  const _toggleNetwork = useCallback(
    (): void => {
      setShowNetworkSelect(!isNetworkSelectOpen);
    },
    [isNetworkSelectOpen]
  );

  const _toggleVisibility = useCallback(
    () => currentAccount?.address && showAccount(currentAccount?.address, currentAccount?.isHidden || false).catch(console.error),
    [currentAccount?.address, currentAccount?.isHidden]
  );

  return (
    <div className={`${className} ${smallMargin ? 'smallMargin' : ''}`}>
      <div className='container'>
        <div className='top-container'>
          <div className='branding'>
            <Link
              className='sub-wallet-logo'
              title={'SubWallet'}
              to={'/'}
            >
              <img
                className='logo'
                src={logo}
              />
            </Link>
          </div>
          <div className='koni-header-right-content'>
            {isPopup && (<div
              className={'kn-l-expand-btn'}
              onClick={_onWindowOpen}
            >
              <img
                alt='Expand Icon'
                className='kn-l-expand-btn__icon'
                src={popupTheme === 'dark' ? ExpandLightIcon : ExpandDarkIcon}
              />
            </div>)}
            <div
              className={`network-select-item ${isNetworkSelectOpen ? 'pointer-events-none' : ''}`}
              onClick={_toggleNetwork}
            >
              <img
                alt='logo'
                className={'network-logo'}
                src={getLogoByGenesisHash(localGenesisHash)}
              />
              <div className='network-select-item__text'>
                {getNetworkKey(localGenesisHash) || genesisOptions[0].text}
              </div>
              <FontAwesomeIcon
                className='network-select-item__icon'
                icon={faChevronDown}
                size='sm'
              />
            </div>

            {!isWelcomeScreen && (
              <div
                className={`setting-icon-wrapper ${isSettingsOpen ? 'pointer-events-none' : ''}`}
                onClick={_toggleSettings}
              >
                {!!currentAccount && !!currentAccount.address
                  ? _isAccountAll
                    ? <img
                      alt='all-account-icon'
                      className='header__all-account-icon'
                      src={allAccountLogo}
                    />
                    : (
                      <Identicon
                        className='identityIcon'
                        genesisHash={localGenesisHash}
                        iconTheme={theme}
                        prefix={networkPrefix}
                        showLogo
                        size={48}
                        value={formattedAddress || currentAccount?.address}
                      />
                    )
                  : (
                    <img
                      alt='default-img'
                      className='default-avatar'
                      src={defaultAvatar}
                    />
                  )
                }
              </div>
            )}
          </div>

          {isNetworkSelectOpen && (
            <NetworkMenu
              currentNetwork={localGenesisHash}
              reference={netRef}
              selectNetwork={_onChangeGenesis}
            />
          )}

          {isSettingsOpen && (
            <AccountMenuSettings
              changeAccountCallback={changeAccountCallback}
              className='account-menu-setting'
              closeSetting={_toggleSettings}
              reference={setRef}
            />
          )}
        </div>
        {isWelcomeScreen && (<div className='only-top-container' />)}
        {isContainDetailHeader &&
          <DetailHeader
            currentAccount={currentAccount}
            formatted={formattedAddress}
            isShowZeroBalances={isShowZeroBalances}
            popupTheme={popupTheme}
            toggleVisibility={_toggleVisibility}
            toggleZeroBalances={_toggleZeroBalances}
          />
        }

        {showSubHeader &&
          <SubHeader
            showBackArrow={showBackArrow}
            showCancelButton={showCancelButton}
            subHeaderName={subHeaderName}
          />
        }

        {children}
      </div>
    </div>
  );
}

export default React.memo(styled(Header)(({ theme }: Props) => `
  max-width: 100%;
  box-sizing: border-box;
  margin: 0;
  position: relative;

  && {
    padding: 0 0 0;
  }

  .account-menu-setting {
    min-width: 390px;
  }

  .network-menu {
    min-width: 350px;
  }

  .text-overflow-center {
    margin-left: -100%;
    margin-right: -100%;
    text-align: center;
  }

  .pointer-events-none {
    pointer-events: none;
  }

  .container {
    background-color: ${theme.background};
    box-shadow: ${theme.headerBoxShadow};

    > .top-container {
      display: flex;
      justify-content: space-between;
      width: 100%;
      padding-top: 12px;
      padding-bottom: 6px;

    .branding {
      display: flex;
      justify-content: center;
      align-items: center;
      color: ${theme.labelColor};
      font-family: ${theme.fontFamily};
      text-align: center;
      margin-left: 15px;

      .logo {
        height: 48px;
        width: 48px;
        margin-right:12px;
      }

      .logoText {
        color: ${theme.textColor};
        font-family: ${theme.fontFamily};
        font-size: 20px;
        line-height: 27px;
      }
    }
  }

  .sub-wallet-logo {
    opacity: 1;
  }

  .only-top-container {
    padding-top: 6px;
  }

  .default-avatar {
    width: 54px;
    height: 54px;
    border-radius: 50%;
    padding: 2px;
    border: 2px solid ${theme.checkDotColor};
  }

  .identityIcon {
    border: 2px solid ${theme.checkDotColor};
  }

  .subheader-container {
    display: flex;
    align-items: center;
    padding-bottom: 13px;
    margin: 7px 15px 0 15px;

    &__text {
      font-size: 20px;
      line-height: 30px;
      font-weight: 500;
      color: ${theme.textColor};
    }
  }

  .subheader-container__part-1 {
    flex: 1;
  }

  .subheader-container__part-2 {
  }

  .subheader-container__part-3 {
    flex: 1;
    display: flex;
    justify-content: flex-end;
  }

  .kn-l-cancel-btn {
    color: ${theme.buttonTextColor2};
  }

  .arrowLeftIcon {
    color: ${theme.labelColor};
    margin-right: 1rem;
  }

  .backlink {
    color: ${theme.labelColor};
    min-height: 30px;
    text-decoration: underline;
    width: min-content;

    &:visited {
      color: ${theme.labelColor};
    }
  }

  &.smallMargin {
    margin-bottom: 15px;
  }

  .setting-icon-wrapper {
    margin-left: 1rem;
    cursor: pointer;
    height: 56px;
  }

  .koni-subheader-btn {
    display: flex;
  }

  .koni-header-right-content {
    display: flex;
    align-items: center;
    margin-right: 15px;
  }

  .network-selected-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    margin-left: 6px;
    background-color: ${theme.checkDotColor};
  }
  .network-logo {
    min-width: 18px;
    width: 18px;
    height: 18px;
    border-radius: 100%;
    overflow: hidden;
    image-rendering: -webkit-optimize-contrast;
    image-rendering: crisp-edges;
    border: 1px solid #fff;
    background: #fff;
  }

  .network-select-item {
    display: flex;
    align-items: center;
    border: 2px solid ${theme.inputBorderColor};
    border-radius: 8px;
    min-height: 25px;
    width: 250px;
    padding: 2px 6px;
    cursor: pointer;
    position: relative;

    &__text {
      margin: 4px 22px 4px 8px;
      font-size: 14px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      line-height: 24px;
      color: ${theme.textColor2};
    }

    &__icon {
      margin-right: 4px;
      position: absolute;
      right: 8px;
      color: ${theme.textColor2};
    }
  }

  .kn-l-edit-name {
    > div {
      margin-top: 0;
    }

    input {
      margin-top: 0;
      height: 40px;
    }
  }

  .connect-status {
    &-text {
      font-weight: 400;
      color: ${theme.textColor2};
    }
  }
  .account-info {
    &-formatted {
      font-weight: 400;
      color: ${theme.textColor2};
    }
  }

  .kn-l-expand-btn {
    min-width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-left: 2px;
    user-select: none;
    cursor: pointer;
  }

  .kn-l-expand-btn__icon {
    display: block;
    width: 24px;
    height: auto;
  }

  .more-button {
    width: 32px;
    height: 32px;
    display: flex;
    justify-content: center;
    align-items: center;

    &:hover {
      cursor: pointer;
      background-color: color: ${theme.accountHoverBackground};
    }
  }

  .header__all-account-icon {
    width: 56px;
    min-width: 56px;
    height: 56px;
    border: 2px solid ${theme.checkDotColor};
    padding: 2px;
    border-radius: 50%;
  }
`));
