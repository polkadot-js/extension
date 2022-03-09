// Copyright 2019-2022 @polkadot/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React, { useCallback, useContext, useEffect, useState } from 'react';
import CopyToClipboard from 'react-copy-to-clipboard';
import { useSelector } from 'react-redux';
import styled, { ThemeContext } from 'styled-components';

import { SubmittableExtrinsic } from '@polkadot/api/types';
import { BackgroundWindow } from '@polkadot/extension-base/background/KoniTypes';
import { AccountJson } from '@polkadot/extension-base/background/types';
import cloneIconLight from '@polkadot/extension-koni-ui/assets/clone--color-2.svg';
import cloneIconDark from '@polkadot/extension-koni-ui/assets/clone--color-3.svg';
import { Identicon } from '@polkadot/extension-koni-ui/components';
import TransferResult from '@polkadot/extension-koni-ui/Popup/Home/Nfts/component/TransferResult';
import { RootState } from '@polkadot/extension-koni-ui/stores';
import { Theme, ThemeProps } from '@polkadot/extension-koni-ui/types';
import { RuntimeDispatchInfo } from '@polkadot/types/interfaces';

const bWindow = chrome.extension.getBackgroundPage() as BackgroundWindow;
const { keyring } = bWindow.pdotApi;

interface Props extends ThemeProps {
  className?: string;
  setShowConfirm: () => void;
  senderAccount: AccountJson;
  recipientAddress: string;
  txInfo?: RuntimeDispatchInfo;
  extrinsic: SubmittableExtrinsic<'promise'>
}

function unlockAccount (signAddress: string, signPassword: string): boolean {
  let publicKey;

  try {
    publicKey = keyring.decodeAddress(signAddress);
  } catch (error) {
    console.error(error);

    return false;
  }

  const pair = keyring.getPair(publicKey);

  try {
    pair.decodePkcs8(signPassword);

    return true;
  } catch (error) {
    console.error(error);

    return false;
  }
}

