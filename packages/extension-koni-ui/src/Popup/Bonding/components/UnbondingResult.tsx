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

function UnbondingResult ({ backToHome, className, extrinsicHash, handleResend, isTxSuccess, networkKey, txError }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const scanExplorerTxUrl = useScanExplorerTxUrl(networkKey, extrinsicHash);
  const isSupportScanExplorer = useSupportScanExplorer(networkKey);

  return (
    <div className={className}>
      {
        isTxSuccess
          ? <div className={'bonding-result-container'}>
            <img
              alt={'fail'}
              className={'bonding-result-img'}
              src={successStatus}
            />

            <div className={'bonding-result-title'}>Unstaked Successfully</div>

            <div className={'bonding-result-subtext'}>Your unstaking request has been confirmed. It might take a minute to see changes in your wallet.</div>

            <div className={'bonding-action-container'}>
              <div
                className={'bonding-resend-button'}
                onClick={backToHome}
              >
                {t<string>('Back To Home')}
              </div>
              <a
                className={CN('bonding-history-button', { '-disabled': !isSupportScanExplorer || !scanExplorerTxUrl })}
                href={scanExplorerTxUrl}
                rel='noreferrer'
                target={'_blank'}
              >
                {t<string>('View Transaction')}
              </a>
            </div>
          </div>
          : <div className={'bonding-result-container'}>
            <img
              alt={'fail'}
              className={'bonding-result-img'}
              src={failStatus}
            />

            <div className={'bonding-result-title'}>Unstaking Failed</div>

            <div className={'bonding-result-subtext'}>There was a problem with your request. You can try again.</div>

            <div className={'bonding-error-text'}>{txError}</div>

            <div className={'bonding-action-container'}>
              <div
                className={'bonding-resend-button'}
                onClick={backToHome}
              >
                {t<string>('Back To Home')}
              </div>
              <div
                className={'bonding-history-button'}
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

export default React.memo(styled(UnbondingResult)(({ theme }: Props) => `
  padding-left: 45px;
  padding-right: 45px;

  .bonding-history-button {
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

  .bonding-action-container {
    width: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 15px;
  }

  .bonding-result-subtext {
    color: ${theme.textColor};
    text-align: center;
    font-size: 14px;
    margin-bottom: 10px;
  }

  .bonding-error-text {
    color: ${theme.errorColor};
    margin-bottom: 30px;
    text-align: center;
    font-size: 14px;
  }

  .bonding-result-title {
    font-size: 20px;
    line-height: 36px;
    color: ${theme.textColor};
    font-weight: 500;
    text-align: center;
  }

  .bonding-result-img {
    width: 120px;
    margin-top: 10px;
    margin-bottom: 32px;
  }

  .bonding-result-container {
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .bonding-resend-button {
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
