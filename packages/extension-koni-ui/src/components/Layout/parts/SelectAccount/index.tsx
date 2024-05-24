// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { AccountJson, CurrentAccountInfo } from '@subwallet/extension-base/background/types';
import ExportAllSelector from '@subwallet/extension-koni-ui/components/Layout/parts/SelectAccount/ExportAllSelector';
import { SimpleQrModal } from '@subwallet/extension-koni-ui/components/Modal';
import { DISCONNECT_EXTENSION_MODAL, SELECT_ACCOUNT_MODAL } from '@subwallet/extension-koni-ui/constants';
import { useDefaultNavigate, useGetCurrentAuth, useGetCurrentTab, useGoBackSelectAccount, useIsPopup, useSetSessionLatest, useTranslation } from '@subwallet/extension-koni-ui/hooks';
import { saveCurrentAccountAddress } from '@subwallet/extension-koni-ui/messaging';
import { RootState } from '@subwallet/extension-koni-ui/stores';
import { Theme } from '@subwallet/extension-koni-ui/themes';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { findAccountByAddress, funcSortByName, isAccountAll, searchAccountFunction } from '@subwallet/extension-koni-ui/utils';
import { BackgroundIcon, ButtonProps, Icon, ModalContext, SelectModal, Tooltip } from '@subwallet/react-ui';
import CN from 'classnames';
import { Circle, Export, Plug, Plugs, PlugsConnected } from 'phosphor-react';
import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import styled, { useTheme } from 'styled-components';

import { isEthereumAddress } from '@polkadot/util-crypto';

import { AccountBriefInfo, AccountCardItem, AccountItemWithName } from '../../../Account';
import { GeneralEmptyList } from '../../../EmptyList';
import { ConnectWebsiteModal } from '../ConnectWebsiteModal';
import SelectAccountFooter from '../SelectAccount/Footer';

interface Props extends ThemeProps {
  id?: string
}

enum ConnectionStatement {
  NOT_CONNECTED='not-connected',
  CONNECTED='connected',
  PARTIAL_CONNECTED='partial-connected',
  DISCONNECTED='disconnected',
  BLOCKED='blocked'
}

const iconMap = {
  [ConnectionStatement.NOT_CONNECTED]: Plug,
  [ConnectionStatement.CONNECTED]: PlugsConnected,
  [ConnectionStatement.PARTIAL_CONNECTED]: PlugsConnected,
  [ConnectionStatement.DISCONNECTED]: Plugs,
  [ConnectionStatement.BLOCKED]: Plugs
};

const ConnectWebsiteId = 'connectWebsiteId';

const renderEmpty = () => <GeneralEmptyList />;

const modalId = SELECT_ACCOUNT_MODAL;
const simpleQrModalId = 'simple-qr-modal-id';
const multiExportAccountModalId = 'multi-export-account-selector';

