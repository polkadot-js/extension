// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React, { useCallback, useState } from 'react';
import styled from 'styled-components';

import Button from '@polkadot/extension-koni-ui/components/Button';
import Modal from '@polkadot/extension-koni-ui/components/Modal';
import Output from '@polkadot/extension-koni-ui/components/Output';
import { useToggle } from '@polkadot/extension-koni-ui/hooks/useToggle';
import useTranslation from '@polkadot/extension-koni-ui/hooks/useTranslation';
import Address from '@polkadot/extension-koni-ui/Popup/Sending/parts/Address';
import Tip from '@polkadot/extension-koni-ui/Popup/Sending/parts/Tip';
import Transaction from '@polkadot/extension-koni-ui/Popup/Sending/parts/Transaction';
import { AddressProxy, ThemeProps } from '@polkadot/extension-koni-ui/types';
import { BN_ZERO } from '@polkadot/util';

interface Props extends ThemeProps {
  className?: string;
  onCancel: () => void;
  requestAddress: string;
  extrinsic: never;
}

function AuthTransaction ({ className, extrinsic, onCancel, requestAddress }: Props): React.ReactElement<Props> | null {
  const { t } = useTranslation();
  const [isRenderError, toggleRenderError] = useToggle();
  const [senderInfo, setSenderInfo] = useState<AddressProxy>(() => ({ isUnlockCached: false, signAddress: requestAddress, signPassword: '' }));
  const [isBusy, setBusy] = useState(false);
  // const [passwordError, setPasswordError] = useState<string | null>(null);
  // const [callHash, setCallHash] = useState<string | null>(null);
  // const [tip, setTip] = useState(BN_ZERO);

  const passwordError = null;
  const [, setTip] = useState(BN_ZERO);

  const _onCancel = useCallback(() => {
    onCancel();
  },
  [onCancel]
  );

  const _doStart = useCallback(
    (): void => {
      setBusy(true);

      // setTimeout((): void => {
      //   const errorHandler = (error: Error): void => {
      //     console.error(error);
      //
      //     setBusy(false);
      //     setError(error);
      //   };
      //
      //   _unlock()
      //     .then((isUnlocked): void => {
      //       if (isUnlocked) {
      //         _onSend(txHandler, extrinsic, senderInfo).catch(errorHandler)
      //       } else {
      //         setBusy(false);
      //       }
      //     })
      //     .catch((error): void => {
      //       errorHandler(error as Error);
      //     });
      // }, 0);
    },
    []
  );

  return (
    <div className={className}>
      <Modal className={'signer-modal'}>
        <div className='auth-transaction-header'>
          <div className='auth-transaction-header__part-1' />
          <div className='auth-transaction-header__part-2'>
            {t<string>('Authorize Transaction')}
          </div>
          <div className='auth-transaction-header__part-3'>
            {isBusy
              ? (
                <span className={'auth-transaction-header__close-btn -disabled'}>{t('Cancel')}</span>
              )
              : (
                <span
                  className={'auth-transaction-header__close-btn'}
                  onClick={_onCancel}
                >{t('Cancel')}</span>
              )
            }
          </div>
        </div>
        <div className='auth-transaction-body'>
          <div className='auth-transaction-info-block'>
            <Transaction
              accountId={senderInfo.signAddress}
              extrinsic={extrinsic}
              onError={toggleRenderError}
            />
          </div>
          <Address
            onChange={setSenderInfo}
            onEnter={_doStart}
            passwordError={passwordError}
            requestAddress={requestAddress}
          />

          <Tip
            className={'auth-transaction__tip-block'}
            onChange={setTip}
          />

          <Output
            className={'auth-transaction__call-hash'}
            isDisabled
            isTrimmed
            label={t<string>('Call hash')}
            value={'0x9d32effb1d8573d6ce02f6721bc5442c33a23eed88ea194815f473582550b508'}
            withCopy
          />

          <div className='auth-transaction__submit-wrapper'>
            <Button
              className={'auth-transaction__submit-btn'}
              isBusy={isBusy}
              isDisabled={!senderInfo.signAddress || isRenderError}
              onClick={_doStart}
            >
              {t<string>('Sign and Submit')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default React.memo(styled(AuthTransaction)(({ theme }: ThemeProps) => `
  .subwallet-modal {
    max-width: 460px;
    left: 0;
    right: 0;
    top: 0;
    bottom: 0;
    border-radius: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .auth-transaction-header {
    display: flex;
    align-items: center;
    height: 72px;
    box-shadow: ${theme.headerBoxShadow};
  }

  .auth-transaction-body {
    flex: 1;
    padding-left: 15px;
    padding-right: 15px;
    padding-bottom: 15px;
    padding-top: 25px;
    overflow-y: auto;
  }

    .auth-transaction-header__part-1 {
    flex: 1;
  }

  .auth-transaction-header__part-2 {
    color: ${theme.textColor};
    font-size: 20px;
    font-weight: 500;
  }

  .auth-transaction-header__part-3 {
    flex: 1;
    display: flex;
    justify-content: flex-end;
  }

  .auth-transaction-header__close-btn {
    padding-left: 16px;
    padding-right: 16px;
    height: 40px;
    display: flex;
    align-items: center;
    color: #04C1B7;
    font-weight: 500;
    cursor: pointer;
  }

  .auth-transaction-header__close-btn.-disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }

  .auth-transaction-info-block {
    margin-bottom: 20px;
  }

  .auth-transaction__tip-block {
    margin-top: 10px;
  }

  .auth-transaction__call-hash {
    margin-top: 20px;
  }

  .auth-transaction__submit-wrapper {
    position: sticky;
    bottom: -15px;
    padding: 15px;
    margin-left: -15px;
    margin-bottom: -15px;
    margin-right: -15px;
    background-color: ${theme.background};
  }
`));
