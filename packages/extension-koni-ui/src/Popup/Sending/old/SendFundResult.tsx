import React, {useCallback, useContext} from 'react';
import styled from 'styled-components';

import successStatus from '@polkadot/extension-koni-ui/assets/success-status.svg';
import failStatus from '@polkadot/extension-koni-ui/assets/fail-status.svg';
import {ThemeProps} from "@polkadot/extension-koni-ui/types";
import {TxResult} from "@polkadot/extension-koni-ui/Popup/Sending/old/types";
import useTranslation from '@polkadot/extension-koni-ui/hooks/useTranslation';
import {ActionContext, Button} from "@polkadot/extension-koni-ui/components";
import {getScanExplorerTransactionHistoryUrl, isSupportScanExplorer} from "@polkadot/extension-koni-ui/util";

export interface Props extends ThemeProps {
  className?: string;
  txResult: TxResult;
  networkKey: string;
  onResend: () => void
}

function getErrorMessage(txError?: Error | null): string | null {
  if (!txError) {
    return null
  }

  if (txError.message) {
    return txError.message;
  }

  return null;
}

function SendFundResult({className, networkKey, txResult: {isTxSuccess, txError, extrinsicHash}, onResend}: Props): React.ReactElement<Props> {
  const {t} = useTranslation();
  const navigate = useContext(ActionContext);
  const _backToHome = useCallback(
    () => {
      window.localStorage.setItem('popupNavigation', '/');
      navigate('/');
    },
    [navigate]
  );

  const viewTransactionBtn = (networkKey: string, extrinsicHash: string) => {
    if (isSupportScanExplorer(networkKey)) {
      return (
        <a href={getScanExplorerTransactionHistoryUrl(networkKey, extrinsicHash)} target={'_blank'}
           className='kn-send-fund-stt-btn kn-view-history-btn'
        >
          {t<string>('View Transaction')}
        </a>
      )
    }

    return (
      <span className='kn-send-fund-stt-btn kn-view-history-btn -disabled'>
        {t<string>('View Transaction')}
      </span>
    )
  };

  const errorMessage = getErrorMessage(txError);

  return (
    <div className={`kn-send-fund-result-wrapper ${className}`}>
      {isTxSuccess ?
        <div className='kn-send-fund-result'>
          <img className='kn-status-img' src={successStatus} alt="success" />
          <div className='kn-stt-text'>{t<string>('Send Fund Successful')}</div>
          <div
            className='kn-stt-subtext'>{t<string>('Your request has been confirmed. You can track its progress on the Transaction History page.')}</div>
          <Button
            className='kn-send-fund-stt-btn'
            onClick={_backToHome}
          >
            {t<string>('Back To Home')}
          </Button>

          {extrinsicHash && viewTransactionBtn(networkKey, extrinsicHash)}
        </div>
        :
        <div className='kn-send-fund-result'>
          <img className='kn-status-img' src={failStatus} alt="fail" />
          <div className='kn-stt-text'>{t<string>('Send Fund Fail')}</div>
          <div className='kn-stt-subtext'>
            {extrinsicHash
              ? (t<string>('There was a problem with your request. You can track its progress on the Transaction History page.'))
              : (t<string>('There was a problem with your request.'))
            }

            {errorMessage && (
              <div className={'kn-l-text-danger'}>{errorMessage}</div>
            )}
          </div>

          <Button
            className='kn-send-fund-stt-btn'
            onClick={onResend}
          >
            {t<string>('Resend')}
          </Button>

          {extrinsicHash && viewTransactionBtn(networkKey, extrinsicHash)}
        </div>
      }
    </div>
  );
}

export default React.memo(styled(SendFundResult)(({theme}: ThemeProps) => `
  margin: 20px 45px 0;

  .kn-send-fund-result {
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .kn-status-img {
    width: 120px;
    margin-top: 10px;
    margin-bottom: 32px;
  }

  .kn-stt-text {
    font-size: 20px;
    line-height: 36px;
    color: ${theme.textColor};
    font-weight: 500;
  }

  .kn-stt-subtext {
    color: ${theme.textColor};
    margin-bottom: 30px;
    text-align: center;
    font-size: 14px;
  }

  .kn-send-fund-stt-btn {
    margin-bottom: 10px;
  }

  .kn-l-text-danger {
    color: ${theme.iconDangerColor};
  }

  .kn-send-fund-stt-btn > .children {
    font-weight: 500;
  }

  .kn-view-history-btn {
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
