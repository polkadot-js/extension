// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { ThemeProps } from '../../types';

import { faChevronDown } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import ExpandDarkIcon from '@subwallet/extension-koni-ui/assets/icon/expand-dark.svg';
import ExpandLightIcon from '@subwallet/extension-koni-ui/assets/icon/expand-light.svg';
import { AccountContext, Link } from '@subwallet/extension-koni-ui/components';
import useGenesisHashOptions from '@subwallet/extension-koni-ui/hooks/useGenesisHashOptions';
import useIsPopup from '@subwallet/extension-koni-ui/hooks/useIsPopup';
import { showAccount, tieAccount, windowOpen } from '@subwallet/extension-koni-ui/messaging';
import { RootState } from '@subwallet/extension-koni-ui/stores';
import { updateCurrentNetwork } from '@subwallet/extension-koni-ui/stores/updater';
import { accountAllRecoded, getGenesisOptionsByAddressType, isAccountAll } from '@subwallet/extension-koni-ui/util';
import { getLogoByGenesisHash } from '@subwallet/extension-koni-ui/util/logoByGenesisHashMap';
import reformatAddress from '@subwallet/extension-koni-ui/util/reformatAddress';
import Avatar from 'boring-avatars';
import React, { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import styled, { ThemeContext } from 'styled-components';

import { IconTheme } from '@polkadot/react-identicon/types';

import defaultAvatar from '../../assets/default-avatar.svg';
import logo from '../../assets/sub-wallet-logo.svg';
import useOutsideClick from '../../hooks/useOutsideClick';
import { Theme } from '../../types';

const ConfirmModal = React.lazy(() => import('@subwallet/extension-koni-ui/components/ConfirmModal'));
const Identicon = React.lazy(() => import('@subwallet/extension-koni-ui/components/Identicon'));
const NetworkMenu = React.lazy(() => import('@subwallet/extension-koni-ui/components/NetworkMenu'));
const AccountMenuSettings = React.lazy(() => import('@subwallet/extension-koni-ui/partials/AccountMenuSettings'));
const DetailHeader = React.lazy(() => import('@subwallet/extension-koni-ui/partials/Header/DetailHeader'));
const SubHeader = React.lazy(() => import('@subwallet/extension-koni-ui/partials/Header/SubHeader'));

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
  isShowNetworkSelect?: boolean;
  isShowZeroBalances?: boolean;
  toggleZeroBalances?: () => void;
  changeAccountCallback?: (address: string) => void;
  isBusy?: boolean;
  setShowBalanceDetail?: (isShowBalanceDetail: boolean) => void;
  to?: string;
}

