// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { EraInfo, NetworkJson, ResponseParseTransactionSubstrate, ResponseQrParseRLP } from '@subwallet/extension-base/background/KoniTypes';
import { Spinner, Warning } from '@subwallet/extension-koni-ui/components';
import { ScannerContext, ScannerContextType } from '@subwallet/extension-koni-ui/contexts/ScannerContext';
import useMetadataChain from '@subwallet/extension-koni-ui/hooks/useMetadataChain';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { DecodedMethod, decodeMethod } from '@subwallet/extension-koni-ui/util/scanner/decoders';
import BigN from 'bignumber.js';
import CN from 'classnames';
import React, { useCallback, useContext, useMemo, useState } from 'react';
import styled from 'styled-components';

import { isArray, isString, u8aToHex } from '@polkadot/util';

interface Props extends ThemeProps {
  className?: string;
  network: NetworkJson;
}

const isTransactionSubstrate = (tx: ResponseQrParseRLP | ResponseParseTransactionSubstrate): tx is ResponseParseTransactionSubstrate => {
  return 'era' in tx;
};

const PayloadDetail = (props: Props) => {
  const { className, network } = props;

  const scannerStore = useContext<ScannerContextType>(ScannerContext);
  const { state } = scannerStore;
  const { genesisHash, parsedTx, rawPayload, signedData } = state;

  const [chainLoading, setChainLoading] = useState<boolean>(true);

  const chain = useMetadataChain(genesisHash, setChainLoading);

  const payloadDetail = useMemo((): ResponseParseTransactionSubstrate | null => {
    return (!parsedTx || !isTransactionSubstrate(parsedTx)) ? null : parsedTx;
  }, [parsedTx]);

  const decoded = useMemo((): DecodedMethod | null => {
    if (!payloadDetail || chainLoading) {
      return null;
    } else {
      if (chain && chain.hasMetadata) {
        return decodeMethod(payloadDetail.method, chain, new BigN(payloadDetail.specVersion));
      } else {
        const message = `Error decoding method: chain=${network.chain}, no metadata`;

        return { warning: true, message: message, result: payloadDetail.method };
      }
    }
  }, [payloadDetail, chainLoading, chain, network.chain]);

  const handlerRenderEraDetail = useCallback(() => {
    if (!payloadDetail?.era) {
      return <></>;
    }

    const era = payloadDetail.era;

    if (isString(era)) {
      return (
        <tr className={'info-container'}>
          <td className={CN('info-title')}>
            Era:
          </td>
          <td
            className={CN('info-detail')}
            colSpan={3}
          >
            {era}
          </td>
        </tr>
      );
    } else {
      return (
        <tr className={'info-container'}>
          <td className={CN('info-title')}>
            Phase:
          </td>
          <td className={CN('info-detail')}>
            {(payloadDetail.era as EraInfo).phase}
          </td>
          <td className={CN('info-title')}>
            Period:
          </td>
          <td className={CN('info-detail')}>
            {(payloadDetail.era as EraInfo).period}
          </td>
        </tr>
      );
    }
  }, [payloadDetail?.era]);

  const handlerRenderMethod = useCallback(() => {
    const method = decoded?.result;

    if (!method) {
      return <></>;
    }

    if (isString(method)) {
      return null;
    }

    return (
      <div
        className={CN('info-group-container', 'detail-info-container')}
      >
        <div className={CN('group-title')}>
          Detail
        </div>
        {
          method.map(({ args, method }, index) => {
            return (
              <div
                className={CN('group-body')}
                key={`${method}_${index}`}
              >
                <div className='info-container'>
                  <div className={CN('info-title')}>
                    Method:
                  </div>
                  <div className='info-detail'>
                    {method}({args && !!args.length && args.map(({ argName }) => argName).join(', ')})
                  </div>
                </div>
                {args && !!args.length && (
                  args.map(({ argName, argValue }, index) => (
                    <div
                      className='info-container'
                      key={`${argName}_${index}`}
                    >
                      <div className='info-title'>
                        {argName}:
                      </div>
                      <div className='info-detail'>
                        {argValue && isArray(argValue)
                          ? argValue.join(', ')
                          : argValue
                        }
                      </div>
                    </div>
                  ))
                )}
              </div>
            );
          })
        }
      </div>
    );
  }, [decoded]);

  return (
    <div className={CN(className)}>
      {!decoded &&
        (
          <div className={CN('info-loading')}>
            <Spinner />
          </div>
        )
      }
      {
        decoded && payloadDetail && (
          <>
            {
              decoded.message && decoded.warning &&
              (
                <Warning className={'decode-warning'}>
                  {decoded.message}
                </Warning>
              )
            }
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
                    Method:
                    </td>
                    <td
                      className={CN('info-detail')}
                      colSpan={3}
                    >
                      {isString(rawPayload) ? rawPayload : u8aToHex(rawPayload)}
                    </td>
                  </tr>
                  {handlerRenderEraDetail()}
                  <tr className={'info-container'}>
                    <td className={CN('info-title')}>
                    Nonce:
                    </td>
                    <td className={CN('info-detail')}>
                      {payloadDetail.nonce}
                    </td>
                    <td className={CN('info-title')}>
                    Tip:
                    </td>
                    <td className={CN('info-detail')}>
                      {payloadDetail.tip}
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
            {handlerRenderMethod()}
          </>
        )
      }
    </div>
  );
};

export default React.memo(styled(PayloadDetail)(({ theme }: Props) => `
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

  .decode-warning {
    margin-bottom: 10px;
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
