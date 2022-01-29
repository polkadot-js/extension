import BN from 'bn.js';
import {ThemeProps} from '@polkadot/extension-koni-ui/types';
import React, {useCallback, useEffect, useState} from 'react';
import styled from 'styled-components';
import {BN_HUNDRED, BN_ZERO, isFunction} from '@polkadot/util';
import {DeriveBalancesAll} from '@polkadot/api-derive/types';
import {checkAddress} from '@polkadot/phishing';
import {AccountInfoWithProviders, AccountInfoWithRefCount} from '@polkadot/types/interfaces';
import {ApiPromise, SubmittableResult} from "@polkadot/api";
import {Button, Warning} from "@polkadot/extension-koni-ui/components";
import useTranslation from "@polkadot/extension-koni-ui/hooks/useTranslation";
import {Header} from "@polkadot/extension-koni-ui/partials";
import LoadingContainer from "@polkadot/extension-koni-ui/components/LoadingContainer";
import {SubmittableExtrinsic} from "@polkadot/api/types";
import {TxResult} from "@polkadot/extension-koni-ui/Popup/Sending/old/types";
import {useCall} from "@polkadot/extension-koni-ui/Popup/Sending/old/hook/useCall";
import {TransactionHistoryItemType} from "@polkadot/extension-base/background/KoniTypes";
import {updateTransactionHistory} from "@polkadot/extension-koni-ui/messaging";
import InputAddress from './component/InputAddress';
import Available from './component/Available';
import InputBalance from "@polkadot/extension-koni-ui/Popup/Sending/old/component/InputBalance";
import Toggle from "@polkadot/extension-koni-ui/components/Toggle";
import SendFundResult from "@polkadot/extension-koni-ui/Popup/Sending/old/SendFundResult";
import AuthTransaction from "@polkadot/extension-koni-ui/Popup/Sending/old/AuthTransaction";
import {useSelector} from "react-redux";
import {RootState} from "@polkadot/extension-koni-ui/stores";
import useApi from "@polkadot/extension-koni-ui/Popup/Sending/old/hook/useApi";

interface Props extends ThemeProps {
  className?: string;
}

interface ContentProps extends ThemeProps {
  className?: string;
  setWrapperClass: (classname: string) => void;
  api: ApiPromise;
  apiUrl: string;
}

function isRefcount(accountInfo: AccountInfoWithProviders | AccountInfoWithRefCount): accountInfo is AccountInfoWithRefCount {
  return !!(accountInfo as AccountInfoWithRefCount).refcount;
}

type ExtractTxResultType = {
  change: string;
  fee?: string;
}

function extractTxResult(result: SubmittableResult): ExtractTxResultType {
  let change = '0';
  let fee;

  const {events} = result;

  const transferEvent = events.find(e =>
    e.event.section === 'balances' &&
    e.event.method.toLowerCase() === 'transfer'
  );

  if (transferEvent) {
    change = transferEvent.event.data[2]?.toString() || '0';
  }

  const withdrawEvent = events.find(e =>
    e.event.section === 'balances' &&
    e.event.method.toLowerCase() === 'withdraw');

  if (withdrawEvent) {
    fee = withdrawEvent.event.data[1]?.toString();
  }

  return {
    change,
    fee
  }
}

async function checkPhishing(_senderId: string | null, recipientId: string | null): Promise<[string | null, string | null]> {
  return [
    // not being checked atm
    // senderId
    //   ? await checkAddress(senderId)
    //   : null,
    null,
    recipientId
      ? await checkAddress(recipientId)
      : null
  ];
}



function Wrapper({className, theme}: Props): React.ReactElement<Props> {
  const {t} = useTranslation();
  const networkKey = useSelector((state: RootState) => state.currentNetwork.networkKey);
  const [wrapperClass, setWrapperClass] = useState<string>('');
  const {api, isApiReady, apiUrl, isNotSupport} = useApi(networkKey);

  const isProviderSupportSendFund = !!api && !!api.tx && !!api.tx.balances;

  const notSupportSendFund = () => {
    return (
      <div className={'kn-l-screen-content'}>
        <Warning>
          {t<string>('The action is not supported. Please change to another network.')}
        </Warning>
      </div>
    )
  };

  return (
    <div className={`-wrapper ${className} ${wrapperClass}`}>
      <Header
        showAdd
        showSearch
        showSettings
        showSubHeader
        subHeaderName={t<string>('Send fund')}
        showCancelButton
      />

      {isApiReady
        ? isProviderSupportSendFund
          ? (
            <SendFund
              theme={theme}
              setWrapperClass={setWrapperClass}
              className={'send-fund-container'}
              api={api}
              apiUrl={apiUrl}
            />
          )
          : notSupportSendFund()
        : isNotSupport
          ? notSupportSendFund()
          : (<LoadingContainer />)
      }
    </div>
  );
}

