// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ConfirmationDefinitions, EvmSendTransactionRequest } from '@subwallet/extension-base/background/KoniTypes';
import AccountItemWithName from '@subwallet/extension-koni-ui/components/Account/Item/AccountItemWithName';
import ConfirmationGeneralInfo from '@subwallet/extension-koni-ui/components/Confirmation/ConfirmationGeneralInfo';
import ViewDetailIcon from '@subwallet/extension-koni-ui/components/Icon/ViewDetailIcon';
import MetaInfo from '@subwallet/extension-koni-ui/components/MetaInfo';
import useGetAccountByAddress from '@subwallet/extension-koni-ui/hooks/account/useGetAccountByAddress';
import useGetChainInfoByChainId from '@subwallet/extension-koni-ui/hooks/chain/useGetChainInfoByChainId';
import useOpenDetailModal from '@subwallet/extension-koni-ui/hooks/confirmation/useOpenDetailModal';
import BaseDetailModal from '@subwallet/extension-koni-ui/Popup/Confirmations/Detail/BaseDetailModal';
import EvmMessageDetail from '@subwallet/extension-koni-ui/Popup/Confirmations/Detail/Evm/Message';
import EvmTransactionDetail from '@subwallet/extension-koni-ui/Popup/Confirmations/Detail/Evm/Transaction';
import EvmSignArea from '@subwallet/extension-koni-ui/Popup/Confirmations/Sign/Evm';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { EvmSignatureSupportType } from '@subwallet/extension-koni-ui/types/confirmation';
import { isEvmMessage } from '@subwallet/extension-koni-ui/util';
import { Button } from '@subwallet/react-ui';
import CN from 'classnames';
import React from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

interface Props extends ThemeProps {
  type: EvmSignatureSupportType
  request: ConfirmationDefinitions[EvmSignatureSupportType][0]
}

const convertToBigN = (num: EvmSendTransactionRequest['value']): string | number | undefined => {
  if (typeof num === 'object') {
    return num.toNumber();
  } else {
    return num;
  }
};

function Component ({ className, request, type }: Props) {
  const { id, payload: { account } } = request;
  const { t } = useTranslation();

  const chainId = (request.payload as EvmSendTransactionRequest).chainId;
  const chainInfo = useGetChainInfoByChainId(chainId);

  const recipientAddress = (request.payload as EvmSendTransactionRequest).to;
  const recipient = useGetAccountByAddress(recipientAddress);

  const isMessage = isEvmMessage(request);

  const onClickDetail = useOpenDetailModal();

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
      <EvmSignArea
        id={id}
        payload={request}
        type={type}
      />
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
