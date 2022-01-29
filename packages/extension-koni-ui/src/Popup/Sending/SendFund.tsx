// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React, { useCallback, useState } from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import Button from '@polkadot/extension-koni-ui/components/Button';
import InputAddress from '@polkadot/extension-koni-ui/components/InputAddress';
import InputBalance from '@polkadot/extension-koni-ui/components/InputBalance';
import { useTranslation } from '@polkadot/extension-koni-ui/components/translate';
import Header from '@polkadot/extension-koni-ui/partials/Header';
import AuthTransaction from '@polkadot/extension-koni-ui/Popup/Sending/AuthTransaction';
import SendFundResult from '@polkadot/extension-koni-ui/Popup/Sending/SendFundResult';
import Available from '@polkadot/extension-koni-ui/query/Available';
import { RootState } from '@polkadot/extension-koni-ui/stores';
import { ThemeProps, TxResult } from '@polkadot/extension-koni-ui/types';

interface Props extends ThemeProps {
  className?: string,
}

function SendFund ({ className }: Props): React.ReactElement {
  const { t } = useTranslation();
  const currentAccount = useSelector((state: RootState) => state.currentAccount.account);
  const propSenderId = currentAccount?.address;
  const [recipientId, setRecipientId] = useState<string | null>('5G3Wr5f4fDv913LLLXq6B9a2c4oJonhSVXcs69wX7CkSC67k');
  const networkKey = useSelector((state: RootState) => state.currentNetwork.networkKey);
  const [isShowTxModal, setShowTxModal] = useState<boolean>(false);
  const [senderId, setSenderId] = useState<string | null>(null);
  const [extrinsic, setExtrinsic] = useState<any | null>(null);
  const [txResult, setTxResult] = useState<TxResult>({ isShowTxResult: false, isTxSuccess: false });
  const { isShowTxResult } = txResult;
  const _onSend = useCallback(() => {
    setShowTxModal(true);
  }, []);

  const _onTxSuccess = useCallback(() => {
  }, []);

  const _onTxFail = useCallback(() => {
  }, []);

  const _onCancelTx = useCallback(() => {
    setExtrinsic(null);
    setShowTxModal(false);
  }, []);

  const _onResend = () => {
    setTxResult({
      isTxSuccess: false,
      isShowTxResult: false,
      txError: undefined
    });
  };

  return (
    <>
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
            <InputAddress
              className={'send-fund-item'}
              defaultValue={propSenderId}
              help={t<string>('Select a contact or paste the address you want to send funds to.')}
              label={t<string>('Send to address')}
              // isDisabled={!!propRecipientId}
              labelExtra={
                <Available
                  label={t<string>('Transferable')}
                  params={''}
                />
              }
              onChange={setSenderId}
              type='allPlus'
              withEllipsis
            />

            <InputAddress
              autoPrefill={false}
              className={'send-fund-item'}
              help={t<string>('Select a contact or paste the address you want to send funds to.')}
              label={t<string>('Send to address')}
              // isDisabled={!!propRecipientId}
              labelExtra={
                <Available
                  label={t<string>('Transferable')}
                  params={recipientId}
                />
              }
              onChange={setRecipientId}
              type='allPlus'
              withEllipsis
            />

            <InputBalance
              autoFocus
              className={'send-fund-balance-item'}
              defaultValue={4}
              help={'The full account balance to be transferred, minus the transaction fees'}
              isDisabled={false}
              isSi
              key={'key'}
              label={'transferable minus fees'}
            />
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
          requestAddress={senderId}
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
