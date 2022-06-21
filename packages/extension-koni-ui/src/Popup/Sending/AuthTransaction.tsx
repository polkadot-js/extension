// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { NetworkJson, RequestCheckTransfer, ResponseTransfer, TransferError, TransferStep } from '@subwallet/extension-base/background/KoniTypes';
import { InputWithLabel, LoadingContainer, Warning } from '@subwallet/extension-koni-ui/components';
import Button from '@subwallet/extension-koni-ui/components/Button';
import DonateInputAddress from '@subwallet/extension-koni-ui/components/DonateInputAddress';
import FormatBalance from '@subwallet/extension-koni-ui/components/FormatBalance';
import InputAddress from '@subwallet/extension-koni-ui/components/InputAddress';
import Modal from '@subwallet/extension-koni-ui/components/Modal';
import DisplayPayload from '@subwallet/extension-koni-ui/components/Qr/DisplayPayload';
import { BalanceFormatType } from '@subwallet/extension-koni-ui/components/types';
import { QrContext, QrContextState, QrStep } from '@subwallet/extension-koni-ui/contexts/QrContext';
import useTranslation from '@subwallet/extension-koni-ui/hooks/useTranslation';
import { getAccountMeta, makeTransfer, makeTransferQr, rejectTransferQr, resolveTransferQr } from '@subwallet/extension-koni-ui/messaging';
import { ThemeProps, TransferResultType } from '@subwallet/extension-koni-ui/types';
import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';

import { KeyringPair$Meta } from '@polkadot/keyring/types';
import { QrScanSignature } from '@polkadot/react-qr';
import { SignerResult } from '@polkadot/types/types';
import { BN, hexToU8a, isHex } from '@polkadot/util';

