// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { BaseRequestSign, BasicTxResponse, ExternalRequestSign, HandleTxResponse, NetworkJson, PasswordRequestSign } from '@subwallet/extension-base/background/KoniTypes';
import { AccountJson } from '@subwallet/extension-base/background/types';
import { LedgerState } from '@subwallet/extension-base/signers/types';
import LedgerRequest from '@subwallet/extension-koni-ui/components/Signing/Ledger/LedgerRequest';
import PasswordRequest from '@subwallet/extension-koni-ui/components/Signing/Password/PasswordRequest';
import QrRequest from '@subwallet/extension-koni-ui/components/Signing/QR/QrRequest';
import UnknownRequest from '@subwallet/extension-koni-ui/components/Signing/Unknown/UnknownRequest';
import { SIGN_MODE } from '@subwallet/extension-koni-ui/constants/signing';
import { ExternalRequestContext } from '@subwallet/extension-koni-ui/contexts/ExternalRequestContext';
import { QrContextState, QrSignerContext, QrStep } from '@subwallet/extension-koni-ui/contexts/QrSignerContext';
import { SigningContext } from '@subwallet/extension-koni-ui/contexts/SigningContext';
import { useGetSignMode } from '@subwallet/extension-koni-ui/hooks/useGetSignMode';
import React, { useCallback, useContext, useEffect } from 'react';
import styled from 'styled-components';

interface Props<T extends BaseRequestSign, V extends BasicTxResponse> {
  account?: AccountJson | null;
  balanceError?: boolean;
  children: JSX.Element;
  handleSignLedger?: (params: ExternalRequestSign<T>, callback: HandleTxResponse<V>) => Promise<V>;
  handleSignPassword?: (params: PasswordRequestSign<T>, callback: HandleTxResponse<V>) => Promise<V>;
  handleSignQr?: (params: ExternalRequestSign<T>, callback: HandleTxResponse<V>) => Promise<V>;
  hideConfirm: () => Promise<void> | void;
  network?: NetworkJson | null;
  onFail: (error: string, extrinsicHash?: string) => void;
  onSuccess: (extrinsicHash: string) => void;
  params: T;
  message: string;
}

const Wrapper = styled.div`
  padding-left: 15px;
  padding-right: 15px;
  display: flex;
  flex-direction: column;
  flex: 1;
`;

