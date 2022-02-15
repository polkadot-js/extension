// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { SignerOptions } from '@polkadot/api/submittable/types';

import React, { useCallback, useEffect, useState } from 'react';
import styled from 'styled-components';

import { ApiPromise, SubmittableResult } from '@polkadot/api';
import { SubmittableExtrinsic } from '@polkadot/api/types';
import { BackgroundWindow } from '@polkadot/extension-base/background/KoniTypes';
import { Button } from '@polkadot/extension-koni-ui/components';
import Modal from '@polkadot/extension-koni-ui/components/Modal';
import Output from '@polkadot/extension-koni-ui/components/Output';
import { useToggle } from '@polkadot/extension-koni-ui/hooks/useToggle';
import useTranslation from '@polkadot/extension-koni-ui/hooks/useTranslation';
import Address from '@polkadot/extension-koni-ui/Popup/Sending/old/parts/Address';
import Tip from '@polkadot/extension-koni-ui/Popup/Sending/old/parts/Tip';
import Transaction from '@polkadot/extension-koni-ui/Popup/Sending/old/parts/Transaction';
import AccountSigner from '@polkadot/extension-koni-ui/Popup/Sending/old/signers/AccountSigner';
import { AddressProxy, TxHandler } from '@polkadot/extension-koni-ui/Popup/Sending/old/types';
import { cacheUnlock } from '@polkadot/extension-koni-ui/Popup/Sending/old/util';
import { ThemeProps } from '@polkadot/extension-koni-ui/types';
import { KeyringPair } from '@polkadot/keyring/types';
import { assert, BN_ZERO } from '@polkadot/util';
import { addressEq } from '@polkadot/util-crypto';

const bWindow = chrome.extension.getBackgroundPage() as BackgroundWindow;
const { keyring } = bWindow.pdotApi;

