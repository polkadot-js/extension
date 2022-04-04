// Copyright 2019-2022 @polkadot/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React, { useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';
import Web3 from 'web3';

import { BackgroundWindow, RequestNftForceUpdate } from '@polkadot/extension-base/background/KoniTypes';
import { AccountJson } from '@polkadot/extension-base/background/types';
import NETWORKS, { EVM_NETWORKS } from '@polkadot/extension-koni-base/api/endpoints';
import { reformatAddress } from '@polkadot/extension-koni-base/utils/utils';
import { Spinner } from '@polkadot/extension-koni-ui/components';
import Modal from '@polkadot/extension-koni-ui/components/Modal';
import Output from '@polkadot/extension-koni-ui/components/Output';
import useToast from '@polkadot/extension-koni-ui/hooks/useToast';
import { exportAccountPrivateKey, nftForceUpdate } from '@polkadot/extension-koni-ui/messaging';
import { _NftItem, SubstrateTransferParams, Web3TransferParams } from '@polkadot/extension-koni-ui/Popup/Home/Nfts/types';
import Address from '@polkadot/extension-koni-ui/Popup/Sending/old/parts/Address';
import { AddressProxy } from '@polkadot/extension-koni-ui/Popup/Sending/old/types';
import { cacheUnlock } from '@polkadot/extension-koni-ui/Popup/Sending/old/util';
import { RootState } from '@polkadot/extension-koni-ui/stores';
import { ThemeProps } from '@polkadot/extension-koni-ui/types';

const bWindow = chrome.extension.getBackgroundPage() as BackgroundWindow;
const { keyring } = bWindow.pdotApi;

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

function unlockAccount ({ isUnlockCached, signAddress, signPassword }: AddressProxy): string | null {
  let publicKey;

  try {
    publicKey = keyring.decodeAddress(signAddress as string);
  } catch (error) {
    console.error(error);

    return 'unable to decode address';
  }

  const pair = keyring.getPair(publicKey);

  try {
    pair.decodePkcs8(signPassword);
    isUnlockCached && cacheUnlock(pair);
  } catch (error) {
    console.error(error);

    return (error as Error).message;
  }

  return null;
}

function isRecipientSelf (currentAddress: string, recipientAddress: string) {
  return reformatAddress(currentAddress, 1) === reformatAddress(recipientAddress, 1);
}

