// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { RequestNftForceUpdate } from '@subwallet/extension-base/background/KoniTypes';
import { AccountJson } from '@subwallet/extension-base/background/types';
import { Spinner } from '@subwallet/extension-koni-ui/components';
import Modal from '@subwallet/extension-koni-ui/components/Modal';
import Output from '@subwallet/extension-koni-ui/components/Output';
import useToast from '@subwallet/extension-koni-ui/hooks/useToast';
import { evmNftSubmitTransaction, nftForceUpdate, substrateNftSubmitTransaction } from '@subwallet/extension-koni-ui/messaging';
import { _NftItem, SubstrateTransferParams, Web3TransferParams } from '@subwallet/extension-koni-ui/Popup/Home/Nfts/types';
import Address from '@subwallet/extension-koni-ui/Popup/Sending/parts/Address';
import { RootState } from '@subwallet/extension-koni-ui/stores';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import React, { useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

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
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [callHash, setCallHash] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [senderInfoSubstrate, setSenderInfoSubstrate] = useState<AddressProxy>(() => ({ isUnlockCached: false, signAddress: senderAccount.address, signPassword: '' }));

  const substrateParams = substrateTransferParams !== null ? substrateTransferParams.params : null;
  const substrateGas = substrateTransferParams !== null ? substrateTransferParams.estimatedFee : null;
  const substrateBalanceError = substrateTransferParams !== null ? substrateTransferParams.balanceError : false;

  const web3Tx = web3TransferParams !== null ? web3TransferParams.rawTx : null;
  const web3Gas = web3TransferParams !== null ? web3TransferParams.estimatedGas : null;

  const [balanceError, setBalanceError] = useState(substrateBalanceError);
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

        if (data.callHash) {
          setCallHash(data.callHash);
        }

        if (data.balanceError && data.balanceError) {
          setBalanceError(true);
          setLoading(false);
          show('Your balance is too low to cover fees');
        }

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
  }, [account?.account?.address, chain, collectionId, nftItem, recipientAddress, senderInfoSubstrate.signPassword, setExtrinsicHash, setIsTxSuccess, setShowConfirm, setShowResult, setTxError, show, web3Tx]);

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

      if (data.callHash) {
        setCallHash(data.callHash);
      }

      if (data.txError && data.txError) {
        show('Encountered an error, please try again.');
        setLoading(false);

        return;
      }

      if (data.balanceError && data.balanceError) {
        setBalanceError(true);
        show('Your balance is too low to cover fees');
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
  }, [chain, collectionId, nftItem, substrateParams, recipientAddress, senderAccount.address, senderInfoSubstrate.signPassword, setExtrinsicHash, setIsTxSuccess, setShowConfirm, setShowResult, setTxError, show]);

  const handleSignAndSubmit = useCallback(() => {
    if (loading) {
      return;
    }

    if (chain !== currentNetwork.networkKey) {
      show('Incorrect network');

      return;
    }

    setLoading(true);

    if (balanceError) {
      setTimeout(() => {
        setLoading(false);
        show('Your balance is too low to cover fees');
      }, 1000);

      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    setTimeout(async () => {
      if (substrateParams !== null) {
        await onSendSubstrate();
      } else if (web3Tx !== null) {
        await onSendEvm();
      }
    }, 1);
  }, [loading, balanceError, chain, currentNetwork.networkKey, show, substrateParams, web3Tx, onSendSubstrate, onSendEvm]);

  const hideConfirm = useCallback(() => {
    if (!loading) {
      setShowConfirm(false);
    }
  }, [loading, setShowConfirm]);

  return (
    <div className={className}>
      <Modal>
        <div>
          <div className={'header-confirm'}>
            <div />
            <div
              className={'header-title-confirm'}
            >
              Authorize transaction
            </div>
            <div
              className={'close-button-confirm'}
              onClick={hideConfirm}
            >
              x
            </div>
          </div>

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

            {
              callHash &&
              <Output
                className={'call-hash-container'}
                isDisabled
                isTrimmed
                label={'Call hash'}
                value={callHash}
                withCopy
              />
            }

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
        </div>
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
