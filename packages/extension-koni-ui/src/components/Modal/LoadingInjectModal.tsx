// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { LOAD_INJECT_MODAL } from '@subwallet/extension-koni-ui/constants/modal';
import { pingInject } from '@subwallet/extension-koni-ui/messaging';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { Button, Icon, ModalContext, SwModal } from '@subwallet/react-ui';
import CN from 'classnames';
import { ArrowRight, Info } from 'phosphor-react';
import React, { useCallback, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

type Props = ThemeProps;

const modalId = LOAD_INJECT_MODAL;

const Component: React.FC<Props> = (props: Props) => {
  const { className } = props;

  const { t } = useTranslation();

  const { inactiveModal } = useContext(ModalContext);

  const closeModal = useCallback(() => {
    inactiveModal(modalId);
  }, [inactiveModal]);

  const onClick = useCallback(() => {
    pingInject().catch(console.error);
    inactiveModal(modalId);
  }, [inactiveModal]);

  return (
    <SwModal
      closable={false}
      id={modalId}
      maskClosable={false}
      onCancel={closeModal}
      title={t('Inject account')}
      wrapClassName={CN(className)}
    >
      <div className='body-container'>
        <div className='notice'>
          <Icon
            iconColor='var(--icon-warning-color)'
            phosphorIcon={Info}
            size='sm'
          />
          <div className='title'>
            {t('Loading inject account')}
          </div>
        </div>
        <div className='description'>
          {t('Please check the extension to confirm')}
        </div>
        <Button
          block={true}
          icon={(
            <Icon
              phosphorIcon={ArrowRight}
            />
          )}
          onClick={onClick}
        >
          {t('Skip')}
        </Button>
      </div>
    </SwModal>
  );
};

const LoadingInjectModal = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {
    '--icon-warning-color': token.colorInfo,

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
      color: token.colorInfo,
      fontSize: token.fontSizeHeading5,
      lineHeight: token.lineHeightHeading5
    },

    '.description': {
      color: token.colorTextDescription,
      fontSize: token.fontSizeHeading6,
      lineHeight: token.lineHeightHeading6
    }
  };
});

export default LoadingInjectModal;
