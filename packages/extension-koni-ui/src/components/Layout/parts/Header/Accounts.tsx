// Copyright 2019-2022 @subwallet/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { AccountJson, CurrentAccountInfo } from '@subwallet/extension-base/background/types';
import { AccountCardSelection, AccountItemWithName } from '@subwallet/extension-koni-ui/components/Account';
import EmptyList from '@subwallet/extension-koni-ui/components/EmptyList';
import { MetaInfo } from '@subwallet/extension-koni-ui/components/MetaInfo';
import useDefaultNavigate from '@subwallet/extension-koni-ui/hooks/router/useDefaultNavigate';
import { saveCurrentAccountAddress } from '@subwallet/extension-koni-ui/messaging';
import { RootState } from '@subwallet/extension-koni-ui/stores';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { findAccountByAddress, funcSortByName, isAccountAll, searchAccountFunction } from '@subwallet/extension-koni-ui/utils';
import { Button, Divider, Logo, Popover, SwList } from '@subwallet/react-ui';
import { CaretDown, ListChecks } from 'phosphor-react';
import React, { forwardRef, LegacyRef, useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

import { isEthereumAddress } from '@polkadot/util-crypto';

import SelectAccountFooter from '../SelectAccount/Footer';

const StyledSection = styled(SwList.Section)<ThemeProps>(({ theme: { token } }: ThemeProps) => {
  return {
    '&.manage_chains__container': {
      maxHeight: 500,
      width: 390,
      background: token.colorBgBase,

      '.ant-sw-list': {
        padding: '8px 16px 10px',

        '.ant-web3-block': {
          padding: 10,
          margin: '4px 0',

          '.ant-web3-block-right-item': {
            marginRight: 0
          }
        }
      }
    }
  };
});

const StyledActions = styled.div<ThemeProps>(({ theme: { token } }: ThemeProps) => {
  return {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',

    '& > div': {
      display: 'flex',
      justifyContent: 'space-around',
      alignItems: 'center',
      gap: '8px'
    }
  };
});

const Component: React.FC = () => {
  const { t } = useTranslation();
  const { accounts: _accounts, currentAccount } = useSelector((state: RootState) => state.accountState);

  const [open, setOpen] = useState<boolean>(false);
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
  }, [accounts, navigate, goHome]);

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

  const emptyTokenList = useCallback(() => {
    return (
      <EmptyList
        emptyMessage={t<string>('Your chain will appear here.')}
        emptyTitle={t<string>('No chain found')}
        phosphorIcon={ListChecks}
      />
    );
  }, [t]);

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
      <>
        <StyledSection
          className={'manage_chains__container'}
          enableSearchInput
          list={noAllAccounts.length <= 1 ? noAllAccounts : accounts}
          mode={'boxed'}
          renderItem={renderItem}
          renderWhenEmpty={emptyTokenList}
          searchFunction={searchAccountFunction}
          searchMinCharactersCount={2}
          searchPlaceholder={t<string>('Search chain')}
        />
        <Divider />
        <StyledActions>
          <SelectAccountFooter extraAction={handleOpenChange} />
        </StyledActions>
      </>
    );
  }, [accounts, emptyTokenList, handleOpenChange, noAllAccounts, renderItem, t]);

  return (
    <Popover
      content={popOverContent}
      onOpenChange={handleOpenChange}
      open={open}
      overlayInnerStyle={{
        padding: '16px 0'
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
  };
});

export default Accounts;
