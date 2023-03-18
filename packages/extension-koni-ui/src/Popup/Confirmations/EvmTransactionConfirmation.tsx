// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ConfirmationsQueueItem, EvmSendTransactionRequest } from '@subwallet/extension-base/background/KoniTypes';
import { ConfirmationGeneralInfo, MetaInfo, ViewDetailIcon } from '@subwallet/extension-koni-ui/components';
import useGetAccountByAddress from '@subwallet/extension-koni-ui/hooks/account/useGetAccountByAddress';
import useGetChainInfoByChainId from '@subwallet/extension-koni-ui/hooks/chain/useGetChainInfoByChainId';
import useOpenDetailModal from '@subwallet/extension-koni-ui/hooks/confirmation/useOpenDetailModal';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { EvmSignatureSupportType } from '@subwallet/extension-koni-ui/types/confirmation';
import { isEvmMessage } from '@subwallet/extension-koni-ui/util';
import { Button } from '@subwallet/react-ui';
import CN from 'classnames';
import React from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

import { BaseDetailModal, EvmTransactionDetail } from './Detail';
import { EvmSignArea } from './Sign';

interface Props extends ThemeProps {
  type: EvmSignatureSupportType
  request: ConfirmationsQueueItem<EvmSendTransactionRequest>
}

const convertToBigN = (num: EvmSendTransactionRequest['value']): string | number | undefined => {
  if (typeof num === 'object') {
    return num.toNumber();
  } else {
    return num;
  }
};

function Component ({ className, request, type }: Props) {
  console.log('request', request);
  const { id, payload: { account, chainId, to } } = request;
  const { t } = useTranslation();
  const chainInfo = useGetChainInfoByChainId(chainId);
  const recipientAddress = to;
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
          {request.payload.estimateGas &&
              <MetaInfo.Number
                decimals={chainInfo?.evmInfo?.decimals}
                label={t('Estimated gas')}
                suffix={chainInfo?.evmInfo?.symbol}
                value={request.payload.estimateGas || '0'}
              />}
        </MetaInfo>
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
        title={t('Transaction details')}
      >
        <EvmTransactionDetail
          account={account}
          request={request.payload}
        />
      </BaseDetailModal>
    </>
  );
}

const EvmTransactionConfirmation = styled(Component)<Props>(({ theme: { token } }: ThemeProps) => ({
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

export default EvmTransactionConfirmation;
