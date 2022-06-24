// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { RequestNftForceUpdate, ResponseNftTransferExternal, ResponseNftTransferLedger, ResponseNftTransferQr, TransferNftError } from '@subwallet/extension-base/background/KoniTypes';
import { AccountJson } from '@subwallet/extension-base/background/types';
import { LedgerState } from '@subwallet/extension-base/signers/types';
import { Spinner } from '@subwallet/extension-koni-ui/components';
import InputAddress from '@subwallet/extension-koni-ui/components/InputAddress';
import LedgerRequest from '@subwallet/extension-koni-ui/components/Ledger/LedgerRequest';
import Modal from '@subwallet/extension-koni-ui/components/Modal';
import QrRequest from '@subwallet/extension-koni-ui/components/Qr/QrRequest';
import { MANUAL_CANCEL_EXTERNAL_REQUEST, SIGN_MODE } from '@subwallet/extension-koni-ui/constants/signing';
import { ExternalRequestContext } from '@subwallet/extension-koni-ui/contexts/ExternalRequestContext';
import { QrContext, QrContextState, QrStep } from '@subwallet/extension-koni-ui/contexts/QrContext';
import useToast from '@subwallet/extension-koni-ui/hooks/useToast';
import useTranslation from '@subwallet/extension-koni-ui/hooks/useTranslation';
import { evmNftSubmitTransaction, getAccountMeta, makeTransferNftLedgerSubstrate, makeTransferNftQrEvm, makeTransferNftQrSubstrate, nftForceUpdate, rejectExternalRequest, substrateNftSubmitTransaction } from '@subwallet/extension-koni-ui/messaging';
import { _NftItem, SubstrateTransferParams, Web3TransferParams } from '@subwallet/extension-koni-ui/Popup/Home/Nfts/types';
import Address from '@subwallet/extension-koni-ui/Popup/Sending/parts/Address';
import { RootState } from '@subwallet/extension-koni-ui/stores';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import { KeyringPair$Meta } from '@polkadot/keyring/types';

interface AddressProxy {
  isUnlockCached: boolean;
  signAddress: string | null;
  signPassword: string;
}

interface Props extends ThemeProps {
  className?: string;
  setShowConfirm: (val: boolean) => void;
  senderAccount: AccountJson;
  substrateTransferParams: SubstrateTransferParams;
  setShowResult: (val: boolean) => void;
  setExtrinsicHash: (val: string) => void;
  setIsTxSuccess: (val: boolean) => void;
  setTxError: (val: string) => void;
  nftItem: _NftItem;
  collectionId: string;
  recipientAddress: string;
  chain: string;
  web3TransferParams: Web3TransferParams;
}