function AuthTransfer ({ chain, className, collectionId, nftItem, recipientAddress, senderAccount, setExtrinsicHash, setIsTxSuccess, setShowConfirm, setShowResult, setTxError, substrateTransferParams, web3TransferParams }: Props): React.ReactElement<Props> {
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [callHash, setCallHash] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [balanceError, setBalanceError] = useState(false);
  const [senderInfoSubstrate, setSenderInfoSubstrate] = useState<AddressProxy>(() => ({ isUnlockCached: false, signAddress: senderAccount.address, signPassword: '' }));

  const extrinsic = substrateTransferParams !== null ? substrateTransferParams.extrinsic : null;
  const txInfo = substrateTransferParams !== null ? substrateTransferParams.txInfo : null;

  const web3Tx = web3TransferParams !== null ? web3TransferParams.tx : null;
  const web3Gas = web3TransferParams !== null ? web3TransferParams.estimatedGas : null;

  const { currentAccount: account } = useSelector((state: RootState) => state);

  const { show } = useToast();

  useEffect((): void => {
    setPasswordError(null);
  }, [senderInfoSubstrate]);

  const unlockSubstrate = useCallback(() => {
    let passwordError: string | null = null;

    if (senderInfoSubstrate.signAddress) {
      passwordError = unlockAccount(senderInfoSubstrate);
    }

    setPasswordError(passwordError);

    return passwordError;
  }, [senderInfoSubstrate]);

  const unlockEvm = useCallback(async (senderAddress: string, password: string): Promise<{ privateKey: string, passwordError: string | null }> => {
    try {
      const { privateKey } = await exportAccountPrivateKey(senderAddress, password);

      return {
        privateKey,
        passwordError: null
      };
    } catch (e) {
      return {
        privateKey: '',
        passwordError: 'Error unlocking account with password'
      };
    }
  }, []);

  const onSendEvm = useCallback(async () => {
    const { passwordError, privateKey } = await unlockEvm(account?.account?.address as string, senderInfoSubstrate.signPassword);
    const isSendingSelf = isRecipientSelf(account?.account?.address as string, recipientAddress);

    if (passwordError === null && web3Tx) {
      try {
        const web3 = new Web3(new Web3.providers.WebsocketProvider(EVM_NETWORKS[chain].provider));

        web3Tx.sign(Buffer.from(privateKey.slice(2), 'hex'));
        const callHash = web3Tx.serialize();

        setCallHash(callHash.toString('hex'));

        await web3.eth.sendSignedTransaction('0x' + callHash.toString('hex'))
          .then((receipt: Record<string, any>) => {
            if (receipt.status && receipt.status === true) {
              setLoading(false);
              setIsTxSuccess(true);
              setShowConfirm(false);
              setShowResult(true);
              setExtrinsicHash(receipt.transactionHash as string);
              nftForceUpdate({ nft: nftItem, collectionId, isSendingSelf, chain } as RequestNftForceUpdate)
                .catch(console.error);
            } else if (receipt.status && receipt.status === false) {
              setIsTxSuccess(false);
              setTxError('Error submitting transaction');
              setShowConfirm(false);
              setShowResult(true);
              setExtrinsicHash(receipt.transactionHash as string);
            }
          });
      } catch (e) {
        console.log(e);
        show('Encountered an error, please try again.');
        setLoading(false);
      }
    } else {
      setPasswordError(passwordError);
      setLoading(false);
    }
  }, [account?.account?.address, chain, collectionId, nftItem, recipientAddress, senderInfoSubstrate.signPassword, setExtrinsicHash, setIsTxSuccess, setShowConfirm, setShowResult, setTxError, show, unlockEvm, web3Tx]);

  const getWeb3Gas = useCallback(() => {
    if (web3Gas !== null) {
      // @ts-ignore
      const parsedFee = web3Gas / (10 ** NETWORKS[chain].decimals);

      // eslint-disable-next-line @typescript-eslint/restrict-plus-operands
      return parsedFee + ' ' + NETWORKS[chain].nativeToken;
    }

    return null;
  }, [chain, web3Gas]);

  const onSendSubstrate = useCallback(async () => {
    if (extrinsic !== null && unlockSubstrate() === null) {
      const pair = keyring.getPair(senderAccount.address);

      try {
        const isSendingSelf = isRecipientSelf(account?.account?.address as string, recipientAddress);
        const unsubscribe = await extrinsic.signAndSend(pair, (result) => {
          console.log('sending tx');

          if (!result || !result.status) {
            return;
          }

          if (result.status.isInBlock || result.status.isFinalized) {
            console.log('tx in block');
            result.events
              .filter(({ event: { section } }) => section === 'system')
              .forEach(({ event: { method } }): void => {
                setExtrinsicHash(extrinsic.hash.toHex());

                if (method === 'ExtrinsicFailed') {
                  console.log('tx fail');
                  setIsTxSuccess(false);
                  setTxError(method);
                  setShowConfirm(false);
                  setShowResult(true);
                } else if (method === 'ExtrinsicSuccess') {
                  console.log('tx success');
                  setIsTxSuccess(true);
                  setShowConfirm(false);
                  setShowResult(true);

                  nftForceUpdate({ nft: nftItem, collectionId, isSendingSelf, chain } as RequestNftForceUpdate)
                    .catch(console.error);
                }
              });
          } else if (result.isError) {
            setLoading(false);
          }

          if (result.isCompleted) {
            setLoading(false);
            unsubscribe();
          }
        });
      } catch (e) {
        show('Encountered an error, please try again.');
        setBalanceError(true);
        setLoading(false);
      }
    } else {
      console.log('unlock account failed');
      setLoading(false);
    }
  }, [account?.account?.address, chain, collectionId, extrinsic, nftItem, recipientAddress, senderAccount.address, setExtrinsicHash, setIsTxSuccess, setShowConfirm, setShowResult, setTxError, show, unlockSubstrate]);

  const handleSignAndSubmit = useCallback(() => {
    if (loading) return;

    setLoading(true);

    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    setTimeout(async () => {
      if (extrinsic !== null) {
        await onSendSubstrate();
      } else if (web3Tx !== null) {
        await onSendEvm();
      }
    }, 1);
  }, [extrinsic, loading, onSendEvm, onSendSubstrate, web3Tx]);

  useEffect((): void => {
    if (extrinsic) {
      const method = extrinsic.method;

      setCallHash((method && method.hash.toHex()) || null);
    }
  }, [extrinsic]);

  const hideConfirm = useCallback(() => {
    if (!loading) setShowConfirm(false);
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
            <div className={'fee'}>Fees of {txInfo?.partialFee.toHuman() || getWeb3Gas()} will be applied to the submission</div>

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

            {
              balanceError &&
              <div
                className={'password-error'}
                style={{ marginTop: balanceError ? '40px' : '0' }}
              >
                Your balance is too low to cover fees.
              </div>
            }

            <div
              className={'submit-btn'}
              // eslint-disable-next-line @typescript-eslint/no-misused-promises
              onClick={handleSignAndSubmit}
              style={{ marginTop: !balanceError ? '40px' : '0', background: loading ? 'rgba(0, 75, 255, 0.25)' : '#004BFF', cursor: loading ? 'default' : 'pointer' }}
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
