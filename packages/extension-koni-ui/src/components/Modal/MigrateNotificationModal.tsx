// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import successStatus from '@subwallet/extension-koni-ui/assets/success-status.svg';
import { ActionContext, Button, WaitAtHomeContext } from '@subwallet/extension-koni-ui/components';
import Modal from '@subwallet/extension-koni-ui/components/Modal/index';
import useTranslation from '@subwallet/extension-koni-ui/hooks/useTranslation';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import CN from 'classnames';
import React, { useCallback, useContext } from 'react';
import styled from 'styled-components';

import icon from '../../assets/Illustration.png';
import bg from '../../assets/MasterPassword_bg.png';

interface Props extends ThemeProps {
  className?: string;
  closeModal: () => void;
}

const MigrateNotificationModal = ({ className, closeModal }: Props) => {
  const { t } = useTranslation();

  const { setWait } = useContext(WaitAtHomeContext);
  const onAction = useContext(ActionContext);

  const onClose = useCallback(() => {
    closeModal();
    setWait(false);
  }, [closeModal, setWait]);

  const onApply = useCallback(() => {
    setWait(false);
    window.localStorage.setItem('popupNavigation', '/keyring/migrate');
    onAction('/keyring/migrate');
  }, [onAction, setWait]);

  return (
    <Modal
      className={CN(className)}
      maskClosable={false}
      wrapperClassName={'migrate-confirmation-modal'}
    >
      <div className={'modal-header'}>
        <div className='modal-title'>
          {t('Success')}
        </div>
        <img
          alt='shield'
          className='modal-icon'
          src={icon}
        />
      </div>
      <div className={'modal-body'}>
        <img
          alt='success'
          className='success-image'
          src={successStatus}
        />
        <div
          className='notification-text'
        >
          {t<string>('Master password created successfully. Please')}
        </div>
        <div
          className='notification-text'
        >
          {t<string>('apply the new password to your existing')}
        </div>
        <div
          className='notification-text'
        >
          {t<string>('accounts')}
        </div>
        <div className='separator' />
      </div>
      <div className='modal-footer'>
        <Button
          className='close-button'
          onClick={onClose}
        >
          {t('Later')}
        </Button>
        <Button
          className='apply-button'
          onClick={onApply}
        >
          {t('Apply now')}
        </Button>
      </div>
    </Modal>
  );
};

export default React.memo(styled(MigrateNotificationModal)(({ theme }: Props) => `
  .migrate-confirmation-modal {
    width: 400px;
    background-color: ${theme.popupBackground};

    .modal-header {
      height: 100px;
      margin: -15px -15px 0;
      padding: 12px;
      background-image: url(${bg});
      display: flex;
      flex-direction: row;
      align-items: center;
      justify-content: space-between;
      border-radius: 8px 8px 0 0;
      background-color: ${theme.background};


      .modal-title {
        font-style: normal;
        font-weight: 500;
        font-size: 20px;
        line-height: 32px;
        color: ${theme.textColor};
        margin-left: 4px;
      }

      .modal-icon {
        height: 79px;
        width: 96px;
      }
    }

    .modal-body {
      padding-top: 40px;
      text-align: center;

      .success-image {
        width: 160px;
        margin-bottom: 20px;
      }

      .notification-text {
        font-style: normal;
        font-weight: 400;
        font-size: 15px;
        line-height: 26px;
        text-align: center;
        color: ${theme.textColor2};
      }

      .separator {
        margin: 20px 0;
      }

      .separator:before {
        content: "";
        height: 1px;
        display: block;
        background: ${theme.boxBorderColor};
      }
    }

    .modal-footer {
      padding-bottom: 5px;
      display: flex;
      flex-direction: row;
      align-items: center;
      justify-content: center;
      flex: 1;
      margin: 0 -8px;

      .apply-button {
        flex: 1;
        margin: 0 8px;
      }

      .button__disabled-overlay {
        background: ${theme.popupBackground};
      }

      .close-button {
        flex: 1;
        margin: 0 8px;
        background-color: ${theme.toggleInactiveBgc};

        .children {
          color: ${theme.buttonTextColor2};
        }
      }
    }
  }

  &.ui--Tooltip {
    max-width: 330px;
    text-align: left;
    font-style: normal;
    font-weight: 400;
    font-size: 13px;
    line-height: 24px;
  }

  .validated-input__warning, .item-error {
    background: transparent;
    margin-top: 8px;
    padding: 0;

    .warning-image {
      width: 20px;
      margin-right: 8px;
      transform: translateY(2px);
    }

    .warning-message {
      color: ${theme.crowdloanFailStatus};
    }
  }
`));
