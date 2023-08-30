// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { BaseModal } from '@subwallet/extension-koni-ui/components/Modal/BaseModal';
import { CUSTOMIZE_MODAL } from '@subwallet/extension-koni-ui/constants/modal';
import useTranslation from '@subwallet/extension-koni-ui/hooks/common/useTranslation';
import { saveShowZeroBalance } from '@subwallet/extension-koni-ui/messaging';
import { RootState } from '@subwallet/extension-koni-ui/stores';
import { Theme, ThemeProps } from '@subwallet/extension-koni-ui/types';
import { BackgroundIcon, ModalContext, SettingItem, Switch } from '@subwallet/react-ui';
import { Wallet } from 'phosphor-react';
import React, { useCallback, useContext } from 'react';
import { useSelector } from 'react-redux';
import styled, { useTheme } from 'styled-components';

import CustomizeModalContent from './CustomizeModalContent';

type Props = ThemeProps;

function Component ({ className = '' }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const { inactiveModal } = useContext(ModalContext);
  const { token } = useTheme() as Theme;
  const isShowZeroBalance = useSelector((state: RootState) => state.settings.isShowZeroBalance);

  const onChangeZeroBalance = useCallback(() => {
    saveShowZeroBalance(!isShowZeroBalance).catch(console.error);
  }, [isShowZeroBalance]);

  const onCancel = useCallback(() => {
    inactiveModal(CUSTOMIZE_MODAL);
  }, [inactiveModal]);

  return (
    <BaseModal
      className={className}
      destroyOnClose={true}
      id={CUSTOMIZE_MODAL}
      onCancel={onCancel}
      title={t('Customize asset display')}
    >
      <div className={'__group-label'}>{t('Balance')}</div>
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
          name={t('Show zero balance')}
          rightItem={
            <Switch
              checked={isShowZeroBalance}
              onClick={onChangeZeroBalance}
              style={{ marginRight: 8 }}
            />}
        />
      </div>

      <div className={'__group-label'}>{t('Networks')}</div>

      <CustomizeModalContent />
    </BaseModal>
  );
}

export const CustomizeModal = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return ({
    '.ant-sw-modal-content': {
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    },

    '.ant-sw-modal-body': {
      paddingLeft: 0,
      paddingRight: 0,
      display: 'flex',
      flexDirection: 'column',
      flex: 1,
      paddingBottom: token.size
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
    },

    '.network_item__container .ant-web3-block-right-item': {
      marginRight: 0
    },

    '.ant-sw-list': {
      height: '100%'
    }
  });
});
