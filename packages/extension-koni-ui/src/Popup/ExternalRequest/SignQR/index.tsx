// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import SignTransactionIcon from '@subwallet/extension-koni-ui/assets/icon/sign-transacion.svg';
import { Button, Spinner, Warning } from '@subwallet/extension-koni-ui/components';
import { ScannerContext } from '@subwallet/extension-koni-ui/contexts/ScannerContext';
import { useGetNetworkQrRequest } from '@subwallet/extension-koni-ui/hooks/useGetNetworkQrRequest';
import useTranslation from '@subwallet/extension-koni-ui/hooks/useTranslation';
import AccountInfo from '@subwallet/extension-koni-ui/Popup/ExternalRequest/Shared/AccountInfo';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import CN from 'classnames';
import React, { useCallback, useContext, useState } from 'react';
import styled from 'styled-components';

interface Props extends ThemeProps {
  className?: string;
}

const SignQR = (props: Props) => {
  const { className } = props;

  const { t } = useTranslation();

  const { loading, network } = useGetNetworkQrRequest();

  const { cleanup, signDataLegacy, state: scannerState } = useContext(ScannerContext);
  const { evmChainId, isEthereumStructure, senderAddress, type } = scannerState;

  const [error, setError] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  const _onSign = useCallback(
    (): Promise<void> => {
      setIsBusy(true);

      return new Promise((resolve) => {
        setTimeout(() => {
          signDataLegacy()
            .catch((error: Error): void => {
              setIsBusy(false);
              setError(error.message);
              console.error(error);
            })
            .finally(() => {
              setIsBusy(false);
              resolve();
            });
        }, 100);
      });
    },
    [signDataLegacy]
  );

  const _onCancel = useCallback(() => {
    cleanup();
  }, [cleanup]);

  return (
    <div className={CN(className)}>
      <div className='info-container'>
        {
          (loading || !network) && (
            <div className={CN('loading')}>
              <Spinner />
            </div>
          )
        }

        {
          (!loading && network) && (
            <>
              <div className='sign-header'>
                <img
                  alt=''
                  className='sign-icon'
                  src={SignTransactionIcon}
                />
                <div className='sign-title'>
                  Sign {type === 'transaction' ? 'transaction' : 'message'}
                </div>
                <div className='sign-description'>
                  You are approving a request with account
                </div>
              </div>
              <AccountInfo
                address={senderAddress}
                forceEthereum={isEthereumStructure && !evmChainId}
                network={network}
              />
            </>
          )
        }
      </div>
      <div className='action-container'>
        {error && (
          <Warning
            className='signing-error'
            isDanger
          >
            {error}
          </Warning>
        )}
        <div className={CN('sign-button-container')}>
          <Button
            className={CN('sign-button')}
            onClick={_onCancel}
          >
            <span>
              {t('Cancel')}
            </span>
          </Button>
          <Button
            className={CN('sign-button')}
            isBusy={isBusy}
            isDisabled={!!error || loading}
            onClick={_onSign}
          >
            {t('Approve')}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default React.memo(styled(SignQR)(({ theme }: Props) => `
  flex-direction: column;
  position: relative;
  bottom: 0;
  padding: 15px;
  height: 100%;
  overflow-y: auto;

  .save-password-container {
    margin: 8px 0;
  }

  .loading{
    position: relative;
    height: 240px;
  }

  .sign-header {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    margin-top: 15px;

    .sign-icon {
      width: 48px;
      height: 48px;
      margin-bottom: 15px;
    }

    .sign-title {
      color: ${theme.textColor};
      text-align: center;
      font-style: normal;
      font-weight: 500;
      font-size: 24px;
      line-height: 36px;
      margin-bottom: 15px;
    }

    .sign-description {
      font-style: normal;
      font-weight: 500;
      font-size: 15px;
      line-height: 26px;
      color: ${theme.textColor2};
      margin-bottom: 24px;
    }
  }

  .action-container {
    background-color: ${theme.background};
    position: sticky;
    padding-top: 3px;
    bottom: 0;
    z-index: 10;

    .separator{
      margin: ${theme.boxMargin};
    }

    .sign-button-container {
      display: flex;
      margin-top: 10px;
    }

    .sign-button {
      flex: 1;
    }

    .sign-button:first-child {
      background-color: ${theme.buttonBackground1};
      margin-right: 8px;

      span {
        color: ${theme.buttonTextColor2};
      }
    }

    .sign-button:last-child {
      margin-left: 8px;
    }
  }

  .signing-error {
    margin-top: 10px;
  }
`));
