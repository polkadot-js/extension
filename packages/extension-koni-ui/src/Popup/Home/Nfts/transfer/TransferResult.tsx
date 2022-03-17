// Copyright 2019-2022 @polkadot/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React from 'react';
import styled from 'styled-components';

import failStatus from '@polkadot/extension-koni-ui/assets/fail-status.svg';
import successStatus from '@polkadot/extension-koni-ui/assets/success-status.svg';
import useTranslation from '@polkadot/extension-koni-ui/hooks/useTranslation';
import { ThemeProps } from '@polkadot/extension-koni-ui/types';
import { getScanExplorerTransactionHistoryUrl } from '@polkadot/extension-koni-ui/util';

interface Props extends ThemeProps {
  className?: string;
  isTxSuccess: boolean;
  txError: string;
  networkKey: string;
  extrinsicHash: string;
  backToHome: () => void;
  handleResend: () => void;
}

function TransferResult ({ backToHome, className, extrinsicHash, handleResend, isTxSuccess, networkKey, txError }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();

  return (
    <div className={className}>
      {
        isTxSuccess
          ? <div className={'result-container'}>
            <img
              alt={'fail'}
              className={'result-img'}
              src={successStatus}
            />

            <div className={'result-title'}>Transfer NFT successfully</div>

            <div className={'result-subtext'}>Your transfer request has been confirmed. It might take a minute to see changes in your wallet.</div>

            <div className={'action-container'}>
              <div
                className={'resend-button'}
                onClick={backToHome}
              >
                {t<string>('Back To Home')}
              </div>
              <a
                className={'history-button'}
                href={getScanExplorerTransactionHistoryUrl(networkKey, extrinsicHash)}
                rel='noreferrer'
                target={'_blank'}
              >
                {t<string>('View Transaction')}
              </a>
            </div>
          </div>
          : <div className={'result-container'}>
            <img
              alt={'fail'}
              className={'result-img'}
              src={failStatus}
            />

            <div className={'result-title'}>Transfer NFT failed</div>

            <div className={'result-subtext'}>There was a problem with your request. You can try again.</div>

            <div className={'error-text'}>{txError}</div>

            <div className={'action-container'}>
              <div
                className={'resend-button'}
                onClick={backToHome}
              >
                {t<string>('Back To Home')}
              </div>
              <div
                className={'history-button'}
                onClick={handleResend}
              >
                {t<string>('Resend')}
              </div>
            </div>
          </div>
      }
    </div>
  );
}

export default React.memo(styled(TransferResult)(({ theme }: Props) => `
  .history-button {
    width: 100%;
    padding: 10px;
    text-align: center;
    background-color: #181E42;
    color: #42C59A;
    border-radius: 8px;
    cursor: pointer;
  }

  .action-container {
    width: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 15px;
  }

  .result-subtext {
    color: ${theme.textColor};
    text-align: center;
    font-size: 14px;
    margin-bottom: 10px;
  }

  .error-text {
    color: ${theme.errorColor};
    margin-bottom: 30px;
    text-align: center;
    font-size: 14px;
  }

  .result-title {
    font-size: 20px;
    line-height: 36px;
    color: ${theme.textColor};
    font-weight: 500;
    text-align: center;
  }

  .result-img {
    width: 120px;
    margin-top: 10px;
    margin-bottom: 32px;
  }

  .result-container {
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .resend-button {
    width: 100%;
    padding: 10px;
    text-align: center;
    background-color: #004BFF;
    border-radius: 8px;
    cursor: pointer;
    color: #FFFFFF;
  }
`));