interface Props extends ThemeProps {
  className?: string;
  onCancel: () => void;
  requestPayload: RequestCheckTransfer;
  feeInfo: [string | null, number, string]; // fee, fee decimal, fee symbol
  balanceFormat: BalanceFormatType; // decimal, symbol
  networkMap: Record<string, NetworkJson>;
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

interface SigData {
  signature: string;
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

let id = 1;

function AuthTransaction ({ className, isDonation, feeInfo: [fee, feeDecimals, feeSymbol], balanceFormat, networkMap, onCancel, onChangeResult, requestPayload }: Props): React.ReactElement<Props> | null {
  const { t } = useTranslation();

  const { QrState, cleanQrState, updateQrState } = useContext(QrContext);

  const { isEthereum, isQrHashed, qrAddress, qrId, qrPayload, step } = QrState;

  const [isBusy, setBusy] = useState(false);
  const [password, setPassword] = useState<string>('');
  const [isKeyringErr, setKeyringErr] = useState<boolean>(false);
  const [errorArr, setErrorArr] = useState<string[]>([]);
  const [accountMeta, setAccountMeta] = useState<KeyringPair$Meta>({});
  const networkPrefix = networkMap[requestPayload.networkKey].ss58Format;
  const genesisHash = networkMap[requestPayload.networkKey].genesisHash;

  const isQr = useMemo((): boolean => {
    if (accountMeta.isExternal !== undefined) {
      return !!accountMeta.isExternal;
    } else {
      return false;
    }
  }, [accountMeta.isExternal]);

  useEffect(() => {
    let unmount = false;

    const handler = async () => {
      const { meta } = await getAccountMeta({ address: requestPayload.from });

      if (!unmount) {
        setAccountMeta(meta);
      }
    };

    // eslint-disable-next-line no-void
    void handler();

    return () => {
      unmount = true;
    };
  }, [requestPayload.from]);

  const handlerReject = useCallback(async () => {
    if (qrId) {
      await rejectTransferQr({ id: qrId });
    }

    cleanQrState();
  }, [cleanQrState, qrId]);

  const _onCancel = useCallback(async () => {
    if (qrId) {
      await handlerReject();
    }

    onCancel();
  },
  [handlerReject, onCancel, qrId]
  );

  const handlerResolve = useCallback(async (result: SignerResult) => {
    if (qrId) {
      await resolveTransferQr({ id: qrId, data: result });
    }
  }, [qrId]);

  const handlerScanSignature = useCallback(async (data: SigData): Promise<void> => {
    if (isHex(data.signature)) {
      await handlerResolve({
        signature: data.signature,
        id: id++
      });
    }
  }, [handlerResolve]);

  const handlerCallbackResponseResult = useCallback((rs: ResponseTransfer) => {
    if (!rs.isFinalized) {
      if (rs.step === TransferStep.SUCCESS.valueOf()) {
        onChangeResult({
          isShowTxResult: true,
          isTxSuccess: rs.step === TransferStep.SUCCESS.valueOf(),
          extrinsicHash: rs.extrinsicHash
        });
        cleanQrState();
        setBusy(false);
      } else if (rs.step === TransferStep.ERROR.valueOf()) {
        onChangeResult({
          isShowTxResult: true,
          isTxSuccess: rs.step === TransferStep.SUCCESS.valueOf(),
          extrinsicHash: rs.extrinsicHash,
          txError: rs.errors
        });
        cleanQrState();
        setBusy(false);
      }
    }
  }, [cleanQrState, onChangeResult]);

  const handlerResponseError = useCallback((errors: TransferError[]) => {
    const errorMessage = errors.map((err) => err.message);

    if (errors.find((err) => err.code === 'keyringError')) {
      setKeyringErr(true);
    }

    setErrorArr(errorMessage);

    if (errorMessage && errorMessage.length) {
      setBusy(false);
    }
  }, []);

  const _doStart = useCallback(
    (): void => {
      setBusy(true);

      if (!isQr) {
        makeTransfer({
          ...requestPayload,
          password
        }, handlerCallbackResponseResult).then(handlerResponseError)
          .catch((e) => console.log('There is problem when makeTransfer', e));
      } else {
        makeTransferQr({
          ...requestPayload
        }, (rs) => {
          if (rs.qrState) {
            const state: QrContextState = {
              ...rs.qrState,
              step: QrStep.DISPLAY_PAYLOAD
            };

            updateQrState(state);
            setBusy(false);
          }

          if (rs.isBusy && rs.step !== TransferStep.SUCCESS.valueOf()) {
            updateQrState({ step: QrStep.SENDING_TX });
            setBusy(true);
          }

          handlerCallbackResponseResult(rs);
        }).then(handlerResponseError)
          .catch((e) => console.log('There is problem when makeTransferQr', e));
      }
    },
    [isQr, requestPayload, password, handlerCallbackResponseResult, handlerResponseError, updateQrState]
  );

  const handlerChangeToScan = useCallback(() => {
    updateQrState({ step: QrStep.SCAN_QR });
  }, [updateQrState]);

  const handlerChangeToDisplayQr = useCallback(() => {
    updateQrState({ step: QrStep.DISPLAY_PAYLOAD });
  }, [updateQrState]);

  const _onChangePass = useCallback((value: string): void => {
    setPassword(value);
    setErrorArr([]);
    setKeyringErr(false);
  }, []);

  const renderError = useCallback(() => {
    if (errorArr && errorArr.length) {
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
    } else {
      return <></>;
    }
  }, [errorArr, t]);

  const handlerRenderInfo = useCallback(() => {
    return (
      <>
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
              amountSymbol: balanceFormat[2] || balanceFormat[1]
            })}
          </div>
        </div>
      </>
    );
  }, [balanceFormat, fee, feeDecimals, feeSymbol, isDonation, networkPrefix, requestPayload, t]);

  const handlerRenderContent = useCallback(() => {
    if (!isQr) {
      return (
        <div className='auth-transaction-body'>
          { handlerRenderInfo() }
          <div className='auth-transaction__separator' />
          <InputWithLabel
            isError={isKeyringErr}
            label={t<string>('Unlock account with password')}
            onChange={_onChangePass}
            type='password'
            value={password}
          />
          { renderError() }
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
      );
    } else {
      switch (step) {
        case QrStep.SENDING_TX:
          return (
            <div className='auth-transaction-body'>
              <LoadingContainer />
            </div>
          );
        case QrStep.SCAN_QR:
          return (
            <div className='auth-transaction-body'>
              <div className='scan-qr'>
                <QrScanSignature
                  // eslint-disable-next-line @typescript-eslint/no-misused-promises
                  onScan={handlerScanSignature}
                />
              </div>
              <div className='auth-transaction__separator' />
              { renderError() }
              <div className='auth-transaction__submit-wrapper'>
                <Button
                  className={'auth-transaction__submit-btn'}
                  onClick={handlerChangeToDisplayQr}
                >
                  {t<string>('Back to previous step')}
                </Button>
              </div>
            </div>
          );
        case QrStep.DISPLAY_PAYLOAD:
          return (
            <div className='auth-transaction-body'>
              <div className='display-qr'>
                <div className='qr-content'>
                  <DisplayPayload
                    address={qrAddress}
                    genesisHash={genesisHash}
                    isEthereum={isEthereum}
                    isHash={isQrHashed}
                    payload={hexToU8a(qrPayload)}
                    size={320}
                  />
                </div>
              </div>
              <div className='auth-transaction__separator' />
              { renderError() }
              <div className='auth-transaction__submit-wrapper'>
                <Button
                  className={'auth-transaction__submit-btn'}
                  onClick={handlerChangeToScan}
                >
                  {t<string>('Scan QR')}
                </Button>
              </div>
            </div>
          );
        case QrStep.TRANSACTION_INFO:
        default:
          return (
            <div className='auth-transaction-body'>
              { handlerRenderInfo() }
              <div className='auth-transaction__separator' />
              { renderError() }
              <div className='auth-transaction__submit-wrapper'>
                <Button
                  className={'auth-transaction__submit-btn'}
                  isBusy={isBusy}
                  onClick={_doStart}
                >
                  {t<string>('Sign via QR')}
                </Button>
              </div>
            </div>
          );
      }
    }
  }, [_doStart, _onChangePass, errorArr, genesisHash, handlerChangeToDisplayQr, handlerChangeToScan, handlerRenderInfo, handlerScanSignature, isBusy, isEthereum, isKeyringErr, isQr, isQrHashed, password, qrAddress, qrPayload, renderError, step, t]);

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
                  // eslint-disable-next-line @typescript-eslint/no-misused-promises
                  onClick={_onCancel}
                >{t('Cancel')}</span>
              )
            }
          </div>
        </div>
        { handlerRenderContent() }

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

  .display-qr {
    margin: 0 30px;
    display: flex;
    justify-content: center;
    align-items: center;

    .qr-content {
      height: 324px;
      width: 324px;
      border: 2px solid ${theme.textColor};
    }
  }

  .scan-qr {
    margin: 0 20px;
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
