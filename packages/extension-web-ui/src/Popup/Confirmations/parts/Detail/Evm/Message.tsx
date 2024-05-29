// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { EvmSignatureRequest } from '@subwallet/extension-base/background/KoniTypes';
import MetaInfo from '@subwallet/extension-web-ui/components/MetaInfo/MetaInfo';
import { ThemeProps } from '@subwallet/extension-web-ui/types';
import CN from 'classnames';
import React, { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

import { isArray, isAscii, u8aToString, u8aUnwrapBytes } from '@polkadot/util';

interface Props extends ThemeProps {
  payload: EvmSignatureRequest;
}

interface SignTypedDataObjectV1 {
  type: string;
  name: string;
  value: unknown;
}

const checkIsLeaf = (data: unknown): boolean => {
  if (isArray(data)) {
    return typeof data[0] === 'object';
  } else {
    return typeof data === 'object';
  }
};

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

  const renderData = useCallback((data: unknown, needFilter?: boolean): React.ReactNode => {
    if (isArray(data)) {
      if (typeof data[0] !== 'object') {
        return (
          <div className='array-value'>
            {
              data.map((datum, index) => (
                <div key={index}>
                  {datum as string}
                </div>
              ))
            }
          </div>
        );
      } else {
        return (
          <div className='array-value'>
            <div className='__label'>[</div>
            {data.map((datum, index) => (
              <React.Fragment key={index}>
                {renderData(datum, needFilter)}
              </React.Fragment>
            ))}
            <div className='__label'>]</div>
          </div>
        );
      }
    }

    if (typeof data !== 'object') {
      const raw = data as string;

      return isAscii(raw) ? u8aToString(u8aUnwrapBytes(raw)) : raw;
    } else {
      return (
        <>
          {
            Object.entries(data as object).map(([key, datum], index) => {
              const isLeaf = checkIsLeaf(datum);

              if (needFilter && key.toLowerCase() !== 'message') {
                return null;
              }

              const RenderComponent = isLeaf ? MetaInfo.Data : MetaInfo.Default;

              return (
                <RenderComponent
                  {...{ labelAlign: 'top' }}
                  className={CN('node', { 'node-leaf': isLeaf })}
                  key={index}
                  label={key}
                >
                  {renderData(datum)}
                </RenderComponent>
              );
            })
          }
        </>
      );
    }
  }, []);

  const handlerRenderV1 = useCallback((data: SignTypedDataObjectV1[]) => {
    return (
      <>
        {
          data.map((value, index) => {
            return (
              <MetaInfo.Default
                className='node-leaf right'
                key={index}
                label={value.name}
                labelAlign='top'
              >
                {value.value as string}
              </MetaInfo.Default>
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
        return (
          <MetaInfo.Data label={t('Raw data')}>
            {renderData(rawData, true)}
          </MetaInfo.Data>
        );
      case 'eth_signTypedData_v1':
      case 'eth_signTypedData':
        return (
          <MetaInfo.Data label={t('Raw data')}>
            {handlerRenderV1(rawData as unknown as SignTypedDataObjectV1[])}
          </MetaInfo.Data>
        );
      default:
        return (
          <MetaInfo.Data
            label={t('Message')}
          >
            {renderData(rawData)}
          </MetaInfo.Data>
        );
    }
  }, [renderData, rawData, type, handlerRenderV1, t]);

  return (
    <div className={CN(className)}>
      <MetaInfo>
        {
          signMethod && (
            <MetaInfo.DisplayType
              label={t('Sign method')}
              typeName={signMethod}
            />
          )
        }
        {handlerRenderContent()}
      </MetaInfo>
    </div>
  );
};

const EvmMessageDetail = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {
    display: 'flex',
    flexDirection: 'column',
    gap: token.size,

    '.__label': {
      fontFamily: token.fontFamily
    },

    '.node': {
      overflow: 'hidden',
      position: 'relative',
      marginLeft: token.marginXS
    },

    '.node-leaf': {
      '.-to-right': {
        marginTop: '0 !important',
        width: '100%',
        overflow: 'hidden',
        maxWidth: token.controlHeightLG * 5,
        flex: 2
      },

      '&.right': {
        '.-to-right': {
          textAlign: 'right'
        }
      },

      '.__value': {
        overflow: 'hidden',
        width: '100%'
      }
    },

    '.array-value': {
      display: 'flex',
      flexDirection: 'column',
      gap: token.sizeSM
    }
  };
});

export default EvmMessageDetail;