function TransferConfirm ({ className, extrinsic, recipientAddress, senderAccount, setShowConfirm, txInfo }: Props): React.ReactElement<Props> {
  const themeContext = useContext(ThemeContext as React.Context<Theme>);
  const theme = themeContext.id;
  const { currentNetwork } = useSelector((state: RootState) => state);
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState(true);
  const [callHash, setCallHash] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [isTxSuccess, setIsTxSuccess] = useState(false);
  const [txError, setTxError] = useState('');

  const handleChangePassword = useCallback((e: any) => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-assignment
    const address = e.target.value;

    setPassword(address as string);
  }, []);

  const unlock = useCallback(() => {
    const senderAddress = senderAccount.address;
    const unlock = unlockAccount(senderAddress, password);

    setPasswordError(!unlock);
  }, [password, senderAccount]);

  const handleResend = useCallback(() => {
    console.log('resend');
  }, []);

  const handleSignAndSubmit = useCallback(async () => {
    unlock();
    console.log('passwordError', passwordError);

    if (!passwordError) {
      const pair = keyring.getPair(senderAccount.address);

      const unsubscribe = await extrinsic.signAndSend(pair, (result) => {
        if (!result || !result.status) {
          return;
        }

        console.log('status', result.status);

        if (result.status.isInBlock || result.status.isFinalized) {
          result.events
            .filter(({ event: { section } }) => section === 'system')
            .forEach(({ event }): void => {
              console.log('event', event);
              // if (method === 'ExtrinsicFailed') {
              //   console.log('extrinsic failed');
              //   // setIsTxSuccess(false);
              //   // setTxError('error');
              // } else if (method === 'ExtrinsicSuccess') {
              //   console.log('extrinsic ok');
              //   // setIsTxSuccess(true);
              // }
            });
        } else if (result.isError) {
          console.log('result is error');
          setShowResult(true);
          setIsTxSuccess(false);
          setTxError('error');
        }

        if (result.isCompleted) {
          console.log('result completed');
          setShowResult(true);
          setIsTxSuccess(true);
          unsubscribe();
        }
      });
    } else console.log('cant unlock');
  }, [extrinsic, passwordError, senderAccount.address, unlock]);

  useEffect((): void => {
    setPasswordError(true);
  }, [extrinsic, recipientAddress, senderAccount]);

  useEffect((): void => {
    const method = extrinsic.method;

    setCallHash((method && method.hash.toHex()) || null);
  }, [extrinsic]);

  return (
    <div className={className}>
      {
        !showResult &&
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
                onClick={setShowConfirm}
              >
                x
              </div>
            </div>
            <div className={'fee'}>Fees of {txInfo?.partialFee.toHuman()} will be applied to the submission</div>

            <div className={'sender-container'}>
              <div>
                <Identicon
                  genesisHash={currentNetwork.genesisHash}
                  value={senderAccount?.address}
                />
              </div>
              <div className={'sender-info'}>
                <div className={'secondary-text'}>Sending from my account</div>

                <div className={'address-container'}>
                  <div>{senderAccount?.name}</div>
                  <div className={'address-box secondary-text truncate'}>
                    {senderAccount?.address}
                  </div>
                </div>
              </div>
            </div>

            <div className={'field-container-confirm'}>
              <div className={'field-title-confirm'}>Password</div>
              <input
                className={'input-value-confirm'}
                onChange={handleChangePassword}
                type={'password'}
                value={password}
              />
            </div>

            <div className={'call-hash-container'}>
              <div className={'secondary-text'}>
                Call hash
              </div>
              <div className={'call-hash'}>
                <div className={'call-hash-string truncate'}>
                  {callHash}
                </div>
                <CopyToClipboard text={callHash as string}>
                  <div
                    className={'copy-btn'}
                  >
                    {theme === 'dark'
                      ? (
                        <img
                          alt='copy'
                          src={cloneIconDark}
                        />
                      )
                      : (
                        <img
                          alt='copy'
                          src={cloneIconLight}
                        />
                      )
                    }
                  </div>
                </CopyToClipboard>
              </div>
            </div>

            <div
              className={'submit-btn'}
              // eslint-disable-next-line @typescript-eslint/no-misused-promises
              onClick={handleSignAndSubmit}
            >
              Sign and Submit
            </div>
          </div>
      }

      {
        showResult &&
          <TransferResult
            isTxSuccess={isTxSuccess}
            onResend={handleResend}
            txError={txError}
          />
      }
    </div>
  );
}

export default React.memo(styled(TransferConfirm)(({ theme }: Props) => `
  .submit-btn {
    margin-top: 40px;
    background: #004BFF;
    border-radius: 8px;
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 10px;
    color: #FFFFFF;
    cursor: pointer;
  }

  .copy-btn {
    cursor: pointer;
  }

  .call-hash-string {
    width: 300px;
  }

  .call-hash-container {
    margin-top: 20px;
  }

  .call-hash {
    display: flex;
    justify-content: space-between;
  }

  .field-container-confirm {
    display: flex;
    flex-direction: column;
    gap: 5px;
    margin-top: 20px;
  }

  .field-title-confirm {
    text-transform: uppercase;
    font-size: 12px;
    color: #7B8098;
  }

  .input-value-confirm {
    background-color: ${theme.popupBackground};
    border-radius: 8px;
    padding: 10px 15px;
    font-size: 15px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    outline: none;
    border: 1px solid #181E42;
    color: ${theme.textColor};
  }

  .address-box {
    width: 100px;
  }

  .truncate {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .sender-info {
    width: 100%;
  }

  .address-container {
    display: flex;
    justify-content: space-between;
  }

  .secondary-text {
    color: #7B8098;
    font-size: 14px;
  }

  .sender-container {
    display: flex;
    justify-content: flex-start;
    gap: 10px;
    border: 2px dashed #212845;
    box-sizing: border-box;
    border-radius: 8px;
    padding: 10px;
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
