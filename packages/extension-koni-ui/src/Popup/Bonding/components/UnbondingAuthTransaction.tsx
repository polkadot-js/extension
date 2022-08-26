// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { BaseTxError, ResponseUnStakeExternal, ResponseUnStakeLedger, ResponseUnStakeQr } from '@subwallet/extension-base/background/KoniTypes';
import { LedgerState } from '@subwallet/extension-base/signers/types';
import { InputWithLabel } from '@subwallet/extension-koni-ui/components';
import { BalanceVal } from '@subwallet/extension-koni-ui/components/Balance';
import FeeValue from '@subwallet/extension-koni-ui/components/Balance/FeeValue';
import Button from '@subwallet/extension-koni-ui/components/Button';
import InputAddress from '@subwallet/extension-koni-ui/components/InputAddress';
import LedgerRequest from '@subwallet/extension-koni-ui/components/Ledger/LedgerRequest';
import Modal from '@subwallet/extension-koni-ui/components/Modal';
import QrRequest from '@subwallet/extension-koni-ui/components/Qr/QrRequest';
import Spinner from '@subwallet/extension-koni-ui/components/Spinner';
import { SIGN_MODE } from '@subwallet/extension-koni-ui/constants/signing';
import { ExternalRequestContext } from '@subwallet/extension-koni-ui/contexts/ExternalRequestContext';
import { QrContext, QrContextState, QrStep } from '@subwallet/extension-koni-ui/contexts/QrContext';
import useGetNetworkJson from '@subwallet/extension-koni-ui/hooks/screen/home/useGetNetworkJson';
import { useRejectExternalRequest } from '@subwallet/extension-koni-ui/hooks/useRejectExternalRequest';
import { useSignMode } from '@subwallet/extension-koni-ui/hooks/useSignMode';
import useToast from '@subwallet/extension-koni-ui/hooks/useToast';
import useTranslation from '@subwallet/extension-koni-ui/hooks/useTranslation';
import { makeUnBondingLedger, makeUnBondingQr, submitUnbonding } from '@subwallet/extension-koni-ui/messaging';
import { RootState } from '@subwallet/extension-koni-ui/stores';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import React, { useCallback, useContext, useState } from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

interface Props extends ThemeProps {
  amount: number,
  className?: string,
  setShowConfirm: (val: boolean) => void,
  selectedNetwork: string,
  fee: string,
  balanceError: boolean,
  setShowResult: (val: boolean) => void,
  setExtrinsicHash: (val: string) => void,
  setIsTxSuccess: (val: boolean) => void,
  setTxError: (val: string) => void,
  unbondAll: boolean,
  selectedValidator: string,
  handleRevertClickNext: () => void
}

