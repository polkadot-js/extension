// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { faTimes } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React from 'react';
import styled from 'styled-components';

import confirmIcon from '@polkadot/extension-koni-ui/assets/confirmIcon.png';
import { Button, Modal } from '@polkadot/extension-koni-ui/components';
import useTranslation from '@polkadot/extension-koni-ui/hooks/useTranslation';
import { ThemeProps } from '@polkadot/extension-koni-ui/types';

interface Props extends ThemeProps {
  className?: string;
  closeModal: () => void;
  isBusy?: boolean;
  confirmAction: () => void;
  confirmMessage: string;
  confirmButton: string;
}

function ConfirmModal ({ className, closeModal, confirmAction, confirmButton, confirmMessage, isBusy }: Props): React.ReactElement {
  const { t } = useTranslation();

  return (
    <div className={className}>
      <Modal>
        <div className='confirm-modal'>
          <div className='confirm-modal__header'>
            <FontAwesomeIcon
              className='confirm-modal__icon'
              // @ts-ignore
              icon={faTimes}
              onClick={closeModal}
            />
          </div>
          <img
            alt='confirm'
            className='confirm-modal__logo'
            src={confirmIcon}
          />
          <div className='confirm-modal__body'>
            <div className='confirm-modal__message'>
              {t<string>(confirmMessage)}
            </div>
            <div className='confirm-modal__button-area'>
              <Button
                className='confirm-modal__btn'
                isDisabled={isBusy}
                onClick={closeModal}
              >
                <span>{t<string>('Cancel')}</span>
              </Button>
              <Button
                className='confirm-modal__btn'
                isDanger
                isDisabled={isBusy}
                onClick={confirmAction}
              >
                {t<string>(confirmButton)}
              </Button>
            </div>

          </div>
        </div>
      </Modal>
    </div>

  );
}

export default styled(ConfirmModal)(({ theme }: Props) => `
  .confirm-modal {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .confirm-modal__header {
    position: absolute;
    top: -5px;
    right: 0;
    cursor: pointer;
  }

  .confirm-modal__message {
    padding-top: 28px;
    padding-bottom: 28px;
    font-weight: 500;
    font-size: 18px;
    line-height: 28px;
    text-align: center;
  }

  .confirm-modal__icon {
    cursor: pointer;
    color: ${theme.textColor};
  }

  .confirm-modal__button-area {
    display: flex;
  }

  .confirm-modal__btn {
    height: 40px;

    .children {
      font-size: 15px;
      line-height: 26px;
    }
  }

  .confirm-modal__btn:first-child {
    margin-right: 8px;
    background-color: ${theme.buttonBackground1};

    span {
      color: ${theme.buttonTextColor2};
    }
  }

  .confirm-modal__btn:last-child {
    margin-left: 8px;
  }

  .confirm-modal__logo {
    width: 40px;
    min-width: 40px;
    padding-top: 22px;
  }
`);
