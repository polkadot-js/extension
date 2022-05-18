// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ethereumChains } from '@subwallet/extension-koni-base/api/dotsama/api-helper';
import { AccountContext, Warning } from '@subwallet/extension-koni-ui/components';
import Button from '@subwallet/extension-koni-ui/components/Button';
import InputBalance from '@subwallet/extension-koni-ui/components/InputBalance';
import LoadingContainer from '@subwallet/extension-koni-ui/components/LoadingContainer';
import ReceiverInputAddress from '@subwallet/extension-koni-ui/components/ReceiverInputAddress';
import SenderInputAddress from '@subwallet/extension-koni-ui/components/SenderInputAddress';
import Toggle from '@subwallet/extension-koni-ui/components/Toggle';
import { useTranslation } from '@subwallet/extension-koni-ui/components/translate';
import { SenderInputAddressType } from '@subwallet/extension-koni-ui/components/types';
import useFreeBalance from '@subwallet/extension-koni-ui/hooks/screen/sending/useFreeBalance';
import { checkTransfer, transferCheckReferenceCount, transferCheckSupporting, transferGetExistentialDeposit } from '@subwallet/extension-koni-ui/messaging';
import Header from '@subwallet/extension-koni-ui/partials/Header';
import AuthTransaction from '@subwallet/extension-koni-ui/Popup/Sending/AuthTransaction';
import SendFundResult from '@subwallet/extension-koni-ui/Popup/Sending/SendFundResult';
import { getBalanceFormat, getDefaultValue, getMainTokenInfo, getMaxTransferAndNoFees, isContainGasRequiredExceedsError } from '@subwallet/extension-koni-ui/Popup/Sending/utils';
import { RootState } from '@subwallet/extension-koni-ui/stores';
import { ThemeProps, TransferResultType } from '@subwallet/extension-koni-ui/types';
import React, { useCallback, useContext, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

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

function Wrapper ({ className = '', theme }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const { accounts } = useContext(AccountContext);
  const { chainRegistry: chainRegistryMap,
    currentAccount: { account },
    currentNetwork: { isReady: isCurrentNetworkInfoReady, networkKey } } = useSelector((state: RootState) => state);

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
          <SendFund
            className='send-fund-container'
            defaultValue={defaultValue}
            theme={theme}
          />
        )
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
  const [[isSupportTransfer, isSupportTransferAll], setTransferSupport] =
    useState<[boolean, boolean] | [null, null]>([null, null]);
  // const [[maxTransfer, noFees], setMaxTransfer] = useState<[BN | null, boolean]>([null, false]);
  const [existentialDeposit, setExistentialDeposit] = useState<string>('0');
  const [txResult, setTxResult] = useState<TransferResultType>({ isShowTxResult: false, isTxSuccess: false });
  const { isShowTxResult } = txResult;
  const senderFreeBalance = useFreeBalance(selectedNetworkKey, senderId, selectedToken);
  const recipientFreeBalance = useFreeBalance(selectedNetworkKey, recipientId, selectedToken);
  const balanceFormat: [number, string] = getBalanceFormat(selectedNetworkKey, selectedToken, chainRegistryMap);
  const mainTokenInfo = getMainTokenInfo(selectedNetworkKey, chainRegistryMap);
  const [[fee, feeSymbol], setFeeInfo] = useState<[string | null, string | null | undefined]>([null, null]);
  const feeDecimal: number | null = feeSymbol
    ? feeSymbol === selectedToken
      ? balanceFormat[0]
      : getBalanceFormat(selectedNetworkKey, feeSymbol, chainRegistryMap)[0]
    : null;
  const isSameAddress = !!recipientId && !!senderId && (recipientId === senderId);
  const isNotSameAddressAndTokenType = (isEthereumAddress(senderId) && !ethereumChains.includes(selectedNetworkKey)) ||
    (!isEthereumAddress(senderId) && ethereumChains.includes(selectedNetworkKey));
  const isNotSameAddressType = (isEthereumAddress(senderId) && !!recipientId && !isEthereumAddress(recipientId)) ||
    (!isEthereumAddress(senderId) && !!recipientId && isEthereumAddress(recipientId));
  const [isGasRequiredExceedsError, setGasRequiredExceedsError] = useState<boolean>(false);
  const amountGtAvailableBalance = amount && senderFreeBalance && amount.gt(new BN(senderFreeBalance));
  const [maxTransfer, noFees] = getMaxTransferAndNoFees(fee, feeSymbol, selectedToken, mainTokenInfo.symbol, senderFreeBalance, existentialDeposit);
  const canToggleAll = !!isSupportTransferAll && !!maxTransfer && !reference && !!recipientId;
  const valueToTransfer = canToggleAll && isAll ? maxTransfer.toString() : (amount?.toString() || '0');
  const canMakeTransfer = isSupportTransfer &&
    !isGasRequiredExceedsError &&
    !recipientPhish &&
    !!recipientId &&
    !isSameAddress &&
    !isNotSameAddressAndTokenType &&
    !isNotSameAddressType &&
    !amountGtAvailableBalance;

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
          setFeeInfo([
            rs.estimateFee && rs.estimateFee !== '0' ? rs.estimateFee : null,
            rs.feeSymbol
          ]);
          setGasRequiredExceedsError(false);
        }
      }).catch((e: Error) => {
        if (isContainGasRequiredExceedsError(e.message) && isSync) {
          setGasRequiredExceedsError(true);
        } else {
          if (isSync) {
            setGasRequiredExceedsError(false);
          }

          console.log('There is problem when checkTransfer', e);
        }
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
        setTransferSupport([res.supportTransfer, res.supportTransferAll]);
      }
    }).catch((e) => console.log(e));

    return () => {
      isSync = false;
      setTransferSupport([null, null]);
    };
  }, [selectedNetworkKey, selectedToken]);

  const _onSend = useCallback(() => {
    if (canMakeTransfer) {
      setShowTxModal(true);
    }
  }, [canMakeTransfer]);

  const _onCancelTx = useCallback(() => {
    setShowTxModal(false);
  }, []);

  const _onResend = useCallback(() => {
    setTxResult({
      isTxSuccess: false,
      isShowTxResult: false,
      txError: undefined
    });
    setSenderValue(defaultValue);
    setRecipientId(null);
  },
  // eslint-disable-next-line react-hooks/exhaustive-deps
  [
    defaultValue.address,
    defaultValue.networkKey,
    defaultValue.token
  ]);

  const _onChangeResult = useCallback((txResult: TransferResultType) => {
    setTxResult(txResult);
    setShowTxModal(false);
  }, []);

  return (
    <>
      {!isShowTxResult
        ? (
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

            {canToggleAll && isAll
              ? (
                <InputBalance
                  autoFocus
                  className={'send-fund-amount-input'}
                  decimals={balanceFormat[0]}
                  defaultValue={maxTransfer}
                  help={t<string>('The full account balance to be transferred, minus the transaction fees')}
                  isDisabled
                  key={maxTransfer?.toString()}
                  label={t<string>('transferable minus fees')}
                  siDecimals={balanceFormat[0]}
                  siSymbol={balanceFormat[1]}
                />
              )
              : (
                <InputBalance
                  autoFocus
                  className={'send-fund-amount-input'}
                  decimals={balanceFormat[0]}
                  help={t<string>('Type the amount you want to transfer. Note that you can select the unit on the right e.g sending 1 milli is equivalent to sending 0.001.')}
                  isError={false}
                  isZeroable
                  label={t<string>('amount')}
                  onChange={setAmount}
                  placeholder={'0'}
                  siSymbol={balanceFormat[1]}
                />
              )
            }

            {canToggleAll && (
              <div className={'send-fund-toggle'}>
                <Toggle
                  className='typeToggle'
                  label={t<string>('Transfer the full account balance, reap the sender')}
                  onChange={setIsAll}
                  value={isAll}
                />
              </div>
            )}

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

            {isNotSameAddressAndTokenType && (
              <Warning
                className={'send-fund-warning'}
                isDanger
              >
                {t<string>('Transfer is not supported for this type of account and token')}
              </Warning>
            )}

            {isSupportTransfer === false && (
              <Warning
                className={'send-fund-warning'}
                isDanger
              >
                {t<string>('The transfer for the current token is not supported')}
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

            {!isSameAddress && isGasRequiredExceedsError && (
              <Warning
                className={'send-fund-warning'}
                isDanger
              >
                {t<string>('The main token ({{mainToken}}) free balance of the sender is not enough to perform this transaction', { replace: { mainToken: mainTokenInfo.symbol } })}
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
                isDisabled={!canMakeTransfer}
                onClick={_onSend}
              >
                {t<string>('Make Transfer')}
              </Button>
            </div>
          </div>
        )
        : (
          <SendFundResult
            networkKey={selectedNetworkKey}
            onResend={_onResend}
            txResult={txResult}
          />
        )}

      {isShowTxModal && (
        <AuthTransaction
          balanceFormat={balanceFormat}
          feeInfo={[
            fee,
            feeDecimal || mainTokenInfo.decimals,
            feeSymbol || mainTokenInfo.symbol
          ]}
          onCancel={_onCancelTx}
          onChangeResult={_onChangeResult}
          requestPayload={{
            networkKey: selectedNetworkKey,
            from: senderId,
            to: recipientId,
            transferAll: canToggleAll && isAll,
            token: selectedToken,
            value: valueToTransfer
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

  .send-fund-amount-input {
    margin-bottom: 10px;
    margin-top: 20px;
  }

  .send-fund-toggle {
    margin-top: 20px;
    margin-bottom: 20px;
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