function AuthTransfer ({ chain, className, collectionId, nftItem, recipientAddress, senderAccount, setExtrinsicHash, setIsTxSuccess, setShowConfirm, setShowResult, setTxError, substrateTransferParams, web3TransferParams }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();

  const { cleanQrState, updateQrState } = useContext(QrContext);
  const { clearExternalState, externalState, updateExternalState } = useContext(ExternalRequestContext);

  const { externalId } = externalState;

  const [errorArr, setErrorArr] = useState<string[]>([]);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  // const [callHash, setCallHash] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [senderInfoSubstrate, setSenderInfoSubstrate] = useState<AddressProxy>(() => ({ isUnlockCached: false, signAddress: senderAccount.address, signPassword: '' }));
  const [accountMeta, setAccountMeta] = useState<KeyringPair$Meta>({});

  const signMode = useMemo((): SIGN_MODE => {
    if (accountMeta.isExternal && !!accountMeta.isExternal) {
      if (accountMeta.isHardware && !!accountMeta.isHardware) {
        return SIGN_MODE.LEDGER;
      }

      return SIGN_MODE.QR;
    }

    return SIGN_MODE.PASSWORD;
  }, [accountMeta]);

  const substrateParams = substrateTransferParams !== null ? substrateTransferParams.params : null;
  const substrateGas = substrateTransferParams !== null ? substrateTransferParams.estimatedFee : null;
  const substrateBalanceError = substrateTransferParams !== null ? substrateTransferParams.balanceError : false;

  const web3Tx = web3TransferParams !== null ? web3TransferParams.rawTx : null;
  const web3Gas = web3TransferParams !== null ? web3TransferParams.estimatedGas : null;
  const web3BalanceError = web3TransferParams !== null ? web3TransferParams.balanceError : false;

  const [balanceError] = useState(substrateTransferParams !== null ? substrateBalanceError : web3BalanceError);
  const { currentAccount: account, currentNetwork } = useSelector((state: RootState) => state);

  const genesisHash = currentNetwork.genesisHash;

  const { show } = useToast();

  useEffect((): void => {
    setPasswordError(null);
  }, [senderInfoSubstrate]);

  const onSendEvm = useCallback(async () => {
    if (web3Tx) {
      await evmNftSubmitTransaction({
        senderAddress: account?.account?.address as string,
        recipientAddress,
        password: senderInfoSubstrate.signPassword,
        networkKey: chain,
        rawTransaction: web3Tx
      }, (data) => {
        if (data.passwordError) {
          setPasswordError(data.passwordError);
          setLoading(false);
        }

        if (balanceError && !data.passwordError) {
          setLoading(false);
          show('Your balance is too low to cover fees');

          return;
        }

        // if (data.callHash) {
        //   setCallHash(data.callHash);
        // }

        if (data.txError) {
          show('Encountered an error, please try again.');
          setLoading(false);

          return;
        }

        if (data.status) {
          setLoading(false);

          if (data.status) {
            setIsTxSuccess(true);
            setShowConfirm(false);
            setShowResult(true);
            setExtrinsicHash(data.transactionHash as string);
            nftForceUpdate({ nft: nftItem, collectionId, isSendingSelf: data.isSendingSelf, chain } as RequestNftForceUpdate)
              .catch(console.error);
          } else {
            setIsTxSuccess(false);
            setTxError('Error submitting transaction');
            setShowConfirm(false);
            setShowResult(true);
            setExtrinsicHash(data.transactionHash as string);
          }
        }
      });
    } else {
      show('Encountered an error, please try again.');
    }
  }, [account?.account?.address, balanceError, chain, collectionId, nftItem, recipientAddress, senderInfoSubstrate.signPassword, setExtrinsicHash, setIsTxSuccess, setShowConfirm, setShowResult, setTxError, show, web3Tx]);

  const onSendSubstrate = useCallback(async () => {
    await substrateNftSubmitTransaction({
      params: substrateParams,
      password: senderInfoSubstrate.signPassword,
      senderAddress: senderAccount.address,
      recipientAddress
    }, (data) => {
      if (data.passwordError && data.passwordError) {
        setPasswordError(data.passwordError);
        setLoading(false);
      }

      if (balanceError && !data.passwordError) {
        setLoading(false);
        show('Your balance is too low to cover fees');

        return;
      }

      // if (data.callHash) {
      //   setCallHash(data.callHash);
      // }

      if (data.txError && data.txError) {
        show('Encountered an error, please try again.');
        setLoading(false);

        return;
      }

      if (data.status) {
        setLoading(false);

        if (data.status) {
          setIsTxSuccess(true);
          setShowConfirm(false);
          setShowResult(true);
          setExtrinsicHash(data.transactionHash as string);
          nftForceUpdate({ nft: nftItem, collectionId, isSendingSelf: data.isSendingSelf, chain } as RequestNftForceUpdate)
            .catch(console.error);
        } else {
          setIsTxSuccess(false);
          setTxError('Error submitting transaction');
          setShowConfirm(false);
          setShowResult(true);
          setExtrinsicHash(data.transactionHash as string);
        }
      }
    });
  }, [substrateParams, senderInfoSubstrate.signPassword, senderAccount.address, recipientAddress, balanceError, show, setIsTxSuccess, setShowConfirm, setShowResult, setExtrinsicHash, nftItem, collectionId, chain, setTxError]);

  const handlerCallbackResponseResult = useCallback((data: ResponseNftTransferExternal) => {
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
        nftForceUpdate({ nft: nftItem, collectionId, isSendingSelf: data.isSendingSelf, chain } as RequestNftForceUpdate)
          .catch(console.error);
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
  }, [balanceError, chain, cleanQrState, clearExternalState, collectionId, nftItem, setExtrinsicHash, setIsTxSuccess, setShowConfirm, setShowResult, setTxError]);

  const handlerCallbackResponseResultQr = useCallback((data: ResponseNftTransferQr) => {
    if (data.qrState) {
      const state: QrContextState = {
        ...data.qrState,
        step: QrStep.DISPLAY_PAYLOAD
      };

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

  const handlerResponseError = useCallback((errors: TransferNftError[]) => {
    const errorMessage = errors.map((err) => err.message);

    setErrorArr(errorMessage);

    if (errorMessage && errorMessage.length) {
      setLoading(false);
    }
  }, []);

  const handlerSendSubstrateQr = useCallback(() => {
    makeTransferNftQrSubstrate({
      recipientAddress: recipientAddress,
      senderAddress: senderAccount.address,
      params: substrateParams
    }, handlerCallbackResponseResultQr)
      .then(handlerResponseError)
      .catch((e) => console.log('There is problem when makeTransferNftQrSubstrate', e));
  }, [handlerCallbackResponseResultQr, handlerResponseError, recipientAddress, senderAccount.address, substrateParams]);

  const handlerSendEvmQr = useCallback(() => {
    if (web3Tx) {
      makeTransferNftQrEvm({
        senderAddress: account?.account?.address as string,
        recipientAddress,
        networkKey: chain,
        rawTransaction: web3Tx
      }, handlerCallbackResponseResultQr)
        .then(handlerResponseError)
        .catch((e) => console.log('There is problem when makeTransferNftQrEvm', e));
    }
  }, [account?.account?.address, chain, handlerCallbackResponseResultQr, handlerResponseError, recipientAddress, web3Tx]);

  const handlerSendQr = useCallback(() => {
    if (substrateParams !== null) {
      handlerSendSubstrateQr();
    } else if (web3Tx !== null) {
      handlerSendEvmQr();
    }
  }, [handlerSendEvmQr, handlerSendSubstrateQr, substrateParams, web3Tx]);

  const handlerCallbackResponseResultLedger = useCallback((handlerSignLedger: (ledgerState: LedgerState) => void, data: ResponseNftTransferLedger) => {
    if (data.ledgerState) {
      handlerSignLedger(data.ledgerState);
    }

    if (data.externalState) {
      updateExternalState(data.externalState);
    }

    handlerCallbackResponseResult(data);
  }, [handlerCallbackResponseResult, updateExternalState]);

  const handlerSendLedgerSubstrate = useCallback((handlerSignLedger: (ledgerState: LedgerState) => void) => {
    const callback = (data: ResponseNftTransferLedger) => {
      handlerCallbackResponseResultLedger(handlerSignLedger, data);
    };

    makeTransferNftLedgerSubstrate({
      recipientAddress: recipientAddress,
      senderAddress: senderAccount.address,
      params: substrateParams
    }, callback)
      .then(handlerResponseError)
      .catch((e) => console.log('There is problem when makeTransferNftQrSubstrate', e));
  }, [handlerCallbackResponseResultLedger, handlerResponseError, recipientAddress, senderAccount.address, substrateParams]);

  const handlerSendLedger = useCallback((handlerSignLedger: (ledgerState: LedgerState) => void) => {
    if (loading) {
      return;
    }

    if (chain !== currentNetwork.networkKey) {
      setErrorArr(['Incorrect network']);

      return;
    }

    setLoading(true);

    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    setTimeout(() => {
      if (substrateParams !== null) {
        const sendSubstrate = () => {
          handlerSendLedgerSubstrate(handlerSignLedger);
        };

        sendSubstrate();
      } else if (web3Tx !== null) {
        setErrorArr(['We don\'t support transfer NFT with ledger at the moment']);
        setLoading(false);
      }
    }, 10);
  }, [chain, currentNetwork.networkKey, handlerSendLedgerSubstrate, loading, substrateParams, web3Tx]);

  const handleSignAndSubmit = useCallback(() => {
    if (loading) {
      return;
    }

    if (chain !== currentNetwork.networkKey) {
      show('Incorrect network');

      return;
    }

    setLoading(true);

    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    setTimeout(async () => {
      if (substrateParams !== null) {
        await onSendSubstrate();
      } else if (web3Tx !== null) {
        await onSendEvm();
      }
    }, 10);
  }, [loading, chain, currentNetwork.networkKey, show, substrateParams, web3Tx, onSendSubstrate, onSendEvm]);

  const handlerCreateQr = useCallback(() => {
    if (loading) {
      return;
    }

    if (chain !== currentNetwork.networkKey) {
      setErrorArr(['Incorrect network']);

      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    setTimeout(() => {
      handlerSendQr();
    }, 10);
  }, [loading, chain, currentNetwork.networkKey, handlerSendQr]);

  const handlerReject = useCallback(async (externalId: string) => {
    if (externalId) {
      await rejectExternalRequest({ id: externalId, message: MANUAL_CANCEL_EXTERNAL_REQUEST });
    }

    cleanQrState();
    clearExternalState();
  }, [cleanQrState, clearExternalState]);

  const hideConfirm = useCallback(async () => {
    if (!loading) {
      if (externalId) {
        await handlerReject(externalId);
      }

      setShowConfirm(false);
    }
  }, [externalId, handlerReject, loading, setShowConfirm]);

  const handlerRenderContent = useCallback(() => {
    switch (signMode) {
      case SIGN_MODE.QR:
        return (
          <QrRequest
            errorArr={errorArr}
            genesisHash={genesisHash}
            handlerStart={handlerCreateQr}
            isBusy={loading}
          >
            <div className={'fee'}>Fees of {substrateGas || web3Gas} will be applied to the submission</div>
            <InputAddress
              className={'sender-container'}
              defaultValue={senderAccount.address}
              help={t<string>('The account you will send NFT from.')}
              isDisabled={true}
              isSetDefaultValue={true}
              label={t<string>('Send from account')}
              networkPrefix={currentNetwork.networkPrefix}
              type='account'
              withEllipsis
            />
          </QrRequest>
        );
      case SIGN_MODE.LEDGER:
        return (
          <LedgerRequest
            accountMeta={accountMeta}
            errorArr={errorArr}
            genesisHash={genesisHash}
            handlerSignLedger={handlerSendLedger}
            isBusy={loading}
            setBusy={setLoading}
            setErrorArr={setErrorArr}
          >
            <div className={'fee'}>Fees of {substrateGas || web3Gas} will be applied to the submission</div>
            <InputAddress
              className={'sender-container'}
              defaultValue={senderAccount.address}
              help={t<string>('The account you will send NFT from.')}
              isDisabled={true}
              isSetDefaultValue={true}
              label={t<string>('Send from account')}
              networkPrefix={currentNetwork.networkPrefix}
              type='account'
              withEllipsis
            />
          </LedgerRequest>
        );
      case SIGN_MODE.PASSWORD:
      default:
        return (
          <div
            className={'auth-container'}
          >
            <div className={'fee'}>Fees of {substrateGas || web3Gas} will be applied to the submission</div>

            <Address
              className={'sender-container'}
              onChange={setSenderInfoSubstrate}
              onEnter={handleSignAndSubmit}
              passwordError={passwordError}
              requestAddress={senderAccount.address}
            />

            <div
              className={'submit-btn'}
              // eslint-disable-next-line @typescript-eslint/no-misused-promises
              onClick={handleSignAndSubmit}
              style={{ marginTop: '40px', background: loading ? 'rgba(0, 75, 255, 0.25)' : '#004BFF', cursor: loading ? 'default' : 'pointer' }}
            >
              {
                !loading
                  ? 'Sign and Submit'
                  : <Spinner className={'spinner-loading'} />
              }
            </div>
          </div>
        );
    }
  }, [
    accountMeta,
    currentNetwork.networkPrefix,
    errorArr,
    genesisHash,
    handleSignAndSubmit,
    handlerCreateQr,
    handlerSendLedger,
    loading,
    passwordError,
    senderAccount.address,
    signMode,
    substrateGas,
    t,
    web3Gas
  ]);

  useEffect(() => {
    let unmount = false;

    const handler = async () => {
      const { meta } = await getAccountMeta({ address: senderAccount.address });

      if (!unmount) {
        setAccountMeta(meta);
      }
    };

    // eslint-disable-next-line no-void
    void handler();

    return () => {
      unmount = true;
    };
  }, [senderAccount.address]);

  return (
    <div className={className}>
      <Modal>
        <div className={'header-confirm'}>
          <div
            className={'header-title-confirm'}
          >
            Authorize transaction
          </div>
          <div
            className={'close-button-confirm'}
            //eslint-disable-next-line @typescript-eslint/no-misused-promises
            onClick={hideConfirm}
          >
            Cancel
          </div>
        </div>

        { handlerRenderContent() }
      </Modal>
    </div>
  );
}

export default React.memo(styled(AuthTransfer)(({ theme }: Props) => `
  .auth-container {
    padding-left: 15px;
    padding-right: 15px;
    padding-bottom: 15px;
    padding-top: 10px;
  }

  .auth-transaction-body {
    flex: 1;
    padding-left: 15px;
    padding-right: 15px;
    padding-bottom: 15px;
    padding-top: 25px;
    overflow-y: auto;
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

  .auth-transaction__separator + .auth-transaction__info {
    margin-top: 10px;
  }

  .sender-container {
    .input-address__dropdown {
      border: 0;
      height: auto;
    }
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

  .spinner-loading {
    position: relative;
    height: 26px;
    width: 26px;
    opacity: 1;
  }

  .password-error {
    font-size: 12px;
    color: red;
    text-transform: uppercase;
  }

  .submit-btn {
    position: relative;
    border-radius: 8px;
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 10px;
    color: #FFFFFF;
    cursor: pointer;
  }

  .call-hash-container {
    margin-top: 20px;
  }

  .sender-container {
    margin-top: 20px;
  }

  .fee {
    font-size: 16px;
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

  .close-button-confirm {
    text-align: right;
    font-size: 14px;
    cursor: pointer;
    color: ${theme.textColor3};
    position: absolute;
    right: 15px;
  }

  .header-alignment {
    width: 20%;
  }

  .header-title-confirm {
    width: 100%;
    text-align: center;
  }
`));
