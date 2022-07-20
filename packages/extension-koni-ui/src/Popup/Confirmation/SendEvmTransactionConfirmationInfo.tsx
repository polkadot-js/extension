// Copyright 2019-2022 @subwallet/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ConfirmationsQueue, EVMTransactionArg, NetworkJson, ResponseParseEVMTransactionInput } from '@subwallet/extension-base/background/KoniTypes';
import { AccountInfoEl } from '@subwallet/extension-koni-ui/components';
import FormatBalance from '@subwallet/extension-koni-ui/components/FormatBalance';
import useTranslation from '@subwallet/extension-koni-ui/hooks/useTranslation';
import { parseEVMTransactionInput } from '@subwallet/extension-koni-ui/messaging';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import React, { useCallback, useEffect, useState } from 'react';
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

  const [inputInfo, setInputInfo] = useState<ResponseParseEVMTransactionInput|null>(null);

  useEffect(() => {
    let amount = true;

    if (payload.data && payload.to && network?.evmChainId) {
      parseEVMTransactionInput({
        data: payload.data,
        chainId: network?.evmChainId,
        contract: payload.to
      }).then((result) => {
        if (amount) {
          setInputInfo(result);
        }
      }).catch((error) => {
        setInputInfo(null);
        console.log((error as Error).message);
      });
    } else {
      setInputInfo(null);
    }

    return () => {
      amount = false;
    };
  }, [payload, network?.evmChainId]);

  const handlerRenderArg = useCallback((data: EVMTransactionArg, parentName: string): JSX.Element => {
    const { children, name, value } = data;

    if (children) {
      return (
        <>
          {
            children.map((child) => handlerRenderArg(child, name))
          }
        </>
      );
    }

    return (
      <tr className='arg-detail'>
        <td className='arg-name'>
          {parentName && `${parentName}.`}{name}
        </td>
        <td className='arg-value'>
          {value}
        </td>
      </tr>
    );
  }, []);

  const handlerRenderInputInfo = useCallback((response: ResponseParseEVMTransactionInput) => {
    const info = response.result;

    if (typeof info === 'string') {
      return (
        <div>
          <span className='label'>{t<string>('Data')}</span><span className='value'>{info}</span>
        </div>
      );
    }

    return (
      <div className='info-container'>
        <div className='title'>
          Data
        </div>
        <div className='method-name'>
          <div className='title'>
            Method
          </div>
          <div className='value'>
            {info.method}
          </div>
        </div>
        <table>
          {
            info.args.map((value) => handlerRenderArg(value, ''))
          }
        </table>
      </div>
    );
  }, [handlerRenderArg, t]);

  return <div className={className}>
    <div className='network-wrapper'>
      {transaction?.to && <div>
        <AccountInfoEl
          address={transaction.to}
          addressHalfLength={20}
          className='to-account'
          genesisHash={network?.genesisHash}
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
      {transaction?.data && !inputInfo && <div>
        <span className='label'>{t<string>('Data')}</span><span className='value'>{transaction?.data}</span>
      </div>}
      {inputInfo && handlerRenderInputInfo(inputInfo)}
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
    white-space: pre-line;
    word-break: break-word;
  }
  .format-balance {
    display: inline-block;
  }

  .info-container {
    .title {

    }

    .method-name {
      display: flex;

      .value {
        margin-left: 4px;
      }
    }

    .arg-detail {

      .arg-name {
        vertical-align: top;
      }

      .arg-value {
        color: ${theme.textColor2};
        white-space: pre-line;
        word-break: break-word;
        vertical-align: top;
      }
    }
  }
`);
