// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { AccountJson } from '@subwallet/extension-base/background/types';
import { ALL_ACCOUNT_KEY } from '@subwallet/extension-koni-base/constants';
import cloneLogo from '@subwallet/extension-koni-ui/assets/clone.svg';
import moreButtonDark from '@subwallet/extension-koni-ui/assets/dots-three-vertical-dark.svg';
import moreButtonLight from '@subwallet/extension-koni-ui/assets/dots-three-vertical-light.svg';
import EyeIcon from '@subwallet/extension-koni-ui/assets/icon/eye.svg';
import EyeSlashIcon from '@subwallet/extension-koni-ui/assets/icon/eye-slash.svg';
import { AccountContext } from '@subwallet/extension-koni-ui/components';
import AccountVisibleModal from '@subwallet/extension-koni-ui/components/Modal/AccountVisibleModal';
import ExportMnemonicModal from '@subwallet/extension-koni-ui/components/Modal/ExportMnemonicModal';
import MigrateMasterPasswordModal from '@subwallet/extension-koni-ui/components/Modal/MigrateMasterPasswordModal';
import Tooltip from '@subwallet/extension-koni-ui/components/Tooltip';
import { useGetCurrentAuth } from '@subwallet/extension-koni-ui/hooks/useGetCurrentAuth';
import useIsPopup from '@subwallet/extension-koni-ui/hooks/useIsPopup';
import useOutsideClick from '@subwallet/extension-koni-ui/hooks/useOutsideClick';
import useToast from '@subwallet/extension-koni-ui/hooks/useToast';
import useTranslation from '@subwallet/extension-koni-ui/hooks/useTranslation';
import { editAccount } from '@subwallet/extension-koni-ui/messaging';
import AccountAction from '@subwallet/extension-koni-ui/partials/AccountAction';
import HeaderEditName from '@subwallet/extension-koni-ui/partials/HeaderEditName';
import { RootState } from '@subwallet/extension-koni-ui/stores';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { isAccountAll } from '@subwallet/extension-koni-ui/util';
import CN from 'classnames';
import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import CopyToClipboard from 'react-copy-to-clipboard';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import { isEthereumAddress } from '@polkadot/util-crypto';

interface Props extends ThemeProps {
  className?: string,
  popupTheme: string,
  toggleVisibility: () => void,
  currentAccount: AccountJson,
  toggleZeroBalances: () => void,
  formatted: string | null,
  isShowZeroBalances?: boolean,
}

interface EditState {
  isEditing: boolean;
  toggleActions: number;
}

let tooltipId = 0;

enum ConnectionStatement {
  NOT_CONNECTED='NOT_CONNECTED',
  CONNECTED='CONNECTED',
  PARTIAL_CONNECTED='PARTIAL_CONNECTED',
  DISCONNECTED='DISCONNECTED',
  BLOCKED='BLOCKED'
}

