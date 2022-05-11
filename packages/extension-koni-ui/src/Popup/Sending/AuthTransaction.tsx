// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

// eslint-disable-next-line header/header
import React, { useCallback, useState } from 'react';
import styled from 'styled-components';

import { RequestCheckTransfer, TransferStep } from '@polkadot/extension-base/background/KoniTypes';
import NETWORKS from '@polkadot/extension-koni-base/api/endpoints';
import { InputWithLabel, Warning } from '@polkadot/extension-koni-ui/components';
import Button from '@polkadot/extension-koni-ui/components/Button';
import DonateInputAddress from '@polkadot/extension-koni-ui/components/DonateInputAddress';
import FormatBalance from '@polkadot/extension-koni-ui/components/FormatBalance';
import InputAddress from '@polkadot/extension-koni-ui/components/InputAddress';
import Modal from '@polkadot/extension-koni-ui/components/Modal';
import useTranslation from '@polkadot/extension-koni-ui/hooks/useTranslation';
import { makeTransfer } from '@polkadot/extension-koni-ui/messaging';
import { ThemeProps, TransferResultType } from '@polkadot/extension-koni-ui/types';
import { BN } from '@polkadot/util';

interface Props extends ThemeProps {
  className?: string;
  onCancel: () => void;
  requestPayload: RequestCheckTransfer;
  feeInfo: [string | null, number, string]; // fee, fee decimal, fee symbol
  balanceFormat: [number, string]; // decimal, symbol
  onChangeResult: (txResult: TransferResultType) => void;
  isDonation?: boolean;
}

type RenderTotalArg = {
  fee: string | null,
  feeDecimals: number,
  feeSymbol: string,
  amount?: string,
  amountDecimals: number,
  amountSymbol: string
}

function renderTotal (arg: RenderTotalArg) {
  const { amount, amountDecimals, amountSymbol, fee, feeDecimals, feeSymbol } = arg;

  if (feeDecimals === amountDecimals && feeSymbol === amountSymbol) {
    return (
      <FormatBalance
        format={[feeDecimals, feeSymbol]}
        value={new BN(fee || '0').add(new BN(amount || '0'))}
      />
    );
  }

  return (
    <>
      <FormatBalance
        format={[amountDecimals, amountSymbol]}
        value={new BN(amount || '0')}
      />
      <span className={'value-separator'}>+</span>
      <FormatBalance
        format={[feeDecimals, feeSymbol]}
        value={new BN(fee || '0')}
      />
    </>
  );
}

