// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React, { useCallback, useContext, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import { ChainRegistry } from '@polkadot/extension-base/background/KoniTypes';
import { AccountJson } from '@polkadot/extension-base/background/types';
import { ethereumChains } from '@polkadot/extension-koni-base/api/dotsama/api-helper';
import { AccountContext, Warning } from '@polkadot/extension-koni-ui/components';
import Button from '@polkadot/extension-koni-ui/components/Button';
import InputBalance from '@polkadot/extension-koni-ui/components/InputBalance';
import LoadingContainer from '@polkadot/extension-koni-ui/components/LoadingContainer';
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
import { checkAddress } from '@polkadot/phishing';
import { BN, BN_ZERO } from '@polkadot/util';
import { isEthereumAddress } from '@polkadot/util-crypto';

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
      {accounts && accounts.length && account && chainRegistryMap
        ? (<SendFund
          className='send-fund-container'
          defaultValue={defaultValue}
          theme={theme}
        />)
        : (<LoadingContainer />)
      }
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
  const [recipientPhish, setRecipientPhish] = useState<string | null>(null);
  const [txResult, setTxResult] = useState<TxResult>({ isShowTxResult: false, isTxSuccess: false });
  const { isShowTxResult } = txResult;
  const senderFreeBalance = useFreeBalance(selectedNetworkKey, senderId, selectedToken);
  const recipientFreeBalance = useFreeBalance(selectedNetworkKey, recipientId, selectedToken);
  const balanceFormat = getBalanceFormat(selectedNetworkKey, selectedToken, chainRegistryMap);
  const isSameAddress = !!recipientId && !!senderId && (recipientId === senderId);
  const isNotSameAddressAndTokenType = (isEthereumAddress(senderId) && !ethereumChains.includes(selectedNetworkKey)) || (!isEthereumAddress(senderId) && ethereumChains.includes(selectedNetworkKey));
  const isNotSameAddressType = (isEthereumAddress(senderId) && !!recipientId && !isEthereumAddress(recipientId)) || (!isEthereumAddress(senderId) && !!recipientId && isEthereumAddress(recipientId));
  const amountGtAvailableBalance = amount && senderFreeBalance && amount.gt(new BN(senderFreeBalance));

  useEffect(() => {
    let isSync = true;

    if (recipientId) {
      checkAddress(recipientId).then((v) => {
        if (isSync) {
          setRecipientPhish(v);
        }
      }).catch((e) => console.log(e));
    }

    return () => {
      isSync = false;
      setRecipientPhish(null);
    };
  }
  , [recipientId]);

  const _onSend = useCallback(() => {
    setShowTxModal(true);
  }, []);

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  const _onTxSuccess = useCallback(() => {
  }, []);

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  const _onTxFail = useCallback(() => {
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

          {!!recipientPhish && (
            <Warning
              className={'kn-l-warning'}
              isDanger
            >
              {t<string>('The recipient is associated with a known phishing site on {{url}}', { replace: { url: recipientPhish } })}
            </Warning>
          )}

          {isSameAddress && (
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

          {isNotSameAddressAndTokenType && (
            <Warning
              className={'kn-l-warning'}
              isDanger
            >
              {t<string>('Sender account and token are not of the same type')}
            </Warning>
          )}

          {isNotSameAddressType && (
            <Warning
              className={'kn-l-warning'}
              isDanger
            >
              {t<string>('The recipient address is not the same type as the sender address.')}
            </Warning>
          )}

          {amountGtAvailableBalance && (
            <Warning
              className={'kn-l-warning'}
              isDanger
            >
              {t<string>('The amount you want to transfer is greater than your available balance.')}
            </Warning>
          )}

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
          balanceFormat={balanceFormat}
          onCancel={_onCancelTx}
          requestPayload={{
            networkKey: selectedNetworkKey,
            from: senderId,
            to: recipientId,
            transferAll: false,
            token: selectedToken,
            value: amount?.toString() || '0'
          }}
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
