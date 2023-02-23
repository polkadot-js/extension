// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { TokenBalanceSelectionItem } from '@subwallet/extension-koni-ui/components/TokenItem/TokenBalanceSelectionItem';
import { RootState } from '@subwallet/extension-koni-ui/stores';
import { updateShowZeroBalanceState } from '@subwallet/extension-koni-ui/stores/utils';
import { Theme, ThemeProps } from '@subwallet/extension-koni-ui/types';
import { TokenBalanceItemType } from '@subwallet/extension-koni-ui/types/balance';
import { BackgroundIcon, SettingItem, Switch, SwList, SwModal } from '@subwallet/react-ui';
import { Wallet } from 'phosphor-react';
import React, { useCallback } from 'react';
import { useSelector } from 'react-redux';
import styled, { useTheme } from 'styled-components';

type Props = ThemeProps & {
  id: string,
  onCancel: () => void,
}

function Component ({ className = '', id, onCancel }: Props): React.ReactElement<Props> {
  const { token } = useTheme() as Theme;
  const isShowZeroBalance = useSelector((state: RootState) => state.settings.isShowZeroBalance);
  // todo: auto clear search when closing modal, may need update reactUI swList component

  const onChangeZeroBalance = useCallback((checked: boolean) => {
    updateShowZeroBalanceState(checked);
  }, []);

  const renderChainItem = useCallback(
    (tokenBalance: TokenBalanceItemType) => {
      return (
        <TokenBalanceSelectionItem
          key={tokenBalance.slug}
          {...tokenBalance}
        />
      );
    },
    []
  );

  const chainSearchFunc = useCallback((item: TokenBalanceItemType, searchText: string) => {
    const searchTextLowerCase = searchText.toLowerCase();

    return (
      item.symbol.toLowerCase().includes(searchTextLowerCase)
    );
  }, []);

  return (
    <SwModal
      className={className}
      id={id}
      onCancel={onCancel}
      title={'Select token'} // todo: i18n this
    >
      {/* // todo: i18n this */}
      <div className={'__group-label'}>Balance</div>
      <div className={'__group-content'}>
        <SettingItem
          className={'__setting-item'}
          leftItemIcon={
            <BackgroundIcon
              backgroundColor={token['green-6']}
              iconColor={token.colorTextLight1}
              phosphorIcon={Wallet}
              size='sm'
              type='phosphor'
              weight='fill'
            />
          }
          name={'Show zero balance'} // todo: i18n this
          rightItem={
            <Switch
              checked={isShowZeroBalance}
              onClick={onChangeZeroBalance}
              style={{ marginRight: 8 }}
            />}
        />
      </div>

      {/* // todo: i18n this */}
      <div className={'__group-label'}>Networks</div>

      {/* // todo: Nampc will continue to work with this list */}
      <SwList.Section
        displayRow
        enableSearchInput
        list={[]}
        renderItem={renderChainItem}
        rowGap = {'8px'}
        searchFunction={chainSearchFunc}
        searchMinCharactersCount={2}
        searchPlaceholder='Token name' // todo: i18n this
      />
    </SwModal>
  );
}

export const CustomizeModal = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return ({
    '.ant-sw-modal-body': {
      padding: 0,
      display: 'flex',
      minHeight: '80vh',
      flexDirection: 'column'
    },

    '.__group-label': {
      paddingLeft: token.padding,
      paddingRight: token.padding,
      color: token.colorTextLight3,
      textTransform: 'uppercase',
      fontSize: token.fontSizeSM,
      lineHeight: token.lineHeightSM,
      marginBottom: token.marginXS
    },

    '.__group-content': {
      paddingLeft: token.padding,
      paddingRight: token.padding,
      marginBottom: token.marginXS
    },

    '.__setting-item .ant-setting-item-content': {
      paddingTop: 0,
      paddingBottom: 0,
      height: 52,
      alignItems: 'center'
    },

    '.ant-sw-list-section': {
      flex: 1
    }
  });
});
