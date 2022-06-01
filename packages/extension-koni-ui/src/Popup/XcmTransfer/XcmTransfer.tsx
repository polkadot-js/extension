// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ChainRegistry, DropdownTransformOptionType, NetworkJson } from '@subwallet/extension-base/background/KoniTypes';
import { SupportedCrossChainsMap } from '@subwallet/extension-koni-base/api/supportedCrossChains';
import { AccountContext, ActionContext, Button, Warning } from '@subwallet/extension-koni-ui/components';
import InputBalance from '@subwallet/extension-koni-ui/components/InputBalance';
import LoadingContainer from '@subwallet/extension-koni-ui/components/LoadingContainer';
import ReceiverInputAddress from '@subwallet/extension-koni-ui/components/ReceiverInputAddress';
import { useTranslation } from '@subwallet/extension-koni-ui/components/translate';
import { BalanceFormatType, XcmTransferInputAddressType } from '@subwallet/extension-koni-ui/components/types';
import useFreeBalance from '@subwallet/extension-koni-ui/hooks/screen/sending/useFreeBalance';
import { checkCrossChainTransfer } from '@subwallet/extension-koni-ui/messaging';
import Header from '@subwallet/extension-koni-ui/partials/Header';
import SendFundResult from '@subwallet/extension-koni-ui/Popup/Sending/SendFundResult';
import { getAuthTransactionFeeInfo, getBalanceFormat, getDefaultAddress, getMainTokenInfo } from '@subwallet/extension-koni-ui/Popup/Sending/utils';
import AuthTransaction from '@subwallet/extension-koni-ui/Popup/XcmTransfer/AuthTransaction';
import BridgeInputAddress from '@subwallet/extension-koni-ui/Popup/XcmTransfer/BridgeInputAddress';
import Dropdown from '@subwallet/extension-koni-ui/Popup/XcmTransfer/XcmDropdown/Dropdown';
import { RootState } from '@subwallet/extension-koni-ui/stores';
import { ThemeProps, TransferResultType } from '@subwallet/extension-koni-ui/types';
import React, { useCallback, useContext, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import { BN, BN_ZERO } from '@polkadot/util';
import { isEthereumAddress } from '@polkadot/util-crypto';

import arrowRight from '../../assets/arrow-right.svg';

interface Props extends ThemeProps {
  className?: string,
}

interface ContentProps extends ThemeProps {
  className?: string;
  defaultValue: XcmTransferInputAddressType;
  networkMap: Record<string, NetworkJson>;
  chainRegistryMap: Record<string, ChainRegistry>;
  originChainOptions: DropdownTransformOptionType[];
  firstOriginChain: string;
}

function getDestinationChainOptions (originChain: string, networkMap: Record<string, NetworkJson>) {
  return Object.keys(SupportedCrossChainsMap[originChain].relationMap).map((key) => ({ label: networkMap[key].chain, value: key }));
}

function getSupportedTokens (originChain: string, destinationChain: string): string[] {
  return SupportedCrossChainsMap[originChain].relationMap[destinationChain].supportedToken;
}

function Wrapper ({ className = '', theme }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const { accounts } = useContext(AccountContext);
  const { chainRegistry: chainRegistryMap,
    currentAccount: { account },
    networkMap } = useSelector((state: RootState) => state);
  const originChainOptions = Object.keys(SupportedCrossChainsMap).map((key) => ({ label: networkMap[key].chain, value: key }));
  const firstOriginChain = originChainOptions[0].value;
  const destinationChainList = Object.keys(SupportedCrossChainsMap[firstOriginChain].relationMap);
  let defaultValue;

  if (account) {
    defaultValue = {
      address: getDefaultAddress(account.address, accounts),
      token: SupportedCrossChainsMap[firstOriginChain].relationMap[destinationChainList[0]].supportedToken[0]
    };
  } else {
    defaultValue = null;
  }

  return (
    <div className={className}>
      <Header
        isShowNetworkSelect={false}
        showAdd
        showCancelButton
        showSearch
        showSettings
        showSubHeader
        subHeaderName={t<string>('XCM Transfer')}
      />
      {accounts && accounts.length && account && defaultValue
        ? (
          <XcmTransfer
            chainRegistryMap={chainRegistryMap}
            className='bridge-container'
            defaultValue={defaultValue}
            firstOriginChain={firstOriginChain}
            networkMap={networkMap}
            originChainOptions={originChainOptions}
            theme={theme}
          />
        )
        : (<LoadingContainer />)
      }
    </div>
  );
}

function XcmTransfer ({ chainRegistryMap, className, defaultValue, firstOriginChain, networkMap, originChainOptions }: ContentProps): React.ReactElement {
  const { t } = useTranslation();
  const [isShowTxModal, setShowTxModal] = useState<boolean>(false);
  const [recipientId, setRecipientId] = useState<string | null>(null);
  const [amount, setAmount] = useState<BN | undefined>(BN_ZERO);
  const [originChain, setOriginChain] = useState<string>(firstOriginChain);
  const [{ address: senderId,
    token: selectedToken }, setSenderValue] = useState<XcmTransferInputAddressType>(defaultValue);
  const onAction = useContext(ActionContext);
  const [[fee, feeSymbol], setFeeInfo] = useState<[string | null, string | null | undefined]>([null, null]);
  const senderFreeBalance = useFreeBalance(originChain, senderId, selectedToken);
  const recipientFreeBalance = useFreeBalance(originChain, recipientId, selectedToken);
  const [txResult, setTxResult] = useState<TransferResultType>({ isShowTxResult: false, isTxSuccess: false });
  const { isShowTxResult } = txResult;
  const balanceFormat: BalanceFormatType | null = chainRegistryMap[originChain] && networkMap[originChain].active
    ? getBalanceFormat(originChain, selectedToken, chainRegistryMap)
    : null;
  const mainTokenInfo = chainRegistryMap[originChain] && networkMap[originChain].active ? getMainTokenInfo(originChain, chainRegistryMap) : null;
  const feeDecimal: number | null = feeSymbol && (chainRegistryMap[originChain] && networkMap[originChain].active)
    ? feeSymbol === selectedToken && balanceFormat
      ? balanceFormat[0]
      : getBalanceFormat(originChain, feeSymbol, chainRegistryMap)[0]
    : null;
  const valueToTransfer = amount?.toString() || '0';
  const defaultDestinationChainOptions = getDestinationChainOptions(firstOriginChain, networkMap);
  const [[selectedDestinationChain, destinationChainOptions], setDestinationChain] = useState<[string, DropdownTransformOptionType[]]>([defaultDestinationChainOptions[0].value, defaultDestinationChainOptions]);
  const tokenList = getSupportedTokens(originChain, selectedDestinationChain).map((token) => (
    {
      label: token,
      value: token,
      networkKey: originChain,
      networkName: networkMap[originChain].chain
    }
  ));
  const checkOriginalChainAndSenderIdType = !!networkMap[originChain].isEthereum !== isEthereumAddress(senderId);
  const checkDestinationChainAndReceiverIdType = recipientId && !!networkMap[selectedDestinationChain].isEthereum !== isEthereumAddress(recipientId);
  const amountGtAvailableBalance = amount && senderFreeBalance && amount.gt(new BN(senderFreeBalance));
  const canMakeTransfer = checkOriginalChainAndSenderIdType ||
    checkDestinationChainAndReceiverIdType ||
    !valueToTransfer ||
    !recipientId ||
    !!amountGtAvailableBalance;

  useEffect(() => {
    let isSync = true;

    if (recipientId) {
      checkCrossChainTransfer({
        originalNetworkKey: originChain,
        destinationNetworkKey: selectedDestinationChain,
        from: senderId,
        to: recipientId,
        token: selectedToken,
        value: valueToTransfer
      }).then((value) => {
        if (isSync) {
          if (value.estimateFee) {
            setFeeInfo([value.estimateFee, value.feeSymbol]);
          } else {
            setFeeInfo([null, value.feeSymbol]);
          }
        }
      }).catch((e) => console.log('err--------', e));
    }

    return () => {
      isSync = false;
    };
  }, [recipientId, valueToTransfer, selectedToken, senderId, selectedDestinationChain, originChain]);

  const _onCancel = useCallback(
    () => {
      window.localStorage.setItem('popupNavigation', '/');
      onAction('/');
    },
    [onAction]
  );
  const _onTransfer = useCallback(() => {
    setShowTxModal(true);
  }, []);

  const _onChangeResult = useCallback((txResult: TransferResultType) => {
    setTxResult(txResult);
    setShowTxModal(false);
  }, []);

  const _onCancelTx = useCallback(() => {
    setShowTxModal(false);
  }, []);

  const _onResend = useCallback(() => {
    setTxResult({
      isTxSuccess: false,
      isShowTxResult: false,
      txError: undefined
    });
    setSenderValue({ address: senderId, token: selectedToken });
    setRecipientId(null);
  },
  // eslint-disable-next-line react-hooks/exhaustive-deps
  [
    originChain,
    selectedToken,
    senderId
  ]);

  const _onChangeOriginChain = useCallback((originChain: string) => {
    const destinationChainOptions = getDestinationChainOptions(originChain, networkMap);

    setOriginChain(originChain);
    setDestinationChain([destinationChainOptions[0].value, destinationChainOptions]);
    setSenderValue((prev) => {
      const newVal = {
        ...prev,
        token: getSupportedTokens(originChain, destinationChainOptions[0].value)[0]
      };

      return newVal;
    });
  }, [networkMap]);

  const _onChangeDestinationChain = useCallback((chain: string) => {
    setDestinationChain((prev) => {
      return [chain, prev[1]];
    });
  }, []);

  return (
    <>
      {!isShowTxResult
        ? (
          <div className={className}>
            <div className='bridge__chain-selector-area'>
              <Dropdown
                className='bridge__chain-selector'
                isDisabled={false}
                label={'Original Chain'}
                onChange={_onChangeOriginChain}
                options={originChainOptions}
                value={originChain}
              />

              <div className='bridge__chain-swap'>
                <img
                  alt='Icon'
                  src={arrowRight}
                />
              </div>

              <Dropdown
                className='bridge__chain-selector'
                isDisabled={false}
                label={'Destination Chain'}
                onChange={_onChangeDestinationChain}
                options={destinationChainOptions}
                value={selectedDestinationChain}
              />
            </div>

            {balanceFormat
              ? <>
                <BridgeInputAddress
                  balance={senderFreeBalance}
                  balanceFormat={balanceFormat}
                  chainRegistryMap={chainRegistryMap}
                  className=''
                  initValue={{
                    address: senderId,
                    token: selectedToken
                  }}
                  networkKey={originChain}
                  networkMap={networkMap}
                  onChange={setSenderValue}
                  options={tokenList}
                />

                <ReceiverInputAddress
                  balance={recipientFreeBalance}
                  balanceFormat={balanceFormat}
                  className={''}
                  inputAddressHelp={t<string>('The account you want to transfer to.')}
                  inputAddressLabel={t<string>('Destination Account')}
                  networkKey={originChain}
                  networkMap={networkMap}
                  onchange={setRecipientId}
                />

                <InputBalance
                  autoFocus
                  className={'bridge-amount-input'}
                  decimals={balanceFormat[0]}
                  help={t<string>('Type the amount you want to transfer. Note that you can select the unit on the right e.g sending 1 milli is equivalent to sending 0.001.')}
                  isError={false}
                  isZeroable
                  label={t<string>('amount')}
                  onChange={setAmount}
                  placeholder={'0'}
                  siSymbol={balanceFormat[2] || balanceFormat[1]}
                />

                {checkOriginalChainAndSenderIdType &&
                <Warning
                  className='xcm-transfer-warning'
                  isDanger
                >
                  {t<string>(`Original account must be ${networkMap[originChain].isEthereum ? 'EVM' : 'substrate'} type`)}
                </Warning>
                }

                {checkDestinationChainAndReceiverIdType &&
                <Warning
                  className='xcm-transfer-warning'
                  isDanger
                >
                  {t<string>(`Destination account must be ${networkMap[selectedDestinationChain].isEthereum ? 'EVM' : 'substrate'} type`)}
                </Warning>
                }

                {amountGtAvailableBalance && (
                  <Warning
                    className={'send-fund-warning'}
                    isDanger
                  >
                    {t<string>('The amount you want to transfer is greater than your available balance.')}
                  </Warning>
                )}
              </>
              : <Warning className='xcm-transfer-warning'>
                {t<string>('To perform the transaction, please make sure the selected network in Original Chain is activated first.')}
              </Warning>
            }

            <div className='bridge-button-container'>
              <Button
                className='bridge-button'
                onClick={_onCancel}
              >
                <span>
                  {t<string>('Cancel')}
                </span>
              </Button>

              <Button
                className='bridge-button'
                isDisabled={canMakeTransfer}
                onClick={_onTransfer}
              >
                <span>
                  {t<string>('Transfer')}
                </span>
              </Button>
            </div>

            {isShowTxModal && mainTokenInfo && (
              <AuthTransaction
                balanceFormat={balanceFormat}
                destinationChainOptions={destinationChainOptions}
                feeInfo={getAuthTransactionFeeInfo(fee, feeDecimal, feeSymbol, mainTokenInfo, chainRegistryMap[originChain].tokenMap)}
                networkMap={networkMap}
                onCancel={_onCancelTx}
                onChangeResult={_onChangeResult}
                originChainOptions={originChainOptions}
                requestPayload={{
                  from: senderId,
                  to: recipientId,
                  originalNetworkKey: originChain,
                  destinationNetworkKey: selectedDestinationChain,
                  value: valueToTransfer,
                  token: selectedToken
                }}
              />
            )}
          </div>
        )
        : (
          <SendFundResult
            networkKey={originChain}
            onResend={_onResend}
            txResult={txResult}
          />
        )
      }
    </>
  );
}

export default React.memo(styled(Wrapper)(({ theme }: Props) => `
  display: flex;
  flex: 1;
  overflow-y: auto;
  flex-direction: column;

  .sub-header__cancel-btn {
    display: none;
  }

  .bridge-container {
    padding: 10px 22px 15px;
    flex: 1;
    overflow-y: auto;
  }

  .bridge-amount-input {
    margin-bottom: 10px;
    margin-top: 15px;
  }

  .bridge__chain-selector-area {
    display: flex;
    align-items: center;
    flex-wrap: nowrap;
    margin-bottom: 15px;
  }

  .bridge__chain-swap {
    min-width: 40px;
    width: 40px;
    height: 40px;
    border-radius: 40%;
    border: 2px solid ${theme.buttonBorderColor};
    display: flex;
    justify-content: center;
    align-items: center;
    margin: 30px 12px 0;
  }

  .bridge-button-container {
    display: flex;
    position: sticky;
    bottom: -15px;
    padding: 15px 22px;
    margin-left: -22px;
    margin-bottom: -15px;
    margin-right: -22px;
    background-color: ${theme.background};
  }

  .bridge__chain-selector {
    flex: 1;
  }

  .bridge__chain-selector .label-wrapper {
    margin-bottom: 5px;
  }

  .bridge__chain-selector label {
    font-size: 15px;
    text-transform: none;
    color: ${theme.textColor};
    line-height: 26px;
    font-weight: 500;
  }

  .bridge-button {
    flex: 1;
  }

  .bridge-button:first-child {
    background-color: ${theme.buttonBackground1};
    margin-right: 8px;

    span {
      color: ${theme.buttonTextColor2};
    }
  }

  .bridge-button:last-child {
    margin-left: 8px;
  }

  .xcm-transfer-warning {
    margin-bottom: 10px;
  }
`));