function Header ({ changeAccountCallback, children, className = '', isBusy, isContainDetailHeader, isShowNetworkSelect = true, isShowZeroBalances, isWelcomeScreen, setShowBalanceDetail, showBackArrow, showCancelButton, showSubHeader, smallMargin = false, subHeaderName, to, toggleZeroBalances }: Props): React.ReactElement<Props> {
  const [isSettingsOpen, setShowSettings] = useState(false);
  const [isActionOpen, setShowAccountAction] = useState(false);
  const [isNetworkSelectOpen, setShowNetworkSelect] = useState(false);
  const [isShowModal, setShowModal] = useState(false);
  const { currentAccount: { account },
    currentNetwork: { genesisHash, isEthereum, networkPrefix },
    settings: { accountAllLogo } } = useSelector((state: RootState) => state);
  const [formattedAddress, setFormattedAddress] = useState<string | null>(null);
  const themeContext = useContext(ThemeContext as React.Context<Theme>);
  const { accounts } = useContext(AccountContext);
  const popupTheme = themeContext.id;
  const setRef = useRef(null);
  const actionsRef = useRef(null);
  const netRef = useRef(null);
  const isPopup = useIsPopup();
  const _onWindowOpen = useCallback(
    () => windowOpen('/').catch(console.error),
    []
  );

  const genesisOptions = getGenesisOptionsByAddressType(account?.address, accounts, useGenesisHashOptions());
  const _isAccountAll = account && isAccountAll(account.address);
  const randomVariant = window.localStorage.getItem('randomVariant') as 'beam' | 'marble' | 'pixel' | 'sunset' | 'ring';
  const randomNameForLogo = window.localStorage.getItem('randomNameForLogo') as string;

  useEffect((): void => {
    if (!account) {
      return;
    }

    if (!account.address) {
      setFormattedAddress(null);

      return;
    }

    if (isAccountAll(account.address)) {
      setFormattedAddress(accountAllRecoded.formatted);

      return;
    }

    const formattedAddress = reformatAddress(account.address, networkPrefix, isEthereum);

    setFormattedAddress(formattedAddress);
  }, [account, account?.address, networkPrefix, isEthereum]);

  const getNetworkKey = useCallback(
    (genesisHash: string) => {
      let networkKey = '';

      if (account) {
        genesisHash = genesisHash || '';
        const currentNetwork = genesisOptions.find((opt) => opt.value === genesisHash);

        networkKey = currentNetwork ? currentNetwork.text : '';
      }

      return networkKey;
    }, [account, genesisOptions]
  );

  const _toggleZeroBalances = useCallback(
    (): void => {
      toggleZeroBalances && toggleZeroBalances();
      setShowAccountAction(false);
    },
    [toggleZeroBalances]
  );

  const theme = (
    account?.type === 'ethereum'
      ? 'ethereum'
      : 'polkadot'
  ) as IconTheme;

  const _onChangeGenesis = useCallback(
    async (genesisHash: string, networkPrefix: number, icon: string, networkKey: string, isEthereum: boolean): Promise<void> => {
      if (account) {
        if (!isAccountAll(account.address)) {
          await tieAccount(account.address, genesisHash || null);
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
      }

      setShowBalanceDetail && setShowBalanceDetail(false);
      setShowNetworkSelect(false);
    },
    [account, setShowBalanceDetail]
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

  const closeModal = useCallback(
    () => setShowModal(false),
    []
  );

  const confirmConnectAcc = useCallback(
    () => {
      account && account.address && showAccount(account?.address, false).then(
        () => setShowModal(false)).catch(console.error);
    },
    [account]
  );

  const _toggleVisibility = useCallback(
    () => {
      if (account && account.isHidden) {
        account.address && showAccount(account?.address, true).catch(console.error);
      } else {
        setShowModal(true);
      }
    },
    [account]
  );

  return (
    <div className={`${className} ${smallMargin ? 'smallMargin' : ''}`}>
      <div className='container'>
        <div className={`top-container ${isBusy ? 'disabled-item' : ''}`}>
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
              // eslint-disable-next-line @typescript-eslint/no-misused-promises
              onClick={_onWindowOpen}
            >
              <img
                alt='Expand Icon'
                className='kn-l-expand-btn__icon'
                src={popupTheme === 'dark' ? ExpandLightIcon : ExpandDarkIcon}
              />
            </div>)}
            <div
              className={`network-select-item ${isNetworkSelectOpen ? 'pointer-events-none' : ''} ${isShowNetworkSelect ? '' : 'network-select-disabled'}`}
              onClick={_toggleNetwork}
            >
              <img
                alt='logo'
                className={'network-logo'}
                src={getLogoByGenesisHash(genesisHash)}
              />
              <div className='network-select-item__text'>
                {getNetworkKey(genesisHash) || genesisOptions[0].text}
              </div>
              <FontAwesomeIcon
                className='network-select-item__icon'
                // @ts-ignore
                icon={faChevronDown}
                size='sm'
              />
            </div>

            {!isWelcomeScreen && (
              <div
                className={`setting-icon-wrapper ${isSettingsOpen ? 'pointer-events-none' : ''}`}
                onClick={_toggleSettings}
              >
                {!!account && !!account.address
                  ? _isAccountAll
                    ? accountAllLogo
                      ? <img
                        alt='all-account-icon'
                        className='header__all-account-icon'
                        src={accountAllLogo}
                      />
                      : <div className='header__all-account-icon'>
                        <Avatar
                          colors={['#5F545C', '#EB7072', '#F5BA90', '#F5E2B8', '#A2CAA5']}
                          name={randomNameForLogo}
                          size={46}
                          variant={randomVariant}
                        />
                      </div>

                    : (
                      <Identicon
                        className='identityIcon'
                        genesisHash={genesisHash}
                        iconTheme={theme}
                        prefix={networkPrefix}
                        showLogo
                        size={46}
                        value={formattedAddress || account?.address}
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
              currentNetwork={genesisHash}
              genesisOptions={genesisOptions}
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
              setShowBalanceDetail={setShowBalanceDetail}
            />
          )}
        </div>
        {isWelcomeScreen && (<div className='only-top-container' />)}
        {isShowModal &&
        <ConfirmModal
          closeModal={closeModal}
          confirmAction={confirmConnectAcc}
          confirmButton={'Disconnect'}
          confirmMessage={'Do you want to disconnect this account?'}
          isBusy={isBusy}

        />
        }
        {isContainDetailHeader && account &&
          <DetailHeader
            currentAccount={account}
            formatted={formattedAddress}
            isShowZeroBalances={isShowZeroBalances}
            popupTheme={popupTheme}
            // eslint-disable-next-line @typescript-eslint/no-misused-promises
            toggleVisibility={_toggleVisibility}
            toggleZeroBalances={_toggleZeroBalances}
          />
        }

        {showSubHeader &&
          <SubHeader
            isBusy={isBusy}
            showBackArrow={showBackArrow}
            showCancelButton={showCancelButton}
            subHeaderName={subHeaderName}
            to={to}
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

  .disabled-item {
    cursor: not-allowed;
    opacity: 0.5;
    pointer-events: none !important;
  }

  .pointer-events-none {
    pointer-events: none;
  }

  .network-select-disabled {
    opacity: 0.6;
    cursor: not-allowed;
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
      margin-left: 5px;

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
    width: 215px;
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
    width: 54px;
    min-width: 54px;
    height: 54px;
    display: flex;
    justify-content: center;
    align-items: center;
    border: 2px solid ${theme.checkDotColor};
    padding: 2px;
    border-radius: 50%;
  }

  .subwallet-modal {
    top: 30%;
    left: 70px;
    right: 70px;
    max-width: 320px;
  }
`));
