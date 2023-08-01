// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { CustomizeModalSetting } from '@subwallet/extension-koni-ui/components/Modal/Customize/CustomizeModalSetting';
import { CUSTOMIZE_MODAL } from '@subwallet/extension-koni-ui/constants/modal';
import { ScreenContext } from '@subwallet/extension-koni-ui/contexts/ScreenContext';
import useTranslation from '@subwallet/extension-koni-ui/hooks/common/useTranslation';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { ModalContext, SwModal } from '@subwallet/react-ui';
import React, { useCallback, useContext } from 'react';
import styled from 'styled-components';

import CustomizeModalContent from './CustomizeModalContent';

type Props = ThemeProps;

function Component ({ className = '' }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const { inactiveModal } = useContext(ModalContext);
  const { isWebUI } = useContext(ScreenContext);

  const onCancel = useCallback(() => {
    inactiveModal(CUSTOMIZE_MODAL);
  }, [inactiveModal]);

  return (
    <SwModal
      className={className}
      destroyOnClose={true}
      id={CUSTOMIZE_MODAL}
      onCancel={onCancel}
      title={t('Customize asset display')}
    >
      <div className={'__group-label'}>{t('Balance')}</div>
      <div className={'__group-content'}>
        <CustomizeModalSetting />
      </div>
      {!isWebUI && (
        <>
          <div className={'__group-label'}>{t('Chains')}</div>

          <CustomizeModalContent />
        </>)}
    </SwModal>
  );
}

export const CustomizeModal = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return ({
    '.ant-sw-modal-content': {
      maxHeight: 586,
      overflow: 'hidden'
    },

    '.ant-sw-modal-body': {
      paddingLeft: 0,
      paddingRight: 0,
      paddingBottom: 0,
      display: 'flex',
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
    },

    '.network_item__container .ant-web3-block-right-item': {
      marginRight: 0
    }
  });
});
