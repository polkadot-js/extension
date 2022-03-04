// Copyright 2019-2022 @polkadot/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React, {useCallback, useState} from 'react';
import styled from 'styled-components';

import { ThemeProps } from '@polkadot/extension-koni-ui/types';
import {NftItem as _NftItem} from "@polkadot/extension-base/background/KoniTypes";
import {isValidAddress} from "@polkadot/extension-koni-base/utils/utils";

interface Props extends ThemeProps {
  className?: string;
  setShowTransfer: () => void;
  nftItem: _NftItem;
}

function TransferNftContainer ({ className, nftItem, setShowTransfer }: Props): React.ReactElement<Props> {
  const [recipientAddress, setRecipientAddress] = useState('');
  const [addressError, setAddressError] = useState(false);

  const handleChangeRecipient = useCallback((e: any) => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-assignment
    const address = e.target.value;

    setRecipientAddress(address as string);
    if (!isValidAddress(address as string) || address === '') setAddressError(true);
    else setAddressError(false);
  }, []);

  return (
    <div className={className}>
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
        {
          addressError &&
          <div className={'address-warning'}>Recipient address is not valid</div>
        }
      </div>

      <div className={'transfer-meta'}>
        <div className={'meta-title'}>
          <div>NFT</div>
          <div>Chain</div>
          <div>Estimated fee</div>
        </div>

        <div className={'meta-value'}>
          <div>{nftItem.name ? nftItem.name : '#' + nftItem.id}</div>
          <div>Acala</div>
          <div>0 ACA</div>
        </div>
      </div>

      <div className={'send-button'}>Send</div>
    </div>
  );
}

export default React.memo(styled(TransferNftContainer)(({ theme }: Props) => `
  width: 100%;

  .send-button {
    margin-top: 40px;
    background: #004BFF;
    border-radius: 8px;
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 10px;
    color: #FFFFFF;
  }

  .send-button:hover {
    cursor: pointer;
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
