// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { EvmNftSubmitTransaction, NftItem, NftTransactionResponse, SubstrateNftSubmitTransaction } from '@subwallet/extension-base/background/KoniTypes';
import { AccountJson } from '@subwallet/extension-base/background/types';
import InputAddress from '@subwallet/extension-koni-ui/components/InputAddress';
import Modal from '@subwallet/extension-koni-ui/components/Modal';
import SigningRequest from '@subwallet/extension-koni-ui/components/Signing/SigningRequest';
import { ExternalRequestContext } from '@subwallet/extension-koni-ui/contexts/ExternalRequestContext';
import { SigningContext } from '@subwallet/extension-koni-ui/contexts/SigningContext';
import useGetNetworkJson from '@subwallet/extension-koni-ui/hooks/screen/home/useGetNetworkJson';
import { useRejectExternalRequest } from '@subwallet/extension-koni-ui/hooks/useRejectExternalRequest';
import useTranslation from '@subwallet/extension-koni-ui/hooks/useTranslation';
import { evmNftSubmitTransaction, makeTransferNftLedgerSubstrate, makeTransferNftQrEvm, makeTransferNftQrSubstrate, nftForceUpdate, substrateNftSubmitTransaction } from '@subwallet/extension-koni-ui/messaging';
import { SubstrateTransferParams, Web3TransferParams } from '@subwallet/extension-koni-ui/Popup/Home/Nfts/utils';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import CN from 'classnames';
import React, { useCallback, useContext, useMemo } from 'react';
import styled from 'styled-components';

interface Props extends ThemeProps {
  className?: string;
  setShowConfirm: (val: boolean) => void;
  senderAccount: AccountJson;
  substrateTransferParams: SubstrateTransferParams;
  setShowResult: (val: boolean) => void;
  setExtrinsicHash: (val: string) => void;
  setIsTxSuccess: (val: boolean) => void;
  setTxError: (val: string) => void;
  nftItem: NftItem;
  collectionId: string;
  recipientAddress: string;
  chain: string;
  web3TransferParams: Web3TransferParams;
}

function AuthTransfer ({ chain, className, collectionId, nftItem, recipientAddress, senderAccount, setExtrinsicHash, setIsTxSuccess, setShowConfirm, setShowResult, setTxError, substrateTransferParams, web3TransferParams }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();

  const { handlerReject } = useRejectExternalRequest();

  const { externalState: { externalId } } = useContext(ExternalRequestContext);
  const { signingState: { isBusy } } = useContext(SigningContext);

  const substrateGas = substrateTransferParams !== null ? substrateTransferParams.estimatedFee : null;

  const web3Gas = web3TransferParams !== null ? web3TransferParams.estimatedGas : null;

  const network = useGetNetworkJson(chain);

  const evmParams = useMemo((): EvmNftSubmitTransaction | null => {
    return web3TransferParams?.rawTx
      ? {
        senderAddress: senderAccount.address,
        recipientAddress: recipientAddress,
        networkKey: chain,
        rawTransaction: web3TransferParams.rawTx
      }
      : null;
  }, [senderAccount.address, chain, recipientAddress, web3TransferParams?.rawTx]);

  const substrateParams = useMemo((): SubstrateNftSubmitTransaction | null => {
    return substrateTransferParams?.params
      ? {
        params: substrateTransferParams.params,
        senderAddress: senderAccount.address,
        recipientAddress: recipientAddress
      }
      : null;
  }, [recipientAddress, senderAccount.address, substrateTransferParams?.params]);

  const onAfterSuccess = useCallback((res: NftTransactionResponse) => {
    nftForceUpdate({
      chain: chain,
      collectionId: collectionId,
      isSendingSelf: res.isSendingSelf,
      nft: nftItem,
      recipientAddress: recipientAddress,
      senderAddress: senderAccount.address
    })
      .catch(console.error);
  }, [senderAccount.address, chain, collectionId, nftItem, recipientAddress]);

  const onFail = useCallback((errors: string[], extrinsicHash?: string) => {
    setIsTxSuccess(false);
    setTxError(errors[0]);
    setShowConfirm(false);
    setShowResult(true);
    setExtrinsicHash(extrinsicHash || '');
  }, [setExtrinsicHash, setIsTxSuccess, setShowConfirm, setShowResult, setTxError]);

  const onSuccess = useCallback((extrinsicHash: string) => {
    setIsTxSuccess(true);
    setShowConfirm(false);
    setShowResult(true);
    setExtrinsicHash(extrinsicHash);
  }, [setExtrinsicHash, setIsTxSuccess, setShowConfirm, setShowResult]);

  const hideConfirm = useCallback(async () => {
    if (!isBusy) {
      await handlerReject(externalId);

      setShowConfirm(false);
    }
  }, [externalId, handlerReject, isBusy, setShowConfirm]);

  const renderInfo = useCallback(() => {
    return (
      <>
        <div className={'fee'}>Fees of {substrateGas || web3Gas} will be applied to the submission</div>
        <InputAddress
          className={'sender-container'}
          defaultValue={senderAccount.address}
          help={t<string>('The account you will send NFT from.')}
          isDisabled={true}
          isSetDefaultValue={true}
          label={t<string>('Send from account')}
          networkPrefix={network.ss58Format}
          type='account'
          withEllipsis
        />
      </>
    );
  }, [network.ss58Format, senderAccount.address, substrateGas, t, web3Gas]);

  return (
    <div className={className}>
      <Modal>
        <div className={'header-confirm'}>
          <div
            className={'header-title-confirm'}
          >
            Authorize transaction
          </div>
          <div
            className={CN('close-button-confirm', { disable: isBusy })}
            // eslint-disable-next-line @typescript-eslint/no-misused-promises
            onClick={!isBusy ? hideConfirm : undefined}
          >
            {t('Cancel')}
          </div>
        </div>

        {
          evmParams && (
            <SigningRequest
              account={senderAccount}
              balanceError={web3TransferParams?.balanceError}
              handleSignPassword={evmNftSubmitTransaction}
              handleSignQr={makeTransferNftQrEvm}
              hideConfirm={hideConfirm}
              message={'There is problem when transferNft'}
              network={network}
              onAfterSuccess={onAfterSuccess}
              onFail={onFail}
              onSuccess={onSuccess}
              params={evmParams}
            >
              { renderInfo() }
            </SigningRequest>
          )
        }

        {
          substrateParams && (
            <SigningRequest
              account={senderAccount}
              balanceError={substrateTransferParams?.balanceError}
              handleSignLedger={makeTransferNftLedgerSubstrate}
              handleSignPassword={substrateNftSubmitTransaction}
              handleSignQr={makeTransferNftQrSubstrate}
              hideConfirm={hideConfirm}
              message={'There is problem when transferNft'}
              network={network}
              onAfterSuccess={onAfterSuccess}
              onFail={onFail}
              onSuccess={onSuccess}
              params={substrateParams}
            >
              { renderInfo() }
            </SigningRequest>
          )
        }

      </Modal>
    </div>
  );
}

