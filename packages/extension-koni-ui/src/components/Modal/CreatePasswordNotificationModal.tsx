// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { Button } from '@subwallet/extension-koni-ui/components';
import Modal from '@subwallet/extension-koni-ui/components/Modal/index';
import useTranslation from '@subwallet/extension-koni-ui/hooks/useTranslation';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import CN from 'classnames';
import React from 'react';
import styled from 'styled-components';

import icon from '../../assets/Illustration.png';
import bg from '../../assets/MasterPassword_bg.png';

interface Props extends ThemeProps {
  className?: string;
  closeModal: () => void;
}

const CreatePasswordNotificationModal = ({ className, closeModal }: Props) => {
  const { t } = useTranslation();

  return (
    <Modal
      className={CN(className)}
      maskClosable={false}
      wrapperClassName={'master-password-modal'}
    >
      <div className={'modal-header'}>
        <div className='modal-title'>
          {t('Create master password')}
        </div>
        <img
          alt='shield'
          className='modal-icon'
          src={icon}
        />
      </div>
      <div className={'modal-body'}>
        <div
          className='notification-text'
        >
          {t<string>('You must create wallet password before continue')}
        </div>
        <div className='separator' />
      </div>
      <div className='modal-footer'>
        <Button
          className='save-button'
          onClick={closeModal}
        >
          {t('Create')}
        </Button>
      </div>
    </Modal>
  );
};

export default React.memo(styled(CreatePasswordNotificationModal)(({ theme }: Props) => `
  .master-password-modal {
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
      padding-top: 8px;

      .separator {
        margin-top: 32px;
        margin-bottom: 16px;
      }

      .separator:before {
        content: "";
        height: 1px;
        display: block;
        background: ${theme.boxBorderColor};
      }

      .notification-text {
        font-style: normal;
        font-weight: 400;
        font-size: 15px;
        line-height: 26px;
        text-align: center;
        color: ${theme.textColor2};
      }
    }

    .modal-footer {
      padding-bottom: 5px;
      display: flex;
      flex-direction: row;
      align-items: center;
      justify-content: center;

      .save-button {
        width: 200px;
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
