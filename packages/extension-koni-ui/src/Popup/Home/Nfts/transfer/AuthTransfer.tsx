// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { RequestNftForceUpdate, ResponseNftTransferQr, TransferNftError } from '@subwallet/extension-base/background/KoniTypes';
import { AccountJson } from '@subwallet/extension-base/background/types';
import { LoadingContainer, Spinner, Warning } from '@subwallet/extension-koni-ui/components';
import Button from '@subwallet/extension-koni-ui/components/Button';
import InputAddress from '@subwallet/extension-koni-ui/components/InputAddress';
import Modal from '@subwallet/extension-koni-ui/components/Modal';
import DisplayPayload from '@subwallet/extension-koni-ui/components/Qr/DisplayPayload';
import { QrContext, QrContextState, QrStep } from '@subwallet/extension-koni-ui/contexts/QrContext';
import useToast from '@subwallet/extension-koni-ui/hooks/useToast';
import useTranslation from '@subwallet/extension-koni-ui/hooks/useTranslation';
import { evmNftSubmitTransaction, getAccountMeta, makeTransferNftQrEvm, makeTransferNftQrSubstrate, nftForceUpdate, rejectExternalRequest, resolveExternalRequest, substrateNftSubmitTransaction } from '@subwallet/extension-koni-ui/messaging';
import { _NftItem, SubstrateTransferParams, Web3TransferParams } from '@subwallet/extension-koni-ui/Popup/Home/Nfts/types';
import Address from '@subwallet/extension-koni-ui/Popup/Sending/parts/Address';
import { RootState } from '@subwallet/extension-koni-ui/stores';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import { KeyringPair$Meta } from '@polkadot/keyring/types';
import { QrScanSignature } from '@polkadot/react-qr';
import { SignerResult } from '@polkadot/types/types';
import { hexToU8a, isHex } from '@polkadot/util';

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

interface SigData {
  signature: string;
}

let id = 1;

