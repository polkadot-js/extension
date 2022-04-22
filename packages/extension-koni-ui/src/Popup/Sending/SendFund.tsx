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
import Toggle from '@polkadot/extension-koni-ui/components/Toggle';
import { useTranslation } from '@polkadot/extension-koni-ui/components/translate';
import { SenderInputAddressType } from '@polkadot/extension-koni-ui/components/types';
import useFreeBalance from '@polkadot/extension-koni-ui/hooks/screen/sending/useFreeBalance';
import { checkTransfer, transferCheckReferenceCount, transferCheckSupporting, transferGetExistentialDeposit } from '@polkadot/extension-koni-ui/messaging';
import Header from '@polkadot/extension-koni-ui/partials/Header';
import AuthTransaction from '@polkadot/extension-koni-ui/Popup/Sending/AuthTransaction';
import SendFundResult from '@polkadot/extension-koni-ui/Popup/Sending/SendFundResult';
import { RootState } from '@polkadot/extension-koni-ui/stores';
import { ThemeProps, TransferResultType } from '@polkadot/extension-koni-ui/types';
import { isAccountAll } from '@polkadot/extension-koni-ui/util';
import { checkAddress } from '@polkadot/phishing';
import { BN, BN_HUNDRED, BN_ZERO } from '@polkadot/util';
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

function getMaxTransferAndNoFees (fee: string | null, senderFreeBalance: string, existentialDeposit: string): [BN | null, boolean] {
  const partialFee = fee ? new BN(fee) : new BN('0');
  const adjFee = partialFee.muln(110).div(BN_HUNDRED);
  const maxTransfer = (new BN(senderFreeBalance)).sub(adjFee);

  return maxTransfer.gt(new BN(existentialDeposit))
    ? [maxTransfer, false]
    : [null, true];
}