function DetailHeader ({ className = '',
  currentAccount,
  formatted,
  isShowZeroBalances,
  popupTheme,
  // toggleVisibility,
  toggleZeroBalances }: Props): React.ReactElement {
  const actionsRef = useRef(null);

  const { t } = useTranslation();
  const isPopup = useIsPopup();
  const currentAuth = useGetCurrentAuth();

  const { currentNetwork } = useSelector((state: RootState) => state);
  const { accounts } = useContext(AccountContext);

  const [connected, setConnected] = useState(0);
  const [canConnect, setCanConnect] = useState(0);

  const isAllAccount = isAccountAll(currentAccount.address);

  const [connectionState, setConnectionState] = useState<ConnectionStatement>();

  const [{ isEditing }, setEditing] = useState<EditState>({ isEditing: false, toggleActions: 0 });
  const [isActionOpen, setShowAccountAction] = useState(false);
  const { show } = useToast();
  const [trigger] = useState(() => `overview-btn-${++tooltipId}`);
  const [authorizeModalVisible, setAuthorizeModalVisible] = useState(false);
  const [migrateModalVisible, setMigrateModalVisible] = useState(false);
  const [exportModalVisible, setExportModalVisible] = useState(false);

  const _toggleEdit = useCallback(
    (): void => {
      setEditing(({ toggleActions }) => ({ isEditing: !isEditing, toggleActions: ++toggleActions }));
      setShowAccountAction(false);
    },
    [isEditing]
  );

  const _toggleZeroBalances = useCallback(
    (): void => {
      toggleZeroBalances && toggleZeroBalances();
      setShowAccountAction(false);
    },
    [toggleZeroBalances]
  );

  const openExportModal = useCallback(() => {
    setShowAccountAction(false);
    setExportModalVisible(true);
  }, []);

  const closeExportModal = useCallback(() => {
    setExportModalVisible(false);
  }, []);

  const openMigrateModal = useCallback(() => {
    setShowAccountAction(false);
    setMigrateModalVisible(true);
  }, []);

  const closeMigrateModal = useCallback(() => {
    setMigrateModalVisible(false);
  }, []);

  const openModal = useCallback(() => {
    setAuthorizeModalVisible(true);
  }, []);

  const closeModal = useCallback(() => {
    setAuthorizeModalVisible(false);
  }, []);

  useOutsideClick(actionsRef, (): void => {
    isActionOpen && setShowAccountAction(!isActionOpen);
  });

  const visibleClassName = useMemo((): string => {
    switch (connectionState) {
      case ConnectionStatement.CONNECTED:
        return 'connected';
      case ConnectionStatement.PARTIAL_CONNECTED:
        return 'partial-connected';
      case ConnectionStatement.DISCONNECTED:
        return 'disconnected';
      case ConnectionStatement.BLOCKED:
        return 'blocked';
      case ConnectionStatement.NOT_CONNECTED:
      default:
        return 'not-connected';
    }
  }, [connectionState]);

  const visibleText = useMemo((): string => {
    switch (connectionState) {
      case ConnectionStatement.CONNECTED:
        if (isAllAccount) {
          return `Connected ${connected}/${canConnect}`;
        } else {
          return 'Connected';
        }

      case ConnectionStatement.PARTIAL_CONNECTED:
        if (isAllAccount) {
          return `Connected ${connected}/${canConnect}`;
        } else {
          return 'Connected';
        }

      case ConnectionStatement.DISCONNECTED:
        return 'Disconnected';

      case ConnectionStatement.BLOCKED:
        return 'Blocked';

      case ConnectionStatement.NOT_CONNECTED:
      default:
        return 'Not connected';
    }
  }, [canConnect, connected, connectionState, isAllAccount]);

  const _toggleAccountAction = useCallback(
    (): void => setShowAccountAction((isActionOpen) => !isActionOpen),
    []
  );

  const _onCopy = useCallback(
    () => show(t('Copied')),
    [show, t]
  );

  const ellipsisCenterStr = useCallback(
    (str: string | undefined) => {
      if (str && str.length > 35) {
        return str.substr(0, 6) + '...' + str.substr(str.length - 6, str.length);
      }

      return str;
    },
    []
  );

  const _saveChanges = useCallback(
    (editedName: string): void => {
      currentAccount &&
      editAccount(currentAccount.address, editedName)
        .catch(console.error);

      _toggleEdit();
    },
    [currentAccount, _toggleEdit]
  );

  useEffect(() => {
    if (currentAuth) {
      if (!currentAuth.isAllowed) {
        setCanConnect(0);
        setConnected(0);
        setConnectionState(ConnectionStatement.BLOCKED);
      } else {
        const type = currentAuth.accountAuthType;
        const allowedMap = currentAuth.isAllowedMap;

        const filterType = (address: string) => {
          if (type === 'both') {
            return true;
          }

          const _type = type || 'substrate';

          return _type === 'substrate' ? !isEthereumAddress(address) : isEthereumAddress(address);
        };

        if (!isAllAccount) {
          const _allowedMap: Record<string, boolean> = {};

          Object.entries(allowedMap)
            .filter(([address]) => filterType(address))
            .forEach(([address, value]) => {
              _allowedMap[address] = value;
            });

          const isAllowed = _allowedMap[currentAccount.address];

          setCanConnect(0);
          setConnected(0);

          if (isAllowed === undefined) {
            setConnectionState(ConnectionStatement.NOT_CONNECTED);
          } else {
            setConnectionState(isAllowed ? ConnectionStatement.CONNECTED : ConnectionStatement.DISCONNECTED);
          }
        } else {
          const _accounts = accounts.filter(({ address }) => !isAccountAll(address));

          const numberAccounts = _accounts.filter(({ address }) => filterType(address)).length;
          const numberAllowedAccounts = Object.entries(allowedMap)
            .filter(([address]) => filterType(address))
            .filter(([, value]) => value)
            .length;

          setConnected(numberAllowedAccounts);
          setCanConnect(numberAccounts);

          if (numberAllowedAccounts === 0) {
            setConnectionState(ConnectionStatement.DISCONNECTED);
          } else {
            if (numberAllowedAccounts > 0 && numberAllowedAccounts < numberAccounts) {
              setConnectionState(ConnectionStatement.PARTIAL_CONNECTED);
            } else {
              setConnectionState(ConnectionStatement.CONNECTED);
            }
          }
        }
      }
    } else {
      setCanConnect(0);
      setConnected(0);
      setConnectionState(ConnectionStatement.NOT_CONNECTED);
    }
  }, [currentAccount.address, currentAuth, isAllAccount, accounts]);

  return (
    <div className={`detail-header ${className}`}>
      <div className='detail-header__part-1'>
        {
          isPopup &&
          (
            <div
              className='detail-header-connect-status-btn'
              data-for={trigger}
              data-tip={true}
              onClick={openModal}
            >
              <img
                alt='Connect Icon'
                className={CN(
                  'detail-header-connect-status-btn__icon',
                  {
                    [visibleClassName]: connectionState !== ConnectionStatement.BLOCKED
                  }
                )}
                src={connectionState !== ConnectionStatement.BLOCKED ? EyeIcon : EyeSlashIcon}
              />
              <Tooltip
                text={visibleText}
                trigger={trigger}
              />
            </div>
          )
        }
      </div>

      <div className='detail-header__part-2'>
        {!isEditing && (
          <div
            className={CN(
              'detail-header-account-info',
              {
                'detail-header-account-info__ml': !isPopup
              }
            )}
          >
            {isAllAccount
              ? <div className='detail-header__all-account'>
                {t<string>('All Accounts')}
              </div>
              : <div className='detail-header-account-info-wrapper'>
                <span className='detail-header-account-info__name'>{currentAccount?.name}</span>
                <CopyToClipboard text={(formatted && formatted) || ''}>
                  <div
                    className='detail-header-account-info__formatted-wrapper'
                    onClick={_onCopy}
                  >
                    <span
                      className='detail-header-account-info__formatted'
                    >{ellipsisCenterStr(formatted || currentAccount?.address)}</span>
                    <img
                      alt='copy'
                      className='detail-header-account-info__copy-icon'
                      src={cloneLogo}
                    />
                  </div>
                </CopyToClipboard>
              </div>
            }
          </div>
        )}
        {isEditing && currentAccount && (
          <HeaderEditName
            className='kn-l-edit-name'
            defaultValue={currentAccount.name}
            isFocused
            label={' '}
            onBlur={_saveChanges}
          />
        )}
      </div>

      <div className='detail-header__part-3'>
        {!(isAllAccount && currentNetwork.networkKey !== 'all') &&
        <div
          className={
            CN(
              'detail-header-more-button',
              {
                'pointer-events-none': isActionOpen,
                'must-migrate': currentAccount?.address !== ALL_ACCOUNT_KEY && !currentAccount?.isExternal && !currentAccount?.isMasterPassword && !isActionOpen
              }
            )
          }
          onClick={_toggleAccountAction}
        >
          <img
            alt='more'
            className={'detail-header-more-button__icon'}
            src={popupTheme === 'dark' ? moreButtonDark : moreButtonLight}
          />
        </div>}
      </div>

      {isActionOpen && (
        <AccountAction
          isShowZeroBalances={isShowZeroBalances}
          openExportModal={openExportModal}
          openMigrateModal={openMigrateModal}
          reference={actionsRef}
          toggleEdit={_toggleEdit}
          toggleZeroBalances={_toggleZeroBalances}
        />
      )}
      <AccountVisibleModal
        authInfo={currentAuth}
        isBlocked={connectionState === ConnectionStatement.BLOCKED}
        isNotConnected={connectionState === ConnectionStatement.NOT_CONNECTED}
        onClose={closeModal}
        visible={authorizeModalVisible}
      />
      {
        migrateModalVisible && (
          <MigrateMasterPasswordModal
            address={currentAccount?.address || ''}
            closeModal={closeMigrateModal}
          />
        )
      }
      {
        exportModalVisible && (
          <ExportMnemonicModal
            // address={currentAccount?.address || ''}
            closeModal={closeExportModal}
          />
        )
      }
    </div>
  );
}