export default React.memo(styled(AuthTransfer)(({ theme }: Props) => `
  .auth-container {
    padding-left: 15px;
    padding-right: 15px;
    padding-bottom: 15px;
    padding-top: 10px;
  }

  .auth-transaction-body {
    flex: 1;
    padding-left: 15px;
    padding-right: 15px;
    padding-bottom: 15px;
    padding-top: 25px;
    overflow-y: auto;
  }

  .display-qr {
    margin: 0 30px;
    display: flex;
    justify-content: center;
    align-items: center;

    .qr-content {
      height: 324px;
      width: 324px;
      border: 2px solid ${theme.textColor};
    }
  }

  .scan-qr {
    margin: 0 20px;
  }

  .auth-transaction__separator + .auth-transaction__info {
    margin-top: 10px;
  }

  .sender-container {
    .input-address__dropdown {
      height: auto;
    }
  }

  .auth-transaction__submit-wrapper {
    position: sticky;
    bottom: -15px;
    padding: 15px;
    margin-left: -15px;
    margin-bottom: -15px;
    margin-right: -15px;
    background-color: ${theme.background};
  }

  .subwallet-modal {
    max-width: 460px;
    left: 0;
    right: 0;
    top: 0;
    bottom: 0;
    border-radius: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    border: 1px solid ${theme.extensionBorder};
  }

  .spinner-loading {
    position: relative;
    height: 26px;
    width: 26px;
    opacity: 1;
  }

  .password-error {
    font-size: 12px;
    color: red;
    text-transform: uppercase;
  }

  .submit-btn {
    position: relative;
    border-radius: 8px;
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 10px;
    color: #FFFFFF;
    cursor: pointer;
  }

  .call-hash-container {
    margin-top: 20px;
  }

  .sender-container {
    margin-top: 20px;
  }

  .fee {
    font-size: 16px;
  }

  .header-confirm {
    width: 100%;
    display: flex;
    justify-content: space-between;
    margin-bottom: 12px;
    font-size: 24px;
    font-weight: 500;
    line-height: 36px;
    font-style: normal;
    box-shadow: ${theme.headerBoxShadow};
    padding-top: 20px;
    padding-bottom: 20px;
    padding-left: 15px;
    padding-right: 15px;
  }

  .close-button-confirm {
    text-align: right;
    font-size: 14px;
    cursor: pointer;
    color: ${theme.textColor3};
    position: absolute;
    right: 15px;
    opacity: 0.85;
  }

  .close-button-confirm:hover {
    opacity: 1;
  }

  .close-button-confirm.disable {
    cursor: not-allowed;
    opacity: 0.5;
  }

  .header-alignment {
    width: 20%;
  }

  .header-title-confirm {
    width: 100%;
    text-align: center;
  }
`));
