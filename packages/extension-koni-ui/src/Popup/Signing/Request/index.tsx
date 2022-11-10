// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { AccountJson, RequestSign } from '@subwallet/extension-base/background/types';
import type { ExtrinsicPayload } from '@polkadot/types/interfaces';
import type { SignerPayloadJSON, SignerPayloadRaw } from '@polkadot/types/types';
import type { HexString } from '@polkadot/util/types';

import { NetworkJson } from '@subwallet/extension-base/background/KoniTypes';
import { SIGN_MODE } from '@subwallet/extension-koni-ui/constants/signing';
import { useGetSignMode } from '@subwallet/extension-koni-ui/hooks/useGetSignMode';
import useTranslation from '@subwallet/extension-koni-ui/hooks/useTranslation';
import LedgerSign from '@subwallet/extension-koni-ui/Popup/Signing/LedgerSign';
import Qr from '@subwallet/extension-koni-ui/Popup/Signing/Qr';
import { RootState } from '@subwallet/extension-koni-ui/stores';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import CN from 'classnames';
import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import { TypeRegistry } from '@polkadot/types';
import { encodeAddress } from '@polkadot/util-crypto';

import { AccountInfoEl, ActionContext, Button, Modal, Warning } from '../../../components';
import { approveSignSignature } from '../../../messaging';
import Bytes from '../Bytes';
import Extrinsic from '../Extrinsic';
import SignArea from './SignArea';

interface Props extends ThemeProps {
  account: AccountJson;
  buttonText: string;
  isFirst: boolean;
  request: RequestSign;
  signId: string;
  url: string;
  className?: string;
}

interface Data {
  hexBytes: string | null;
  payload: ExtrinsicPayload | null;
}

export const CMD_MORTAL = 2;
export const CMD_SIGN_MESSAGE = 3;

// keep it global, we can and will re-use this across requests
const registry = new TypeRegistry();

function isRawPayload (payload: SignerPayloadJSON | SignerPayloadRaw): payload is SignerPayloadRaw {
  return !!(payload as SignerPayloadRaw).data;
}