function AuthTransfer ({ chain, className, collectionId, nftItem, recipientAddress, senderAccount, setExtrinsicHash, setIsTxSuccess, setShowConfirm, setShowResult, setTxError, substrateTransferParams, web3TransferParams }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();

  const { QrState, cleanQrState, updateQrState } = useContext(QrContext);

  const { isEthereum, isQrHashed, qrAddress, qrId, qrPayload, step } = QrState;

  const [errorArr, setErrorArr] = useState<string[]>([]);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  // const [callHash, setCallHash] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [senderInfoSubstrate, setSenderInfoSubstrate] = useState<AddressProxy>(() => ({ isUnlockCached: false, signAddress: senderAccount.address, signPassword: '' }));
  const [accountMeta, setAccountMeta] = useState<KeyringPair$Meta>({});

  const isQr = useMemo((): boolean => {
    if (accountMeta.isExternal !== undefined) {
      return !!accountMeta.isExternal;
    } else {
      return false;
    }
  }, [accountMeta.isExternal]);

  const substrateParams = substrateTransferParams !== null ? substrateTransferParams.params : null;
  const substrateGas = substrateTransferParams !== null ? substrateTransferParams.estimatedFee : null;
  const substrateBalanceError = substrateTransferParams !== null ? substrateTransferParams.balanceError : false;

  const web3Tx = web3TransferParams !== null ? web3TransferParams.rawTx : null;
  const web3Gas = web3TransferParams !== null ? web3TransferParams.estimatedGas : null;
  const web3BalanceError = web3TransferParams !== null ? web3TransferParams.balanceError : false;

  const [balanceError] = useState(substrateTransferParams !== null ? substrateBalanceError : web3BalanceError);
  const { currentAccount: account, currentNetwork } = useSelector((state: RootState) => state);

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

  const handlerCallbackResponseResult = useCallback((data: ResponseNftTransferQr) => {
    if (data.qrState) {
      const state: QrContextState = {
        ...data.qrState,
        step: QrStep.DISPLAY_PAYLOAD
      };

      updateQrState(state);
    }

    if (data.isBusy) {
      updateQrState({ step: QrStep.SENDING_TX });
      setLoading(true);
    }

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

    if (data.txError && data.txError) {
      setErrorArr(['Encountered an error, please try again.']);
      setLoading(false);
      setIsTxSuccess(false);
      setTxError('Encountered an error, please try again.');
      setShowConfirm(false);
      setShowResult(true);
      cleanQrState();

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
    }
  }, [balanceError, chain, cleanQrState, collectionId, nftItem, setExtrinsicHash, setIsTxSuccess, setShowConfirm, setShowResult, setTxError, updateQrState]);

  const handlerResponseError = useCallback((errors: TransferNftError[]) => {
    const errorMessage = errors.map((err) => err.message);

    setErrorArr(errorMessage);

    if (errorMessage && errorMessage.length) {
      setLoading(false);
    }
  }, []);

  const handlerSendQrSubstrate = useCallback(() => {
    makeTransferNftQrSubstrate({
      recipientAddress: recipientAddress,
      senderAddress: senderAccount.address,
      params: substrateParams
    }, handlerCallbackResponseResult)
      .then(handlerResponseError)
      .catch((e) => console.log('There is problem when makeTransferNftQrSubstrate', e));
  }, [handlerCallbackResponseResult, handlerResponseError, recipientAddress, senderAccount.address, substrateParams]);

  const handlerSendQrEvm = useCallback(() => {
    if (web3Tx) {
      makeTransferNftQrEvm({
        senderAddress: account?.account?.address as string,
        recipientAddress,
        networkKey: chain,
        rawTransaction: web3Tx
      }, handlerCallbackResponseResult)
        .then(handlerResponseError)
        .catch((e) => console.log('There is problem when makeTransferNftQrEvm', e));
    }
  }, [account?.account?.address, chain, handlerCallbackResponseResult, handlerResponseError, recipientAddress, web3Tx]);

  const handlerSendQr = useCallback(() => {
    if (substrateParams !== null) {
      handlerSendQrSubstrate();
    } else if (web3Tx !== null) {
      handlerSendQrEvm();
    }
  }, [handlerSendQrEvm, handlerSendQrSubstrate, substrateParams, web3Tx]);

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

  const handlerReject = useCallback(async () => {
    if (qrId) {
      await rejectExternalRequest({ id: qrId });
    }

    cleanQrState();
  }, [cleanQrState, qrId]);

  const handlerResolve = useCallback(async (result: SignerResult) => {
    if (qrId) {
      await resolveExternalRequest({ id: qrId, data: result });
    }
  }, [qrId]);

  const hideConfirm = useCallback(async () => {
    if (!loading) {
      await handlerReject();
      setShowConfirm(false);
    }
  }, [handlerReject, loading, setShowConfirm]);

  const handlerScanSignature = useCallback(async (data: SigData): Promise<void> => {
    if (isHex(data.signature)) {
      await handlerResolve({
        signature: data.signature,
        id: id++
      });
    }
  }, [handlerResolve]);

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

  const handlerChangeToScan = useCallback(() => {
    updateQrState({ step: QrStep.SCAN_QR });
  }, [updateQrState]);

  const handlerChangeToDisplayQr = useCallback(() => {
    updateQrState({ step: QrStep.DISPLAY_PAYLOAD });
  }, [updateQrState]);

  const handlerRenderContent = useCallback(() => {
    if (!isQr) {
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
                    genesisHash={currentNetwork.genesisHash}
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
            <div
              className={'auth-container'}
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
              <div className='auth-transaction__separator' />
              { renderError() }
              <div
                className={'submit-btn'}
                onClick={handlerCreateQr}
                style={{ marginTop: '40px', background: loading ? 'rgba(0, 75, 255, 0.25)' : '#004BFF', cursor: loading ? 'default' : 'pointer' }}
              >
                {
                  !loading
                    ? t('Sign via qr')
                    : <Spinner className={'spinner-loading'} />
                }
              </div>
            </div>
          );
      }
    }
  }, [currentNetwork.genesisHash, currentNetwork.networkPrefix, handleSignAndSubmit, handlerChangeToDisplayQr, handlerChangeToScan, handlerCreateQr, handlerScanSignature, isEthereum, isQr, isQrHashed, loading, passwordError, qrAddress, qrPayload, renderError, senderAccount.address, step, substrateGas, t, web3Gas]);

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
            // eslint-disable-next-line @typescript-eslint/no-misused-promises
            onClick={hideConfirm}
          >
            x
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
    font-size: 20px;
    cursor: pointer;
  }

  .header-title-confirm {
    width: 85%;
    text-align: center;
  }
`));
