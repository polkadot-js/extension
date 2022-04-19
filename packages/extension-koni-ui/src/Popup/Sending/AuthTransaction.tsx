// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React, { useCallback, useState } from 'react';
import styled from 'styled-components';

import Button from '@polkadot/extension-koni-ui/components/Button';
import Modal from '@polkadot/extension-koni-ui/components/Modal';
import { useToggle } from '@polkadot/extension-koni-ui/hooks/useToggle';
import useTranslation from '@polkadot/extension-koni-ui/hooks/useTranslation';
import Address from '@polkadot/extension-koni-ui/Popup/Sending/parts/Address';
import { AddressProxy, ThemeProps } from '@polkadot/extension-koni-ui/types';

interface Props extends ThemeProps {
  className?: string;
  onCancel: () => void;
  requestAddress: string;
  extrinsic: never;
}

function AuthTransaction ({ className, onCancel, requestAddress }: Props): React.ReactElement<Props> | null {
  const { t } = useTranslation();
  const [isRenderError] = useToggle();
  const [senderInfo, setSenderInfo] = useState<AddressProxy>(() => ({ isUnlockCached: false, signAddress: requestAddress, signPassword: '' }));
  const [isBusy, setBusy] = useState(false);

  const passwordError = null;

  const _onCancel = useCallback(() => {
    onCancel();
  },
  [onCancel]
  );

  const _doStart = useCallback(
    (): void => {
      setBusy(true);
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
          <Address
            class
            onChange={setSenderInfo}
            onEnter={_doStart}
            passwordError={passwordError}
            requestAddress={requestAddress}
          />

          <div className='auth-transaction__submit-wrapper'>
            <Button
              className={'auth-transaction__submit-btn'}
              isBusy={isBusy}

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
