// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { AccountJson, CurrentAccountInfo } from '@subwallet/extension-base/background/types';
import AccountCardSelection from '@subwallet/extension-koni-ui/components/Account/AccountCardSelection';
import AccountItemBriefInfo from '@subwallet/extension-koni-ui/components/Account/AccountItemBriefInfo';
import SelectAccountEmpty from '@subwallet/extension-koni-ui/components/Layout/parts/SelectAccount/Empty';
import SelectAccountFooter from '@subwallet/extension-koni-ui/components/Layout/parts/SelectAccount/Footer';
import { SELECT_ACCOUNT_MODAL } from '@subwallet/extension-koni-ui/constants/modal';
import { useGetCurrentAuth } from '@subwallet/extension-koni-ui/hooks/useGetCurrentAuth';
import useTranslation from '@subwallet/extension-koni-ui/hooks/useTranslation';
import { saveCurrentAccountAddress, triggerAccountsSubscription } from '@subwallet/extension-koni-ui/messaging';
import { RootState } from '@subwallet/extension-koni-ui/stores';
import { Theme } from '@subwallet/extension-koni-ui/themes';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { findAccountByAddress, isAccountAll } from '@subwallet/extension-koni-ui/util';
import { BackgroundIcon, SelectModal } from '@subwallet/react-ui';
import Icon from '@subwallet/react-ui/es/icon';
import CN from 'classnames';
import { CheckCircle, Icon as PhosphorIcon, Plug, Plugs, PlugsConnected } from 'phosphor-react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import { isEthereumAddress } from '@polkadot/util-crypto';

type Props = ThemeProps

enum ConnectionStatement {
  NOT_CONNECTED='not-connected',
  CONNECTED='connected',
  PARTIAL_CONNECTED='partial-connected',
  DISCONNECTED='disconnected',
  BLOCKED='blocked'
}

interface ConnectIconProps {
  className: ConnectionStatement;
  icon: PhosphorIcon;
}

const renderEmpty = () => <SelectAccountEmpty />;

function Component ({ className }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const { accounts, currentAccount, isAllAccount } = useSelector((state: RootState) => state.accountState);
  const [connectionState, setConnectionState] = useState<ConnectionStatement>(ConnectionStatement.NOT_CONNECTED);

  const currentAuth = useGetCurrentAuth();

  const _onSelect = useCallback((address: string) => {
    if (address) {
      const accountByAddress = findAccountByAddress(accounts, address);

      if (accountByAddress) {
        const accountInfo = {
          address: address
        } as CurrentAccountInfo;

        saveCurrentAccountAddress(accountInfo, () => {
          triggerAccountsSubscription().catch((e) => {
            console.error('There is a problem when trigger Accounts Subscription', e);
          });
        }).catch((e) => {
          console.error('There is a problem when set Current Account', e);
        });
      } else {
        console.error('There is a problem when change account');
      }
    }
  }, [accounts]);

  const renderItem = useCallback((item: AccountJson, _selected: boolean) => {
    const isAllAccount = isAccountAll(item.address);

    if (isAllAccount) {
      return (
        <div className='all-account-item'>
          <AccountItemBriefInfo account={item} />
          {_selected && (
            <Icon
              className='selected'
              phosphorIcon={CheckCircle}
              size='sm'
              type='phosphor'
              weight='fill'
            />
          )}
        </div>
      );
    }

    return (
      <AccountCardSelection
        accountName={item.name}
        address={item.address}
        className={className}
        genesisHash={item.genesisHash}
        isSelected={_selected}
      />
    );
  }, [className]);

  const connectIcon: ConnectIconProps = useMemo((): ConnectIconProps => {
    const result: ConnectIconProps = {
      icon: PlugsConnected,
      className: connectionState
    };

    switch (connectionState) {
      case ConnectionStatement.DISCONNECTED:
      case ConnectionStatement.BLOCKED:
        result.icon = Plugs;
        break;
      case ConnectionStatement.NOT_CONNECTED:
        result.icon = Plug;
        break;
    }

    return result;
  }, [connectionState]);

  const renderSelectedItem = useCallback((item: AccountJson): React.ReactNode => {
    return (
      <div className='selected-account'>
        <div className={CN('connect-icon', connectIcon.className)}>
          <BackgroundIcon
            backgroundColor='var(--bg-color)'
            phosphorIcon={connectIcon.icon}
            shape='circle'
            size='sm'
            type='phosphor'
          />
        </div>
        <AccountItemBriefInfo account={item} />
      </div>
    );
  }, [connectIcon]);

  const searchFunction = useCallback((item: AccountJson, searchText: string): boolean => {
    return item.address.toLowerCase().includes(searchText.toLowerCase()) || (item.name || '').toLowerCase().includes(searchText.toLowerCase());
  }, []);

  useEffect(() => {
    if (currentAuth) {
      if (!currentAuth.isAllowed) {
        // setCanConnect(0);
        // setConnected(0);
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

          // setCanConnect(0);
          // setConnected(0);

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

          // setConnected(numberAllowedAccounts);
          // setCanConnect(numberAccounts);

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
      // setCanConnect(0);
      // setConnected(0);
      setConnectionState(ConnectionStatement.NOT_CONNECTED);
    }
  }, [currentAccount?.address, currentAuth, isAllAccount, accounts]);

  return (
    <div className={CN(className, 'container')}>
      <SelectModal
        background={'default'}
        className={className}
        footer={<SelectAccountFooter />}
        id={SELECT_ACCOUNT_MODAL}
        inputWidth={'100%'}
        itemKey='address'
        items={accounts}
        onSelect={_onSelect}
        renderItem={renderItem}
        renderSelected={renderSelectedItem}
        renderWhenEmpty={renderEmpty}
        searchFunction={searchFunction}
        searchPlaceholder={t('Account name')}
        searchableMinCharactersCount={2}
        selected={currentAccount?.address || ''}
        shape='round'
        size='small'
        title={t('Select account')}
      />
    </div>
  );
}

const SelectAccount = styled(Component)<Props>(({ theme }) => {
  const { token } = theme as Theme;

  return ({
    '&.container': {
      overflow: 'hidden'
    },

    '&.ant-sw-modal': {
      '.ant-sw-modal-body': {
        height: 370
      },

      '.ant-account-card': {
        padding: token.paddingSM
      },

      '.ant-web3-block .ant-web3-block-middle-item': {
        textAlign: 'initial'
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

    '.selected-account': {
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,

      '.connect-icon': {
        color: token.colorTextBase,

        [`&.${ConnectionStatement.DISCONNECTED}`]: {
          '--bg-color': token['gray-3']
        },

        [`&.${ConnectionStatement.BLOCKED}`]: {
          '--bg-color': token.colorError
        },

        [`&.${ConnectionStatement.NOT_CONNECTED}`]: {
          '--bg-color': token['gray-3']
        },

        [`&.${ConnectionStatement.CONNECTED}`]: {
          '--bg-color': token['green-6']
        },

        [`&.${ConnectionStatement.PARTIAL_CONNECTED}`]: {
          '--bg-color': token.colorWarning
        }
      }
    }
  });
});

export default SelectAccount;
