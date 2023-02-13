// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import useTranslation from '@subwallet/extension-koni-ui/hooks/useTranslation';
import { Theme } from '@subwallet/extension-koni-ui/themes';
import { SelectModal } from '@subwallet/react-ui';
import React, { useCallback, useState } from 'react';
import styled from 'styled-components';
import { useSelector } from 'react-redux';
import { RootState } from '@subwallet/extension-koni-ui/stores';
import { AccountJson } from '@subwallet/extension-base/background/types';
import AccountItemWithName from '@subwallet/extension-koni-ui/components/Account/AccountItemWithName';

interface Props {
  className?: string;
}

function _SelectAccount ({ className }: Props): React.ReactElement<Props> {
  const [selected, setSelected] = useState<string>('');
  const { t } = useTranslation();
  const { accounts } = useSelector((state: RootState) => state.accountState);
  const { } = useSelector((state: RootState) => state.chainStore);
  const _onSelect = useCallback((value: string) => {
    setSelected(value);
  }, []);

  const renderItem = (item: AccountJson, _selected: boolean) => {
    return (
      <AccountItemWithName accountName={item.name} avatarSize={24} address={item.address} genesisHash={item.genesisHash} isSelected={_selected} />
    );
  };

  return (
    <>
      {/* @ts-ignore */}
      <SelectModal
        className={className}
        id='select-account-modal'
        itemKey='address'
        items={accounts}
        onSelect={_onSelect}
        renderItem={renderItem}
        selected={selected}
        title={t('Select account')}
      />
    </>
  );
}

export const SelectAccount = styled(_SelectAccount)<Props>(({ theme }) => {
  const { token } = theme as Theme;

  return ({
    '&.ant-sw-modal': {
      '.ant-web3-block': {
        padding: `${token.padding || 16 - 2}px ${token.paddingSM}px`,
        height: 52
      },
      '.ant-account-item-address': {
        textAlign: 'initial',
        color: token.colorTextLight4
      },
      '.account-item-content-wrapper': {
        display: 'flex'
      },

      '.account-item-name, .account-item-address-wrapper, .ant-account-item .ant-account-item-address': {
        fontSize: token.fontSize,
        lineHeight: token.lineHeight,
        fontWeight: 600,
      },

      '.account-item-address-wrapper': {
        paddingLeft: 2,
        display: 'flex',
        color: token.colorTextLight4,
      }
    }
  });
});
