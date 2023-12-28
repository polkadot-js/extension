// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ConfirmationDefinitions, ExtrinsicType } from '@subwallet/extension-base/background/KoniTypes';
import { SigningRequest } from '@subwallet/extension-base/background/types';
import { SWTransactionResult } from '@subwallet/extension-base/services/transaction-service/types';
import { RootState } from '@subwallet/extension-koni-ui/stores';
import { ConfirmationQueueItem } from '@subwallet/extension-koni-ui/stores/base/RequestState';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import CN from 'classnames';
import React, { useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import { EvmSignArea, SubstrateSignArea } from '../../parts/Sign';
import { BaseTransactionConfirmation, SendNftTransactionConfirmation, TransferBlock } from './variants';

interface Props extends ThemeProps {
  confirmation: ConfirmationQueueItem;
}

const getTransactionComponent = (extrinsicType: ExtrinsicType): typeof BaseTransactionConfirmation => {
  switch (extrinsicType) {
    case ExtrinsicType.TRANSFER_BALANCE:
    case ExtrinsicType.TRANSFER_TOKEN:
    case ExtrinsicType.TRANSFER_XCM:
      return TransferBlock;
    case ExtrinsicType.SEND_NFT:
      return SendNftTransactionConfirmation;
    // case ExtrinsicType.STAKING_JOIN_POOL:
    //   return JoinPoolTransactionConfirmation;
    // case ExtrinsicType.STAKING_LEAVE_POOL:
    //   return LeavePoolTransactionConfirmation;
    // case ExtrinsicType.STAKING_BOND:
    //   return BondTransactionConfirmation;
    // case ExtrinsicType.STAKING_UNBOND:
    //   return UnbondTransactionConfirmation;
    // case ExtrinsicType.STAKING_WITHDRAW:
    //   return WithdrawTransactionConfirmation;
    // case ExtrinsicType.STAKING_CLAIM_REWARD:
    //   return ClaimRewardTransactionConfirmation;
    // case ExtrinsicType.STAKING_CANCEL_UNSTAKE:
    //   return CancelUnstakeTransactionConfirmation;
    // case ExtrinsicType.MINT_QDOT:
    // case ExtrinsicType.MINT_LDOT:
    // case ExtrinsicType.MINT_SDOT:
    // case ExtrinsicType.MINT_STDOT:
    // case ExtrinsicType.MINT_VDOT:
    //   return JoinYieldPoolConfirmation;
    case ExtrinsicType.REDEEM_QDOT:
    case ExtrinsicType.REDEEM_LDOT:
    case ExtrinsicType.REDEEM_SDOT:
    case ExtrinsicType.REDEEM_STDOT:
    case ExtrinsicType.REDEEM_VDOT:
      // return FastWithdrawTransactionConfirmation;
    // eslint-disable-next-line no-fallthrough
    default:
      return BaseTransactionConfirmation;
  }
};

const Component: React.FC<Props> = (props: Props) => {
  const { className, confirmation: { item, type } } = props;
  const { id } = item;

  const { transactionRequest } = useSelector((state: RootState) => state.requestState);

  const transaction = useMemo(() => transactionRequest[id], [transactionRequest, id]);

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
            extrinsicType={transaction.extrinsicType}
            id={item.id}
            request={(item as SigningRequest).request}
          />
        )
      }
      {
        (type === 'evmSendTransactionRequest' || type === 'evmWatchTransactionRequest') && (
          <EvmSignArea
            extrinsicType={transaction.extrinsicType}
            id={item.id}
            payload={(item as ConfirmationDefinitions['evmSendTransactionRequest' | 'evmWatchTransactionRequest'][0])}
            type={type}
          />
        )
      }
    </>
  );
};

const TransactionConfirmation = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {
    '--content-gap': 0,
    marginTop: token.marginXS,

    '.-to-right': {
      '.__value': {
        textAlign: 'right'
      }
    }
  };
});

export default TransactionConfirmation;
