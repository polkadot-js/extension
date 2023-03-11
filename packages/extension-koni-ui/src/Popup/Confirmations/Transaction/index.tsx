// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ConfirmationDefinitions, ExtrinsicType } from '@subwallet/extension-base/background/KoniTypes';
import { SigningRequest } from '@subwallet/extension-base/background/types';
import { SWTransactionResult } from '@subwallet/extension-base/services/transaction-service/types';
import useParseSubstrateRequestPayload from '@subwallet/extension-koni-ui/hooks/confirmation/useParseSubstrateRequestPayload';
import { getTransaction } from '@subwallet/extension-koni-ui/messaging';
import EvmSignArea from '@subwallet/extension-koni-ui/Popup/Confirmations/Sign/Evm';
import SubstrateSignArea from '@subwallet/extension-koni-ui/Popup/Confirmations/Sign/Substrate';
import { TransferBlock } from '@subwallet/extension-koni-ui/Popup/Confirmations/Transaction/parts/TransferBlock';
import { ConfirmationQueueItem } from '@subwallet/extension-koni-ui/stores/base/RequestState';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import CN from 'classnames';
import React, { useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';

interface Props extends ThemeProps {
  confirmation: ConfirmationQueueItem;
}

const Component: React.FC<Props> = (props: Props) => {
  const { className, confirmation: { item, type } } = props;
  const [transactionResult, setTransactionResult] = useState<SWTransactionResult | null>(null);
  const { id: txId } = item;

  useEffect(() => {
    getTransaction({ id: txId }).then((rs) => {
      setTransactionResult(rs);
    }).catch((e) => {
      console.log('getTransaction error:', e);
    });
  }, [txId]);

  const substratePayload = useParseSubstrateRequestPayload(type === 'signingRequest' ? (item as SigningRequest).request : undefined);

  const contentBlock = useMemo(() => {
    if (!transactionResult) {
      return null;
    }

    if ([
      ExtrinsicType.TRANSFER_BALANCE,
      ExtrinsicType.TRANSFER_TOKEN,
      ExtrinsicType.TRANSFER_XCM
    ].includes(transactionResult.extrinsicType)) {
      return (<TransferBlock transactionResult={transactionResult} />);
    }

    return null;
  }, [transactionResult]);

  return (
    <>
      <div className={CN(className, 'confirmation-content')}>
        {contentBlock}
      </div>
      {
        type === 'signingRequest' && (
          <SubstrateSignArea
            account={(item as SigningRequest).account}
            id={txId}
            payload={substratePayload}
          />
        )
      }
      {
        type === 'evmSendTransactionRequest' && (
          <EvmSignArea
            id={txId}
            payload={(item as ConfirmationDefinitions['evmSendTransactionRequest'][0])}
            type='evmSendTransactionRequest'
          />
        )
      }
    </>
  );
};

const TransactionConfirmation = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {
    '--content-gap': 0,

    '&.confirmation-content.confirmation-content': {
      textAlign: 'left'
    }
  };
});

export default TransactionConfirmation;
