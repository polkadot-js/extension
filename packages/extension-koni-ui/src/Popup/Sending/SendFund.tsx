// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React, { useCallback, useState } from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import { Warning } from '@polkadot/extension-koni-ui/components';
import Button from '@polkadot/extension-koni-ui/components/Button';
import InputBalance from '@polkadot/extension-koni-ui/components/InputBalance';
import ReceiverInputAddress from '@polkadot/extension-koni-ui/components/ReceiverInputAddress';
import SenderInputAddress from '@polkadot/extension-koni-ui/components/SenderInputAddress';
import { useTranslation } from '@polkadot/extension-koni-ui/components/translate';
import { SenderInputAddressType } from '@polkadot/extension-koni-ui/components/types';
import Header from '@polkadot/extension-koni-ui/partials/Header';
import AuthTransaction from '@polkadot/extension-koni-ui/Popup/Sending/AuthTransaction';
import SendFundResult from '@polkadot/extension-koni-ui/Popup/Sending/SendFundResult';
import { RootState } from '@polkadot/extension-koni-ui/stores';
import { ThemeProps, TxResult } from '@polkadot/extension-koni-ui/types';
import { BN, BN_ZERO } from '@polkadot/util';

interface Props extends ThemeProps {
  className?: string,
}

interface ContentProps extends ThemeProps {
  className?: string;
}

function Wrapper ({ className = '', theme }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();

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
        theme={theme}
      />
    </div>
  );
}

function SendFund ({ className }: ContentProps): React.ReactElement {
  const { t } = useTranslation();
  const [amount, setAmount] = useState<BN | undefined>(BN_ZERO);
  const { chainRegistry: chainRegistryMap } = useSelector((state: RootState) => state);
  const [recipientId, setRecipientId] = useState<string | null>(null);
  const networkKey = useSelector((state: RootState) => state.currentNetwork.networkKey);
  const [isShowTxModal, setShowTxModal] = useState<boolean>(false);
  const [senderValue, setSenderValue] = useState<SenderInputAddressType>({} as SenderInputAddressType);
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const [extrinsic, setExtrinsic] = useState<never | null>(null);
  const [txResult, setTxResult] = useState<TxResult>({ isShowTxResult: false, isTxSuccess: false });
  const { isShowTxResult } = txResult;
  let decimals = 10;

  if (senderValue && Object.keys(senderValue).length) {
    decimals = chainRegistryMap[senderValue.networkKey].chainDecimals[0];
  }

  // let defaultValueStr: string;

  // if (networkKey === 'all') {
  //   const defaultValue = options[0];
  //
  //   defaultValueStr = `${defaultValue.token}|${defaultValue.networkKey}}`;
  // } else {
  //   const defaultValue = options.find((opt) => opt.networkKey === networkKey);
  //
  //   defaultValueStr = defaultValue ? `${defaultValue.token}|${defaultValue.networkKey}` : '';
  // }

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
            chainRegistryMap={chainRegistryMap}
            className=''
            setSenderValue={setSenderValue}
          />

          <ReceiverInputAddress
            className={''}
            setRecipientId={setRecipientId}
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
            decimals={decimals}
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
          networkKey={networkKey}
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
