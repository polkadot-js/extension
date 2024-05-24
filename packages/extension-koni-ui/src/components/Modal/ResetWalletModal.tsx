// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { LATEST_SESSION, RESET_WALLET_MODAL } from '@subwallet/extension-koni-ui/constants';
import { InjectContext } from '@subwallet/extension-koni-ui/contexts/InjectContext';
import useUILock from '@subwallet/extension-koni-ui/hooks/common/useUILock';
import { resetWallet } from '@subwallet/extension-koni-ui/messaging';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { Button, Icon, ModalContext, PageIcon, SwModal } from '@subwallet/react-ui';
import CN from 'classnames';
import { ArrowCounterClockwise, Trash, WarningCircle } from 'phosphor-react';
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
  const { unlock } = useUILock();
  const { inactiveModal } = useContext(ModalContext);
  const { disableInject } = useContext(InjectContext);

  const [loading, setLoading] = useState(false);
  const [loadingAll, setLoadingAll] = useState(false);

  const onClose = useCallback(() => {
    inactiveModal(modalId);
  }, [inactiveModal]);

  const onReset = useCallback((resetAll: boolean) => {
    return () => {
      const _setLoading = resetAll ? setLoadingAll : setLoading;

      _setLoading(true);

      setTimeout(() => {
        disableInject();
        resetWallet({
          resetAll: resetAll
        })
          .then((rs) => {
            if (!rs.status) {
              notify({
                message: rs.errors[0],
                type: 'error'
              });
            } else {
              unlock();
            }
          })
          .catch((e: Error) => {
            notify({
              message: e.message,
              type: 'error'
            });
          })
          .finally(() => {
            _setLoading(false);
            localStorage.removeItem(LATEST_SESSION);
            onClose();
          });
      }, 300);
    };
  }, [disableInject, notify, onClose, unlock]);

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
        <div className='footer-area'>
          <Button
            block={true}
            className='footer-button'
            disabled={loadingAll}
            icon={(
              <Icon
                phosphorIcon={ArrowCounterClockwise}
                weight='fill'
              />
            )}
            loading={loading}
            onClick={onReset(false)}
            schema='secondary'
          >
            {t('Reset account')}
          </Button>
          <Button
            block={true}
            className='footer-button'
            disabled={loading}
            icon={(
              <Icon
                phosphorIcon={Trash}
                weight='fill'
              />
            )}
            loading={loadingAll}
            onClick={onReset(true)}
            schema='danger'
          >
            {t('Erase all')}
          </Button>
        </div>
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

    '.description': {
      paddingLeft: token.padding,
      paddingRight: token.padding,
      textAlign: 'center',
      fontSize: token.fontSizeHeading6,
      lineHeight: token.lineHeightHeading6,
      color: token.colorTextDescription
    },

    '.footer-area': {
      display: 'flex',
      flexDirection: 'row',
      gap: token.sizeSM,
      width: '100%'
    },

    '.footer-button': {
      width: 172
    }
  };
});

export default ResetWalletModal;
