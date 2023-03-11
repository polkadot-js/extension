// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ConfirmationDefinitions, ExtrinsicType } from '@subwallet/extension-base/background/KoniTypes';
import { SigningRequest } from '@subwallet/extension-base/background/types';
import { SWTransactionResult } from '@subwallet/extension-base/services/transaction-service/types';
import useParseSubstrateRequestPayload from '@subwallet/extension-koni-ui/hooks/confirmation/useParseSubstrateRequestPayload';
import EvmSignArea from '@subwallet/extension-koni-ui/Popup/Confirmations/Sign/Evm';
import SubstrateSignArea from '@subwallet/extension-koni-ui/Popup/Confirmations/Sign/Substrate';
import BaseTransactionConfirmation from '@subwallet/extension-koni-ui/Popup/Confirmations/Transaction/parts/Base';
import StakeTransactionConfirmation from '@subwallet/extension-koni-ui/Popup/Confirmations/Transaction/parts/Stake';
import { RootState } from '@subwallet/extension-koni-ui/stores';
import { ConfirmationQueueItem } from '@subwallet/extension-koni-ui/stores/base/RequestState';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import CN from 'classnames';
import React, { useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

interface Props extends ThemeProps {
  confirmation: ConfirmationQueueItem;
}

const getTransactionComponent = (extrinsicType: ExtrinsicType): typeof BaseTransactionConfirmation => {
  switch (extrinsicType) {
    case ExtrinsicType.STAKING_STAKE:
      return StakeTransactionConfirmation;
    default:
      return BaseTransactionConfirmation;
  }
};

const Component: React.FC<Props> = (props: Props) => {
  const { className, confirmation: { item, type } } = props;
  const { id } = item;

  const { transactionRequest } = useSelector((state: RootState) => state.requestState);

  const transaction = useMemo(() => transactionRequest[id], [transactionRequest, id]);

  const substratePayload = useParseSubstrateRequestPayload(type === 'signingRequest' ? (item as SigningRequest).request : undefined);

  const renderContent = useCallback((transaction: SWTransactionResult): React.ReactNode => {
    const { extrinsicType } = transaction;

    const Component = getTransactionComponent(extrinsicType);

    return <Component transaction={transaction} />;
  }, []);

  return (
    <>
      <div className={CN(className, 'confirmation-content')}>
        {renderContent(transaction)}
      </div>
      {
        type === 'signingRequest' && (
          <SubstrateSignArea
            account={(item as SigningRequest).account}
            id={item.id}
            payload={substratePayload}
          />
        )
      }
      {
        type === 'evmSendTransactionRequest' && (
          <EvmSignArea
            id={item.id}
            payload={(item as ConfirmationDefinitions['evmSendTransactionRequest'][0])}
            type='evmSendTransactionRequest'
          />
        )
      }
    </>
  );
};

const TransactionConfirmation = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {};
});

export default TransactionConfirmation;
