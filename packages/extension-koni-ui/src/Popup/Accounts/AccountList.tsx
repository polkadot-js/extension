// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import useTranslation from '@subwallet/extension-koni-ui/hooks/useTranslation';
import { Theme } from '@subwallet/extension-koni-ui/themes';
import { Button, SelectModal } from '@subwallet/react-ui';
import React, { useCallback, useState } from 'react';
import styled from 'styled-components';
import { useSelector } from 'react-redux';
import { RootState } from '@subwallet/extension-koni-ui/stores';
import { AccountJson } from '@subwallet/extension-base/background/types';
import AccountCardSelection from '@subwallet/extension-koni-ui/components/Account/AccountCardSelection';
import Icon from '@subwallet/react-ui/es/icon';
import { PlusCircle, FileArrowDown, Swatches } from 'phosphor-react';

interface Props {
  className?: string;
}

function _AccountList ({ className }: Props): React.ReactElement<Props> {
  const [selected, setSelected] = useState<string>('');
  const { t } = useTranslation();
  const { accounts } = useSelector((state: RootState) => state.accountState);
  const { } = useSelector((state: RootState) => state.chainStore);
  const _onSelect = useCallback((value: string) => {
    setSelected(value);
  }, []);

  const renderItem = (item: AccountJson, _selected: boolean) => {
    return (
      <AccountCardSelection className={className} accountName={item.name} address={item.address} genesisHash={item.genesisHash} isSelected={_selected} />
    );
  };

  const searchFunction = (item: AccountJson, searchText: string): boolean => {
    return item.address.includes(searchText) || (item.name || '').includes(searchText);
  }

  //TODO: delete style inline when upgrade @subwallet/react-ui
  return (
    <>
      {/* @ts-ignore */}
      <SelectModal
        className={className}
        id='account-list-modal'
        itemKey='address'
        items={accounts}
        onSelect={_onSelect}
        renderItem={renderItem}
        selected={selected}
        title={t('Select account')}
        searchFunction={searchFunction}
        searchPlaceholder={t('Account name')}
        footer={
          <div style={{ display: 'flex' }}>
            <Button schema='secondary' icon={<Icon phosphorIcon={PlusCircle} weight={'fill'}/>} block={true}>
              {t('Create new account')}
            </Button>
            <Button style={{ minWidth: 52  }} schema='secondary' icon={<Icon phosphorIcon={FileArrowDown} weight={'fill'}/>} />
            <Button style={{ minWidth: 52 }} schema='secondary' icon={<Icon phosphorIcon={Swatches} weight={'fill'}/>} />
          </div>
        }
      />
    </>
  );
}

const AccountList = styled(_AccountList)<Props>(({ theme }) => {
  const { token } = theme as Theme;

  return ({
    '&.ant-sw-modal': {
      '.ant-sw-modal-body': {
        maxHeight: '66vh'
      },

      '.ant-account-card': {
        padding: token.paddingSM,
      },

      '.ant-web3-block .ant-web3-block-middle-item': {
        textAlign: 'initial',
      },

      '.ant-account-card-name': {
        textOverflow: 'ellipsis',
        overflow: 'hidden',
        whiteSpace: 'nowrap',
        maxWidth: 120
      },

      '.ant-input-container .ant-input': {
        color: token.colorTextLight1
      },
    },

  });
});

export default AccountList;