function SendFund({className, setWrapperClass, api, apiUrl}: ContentProps): React.ReactElement {
  const {t} = useTranslation();

  const {
    currentAccount: {
      account: currentAccount
    },
    currentNetwork: {
      networkKey
    }
  } = useSelector((state: RootState) => state);
  const propSenderId = currentAccount?.address;
  const [amount, setAmount] = useState<BN | undefined>(BN_ZERO);
  const [hasAvailable] = useState(true);
  const [isProtected, setIsProtected] = useState(false);
  const [isAll, setIsAll] = useState(false);
  const [[maxTransfer, noFees], setMaxTransfer] = useState<[BN | null, boolean]>([null, false]);
  const [recipientId, setRecipientId] = useState<string | null>(null);
  const [senderId, setSenderId] = useState<string | null>(null);
  const [[, recipientPhish], setPhishing] = useState<[string | null, string | null]>([null, null]);
  const balances = useCall<DeriveBalancesAll>(api.derive.balances?.all, [senderId], undefined, apiUrl);
  const accountInfo = useCall<AccountInfoWithProviders | AccountInfoWithRefCount>(api.query.system.account, [senderId], undefined, apiUrl);
  const [extrinsic, setExtrinsic] = useState<SubmittableExtrinsic<'promise'> | null>(null);
  const [isShowTxModal, setShowTxModal] = useState<boolean>(false);
  const [txResult, setTxResult] = useState<TxResult>({isShowTxResult: false, isTxSuccess: false});
  const {isShowTxResult} = txResult;

  useEffect((): void => {
    const fromId = senderId as string;
    const toId = recipientId as string;

    if (balances && balances.accountId.eq(fromId) && fromId && toId && isFunction(api.rpc.payment?.queryInfo)) {
      setTimeout((): void => {
        try {
          api.tx.balances
            .transfer(toId, balances.availableBalance)
            .paymentInfo(fromId)
            .then(({partialFee}): void => {
              const adjFee = partialFee.muln(110).div(BN_HUNDRED);
              const maxTransfer = balances.availableBalance.sub(adjFee);

              setMaxTransfer(
                maxTransfer.gt(api.consts.balances.existentialDeposit as unknown as BN)
                  ? [maxTransfer, false]
                  : [null, true]
              );
            })
            .catch(console.error);
        } catch (error) {
          console.error((error as Error).message);
        }
      }, 0);
    } else {
      setMaxTransfer([null, false]);
    }
  }, [api, balances, propSenderId, recipientId, senderId]);

  useEffect((): void => {
    checkPhishing(senderId, recipientId)
      .then(setPhishing)
      .catch(console.error);
  }, [propSenderId, recipientId, senderId]);

  const noReference = accountInfo
    ? isRefcount(accountInfo)
      ? accountInfo.refcount.isZero()
      : accountInfo.consumers.isZero()
    : true;
  const canToggleAll = !isProtected && balances && balances.accountId.eq(senderId) && maxTransfer && noReference;

  const amountGtAvailableBalance = amount && balances && amount.gt(balances.availableBalance);

  const txParams: unknown[] | (() => unknown[]) | null =
    canToggleAll && isAll
      ? isFunction(api.tx.balances.transferAll)
      ? [recipientId, false]
      : [recipientId, maxTransfer]
      : [recipientId, amount];

  const tx: ((...args: any[]) => SubmittableExtrinsic<'promise'>) | null = canToggleAll && isAll && isFunction(api.tx.balances.transferAll)
    ? api.tx.balances.transferAll
    : isProtected
      ? api.tx.balances.transferKeepAlive
      : api.tx.balances.transfer;

  const _onSend = useCallback(() => {
    if (tx) {
      setExtrinsic(tx(...(
        isFunction(txParams)
          ? txParams()
          : (txParams || [])
      )) as SubmittableExtrinsic<'promise'>);

      setShowTxModal(true);
    }
  }, [txParams, tx]);

  const _onCancelTx = useCallback(() => {
    setExtrinsic(null);
    setShowTxModal(true);
  }, []);

  const onGetTxResult = (isTxSuccess: boolean, extrinsicHash?: string, txError?: Error | null) => {
    setWrapperClass('-disable-header-action');

    setTxResult({
      isShowTxResult: true,
      isTxSuccess,
      txError,
      extrinsicHash
    });

    _onCancelTx();
  };

  const _onTxSuccess = useCallback((result: SubmittableResult, extrinsicHash?: string) => {
    if (!senderId) {
      return;
    }

    if (result && extrinsicHash) {
      const {change, fee} = extractTxResult(result);

      const item: TransactionHistoryItemType = {
        action: 'send',
        change,
        extrinsicHash,
        fee,
        isSuccess: true,
        networkKey,
        time: Date.now()
      };

      updateTransactionHistory(senderId, networkKey, item, (items) => {
        onGetTxResult(true, extrinsicHash);
      }).catch(e => console.log('Error when update Transaction History', e));
    } else {
      onGetTxResult(true);
    }
  }, [senderId, networkKey]);

  const _onTxFail = useCallback((result: SubmittableResult | null, error: Error | null, extrinsicHash?: string) => {
    if (!senderId) {
      return;
    }

    if (result && extrinsicHash) {
      const {change, fee} = extractTxResult(result);

      const item: TransactionHistoryItemType = {
        action: 'send',
        change,
        extrinsicHash,
        fee,
        isSuccess: false,
        networkKey,
        time: Date.now()
      };

      updateTransactionHistory(senderId, networkKey, item, (items) => {
        onGetTxResult(false, extrinsicHash, error);
      }).catch(e => console.log('Error when update Transaction History', e));
    } else {
      onGetTxResult(false, undefined, error);
    }
  }, [senderId, networkKey]);

  const _onResend = () => {
    setTxResult({
      isTxSuccess: false,
      isShowTxResult: false,
      txError: undefined
    });

    setWrapperClass('');
  };

  const isSameAddress = !!recipientId && !!senderId && (recipientId === senderId);

  return (
    <>
      {!isShowTxResult ? (
        <div className={`${className} -main-content`}>
          <InputAddress
            withEllipsis
            className={'kn-field -field-1'}
            defaultValue={propSenderId}
            help={t<string>('The account you will send funds from.')}
            // isDisabled={!!propSenderId}
            label={t<string>('Send from account')}
            labelExtra={
              <Available
                label={t<string>('Transferable')}
                params={senderId}
                api={api}
                apiUrl={apiUrl}
              />
            }
            onChange={setSenderId}
            type='account'
          />
          <InputAddress
            withEllipsis
            className={'kn-field -field-2'}
            autoPrefill={false}
            help={t<string>('Select a contact or paste the address you want to send funds to.')}
            // isDisabled={!!propRecipientId}
            label={t<string>('Send to address')}
            labelExtra={
              <Available
                label={t<string>('Transferable')}
                params={recipientId}
                api={api}
                apiUrl={apiUrl}
              />
            }
            onChange={setRecipientId}
            type='allPlus'
          />
          {recipientPhish && (
            <Warning isDanger className={'kn-l-warning'}>
              {t<string>('The recipient is associated with a known phishing site on {{url}}', {replace: {url: recipientPhish}})}
            </Warning>
          )}
          {isSameAddress && (
            <Warning isDanger className={'kn-l-warning'}>
              {t<string>('The recipient address is the same as the sender address.')}
            </Warning>
          )}
          {canToggleAll && isAll
            ? (
              <InputBalance
                className={'kn-field -field-3'}
                autoFocus
                defaultValue={maxTransfer}
                help={t<string>('The full account balance to be transferred, minus the transaction fees')}
                isDisabled
                key={maxTransfer?.toString()}
                label={t<string>('transferable minus fees')}
                registry={api.registry}
              />
            )
            : (
              <>
                <InputBalance
                  className={'kn-field -field-3'}
                  autoFocus
                  help={t<string>('Type the amount you want to transfer. Note that you can select the unit on the right e.g sending 1 milli is equivalent to sending 0.001.')}
                  isError={!hasAvailable}
                  isZeroable
                  placeholder={'0'}
                  label={t<string>('amount')}
                  // maxValue={maxTransfer}
                  onChange={setAmount}
                  registry={api.registry}
                />
                {amountGtAvailableBalance && (
                  <Warning isDanger className={'kn-l-warning'}>
                    {t<string>('The amount you want to transfer is greater than your available balance.')}
                  </Warning>
                )}
                <InputBalance
                  className={'kn-field -field-4'}
                  defaultValue={api.consts.balances.existentialDeposit}
                  help={t<string>('The minimum amount that an account should have to be deemed active')}
                  isDisabled
                  label={t<string>('existential deposit')}
                  registry={api.registry}
                />
              </>
            )
          }
          {isFunction(api.tx.balances.transferKeepAlive) && (
            <div className={'kn-field -toggle -toggle-1'}>
              <Toggle
                className='typeToggle'
                label={
                  isProtected
                    ? t<string>('Transfer with account keep-alive checks')
                    : t<string>('Normal transfer without keep-alive checks')
                }
                onChange={setIsProtected}
                value={isProtected}
              />
            </div>
          )}
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
          {!isProtected && !noReference && (
            <Warning className={'kn-l-warning'}>
              {t<string>('There is an existing reference count on the sender account. As such the account cannot be reaped from the state.')}
            </Warning>
          )}
          {!amountGtAvailableBalance && !isSameAddress && noFees && (
            <Warning className={'kn-l-warning'}>
              {t<string>('The transaction, after application of the transfer fees, will drop the available balance below the existential deposit. As such the transfer will fail. The account needs more free funds to cover the transaction fees.')}
            </Warning>
          )}

          <div className={'kn-l-submit-wrapper'}>
            <Button
              className={'kn-submit-btn'}
              isDisabled={isSameAddress || !hasAvailable || !(recipientId) || (!amount && !isAll) || amountGtAvailableBalance || !!recipientPhish}
              onClick={_onSend}
            >
              {t<string>('Make Transfer')}
            </Button>
          </div>
        </div>
      ) : (
        <SendFundResult
          networkKey={networkKey}
          txResult={txResult}
          onResend={_onResend}
        />
      )}

      {extrinsic && isShowTxModal && (
        <AuthTransaction
          extrinsic={extrinsic}
          requestAddress={senderId}
          onCancel={_onCancelTx}
          api={api}
          apiUrl={apiUrl}
          txHandler={{
            onTxSuccess: _onTxSuccess,
            onTxFail: _onTxFail
          }}
        />
      )}
    </>
  );
}

