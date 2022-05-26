// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { Button } from '@subwallet/extension-koni-ui/components';
import { ScannerContext } from '@subwallet/extension-koni-ui/contexts/ScannerContext';
import useTranslation from '@subwallet/extension-koni-ui/hooks/useTranslation';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import CN from 'classnames';
import React, { useCallback, useContext } from 'react';
import QRCode from 'react-qr-code';
import { useHistory } from 'react-router';
import styled from 'styled-components';

interface Props extends ThemeProps{
  className?: string;
}

const QRResult = (props: Props) => {
  const { className } = props;

  const { t } = useTranslation();
  const history = useHistory();

  const { cleanup, state: scannerState } = useContext(ScannerContext);
  const { signedData } = scannerState;

  const handlerClickBack = useCallback(() => {
    cleanup();
  }, [cleanup]);

  const handlerClickHome = useCallback(() => {
    history.push('/');
  }, [history]);

  return (
    <div className={CN(className)}>
      <div className={CN('title')}>
        {t('Scan to publish')}
      </div>

      <div className={CN('account-qr-modal__qr-code')}>
        <QRCode
          size={248}
          value={signedData}
        />
      </div>
      <div className={CN('grid-container')}>
        <Button
          className={CN('button')}
          onClick={handlerClickBack}
        >
          {t('Scan another QR')}
        </Button>
        <Button
          className={CN('button')}
          onClick={handlerClickHome}
        >
          {t('Home')}
        </Button>
      </div>
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

  .title {
    font-size: 18px;
    line-height: 30px;
    font-weight: 500;
    color: ${theme.textColor};
    margin-top: 20px;
  }

  .account-qr-modal__qr-code {
    margin: 20px 0;
    border: 2px solid #fff;
    width: 252px;
    height: 252px;
  }

  .grid-container{
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    grid-gap: 4px;
    width: 100%;

    .button{
      margin-top: 8px;
    }
  }
`));
