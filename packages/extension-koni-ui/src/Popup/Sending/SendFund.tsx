// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React, { useCallback, useContext, useState } from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import { ChainRegistry } from '@polkadot/extension-base/background/KoniTypes';
import { AccountJson } from '@polkadot/extension-base/background/types';
import { AccountContext, Warning } from '@polkadot/extension-koni-ui/components';
import Button from '@polkadot/extension-koni-ui/components/Button';
import InputBalance from '@polkadot/extension-koni-ui/components/InputBalance';
import ReceiverInputAddress from '@polkadot/extension-koni-ui/components/ReceiverInputAddress';
import SenderInputAddress from '@polkadot/extension-koni-ui/components/SenderInputAddress';
import { useTranslation } from '@polkadot/extension-koni-ui/components/translate';
import { SenderInputAddressType } from '@polkadot/extension-koni-ui/components/types';
import useFreeBalance from '@polkadot/extension-koni-ui/hooks/screen/sending/useFreeBalance';
import Header from '@polkadot/extension-koni-ui/partials/Header';
import AuthTransaction from '@polkadot/extension-koni-ui/Popup/Sending/AuthTransaction';
import SendFundResult from '@polkadot/extension-koni-ui/Popup/Sending/SendFundResult';
import { RootState } from '@polkadot/extension-koni-ui/stores';
import { ThemeProps, TxResult } from '@polkadot/extension-koni-ui/types';
import { isAccountAll } from '@polkadot/extension-koni-ui/util';
import { BN, BN_ZERO } from '@polkadot/util';

interface Props extends ThemeProps {
  className?: string,
}

interface ContentProps extends ThemeProps {
  className?: string;
  defaultValue: SenderInputAddressType;
}

function getDefaultAddress (address: string, accounts: AccountJson[]): string {
  return isAccountAll(address) ? accounts[1].address : address;
}

function getDefaultToken (networkKey: string, chainRegistryMap: Record<string, ChainRegistry>): [string, string] {
  const firstNetworkKey = Object.keys(chainRegistryMap)[0];
  const token = networkKey === 'all' ? chainRegistryMap[firstNetworkKey].chainTokens[0] : chainRegistryMap[networkKey].chainTokens[0];

  return networkKey === 'all' ? [firstNetworkKey, token] : [networkKey, token];
}

function getDefaultValue (networkKey: string, address: string, chainRegistryMap: Record<string, ChainRegistry>, accounts: AccountJson[]): SenderInputAddressType {
  const defaultToken = getDefaultToken(networkKey, chainRegistryMap);

  return {
    address: getDefaultAddress(address, accounts),
    networkKey: defaultToken[0],
    token: defaultToken[1]
  };
}

function getBalanceFormat (networkKey: string, token: string, chainRegistryMap: Record<string, ChainRegistry>): [number, string] {
  const tokenInfo = chainRegistryMap[networkKey].tokenMap[token];

  return [tokenInfo.decimals, tokenInfo.symbol];
}

function Wrapper ({ className = '', theme }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const { accounts } = useContext(AccountContext);
  const { chainRegistry: chainRegistryMap,
    currentAccount: { account },
    currentNetwork: { networkKey } } = useSelector((state: RootState) => state);

  console.log('networkKey', networkKey);
  let defaultValue = {} as SenderInputAddressType;

  if (account) {
    defaultValue = getDefaultValue(networkKey, account.address, chainRegistryMap, accounts);
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
        subHeaderName={t<string>('Send fund')}
      />
      <SendFund
        className='send-fund-container'
        defaultValue={defaultValue}
        theme={theme}
      />
    </div>
  );
}