export default React.memo(styled(Wrapper)(({theme}: Props) => `
  display: flex;
  flex-direction: column;
  overflow: hidden;
  height: 100vh;

  &.-disable-header-action {
    .koni-header-right-content .kn-l-expand-btn,
    .network-select-item,
    .setting-icon-wrapper {
      cursor: not-allowed;
      opacity: 0.5;
      pointer-events: none !important;
    }

    .subheader-container__part-3 .kn-l-cancel-btn {
      display: none;
    }
  }

  .send-fund-container {
    padding-left: 15px;
    padding-right: 15px;
    padding-bottom: 15px;
    flex: 1;
    padding-top: 25px;
    margin-top: -25px;
    overflow-y: auto;

    // &::-webkit-scrollbar {
    //   display: none;
    // }
  }

  .kn-l-screen-content {
    flex: 1;
    padding: 0 15px 15px;
  }

  .kn-field {
    margin-bottom: 10px;

    &.-field-1 {
      z-index: 5;
    }

    &.-field-2 {
      z-index: 4;
      margin-bottom: 10px;
    }

    &.-field-3 {
      margin-top: 20px;
      z-index: 3;
    }

    &.-field-4 {
      z-index: 2;
    }

    &.-toggle {
      margin-top: 20px;
      margin-bottom: 20px;
      display: flex;
      justify-content: flex-end;
    }

    &.-field-4, &.-toggle-1 {
        display: none !important;
    }
  }

  .kn-l-warning {
    margin-top: 10px;
    margin-bottom: 10px;
  }

  .kn-l-submit-wrapper {
    position: sticky;
    bottom: -15px;
    padding: 15px;
    margin-left: -15px;
    margin-bottom: -15px;
    margin-right: -15px;
    background-color: ${theme.background};
  }
`));
