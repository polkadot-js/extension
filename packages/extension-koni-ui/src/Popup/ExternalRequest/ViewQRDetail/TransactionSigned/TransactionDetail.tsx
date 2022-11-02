// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { EVMTransactionArg, NetworkJson, ParseEVMTransactionData, ResponseParseTransactionEVM, ResponseParseTransactionSubstrate } from '@subwallet/extension-base/background/KoniTypes';
import { Spinner } from '@subwallet/extension-koni-ui/components';
import { ScannerContext, ScannerContextType } from '@subwallet/extension-koni-ui/contexts/ScannerContext';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { convertToSimpleNumber } from '@subwallet/extension-koni-ui/util/formatNumber';
import CN from 'classnames';
import React, { useCallback, useContext, useMemo } from 'react';
import styled from 'styled-components';

interface Props extends ThemeProps {
  className?: string;
  network: NetworkJson;
}

const isTransactionEVM = (tx: ResponseParseTransactionEVM | ResponseParseTransactionSubstrate): tx is ResponseParseTransactionEVM => {
  return 'to' in tx;
};

const TransactionDetail = (props: Props) => {
  const { className, network } = props;

  const scannerStore = useContext<ScannerContextType>(ScannerContext);
  const { state } = scannerStore;
  const { parsedTx, signedData } = state;

  const payloadDetail = useMemo((): ResponseParseTransactionEVM | null => {
    return (!parsedTx || !isTransactionEVM(parsedTx)) ? null : parsedTx;
  }, [parsedTx]);

  const convertNumber = useCallback((val: number) => {
    return `${convertToSimpleNumber(val, network.decimals || 18)}${network.nativeToken || 'token'}`;
  }, [network.decimals, network.nativeToken]);

  const handlerRenderArg = useCallback((data: EVMTransactionArg, parentName: string): JSX.Element => {
    const { children, name, value } = data;
    const _name = (parentName ? `${parentName}.` : '') + name;

    const _value: string = value;

    if (children) {
      return (
        <React.Fragment key={parentName}>
          {
            children.map((child) => handlerRenderArg(child, name))
          }
        </React.Fragment>
      );
    }

    return (
      <div
        className='info-container'
        key={_name}
      >
        <div className='info-title'>
          {_name}:
        </div>
        <div className='info-detail'>
          {_value}
        </div>
      </div>
    );
  }, []);

  const handlerRenderInputInfo = useCallback((info: string | ParseEVMTransactionData) => {
    if (typeof info === 'string') {
      return null;
    }

    return (
      <div className={CN('info-group-container', 'detail-info-container')}>
        <div className={CN('group-title')}>
          Detail
        </div>
        <div className={CN('group-body')}>
          <div className='info-container'>
            <div className={CN('info-title')}>
              Method:
            </div>
            <div className='info-detail'>
              {info.methodName}
            </div>
          </div>
          {
            info.args.map((value) => handlerRenderArg(value, ''))
          }
        </div>
      </div>
    );
  }, [handlerRenderArg]);

  return (
    <div className={CN(className)}>
      {
        !payloadDetail &&
        (
          <div className={CN('info-loading')}>
            <Spinner />
          </div>
        )
      }
      {
        payloadDetail && (
          <>
            <div className={CN('info-group-container')}>
              <div className={CN('group-title')}>
                Basic
              </div>
              <table
                cellPadding={0}
                cellSpacing={4}
                className={CN('group-body')}
              >
                <tbody>
                  <tr className={'info-container'}>
                    <td className={CN('info-title')}>
                    To:
                    </td>
                    <td
                      className={CN('info-detail')}
                      colSpan={3}
                    >
                      {payloadDetail.to}
                    </td>
                  </tr>
                  <tr className={'info-container'}>
                    <td className={CN('info-title')}>
                    Data:
                    </td>
                    <td
                      className={CN(
                        'info-detail',
                        'raw-method',
                        {
                          hidden: payloadDetail.input.length <= 2
                        }
                      )}
                      colSpan={3}
                    >
                      <div
                        className={CN(
                          'info-detail',
                          'raw-method',
                          {
                            hidden: payloadDetail.input.length <= 2
                          }
                        )}
                      >
                        {payloadDetail.input}
                      </div>
                    </td>
                  </tr>
                  <tr className={'info-container'}>
                    <td className={CN('info-title')}>
                    Nonce:
                    </td>
                    <td className={CN('info-detail')}>
                      {payloadDetail.nonce}
                    </td>
                    <td className={CN('info-title')}>
                    Value:
                    </td>
                    <td className={CN('info-detail')}>
                      {convertNumber(payloadDetail.value)}
                    </td>
                  </tr>
                  <tr className={'info-container'}>
                    <td className={CN('info-title')}>
                    Gas:
                    </td>
                    <td className={CN('info-detail')}>
                      {payloadDetail.gas}
                    </td>
                    <td className={CN('info-title')}>
                    Gas price:
                    </td>
                    <td className={CN('info-detail')}>
                      {convertNumber(payloadDetail.gasPrice)}
                    </td>
                  </tr>
                  <tr className={'info-container'}>
                    <td className={CN('info-title')}>
                    Signature:
                    </td>
                    <td
                      className={CN('info-detail')}
                      colSpan={3}
                    >
                      {signedData}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            {handlerRenderInputInfo(payloadDetail.data)}
          </>
        )
      }
    </div>
  );
};

export default React.memo(styled(TransactionDetail)(({ theme }: Props) => `
  height: 100%;
  overflow-y: auto;
  position: relative;

  .info-loading {
    position: relative;
    height: 300px;
  }

  .raw-method {
    &.hidden {
      opacity: 0;
    }
  }

  .input-info-container {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
  }

  .info-group-container {
    .group-title {
      font-style: normal;
      font-weight: 700;
      font-size: 14px;
      line-height: 26px;
      text-align: left;
      color: ${theme.primaryColor}
    }

    .group-body {
      border-spacing: 4px;
      margin-left: -4px;

        .info-container{

          .info-title{
            color: ${theme.textColor2};
            font-style: normal;
            font-weight: 400;
            font-size: 14px;
            line-height: 26px;
            text-align: left;
            white-space: nowrap;
            vertical-align: top;
          }

          .info-detail{
            font-style: normal;
            font-weight: 400;
            font-size: 14px;
            line-height: 26px;
            color: ${theme.textColor};
            text-align: left;
            word-break: break-word;
            vertical-align: top;
            min-width: 90px;

            &:nth-child(4) {
              text-align: right;
            }
          }
        }
    }
  }

  .detail-info-container {
    .group-body {
      margin-left: 0;
    }
  }

`));
