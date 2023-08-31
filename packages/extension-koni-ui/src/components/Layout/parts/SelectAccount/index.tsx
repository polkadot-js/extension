// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { AccountJson } from '@subwallet/extension-base/background/types';
import { useGetCurrentAuth, useGetCurrentTab, useIsPopup, useTranslation } from '@subwallet/extension-koni-ui/hooks';
import { RootState } from '@subwallet/extension-koni-ui/stores';
import { Theme } from '@subwallet/extension-koni-ui/themes';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { funcSortByName, isAccountAll } from '@subwallet/extension-koni-ui/utils';
import { BackgroundIcon, ModalContext, Tooltip } from '@subwallet/react-ui';
import CN from 'classnames';
import { Plug, Plugs, PlugsConnected } from 'phosphor-react';
import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import { isEthereumAddress } from '@polkadot/util-crypto';

import { ConnectWebsiteModal } from '../ConnectWebsiteModal';
import SelectAccountModal from './SelectAccountModal';

type Props = ThemeProps

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

function Component ({ className }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const { activeModal, inactiveModal } = useContext(ModalContext);

  const { accounts: _accounts, currentAccount, isAllAccount } = useSelector((state: RootState) => state.accountState);

  const [connected, setConnected] = useState(0);
  const [canConnect, setCanConnect] = useState(0);
  const [connectionState, setConnectionState] = useState<ConnectionStatement>(ConnectionStatement.NOT_CONNECTED);
  const currentTab = useGetCurrentTab();
  const isCurrentTabFetched = !!currentTab;
  const currentAuth = useGetCurrentAuth();
  const isPopup = useIsPopup();

  const accounts = useMemo((): AccountJson[] => {
    const result = [..._accounts].sort(funcSortByName);
    const all = result.find((acc) => isAccountAll(acc.address));

    if (all) {
      const index = result.indexOf(all);

      result.splice(index, 1);
      result.unshift(all);
    }

    return result;
  }, [_accounts]);

  const noAllAccounts = useMemo(() => {
    return accounts.filter(({ address }) => !isAccountAll(address));
  }, [accounts]);

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

      <SelectAccountModal />

      <ConnectWebsiteModal
        authInfo={currentAuth}
        id={ConnectWebsiteId}
        isBlocked={connectionState === ConnectionStatement.BLOCKED}
        isNotConnected={connectionState === ConnectionStatement.NOT_CONNECTED}
        onCancel={onCloseConnectWebsiteModal}
        url={currentTab?.url || ''}
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

      '.input-container:hover .account-name': {
        color: token.colorTextLight3
      }
    },

    '&.ant-sw-modal': {
      '.ant-sw-modal-body': {
        minHeight: 370,
        marginBottom: 0
      },

      '.ant-sw-list-search-input': {
        paddingBottom: token.paddingXS
      },

      '.ant-sw-modal-footer': {
        marginTop: 0,
        borderTopColor: 'rgba(33, 33, 33, 0.80)'
      },

      '.ant-account-card': {
        padding: token.paddingSM
      },

      '.ant-web3-block .ant-web3-block-middle-item': {
        textAlign: 'initial'
      },

      '.all-account-selection': {
        '.account-item-name': {
          fontSize: token.fontSizeHeading5,
          lineHeight: token.lineHeightHeading5
        }
      },

      '.ant-account-card-name': {
        textOverflow: 'ellipsis',
        overflow: 'hidden',
        whiteSpace: 'nowrap',
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
    }
  });
});

export default SelectAccount;