function SendFund ({ className, defaultValue }: ContentProps): React.ReactElement {
  const { t } = useTranslation();
  const [amount, setAmount] = useState<BN | undefined>(BN_ZERO);
  const { chainRegistry: chainRegistryMap } = useSelector((state: RootState) => state);
  const [recipientId, setRecipientId] = useState<string | null>(null);
  const [isShowTxModal, setShowTxModal] = useState<boolean>(false);
  const [{ address: senderId,
    networkKey: selectedNetworkKey,
    token: selectedToken }, setSenderValue] = useState<SenderInputAddressType>(defaultValue);
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const [extrinsic, setExtrinsic] = useState<never | null>(null);
  const [txResult, setTxResult] = useState<TxResult>({ isShowTxResult: false, isTxSuccess: false });
  const { isShowTxResult } = txResult;
  const senderFreeBalance = useFreeBalance(selectedNetworkKey, senderId, selectedToken);
  const recipientFreeBalance = useFreeBalance(selectedNetworkKey, recipientId, selectedToken);
  const balanceFormat = getBalanceFormat(selectedNetworkKey, selectedToken, chainRegistryMap);

  const _onSend = useCallback(() => {
    // setShowTxModal(true);
  }, []);

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  const _onTxSuccess = useCallback(() => {
  }, []);

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  const _onTxFail = useCallback(() => {
  }, []);

  const _onCancelTx = useCallback(() => {
    setExtrinsic(null);
    setShowTxModal(false);
  }, []);

  const _onResend = useCallback(() => {
    setTxResult({
      isTxSuccess: false,
      isShowTxResult: false,
      txError: undefined
    });
  }, []);

  return (
    <>
      {/* eslint-disable-next-line multiline-ternary */}
      {!isShowTxResult ? (
        <div className={className}>
          <SenderInputAddress
            balance={senderFreeBalance}
            balanceFormat={balanceFormat}
            chainRegistryMap={chainRegistryMap}
            className=''
            initValue={defaultValue}
            onChange={setSenderValue}
          />

          <ReceiverInputAddress
            balance={recipientFreeBalance}
            balanceFormat={balanceFormat}
            className={''}
            networkKey={selectedNetworkKey}
            onchange={setRecipientId}
          />

          {false && (
            <Warning
              className={'kn-l-warning'}
              isDanger
            >
              {t<string>('The recipient is associated with a known phishing site on {{url}}', { replace: { url: '' } })}
            </Warning>
          )}

          {false && (
            <Warning
              className={'kn-l-warning'}
              isDanger
            >
              {t<string>('The recipient address is the same as the sender address.')}
            </Warning>
          )}

          <InputBalance
            autoFocus
            className={'send-fund-balance-item'}
            decimals={balanceFormat[0]}
            help={t<string>('Type the amount you want to transfer. Note that you can select the unit on the right e.g sending 1 milli is equivalent to sending 0.001.')}
            isError={false}
            isZeroable
            label={t<string>('amount')}
            onChange={setAmount}
            placeholder={'0'}
          />

          {false && (
            <Warning className={'kn-l-warning'}>
              {t<string>('There is an existing reference count on the sender account. As such the account cannot be reaped from the state.')}
            </Warning>
          )}

          {false && (
            <Warning className={'kn-l-warning'}>
              {t<string>('The transaction, after application of the transfer fees, will drop the available balance below the existential deposit. As such the transfer will fail. The account needs more free funds to cover the transaction fees.')}
            </Warning>
          )}

          <div className='submit-btn-wrapper'>
            <Button
              className={'kn-submit-btn'}
              isDisabled={false}
              onClick={_onSend}
            >
              {t<string>('Make Transfer')}
            </Button>
          </div>
        </div>
      ) : (
        <SendFundResult
          networkKey={selectedNetworkKey}
          onResend={_onResend}
          txResult={txResult}
        />
      )}

      {isShowTxModal && (
        <AuthTransaction
          extrinsic={extrinsic}
          onCancel={_onCancelTx}
          requestAddress={''}
          txHandler={{
            onTxSuccess: _onTxSuccess,
            onTxFail: _onTxFail
          }}
        />
      )}
    </>

  );
}

export default React.memo(styled(Wrapper)(({ theme }: Props) => `
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow-y: auto;

  .send-fund-container {
    padding-left: 15px;
    padding-right: 15px;
    padding-bottom: 15px;
    flex: 1;
    padding-top: 25px;
    overflow-y: auto;
  }

  .send-fund-item {
    margin-bottom: 10px;
  }

  .static-container {
    display: block;
  }

  .send-fund-balance-item {
    margin-top: 10px;
    margin-bottom: 10px;
  }

  .submit-btn-wrapper {
    position: sticky;
    bottom: -15px;
    padding: 15px;
    margin-left: -15px;
    margin-bottom: -15px;
    margin-right: -15px;
    background-color: ${theme.background};
  }
`));
