// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ChainRegistry, NetworkJson } from '@subwallet/extension-base/background/KoniTypes';
import { SupportedCrossChainsMap } from '@subwallet/extension-koni-base/api/supportedCrossChains';
import { AccountContext, Button } from '@subwallet/extension-koni-ui/components';
import InputBalance from '@subwallet/extension-koni-ui/components/InputBalance';
import LoadingContainer from '@subwallet/extension-koni-ui/components/LoadingContainer';
import ReceiverInputAddress from '@subwallet/extension-koni-ui/components/ReceiverInputAddress';
import Toggle from '@subwallet/extension-koni-ui/components/Toggle';
import { useTranslation } from '@subwallet/extension-koni-ui/components/translate';
import { BalanceFormatType, SenderInputAddressType } from '@subwallet/extension-koni-ui/components/types';
import useFreeBalance from '@subwallet/extension-koni-ui/hooks/screen/sending/useFreeBalance';
import { transferCheckSupporting } from '@subwallet/extension-koni-ui/messaging';
import Header from '@subwallet/extension-koni-ui/partials/Header';
import AuthTransaction from '@subwallet/extension-koni-ui/Popup/Bridge/AuthTransaction';
import BridgeInputAddress from '@subwallet/extension-koni-ui/Popup/Bridge/BridgeInputAddress';
import Dropdown from '@subwallet/extension-koni-ui/Popup/Bridge/XcmDropdown/Dropdown';
import { getBalanceFormat, getDefaultValue, getMainTokenInfo, getMaxTransferAndNoFees } from '@subwallet/extension-koni-ui/Popup/Sending/utils';
import { RootState } from '@subwallet/extension-koni-ui/stores';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import React, { useCallback, useContext, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import { BN, BN_ZERO } from '@polkadot/util';

import arrowRight from '../../assets/arrow-right.svg';

interface Props extends ThemeProps {
  className?: string,
}

interface ContentProps extends ThemeProps {
  className?: string;
  defaultValue: SenderInputAddressType;
  networkMap: Record<string, NetworkJson>;
  chainRegistryMap: Record<string, ChainRegistry>;
}

function Wrapper ({ className = '', theme }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const { accounts } = useContext(AccountContext);
  const { chainRegistry: chainRegistryMap,
    currentAccount: { account },
    currentNetwork: { isReady: isCurrentNetworkInfoReady, networkKey },
    networkMap } = useSelector((state: RootState) => state);

  const defaultValue = getDefaultValue(networkKey, !!isCurrentNetworkInfoReady, account?.address, chainRegistryMap, accounts);

  return (
    <div className={className}>
      <Header
        isShowNetworkSelect={false}
        showAdd
        showCancelButton
        showSearch
        showSettings
        showSubHeader
        subHeaderName={t<string>('Send fund')}
      />
      {accounts && accounts.length && account && defaultValue
        ? (
          <Bridge
            chainRegistryMap={chainRegistryMap}
            className='bridge-container'
            defaultValue={defaultValue}
            networkMap={networkMap}
            theme={theme}
          />
        )
        : (<LoadingContainer />)
      }
    </div>
  );
}

function Bridge ({ chainRegistryMap, className, defaultValue, networkMap }: ContentProps): React.ReactElement {
  const { t } = useTranslation();
  const [isShowTxModal, setShowTxModal] = useState<boolean>(false);
  const [[isSupportTransferAll], setTransferSupport] =
    useState<[boolean, boolean] | [null, null]>([null, null]);
  const [recipientId, setRecipientId] = useState<string | null>(null);
  const [amount, setAmount] = useState<BN | undefined>(BN_ZERO);
  const [isAll, setIsAll] = useState(false);
  const [[fee, feeSymbol], setFeeInfo] = useState<[string | null, string | null | undefined]>([null, null]);
  const [{ address: senderId,
    networkKey: selectedNetworkKey,
    token: selectedToken }, setSenderValue] = useState<SenderInputAddressType>(defaultValue);
  const mainTokenInfo = getMainTokenInfo(selectedNetworkKey, chainRegistryMap);
  const senderFreeBalance = useFreeBalance(selectedNetworkKey, senderId, selectedToken);
  const recipientFreeBalance = useFreeBalance(selectedNetworkKey, recipientId, selectedToken);
  const balanceFormat: BalanceFormatType = getBalanceFormat(selectedNetworkKey, selectedToken, chainRegistryMap);
  const [existentialDeposit, setExistentialDeposit] = useState<string>('0');

  console.log('networkMap', networkMap);

  const [maxTransfer] = getMaxTransferAndNoFees(fee, feeSymbol, selectedToken, mainTokenInfo.symbol, senderFreeBalance, existentialDeposit);
  const canToggleAll = !!isSupportTransferAll && !!maxTransfer;
  const valueToTransfer = canToggleAll && isAll ? maxTransfer.toString() : (amount?.toString() || '0');
  const originChainOptions = Object.keys(SupportedCrossChainsMap).map((key) => ({ label: networkMap[key].chain, value: key }));
  const firstOriginChain = originChainOptions[0].value;
  const destinationChainOptions = Object.keys(SupportedCrossChainsMap[firstOriginChain].relationMap).map((key) => ({ label: networkMap[key].chain, value: key }));
  const [originChain, setOriginChain] = useState<string>(firstOriginChain);
  const [destinationChain, setDestinationChain] = useState<string>(destinationChainOptions[0].value);
  const tokenList = SupportedCrossChainsMap[originChain].relationMap[destinationChain].supportedToken.map((token) => ({ label: token, value: token }));

  useEffect(() => {
    let isSync = true;

    transferCheckSupporting({ networkKey: selectedNetworkKey, token: selectedToken }).then((res) => {
      if (isSync) {
        setTransferSupport([res.supportTransfer, res.supportTransferAll]);
      }
    }).catch((e) => console.log(e));

    return () => {
      isSync = false;
      setTransferSupport([null, null]);
    };
  }, [selectedNetworkKey, selectedToken]);

  const _onCancel = useCallback(() => {}, []);
  const _onTransfer = useCallback(() => {
    setShowTxModal(true);
  }, []);

  const _onChangeResult = useCallback(() => {}, []);

  const _onCancelTx = useCallback(() => {
    setShowTxModal(false);
  }, []);

  return (
    <>
      <div className={className}>
        <div className='bridge__chain-selector-area'>
          {/*<Dropdown*/}
          {/*  className='bridge__chain-selector'*/}
          {/*  isDisabled={false}*/}
          {/*  label={'Original Chain'}*/}
          {/*  onChange={setOriginChain}*/}
          {/*  options={originChainOptions}*/}
          {/*/>*/}

          <div className='bridge__chain-swap'>
            <img
              alt='Icon'
              src={arrowRight}
            />
          </div>

          {/*<Dropdown*/}
          {/*  className='bridge__chain-selector'*/}
          {/*  isDisabled={false}*/}
          {/*  label={'Destination Chain'}*/}
          {/*  onChange={setDestinationChain}*/}
          {/*  options={destinationChain}*/}
          {/*/>*/}
        </div>

        <BridgeInputAddress
          balance={senderFreeBalance}
          balanceFormat={balanceFormat}
          className=''
          initValue={defaultValue}
          networkMap={networkMap}
          onChange={setSenderValue}
          options={tokenList}
        />

        <ReceiverInputAddress
          balance={recipientFreeBalance}
          balanceFormat={balanceFormat}
          className={''}
          networkKey={selectedNetworkKey}
          networkMap={networkMap}
          onchange={setRecipientId}
        />

        {canToggleAll && isAll
          ? (
            <InputBalance
              autoFocus
              className={'bridge-amount-input'}
              decimals={balanceFormat[0]}
              defaultValue={maxTransfer}
              help={t<string>('The full account balance to be transferred, minus the transaction fees')}
              isDisabled
              key={maxTransfer?.toString()}
              label={t<string>('transferable minus fees')}
              siDecimals={balanceFormat[0]}
              siSymbol={balanceFormat[2] || balanceFormat[1]}
            />
          )
          : (
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
          )
        }

        <div className={'send-fund-toggle'}>
          <Toggle
            className='typeToggle'
            label={t<string>('Transfer the full account balance, reap the sender')}
            onChange={setIsAll}
            value={isAll}
          />
        </div>

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
            isDisabled={false}
            onClick={_onTransfer}
          >
            <span>
              {t<string>('Transfer')}
            </span>
          </Button>
        </div>

        {isShowTxModal && (
          <AuthTransaction
            balanceFormat={balanceFormat}
            feeInfo={['0.1', 10, 'DOT']}
            networkMap={networkMap}
            onCancel={_onCancelTx}
            onChangeResult={_onChangeResult}
            requestPayload={{
              networkKey: selectedNetworkKey,
              from: senderId,
              to: recipientId,
              originChain: originChain,
              destinationChain: destinationChain,
              value: valueToTransfer
            }}
          />
        )}
      </div>
    </>
  );
}

export default React.memo(styled(Wrapper)(({ theme }: Props) => `
  display: flex;
  flex: 1;
  overflow-y: auto;
  flex-direction: column;

  .bridge-container {
    padding: 15px;
    flex: 1;
    overflow-y: auto;
  }

  .send-fund-warning {
    margin-bottom: 10px;
  }

  .send-fund-item {
    margin-bottom: 10px;
  }

  .static-container {
    display: block;
  }

  .bridge-amount-input {
    margin-bottom: 10px;
    margin-top: 15px;
  }

  .send-fund-toggle {
    margin-top: 20px;
    margin-bottom: 20px;
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
    margin: 24px 12px 0;
  }

  .bridge-button-container {
    display: flex;
    position: sticky;
    bottom: -15px;
    padding: 15px;
    margin-left: -15px;
    margin-bottom: -15px;
    margin-right: -15px;
    background-color: ${theme.background};
  }

  .bridge__chain-selector {
    flex: 1;
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
`));
