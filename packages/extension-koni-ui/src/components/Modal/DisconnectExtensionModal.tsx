// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { DISCONNECT_EXTENSION_MODAL } from '@subwallet/extension-koni-ui/constants';
import { InjectContext } from '@subwallet/extension-koni-ui/contexts/InjectContext';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { Button, ModalContext, SwModal } from '@subwallet/react-ui';
import CN from 'classnames';
import React, { useCallback, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

type Props = ThemeProps;

const modalId = DISCONNECT_EXTENSION_MODAL;

const Component: React.FC<Props> = (props: Props) => {
  const { className } = props;

  const { t } = useTranslation();

  const { inactiveModal } = useContext(ModalContext);

  const { disableInject } = useContext(InjectContext);

  const closeModal = useCallback(() => {
    inactiveModal(modalId);
  }, [inactiveModal]);

  const onClick = useCallback(() => {
    disableInject();
    inactiveModal(modalId);
  }, [disableInject, inactiveModal]);

  return (
    <SwModal
      id={modalId}
      onCancel={closeModal}
      title={t('Disconnect wallet')}
      wrapClassName={CN(className)}
    >
      <div className='body-container'>
        <div className='notice'>
          <div className='title'>
            {t('Do want to disconnect all wallets?')}
          </div>
        </div>
        <div className='description'>
          {t('All connected wallets will be disconnected immediately. If you want to disconnect some accounts, please go to the corresponding wallet app to disable.')}
        </div>
        <div className='button-group'>
          <Button
            block={true}
            onClick={closeModal}
            schema='secondary'
          >
            {t('Cancel')}
          </Button>
          <Button
            block={true}
            onClick={onClick}
            schema='danger'
          >
            {t('Disconnect')}
          </Button>
        </div>
      </div>
    </SwModal>
  );
};

const DisconnectExtensionModal = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {
    '.body-container': {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: token.sizeMD
    },

    '.notice': {
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
      gap: token.sizeXS
    },

    '.title': {
      fontWeight: token.fontWeightStrong,
      color: token.colorError,
      fontSize: token.fontSizeHeading5,
      lineHeight: token.lineHeightHeading5
    },

    '.description': {
      color: token.colorTextDescription,
      fontSize: token.fontSizeHeading6,
      lineHeight: token.lineHeightHeading6,
      textAlign: 'center',
      paddingRight: token.padding,
      paddingLeft: token.padding
    },

    '.button-group': {
      display: 'flex',
      flexDirection: 'row',
      width: '100%',
      gap: token.sizeSM
    }
  };
});

export default DisconnectExtensionModal;
