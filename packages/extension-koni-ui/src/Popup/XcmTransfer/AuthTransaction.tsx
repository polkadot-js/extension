// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { DropdownTransformOptionType, NetworkJson, RequestCheckCrossChainTransfer, TransferStep } from '@subwallet/extension-base/background/KoniTypes';
import arrowRight from '@subwallet/extension-koni-ui/assets/arrow-right.svg';
import { InputWithLabel, Warning } from '@subwallet/extension-koni-ui/components';
import Button from '@subwallet/extension-koni-ui/components/Button';
import FormatBalance from '@subwallet/extension-koni-ui/components/FormatBalance';
import InputAddress from '@subwallet/extension-koni-ui/components/InputAddress';
import Modal from '@subwallet/extension-koni-ui/components/Modal';
import { BalanceFormatType } from '@subwallet/extension-koni-ui/components/types';
import useTranslation from '@subwallet/extension-koni-ui/hooks/useTranslation';
import { makeCrossChainTransfer } from '@subwallet/extension-koni-ui/messaging';
import Dropdown from '@subwallet/extension-koni-ui/Popup/XcmTransfer/XcmDropdown/Dropdown';
import { ThemeProps, TransferResultType } from '@subwallet/extension-koni-ui/types';
import React, { useCallback, useState } from 'react';
import styled from 'styled-components';

import { BN } from '@polkadot/util';