function Component ({ className, id }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const { activeModal, inactiveModal } = useContext(ModalContext);
  const navigate = useNavigate();
  const location = useLocation();
  const { goHome } = useDefaultNavigate();
  const { setStateSelectAccount } = useSetSessionLatest();

  const { accounts: _accounts, currentAccount, isAllAccount } = useSelector((state: RootState) => state.accountState);

  const [connected, setConnected] = useState(0);
  const [canConnect, setCanConnect] = useState(0);
  const [connectionState, setConnectionState] = useState<ConnectionStatement>(ConnectionStatement.NOT_CONNECTED);
  const currentTab = useGetCurrentTab();
  const isCurrentTabFetched = !!currentTab;
  const currentAuth = useGetCurrentAuth();
  const isPopup = useIsPopup();
  const { token } = useTheme() as Theme;
  const [selectedQrAddress, setSelectedQrAddress] = useState<string | undefined>();

  const accounts = useMemo((): AccountJson[] => {
    const result = [..._accounts].sort(funcSortByName);
    const all = result.find((acc) => isAccountAll(acc.address));

    if (all) {
      const index = result.indexOf(all);

      result.splice(index, 1);
      result.unshift(all);
    }

    if (!!currentAccount?.address && (currentAccount?.address !== (all && all.address))) {
      const currentAccountIndex = result.findIndex((item) => {
        return item.address === currentAccount?.address;
      });

      if (currentAccountIndex > -1) {
        const _currentAccount = result[currentAccountIndex];

        result.splice(currentAccountIndex, 1);
        result.splice(1, 0, _currentAccount);
      }
    }

    return result;
  }, [_accounts, currentAccount?.address]);

  const noAllAccounts = useMemo(() => {
    return accounts.filter(({ address }) => !isAccountAll(address));
  }, [accounts]);

  const showAllAccount = useMemo(() => {
    return noAllAccounts.length > 1;
  }, [noAllAccounts]);

  const _onSelect = useCallback((address: string) => {
    if (address) {
      const accountByAddress = findAccountByAddress(accounts, address);

      if (accountByAddress) {
        const accountInfo = {
          address: address
        } as CurrentAccountInfo;

        saveCurrentAccountAddress(accountInfo).then(() => {
          const pathName = location.pathname;
          const locationPaths = location.pathname.split('/');

          if (locationPaths) {
            if (locationPaths[1] === 'home') {
              if (locationPaths.length >= 3) {
                if (pathName.startsWith('/home/nfts')) {
                  navigate('/home/nfts/collections');
                } else if (pathName.startsWith('/home/tokens/detail')) {
                  navigate('/home/tokens');
                } else {
                  navigate(`/home/${locationPaths[2]}`);
                }
              }
            } else {
              goHome();
            }
          }
        }).catch((e) => {
          console.error('Failed to switch account', e);
        });
      } else {
        console.error('Failed to switch account');
      }
    }
  }, [accounts, location.pathname, navigate, goHome]);

  const onClickDetailAccount = useCallback((address: string) => {
    return () => {
      inactiveModal(modalId);
      setTimeout(() => {
        navigate(`/accounts/detail/${address}`);
      }, 100);
    };
  }, [inactiveModal, navigate]);

  const openDisconnectExtensionModal = useCallback(() => {
    activeModal(DISCONNECT_EXTENSION_MODAL);
  }, [activeModal]);

  const onClickItemQrButton = useCallback((address: string) => {
    setSelectedQrAddress(address);
    activeModal(simpleQrModalId);
  }, [activeModal]);

  const onQrModalBack = useGoBackSelectAccount(simpleQrModalId);

  const renderItem = useCallback((item: AccountJson, _selected: boolean): React.ReactNode => {
    const currentAccountIsAll = isAccountAll(item.address);

    if (currentAccountIsAll) {
      if (showAllAccount) {
        return (
          <AccountItemWithName
            address={item.address}
            className='all-account-selection'
            isSelected={_selected}
          />
        );
      } else {
        return null;
      }
    }

    const isInjected = !!item.isInjected;

    return (
      <AccountCardItem
        accountName={item.name || ''}
        address={item.address}
        className={className}
        genesisHash={item.genesisHash}
        isSelected={_selected}
        onClickQrButton={onClickItemQrButton}
        onPressMoreButton={isInjected ? openDisconnectExtensionModal : onClickDetailAccount(item.address)}
        source={item.source}
      />
    );
  }, [className, onClickDetailAccount, openDisconnectExtensionModal, onClickItemQrButton, showAllAccount]);

  const renderSelectedItem = useCallback((item: AccountJson): React.ReactNode => {
    return (
      <div
        className='selected-account'
      >
        <AccountBriefInfo account={item} />
      </div>
    );
  }, []);

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

          const isAllowed = _allowedMap[currentAccount?.address || ''];

          setCanConnect(0);
          setConnected(0);

          if (isAllowed === undefined) {
            setConnectionState(ConnectionStatement.NOT_CONNECTED);
          } else {
            setConnectionState(isAllowed ? ConnectionStatement.CONNECTED : ConnectionStatement.DISCONNECTED);
          }
        } else {
          const numberAccounts = noAllAccounts.filter(({ address }) => filterType(address)).length;
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
  }, [currentAccount?.address, currentAuth, isAllAccount, noAllAccounts]);

  const visibleText = useMemo((): string => {
    switch (connectionState) {
      case ConnectionStatement.CONNECTED:
      // eslint-disable-next-line padding-line-between-statements, no-fallthrough
      case ConnectionStatement.PARTIAL_CONNECTED:
        if (isAllAccount) {
          return t('Connected {{connected}}/{{canConnect}}', { replace: { connected, canConnect } });
        } else {
          return t('Connected');
        }

      case ConnectionStatement.DISCONNECTED:
        return t('Disconnected');

      case ConnectionStatement.BLOCKED:
        return t('Blocked');

      case ConnectionStatement.NOT_CONNECTED:
      default:
        return t('Not connected');
    }
  }, [canConnect, connected, connectionState, isAllAccount, t]);

  const onOpenConnectWebsiteModal = useCallback(() => {
    if (isCurrentTabFetched) {
      activeModal(ConnectWebsiteId);
    }
  }, [activeModal, isCurrentTabFetched]);

  const onCloseConnectWebsiteModal = useCallback(() => {
    inactiveModal(ConnectWebsiteId);
  }, [inactiveModal]);

  const exportAllAccounts = useCallback(() => {
    activeModal(multiExportAccountModalId);
  }, [activeModal]);

  const onCloseSelectAccountModal = useCallback(() => {
    inactiveModal(modalId);
    setStateSelectAccount(true);
  }, [inactiveModal, setStateSelectAccount]);

  const rightButton = useMemo((): ButtonProps => {
    return ({
      icon: (
        <Icon
          className={CN('__export-remind-btn')}
          phosphorIcon={Export}
          weight='fill'
        />
      ),
      children: (
        <Tooltip
          className={'__icon-export-remind'}
          open={true}
          overlayClassName={CN('__tooltip-overlay-remind')}
          placement={'bottomLeft'}
          title={t('Export and back up accounts')}
        >
          <div>
            <Icon
              customSize={'7.39px'}
              iconColor={token.colorHighlight}
              phosphorIcon={Circle}
              weight={'fill'}
            />
          </div>
        </Tooltip>
      ),
      onClick: exportAllAccounts,
      size: 'xs',
      type: 'ghost',
      tooltipPlacement: 'topLeft'
    });
  }, [exportAllAccounts, t, token.colorHighlight]);

  return (
    <div className={CN(className, 'container')}>
      {isPopup && (
        <Tooltip
          placement={'bottomLeft'}
          title={visibleText}
        >
          <div
            className={CN('connect-icon', `-${connectionState}`)}
            onClick={onOpenConnectWebsiteModal}
          >
            <BackgroundIcon
              backgroundColor='var(--bg-color)'
              phosphorIcon={iconMap[connectionState]}
              shape='circle'
              size='sm'
              type='phosphor'
              weight={'fill'}
            />
          </div>
        </Tooltip>
      )}

      <SelectModal
        background={'default'}
        className={className}
        footer={<SelectAccountFooter />}
        id={modalId}
        ignoreScrollbarMethod='padding'
        inputWidth={'100%'}
        itemKey='address'
        items={accounts}
        onCancel={onCloseSelectAccountModal}
        onSelect={_onSelect}
        renderItem={renderItem}
        renderSelected={renderSelectedItem}
        renderWhenEmpty={renderEmpty}
        rightIconProps={rightButton}
        searchFunction={searchAccountFunction}
        searchMinCharactersCount={2}
        searchPlaceholder={t<string>('Account name')}
        selected={currentAccount?.address || ''}
        shape='round'
        size='small'
        title={t('Select account')}
      />

      <ConnectWebsiteModal
        authInfo={currentAuth}
        id={ConnectWebsiteId}
        isBlocked={connectionState === ConnectionStatement.BLOCKED}
        isNotConnected={connectionState === ConnectionStatement.NOT_CONNECTED}
        onCancel={onCloseConnectWebsiteModal}
        url={currentTab?.url || ''}
      />
      <SimpleQrModal
        address={selectedQrAddress}
        id={simpleQrModalId}
        onBack={onQrModalBack}
      />

      <ExportAllSelector
        items={accounts}
      />
    </div>
  );
}