const ExternalContainer = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  margin: -15px -15px 0;
`;

const SigningRequest = <T extends BaseRequestSign, V extends BasicTxResponse>({ account,
  balanceError,
  children,
  handleSignLedger,
  handleSignPassword,
  handleSignQr,
  hideConfirm,
  message,
  network,
  onFail,
  onSuccess,
  params }: Props<T, V>) => {
  const { cleanSigningState, onErrors, setBusy, setPasswordError, signingState } = useContext(SigningContext);
  const { cleanQrState, updateQrState } = useContext(QrSignerContext);
  const { cleanExternalState, updateExternalState } = useContext(ExternalRequestContext);

  const { isBusy } = signingState;

  const signMode = useGetSignMode(account);

  /// Handle response

  // Base

  const handleCallbackResponseResult = useCallback((data: V) => {
    if (data.passwordError) {
      setPasswordError(!!data.passwordError);
      onErrors([data.passwordError]);
      cleanQrState();
      cleanExternalState();

      return;
    }

    if (balanceError && !data.passwordError) {
      setBusy(false);
      onErrors(['Your balance is too low to cover fees']);
      onFail('Your balance is too low to cover fees');
      cleanQrState();
      cleanExternalState();

      return;
    }

    if (data.txError && data.status === undefined) {
      setBusy(false);
      onErrors(['Encountered an error, please try again.']);
      onFail('Encountered an error, please try again.', data.extrinsicHash);
      cleanQrState();
      cleanExternalState();

      return;
    }

    if (data.status !== undefined) {
      setBusy(false);

      if (data.status) {
        onSuccess(data.extrinsicHash as string);
      } else {
        onFail('Error submitting transaction', data.extrinsicHash);
      }

      cleanQrState();
      cleanExternalState();
    }
  }, [balanceError, cleanExternalState, cleanQrState, onErrors, onFail, onSuccess, setBusy, setPasswordError]);

  // Error

  const handleResponseError = useCallback((response: V) => {
    const errorMessage = response.errors?.map((err) => err.message);

    onErrors(errorMessage || []);

    if (errorMessage && errorMessage.length) {
      setBusy(false);
    }
  }, [onErrors, setBusy]);

  const catchError = useCallback((error: unknown) => {
    console.log(message, error);
    setBusy(false);
  }, [message, setBusy]);

  // Qr

  const handleCallbackResponseResultQr = useCallback((data: V) => {
    if (data.qrState) {
      const state: QrContextState = {
        ...data.qrState,
        step: QrStep.DISPLAY_PAYLOAD
      };

      setBusy(false);
      updateQrState(state);
    }

    if (data.externalState) {
      updateExternalState(data.externalState);
    }

    if (data.isBusy) {
      updateQrState({ step: QrStep.SENDING_TX });
      setBusy(true);
    }

    handleCallbackResponseResult(data);
  }, [handleCallbackResponseResult, setBusy, updateExternalState, updateQrState]);

  // Ledger

  const handleCallbackResponseResultLedger = useCallback((handlerSignLedger: (ledgerState: LedgerState) => void, data: V) => {
    if (data.ledgerState) {
      handlerSignLedger(data.ledgerState);
    }

    if (data.externalState) {
      updateExternalState(data.externalState);
    }

    handleCallbackResponseResult(data);
  }, [handleCallbackResponseResult, updateExternalState]);

  /// Submit

  // Password

  const onSendPassword = useCallback(async (password: string) => {
    handleSignPassword && await handleSignPassword({ ...params, password: password }, handleCallbackResponseResult)
      .then(handleResponseError)
      .catch(catchError);
  }, [handleSignPassword, params, handleCallbackResponseResult, handleResponseError, catchError]);

  const onSubmitPassword = useCallback((password: string) => {
    setBusy(true);

    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    setTimeout(() => {
      // eslint-disable-next-line no-void
      void onSendPassword(password);
    }, 100);
  }, [setBusy, onSendPassword]);

  // Qr

  const onSendQr = useCallback(() => {
    handleSignQr && handleSignQr(params, handleCallbackResponseResultQr)
      .then(handleResponseError)
      .catch(catchError);
  }, [handleSignQr, params, handleCallbackResponseResultQr, handleResponseError, catchError]);

  const onSubmitQr = useCallback(() => {
    setBusy(true);

    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    setTimeout(() => {
      onSendQr();
    }, 100);
  }, [onSendQr, setBusy]);

  // Ledger

  const handleSendLedger = useCallback((onSignLedger: (ledgerState: LedgerState) => void) => {
    const callback = (data: V) => {
      handleCallbackResponseResultLedger(onSignLedger, data);
    };

    handleSignLedger && handleSignLedger(params, callback)
      .then(handleResponseError)
      .catch(catchError);
  }, [handleSignLedger, params, handleResponseError, catchError, handleCallbackResponseResultLedger]);

  const onSubmitLedger = useCallback((handlerSignLedger: (ledgerState: LedgerState) => void) => {
    if (isBusy) {
      return;
    }

    setBusy(true);

    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    setTimeout(() => {
      const func = () => {
        handleSendLedger(handlerSignLedger);
      };

      func();
    }, 100);
  }, [handleSendLedger, isBusy, setBusy]);

  const renderContent = useCallback(() => {
    switch (signMode) {
      case SIGN_MODE.QR:
        if (network && handleSignQr) {
          return (
            <Wrapper>
              <ExternalContainer>
                <QrRequest
                  genesisHash={network.genesisHash}
                  handlerStart={onSubmitQr}
                >
                  { children }
                </QrRequest>
              </ExternalContainer>
            </Wrapper>
          );
        } else {
          break;
        }

      case SIGN_MODE.LEDGER:
        if (network && handleSignLedger) {
          return (
            <Wrapper>
              <ExternalContainer>
                <LedgerRequest
                  account={account}
                  genesisHash={network.genesisHash}
                  handlerSignLedger={onSubmitLedger}
                >
                  { children }
                </LedgerRequest>
              </ExternalContainer>
            </Wrapper>
          );
        } else {
          break;
        }

      case SIGN_MODE.PASSWORD:
        if (handleSignPassword) {
          return (
            <PasswordRequest
              handlerStart={onSubmitPassword}
              hideConfirm={hideConfirm}
            >
              { children }
            </PasswordRequest>
          );
        } else {
          break;
        }
    }

    return (
      <UnknownRequest
        hideConfirm={hideConfirm}
      >
        { children }
      </UnknownRequest>
    );
  }, [account, children, handleSignLedger, handleSignPassword, handleSignQr, hideConfirm, network, onSubmitLedger, onSubmitPassword, onSubmitQr, signMode]);

  useEffect(() => {
    cleanSigningState();

    return () => {
      cleanSigningState();
    };
  }, [cleanSigningState]);

  return renderContent();
};

export default SigningRequest;
