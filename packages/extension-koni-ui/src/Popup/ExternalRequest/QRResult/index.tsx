// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { Button, Modal } from '@subwallet/extension-koni-ui/components';
import { ActionContext } from '@subwallet/extension-koni-ui/contexts';
import { ScannerContext } from '@subwallet/extension-koni-ui/contexts/ScannerContext';
import useTranslation from '@subwallet/extension-koni-ui/hooks/useTranslation';
import ViewQRDetail from '@subwallet/extension-koni-ui/Popup/ExternalRequest/ViewQRDetail';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import CN from 'classnames';
import React, { useCallback, useContext, useMemo, useState } from 'react';
import QRCode from 'react-qr-code';
import styled from 'styled-components';

interface Props extends ThemeProps{
  className?: string;
}

const QRResult = (props: Props) => {
  const { className } = props;

  const { t } = useTranslation();

  const onAction = useContext(ActionContext);
  const { cleanup, state: scannerState } = useContext(ScannerContext);
  const { signedData } = scannerState;

  const [isOpen, setIsOpen] = useState(false);

  const handlerOpenModal = useCallback(() => {
    setIsOpen(true);
  }, []);

  const handlerCloseModal = useCallback(() => {
    setIsOpen(false);
  }, []);

  const modalContent = useMemo((): JSX.Element => {
    return <ViewQRDetail onClose={handlerCloseModal} />;
  }, [handlerCloseModal]);

  const handlerDone = useCallback(() => {
    cleanup();
    window.localStorage.setItem('popupNavigation', '/');
    onAction('/');
  }, [cleanup, onAction]);

  return (
    <div className={CN(className)}>
      <div className={CN('account-qr-modal__qr-code')}>
        <QRCode
          size={300}
          value={signedData}
        />
      </div>
      <div
        className={CN('show-detail-button')}
        onClick={handlerOpenModal}
      >
        Show detail
      </div>
      <Button
        className={CN('done-button')}
        onClick={handlerDone}
      >
        {t('Done')}
      </Button>
      {
        isOpen && (
          <Modal
            className={'qr-result-modal'}
            maskClosable={true}
            onClose={handlerCloseModal}
          >
            {modalContent}
          </Modal>
        )
      }
    </div>
  );
};

export default React.memo(styled(QRResult)(({ theme }: Props) => `
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 0 15px 15px;

  .hidden {
    display: none;
  }

  .qr-result-modal .subwallet-modal {
    max-width: 390px;
    height: 490px;
  }

  .account-qr-modal__qr-code {
    margin: 25px 0;
    border: 2px solid ${theme.borderQr};
    width: 304px;
    height: 304px;
  }

  .show-detail-button {
    cursor: pointer;
    background: ${theme.checkboxColor};
    padding: 2px 6px;
    border-radius: 3px;
    color: ${theme.textColor2};
    font-style: normal;
    font-weight: 400;
    font-size: 13px;
    line-height: 20px;
    text-align: center;
  }

  .done-button{
    width: 200px;
    margin-top: 30px;
  }
`));