const SelectAccount = styled(Component)<Props>(({ theme }) => {
  const { token } = theme as Theme;

  return ({
    '&.container': {
      paddingLeft: token.sizeSM,
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'row',

      '.ant-select-modal-input-container.ant-select-modal-input-border-round::before': {
        display: 'none'
      },

      '.ant-select-modal-input-container.ant-select-modal-input-size-small .ant-select-modal-input-wrapper': {
        paddingLeft: 0
      },

      '.ant-select-modal-input-container:hover .account-name': {
        color: token.colorTextLight3
      }
    },

    '&.ant-sw-modal': {
      '.ant-sw-modal-body': {
        height: 370,
        marginBottom: 0
      },

      '.ant-sw-list-search-input': {
        paddingBottom: token.paddingXS
      },

      '.ant-sw-modal-footer': {
        marginTop: 0
      },

      '.ant-account-card': {
        padding: token.paddingSM
      },

      '.ant-web3-block .ant-web3-block-middle-item': {
        textAlign: 'initial'
      },

      '.all-account-selection': {
        cursor: 'pointer',
        borderRadius: token.borderRadiusLG,
        transition: `background ${token.motionDurationMid} ease-in-out`,

        '.account-item-name': {
          fontSize: token.fontSizeHeading5,
          lineHeight: token.lineHeightHeading5
        },

        '&:hover': {
          background: token.colorBgInput
        }
      },

      '.ant-account-card-name': {
        textOverflow: 'ellipsis',
        overflow: 'hidden',
        'white-space': 'nowrap',
        maxWidth: 120
      },

      '.ant-input-container .ant-input': {
        color: token.colorTextLight1
      }
    },

    '.all-account-item': {
      display: 'flex',
      padding: `${token.paddingSM + 2}px ${token.paddingSM}px`,
      cursor: 'pointer',
      backgroundColor: token.colorBgSecondary,
      borderRadius: token.borderRadiusLG,
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: token.sizeXS,

      '&:hover': {
        backgroundColor: token.colorBgInput
      },

      '.selected': {
        color: token['cyan-6']
      }
    },

    '.ant-select-modal-input-container': {
      overflow: 'hidden'
    },

    '.selected-account': {
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8
    },

    '.connect-icon': {
      color: token.colorTextBase,
      width: 40,
      height: 40,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      cursor: 'pointer',

      [`&.-${ConnectionStatement.DISCONNECTED}`]: {
        '--bg-color': token['gray-3']
      },

      [`&.-${ConnectionStatement.BLOCKED}`]: {
        '--bg-color': token.colorError
      },

      [`&.-${ConnectionStatement.NOT_CONNECTED}`]: {
        '--bg-color': token['gray-3']
      },

      [`&.-${ConnectionStatement.CONNECTED}`]: {
        '--bg-color': token['green-6']
      },

      [`&.-${ConnectionStatement.PARTIAL_CONNECTED}`]: {
        '--bg-color': token.colorWarning
      }
    },

    '.__icon-export-remind': {
      position: 'absolute',
      top: '-35%',
      left: '40%'
    },

    '.anticon.__export-remind-btn': {
      height: 23,
      width: 24
    }
  });
});

export default SelectAccount;
