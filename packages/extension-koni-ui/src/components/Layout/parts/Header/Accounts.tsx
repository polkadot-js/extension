// Copyright 2019-2022 @subwallet/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { AccountJson, CurrentAccountInfo } from '@subwallet/extension-base/background/types';
import { AccountCardSelection, AccountItemWithName } from '@subwallet/extension-koni-ui/components/Account';
import { MetaInfo } from '@subwallet/extension-koni-ui/components/MetaInfo';
import useDefaultNavigate from '@subwallet/extension-koni-ui/hooks/router/useDefaultNavigate';
import { saveCurrentAccountAddress } from '@subwallet/extension-koni-ui/messaging';
import { RootState } from '@subwallet/extension-koni-ui/stores';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { findAccountByAddress, funcSortByName, isAccountAll, searchAccountFunction } from '@subwallet/extension-koni-ui/utils';
import { Button, Logo, Popover, SwList } from '@subwallet/react-ui';
import CN from 'classnames';
import { CaretDown } from 'phosphor-react';
import React, { forwardRef, LegacyRef, useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

import { isEthereumAddress } from '@polkadot/util-crypto';

import GeneralEmptyList from '../../../GeneralEmptyList';
import SelectAccountFooter from '../SelectAccount/Footer';

const emptyTokenList = () => <GeneralEmptyList />;

const ACCOUNT_SELECTOR_KEY = 'main-account-selector-Key';

const Component: React.FC<ThemeProps> = ({ className }: ThemeProps) => {
  const { t } = useTranslation();
  const { accounts: _accounts, currentAccount } = useSelector((state: RootState) => state.accountState);

  const [open, setOpen] = useState<boolean>(false);
  const [accountSelectorKey, setAccountSelectorKey] = useState<string>(ACCOUNT_SELECTOR_KEY);
  const navigate = useNavigate();
  const { goHome } = useDefaultNavigate();
  // const currentAuth = useGetCurrentAuth();
  const accounts = useMemo((): AccountJson[] => {
    return [..._accounts].sort(funcSortByName);
  }, [_accounts]);
  const noAllAccounts = useMemo(() => {
    return accounts.filter(({ address }) => !isAccountAll(address));
  }, [accounts]);

  const handleOpenChange = useCallback((newOpen: boolean) => {
    if (newOpen) {
      setAccountSelectorKey(`${ACCOUNT_SELECTOR_KEY} + ${Date.now()}`);
    }

    setOpen(newOpen);
  }, []);

  const onClickDetailAccount = useCallback((address: string) => {
    return () => {
      setTimeout(() => {
        navigate(`/accounts/detail/${address}`);
      }, 100);
    };
  }, [navigate]);

  const _onSelect = useCallback((address: string) => {
    handleOpenChange(false);

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
          console.error('There is a problem when set Current Account', e);
        });
      } else {
        console.error('There is a problem when change account');
      }
    }
  }, [handleOpenChange, accounts, navigate, goHome]);

  const clickSelect = useCallback((address: string) => {
    return () => {
      _onSelect(address);
    };
  }, [_onSelect]);

  const renderItem = useCallback((item: AccountJson) => {
    const currentAccountIsAll = isAccountAll(item.address);
    const selectedAccount = currentAccount?.address || '';

    if (currentAccountIsAll) {
      return (
        <div
          key={item.address}
          onClick={clickSelect(item.address)}
        >
          <AccountItemWithName
            address={item.address}
            className='all-account-selection'
            isSelected={item.address === selectedAccount}
          />
        </div>
      );
    }

    return (
      <div
        key={item.address}
        onClick={clickSelect(item.address)}
      >
        <AccountCardSelection
          accountName={item.name || ''}
          address={item.address}
          genesisHash={item.genesisHash}
          isSelected={item.address === selectedAccount}
          isShowSubIcon
          onPressMoreBtn={onClickDetailAccount(item.address)}
          subIcon={(
            <Logo
              network={isEthereumAddress(item.address) ? 'ethereum' : 'polkadot'}
              shape={'circle'}
              size={16}
            />
          )}
        />
      </div>
    );
  }, [currentAccount?.address, clickSelect, onClickDetailAccount]);

  // Remove ref error
  // eslint-disable-next-line react/display-name
  const TriggerComponent = forwardRef((props, ref) => {
    if (!currentAccount || !currentAccount.name) {
      return null;
    } else {
      const isAllAccount = isAccountAll(currentAccount?.address);
      const content: string = isAllAccount ? 'All accounts' : currentAccount?.name;

      return (
        <div
          {...props}
          className={'trigger-container'}
          ref={ref as unknown as LegacyRef<HTMLDivElement> | undefined}
          style={{
            zIndex: 999
          }}
        >
          {isAllAccount
            ? (
              <MetaInfo.AccountGroup
                accounts={accounts}
                className='ava-group'
                content={content}
              />
            )
            : (
              <MetaInfo.Account
                address={currentAccount?.address}
                name={currentAccount?.name}
              />
            )
          }

          <Button
            icon={<CaretDown size={12} />}
            type='ghost'
          />
        </div>
      );
    }
  });

  const popOverContent = useMemo(() => {
    return (
      <div
        className={CN(className, 'account-selector-container')}
        key={accountSelectorKey}
      >
        <SwList.Section
          className={'__list-container'}
          enableSearchInput
          list={noAllAccounts.length <= 1 ? noAllAccounts : accounts}
          renderItem={renderItem}
          renderWhenEmpty={emptyTokenList}
          searchFunction={searchAccountFunction}
          searchMinCharactersCount={2}
          searchPlaceholder={t<string>('Account name')}
        />

        <SelectAccountFooter
          className={'__action-container'}
          extraAction={handleOpenChange}
        />
      </div>
    );
  }, [accountSelectorKey, accounts, className, handleOpenChange, noAllAccounts, renderItem, t]);

  return (
    <Popover
      content={popOverContent}
      onOpenChange={handleOpenChange}
      open={open}
      overlayInnerStyle={{
        padding: '0',
        boxShadow: 'none',
        backgroundColor: 'transparent'
      }}
      placement='bottomRight'
      showArrow={false}
      trigger='click'
    >
      <TriggerComponent />
    </Popover>
  );
};

const Accounts = styled(Component)<ThemeProps>(({ theme: { token } }: ThemeProps) => {
  return {
    '&.account-selector-container': {
      paddingTop: token.padding,
      background: token.colorBgDefault,
      border: `1px solid ${token.colorBgBorder}`,
      boxShadow: '4px 4px 4px 0px rgba(0, 0, 0, 0.25)',
      borderRadius: token.borderRadiusLG,
      width: 390,

      '.__list-container': {
        width: '100%',
        maxHeight: 500,
        marginBottom: token.margin
      },

      '.ant-sw-list': {
        paddingLeft: token.padding,
        paddingRight: token.padding,
        paddingTop: 0,
        paddingBottom: 0,

        '> div:not(:first-of-type)': {
          marginTop: token.marginXS
        }
      },

      '.ant-account-card-name': {
        'white-space': 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis'
      },

      '.ant-web3-block-right-item': {
        marginRight: 0
      },

      '.__action-container': {
        borderTop: `2px solid ${token.colorBgBorder}`,
        justifyContent: 'space-between',
        padding: token.padding
      },

      '.ant-btn.ant-btn-block': {
        width: 'auto'
      }
    }
  };
});

export default Accounts;