function AuthTransaction ({ className, isDonation, feeInfo: [fee, feeDecimals, feeSymbol], balanceFormat, onCancel, onChangeResult, requestPayload }: Props): React.ReactElement<Props> | null {
  const { t } = useTranslation();
  const [isBusy, setBusy] = useState(false);
  const [password, setPassword] = useState<string>('');
  const [isKeyringErr, setKeyringErr] = useState<boolean>(false);
  const [errorArr, setErrorArr] = useState<string[]>([]);
  const networkPrefix = NETWORKS[requestPayload.networkKey].ss58Format;

  const _onCancel = useCallback(() => {
    onCancel();
  },
  [onCancel]
  );

  const _doStart = useCallback(
    (): void => {
      setBusy(true);

      makeTransfer({
        ...requestPayload,
        password
      }, (rs) => {
        if (!rs.isFinalized) {
          if (rs.step === TransferStep.SUCCESS.valueOf()) {
            onChangeResult({
              isShowTxResult: true,
              isTxSuccess: rs.step === TransferStep.SUCCESS.valueOf(),
              extrinsicHash: rs.extrinsicHash
            });
          } else if (rs.step === TransferStep.ERROR.valueOf()) {
            onChangeResult({
              isShowTxResult: true,
              isTxSuccess: rs.step === TransferStep.SUCCESS.valueOf(),
              extrinsicHash: rs.extrinsicHash,
              txError: rs.errors
            });
          }
        }
      }).then((errors) => {
        const errorMessage = errors.map((err) => err.message);

        if (errors.find((err) => err.code === 'keyringError')) {
          setKeyringErr(true);
        }

        setErrorArr(errorMessage);

        if (errorMessage && errorMessage.length) {
          setBusy(false);
        }
      })
        .catch((e) => console.log('There is problem when makeTransfer', e));
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      password, onChangeResult,
      requestPayload.networkKey,
      requestPayload.from,
      requestPayload.to,
      requestPayload.value,
      requestPayload.transferAll,
      requestPayload.token
    ]
  );

  const _onChangePass = useCallback(
    (value: string): void => {
      setPassword(value);
      setErrorArr([]);
      setKeyringErr(false);
    },
    []
  );

  const renderError = () => {
    return errorArr.map((err) =>
      (
        <Warning
          className='auth-transaction-error'
          isDanger
          key={err}
        >
          {t<string>(err)}
        </Warning>
      )
    );
  };

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
          <InputAddress
            className={'auth-transaction__input-address'}
            defaultValue={requestPayload.from}
            help={t<string>(isDonation ? 'The account you will donate from.' : 'The account you will send funds from.')}
            isDisabled={true}
            isSetDefaultValue={true}
            label={t<string>(isDonation ? 'Donate from account' : 'Send from account')}
            networkPrefix={networkPrefix}
            type='account'
            withEllipsis
          />

          {isDonation
            ? (
              <DonateInputAddress
                className={'auth-transaction__input-address'}
                defaultValue={requestPayload.to}
                help={t<string>('The address you want to donate to.')}
                isDisabled={true}
                isSetDefaultValue={true}
                label={t<string>('Donate to address')}
                networkPrefix={networkPrefix}
                type='allPlus'
                withEllipsis
              />
            )
            : (
              <InputAddress
                className={'auth-transaction__input-address'}
                defaultValue={requestPayload.to}
                help={t<string>('The address you want to send funds to.')}
                isDisabled={true}
                isSetDefaultValue={true}
                label={t<string>('Send to address')}
                networkPrefix={networkPrefix}
                type='allPlus'
                withEllipsis
              />
            )
          }

          <div className='auth-transaction__info'>
            <div className='auth-transaction__info-text'>Amount</div>
            <div className='auth-transaction__info-value'>
              <FormatBalance
                format={balanceFormat}
                value={requestPayload.value}
              />
            </div>
          </div>

          <div className='auth-transaction__info'>
            <div className='auth-transaction__info-text'>Estimated fee</div>
            <div className='auth-transaction__info-value'>
              <FormatBalance
                format={[feeDecimals, feeSymbol]}
                value={fee}
              />
            </div>
          </div>

          <div className='auth-transaction__info'>
            <div className='auth-transaction__info-text'>Total (Amount + Fee)</div>
            <div className='auth-transaction__info-value'>
              {renderTotal({
                fee,
                feeDecimals,
                feeSymbol,
                amount: requestPayload.value,
                amountDecimals: balanceFormat[0],
                amountSymbol: balanceFormat[1]
              })}
            </div>
          </div>

          <div className='auth-transaction__separator' />

          <InputWithLabel
            isError={isKeyringErr}
            label={t<string>('Unlock account with password')}
            onChange={_onChangePass}
            type='password'
            value={password}
          />

          {!!(errorArr && errorArr.length) && renderError()}

          <div className='auth-transaction__submit-wrapper'>
            <Button
              className={'auth-transaction__submit-btn'}
              isBusy={isBusy}
              isDisabled={!password || !!(errorArr && errorArr.length)}
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

  .auth-transaction-error {
    margin-top: 10px
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
    color: ${theme.buttonTextColor2};
    cursor: pointer;
    opacity: 0.85;
  }

  .auth-transaction-header__close-btn:hover {
    opacity: 1;
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

  .auth-transaction__input-address {
    margin-bottom: 14px;
  }

  .auth-transaction__info {
    display: flex;
    width: 100%;
    padding: 4px 0;
    flex-wrap: wrap;
  }

  .auth-transaction__info-text, auth-transaction__info-value {
    font-size: 15px;
    line-height: 26px;
    font-weight: 500;
  }

  .auth-transaction__info-text {
    color: ${theme.textColor2};
    flex: 1;
  }

  .auth-transaction__info-value {
    color: ${theme.textColor};
    flex: 1;
    text-align: right;
  }

  .auth-transaction__info-value .format-balance__front-part {
    overflow: hidden;
    white-space: nowrap;
    max-width: 160px;
    text-overflow: ellipsis;
    display: inline-block;
    vertical-align: top;
  }

  .auth-transaction__separator {
    padding-top: 24px;
    margin-bottom: 24px;
    border-bottom: 1px solid ${theme.menuItemsBorder};
  }

  .auth-transaction__info-value .value-separator {
    margin: 0 4px;
  }

  .auth-transaction__info-value .format-balance {
    display: inline-block;
  }
`));
