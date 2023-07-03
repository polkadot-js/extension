// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { AccountJson } from '@subwallet/extension-base/background/types';
import { ALL_ACCOUNT_KEY } from '@subwallet/extension-base/constants';
import { isSameAddress } from '@subwallet/extension-base/utils';
import { AccountItemWithName } from '@subwallet/extension-koni-ui/components';
import { useTranslation } from '@subwallet/extension-koni-ui/hooks';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { searchAccountFunction } from '@subwallet/extension-koni-ui/utils';
import { ModalContext, SwList, SwModal } from '@subwallet/react-ui';
import CN from 'classnames';
import React, { useCallback, useContext } from 'react';
import styled from 'styled-components';

import GeneralEmptyList from '../../GeneralEmptyList';
import WCAccountInput from './WCAccountInput';

interface Props extends ThemeProps {
  id: string;
  selectedAccounts: string[];
  availableAccounts: AccountJson[];
  onSelectAccount: (account: string) => VoidFunction;
  useModal: boolean;
}

const renderEmpty = () => <GeneralEmptyList />;

const Component: React.FC<Props> = (props: Props) => {
  const { availableAccounts, className, id, onSelectAccount, selectedAccounts, useModal } = props;

  const { t } = useTranslation();

  const { activeModal, inactiveModal } = useContext(ModalContext);

  const onOpenModal = useCallback(() => {
    activeModal(id);
  }, [activeModal, id]);

  const onCloseModal = useCallback(() => {
    inactiveModal(id);
  }, [inactiveModal, id]);

  const renderItem = useCallback((item: AccountJson) => {
    const selected = !!selectedAccounts.find((address) => isSameAddress(address, item.address));

    return (
      <AccountItemWithName
        accountName={item.name}
        address={item.address}
        direction='horizontal'
        isSelected={selected}
        key={item.address}
        onClick={onSelectAccount(item.address)}
        showUnselectIcon={true}
      />
    );
  }, [onSelectAccount, selectedAccounts]);

  return (
    <div className={CN(className)}>
      { useModal && (
        <>
          <WCAccountInput
            accounts={availableAccounts}
            onClick={onOpenModal}
            selected={selectedAccounts}
          />
          <SwModal
            className={CN(className, 'account-modal')}
            id={id}
            onCancel={onCloseModal}
            title={t('Select account')}
          >
            <SwList.Section
              className='account-list'
              displayRow
              enableSearchInput={true}
              list={availableAccounts}
              renderItem={renderItem}
              renderWhenEmpty={renderEmpty}
              rowGap='var(--row-gap)'
              searchFunction={searchAccountFunction}
              searchMinCharactersCount={2}
              searchPlaceholder={t<string>('Search account')}
            />
          </SwModal>
        </>
      )}
      {
        !useModal && (
          <>
            <div className='account-list'>
              {availableAccounts.length && (
                <AccountItemWithName
                  accountName={'Select all accounts'}
                  address={ALL_ACCOUNT_KEY}
                  avatarSize={24}
                  isSelected={selectedAccounts.length === availableAccounts.length}
                  onClick={onSelectAccount(ALL_ACCOUNT_KEY)}
                  showUnselectIcon
                />
              )}
              {availableAccounts.map((item) => {
                const selected = !!selectedAccounts.find((address) => isSameAddress(address, item.address));

                return (
                  <AccountItemWithName
                    accountName={item.name}
                    address={item.address}
                    avatarSize={24}
                    isSelected={selected}
                    key={item.address}
                    onClick={onSelectAccount(item.address)}
                    showUnselectIcon
                  />
                );
              })}
            </div>
          </>
        )
      }
    </div>
  );
};

const WCAccountSelect = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {
    '--row-gap': token.sizeXS,

    '.account-list': {
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--row-gap)'
    },

    '&.account-modal': {
      '.ant-sw-modal-body': {
        padding: `${token.padding}px 0 ${token.padding}px`,
        flexDirection: 'column',
        display: 'flex'
      },

      '.ant-sw-list-wrapper': {
        flexBasis: 'auto'
      }
    }
  };
});

export default WCAccountSelect;