interface Props extends ThemeProps {
  className?: string;
  onCancel: () => void;
  requestPayload: RequestCheckCrossChainTransfer;
  feeInfo: [string | null, number, string]; // fee, fee decimal, fee symbol
  balanceFormat: BalanceFormatType; // decimal, symbol
  networkMap: Record<string, NetworkJson>;
  onChangeResult: (txResult: TransferResultType) => void;
  originChainOptions: DropdownTransformOptionType[];
  destinationChainOptions: DropdownTransformOptionType[];
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

function AuthTransaction ({ balanceFormat,
  className,
  destinationChainOptions,
  feeInfo: [fee, feeDecimals, feeSymbol],
  networkMap, onCancel,
  onChangeResult, originChainOptions, requestPayload }: Props): React.ReactElement<Props> | null {
  const { t } = useTranslation();
  const [isBusy, setBusy] = useState(false);
  const [password, setPassword] = useState<string>('');
  const [isKeyringErr, setKeyringErr] = useState<boolean>(false);
  const [errorArr, setErrorArr] = useState<string[]>([]);
  const originNetworkPrefix = networkMap[requestPayload.originalNetworkKey].ss58Format;
  const destinationNetworkPrefix = networkMap[requestPayload.destinationNetworkKey].ss58Format;

  const _onCancel = useCallback(() => {
    onCancel();
  },
  [onCancel]
  );

  const _doStart = useCallback(
    (): void => {
      setBusy(true);

      makeCrossChainTransfer({
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
      requestPayload.originalNetworkKey,
      requestPayload.destinationNetworkKey,
      requestPayload.from,
      requestPayload.to,
      requestPayload.value,
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
          <div className='bridge__chain-selector-area'>
            <Dropdown
              className='bridge__chain-selector'
              isDisabled={true}
              label={'Original Chain'}
              options={originChainOptions}
              value={requestPayload.originalNetworkKey}
            />

            <div className='bridge__chain-swap'>
              <img
                alt='Icon'
                src={arrowRight}
              />
            </div>

            <Dropdown
              className='bridge__chain-selector'
              isDisabled={true}
              label={'Destination Chain'}
              options={destinationChainOptions}
              value={requestPayload.destinationNetworkKey}
            />
          </div>

          <InputAddress
            className={'auth-transaction__input-address'}
            defaultValue={requestPayload.from}
            help={t<string>('The account you will transfer from.')}
            isDisabled={true}
            isSetDefaultValue={true}
            label={t<string>('Original Account')}
            networkPrefix={originNetworkPrefix}
            type='account'
            withEllipsis
          />

          <InputAddress
            className={'auth-transaction__input-address auth-transaction__destination-account'}
            defaultValue={requestPayload.to}
            help={t<string>('The account you want to transfer to.')}
            isDisabled={true}
            isSetDefaultValue={true}
            label={t<string>('Destination Account')}
            networkPrefix={destinationNetworkPrefix}
            type='allPlus'
            withEllipsis
          />

          <div className='auth-transaction__separator' />

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
            <div className='auth-transaction__info-text'>Origin Chain Fee</div>
            <div className='auth-transaction__info-value'>
              <FormatBalance
                format={[feeDecimals, feeSymbol]}
                value={fee}
              />
            </div>
          </div>

          <div className='auth-transaction__info'>
            <div className='auth-transaction__info-text'>Total</div>
            <div className='auth-transaction__info-value'>
              {renderTotal({
                fee,
                feeDecimals,
                feeSymbol,
                amount: requestPayload.value,
                amountDecimals: balanceFormat[0],
                amountSymbol: balanceFormat[2] || balanceFormat[1]
              })}
            </div>
          </div>

          <div className='auth-transaction__separator' />

          <InputWithLabel
            className='auth-transaction__password-area'
            isError={isKeyringErr}
            label={t<string>('Unlock account with password')}
            onChange={_onChangePass}
            type='password'
            value={password}
          />

          {!!(errorArr && errorArr.length) && renderError()}

          <div className='bridge-button-container'>
            <Button
              className='bridge-button'
              isBusy={isBusy}
              onClick={_onCancel}
            >
              <span>
                {t<string>('Reject')}
              </span>
            </Button>

            <Button
              className='bridge-button'
              isBusy={isBusy}
              isDisabled={!password}
              onClick={_doStart}
            >
              <span>
                {t<string>('Confirm')}
              </span>
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
    padding-left: 22px;
    padding-right: 22px;
    padding-bottom: 15px;
    padding-top: 25px;
    overflow-y: auto;
  }

  .auth-transaction__password-area {
    margin-top: 8px;
    margin-bottom: 2px;

    .label-wrapper {
      margin-bottom: 6px;
    }
  }

  .auth-transaction__separator + .auth-transaction__info {
    margin-top: 10px;
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
    .input-address__dropdown {
      border: 0;
      height: auto;
    }

    .key-pair__icon {
      display: none;
    }

    > label {
      left: 0;
    }

    .key-pair__name {
      padding-left: 0;
      font-size: 15px;
    }

    .input-address-dropdown__value-container {
      padding-left: 0;
      padding-right: 0;
    }

    .input-address-dropdown__single-value {
      margin-left: 0;
      margin-right: 0;
    }
  }

  .auth-transaction__destination-account {
    margin-top: -5px;
  }

  .auth-transaction__info {
    display: flex;
    width: 100%;
    padding: 2px 0;
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
    font-weight: 500;
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
    padding-top: 10px;
    border-bottom: 1px solid ${theme.menuItemsBorder};
  }

  .auth-transaction__info-value .value-separator {
    margin: 0 4px;
  }

  .auth-transaction__info-value .format-balance {
    display: inline-block;
  }

  .bridge__chain-selector-area.bridge__chain-selector-area {
    display: flex;
    align-items: center;
    flex-wrap: nowrap;
    margin-bottom: 9px;
  }

  .bridge__chain-selector {
    flex: 1;
  }

  .bridge__chain-selector label {
    font-size: 15px;
    text-transform: none;
    color: ${theme.textColor};
    line-height: 26px;
    font-weight: 500;
  }

  .bridge__chain-swap {
    min-width: 40px;
    width: 40px;
    height: 40px;
    border-radius: 40%;
    border: 2px solid ${theme.buttonBorderColor};
    display: flex;
    justify-content: center;
    align-items: center;
    margin: 24px 12px 0;
  }
`));
