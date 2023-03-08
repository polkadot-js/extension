// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ConfirmationDefinitions, ConfirmationResult, EvmSendTransactionRequest } from '@subwallet/extension-base/background/KoniTypes';
import AccountItemWithName from '@subwallet/extension-koni-ui/components/Account/Item/AccountItemWithName';
import ConfirmationGeneralInfo from '@subwallet/extension-koni-ui/components/Confirmation/ConfirmationGeneralInfo';
import ViewDetailIcon from '@subwallet/extension-koni-ui/components/Icon/ViewDetailIcon';
import MetaInfo from '@subwallet/extension-koni-ui/components/MetaInfo';
import { CONFIRMATION_QR_MODAL } from '@subwallet/extension-koni-ui/constants/modal';
import { SIGN_MODE } from '@subwallet/extension-koni-ui/constants/signing';
import useGetAccountByAddress from '@subwallet/extension-koni-ui/hooks/account/useGetAccountByAddress';
import useGetChainInfoByChainId from '@subwallet/extension-koni-ui/hooks/chain/useGetChainInfoByChainId';
import useOpenDetailModal from '@subwallet/extension-koni-ui/hooks/confirmation/useOpenDetailModal';
import { completeConfirmation } from '@subwallet/extension-koni-ui/messaging';
import BaseDetailModal from '@subwallet/extension-koni-ui/Popup/Confirmations/Detail/BaseDetailModal';
import EvmMessageDetail from '@subwallet/extension-koni-ui/Popup/Confirmations/Detail/Evm/Message';
import EvmTransactionDetail from '@subwallet/extension-koni-ui/Popup/Confirmations/Detail/Evm/Transaction';
import DisplayPayloadModal from '@subwallet/extension-koni-ui/Popup/Confirmations/Qr/DisplayPayload';
import EvmQr from '@subwallet/extension-koni-ui/Popup/Confirmations/Qr/DisplayPayload/Evm';
import ScanSignature from '@subwallet/extension-koni-ui/Popup/Confirmations/Qr/ScanSignature';
import { PhosphorIcon, SigData, ThemeProps } from '@subwallet/extension-koni-ui/types';
import { getSignMode } from '@subwallet/extension-koni-ui/util/account';
import { Button, Icon, ModalContext } from '@subwallet/react-ui';
import CN from 'classnames';
import { CheckCircle, QrCode, Swatches, XCircle } from 'phosphor-react';
import React, { useCallback, useContext, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

type SupportConfirmationType = 'evmSendTransactionRequest' | 'evmSignatureRequest';
interface Props extends ThemeProps {
  type: SupportConfirmationType
  request: ConfirmationDefinitions['evmSendTransactionRequest'][0] | ConfirmationDefinitions['evmSignatureRequest'][0]
}

async function handleConfirm (type: SupportConfirmationType, id: string, payload: string) {
  return await completeConfirmation(type, { id, isApproved: true, payload } as ConfirmationResult<string>);
}

async function handleCancel (type: SupportConfirmationType, { id }: ConfirmationDefinitions[typeof type][0]) {
  return await completeConfirmation(type, { id, isApproved: false } as ConfirmationResult<string>);
}

async function handleSignature (type: SupportConfirmationType, id: string, signature: string) {
  return await completeConfirmation(type, { id, isApproved: true, payload: signature } as ConfirmationResult<string>);
}

const isMessageRequest = (request: ConfirmationDefinitions['evmSendTransactionRequest'][0] | ConfirmationDefinitions['evmSignatureRequest'][0]): request is ConfirmationDefinitions['evmSignatureRequest'][0] => {
  return !!(request as ConfirmationDefinitions['evmSignatureRequest'][0]).payload.type;
};

const convertToBigN = (num: EvmSendTransactionRequest['value']): string | number | undefined => {
  if (typeof num === 'object') {
    return num.toNumber();
  } else {
    return num;
  }
};

function Component ({ className, request, type }: Props) {
  const { payload: { account, canSign, hashPayload } } = request;
  const { t } = useTranslation();

  const { activeModal } = useContext(ModalContext);

  const [loading, setLoading] = useState(false);
  const signMode = useMemo(() => getSignMode(account), [account]);

  const chainId = (request.payload as EvmSendTransactionRequest).chainId;
  const chainInfo = useGetChainInfoByChainId(chainId);

  const recipientAddress = (request.payload as EvmSendTransactionRequest).to;
  const recipient = useGetAccountByAddress(recipientAddress);

  const isMessage = isMessageRequest(request);

  const approveIcon = useMemo((): PhosphorIcon => {
    switch (signMode) {
      case SIGN_MODE.QR:
        return QrCode;
      case SIGN_MODE.LEDGER:
        return Swatches;
      default:
        return CheckCircle;
    }
  }, [signMode]);

  const onClickDetail = useOpenDetailModal();

  // Handle buttons actions
  const onCancel = useCallback(() => {
    setLoading(true);
    handleCancel(type, request).finally(() => {
      setLoading(false);
    });
  }, [request, type]);

  const onApprovePassword = useCallback(() => {
    setLoading(true);
    setTimeout(() => {
      handleConfirm(type, request.id, '').finally(() => {
        setLoading(false);
      });
    }, 1000);
  }, [request.id, type]);

  const onApproveSignature = useCallback((signature: SigData) => {
    setLoading(true);

    setTimeout(() => {
      handleSignature(type, request.id, signature.signature)
        .catch((e) => {
          console.log(e);
        })
        .finally(() => {
          setLoading(false);
        });
    }, 300);
  }, [request.id, type]);

  const onConfirmQr = useCallback(() => {
    activeModal(CONFIRMATION_QR_MODAL);
  }, [activeModal]);

  const onConfirm = useCallback(() => {
    switch (signMode) {
      case SIGN_MODE.QR:
        onConfirmQr();
        break;
      default:
        onApprovePassword();
    }
  }, [onApprovePassword, onConfirmQr, signMode]);

  return (
    <>
      <div className={CN('confirmation-content', className)}>
        <ConfirmationGeneralInfo request={request} />
        <div className='title'>
          {isMessage ? t('Signature request') : t('Approve Request')}
        </div>
        {
          isMessage
            ? (
              <>
                <div className='description'>
                  {t('You are approving a request with account')}
                </div>
                <AccountItemWithName
                  accountName={account.name}
                  address={account.address}
                  avatarSize={24}
                  className='account-item'
                  isSelected={true}
                />
              </>
            )
            : (
              <MetaInfo>
                <MetaInfo.Number
                  decimals={chainInfo?.evmInfo?.decimals}
                  label={t('Amount')}
                  suffix={chainInfo?.evmInfo?.symbol}
                  value={convertToBigN(request.payload.value) || 0}
                />
                <MetaInfo.Account
                  address={account.address}
                  label={t('From account')}
                  name={account.name}
                />
                <MetaInfo.Account
                  address={recipient?.address || recipientAddress || ''}
                  label={request.payload.isToContract ? t('To contract') : t('To account')}
                  name={recipient?.name}
                />
                <MetaInfo.Number
                  decimals={chainInfo?.evmInfo?.decimals}
                  label={t('Estimated gas')}
                  suffix={chainInfo?.evmInfo?.symbol}
                  value={request.payload.estimateGas}
                />
              </MetaInfo>
            )
        }
        <div>
          <Button
            icon={<ViewDetailIcon />}
            onClick={onClickDetail}
            size='xs'
            type='ghost'
          >
            {t('View detail')}
          </Button>
        </div>
      </div>
      <div className='confirmation-footer'>
        <Button
          disabled={loading}
          icon={(
            <Icon
              phosphorIcon={XCircle}
              weight='fill'
            />
          )}
          onClick={onCancel}
          schema={'secondary'}
        >
          {t('Cancel')}
        </Button>
        <Button
          disabled={!canSign}
          icon={(
            <Icon
              phosphorIcon={approveIcon}
              weight='fill'
            />
          )}
          loading={loading}
          onClick={onConfirm}
        >
          {t('Approve')}
        </Button>
      </div>
      <BaseDetailModal
        title={isMessage ? t('Message details') : t('Transaction details')}
      >
        {
          isMessage &&
            (
              <EvmMessageDetail payload={request.payload} />
            )
        }
        {
          !isMessage &&
            (
              <EvmTransactionDetail
                account={account}
                request={request.payload}
              />
            )
        }
      </BaseDetailModal>
      {
        signMode === SIGN_MODE.QR && (
          <DisplayPayloadModal>
            <EvmQr
              address={account.address}
              hashPayload={hashPayload}
              isMessage={isMessage}
            />
          </DisplayPayloadModal>
        )
      }
      {signMode === SIGN_MODE.QR && <ScanSignature onSignature={onApproveSignature} />}
    </>
  );
}

const EvmSignatureConfirmation = styled(Component)<Props>(({ theme: { token } }: ThemeProps) => ({
  '.account-list': {
    '.__prop-label': {
      marginRight: token.marginMD,
      width: '50%',
      float: 'left'
    }
  },

  '.__label': {
    textAlign: 'left'
  }
}));

export default EvmSignatureConfirmation;