function Wrapper ({ className = '', theme }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const { accounts } = useContext(AccountContext);
  const { chainRegistry: chainRegistryMap,
    currentAccount: { account },
    currentNetwork: { networkKey } } = useSelector((state: RootState) => state);

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
      {accounts && accounts.length && account && Object.keys(chainRegistryMap).length
        ? (<SendFund
          className='send-fund-container'
          defaultValue={getDefaultValue(networkKey, account.address, chainRegistryMap, accounts)}
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
  const [reference, setReference] = useState<boolean | null>(null);
  // const [isProtected, setIsProtected] = useState(false);
  const [isAll, setIsAll] = useState(false);
  const [isTransferSupport, setTransferSupport] = useState<boolean | null>(null);
  // const [[maxTransfer, noFees], setMaxTransfer] = useState<[BN | null, boolean]>([null, false]);
  const [existentialDeposit, setExistentialDeposit] = useState<string>('0');
  const [fee, setFee] = useState<null | string>(null);
  const [txResult, setTxResult] = useState<TransferResultType>({ isShowTxResult: false, isTxSuccess: false });
  const { isShowTxResult } = txResult;
  const senderFreeBalance = useFreeBalance(selectedNetworkKey, senderId, selectedToken);
  const recipientFreeBalance = useFreeBalance(selectedNetworkKey, recipientId, selectedToken);
  const balanceFormat = getBalanceFormat(selectedNetworkKey, selectedToken, chainRegistryMap);
  const isSameAddress = !!recipientId && !!senderId && (recipientId === senderId);
  const isNotSameAddressAndTokenType = (isEthereumAddress(senderId) && !ethereumChains.includes(selectedNetworkKey)) ||
    (!isEthereumAddress(senderId) && ethereumChains.includes(selectedNetworkKey));
  const isNotSameAddressType = (isEthereumAddress(senderId) && !!recipientId && !isEthereumAddress(recipientId)) ||
    (!isEthereumAddress(senderId) && !!recipientId && isEthereumAddress(recipientId));
  const amountGtAvailableBalance = amount && senderFreeBalance && amount.gt(new BN(senderFreeBalance));
  const [maxTransfer, noFees] = getMaxTransferAndNoFees(fee, senderFreeBalance, existentialDeposit);
  const canToggleAll = !!maxTransfer && !reference && !!recipientId;
  const valueToTransfer = canToggleAll && isAll ? maxTransfer.toString() : (amount?.toString() || '0');

  useEffect(() => {
    let isSync = true;

    if (recipientId) {
      checkTransfer({
        networkKey: selectedNetworkKey,
        from: senderId,
        to: recipientId,
        transferAll: canToggleAll && isAll,
        token: selectedToken,
        value: valueToTransfer
      }).then((rs) => {
        if (isSync) {
          setFee(rs.estimateFee || null);
        }
      }).catch((e) => {
        console.log('There is problem when checkTransfer', e);
      });
    }

    return () => {
      isSync = false;
    };
  }, [amount, canToggleAll, isAll, recipientId, selectedNetworkKey, selectedToken, senderId, valueToTransfer]);

  useEffect(() => {
    let isSync = true;

    transferGetExistentialDeposit({ networkKey: selectedNetworkKey, token: selectedToken })
      .then((rs) => {
        if (isSync) {
          setExistentialDeposit(rs);
        }
      }).catch((e) => console.log('There is problem when transferGetExistentialDeposit', e));

    return () => {
      isSync = false;
      setExistentialDeposit('0');
    };
  }, [selectedNetworkKey, selectedToken]);

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

  useEffect(() => {
    let isSync = true;

    transferCheckReferenceCount({ address: senderId, networkKey: selectedNetworkKey }).then((res) => {
      if (isSync) {
        setReference(res);
      }
    }).catch((e) => console.log(e));

    return () => {
      isSync = false;
      setReference(null);
    };
  }, [selectedNetworkKey, senderId]);

  useEffect(() => {
    let isSync = true;

    transferCheckSupporting({ networkKey: selectedNetworkKey, token: selectedToken }).then((res) => {
      if (isSync) {
        setTransferSupport(res);
      }
    }).catch((e) => console.log(e));

    return () => {
      isSync = false;
      setTransferSupport(null);
    };
  }, [selectedNetworkKey, selectedToken]);

  const _onSend = useCallback(() => {
    setShowTxModal(true);
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
              className={'send-fund-warning'}
              isDanger
            >
              {t<string>('The recipient is associated with a known phishing site on {{url}}', { replace: { url: recipientPhish } })}
            </Warning>
          )}

          {isSameAddress && (
            <Warning
              className={'send-fund-warning'}
              isDanger
            >
              {t<string>('The recipient address is the same as the sender address.')}
            </Warning>
          )}

          {canToggleAll && isAll
            ? (
              <InputBalance
                autoFocus
                className={'send-fund-balance-item'}
                decimals={balanceFormat[0]}
                defaultValue={maxTransfer}
                help={t<string>('The full account balance to be transferred, minus the transaction fees')}
                isDisabled
                key={maxTransfer?.toString()}
                label={t<string>('transferable minus fees')}
              />
            )
            : (
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
            )
          }

          {canToggleAll && (
            <div className={'kn-field -toggle -toggle-2'}>
              <Toggle
                className='typeToggle'
                label={t<string>('Transfer the full account balance, reap the sender')}
                onChange={setIsAll}
                value={isAll}
              />
            </div>
          )}

          {isNotSameAddressAndTokenType && (
            <Warning
              className={'send-fund-warning'}
              isDanger
            >
              {t<string>('Transfer is not supported for this type of account and token')}
            </Warning>
          )}

          {isTransferSupport === false && (
            <Warning
              className={'send-fund-warning'}
              isDanger
            >
              {t<string>('The token is not support transfer')}
            </Warning>
          )}

          {isNotSameAddressType && (
            <Warning
              className={'send-fund-warning'}
              isDanger
            >
              {t<string>('The recipient address must be same type as the sender address.')}
            </Warning>
          )}

          {amountGtAvailableBalance && (
            <Warning
              className={'send-fund-warning'}
              isDanger
            >
              {t<string>('The amount you want to transfer is greater than your available balance.')}
            </Warning>
          )}

          {reference && (
            <Warning className={'send-fund-warning'}>
              {t<string>('There is an existing reference count on the sender account. As such the account cannot be reaped from the state.')}
            </Warning>
          )}

          {senderFreeBalance !== '0' && !amountGtAvailableBalance && !isSameAddress && noFees && (
            <Warning className={'send-fund-warning'}>
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
          fee={fee}
          onCancel={_onCancelTx}
          onChangeResult={setTxResult}
          onChangeShowModal={setShowTxModal}
          requestPayload={{
            networkKey: selectedNetworkKey,
            from: senderId,
            to: recipientId,
            transferAll: false,
            token: selectedToken,
            value: amount?.toString() || '0'
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

  .send-fund-warning {
    margin-bottom: 10px;
  }

  .send-fund-item {
    margin-bottom: 10px;
  }

  .static-container {
    display: block;
  }

  .send-fund-balance-item {
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