function Request ({ account,
  buttonText,
  className,
  isFirst,
  request,
  signId,
  url }: Props): React.ReactElement<Props> | null {
  const { accountIndex, addressOffset, isExternal } = account;

  const { t } = useTranslation();
  const onAction = useContext(ActionContext);
  const [{ hexBytes, payload }, setData] = useState<Data>({ hexBytes: null, payload: null });
  const [error, setError] = useState<string | null>(null);
  const [isShowDetails, setShowDetails] = useState<boolean>(false);
  const { hostname } = new URL(url);

  const { networkMap } = useSelector((state: RootState) => state);

  const { address } = request.payload as SignerPayloadRaw;

  const signMode = useGetSignMode(account);

  const network = useMemo((): null | NetworkJson => {
    let result: null | NetworkJson = null;

    if (payload !== null) {
      for (const network of Object.values(networkMap)) {
        if (network.genesisHash === payload.genesisHash.toString()) {
          result = network;
          break;
        }
      }
    }

    return result;
  }, [networkMap, payload]);

  const _viewDetails = useCallback(() => {
    setShowDetails(!isShowDetails);
  }, [isShowDetails]);

  const buttonDetail = useMemo(() => {
    return (
      <div
        className='signing-request__view-detail-btn'
        onClick={_viewDetails}
      >
        <div
          className='signing-request__view-detail-btn-text'
        >{t<string>('View Details')}</div>
      </div>
    );
  }, [_viewDetails, t]);

  const _onSignature = useCallback(
    ({ signature }: { signature: HexString }): Promise<void> => {
      return approveSignSignature(signId, signature)
        .then(() => onAction())
        .catch((error: Error): void => {
          setError(error.message);
          console.error(error);
        });
    },
    [onAction, signId]
  );

  const renderDataRequest = useCallback(() => {
    if (payload !== null) {
      const json = request.payload as SignerPayloadJSON;

      return (
        <Extrinsic
          payload={payload}
          request={json}
          url={url}
        />
      )
      ;
    } else if (hexBytes !== null) {
      const { data } = request.payload as SignerPayloadRaw;

      return (
        <Bytes
          bytes={data}
          url={url}
        />
      );
    }

    return null;
  }, [hexBytes, payload, request.payload, url]);

  const renderSignArea = useCallback(() => {
    if (signMode === SIGN_MODE.PASSWORD) {
      return (
        <>
          {buttonDetail}
          <SignArea
            buttonText={buttonText}
            error={error}
            isExternal={isExternal}
            isFirst={isFirst}
            setError={setError}
            signId={signId}
          />
        </>
      );
    }

    if (payload !== null) {
      const json = request.payload as SignerPayloadJSON;

      switch (signMode) {
        case SIGN_MODE.LEDGER:
          return (
            <LedgerSign
              accountIndex={accountIndex as number || 0}
              addressOffset={addressOffset as number || 0}
              error={error}
              genesisHash={json.genesisHash}
              // eslint-disable-next-line @typescript-eslint/no-misused-promises
              onSignature={_onSignature}
              payload={payload}
              setError={setError}
              signId={signId}
            >
              {buttonDetail}
            </LedgerSign>
          );
        case SIGN_MODE.QR:
          return (
            <Qr
              address={json.address}
              cmd={CMD_MORTAL}
              genesisHash={json.genesisHash}
              // eslint-disable-next-line @typescript-eslint/no-misused-promises
              onSignature={_onSignature}
              payload={payload}
              signId={signId}
            >
              {buttonDetail}
            </Qr>
          );
        default:
          return (
            <>
              {buttonDetail}
              <SignArea
                buttonText={buttonText}
                error={error}
                isExternal={isExternal}
                isFirst={isFirst}
                setError={setError}
                signId={signId}
              />
            </>
          );
      }
    } else if (hexBytes !== null) {
      const { data } = request.payload as SignerPayloadRaw;

      let genesisHash = '';

      for (const network of Object.values(networkMap)) {
        const condition = encodeAddress(address, network.ss58Format) === encodeAddress(address);

        if (condition) {
          genesisHash = network.genesisHash;
          break;
        }
      }

      switch (signMode) {
        case SIGN_MODE.QR:
          return (
            <Qr
              address={address}
              cmd={CMD_SIGN_MESSAGE}
              genesisHash={genesisHash}
              // eslint-disable-next-line @typescript-eslint/no-misused-promises
              onSignature={_onSignature}
              payload={data}
              signId={signId}
            >
              {buttonDetail}
            </Qr>
          );
        default:
          return (
            <>
              {buttonDetail}
              <SignArea
                buttonText={buttonText}
                error={error}
                isExternal={true}
                isFirst={isFirst}
                setError={setError}
                signId={signId}
              />
            </>
          );
      }
    }

    return null;
  }, [_onSignature, accountIndex, address, addressOffset, buttonDetail, buttonText, error, hexBytes, isExternal, isFirst, networkMap, payload, request.payload, signId, signMode]);

  useEffect((): void => {
    const payload = request.payload;

    if (isRawPayload(payload)) {
      setData({
        hexBytes: payload.data,
        payload: null
      });
    } else {
      registry.setSignedExtensions(payload.signedExtensions);

      setData({
        hexBytes: null,
        payload: registry.createType('ExtrinsicPayload', payload, { version: payload.version })
      });
    }
  }, [request]);

  return (
    <div className={className}>
      <div className='sign-request-content'>
        <div className='request-site-container'>
          <div className='request-site-info'>
            <img
              alt={`${hostname}`}
              className='signing-request__logo'
              src={`https://icons.duckduckgo.com/ip2/${hostname}.ico`}
            />
            <div className='signing-request__host-name'>
              {hostname}
            </div>
          </div>
        </div>
        <div className='signing-request__text'>{hostname}</div>
        <span className='signing-request__title'>
          {t<string>('Approve Request')}
        </span>

        {
          signMode !== SIGN_MODE.QR &&
          (
            <>
              <span className='signing-request__text'>
                {t<string>('You are approving a request with account')}
              </span>
              <div className='signing-request__text-wrapper'>
                {
                  account &&
                  <div>
                    <AccountInfoEl
                      address={account.address}
                      className='signing-request__account'
                      genesisHash={account.genesisHash}
                      iconSize={20}
                      isShowAddress={false}
                      isShowBanner={false}
                      name={account.name}
                      showCopyBtn={false}
                    />
                  </div>
                }
                {
                  network && (
                    <div className='signing-request__text'>
                      {t<string>(`on ${network.chain.replaceAll(' Relay Chain ', '')}`)}
                    </div>
                  )
                }
              </div>
            </>
          )
        }

        {
          signMode === SIGN_MODE.LEDGER && hexBytes !== null &&
          (
            <Warning>
              {t('Message signing is not supported for hardware wallets.')}
            </Warning>
          )
        }

        {
          signMode === SIGN_MODE.READ_ONLY &&
          (
            <Warning>
              {t('You are using readonly account.')}
            </Warning>
          )
        }

        {
          isShowDetails &&
          (
            <Modal
              className={CN(className, 'detail-modal')}
            >
              <div className='modal-content'>
                <div className='info-area'>
                  <div className='request-site-container'>
                    <div className='request-site-info'>
                      <img
                        alt={`${hostname}`}
                        className='signing-request__logo'
                        src={`https://icons.duckduckgo.com/ip2/${hostname}.ico`}
                      />
                      <div className='signing-request__host-name'>
                        {hostname}
                      </div>
                    </div>
                  </div>
                  <div className='signing-request__text'>{hostname}</div>
                  <span className='signing-request__title'>
                    {t<string>('Approve Request')}
                  </span>

                  {
                    signMode === SIGN_MODE.QR &&
                    (
                      <>
                        <span className='signing-request__text'>
                          {t<string>('You are approving a request with account')}
                        </span>
                        <div className='signing-request__text-wrapper'>
                          {
                            account &&
                            <AccountInfoEl
                              address={account.address}
                              className='signing-request__account'
                              genesisHash={account.genesisHash}
                              iconSize={20}
                              isShowAddress={false}
                              isShowBanner={false}
                              name={account.name}
                              showCopyBtn={false}
                            />
                          }
                          {
                            network && (
                              <div className='signing-request__text'>
                                {t<string>(`on ${network.chain.replaceAll(' Relay Chain ', '')}`)}
                              </div>
                            )
                          }
                        </div>
                      </>
                    )
                  }
                  <div className='detail-info-container'>
                    {renderDataRequest()}
                  </div>
                </div>
                <div className='action-container'>
                  <Button
                    className='close-button'
                    onClick={_viewDetails}
                  >
                    Close
                  </Button>
                </div>
              </div>
            </Modal>
          )
        }
      </div>

      {renderSignArea()}
    </div>
  );
}

