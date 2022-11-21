// Copyright 2019-2022 @subwallet/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ConfirmationsQueue } from '@subwallet/extension-base/background/KoniTypes';
import useTranslation from '@subwallet/extension-koni-ui/hooks/useTranslation';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import CN from 'classnames';
import React, { useCallback, useEffect, useState } from 'react';
import styled from 'styled-components';

import { isAscii, u8aToString, u8aUnwrapBytes } from '@polkadot/util';

interface Props extends ThemeProps {
  className?: string;
  confirmation: ConfirmationsQueue['evmSignatureRequest'][0];
}

interface SignTypedDataObjectV1 {
  type: string;
  name: string;
  value: any;
}

function EvmSignConfirmationInfo ({ className, confirmation: { payload } }: Props): React.ReactElement {
  const { t } = useTranslation();
  const [signMethod, setSignMethod] = useState('');
  const [rawData, setRawData] = useState<string | object>('');
  const [warning, setWarning] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (payload.type === 'eth_sign') {
      setWarning('Signing this message can be dangerous. This signature could potentially perform any operation on your account\'s behalf, including granting complete control of your account and all of its assets to the requesting site. Only sign this message if you know what you\'re doing or completely trust the requesting site.');
      setSignMethod('ETH Sign');
    } else if (payload.type === 'personal_sign') {
      setSignMethod('Personal Sign');
    } else if (payload.type === 'eth_signTypedData') {
      setSignMethod('Sign Typed Data');
    } else if (payload.type === 'eth_signTypedData_v1') {
      setSignMethod('Sign Typed Data V1');
    } else if (payload.type === 'eth_signTypedData_v3') {
      setSignMethod('Sign Typed Data V3');
    } else if (payload.type === 'eth_signTypedData_v4') {
      setSignMethod('Sign Typed Data V4');
    }

    const raw = typeof payload.payload === 'string' ? payload.payload : JSON.parse(JSON.stringify(payload.payload)) as object;

    setRawData(raw);
  }, [payload]);

  const renderData = useCallback((data: any, needFilter?: boolean) => {
    if (typeof data !== 'object') {
      const raw = data as string;
      const text = isAscii(raw)
        ? u8aToString(u8aUnwrapBytes(raw))
        : raw;

      return (
        <div className='content'>
          {text}
        </div>
      );
    } else {
      return (
        <>
          {
            Object.entries(data as object).map(([key, datum], index) => {
              const isLeaf = typeof datum !== 'object';

              if (needFilter && key.toLowerCase() !== 'message') {
                return null;
              }

              return (
                <div
                  className={CN('node', { 'node-leaf': isLeaf })}
                  key={index}
                >
                  <div className={CN('title')}>{key}:</div>
                  {renderData(datum)}
                </div>
              );
            })
          }
        </>
      );
    }
  }, []);

  const handlerRenderV1 = useCallback((data: SignTypedDataObjectV1[]) => {
    return (
      <div className={'special-container'}>
        {
          data.map((value, index) => {
            return (
              <div
                className={'message-container'}
                key={index}
              >
                <div className={'message-name'}>
                  {value.name}:
                </div>
                <div className={'message-value'}>
                  {value.value as string}
                </div>
              </div>
            );
          })
        }
      </div>
    );
  }, []);

  const handlerRenderContent = useCallback(() => {
    if (!rawData) {
      return null;
    }

    switch (payload.type) {
      case 'eth_signTypedData_v3':
      case 'eth_signTypedData_v4':
        return renderData(rawData, true);
      case 'eth_signTypedData_v1':
      case 'eth_signTypedData':
        return handlerRenderV1(rawData as unknown as SignTypedDataObjectV1[]);
      default:
        return renderData(rawData);
    }
  }, [renderData, rawData, payload.type, handlerRenderV1]);

  return <div className={className}>
    <div className='signature-wrapper'>
      <div>
        <span className='label'>{t<string>('Sign Method')}</span><span className='value'>{signMethod}</span>
      </div>
      {warning && <div className='value warning-message'>{warning}</div>}
      <div>
        <span className='label'>{t<string>('Raw Data')}</span>
        <div className='data-wrapper'>
          {handlerRenderContent()}
        </div>
      </div>
    </div>
  </div>;
}

export default styled(EvmSignConfirmationInfo)(({ theme }: Props) => `
  .signature-wrapper {
    position: relative;
    width: 100%;
  }

  .label {
    font-weight: bold;
    padding-right: 8px;
  }

  .warning-message {
    color: red;
  }

  .data-wrapper {
    margin-left: -16px;

    .content {
      color: ${theme.textColor2};
      margin-left: 16px;
      white-space: pre-line;
      word-break: break-word;
    }

    .node {
      overflow: hidden;
      position: relative;
      margin-left: 16px;

      &.node-leaf {
        display: flex;
      }

      .content {
        margin-left: 8px;
      }

      .title {
        color: ${theme.textColor};
        white-space: nowrap;
      }
    }
  }

  .special-container {
    margin-left: 16px;

    .message-container {
      position: relative;
      padding-bottom: 20px;

      :after {
        content: '';
        position: absolute;
        width: 100%;
        height: 1px;
        bottom: 10px;
        left: 0;
        background-color: ${theme.textColor2};
      }

      .message-name {
        color: ${theme.textColor};
      }

      .message-value {
        color: ${theme.textColor2};
        white-space: nowrap;
      }

      &:last-child {
        :after {
          content: none;
          padding-bottom: 10px;
        }
      }
    }
  }
`);