function UnbondingAuthTransaction ({ amount, balanceError, className, fee, handleRevertClickNext, selectedNetwork, selectedValidator, setExtrinsicHash, setIsTxSuccess, setShowConfirm, setShowResult, setTxError, unbondAll }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const { show } = useToast();

  const { handlerReject } = useRejectExternalRequest();

  const { clearExternalState, externalState: { externalId }, updateExternalState } = useContext(ExternalRequestContext);
  const { cleanQrState, updateQrState } = useContext(QrContext);

  const networkJson = useGetNetworkJson(selectedNetwork);
  const { currentAccount: { account } } = useSelector((state: RootState) => state);

  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState<string>('');
  const [passwordError, setPasswordError] = useState<string | null>('');
  const [errorArr, setErrorArr] = useState<string[]>([]);

  const signMode = useSignMode(account);

  const _onChangePass = useCallback((value: string) => {
    setPassword(value);
    setPasswordError(null);
  }, []);

  const hideConfirm = useCallback(async () => {
    if (!loading) {
      await handlerReject(externalId);

      handleRevertClickNext();
      setShowConfirm(false);
    }
  }, [externalId, handleRevertClickNext, handlerReject, loading, setShowConfirm]);

  const handleOnSubmit = useCallback(async () => {
    await submitUnbonding({
      networkKey: selectedNetwork,
      address: account?.address as string,
      amount,
      password,
      unstakeAll: unbondAll,
      validatorAddress: selectedValidator
    }, (resp) => {
      if (resp.passwordError) {
        show(resp.passwordError);
        setPasswordError(resp.passwordError);
        setLoading(false);
      }

      if (balanceError && !resp.passwordError) {
        setLoading(false);
        show('Your balance is too low to cover fees');

        return;
      }

      if (resp.txError && resp.txError) {
        show('Encountered an error, please try again.');
        setLoading(false);

        return;
      }

      if (resp.status) {
        setLoading(false);

        if (resp.status) {
          setIsTxSuccess(true);
          setShowConfirm(false);
          setShowResult(true);
          setExtrinsicHash(resp.transactionHash as string);
        } else {
          setIsTxSuccess(false);
          setTxError('Error submitting transaction');
          setShowConfirm(false);
          setShowResult(true);
          setExtrinsicHash(resp.transactionHash as string);
        }
      }
    });
  }, [account?.address, amount, balanceError, password, selectedNetwork, selectedValidator, setExtrinsicHash, setIsTxSuccess, setShowConfirm, setShowResult, setTxError, show, unbondAll]);

  const handleConfirm = useCallback(() => {
    setLoading(true);

    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    setTimeout(async () => {
      await handleOnSubmit();
    }, 10);
  }, [handleOnSubmit]);

  // External

  const handlerResponseError = useCallback((errors: BaseTxError[]) => {
    const errorMessage = errors.map((err) => err.message);

    setErrorArr(errorMessage);

    if (errorMessage && errorMessage.length) {
      setLoading(false);
    }
  }, []);

  const handlerCallbackResponseResult = useCallback((data: ResponseUnStakeExternal) => {
    if (balanceError && !data.passwordError) {
      setLoading(false);
      setErrorArr(['Your balance is too low to cover fees']);
      setIsTxSuccess(false);
      setTxError('Your balance is too low to cover fees');
      setShowConfirm(false);
      setShowResult(true);
      cleanQrState();

      return;
    }

    if (data.txError && data.status === undefined) {
      setErrorArr(['Encountered an error, please try again.']);
      setLoading(false);
      setIsTxSuccess(false);
      setTxError('Encountered an error, please try again.');
      setShowConfirm(false);
      setShowResult(false);
      cleanQrState();
      clearExternalState();

      return;
    }

    if (data.status !== undefined) {
      setLoading(false);

      if (data.status) {
        setIsTxSuccess(true);
        setShowConfirm(false);
        setShowResult(true);
        setExtrinsicHash(data.transactionHash as string);
      } else {
        setIsTxSuccess(false);
        setTxError('Error submitting transaction');
        setShowConfirm(false);
        setShowResult(true);
        setExtrinsicHash(data.transactionHash as string);
      }

      cleanQrState();
      clearExternalState();
    }
  }, [balanceError, cleanQrState, clearExternalState, setExtrinsicHash, setIsTxSuccess, setShowConfirm, setShowResult, setTxError]);

  // Qr

  const handlerCallbackResponseResultQr = useCallback((data: ResponseUnStakeQr) => {
    if (data.qrState) {
      const state: QrContextState = {
        ...data.qrState,
        step: QrStep.DISPLAY_PAYLOAD
      };

      setLoading(false);
      updateQrState(state);
    }

    if (data.externalState) {
      updateExternalState(data.externalState);
    }

    if (data.isBusy) {
      updateQrState({ step: QrStep.SENDING_TX });
      setLoading(true);
    }

    handlerCallbackResponseResult(data);
  }, [handlerCallbackResponseResult, updateExternalState, updateQrState]);

  const handlerOnSubmitQr = useCallback(() => {
    makeUnBondingQr({
      networkKey: selectedNetwork,
      address: account?.address as string,
      amount
    }, handlerCallbackResponseResultQr)
      .then(handlerResponseError)
      .catch((e) => console.log('There is problem when makeUnBondingQr', e));
  }, [account?.address, amount, handlerCallbackResponseResultQr, handlerResponseError, selectedNetwork]);

  const handlerErrorQr = useCallback((error: Error) => {
    setErrorArr([error.message]);
  }, []);

  const handlerSubmitQr = useCallback(() => {
    setLoading(true);

    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    setTimeout(() => {
      handlerOnSubmitQr();
    }, 10);
  }, [handlerOnSubmitQr]);

  // Ledger

  const handlerCallbackResponseResultLedger = useCallback((handlerSignLedger: (ledgerState: LedgerState) => void, data: ResponseUnStakeLedger) => {
    if (data.ledgerState) {
      handlerSignLedger(data.ledgerState);
    }

    if (data.externalState) {
      updateExternalState(data.externalState);
    }

    handlerCallbackResponseResult(data);
  }, [handlerCallbackResponseResult, updateExternalState]);

  const handlerSendLedgerSubstrate = useCallback((handlerSignLedger: (ledgerState: LedgerState) => void) => {
    const callback = (data: ResponseUnStakeExternal) => {
      handlerCallbackResponseResultLedger(handlerSignLedger, data);
    };

    makeUnBondingLedger({
      networkKey: selectedNetwork,
      address: account?.address as string,
      amount
    }, callback)
      .then(handlerResponseError)
      .catch((e) => console.log('There is problem when makeTransferNftQrSubstrate', e));
  }, [account?.address, amount, handlerCallbackResponseResultLedger, handlerResponseError, selectedNetwork]);

  const handlerSendLedger = useCallback((handlerSignLedger: (ledgerState: LedgerState) => void) => {
    if (loading) {
      return;
    }

    setLoading(true);

    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    setTimeout(() => {
      const sendSubstrate = () => {
        handlerSendLedgerSubstrate(handlerSignLedger);
      };

      sendSubstrate();
    }, 10);
  }, [handlerSendLedgerSubstrate, loading]);

  const renderInfo = useCallback(() => {
    return (
      <>
        <InputAddress
          autoPrefill={false}
          className={'receive-input-address'}
          defaultValue={account?.address}
          help={t<string>('The account which you will unstake')}
          isDisabled={true}
          isSetDefaultValue={true}
          label={t<string>('Unstake from account')}
          networkPrefix={networkJson.ss58Format}
          type='allPlus'
          withEllipsis
        />

        <div className={'transaction-info-container'}>
          <div className={'transaction-info-row'}>
            <div className={'transaction-info-title'}>Unstaking amount</div>
            <div className={'transaction-info-value'}>
              <BalanceVal
                symbol={networkJson.nativeToken}
                value={amount}
                withSymbol={true}
              />
            </div>
          </div>

          <div className={'transaction-info-row'}>
            <div className={'transaction-info-title'}>Unstaking fee</div>
            <div className={'transaction-info-value'}>
              <FeeValue feeString={fee} />
            </div>
          </div>

          <div className={'transaction-info-row'}>
            <div className={'transaction-info-title'}>Total</div>
            <div className={'transaction-info-value'}>
              <BalanceVal
                symbol={networkJson.nativeToken}
                value={amount}
                withSymbol={true}
              />
              &nbsp;+&nbsp;
              <FeeValue feeString={fee} />
            </div>
          </div>
        </div>
      </>
    );
  }, [account?.address, amount, fee, networkJson, t]);

  const renderContent = useCallback(() => {
    switch (signMode) {
      case SIGN_MODE.QR:
        return (
          <div className='external-wrapper'>
            <QrRequest
              errorArr={errorArr}
              genesisHash={networkJson.genesisHash}
              handlerStart={handlerSubmitQr}
              isBusy={loading}
              onError={handlerErrorQr}
            >
              { renderInfo() }
            </QrRequest>
          </div>
        );
      case SIGN_MODE.LEDGER:
        return (
          <div className='external-wrapper'>
            <LedgerRequest
              accountMeta={account}
              errorArr={errorArr}
              genesisHash={networkJson.genesisHash}
              handlerSignLedger={handlerSendLedger}
              isBusy={loading}
              setBusy={setLoading}
              setErrorArr={setErrorArr}
            >
              { renderInfo() }
            </LedgerRequest>
          </div>
        );
      case SIGN_MODE.PASSWORD:
      default:
        return (
          <>
            { renderInfo() }

            <div className='bonding-auth__separator' />

            <InputWithLabel
              isError={passwordError !== null}
              label={t<string>('Unlock account with password')}
              onChange={_onChangePass}
              type='password'
              value={password}
            />

            <div className={'bonding-auth-btn-container'}>
              <Button
                className={'bonding-auth-cancel-button'}
                isDisabled={loading}
                onClick={hideConfirm}
              >
                Reject
              </Button>
              <Button
                isDisabled={password === ''}
                onClick={handleConfirm}
              >
                {
                  loading
                    ? <Spinner />
                    : <span>Confirm</span>
                }
              </Button>
            </div>
          </>
        );
    }
  }, [_onChangePass, account, errorArr, handleConfirm, handlerErrorQr, handlerSendLedger, handlerSubmitQr, hideConfirm, loading, networkJson.genesisHash, password, passwordError, renderInfo, signMode, t]);

  return (
    <div className={className}>
      <Modal>
        <div className={'header-confirm'}>
          <div className={'header-alignment'} /> {/* for alignment */}
          <div
            className={'header-title-confirm'}
          >
            Authorize transaction
          </div>
          <div
            className={'close-button-confirm header-alignment'}
            // eslint-disable-next-line @typescript-eslint/no-misused-promises
            onClick={hideConfirm}
          >
            Cancel
          </div>
        </div>

        <div className={'bonding-auth-container'}>
          { renderContent() }
        </div>
      </Modal>
    </div>
  );
}

