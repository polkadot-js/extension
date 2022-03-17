// Copyright 2019-2022 @polkadot/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React, { useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import { SubmittableExtrinsic } from '@polkadot/api/types';
import { BackgroundWindow, NftItem as _NftItem, RequestNftForceUpdate } from '@polkadot/extension-base/background/KoniTypes';
import { AccountJson } from '@polkadot/extension-base/background/types';
import { reformatAddress } from '@polkadot/extension-koni-base/utils/utils';
import { Spinner } from '@polkadot/extension-koni-ui/components';
import Modal from '@polkadot/extension-koni-ui/components/Modal';
import Output from '@polkadot/extension-koni-ui/components/Output';
import { nftForceUpdate } from '@polkadot/extension-koni-ui/messaging';
import Address from '@polkadot/extension-koni-ui/Popup/Sending/old/parts/Address';
import { AddressProxy } from '@polkadot/extension-koni-ui/Popup/Sending/old/types';
import { cacheUnlock } from '@polkadot/extension-koni-ui/Popup/Sending/old/util';
import { RootState } from '@polkadot/extension-koni-ui/stores';
import { ThemeProps } from '@polkadot/extension-koni-ui/types';
import { RuntimeDispatchInfo } from '@polkadot/types/interfaces';

const bWindow = chrome.extension.getBackgroundPage() as BackgroundWindow;
const { keyring } = bWindow.pdotApi;

interface Props extends ThemeProps {
  className?: string;
  setShowConfirm: (val: boolean) => void;
  senderAccount: AccountJson;
  txInfo?: RuntimeDispatchInfo;
  extrinsic: SubmittableExtrinsic<'promise'>;
  setShowResult: (val: boolean) => void;
  setExtrinsicHash: (val: string) => void;
  setIsTxSuccess: (val: boolean) => void;
  setTxError: (val: string) => void;
  nftItem: _NftItem;
  collectionId: string;
  recipientAddress: string;
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

function AuthTransfer ({ className, collectionId, extrinsic, nftItem, recipientAddress, senderAccount, setExtrinsicHash, setIsTxSuccess, setShowConfirm, setShowResult, setTxError, txInfo }: Props): React.ReactElement<Props> {
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [callHash, setCallHash] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [balanceError, setBalanceError] = useState(false);
  const [senderInfo, setSenderInfo] = useState<AddressProxy>(() => ({ isUnlockCached: false, signAddress: senderAccount.address, signPassword: '' }));

  const { currentAccount: account } = useSelector((state: RootState) => state);

  useEffect((): void => {
    setPasswordError(null);
  }, [senderInfo]);

  const unlock = useCallback(() => {
    let passwordError: string | null = null;

    if (senderInfo.signAddress) {
      passwordError = unlockAccount(senderInfo);
    }

    setPasswordError(passwordError);

    return passwordError;
  }, [senderInfo]);

  const onSend = useCallback(async () => {
    if (unlock() === null) {
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

                  nftForceUpdate({ nft: nftItem, collectionId, isSendingSelf } as RequestNftForceUpdate)
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
        console.log('error submitting tx', e);
        setBalanceError(true);
        setLoading(false);
      }
    } else {
      console.log('unlock account failed');
      setLoading(false);
    }
  }, [collectionId, extrinsic, nftItem, senderAccount.address, setExtrinsicHash, setIsTxSuccess, setShowConfirm, setShowResult, setTxError, unlock]);

  const handleSignAndSubmit = useCallback(() => {
    if (loading) return;

    setLoading(true);

    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    setTimeout(async () => {
      await onSend();
    }, 1);
  }, [loading, onSend]);

  useEffect((): void => {
    const method = extrinsic.method;

    setCallHash((method && method.hash.toHex()) || null);
  }, [extrinsic]);

  const hideConfirm = useCallback(() => {
    setShowConfirm(false);
  }, [setShowConfirm]);

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
            <div className={'fee'}>Fees of {txInfo?.partialFee.toHuman()} will be applied to the submission</div>

            <Address
              className={'sender-container'}
              onChange={setSenderInfo}
              onEnter={handleSignAndSubmit}
              passwordError={passwordError}
              requestAddress={senderAccount.address}
            />

            <Output
              className={'call-hash-container'}
              isDisabled
              isTrimmed
              label={'Call hash'}
              value={callHash}
              withCopy
            />

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
