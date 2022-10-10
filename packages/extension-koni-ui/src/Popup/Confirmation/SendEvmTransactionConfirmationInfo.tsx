// Copyright 2019-2022 @subwallet/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ConfirmationsQueue, CustomTokenType, EVMTransactionArg, NetworkJson, ResponseParseEVMTransactionInput } from '@subwallet/extension-base/background/KoniTypes';
import { AccountInfoEl } from '@subwallet/extension-koni-ui/components';
import FormatBalance from '@subwallet/extension-koni-ui/components/FormatBalance';
import useTranslation from '@subwallet/extension-koni-ui/hooks/useTranslation';
import { parseEVMTransactionInput, validateCustomToken } from '@subwallet/extension-koni-ui/messaging';
import { RootState } from '@subwallet/extension-koni-ui/stores';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import CN from 'classnames';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import { BN } from '@polkadot/util';

interface Props extends ThemeProps {
  className?: string;
  network?: NetworkJson,
  confirmation: ConfirmationsQueue['evmSendTransactionRequest'][0];
}

const XCM_METHOD = 'transfer(address,uint256,(uint8,bytes[]),uint64)';
const XCM_ARGS = ['currency_address', 'amount'];

interface XCMTokenProps {
  symbol: string;
  decimals: number;
}

enum TAB_SELECTION_TYPE {
  BASIC,
  HEX,
  DETAIL
}

interface TabOptionProps {
  key: TAB_SELECTION_TYPE;
  label: string;
}

