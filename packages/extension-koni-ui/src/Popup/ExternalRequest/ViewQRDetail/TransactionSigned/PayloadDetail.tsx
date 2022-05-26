// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { EraInfo, ResponseGetRegistry } from '@subwallet/extension-base/background/types';
import { Spinner } from '@subwallet/extension-koni-ui/components';
import { ScannerContext, ScannerContextType } from '@subwallet/extension-koni-ui/contexts/ScannerContext';
import { getRegistry } from '@subwallet/extension-koni-ui/messaging';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import CN from 'classnames';
import React, { useCallback, useContext, useEffect, useState } from 'react';
import styled from 'styled-components';

import { isArray, isString, u8aToHex } from '@polkadot/util';

type TxDetail = ResponseGetRegistry;

interface Props extends ThemeProps{
  className?: string;
  setButtonLoading: (value: boolean) => void;
}

const PayloadDetail = (props: Props) => {
  const { className, setButtonLoading } = props;

  const scannerStore = useContext<ScannerContextType>(ScannerContext);
  const { state } = scannerStore;
  const { genesisHash, rawPayload, specVersion } = state;

  const [payloadDetail, setPayloadDetail] = useState<TxDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const handlerGetRegistry = useCallback(async (genesisHash: string, rawPayload: string, specVersion: number, mount: boolean) => {
    const data = await getRegistry(genesisHash, rawPayload, specVersion);

    if (mount) {
      setPayloadDetail(data);
      setLoading(!data);
      setButtonLoading(!data);
    }
  }, [setButtonLoading]);

  const handlerRenderEraDetail = useCallback(() => {
    if (!payloadDetail?.era) {
      return <></>;
    }

    const era = payloadDetail.era;

    if (isString(era)) {
      return (
        <div className={CN('info-detail grid-container')}>
          {era.toString()}
        </div>
      );
    } else {
      return (
        <div className={CN('info-detail grid-container')}>
          <div>
            phase: {(payloadDetail.era as EraInfo).phase}
          </div>
          <div>
            period: {(payloadDetail.era as EraInfo).period}
          </div>
        </div>
      );
    }
  }, [payloadDetail?.era]);

  const handlerRenderMethod = useCallback(() => {
    const method = payloadDetail?.method;

    if (!method) {
      return <></>;
    }

    if (isString(method)) {
      return (
        <div className={'raw-method'}>
          {method}
        </div>
      );
    }

    return method.map(({ args, method }, index) => {
      // const sectionMethod = entry[0];
      // const argList = entry[1];

      return (
        <div
          className={CN('call-detail')}
          key={index}
        >
          <div className={'call-header'}>
            Call&nbsp;
            <span className={'call-method'}>
              {method}
            </span>
            { args && !!args.length &&
              (
                <span>
                  &nbsp;with the following arguments:
                </span>
              )
            }
          </div>
          {args && !!args.length && (
            args.map(({ argName, argValue }, index) => (
              <div
                className={CN('call-args')}
                key={index}
              >
                <div
                  className={CN('arg')}
                >
                  {argName}:&nbsp;
                  { argValue && isArray(argValue)
                    ? argValue.join(', ')
                    : argValue
                  }
                </div>
              </div>
            ))
          )}
        </div>
      );
    });
  }, [payloadDetail?.method]);

  useEffect(() => {
    let mount = true;

    if (genesisHash && rawPayload && specVersion) {
      const _rawPayload = isString(rawPayload) ? rawPayload : u8aToHex(rawPayload);

      // eslint-disable-next-line no-void
      void handlerGetRegistry(genesisHash, _rawPayload, specVersion, mount);
    }

    return () => {
      mount = false;
    };
  }, [genesisHash, handlerGetRegistry, rawPayload, specVersion]);

  return (
    <div className={CN(className)}>
      { loading && <Spinner />}
      {
        !loading && payloadDetail && (
          <>
            <div className={CN('info-container')}>
              <div className={CN('info-title')}>
                Method
              </div>
              <div className={CN('info-detail')}>
                {handlerRenderMethod()}
              </div>
            </div>
            <div className={CN('info-container')}>
              <div className={CN('info-title')}>
                Era
              </div>
              { handlerRenderEraDetail() }
            </div>
            <div className={CN('grid-container')}>
              <div className={CN('info-container')}>
                <div className={CN('info-title')}>
                  Nonce
                </div>
                <div className={CN('info-detail')}>
                  {payloadDetail.nonce}
                </div>
              </div>
              <div className={CN('info-container')}>
                <div className={CN('info-title')}>
                  Tip
                </div>
                <div className={CN('info-detail')}>
                  {payloadDetail.tip}
                </div>
              </div>
            </div>
          </>
        )
      }
    </div>
  );
};

export default React.memo(styled(PayloadDetail)(({ theme }: Props) => `
  max-height: 240px;
  overflow-y: auto;

  &::-webkit-scrollbar{
    display: none;
  }

  .raw-method{
    word-break: break-all;
  }

  .call-detail {
    margin-bottom: 4px;

    .call-header {
      color: ${theme.textColor2};
      padding: 4px 0;
      text-align: left;

      .call-method {
        color: ${theme.textColor};
      }
    }

    .call-args{
      margin-bottom: 4px;
      color: ${theme.textColor};

      .arg{
        word-break: break-all;
      }
    }
  }

  .info-container{

    .info-title{
      background-color: ${theme.primaryColor};
      padding-left: 4px;
      font-weight: 500;
    }

    .info-detail{
      padding-left: 4px;
      margin-bottom: 2px;
      color: ${theme.textColor2};
    }
  }

  .grid-container{
    display: grid;
    grid-template-columns: repeat(2,1fr);
    grid-gap: 1px;
  }
`));