interface Props extends ThemeProps {
  className?: string;
  extrinsic: SubmittableExtrinsic<'promise'>;
  requestAddress: string;
  onCancel: () => void;
  txHandler: TxHandler;
  api: ApiPromise;
  apiUrl: string
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

export function handleTxResults (tx: SubmittableExtrinsic<'promise'>,
  { onTxFail, onTxSuccess, onTxUpdate }: TxHandler,
  unsubscribe: () => void): (result: SubmittableResult) => void {
  return (result: SubmittableResult): void => {
    if (!result || !result.status) {
      return;
    }

    console.log(`: status :: ${JSON.stringify(result)}`);
    console.log('result============', result);
    console.log('tx.toHash()', tx.hash.toHex());

    onTxUpdate && onTxUpdate(result);

    if (result.status.isFinalized || result.status.isInBlock) {
      result.events
        .filter(({ event: { section } }) => section === 'system')
        .forEach(({ event: { method } }): void => {
          const extrinsicHash = tx.hash.toHex();

          if (method === 'ExtrinsicFailed') {
            onTxFail && onTxFail(result, null, extrinsicHash);
          } else if (method === 'ExtrinsicSuccess') {
            onTxSuccess && onTxSuccess(result, extrinsicHash);
          }
        });
    } else if (result.isError) {
      onTxFail && onTxFail(result, null);
    }

    if (result.isCompleted) {
      unsubscribe();
    }
  };
}

async function signAndSend (txHandler: TxHandler, tx: SubmittableExtrinsic<'promise'>, pairOrAddress: KeyringPair | string, options: Partial<SignerOptions>): Promise<void> {
  txHandler.onTxStart && txHandler.onTxStart();

  try {
    await tx.signAsync(pairOrAddress, options);

    console.info('sending', tx.toHex());

    const unsubscribe = await tx.send(handleTxResults(tx, txHandler, (): void => {
      unsubscribe();
    }));
  } catch (error) {
    console.error('signAndSend: error:', error);

    txHandler.onTxFail && txHandler.onTxFail(null, error as Error);
  }
}

async function extractParams (api: ApiPromise, address: string, options: Partial<SignerOptions>): Promise<[string, Partial<SignerOptions>]> {
  const pair = keyring.getPair(address);

  assert(addressEq(address, pair.address), `Unable to retrieve keypair for ${address}`);

  return [address, { ...options, signer: new AccountSigner(api.registry, pair) }];
}

function AuthTransaction ({ api, apiUrl, className, extrinsic, onCancel, requestAddress, txHandler }: Props): React.ReactElement<Props> | null {
  const { t } = useTranslation();
  const [error, setError] = useState<Error | null>(null);
  const [isBusy, setBusy] = useState(false);
  const [isRenderError, toggleRenderError] = useToggle();
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [senderInfo, setSenderInfo] = useState<AddressProxy>(() => ({ isUnlockCached: false, signAddress: requestAddress, signPassword: '' }));
  const [callHash, setCallHash] = useState<string | null>(null);
  const [tip, setTip] = useState(BN_ZERO);

  useEffect((): void => {
    setPasswordError(null);
  }, [senderInfo]);

  // when we are sending the hash only, get the wrapped call for display (proxies if required)
  useEffect((): void => {
    const method = extrinsic.method;

    setCallHash(method && method.hash.toHex() || null);
  }, [api, extrinsic, senderInfo]);

  const _unlock = useCallback(
    async (): Promise<boolean> => {
      let passwordError: string | null = null;

      if (senderInfo.signAddress) {
        passwordError = unlockAccount(senderInfo);
      }

      setPasswordError(passwordError);

      return !passwordError;
    },
    [senderInfo, t]
  );

  const _onSend = useCallback(
    async (txHandler: TxHandler, extrinsic: SubmittableExtrinsic<'promise'>, senderInfo: AddressProxy): Promise<void> => {
      if (senderInfo.signAddress) {
        const [tx, [pairOrAddress, options]] = await Promise.all([
          extrinsic,
          extractParams(api, senderInfo.signAddress, { nonce: -1, tip })
        ]);

        await signAndSend(txHandler, tx, pairOrAddress, options);
      }
    },
    [api, tip, extrinsic]
  );

  const _doStart = useCallback(
    (): void => {
      setBusy(true);

      setTimeout((): void => {
        const errorHandler = (error: Error): void => {
          console.error(error);

          setBusy(false);
          setError(error);
        };

        _unlock()
          .then((isUnlocked): void => {
            if (isUnlocked) {
              _onSend(txHandler, extrinsic, senderInfo).catch(errorHandler);
            } else {
              setBusy(false);
            }
          })
          .catch((error): void => {
            errorHandler(error as Error);
          });
      }, 0);
    },
    [_onSend, _unlock, extrinsic, txHandler, senderInfo]
  );

  const _onCancel = useCallback(() => {
    onCancel();
  },
  [onCancel]
  );

  if (error) {
    console.log('error in Auth::', error);
  }

  return (
    <div className={className}>
      <Modal className={'kn-signer-modal'}>
        <div className='kn-l-header'>
          <div className='kn-l-header__part-1' />
          <div className='kn-l-header__part-2'>
            {t<string>('Authorize Transaction')}
          </div>
          <div className='kn-l-header__part-3'>
            {isBusy
              ? (
                <span className={'kn-l-close-btn -disabled'}>{t('Cancel')}</span>
              )
              : (
                <span
                  className={'kn-l-close-btn'}
                  onClick={_onCancel}
                >{t('Cancel')}</span>
              )
            }
          </div>
        </div>
        <div className='kn-l-body'>
          <div className={'kn-l-transaction-info-block'}>
            <Transaction
              accountId={senderInfo.signAddress}
              api={api}
              apiUrl={apiUrl}
              extrinsic={extrinsic}
              onError={toggleRenderError}
            />
          </div>

          <Address
            onChange={setSenderInfo}
            onEnter={_doStart}
            passwordError={passwordError}
            requestAddress={requestAddress}
          />

          <Tip
            className={'kn-l-tip-block'}
            onChange={setTip}
            registry={api.registry}
          />

          <Output
            className={'kn-l-call-hash'}
            isDisabled
            isTrimmed
            label={t<string>('Call hash')}
            value={callHash}
            withCopy
          />

          <div className='kn-l-submit-wrapper'>
            <Button
              className={'kn-l-submit-btn'}
              isBusy={isBusy}
              isDisabled={!senderInfo.signAddress || isRenderError}
              onClick={_doStart}
            >
              {t<string>('Sign and Submit')}
            </Button>
          </div>
        </div>
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

  .kn-l-header {
    display: flex;
    align-items: center;
    height: 72px;
    box-shadow: ${theme.headerBoxShadow};
  }

  .kn-l-body {
    flex: 1;
    padding-left: 15px;
    padding-right: 15px;
    padding-bottom: 15px;
    padding-top: 25px;
    overflow-y: auto;
  }

  .kn-l-header__part-1 {
    flex: 1;
  }

  .kn-l-header__part-2 {
    color: ${theme.textColor};
    font-size: 20px;
    font-weight: 500;
  }

  .kn-l-header__part-3 {
    flex: 1;
    display: flex;
    justify-content: flex-end;
  }

  .kn-l-close-btn {
    padding-left: 16px;
    padding-right: 16px;
    height: 40px;
    display: flex;
    align-items: center;
    color: #04C1B7;
    font-weight: 500;
    cursor: pointer;

    &.-disabled {
      cursor: not-allowed;
      opacity: 0.5;
    }
  }

  .kn-l-transaction-info-block {
    margin-bottom: 20px;
  }

  .kn-l-tip-block {
    margin-top: 10px;
  }

  .kn-l-call-hash {
    margin-top: 20px;
  }

  .kn-l-submit-wrapper {
    position: sticky;
    bottom: -15px;
    padding: 15px;
    margin-left: -15px;
    margin-bottom: -15px;
    margin-right: -15px;
    background-color: ${theme.background};
  }
`));
