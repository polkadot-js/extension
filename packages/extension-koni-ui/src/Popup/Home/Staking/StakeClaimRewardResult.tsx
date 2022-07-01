// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import failStatus from '@subwallet/extension-koni-ui/assets/fail-status.svg';
import successStatus from '@subwallet/extension-koni-ui/assets/success-status.svg';
import useScanExplorerTxUrl from '@subwallet/extension-koni-ui/hooks/screen/home/useScanExplorerTxUrl';
import useSupportScanExplorer from '@subwallet/extension-koni-ui/hooks/screen/home/useSupportScanExplorer';
import useTranslation from '@subwallet/extension-koni-ui/hooks/useTranslation';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import CN from 'classnames';
import React from 'react';
import styled from 'styled-components';

interface Props extends ThemeProps {
  className?: string;
  isTxSuccess: boolean;
  txError: string;
  networkKey: string;
  extrinsicHash: string;
  backToHome: () => void;
  handleResend: () => void;
}

function StakeClaimRewardResult ({ backToHome, className, extrinsicHash, handleResend, isTxSuccess, networkKey, txError }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const scanExplorerTxUrl = useScanExplorerTxUrl(networkKey, extrinsicHash);
  const isSupportScanExplorer = useSupportScanExplorer(networkKey);

  return (
    <div className={className}>
      {
        isTxSuccess
          ? <div className={'withdrawal-result-container'}>
            <img
              alt={'fail'}
              className={'withdrawal-result-img'}
              src={successStatus}
            />

            <div className={'withdrawal-result-title'}>Claim Reward Successfully</div>

            <div className={'withdrawal-result-subtext'}>Your claiming request has been confirmed. It might take a minute to see changes in your wallet.</div>

            <div className={'withdrawal-action-container'}>
              <div
                className={'withdrawal-resend-button'}
                onClick={backToHome}
              >
                {t<string>('Back To Home')}
              </div>
              <a
                className={CN('withdrawal-history-button', { '-disabled': !isSupportScanExplorer || !scanExplorerTxUrl })}
                href={scanExplorerTxUrl}
                rel='noreferrer'
                target={'_blank'}
              >
                {t<string>('View Transaction')}
              </a>
            </div>
          </div>
          : <div className={'withdrawal-result-container'}>
            <img
              alt={'fail'}
              className={'withdrawal-result-img'}
              src={failStatus}
            />

            <div className={'withdrawal-result-title'}>Reward Claiming Failed</div>

            <div className={'withdrawal-result-subtext'}>There was a problem with your request. You can try again.</div>

            <div className={'withdrawal-error-text'}>{txError}</div>

            <div className={'withdrawal-action-container'}>
              <div
                className={'withdrawal-resend-button'}
                onClick={backToHome}
              >
                {t<string>('Back To Home')}
              </div>
              <div
                className={'withdrawal-history-button'}
                onClick={handleResend}
              >
                {t<string>('Retry')}
              </div>
            </div>
          </div>
      }
    </div>
  );
}

export default React.memo(styled(StakeClaimRewardResult)(({ theme }: Props) => `
  padding-left: 45px;
  padding-right: 45px;

  .withdrawal-history-button {
    width: 100%;
    padding: 10px;
    text-align: center;
    background-color: ${theme.buttonBackground2};
    color: ${theme.buttonTextColor3};
    border-radius: 8px;
    cursor: pointer;
    font-weight: 500;
    font-size: 16px;
    line-height: 26px;
  }

  .withdrawal-action-container {
    width: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 15px;
  }

  .withdrawal-result-subtext {
    color: ${theme.textColor};
    text-align: center;
    font-size: 14px;
    margin-bottom: 10px;
  }

  .withdrawal-error-text {
    color: ${theme.errorColor};
    margin-bottom: 30px;
    text-align: center;
    font-size: 14px;
  }

  .withdrawal-result-title {
    font-size: 20px;
    line-height: 36px;
    color: ${theme.textColor};
    font-weight: 500;
    text-align: center;
  }

  .withdrawal-result-img {
    width: 120px;
    margin-top: 10px;
    margin-bottom: 32px;
  }

  .withdrawal-result-container {
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .withdrawal-resend-button {
    width: 100%;
    padding: 10px;
    text-align: center;
    background-color: #004BFF;
    border-radius: 8px;
    cursor: pointer;
    color: #FFFFFF;
    font-weight: 500;
  }

  .-disabled {
    cursor: not-allowed;
    pointer-events: none;
    opacity: 0.5;
  }
`));
