// Copyright 2019-2022 @subwallet/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ConfirmationsQueue, NetworkJson } from '@subwallet/extension-base/background/KoniTypes';
import { AccountInfoEl } from '@subwallet/extension-koni-ui/components';
import FormatBalance from '@subwallet/extension-koni-ui/components/FormatBalance';
import useTranslation from '@subwallet/extension-koni-ui/hooks/useTranslation';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import React from 'react';
import styled from 'styled-components';

import { BN } from '@polkadot/util';

interface Props extends ThemeProps {
  className?: string;
  network?: NetworkJson,
  confirmation: ConfirmationsQueue['evmSendTransactionRequest'][0];
}

function SendEvmTransactionConfirmationInfo ({ className, confirmation: { payload }, network }: Props): React.ReactElement {
  const { t } = useTranslation();
  const transaction = payload;

  return <div className={className}>
    <div className='network-wrapper'>
      {transaction?.to && <div>
        <AccountInfoEl
          address={transaction.to}
          addressHalfLength={20}
          className='to-account'
          iconSize={20}
          isShowAddress={true}
          isShowBanner={false}
          name={t<string>('Received Account / Contract Address')}
          showCopyBtn={true}
        />
      </div>}
      <div>
        <span className='label'>{t<string>('Amount')}</span><span className='value'>
          <FormatBalance
            format={[network?.decimals || 18, '']}
            value={new BN(transaction?.value as string || '0')}
          />&nbsp;{network?.nativeToken}
        </span>
      </div>
      {transaction?.data && <div>
        <span className='label'>{t<string>('Data')}</span><span className='value'>{transaction?.data}</span>
      </div>}
      {transaction?.estimateGas && <div>
        <span className='label'>{t<string>('Estimate Gas')}</span><span className='value'>
          <FormatBalance
            format={[(network?.decimals || 18) - 3, '']}
            value={new BN(transaction?.estimateGas || '0')}
          />&nbsp;{network?.nativeToken && `mili${network?.nativeToken}`}
        </span>
      </div>}
    </div>
  </div>;
}

export default styled(SendEvmTransactionConfirmationInfo)(({ theme }: Props) => `  
  .network-wrapper {
    width: 100%;  
  }
  
  .from-account, .to-account {
    .account-info-full-address, .account-info__name {
      max-width: none;
    }
    
    .account-info-row {
      height: 54px;
      margin-bottom: 8px;
    }  
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