function SendEvmTransactionConfirmationInfo ({ className, confirmation: { payload }, network }: Props): React.ReactElement {
  const { t } = useTranslation();
  const transaction = payload;

  const { chainRegistry: chainRegistryMap } = useSelector((state: RootState) => state);

  const [inputInfo, setInputInfo] = useState<ResponseParseEVMTransactionInput | null>(null);
  const [XCMToken, setXCMToken] = useState<XCMTokenProps | null>(null);

  const [selectedTab, setSelectedTab] = useState<TAB_SELECTION_TYPE>(TAB_SELECTION_TYPE.BASIC);

  const isXCMTransaction = useMemo((): boolean => {
    if (!inputInfo) {
      return false;
    }

    const info = inputInfo.result;

    if (typeof info === 'string') {
      return false;
    }

    const argName = info.args.map((i) => i.name);

    return XCM_METHOD === info.methodName && XCM_ARGS.every((s) => argName.includes(s));
  }, [inputInfo]);

  const handlerChangeTab = useCallback((value: TAB_SELECTION_TYPE) => {
    return () => setSelectedTab(value);
  }, []);

  const handlerRenderArg = useCallback((data: EVMTransactionArg, parentName: string, isXCMTransaction: boolean): JSX.Element => {
    const { children, name, value } = data;
    const _name = (parentName ? `${parentName}.` : '') + name;

    let _value: string = value;

    if (children) {
      return (
        <React.Fragment key={parentName}>
          {
            children.map((child) => handlerRenderArg(child, name, false))
          }
        </React.Fragment>
      );
    }

    if (isXCMTransaction && XCMToken && XCMToken.decimals) {
      if (name === 'amount') {
        _value = `${(parseInt(value) / (10 ** XCMToken.decimals))} (${XCMToken.symbol})`;
      } else if (name === 'currency_address') {
        _value = `${value} (${XCMToken.symbol})`;
      }
    }

    return (
      <div
        className='arg-detail'
        key={_name}
      >
        <div className='arg-name'>
          {_name}:
        </div>
        <div className='arg-value'>
          {_value}
        </div>
      </div>
    );
  }, [XCMToken]);

  const handlerRenderInputInfo = useCallback((response: ResponseParseEVMTransactionInput) => {
    const info = response.result;

    if (typeof info === 'string') {
      return (
        <>
          <div className='label'>{t<string>('Data')}</div>
          <div className='value'>{info}</div>
        </>
      );
    }

    const argName = info.args.map((i) => i.name);
    const isXCMTransaction = XCM_METHOD === info.methodName && XCM_ARGS.every((s) => argName.includes(s));

    return (
      <div className='info-container'>
        <div className='method-name'>
          <div className='title'>
            Method
          </div>
          <div className='value'>
            {info.methodName}
          </div>
        </div>
        <div className='method-name'>
          <div className='title'>
            Arguments
          </div>
          <div>
            {
              info.args.map((value) => handlerRenderArg(value, '', isXCMTransaction))
            }
          </div>
        </div>
      </div>
    );
  }, [handlerRenderArg, t]);

  const handlerRenderTab = useCallback((): React.ReactNode => {
    const arr: TabOptionProps[] = [
      {
        key: TAB_SELECTION_TYPE.BASIC,
        label: 'Info'
      }
    ];

    if (transaction.data) {
      arr.push({
        key: TAB_SELECTION_TYPE.HEX,
        label: 'Hex data'
      });
    }

    if (inputInfo && typeof inputInfo.result !== 'string') {
      arr.push({
        key: TAB_SELECTION_TYPE.DETAIL,
        label: 'Detail'
      });
    }

    if (arr.length > 1) {
      return (
        <div className='tabs-container'>
          {arr.map((item) => {
            const isSelected = selectedTab === item.key;

            return (
              <div
                className={CN(
                  'tab-item',
                  {
                    selected: isSelected
                  }
                )}
                key={item.key}
                onClick={handlerChangeTab(item.key)}
              >
                {item.label}
              </div>
            );
          })}
        </div>
      );
    } else {
      return null;
    }
  }, [handlerChangeTab, inputInfo, transaction.data, selectedTab]);

  const handlerRenderContent = useCallback(() => {
    switch (selectedTab) {
      case TAB_SELECTION_TYPE.DETAIL:
        if (!inputInfo || typeof inputInfo.result === 'string') {
          return null;
        }

        return handlerRenderInputInfo(inputInfo);
      case TAB_SELECTION_TYPE.HEX:
        if (!transaction.data) {
          return null;
        }

        return (
          <>
            <div className='label'>{t<string>('Data')}</div>
            <div className='value'>{transaction?.data}</div>
          </>
        );
      case TAB_SELECTION_TYPE.BASIC:
      default:
        return (
          <>
            {
              transaction.value && (
                <div>
                  <span className='label'>{t<string>('Amount')}</span>
                  <span className='value'>
                    <FormatBalance
                      format={[network?.decimals || 18, '']}
                      value={new BN(transaction.value as string | number | Uint8Array | BN | number[] | Buffer || '0')}
                    />&nbsp;{network?.nativeToken}
                  </span>
                </div>
              )
            }
            {
              transaction?.estimateGas && (
                <div>
                  <span className='label'>{t<string>('Estimate Gas')}</span>
                  <span className='value'>
                    <FormatBalance
                      format={[(network?.decimals || 18) - 3, '']}
                      value={new BN(transaction?.estimateGas || '0')}
                    />&nbsp;{network?.nativeToken && `mili${network?.nativeToken}`}
                  </span>
                </div>
              )
            }
          </>
        );
    }
  }, [handlerRenderInputInfo, inputInfo, network, selectedTab, t, transaction]);

  useEffect(() => {
    setSelectedTab(TAB_SELECTION_TYPE.BASIC);
  }, [network, transaction]);

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

  useEffect(() => {
    let amount = true;

    const unsub = () => {
      amount = false;
    };

    if (network?.key && inputInfo && isXCMTransaction) {
      const chain = network.key;
      const chainRegistry = chainRegistryMap[chain];
      const info = inputInfo.result;

      if (typeof info === 'string' || !chainRegistry) {
        setXCMToken(null);

        return unsub;
      }

      const contract = info.args.find((i) => i.name === 'currency_address')?.value;

      if (!contract) {
        setXCMToken(null);

        return unsub;
      }

      let xcmToken: XCMTokenProps | null = null;

      for (const token of Object.values(chainRegistry.tokenMap)) {
        if (token.contractAddress?.toLowerCase() === contract.toLowerCase()) {
          xcmToken = {
            symbol: token.symbol,
            decimals: token.decimals
          };

          break;
        }
      }

      if (!xcmToken) {
        validateCustomToken({ smartContract: contract, type: CustomTokenType.erc20, chain })
          .then((token) => {
            if (token.decimals && amount) {
              xcmToken = { symbol: token.symbol, decimals: token.decimals };
              setXCMToken(xcmToken);
            }
          })
          .catch((error) => {
            setXCMToken(null);
            console.log((error as Error).message);
          });
      } else {
        setXCMToken(xcmToken);
      }
    } else {
      setXCMToken(null);
    }

    return unsub;
  }, [chainRegistryMap, inputInfo, isXCMTransaction, network?.key]);

  return <div className={className}>
    <div className='network-wrapper'>
      {
        transaction?.to && (
          <div>
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
          </div>
        )
      }
      { handlerRenderTab() }
      { handlerRenderContent() }
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
    .method-name {
      .title {
        font-weight: bold;
      }

      .value {
      }
    }

    .arg-detail {

      .arg-name {
        font-weight: 400;
      }

      .arg-value {
        color: ${theme.textColor2};
        white-space: pre-line;
        word-break: break-word;
        font-size: 14px;
      }
    }
  }

  .tabs-container {
    display: flex;
    padding: 10px 0;

    .tab-item {
      color: ${theme.textColor2};
      cursor: pointer;
      padding: 5px 15px;
      border: 1px solid ${theme.boxBorderColor};
      border-left-width: 0;
      position: relative;

      &.selected {
        color: ${theme.textColor3};
        border-color: ${theme.textColor3} !important;

        &:not(:first-child):before {
          position: absolute;
          top: -1px;
          left: -1px;
          display: block;
          box-sizing: content-box;
          width: 1px;
          height: 100%;
          padding: 1px 0;
          background-color: ${theme.textColor3};
          content: "";
        }
      }

      &:first-child {
        border-left-width: 1px;
      }
    }
  }
`);