export default styled(Request)(({ theme }: Props) => `
  padding: 25px 15px 0;
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow-y: auto;

  .detail-modal{
    .subwallet-modal{
      max-width: 390px;
      height: 490px;
    }

    .modal-content {
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      position: relative;

      .info-area {
        overflow: hidden;
        display: flex;
        flex-direction: column;
      }

      .detail-info-container {
        overflow-y: auto;
      }

      .action-container {
        display: flex;
        align-items: center;
        justify-content: center;

        .close-button{
          margin-top: 8px;
          width: 170px;
        }
      }
    }
  }

  .request-site-container {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    margin-bottom: 10px;

    .request-site-info {
      cursor: pointer;
      display: flex;
      align-items: center;
      flex-direction: row;
      justify-content: center;
      height: 40px;
      max-width: 240px;
      background: ${theme.backgroundAccountAddress};
      border-radius: 5px;
      padding: 6px 10px;

        .signing-request__logo {
          min-width: 28px;
          width: 28px;
          align-self: center;
          padding-right: 8px;
        }

        .signing-request__host-name {
          font-style: normal;
          font-weight: 400;
          font-size: 14px;
          line-height: 24px;
          text-align: center;
          color: ${theme.textColor2};
        }
    }
  }

  .transaction-account-info {
    padding-bottom: 0;
  }

  .sign-request-content {
    display: flex;
    flex-direction: column;
  }

  .sign-request-footer {
    overflow: hidden;
  }

  .signing-request__title {
    text-align: center;
    font-size: 24px;
    line-height: 36px;
    font-weight: 500;
    padding-bottom: 30px;
  }

  .signing-request__text-wrapper {
    padding: 13px 0;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-wrap: wrap;
  }

  .signing-request__text {
    text-align: center;
    font-size: 15px;
    line-height: 26px;
    font-weight: 500;
    color: ${theme.textColor2};
  }

  .signing-request__account {
    padding: 6px 10px;
    background-color: ${theme.accountAuthorizeRequest};
    border-radius: 8px;
    width: fit-content;
    margin-right: 10px;

    .account-info-row {
      height: auto;
      width: fit-content;
    }

    .account-info {
      width: fit-content;
    }
  }

  .signing-request__view-detail-btn {
    padding: 2px 8px;
    border-radius: 3px;
    display: flex;
    align-items: center;
    place-content: center;
    margin: ${theme.boxMargin};
  }

  .signing-request__view-detail-btn:hover {
    cursor: pointer;
  }

  .signing-request__view-detail-btn-text {
    font-size: 13px;
    line-height: 20px;
    color: ${theme.textColor2};
    padding: 2px 8px;
    border-radius: 3px;
    background-color: ${theme.accountAuthorizeRequest};
    height: 24px;
  }

  .sign-button-container {
    display: flex;
    position: sticky;
    bottom: 0;
    background-color: ${theme.background};
    margin-left: -15px;
    margin-right: -15px;
    margin-bottom: -15px;
    padding: 15px;
  }

  .sign-button {
    flex: 1;
  }

  .sign-button:first-child {
    background-color: ${theme.buttonBackground1};
    margin-right: 8px;

    span {
      color: ${theme.buttonTextColor2};
    }
  }
`);
