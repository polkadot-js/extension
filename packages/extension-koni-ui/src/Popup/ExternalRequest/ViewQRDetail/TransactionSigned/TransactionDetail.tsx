// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ResponseParseTransactionEVM } from '@subwallet/extension-base/background/KoniTypes';
import { Spinner } from '@subwallet/extension-koni-ui/components';
import { ScannerContext, ScannerContextType } from '@subwallet/extension-koni-ui/contexts/ScannerContext';
import { parseEVMTransaction } from '@subwallet/extension-koni-ui/messaging';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import CN from 'classnames';
import React, { useCallback, useContext, useEffect, useState } from 'react';
import styled from 'styled-components';

import { isString, u8aToHex } from '@polkadot/util';

interface Props extends ThemeProps{
  className?: string;
  setButtonLoading: (value: boolean) => void;
}

type TxDetail = ResponseParseTransactionEVM;

const TransactionDetail = (props: Props) => {
  const { className, setButtonLoading } = props;

  const scannerStore = useContext<ScannerContextType>(ScannerContext);
  const { state } = scannerStore;
  const { dataToSign } = state;

  const [payloadDetail, setPayloadDetail] = useState<TxDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const handlerParseTransaction = useCallback(async (dataToSign: string, mount: boolean) => {
    const data = await parseEVMTransaction(dataToSign);

    if (mount) {
      setPayloadDetail(data);
      setLoading(!data);
      setButtonLoading(!data);
    }
  }, [setButtonLoading]);

  const handlerRenderData = useCallback(() => {
    const data = payloadDetail?.data;

    if (!data) {
      return <></>;
    }

    if (isString(data)) {
      return (
        <div className={'raw-method'}>
          {data}
        </div>
      );
    }

    const { args, method } = data;

    return (
      <div className={'method-info'}>
        <div className={'method-description'}>
          <div>
            Method: {method}
          </div>
          <div>
            Arguments:
          </div>
        </div>
        {
          args.map(({ name, type, value }, index) => {
            return (
              <div
                className={'method-arg'}
                key={index}
              >
                <div className={CN('grid-container')}>
                  <div className={CN('info-container')}>
                    <div className={CN('info-title')}>
                      Name
                    </div>
                    <div className={CN('info-detail')}>
                      {name}
                    </div>
                  </div>
                  <div className={CN('info-container')}>
                    <div className={CN('info-title')}>
                      Type
                    </div>
                    <div className={CN('info-detail')}>
                      {type}
                    </div>
                  </div>
                </div>
                <div className={CN('info-container')}>
                  <div className={CN('info-title')}>
                    Value
                  </div>
                  <div className={CN('info-detail')}>
                    {value}
                  </div>
                </div>
              </div>
            );
          })
        }
      </div>
    );
  }, [payloadDetail?.data]);

  useEffect(() => {
    let mount = true;

    if (dataToSign) {
      const _raw = isString(dataToSign) ? dataToSign : u8aToHex(dataToSign);

      // eslint-disable-next-line no-void
      void handlerParseTransaction(_raw, mount);
    }

    return () => {
      mount = false;
    };
  }, [dataToSign, handlerParseTransaction]);

  return (
    <div className={CN(className)}>
      { loading && <Spinner />}
      {
        !loading && payloadDetail && (
          <>
            <div className={CN('info-container')}>
              <div className={CN('info-title')}>
                To
              </div>
              <div className={CN('info-detail')}>
                {payloadDetail.to}
              </div>
            </div>
            <div className={CN('info-container')}>
              <div className={CN('info-title')}>
                Data
              </div>
              <div className={CN('info-detail')}>
                {handlerRenderData()}
              </div>
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
                  Value
                </div>
                <div className={CN('info-detail')}>
                  {payloadDetail.value}
                </div>
              </div>
            </div>
            <div className={CN('grid-container')}>
              <div className={CN('info-container')}>
                <div className={CN('info-title')}>
                  Gas
                </div>
                <div className={CN('info-detail')}>
                  {payloadDetail.gas}
                </div>
              </div>
              <div className={CN('info-container')}>
                <div className={CN('info-title')}>
                  Gas price
                </div>
                <div className={CN('info-detail')}>
                  {payloadDetail.gasPrice}
                </div>
              </div>
            </div>
          </>
        )
      }
    </div>
  );
};

export default React.memo(styled(TransactionDetail)(({ theme }: Props) => `
  max-height: 240px;
  overflow-y: auto;

  &::-webkit-scrollbar{
    display: none;
  }

  .info-container{

    .info-title{
      background-color: ${theme.primaryColor};
      color: ${theme.textColor};
      padding-left: 4px;
      font-weight: 500;
    }

    .info-detail{
      padding-left: 4px;
      margin-bottom: 2px;
      color: ${theme.textColor2};
      word-break: break-word;
    }
  }

  .method-info {
    margin-left: -4px;

    .method-description {
      padding-left: 4px;
    }

    .method-arg {
      padding-bottom: 4px;
      position: relative;

      &:after {
        content: '';
        width: 100%;
        background-color: ${theme.textColor2};
        height: 1px;
        position: absolute;
        bottom: 4px;
        left: 0;
      }
    }
  }

  .grid-container{
    display: grid;
    grid-template-columns: repeat(2,1fr);
    grid-gap: 1px;
  }
`));
