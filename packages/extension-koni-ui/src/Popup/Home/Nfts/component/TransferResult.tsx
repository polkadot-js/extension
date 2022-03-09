// Copyright 2019-2022 @polkadot/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React from 'react';
import styled from 'styled-components';

import { ThemeProps } from '@polkadot/extension-koni-ui/types';
import failStatus from "@polkadot/extension-koni-ui/assets/fail-status.svg";
import successStatus from "@polkadot/extension-koni-ui/assets/success-status.svg";

interface Props extends ThemeProps {
  className?: string;
  isTxSuccess: boolean;
  onResend: () => void;
  txError: string;
  networkKey?: string;
}

function TransferResult ({ className, isTxSuccess, networkKey, onResend, txError }: Props): React.ReactElement<Props> {
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

            <div className={'result-title'}>Transfer NFT successfully!</div>

            <div className={'result-subtext'}>All good.</div>

            <div className={'action-container'}>
              <div
                className={'history-button'}
              >
                View history
              </div>

              <div
                className={'resend-button'}
                onClick={onResend}
              >
                Go back
              </div>
            </div>
          </div>
          : <div className={'result-container'}>
            <img
              alt={'fail'}
              className={'result-img'}
              src={failStatus}
            />

            <div className={'result-title'}>Transfer NFT failed!</div>

            <div className={'result-subtext'}>Something went wrong.</div>

            <div className={'action-container'}>
              <div
                className={'history-button'}
              >
                View history
              </div>

              <div
                className={'resend-button'}
                onClick={onResend}
              >
                Resend
              </div>
            </div>
          </div>
      }
    </div>
  );
}

export default React.memo(styled(TransferResult)(({ theme }: Props) => `
  .history-button {
    width: 40%;
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
    justify-content: center;
    gap: 50px;
  }

  .result-subtext {
    color: ${theme.textColor};
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
    width: 40%;
    padding: 10px;
    text-align: center;
    background-color: #004BFF;
    border-radius: 8px;
    cursor: pointer;
  }
`));
