// Copyright 2019-2022 @polkadot/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React, { useCallback, useState } from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import { SubmittableExtrinsic } from '@polkadot/api/types';
import { NftItem as _NftItem } from '@polkadot/extension-base/background/KoniTypes';
import { isValidAddress } from '@polkadot/extension-koni-base/utils/utils';
import paramsHandler from '@polkadot/extension-koni-ui/Popup/Home/Nfts/api/paramsHandler';
import transferHandler from '@polkadot/extension-koni-ui/Popup/Home/Nfts/api/transferHandler';
import TransferConfirm from '@polkadot/extension-koni-ui/Popup/Home/Nfts/component/TransferConfirm';
import useApi from '@polkadot/extension-koni-ui/Popup/Sending/old/hook/useApi';
import { RootState } from '@polkadot/extension-koni-ui/stores';
import { ThemeProps } from '@polkadot/extension-koni-ui/types';
import { RuntimeDispatchInfo } from '@polkadot/types/interfaces';

interface Props extends ThemeProps {
  className?: string;
  setShowTransfer: () => void;
  nftItem: _NftItem;
  showConfirm: boolean;
  showTransferResult: boolean;
  setShowConfirm: (val: boolean) => void;
  setShowTransferResult: (val: boolean) => void;
  goBack: () => void;
}

function TransferNftContainer ({ className, goBack, nftItem, setShowConfirm, setShowTransfer, setShowTransferResult, showConfirm, showTransferResult }: Props): React.ReactElement<Props> {
  const [recipientAddress, setRecipientAddress] = useState('');
  const [addressError, setAddressError] = useState(true);
  const { currentAccount: account } = useSelector((state: RootState) => state);
  const networkKey = nftItem.chain as string;
  const { api, isApiReady, isNotSupport } = useApi(networkKey);
  const [txInfo, setTxInfo] = useState<RuntimeDispatchInfo | null>(null);
  const [extrinsic, setExtrinsic] = useState<SubmittableExtrinsic<'promise'> | null>(null);

  const handleChangeRecipient = useCallback((e: any) => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-assignment
    const address = e.target.value;

    setRecipientAddress(address as string);
    if (!isValidAddress(address as string)) setAddressError(true);
    else setAddressError(false);
  }, []);

  const handleSend = useCallback(async () => {
    if (addressError || !isApiReady || !networkKey || isNotSupport) return;
    // @ts-ignore
    const senderAddress = account.account.address;
    const params = paramsHandler(nftItem, networkKey);
    const transferMeta = await transferHandler(api, networkKey, senderAddress, recipientAddress, params);

    if (transferMeta) {
      setExtrinsic(transferMeta.extrinsic || null);
      setTxInfo(transferMeta.info || null);
      setShowConfirm(true);
    }
  }, [account, addressError, api, isApiReady, isNotSupport, networkKey, nftItem, recipientAddress, setShowConfirm]);

  const handleShowConfirm = useCallback(() => {
    if (!addressError && isApiReady && networkKey) setShowConfirm(!showConfirm);
  }, [addressError, isApiReady, networkKey, setShowConfirm, showConfirm]);

  return (
    <div className={className}>
      {
        !showConfirm && isApiReady &&
          <div>
            <div className={'header'}>
              <div />
              <div
                className={'header-title'}
              >
                Transfer NFT
              </div>
              <div
                className={'close-button'}
                onClick={setShowTransfer}
              >
                x
              </div>
            </div>

            <div className={'field-container'}>
              <div className={'field-title'}>Recipient</div>
              <input
                className={'input-value'}
                onChange={handleChangeRecipient}
                value={recipientAddress}
              />
            </div>

            <div className={'transfer-meta'}>
              <div className={'meta-title'}>
                <div>NFT</div>
                <div>Chain</div>
              </div>

              <div className={'meta-value'}>
                <div>{nftItem.name ? nftItem.name : '#' + nftItem.id}</div>
                <div style={{ textTransform: 'uppercase' }}>{nftItem?.chain}</div>
              </div>
            </div>

            <div
              className={'send-button-default ' + (addressError ? 'inactive-button' : 'active-button')}
              // eslint-disable-next-line @typescript-eslint/no-misused-promises
              onClick={handleSend}
            >
              Send
            </div>
          </div>
      }

      {
        showConfirm && isApiReady &&
          <TransferConfirm
            extrinsic={extrinsic}
            goBack={goBack}
            networkKey={networkKey}
            senderAccount={account?.account}
            setShowConfirm={handleShowConfirm}
            setShowResult={setShowTransferResult}
            showResult={showTransferResult}
            txInfo={txInfo}
          />
      }
    </div>
  );
}

export default React.memo(styled(TransferNftContainer)(({ theme }: Props) => `
  width: 100%;

  .inactive-button {
    opacity: 0.5;
  }

  .active-button {
    cursor: pointer;
  }

  .send-button-default {
    margin-top: 40px;
    background: #004BFF;
    border-radius: 8px;
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 10px;
    color: #FFFFFF;
  }

  .address-warning {
    color: red;
    font-size: 12px;
  }

  .transfer-meta {
    display: flex;
    justify-content: space-between;
    border: 2px dashed #212845;
    box-sizing: border-box;
    border-radius: 8px;
    padding: 10px;
    margin-top: 20px;
  }

  .meta-title {
    font-size: 14px;
    color: #7B8098;
  }

  .meta-value {
    text-align: right;
    font-size: 14px;
  }

  .field-container {
    display: flex;
    flex-direction: column;
    gap: 5px;
  }

  .field-title {
    text-transform: uppercase;
    font-size: 12px;
    color: #7B8098;
  }

  .input-value {
    background-color: ${theme.popupBackground};
    border-radius: 8px;
    padding: 10px 15px;
    font-size: 15px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    outline: none;
    border: 1px solid #181E42;
    color: ${theme.textColor};
  }

  .header {
    width: 100%;
    display: flex;
    justify-content: space-between;
    margin-bottom: 12px;
    font-size: 24px;
    font-weight: 500;
    line-height: 36px;
    font-style: normal;
  }

  .close-button {
    font-size: 20px;
    cursor: pointer;
  }
`));
