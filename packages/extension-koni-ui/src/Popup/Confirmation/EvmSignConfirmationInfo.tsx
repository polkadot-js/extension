// Copyright 2019-2022 @subwallet/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ConfirmationsQueue } from '@subwallet/extension-base/background/KoniTypes';
import useTranslation from '@subwallet/extension-koni-ui/hooks/useTranslation';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import React from 'react';
import styled from 'styled-components';

interface Props extends ThemeProps {
  className?: string;
  confirmation: ConfirmationsQueue['evmSignatureRequest'][0];
}

function EvmSignConfirmationInfo ({ className, confirmation: { payload } }: Props): React.ReactElement {
  const { t } = useTranslation();
  const transaction = payload;

  return <div className={className}>
    <div className='signature-wrapper'>
      <div>
        <span className='label'>{t<string>('Type')}</span><span className='value'>{transaction.type}</span>
      </div>
      <div>
        <span className='label'>{t<string>('Address')}</span><span className='value'>{transaction.address}</span>
      </div>
      <div>
        <span className='label'>{t<string>('Raw')}</span><span className='pre-wrap'>
          {typeof transaction.payload === 'string' ? transaction.payload : JSON.stringify(transaction.payload, null, 2)}
        </span>
      </div>
    </div>
  </div>;
}

export default styled(EvmSignConfirmationInfo)(({ theme }: Props) => `
  height: 100%;
  display: flex;
  flex-direction: row;
  position: relative;
  
  .signature-wrapper {
    width: 100%;  
  }
  
  .label {
    font-weight: bold;
    padding-right: 8px;
  }
  .value {
    color: #7B8098;
  }
  
  .pre-wrap {
    color: #7B8098;
    display: block;
    white-space: pre-wrap;
  }
`);
