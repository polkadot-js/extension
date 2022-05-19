// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { AccountJson, RequestSign } from '@subwallet/extension-base/background/types';
import type { ExtrinsicPayload } from '@polkadot/types/interfaces';
import type { SignerPayloadJSON, SignerPayloadRaw } from '@polkadot/types/types';
import type { HexString } from '@polkadot/util/types';

import useTranslation from '@subwallet/extension-koni-ui/hooks/useTranslation';
import Qr from '@subwallet/extension-koni-ui/Popup/Signing/Qr';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { isAccountAll } from '@subwallet/extension-koni-ui/util';
import React, { useCallback, useContext, useEffect, useState } from 'react';
import styled from 'styled-components';

import { TypeRegistry } from '@polkadot/types';
import { decodeAddress } from '@polkadot/util-crypto';

import { AccountContext, AccountInfoEl, ActionContext } from '../../../components';
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

function Request ({ account: { isExternal, isHardware }, buttonText, className, isFirst, request, signId, url }: Props): React.ReactElement<Props> | null {
  const { t } = useTranslation();
  const onAction = useContext(ActionContext);
  const [{ hexBytes, payload }, setData] = useState<Data>({ hexBytes: null, payload: null });
  const [error, setError] = useState<string | null>(null);
  const [isShowDetails, setShowDetails] = useState<boolean>(false);
  const { accounts } = useContext(AccountContext);
  const { hostname } = new URL(url);

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

  const _onSignature = useCallback(
    ({ signature }: { signature: HexString }): Promise<void> =>
      approveSignSignature(signId, signature)
        .then(() => onAction())
        .catch((error: Error): void => {
          setError(error.message);
          console.error(error);
        }),
    [onAction, signId]
  );

  const renderDataRequest = () => {
    if (payload !== null) {
      const json = request.payload as SignerPayloadJSON;

      return (
        <>
          {isExternal && !isHardware
            ? (
              <Qr
                address={json.address}
                cmd={CMD_MORTAL}
                genesisHash={json.genesisHash}
                // eslint-disable-next-line @typescript-eslint/no-misused-promises
                onSignature={_onSignature}
                payload={payload}
              />
            )
            : (
              <Extrinsic
                payload={payload}
                request={json}
                url={url}
              />
            )
          }
        </>
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
  };

  const _viewDetails = useCallback(() => {
    setShowDetails(!isShowDetails);
  }, [isShowDetails]);

  const { address } = request.payload as SignerPayloadRaw;
  const account = accounts
    .filter((a) => !isAccountAll(a.address))
    .find((account) => decodeAddress(account.address).toString() === decodeAddress(address).toString());

  return (
    <div className={className}>
      <img
        alt={`${hostname}`}
        className='signing-request__logo'
        src={`https://icons.duckduckgo.com/ip2/${hostname}.ico`}
      />
      <div className='signing-request__host-name'>
        {hostname}
      </div>
      <span className='signing-request__title'>
        {t<string>('Approve Request')}
      </span>

      <span className='signing-request__text'>
        {t<string>('You are approving a request with account')}
      </span>

      <div className='signing-request__text-wrapper'>
        {account &&
        <AccountInfoEl
          address={account.address}
          className='signing-request__account'
          genesisHash={account.genesisHash}
          iconSize={20}
          isShowAddress={false}
          isShowBanner={false}
          name={account.name}
          showCopyBtn={false}
        />}
        <div className='signing-request__text'>{t<string>(`on ${hostname}`)}</div>
      </div>

      {isShowDetails && renderDataRequest()}

      <div
        className='signing-request__view-detail-btn'
        onClick={_viewDetails}
      >
        <div
          className='signing-request__view-detail-btn-text'
        >{isShowDetails ? t<string>('Hide Details') : t<string>('View Details')}</div>
      </div>

      <SignArea
        buttonText={buttonText}
        error={error}
        isExternal={isExternal}
        isFirst={isFirst}
        setError={setError}
        signId={signId}
      />
    </div>
  );
}

export default styled(Request)(({ theme }: Props) => `
  padding: 25px 15px 0;
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  .transaction-account-info {
    padding-bottom: 0;
  }

  .signing-request__logo {
    min-width: 56px;
    width: 56px;
    align-self: center;
    padding-bottom: 8px;
  }

  .signing-request__host-name {
    text-align: center;
    color: ${theme.textColor2};
    font-size: 14px;
    line-height: 24px;
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
    background-color: ${theme.accountAuthorizeRequest};
    width: fit-content;
    align-self: center;
    height: 24px;
  }

  .signing-request__view-detail-btn:hover {
    cursor: pointer;
  }

  .signing-request__view-detail-btn-text {
    font-size: 13px;
    line-height: 20px;
    color: ${theme.textColor2};
  }

`);
