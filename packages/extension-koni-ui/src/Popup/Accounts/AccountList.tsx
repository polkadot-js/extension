// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { AccountJson } from '@subwallet/extension-base/background/types';
import AccountCardSelection from '@subwallet/extension-koni-ui/components/Account/AccountCardSelection';
import useTranslation from '@subwallet/extension-koni-ui/hooks/useTranslation';
import { RootState } from '@subwallet/extension-koni-ui/stores';
import { Theme } from '@subwallet/extension-koni-ui/themes';
import { Button, SelectModal } from '@subwallet/react-ui';
import Icon from '@subwallet/react-ui/es/icon';
import { FileArrowDown, PlusCircle, Swatches } from 'phosphor-react';
import React, { useCallback, useState } from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

interface Props {
  className?: string;
}

function _AccountList ({ className }: Props): React.ReactElement<Props> {
  const [selected, setSelected] = useState<string>('');
  const { t } = useTranslation();
  const { accounts } = useSelector((state: RootState) => state.accountState);
  const _onSelect = useCallback((value: string) => {
    setSelected(value);
  }, []);

  const renderItem = useCallback((item: AccountJson, _selected: boolean) => {
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

  const searchFunction = useCallback((item: AccountJson, searchText: string): boolean => {
    return item.address.includes(searchText) || (item.name || '').includes(searchText);
  }, []);

  // TODO: delete style inline when upgrade @subwallet/react-ui
  return (
    <>
      {/* @ts-ignore */}
      <SelectModal
        className={className}
        footer={
          <div style={{ display: 'flex' }}>
            <Button
              block={true}
              icon={<Icon
                phosphorIcon={PlusCircle}
                weight={'fill'}
              />}
              schema='secondary'
            >
              {t('Create new account')}
            </Button>
            <Button
              icon={<Icon
                phosphorIcon={FileArrowDown}
                weight={'fill'}
              />}
              schema='secondary'
              style={{ minWidth: 52 }}
            />
            <Button
              icon={<Icon
                phosphorIcon={Swatches}
                weight={'fill'}
              />}
              schema='secondary'
              style={{ minWidth: 52 }}
            />
          </div>
        }
        id='account-list-modal'
        itemKey='address'
        items={accounts}
        onSelect={_onSelect}
        renderItem={renderItem}
        searchFunction={searchFunction}
        searchPlaceholder={t('Account name')}
        selected={selected}
        title={t('Select account')}
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
    }

  });
});

export default AccountList;
