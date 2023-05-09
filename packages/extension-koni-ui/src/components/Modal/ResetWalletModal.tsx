// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { RESET_WALLET_MODAL } from '@subwallet/extension-koni-ui/constants';
import { resetWallet } from '@subwallet/extension-koni-ui/messaging';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { Button, Checkbox, Icon, ModalContext, PageIcon, SwModal } from '@subwallet/react-ui';
import { CheckboxChangeEvent } from '@subwallet/react-ui/es/checkbox';
import CN from 'classnames';
import { Trash, WarningCircle } from 'phosphor-react';
import React, { useCallback, useContext, useState } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

import useNotification from '../../hooks/common/useNotification';

type Props = ThemeProps;

const modalId = RESET_WALLET_MODAL;

const Component: React.FC<Props> = (props: Props) => {
  const { className } = props;

  const { t } = useTranslation();
  const notify = useNotification();

  const { inactiveModal } = useContext(ModalContext);

  const [loading, setLoading] = useState(false);
  const [resetAll, setResetAll] = useState(false);

  const onClose = useCallback(() => {
    inactiveModal(modalId);
  }, [inactiveModal]);

  const onReset = useCallback(() => {
    setLoading(true);

    setTimeout(() => {
      resetWallet({
        resetAll: resetAll
      })
        .then((rs) => {
          if (!rs.status) {
            notify({
              message: rs.errors[0],
              type: 'error'
            });
          }
        })
        .catch((e: Error) => {
          notify({
            message: e.message,
            type: 'error'
          });
        })
        .finally(() => {
          setLoading(false);
          onClose();
        });
    }, 300);
  }, [notify, resetAll, onClose]);

  const onChange = useCallback((e: CheckboxChangeEvent) => {
    setResetAll(e.target.checked);
  }, []);

  return (
    <SwModal
      className={CN(className)}
      id={modalId}
      onCancel={onClose}
      title={t('Forgot password ?')}
    >
      <div className='container'>
        <div className='page-icon-container'>
          <PageIcon
            color='var(--page-icon-color)'
            iconProps={{ phosphorIcon: WarningCircle, weight: 'fill' }}
          />
        </div>
        <div className='description'>
          {t('We do not keep a copy of your password. If you’re having trouble unlocking your account, you will need to reset your wallet using the Secret Recovery Phrase')}
        </div>
        <div className='check-box-container'>
          <Checkbox
            checked={resetAll}
            className='check-box-wrapper'
            onChange={onChange}
          >
            {t('Reset all settings')}
          </Checkbox>
        </div>
        <Button
          block={true}
          icon={(
            <Icon
              phosphorIcon={Trash}
              weight='fill'
            />
          )}
          loading={loading}
          onClick={onReset}
          schema='danger'
        >
          {t('Reset wallet')}
        </Button>
      </div>
    </SwModal>
  );
};

const ResetWalletModal = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {
    '.container': {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: token.size
    },

    '.page-icon-container': {
      '--page-icon-color': token.colorError,
      marginTop: token.margin,
      marginBottom: token.marginXXS
    },

    '.check-box-container': {
      width: '100%'
    },

    '.check-box-wrapper': {
      alignItems: 'center'
    },

    '.description': {
      paddingLeft: token.padding,
      paddingRight: token.padding,
      textAlign: 'center',
      fontSize: token.fontSizeHeading6,
      lineHeight: token.lineHeightHeading6,
      color: token.colorTextDescription
    }
  };
});

export default ResetWalletModal;
