// Copyright 2019-2022 @subwallet/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ConfirmationsQueue } from '@subwallet/extension-base/background/KoniTypes';
import FormatBalance from '@subwallet/extension-koni-ui/components/FormatBalance';
import useTranslation from '@subwallet/extension-koni-ui/hooks/useTranslation';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import React from 'react';
import styled from 'styled-components';

import { BN } from '@polkadot/util';

interface Props extends ThemeProps {
  className?: string;
  confirmation: ConfirmationsQueue['evmSendTransactionRequest'][0];
}

function SendEvmTransactionConfirmationInfo ({ className, confirmation: { payload } }: Props): React.ReactElement {
  const { t } = useTranslation();
  const transaction = payload;

  return <div className={className}>
    <div className='network-wrapper'>
      <div>
        <span className='label'>{t<string>('From')}</span><span className='value'>{transaction?.from}</span>
      </div>
      <div>
        <span className='label'>{t<string>('To')}</span><span className='value'>{transaction?.to}</span>
      </div>
      <div>
        <span className='label'>{t<string>('Amount')}</span><span className='value'>
          <FormatBalance
            format={[18, '']}
            value={new BN(transaction?.value as string || '0')}
          />
        </span>
      </div>
      <div>
        <span className='label'>{t<string>('Data')}</span><span className='value'>{transaction?.data}</span>
      </div>
    </div>
  </div>;
}

export default styled(SendEvmTransactionConfirmationInfo)(({ theme }: Props) => `
  height: 100%;
  display: flex;
  flex-direction: row;
  position: relative;
  
  .network-wrapper {
    width: 100%;  
  }
  
  .label {
    font-weight: bold;
    padding-right: 8px;
  }
  .value {
    color: #7B8098;
  }
  .format-balance {
  display: inline-block;
  }
`);
