// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { AccountJson, CurrentAccountInfo } from '@subwallet/extension-base/background/types';
import { AccountBriefInfo, AccountCardSelection, AccountItemWithName, BasicOnChangeFunction, RadioGroup } from '@subwallet/extension-koni-ui/components';
import SelectAccountFooter from '@subwallet/extension-koni-ui/components/Layout/parts/SelectAccount/Footer';
import { BaseModal } from '@subwallet/extension-koni-ui/components/Modal/BaseModal';
import { DISCONNECT_EXTENSION_MODAL, SELECT_ACCOUNT_MODAL } from '@subwallet/extension-koni-ui/constants';
import { InjectContext } from '@subwallet/extension-koni-ui/contexts/InjectContext';
import { useDefaultNavigate } from '@subwallet/extension-koni-ui/hooks';
import { saveCurrentAccountAddress } from '@subwallet/extension-koni-ui/messaging';
import { RootState } from '@subwallet/extension-koni-ui/stores';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { findAccountByAddress, funcSortByName, isAccountAll, searchAccountFunction } from '@subwallet/extension-koni-ui/utils';
import { Icon, Input, Logo, ModalContext, SwList, Typography } from '@subwallet/react-ui';
import CN from 'classnames';
import { CaretDown, SignOut } from 'phosphor-react';
import React, { useCallback, useContext, useDeferredValue, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import styled from 'styled-components';

import { isEthereumAddress } from '@polkadot/util-crypto';

import GeneralEmptyList from '../../../GeneralEmptyList';

type Props = ThemeProps;

type TabValue = 'web' | 'extension';

interface TabOption {
  label: string;
  value: TabValue;
}

interface TabData {
  accounts: AccountJson[];
  tab: TabValue;
}

const alwaysShow = true;

const modalId = SELECT_ACCOUNT_MODAL;
const renderEmpty = () => <GeneralEmptyList />;

const Component: React.FC<Props> = (props: Props) => {
  const { className } = props;

  const { t } = useTranslation();
  const navigate = useNavigate();
  const { goHome } = useDefaultNavigate();
  const location = useLocation();

  const { activeModal, checkActive, inactiveModal } = useContext(ModalContext);
  const { enabled: injectEnable } = useContext(InjectContext);

  const isActive = checkActive(modalId);

  const { accounts: _accounts, currentAccount } = useSelector((state: RootState) => state.accountState);

  const noAllAccounts = useMemo((): AccountJson[] => {
    return [..._accounts].filter((acc) => !isAccountAll(acc.address)).sort(funcSortByName);
  }, [_accounts]);

  const allAccount = useMemo((): AccountJson | undefined => {
    return [..._accounts].find((acc) => isAccountAll(acc.address));
  }, [_accounts]);

  const walletAccounts = useMemo((): AccountJson[] => {
    return [...noAllAccounts].filter((acc) => !acc.isInjected).sort(funcSortByName);
  }, [noAllAccounts]);

  const injectedAccounts = useMemo((): AccountJson[] => {
    return [...noAllAccounts].filter((acc) => acc.isInjected).sort(funcSortByName);
  }, [noAllAccounts]);

  const data = useMemo((): TabData[] => {
    return [
      {
        accounts: walletAccounts,
        tab: 'web'
      },
      {
        accounts: injectedAccounts,
        tab: 'extension'
      }
    ];
  }, [injectedAccounts, walletAccounts]);

  const selectedItem = useMemo<AccountJson | undefined>(
    () => _accounts.find((item) => (item.address) === currentAccount?.address),
    [_accounts, currentAccount?.address]
  );

  const tabOptions = useMemo((): TabOption[] => {
    return [
      {
        label: t('Web'),
        value: 'web'
      },
      {
        label: t('Extension'),
        value: 'extension'
      }
    ];
  }, [t]);

  const [searchValue, setSearchValue] = useState<string>('');
  const _search = useDeferredValue(searchValue);
  const [selectedTab, setSelectedTab] = useState<TabValue>('web');

  const onSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchValue(e.target.value);
  }, []);

  const searchBy = useCallback(
    (item: AccountJson) => (searchAccountFunction(item, _search)),
    [_search]
  );

  const onSelect = useCallback((item: AccountJson) => {
    return () => {
      const address = item.address;

      if (address) {
        const accountByAddress = findAccountByAddress(_accounts, address);

        if (accountByAddress) {
          const accountInfo = {
            address: address
          } as CurrentAccountInfo;

          inactiveModal(modalId);

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
    };
  }, [_accounts, inactiveModal, location.pathname, navigate, goHome]);

  const onClickDetailAccount = useCallback((address: string) => {
    return () => {
      inactiveModal(modalId);
      setTimeout(() => {
        navigate(`/accounts/detail/${address}`);
      }, 100);
    };
  }, [navigate, inactiveModal]);

  const openDisconnectExtensionModal = useCallback(() => {
    activeModal(DISCONNECT_EXTENSION_MODAL);
  }, [activeModal]);

  const renderItem = useCallback((item: AccountJson) => {
    const currentAccountIsAll = isAccountAll(item.address);
    const _selected = item.address === currentAccount?.address;

    if (currentAccountIsAll) {
      return (
        <div
          className='account-item'
          key={item.address}
          onClick={onSelect(item)}
        >
          <AccountItemWithName
            address={item.address}
            className='all-account-selection'
            isSelected={_selected}
          />
        </div>
      );
    }

    const isInjected = !!item.isInjected;

    return (
      <div
        className='account-item'
        key={item.address}
        onClick={onSelect(item)}
      >
        <AccountCardSelection
          accountName={item.name || ''}
          address={item.address}
          className={className}
          genesisHash={item.genesisHash}
          isSelected={_selected}
          isShowSubIcon
          moreIcon={!isInjected ? undefined : SignOut}
          onPressMoreBtn={isInjected ? openDisconnectExtensionModal : onClickDetailAccount(item.address)}
          source={item.source}
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
  }, [className, currentAccount?.address, onClickDetailAccount, onSelect, openDisconnectExtensionModal]);

  const openModal = useCallback(() => {
    activeModal(modalId);
  }, [activeModal]);

  const closeModal = useCallback(() => {
    inactiveModal(modalId);
  }, [inactiveModal]);

  const onChangeTab: BasicOnChangeFunction = useCallback((event) => {
    const value = event.target.value as TabValue;

    setSelectedTab(value);
  }, []);

  useEffect(() => {
    if (!injectEnable) {
      setSelectedTab('web');
    }
  }, [injectEnable]);

  useEffect(() => {
    if (!isActive) {
      setSearchValue('');
    }
  }, [isActive]);

  return (
    <div className={CN(className)}>
      <div
        className={CN('input-container')}
        onClick={openModal}
      >
        <div className={CN('input-wrapper')}>
          <div className={CN('input-content')}>
            {
              selectedItem
                ? (
                  <div className='selected-account'>
                    <AccountBriefInfo account={selectedItem} />
                  </div>
                )
                : (
                  <Typography.Text className={CN('input-placeholder')}>
                    {t('Select account')}
                  </Typography.Text>
                )
            }
          </div>
          <div className={CN('input-suffix')}>
            <Icon
              phosphorIcon={CaretDown}
              weight='bold'
            />
          </div>
        </div>
      </div>

      <BaseModal
        className={CN(className)}
        footer={<SelectAccountFooter />}
        id={modalId}
        onCancel={closeModal}
        title={t('Select account')}
      >
        <div className={'search-input'}>
          <Input.Search
            onChange={onSearchChange}
            placeholder={t('Account name')}
            value={searchValue}
          />
        </div>

        {
          allAccount && (noAllAccounts.length > 1 || injectEnable || alwaysShow) && (renderItem(allAccount))
        }

        <RadioGroup
          className={CN({ hidden: !injectEnable && !alwaysShow })}
          onChange={onChangeTab}
          optionType='button'
          options={tabOptions}
          value={selectedTab}
        />

        {
          data.map(({ accounts, tab }) => {
            const selected = tab === selectedTab;

            return (
              <div
                className={CN('list-wrapper', { hidden: !selected })}
                key={tab}
              >
                <SwList
                  displayRow
                  list={accounts}
                  renderItem={renderItem}
                  renderWhenEmpty={renderEmpty}
                  rowGap='8px'
                  searchBy={searchBy}
                  searchMinCharactersCount={2}
                  searchTerm={searchValue}
                />
              </div>
            );
          })
        }
      </BaseModal>
    </div>
  );
};

const SelectAccountModal = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {
    '.input-container': {
      cursor: 'pointer',
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
      color: token.colorTextTertiary,
      lineHeight: token.lineHeightLG,
      position: 'relative',
      borderRadius: token.controlHeightLG + token.borderRadiusLG,
      overflow: 'hidden',
      background: token.colorBgSecondary,
      borderColor: token.colorBgSecondary
    },

    '.input-wrapper': {
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 8,
      padding: `${token.paddingContentVerticalSM}px ${token.paddingContentHorizontal}px`,
      paddingLeft: 0,
      overflow: 'hidden'
    },

    '.input-content': {
      overflow: 'hidden',
      flex: 1
    },

    '.input-placeholder': {
      color: token.colorText,
      fontSize: token.fontSizeHeading6,
      lineHeight: token.lineHeightHeading6
    },

    '.input-suffix': {
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center'
    },

    '.selected-account': {
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8
    },

    '.hidden': {
      display: 'none'
    },

    '.ant-account-card': {
      padding: token.paddingSM
    },

    '.list-wrapper': {
      flex: 1,
      overflow: 'auto',
      minHeight: 320
    },

    '.ant-sw-modal-body': {
      display: 'flex',
      flexDirection: 'column',
      gap: token.sizeXS
    }
  };
});

export default SelectAccountModal;