export default React.memo(styled(UnbondingAuthTransaction)(({ theme }: Props) => `
  .bonding-auth-cancel-button {
    color: ${theme.textColor3};
    background: ${theme.buttonBackground1};
  }

  .bonding-auth-btn-container {
    margin-top: 20px;
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 20px;
  }

  .bonding-auth__separator {
    margin-top: 30px;
    margin-bottom: 18px;
  }

  .bonding-auth__separator:before {
    content: "";
    height: 1px;
    display: block;
    background: ${theme.boxBorderColor};
  }

  .transaction-info-container {
    margin-top: 20px;
    width: 100%;
  }

  .transaction-info-row {
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .transaction-info-title {
    font-weight: 500;
    font-size: 15px;
    line-height: 26px;
    color: ${theme.textColor2};
  }

  .transaction-info-value {
    font-weight: 500;
    font-size: 15px;
    line-height: 26px;
  }

  .selected-validator {
    font-weight: 500;
    font-size: 18px;
    line-height: 28px;
    margin-top: 5px;
  }

  .bonding-auth-container {
    padding-left: 15px;
    padding-right: 15px;
    display: flex;
    flex-direction: column;
    flex: 1;
  }

  .validator-expected-return {
    font-size: 14px;
    color: ${theme.textColor3};
  }

  .validator-footer {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 10px;
  }

  .validator-header {
    font-size: 14px;
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .identityIcon {
    border: 2px solid ${theme.checkDotColor};
  }
  .validator-item-container {
    margin-top: 10px;
    margin-bottom: 28px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    background-color: ${theme.backgroundAccountAddress};
    padding: 10px 15px;
    border-radius: 8px;
    gap: 10px;
  }

  .close-button-confirm {
    text-align: right;
    font-size: 14px;
    cursor: pointer;
    color: ${theme.textColor3}
  }

  .header-alignment {
    width: 20%;
  }

  .header-title-confirm {
    width: 85%;
    text-align: center;
  }

  .header-confirm {
    width: 100%;
    display: flex;
    justify-content: space-between;
    margin-bottom: 12px;
    font-size: 24px;
    font-weight: 500;
    line-height: 36px;
    font-style: normal;
    box-shadow: ${theme.headerBoxShadow};
    padding-top: 20px;
    padding-bottom: 20px;
    padding-left: 15px;
    padding-right: 15px;
  }

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
    border: 1px solid ${theme.extensionBorder};
  }

  .external-wrapper {
    display: flex;
    flex: 1;
    flex-direction: column;
    margin: -15px -15px 0;
  }
`));
