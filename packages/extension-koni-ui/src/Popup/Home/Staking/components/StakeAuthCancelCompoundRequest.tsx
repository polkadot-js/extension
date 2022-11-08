// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { BaseTxError, ResponseCancelCompoundStakeExternal, ResponseCancelCompoundStakeLedger, ResponseCancelCompoundStakeQr } from '@subwallet/extension-base/background/KoniTypes';
import { LedgerState } from '@subwallet/extension-base/build/signers/types';
import { InputWithLabel } from '@subwallet/extension-koni-ui/components';
import Button from '@subwallet/extension-koni-ui/components/Button';
import InputAddress from '@subwallet/extension-koni-ui/components/InputAddress';
import LedgerRequest from '@subwallet/extension-koni-ui/components/Signing/Ledger/LedgerRequest';
import Modal from '@subwallet/extension-koni-ui/components/Modal';
import QrRequest from '@subwallet/extension-koni-ui/components/Signing/QR/QrRequest';
import Spinner from '@subwallet/extension-koni-ui/components/Spinner';
import { SIGN_MODE } from '@subwallet/extension-koni-ui/constants/signing';
import { ExternalRequestContext } from '@subwallet/extension-koni-ui/contexts/ExternalRequestContext';
import { QrSignerContext, QrContextState, QrStep } from '@subwallet/extension-koni-ui/contexts/QrSignerContext';
import useGetNetworkJson from '@subwallet/extension-koni-ui/hooks/screen/home/useGetNetworkJson';
import { useRejectExternalRequest } from '@subwallet/extension-koni-ui/hooks/useRejectExternalRequest';
import { useSignMode } from '@subwallet/extension-koni-ui/hooks/useSignMode';
import useToast from '@subwallet/extension-koni-ui/hooks/useToast';
import useTranslation from '@subwallet/extension-koni-ui/hooks/useTranslation';
import { cancelCompoundLedger, cancelCompoundQr, getAccountMeta, submitTuringCancelStakeCompounding } from '@subwallet/extension-koni-ui/messaging';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { toShort } from '@subwallet/extension-koni-ui/util';
import React, { useCallback, useContext, useEffect, useState } from 'react';
import styled from 'styled-components';

import { KeyringPair$Meta } from '@polkadot/keyring/types';

interface Props extends ThemeProps {
  className?: string;
  setShowAuth: (val: boolean) => void;
  setShowResult: (val: boolean) => void;

  taskId: string;
  address: string;
  networkKey: string;
  setExtrinsicHash: (val: string) => void;
  setIsTxSuccess: (val: boolean) => void;
  setTxError: (val: string) => void;

  balanceError: boolean;
  fee: string;
}

