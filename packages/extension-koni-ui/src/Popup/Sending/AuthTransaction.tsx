// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React, { useCallback, useEffect, useState } from 'react';
import { Trans } from 'react-i18next';
import styled from 'styled-components';

import { RequestCheckTransfer } from '@polkadot/extension-base/background/KoniTypes';
import { InputWithLabel } from '@polkadot/extension-koni-ui/components';
import Button from '@polkadot/extension-koni-ui/components/Button';
import Modal from '@polkadot/extension-koni-ui/components/Modal';
import useTranslation from '@polkadot/extension-koni-ui/hooks/useTranslation';
import { checkTransfer, makeTransfer } from '@polkadot/extension-koni-ui/messaging';
import { ThemeProps } from '@polkadot/extension-koni-ui/types';
import { BN, formatBalance } from '@polkadot/util';

interface Props extends ThemeProps {
  className?: string;
  onCancel: () => void;
  requestPayload: RequestCheckTransfer;
  balanceFormat: [number, string]
}

function AuthTransaction ({ balanceFormat, className, onCancel, requestPayload }: Props): React.ReactElement<Props> | null {
  const { t } = useTranslation();
  const [isBusy, setBusy] = useState(false);
  const [password, setPassword] = useState<string>('');
  const [fee, setFee] = useState<null | string>(null);

  useEffect(() => {
    let isSync = true;

    checkTransfer({
      ...requestPayload
    }).then((rs) => {
      if (isSync) {
        setFee(rs.estimateFee || null);
      }
    }).catch((e) => {
      console.log('There is problem when checkTransfer', e);
    });

    return () => {
      isSync = false;
    };
  }, [requestPayload]);

  const _onCancel = useCallback(() => {
    onCancel();
  },
  [onCancel]
  );

  const _doCheck = useCallback(
    (): void => {
      setBusy(true);

      checkTransfer({
        ...requestPayload
      }).then((rs) => {
        setBusy(false);
      })
        .catch((e) => {
          setBusy(false);
        });
    },
    [requestPayload]
  );

  const _doStart = useCallback(
    (): void => {
      setBusy(true);

      makeTransfer({
        ...requestPayload,
        password
      }, (a) => {
        // do Something
      }).catch((e) => console.log('There is problem when makeTransfer', e));
    },
    [password, requestPayload]
  );

  const _onChangePass = useCallback(
    (value: string): void => {
      setPassword(value);
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
          {!!fee && (
            <Trans i18nKey='feesForSubmission'>
                Fees of <span className='highlight'>
                {formatBalance(new BN(fee), { withSiFull: true, decimals: balanceFormat[0], withUnit: balanceFormat[1] })}
              </span> will be applied to the submission
            </Trans>
          )}

          <InputWithLabel
            label={t<string>('Password')}
            onChange={_onChangePass}
            type='password'
            value={password}
          />

          <div className='auth-transaction__submit-wrapper'>
            <Button
              className={'auth-transaction__submit-btn'}
              isBusy={isBusy}
              onClick={_doCheck}
            >
              {t<string>('Check transfer')}
            </Button>
          </div>

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
