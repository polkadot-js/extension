// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { TransferError } from '@subwallet/extension-base/background/KoniTypes';
import failStatus from '@subwallet/extension-koni-ui/assets/fail-status.svg';
import successStatus from '@subwallet/extension-koni-ui/assets/success-status.svg';
import { ActionContext } from '@subwallet/extension-koni-ui/components';
import Button from '@subwallet/extension-koni-ui/components/Button';
import useScanExplorerTxUrl from '@subwallet/extension-koni-ui/hooks/screen/home/useScanExplorerTxUrl';
import useSupportScanExplorer from '@subwallet/extension-koni-ui/hooks/screen/home/useSupportScanExplorer';
import useTranslation from '@subwallet/extension-koni-ui/hooks/useTranslation';
import { ThemeProps, TransferResultType } from '@subwallet/extension-koni-ui/types';
import React, { useCallback, useContext } from 'react';
import styled from 'styled-components';

export interface Props extends ThemeProps {
  className?: string;
  txResult: TransferResultType;
  networkKey: string;
  onResend: () => void
}

function SendFundResult ({ className = '', networkKey, onResend, txResult: { extrinsicHash, isTxSuccess, txError } }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const navigate = useContext(ActionContext);
  const isSupportScanExplorer = useSupportScanExplorer(networkKey);
  const isScanExplorerTxUrl = useScanExplorerTxUrl(networkKey, extrinsicHash);
  const _backToHome = useCallback(
    () => {
      navigate('/');
    },
    [navigate]
  );

  const viewTransactionBtn = (extrinsicHash?: string) => {
    if (!extrinsicHash) {
      return null;
    }

    if (isSupportScanExplorer && isScanExplorerTxUrl) {
      return (
        <a
          className='send-fund-result__stt-btn send-fund-result__view-history-btn'
          href={isScanExplorerTxUrl}
          rel='noreferrer'
          target={'_blank'}
        >
          {t<string>('View Transaction')}
        </a>
      );
    }

    return (
      <span className='send-fund-result__stt-btn send-fund-result__view-history-btn -disabled'>
        {t<string>('View Transaction')}
      </span>
    );
  };

  const renderErrorMessage = (txError: Array<TransferError>) => {
    return txError.map((err) => (
      <div
        className={'send-fund-result__text-danger'}
        key={err.code}
      >
        {err.message}
      </div>
    ));
  };

  return (
    <div className={`send-fund-result-wrapper ${className}`}>
      {isTxSuccess
        ? <div className='send-fund-result'>
          <img
            alt='success'
            className='send-fund-result__status-img'
            src={successStatus}
          />
          <div className='send-fund-result__stt-text'>{t<string>('Send Fund Successful')}</div>
          <div
            className='send-fund-result__stt-subtext'
          >{t<string>('Your request has been confirmed. You can track its progress on the Transaction History page.')}</div>
          <Button
            className='send-fund-result__stt-btn'
            onClick={_backToHome}
          >
            {t<string>('Back To Home')}
          </Button>

          {viewTransactionBtn(extrinsicHash)}
        </div>
        : <div className='send-fund-result'>
          <img
            alt='fail'
            className='send-fund-result__status-img'
            src={failStatus}
          />
          <div className='send-fund-result__stt-text'>{t<string>('Send Fund Fail')}</div>
          <div className='send-fund-result__stt-subtext'>
            {extrinsicHash
              ? (t<string>('There was a problem with your request. You can track its progress on the Transaction History page.'))
              : (t<string>('There was a problem with your request.'))
            }

            {!!(txError && txError.length) && (
              renderErrorMessage(txError)
            )}
          </div>

          <Button
            className='send-fund-result__stt-btn'
            onClick={onResend}
          >
            {t<string>('Resend')}
          </Button>

          {viewTransactionBtn(extrinsicHash)}
        </div>
      }
    </div>
  );
}

export default React.memo(styled(SendFundResult)(({ theme }: ThemeProps) => `
  margin: 20px 45px 0;

  .send-fund-result {
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .send-fund-result__status-img {
    width: 120px;
    margin-top: 10px;
    margin-bottom: 32px;
  }

  .send-fund-result__stt-text {
    font-size: 20px;
    line-height: 36px;
    color: ${theme.textColor};
    font-weight: 500;
  }

  .send-fund-result__stt-subtext {
    color: ${theme.textColor};
    margin-bottom: 30px;
    text-align: center;
    font-size: 14px;
  }

  .send-fund-result__stt-btn {
    margin-bottom: 10px;
  }

  .send-fund-result__text-danger {
    color: ${theme.iconDangerColor};
  }

  .send-fund-result__stt-btn > .children {
    font-weight: 500;
  }

  .send-fund-result__view-history-btn {
    background-color: ${theme.buttonBackground2};
    color: ${theme.buttonTextColor3};
    cursor: pointer;
    display: flex;
    width: 100%;
    height: 48px;
    box-sizing: border-box;
    border: none;
    border-radius: 8px;
    font-size: 16px;
    line-height: 26px;
    padding: 0 1rem;
    position: relative;
    text-align: center;
    text-decoration: none;
    align-items: center;
    justify-content: center;
    font-weight: 500;

    &.-disabled {
      cursor: not-allowed;
      opacity: 0.5;
    }
  }
`));
