// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ConfirmationDefinitions } from '@subwallet/extension-base/background/KoniTypes';
import { SigningRequest } from '@subwallet/extension-base/background/types';
import useParseSubstrateRequestPayload from '@subwallet/extension-koni-ui/hooks/confirmation/useParseSubstrateRequestPayload';
import EvmSignArea from '@subwallet/extension-koni-ui/Popup/Confirmations/Sign/Evm';
import SubstrateSignArea from '@subwallet/extension-koni-ui/Popup/Confirmations/Sign/Substrate';
import { ConfirmationQueueItem } from '@subwallet/extension-koni-ui/stores/base/RequestState';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import CN from 'classnames';
import React from 'react';
import styled from 'styled-components';

interface Props extends ThemeProps {
  confirmation: ConfirmationQueueItem;
}

const Component: React.FC<Props> = (props: Props) => {
  const { className, confirmation: { item, type } } = props;

  const substratePayload = useParseSubstrateRequestPayload(type === 'signingRequest' ? (item as SigningRequest).request : undefined);

  return (
    <>
      <div className={CN(className, 'confirmation-content')}>
        {type}
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
