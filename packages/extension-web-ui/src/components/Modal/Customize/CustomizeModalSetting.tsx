// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import useTranslation from '@subwallet/extension-web-ui/hooks/common/useTranslation';
import { saveShowZeroBalance } from '@subwallet/extension-web-ui/messaging';
import { RootState } from '@subwallet/extension-web-ui/stores';
import { Theme, ThemeProps } from '@subwallet/extension-web-ui/types';
import { BackgroundIcon, SettingItem, Switch } from '@subwallet/react-ui';
import { Wallet } from 'phosphor-react';
import React, { useCallback } from 'react';
import { useSelector } from 'react-redux';
import styled, { useTheme } from 'styled-components';

type Props = ThemeProps;

function Component ({ className = '' }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const { token } = useTheme() as Theme;
  const isShowZeroBalance = useSelector((state: RootState) => state.settings.isShowZeroBalance);

  const onChangeZeroBalance = useCallback(() => {
    saveShowZeroBalance(!isShowZeroBalance).catch(console.error);
  }, [isShowZeroBalance]);

  return (
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
      name={t('Show zero balance')}
      rightItem={
        <Switch
          checked={isShowZeroBalance}
          onClick={onChangeZeroBalance}
          style={{ marginRight: 8 }}
        />}
    />
  );
}

export const CustomizeModalSetting = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return ({});
});
