// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React, { useCallback, useState } from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import Button from '@polkadot/extension-koni-ui/components/Button';
import ReceiverInputAddress from '@polkadot/extension-koni-ui/components/ReceiverInputAddress';
import SenderInputAddress from '@polkadot/extension-koni-ui/components/SenderInputAddress';
import { useTranslation } from '@polkadot/extension-koni-ui/components/translate';
import { SenderInputAddressType, TokenItemType } from '@polkadot/extension-koni-ui/components/types';
import Header from '@polkadot/extension-koni-ui/partials/Header';
import AuthTransaction from '@polkadot/extension-koni-ui/Popup/Sending/AuthTransaction';
import SendFundResult from '@polkadot/extension-koni-ui/Popup/Sending/SendFundResult';
import { RootState } from '@polkadot/extension-koni-ui/stores';
import { ThemeProps, TxResult } from '@polkadot/extension-koni-ui/types';

interface Props extends ThemeProps {
  className?: string,
}

function SendFund ({ className }: Props): React.ReactElement {
  const { t } = useTranslation();
  const { chainRegistry: chainRegistryMap } = useSelector((state: RootState) => state);
  const [recipientId, setRecipientId] = useState<string | null>(null);
  const networkKey = useSelector((state: RootState) => state.currentNetwork.networkKey);
  const [isShowTxModal, setShowTxModal] = useState<boolean>(false);
  const [senderValue, setSenderValue] = useState<SenderInputAddressType>({} as SenderInputAddressType);
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const [extrinsic, setExtrinsic] = useState<never | null>(null);
  const [txResult, setTxResult] = useState<TxResult>({ isShowTxResult: false, isTxSuccess: false });
  const { isShowTxResult } = txResult;
  const options: TokenItemType[] = [];

  Object.keys(chainRegistryMap).forEach((networkKey) => {
    Object.keys(chainRegistryMap[networkKey].tokenMap).forEach((token) => {
      const tokenInfo = chainRegistryMap[networkKey].tokenMap[token];

      options.push({
        networkKey: networkKey,
        token: tokenInfo.symbol,
        decimals: tokenInfo.decimals,
        isMainToken: tokenInfo.isMainToken,
        specialOption: tokenInfo?.specialOption
      });
    });
  });

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
          <Header
            showAdd
            showCancelButton
            showSearch
            showSettings
            showSubHeader
            subHeaderName={t<string>('Send fund')}
          />
          <div className='send-fund-container'>
            <SenderInputAddress
              className=''
              options={options}
              setSenderValue={setSenderValue}
            />

            <ReceiverInputAddress
              className={''}
              setRecipientId={setRecipientId}
            />

            {/* <InputBalance */}
            {/*  autoFocus */}
            {/*  className={'send-fund-balance-item'} */}
            {/*  defaultValue={4} */}
            {/*  help={'The full account balance to be transferred, minus the transaction fees'} */}
            {/*  isDisabled={false} */}
            {/*  isSi */}
            {/*  key={'key'} */}
            {/*  label={'transferable minus fees'} */}
            {/* /> */}
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

export default React.memo(styled(SendFund)(({ theme }: Props) => `
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
    margin-top: 20px;
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