export default styled(DetailHeader)(({ theme }: Props) => `
  display: flex;
  align-items: center;
  height: 40px;
  padding-bottom: 8px;
  padding-top: 6px;

  .detail-header__part-1 {
    padding-left: 10px;
  }

  .detail-header__part-2 {
    flex: 1;
  }

  .detail-header__part-3 {
    padding-right: 6px;
  }

  .detail-header-connect-status-btn {
    min-width: 40px;
    height: 40px;
    align-items: center;
    display: flex;
    justify-content: center;
    cursor: pointer;
  }

  .detail-header-connect-status-btn__icon {
    width: 15px;

    &.connected {
      filter: ${theme.filterSuccess};
    }

    &.disconnected {
      filter: ${theme.filterError};
    }

    &.not-connected {
      filter: ${theme.filterDefault};
    }

    &.partial-connected {
      filter: ${theme.filterWarning};
    }
  }

  .detail-header-account-info {
    display: flex;
    align-items: baseline;
  }

  .detail-header-account-info__ml {
    .detail-header-account-info__name, .detail-header__all-account {
      margin-left: 16px;
    }
  }

  .detail-header-account-info__name {
    font-size: 18px;
    font-weight: 500;
    margin-right: 12px;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: 180px;
    overflow: hidden;
  }

  .detail-header__all-account {
    font-size: 18px;
    font-weight: 500;
    // padding-left: 25px;
  }

  .detail-header-account-info-wrapper {
    display: flex;
  }

  .kn-l-edit-name input{
    border: 1px solid ${theme.group === 'dark' ? 'transparent' : theme.primaryColor};
  }

  .detail-header-account-info__formatted-wrapper {
    display: flex;
    align-items: center;
    cursor: pointer;
    color: ${theme.textColor2};
  }

  .detail-header-account-info__formatted {
    margin-right: 8px;
    font-size: 14px;
    font-weight: 400;
    font-weight: 400;
  }

  .detail-header-more-button {
    min-width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    position: relative;
  }

  .must-migrate {
    &:after {
      content: '';
      position: absolute;
      top: 0;
      right: 8px;
      width: 8px;
      height: 8px;
      border: 1px solid ${theme.buttonBackgroundDanger};
      border-radius: 8px;
    }
    &:before {
      content: '';
      position: absolute;
      top: 2px;
      right: 10px;
      width: 4px;
      height: 4px;
      background: ${theme.buttonBackgroundDanger};
      border-radius: 4px;
    }
  }

  .detail-header-more-button__icon {
    width: 32px;
  }
`);
