// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { EvmSignatureRequest } from '@subwallet/extension-base/background/KoniTypes';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import CN from 'classnames';
import React, { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

import { isAscii, u8aToString, u8aUnwrapBytes } from '@polkadot/util';

interface Props extends ThemeProps {
  payload: EvmSignatureRequest;
}

interface SignTypedDataObjectV1 {
  type: string;
  name: string;
  value: any;
}

const Component: React.FC<Props> = (props: Props) => {
  const { className, payload: { payload, type } } = props;

  const { t } = useTranslation();

  const signMethod = useMemo(() => {
    if (type === 'eth_sign') {
      return 'ETH Sign';
    } else if (type === 'personal_sign') {
      return 'Personal Sign';
    } else if (type === 'eth_signTypedData') {
      return 'Sign Typed Data';
    } else if (type === 'eth_signTypedData_v1') {
      return 'Sign Typed Data V1';
    } else if (type === 'eth_signTypedData_v3') {
      return 'Sign Typed Data V3';
    } else if (type === 'eth_signTypedData_v4') {
      return 'Sign Typed Data V4';
    }

    return '';
  }, [type]);

  const rawData = useMemo(() => typeof payload === 'string' ? payload : JSON.parse(JSON.stringify(payload)) as object, [payload]);

  const renderData = useCallback((data: any, needFilter?: boolean) => {
    if (typeof data !== 'object') {
      const raw = data as string;
      const text = isAscii(raw)
        ? u8aToString(u8aUnwrapBytes(raw))
        : raw;

      return (
        <div className='data-container'>
          <div className='data-title'>
            {t('Message')}
          </div>
          <div className='data-value'>
            {text}
          </div>
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
  }, [t]);

  const handlerRenderV1 = useCallback((data: SignTypedDataObjectV1[]) => {
    return (
      <>
        {
          data.map((value, index) => {
            return (
              <div
                className='data-container'
                key={index}
              >
                <div className='data-title'>
                  {value.name}
                </div>
                <div className='data-value'>
                  {value.value as string}
                </div>
              </div>
            );
          })
        }
      </>
    );
  }, []);

  const handlerRenderContent = useCallback(() => {
    if (!rawData) {
      return null;
    }

    switch (type) {
      case 'eth_signTypedData_v3':
      case 'eth_signTypedData_v4':
        return renderData(rawData, true);
      case 'eth_signTypedData_v1':
      case 'eth_signTypedData':
        return handlerRenderV1(rawData as unknown as SignTypedDataObjectV1[]);
      default:
        return renderData(rawData);
    }
  }, [renderData, rawData, type, handlerRenderV1]);

  return (
    <div className={CN(className)}>
      {
        signMethod && (
          <div className={CN('data-container', 'data-row')}>
            <div className='data-title'>
              {t('Sign method')}
            </div>
            <div className={CN('data-value', 'highlight')}>
              {signMethod}
            </div>
          </div>
        )
      }
      {handlerRenderContent()}
    </div>
  );
};

const EvmMessageDetail = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {
    display: 'flex',
    flexDirection: 'column',
    gap: token.size
  };
});

export default EvmMessageDetail;