function StakeAuthCancelCompoundRequest ({ address, balanceError, className, fee, networkKey, setExtrinsicHash, setIsTxSuccess, setShowAuth, setShowResult, setTxError, taskId }: Props): React.ReactElement<Props> {
  const { handlerReject } = useRejectExternalRequest();

  const { clearExternalState, externalState: { externalId }, updateExternalState } = useContext(ExternalRequestContext);
  const { cleanQrState, updateQrState } = useContext(QrSignerContext);

  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState<string>('');
  const [passwordError, setPasswordError] = useState<string | null>('');

  const [accountMeta, setAccountMeta] = useState<KeyringPair$Meta>({});
  const [errorArr, setErrorArr] = useState<string[]>([]);

  const signMode = useSignMode(accountMeta);

  const networkJson = useGetNetworkJson(networkKey);
  const { t } = useTranslation();
  const { show } = useToast();

  const _onChangePass = useCallback((value: string) => {
    setPassword(value);
    setPasswordError(null);
  }, []);

  const handleClickCancel = useCallback(async () => {
    if (!loading) {
      await handlerReject(externalId);
      setShowAuth(false);
    }
  }, [externalId, handlerReject, loading, setShowAuth]);

  const handleOnSubmit = useCallback(async () => {
    setLoading(true);

    await submitTuringCancelStakeCompounding({
      address,
      password,
      taskId,
      networkKey
    }, (cbData) => {
      if (cbData.passwordError) {
        show(cbData.passwordError);
        setPasswordError(cbData.passwordError);
        setLoading(false);
      }

      if (balanceError && !cbData.passwordError) {
        setLoading(false);
        show('Your balance is too low to cover fees');

        return;
      }

      if (cbData.txError && cbData.txError) {
        show('Encountered an error, please try again.');
        setLoading(false);

        return;
      }

      if (cbData.status) {
        setLoading(false);

        if (cbData.status) {
          setIsTxSuccess(true);
          setShowAuth(false);
          setShowResult(true);
          setExtrinsicHash(cbData.extrinsicHash as string);
        } else {
          setIsTxSuccess(false);
          setTxError('Error submitting transaction');
          setShowAuth(false);
          setShowResult(true);
          setExtrinsicHash(cbData.extrinsicHash as string);
        }
      }
    });
  }, [address, balanceError, networkKey, password, setExtrinsicHash, setIsTxSuccess, setShowAuth, setShowResult, setTxError, show, taskId]);

  const handleConfirm = useCallback(() => {
    setLoading(true);

    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    setTimeout(async () => {
      await handleOnSubmit();
    }, 10);
  }, [handleOnSubmit]);

  // External

  const handlerCallbackResponseResult = useCallback((data: ResponseCancelCompoundStakeExternal) => {
    if (balanceError && !data.passwordError) {
      setLoading(false);
      setErrorArr(['Your balance is too low to cover fees']);
      setIsTxSuccess(false);
      setTxError('Your balance is too low to cover fees');
      setShowResult(true);
      cleanQrState();

      return;
    }

    if (data.txError && data.status === undefined) {
      setErrorArr(['Encountered an error, please try again.']);
      setLoading(false);
      setIsTxSuccess(false);
      setTxError('Encountered an error, please try again.');
      setShowResult(false);
      cleanQrState();
      clearExternalState();

      return;
    }

    if (data.status !== undefined) {
      setLoading(false);

      if (data.status) {
        setIsTxSuccess(true);
        setShowAuth(false);
        setShowResult(true);
        setExtrinsicHash(data.transactionHash as string);
      } else {
        setIsTxSuccess(false);
        setTxError('Error submitting transaction');
        setShowAuth(false);
        setShowResult(true);
        setExtrinsicHash(data.transactionHash as string);
      }

      cleanQrState();
      clearExternalState();
    }
  }, [balanceError, cleanQrState, clearExternalState, setExtrinsicHash, setIsTxSuccess, setShowAuth, setShowResult, setTxError]);

  const handlerResponseError = useCallback((errors: BaseTxError[]) => {
    const errorMessage = errors.map((err) => err.message);

    setErrorArr(errorMessage);

    if (errorMessage && errorMessage.length) {
      setLoading(false);
    }
  }, []);

  // Qr

  const handlerCallbackResponseResultQr = useCallback((data: ResponseCancelCompoundStakeQr) => {
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

  const handleOnSubmitQr = useCallback(() => {
    cancelCompoundQr({
      address,
      taskId,
      networkKey
    }, handlerCallbackResponseResultQr)
      .then(handlerResponseError)
      .catch((e) => console.log('There is problem when cancelCompound task', e));
  }, [address, handlerCallbackResponseResultQr, handlerResponseError, networkKey, taskId]);

  const handleConfirmQr = useCallback(() => {
    setLoading(true);

    setTimeout(() => {
      handleOnSubmitQr();
    }, 10);
  }, [handleOnSubmitQr]);

  // Ledger

  const handlerCallbackResponseResultLedger = useCallback((handlerSignLedger: (ledgerState: LedgerState) => void, data: ResponseCancelCompoundStakeLedger) => {
    if (data.ledgerState) {
      handlerSignLedger(data.ledgerState);
    }

    if (data.externalState) {
      updateExternalState(data.externalState);
    }

    handlerCallbackResponseResult(data);
  }, [handlerCallbackResponseResult, updateExternalState]);

  const handlerSendLedgerSubstrate = useCallback((handlerSignLedger: (ledgerState: LedgerState) => void) => {
    const callback = (data: ResponseCancelCompoundStakeExternal) => {
      handlerCallbackResponseResultLedger(handlerSignLedger, data);
    };

    cancelCompoundLedger({
      address,
      taskId,
      networkKey
    }, callback)
      .then(handlerResponseError)
      .catch((e) => console.log('There is problem when cancelCompound', e));
  }, [address, handlerCallbackResponseResultLedger, handlerResponseError, networkKey, taskId]);

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

  const handlerErrorQr = useCallback((error: Error) => {
    setErrorArr([error.message]);
  }, []);

  const handlerClearError = useCallback(() => {
    setErrorArr([]);
  }, []);

  const renderInfo = useCallback(() => {
    return (
      <>
        <InputAddress
          autoPrefill={false}
          className={'receive-input-address'}
          defaultValue={address}
          help={t<string>('The account which you will cancel the compounding task')}
          isDisabled={true}
          isSetDefaultValue={true}
          label={t<string>('Cancel compounding task of account')}
          networkPrefix={networkJson.ss58Format}
          type='allPlus'
          withEllipsis
        />

        <div className={'transaction-info-container'}>
          <div className={'transaction-info-row'}>
            <div className={'transaction-info-title'}>Task ID</div>
            <div className={'transaction-info-value'}>{toShort(taskId)}</div>
          </div>
          <div className={'transaction-info-row'}>
            <div className={'transaction-info-title'}>Transaction fee</div>
            <div className={'transaction-info-value'}>{fee}</div>
          </div>

          <div className={'transaction-info-row'}>
            <div className={'transaction-info-title'}>Total</div>
            <div className={'transaction-info-value'}>{fee}</div>
          </div>
        </div>
      </>
    );
  }, [address, fee, networkJson.ss58Format, t, taskId]);

  const renderContent = useCallback(() => {
    switch (signMode) {
      case SIGN_MODE.QR:
        return (
          <div className='external-wrapper'>
            <QrRequest
              clearError={handlerClearError}
              errorArr={errorArr}
              genesisHash={networkJson.genesisHash}
              handlerStart={handleConfirmQr}
              isBusy={loading}
              onError={handlerErrorQr}
            >
              {renderInfo()}
            </QrRequest>
          </div>
        );
      case SIGN_MODE.LEDGER:
        return (
          <div className='external-wrapper'>
            <LedgerRequest
              accountMeta={accountMeta}
              errorArr={errorArr}
              genesisHash={networkJson.genesisHash}
              handlerSignLedger={handlerSendLedger}
              isBusy={loading}
              setBusy={setLoading}
              setErrorArr={setErrorArr}
            >
              {renderInfo()}
            </LedgerRequest>
          </div>
        );
      case SIGN_MODE.PASSWORD:
      default:
        return (
          <>
            {renderInfo()}

            <div className='cancel-compound-auth__separator' />

            <InputWithLabel
              isError={passwordError !== null}
              label={t<string>('Unlock account with password')}
              onChange={_onChangePass}
              type='password'
              value={password}
            />

            <div className={'cancel-compound-auth-btn-container'}>
              <Button
                className={'cancel-compound-auth-cancel-button'}
                isDisabled={loading}
                onClick={handleClickCancel}
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
  }, [_onChangePass, accountMeta, errorArr, handleClickCancel, handleConfirm, handleConfirmQr, handlerClearError, handlerErrorQr, handlerSendLedger, loading, networkJson.genesisHash, password, passwordError, renderInfo, signMode, t]);

  useEffect(() => {
    let unmount = false;

    const handler = async () => {
      const { meta } = await getAccountMeta({ address: address });

      if (!unmount) {
        setAccountMeta(meta);
      }
    };

    // eslint-disable-next-line no-void
    void handler();

    return () => {
      unmount = true;
    };
  }, [address]);

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
            onClick={handleClickCancel}
          >
            Cancel
          </div>
        </div>

        <div className={'cancel-compound-auth-container'}>
          {renderContent()}
        </div>
      </Modal>
    </div>
  );
}

export default React.memo(styled(StakeAuthCancelCompoundRequest)(({ theme }: Props) => `
  .container-spinner {
    height: 65px;
    width: 65px;
  }

  .cancel-compound-auth-cancel-button {
    color: ${theme.textColor3};
    background: ${theme.buttonBackground1};
  }

  .cancel-compound-auth-btn-container {
    margin-top: 20px;
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 20px;
  }

  .cancel-compound-auth__separator {
    margin-top: 30px;
    margin-bottom: 18px;
  }

  .cancel-compound-auth__separator:before {
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

  .cancel-compound-auth-container {
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
