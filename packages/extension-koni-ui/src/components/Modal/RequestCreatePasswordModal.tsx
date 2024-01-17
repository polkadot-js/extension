// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { REQUEST_CREATE_PASSWORD_MODAL } from '@subwallet/extension-koni-ui/constants/modal';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { Button, Icon, ModalContext, PageIcon, SwModal } from '@subwallet/react-ui';
import CN from 'classnames';
import { ShieldPlus, ShieldStar } from 'phosphor-react';
import React, { useCallback, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

type Props = ThemeProps

const modalId = REQUEST_CREATE_PASSWORD_MODAL;

const Component: React.FC<Props> = (props: Props) => {
  const { className } = props;

  const { t } = useTranslation();
  const navigate = useNavigate();
  const { inactiveModal } = useContext(ModalContext);

  const onClick = useCallback(() => {
    inactiveModal(modalId);
    navigate('/keyring/create-password');
  }, [navigate, inactiveModal]);

  return (
    <SwModal
      closable={false}
      id={modalId}
      maskClosable={false}
      title={t('Create master password')}
      wrapClassName={CN(className)}
    >
      <div className='body-container'>
        <div className='page-icon'>
          <PageIcon
            color='var(--page-icon-color)'
            iconProps={{
              weight: 'fill',
              phosphorIcon: ShieldStar
            }}
          />
        </div>
        <div className='description'>
          {t('Your master password is the password that allows access to multiple accounts. Once a master password is confirmed, you will not need to manually type your password with every transaction.')}
        </div>
        <Button
          block={true}
          icon={(
            <Icon
              phosphorIcon={ShieldPlus}
              weight='fill'
            />
          )}
          onClick={onClick}
        >
          {t('Create master password')}
        </Button>
      </div>
    </SwModal>
  );
};

const RequestCreatePasswordModal = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {
    '.body-container': {
      textAlign: 'center',

      '.page-icon': {
        display: 'flex',
        justifyContent: 'center',
        marginTop: token.margin,
        '--page-icon-color': token.colorSecondary
      },

      '.description': {
        padding: `0 ${token.padding}px`,
        fontSize: token.fontSizeHeading6,
        lineHeight: token.lineHeightHeading6,
        color: token.colorTextDescription,
        textAlign: 'center',
        margin: `${token.marginMD}px 0`
      }
    }
  };
});

export default RequestCreatePasswordModal;
