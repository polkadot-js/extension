// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { AccountJson } from '@subwallet/extension-base/background/types';
import { canDerive } from '@subwallet/extension-base/utils';
import EmptyAccount from '@subwallet/extension-koni-ui/components/Account/EmptyAccount';
import AccountItemWithName from '@subwallet/extension-koni-ui/components/Account/Item/AccountItemWithName';
import { EVM_ACCOUNT_TYPE } from '@subwallet/extension-koni-ui/constants/account';
import { DERIVE_ACCOUNT_MODAL } from '@subwallet/extension-koni-ui/constants/modal';
import useTranslation from '@subwallet/extension-koni-ui/hooks/useTranslation';
import { RootState } from '@subwallet/extension-koni-ui/stores';
import { Theme, ThemeProps } from '@subwallet/extension-koni-ui/types';
import { searchAccountFunction } from '@subwallet/extension-koni-ui/util/account';
import { ModalContext, SwList, SwModal } from '@subwallet/react-ui';
import React, { useCallback, useContext, useMemo } from 'react';
import { useSelector } from 'react-redux';
import styled, { useTheme } from 'styled-components';

type Props = ThemeProps;

const modalId = DERIVE_ACCOUNT_MODAL;

const renderEmpty = () => <EmptyAccount />;

const t = (x: string) => x;

const Component: React.FC<Props> = ({ className }: Props) => {
  const { t } = useTranslation();
  const { token } = useTheme() as Theme;

  const { inactiveModal } = useContext(ModalContext);

  const { accounts } = useSelector((state: RootState) => state.accountState);

  const filtered = useMemo(
    () => accounts
      .filter(({ isExternal }) => !isExternal)
      .filter(({ isMasterAccount, type }) => canDerive(type) && (type !== EVM_ACCOUNT_TYPE || (isMasterAccount && type === EVM_ACCOUNT_TYPE))),
    [accounts]
  );

  const onCancel = useCallback(() => {
    inactiveModal(modalId);
  }, [inactiveModal]);

  const onSelectAccount = useCallback((account: AccountJson): () => void => {
    return () => {
      inactiveModal(modalId);
    };
  }, [inactiveModal]);

  const renderItem = useCallback((account: AccountJson): React.ReactNode => {
    return (
      <React.Fragment key={account.address}>
        <AccountItemWithName
          accountName={account.name}
          address={account.address}
          avatarSize={token.sizeLG}
          onClick={onSelectAccount(account)}
        />
      </React.Fragment>
    );
  }, [onSelectAccount, token.sizeLG]);

  return (
    <SwModal
      className={className}
      id={modalId}
      maskClosable={false}
      onCancel={onCancel}
      title={t('Select Account')}
    >
      <SwList.Section
        displayRow={true}
        enableSearchInput={true}
        height='370px'
        list={filtered}
        renderItem={renderItem}
        renderWhenEmpty={renderEmpty}
        rowGap='var(--row-gap)'
        searchFunction={searchAccountFunction}
        searchPlaceholder={t('Account name')}
      />
    </SwModal>
  );
};

const DeriveAccountModal = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {
    '--row-gap': token.sizeXS,

    '.ant-web3-block': {
      display: 'flex !important'
    }
  };
});

export default DeriveAccountModal;
