// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ConfirmationDefinitions, ExtrinsicType } from '@subwallet/extension-base/background/KoniTypes';
import { SigningRequest } from '@subwallet/extension-base/background/types';
import { SWTransactionResult } from '@subwallet/extension-base/services/transaction-service/types';
import { SwapTxData } from '@subwallet/extension-base/types/swap';
import { AlertBox } from '@subwallet/extension-web-ui/components';
import { useTranslation } from '@subwallet/extension-web-ui/hooks';
import { RootState } from '@subwallet/extension-web-ui/stores';
import { ConfirmationQueueItem } from '@subwallet/extension-web-ui/stores/base/RequestState';
import { AlertDialogProps, ThemeProps } from '@subwallet/extension-web-ui/types';
import CN from 'classnames';
import React, { useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import { EvmSignArea, SubstrateSignArea } from '../../parts/Sign';
import { BaseTransactionConfirmation, BondTransactionConfirmation, CancelUnstakeTransactionConfirmation, ClaimRewardTransactionConfirmation, DefaultWithdrawTransactionConfirmation, FastWithdrawTransactionConfirmation, JoinPoolTransactionConfirmation, JoinYieldPoolConfirmation, LeavePoolTransactionConfirmation, SendNftTransactionConfirmation, SwapTransactionConfirmation, TokenApproveConfirmation, TransferBlock, UnbondTransactionConfirmation, WithdrawTransactionConfirmation } from './variants';

interface Props extends ThemeProps {
  confirmation: ConfirmationQueueItem;
  openAlert: (alertProps: AlertDialogProps) => void;
  closeAlert: VoidFunction;
}

const getTransactionComponent = (extrinsicType: ExtrinsicType): typeof BaseTransactionConfirmation => {
  switch (extrinsicType) {
    case ExtrinsicType.TRANSFER_BALANCE:
    case ExtrinsicType.TRANSFER_TOKEN:
    case ExtrinsicType.TRANSFER_XCM:
      return TransferBlock;
    case ExtrinsicType.SEND_NFT:
      return SendNftTransactionConfirmation;
    case ExtrinsicType.STAKING_JOIN_POOL:
      return JoinPoolTransactionConfirmation;
    case ExtrinsicType.STAKING_LEAVE_POOL:
      return LeavePoolTransactionConfirmation;
    case ExtrinsicType.STAKING_BOND:
    case ExtrinsicType.JOIN_YIELD_POOL:
      return BondTransactionConfirmation;
    case ExtrinsicType.STAKING_UNBOND:
      return UnbondTransactionConfirmation;
    case ExtrinsicType.STAKING_WITHDRAW:
    case ExtrinsicType.STAKING_POOL_WITHDRAW:
      return WithdrawTransactionConfirmation;
    case ExtrinsicType.STAKING_CLAIM_REWARD:
      return ClaimRewardTransactionConfirmation;
    case ExtrinsicType.STAKING_CANCEL_UNSTAKE:
      return CancelUnstakeTransactionConfirmation;
    case ExtrinsicType.MINT_QDOT:
    case ExtrinsicType.MINT_VDOT:
    case ExtrinsicType.MINT_LDOT:
    case ExtrinsicType.MINT_SDOT:
    case ExtrinsicType.MINT_STDOT:
    case ExtrinsicType.MINT_VMANTA:
      return JoinYieldPoolConfirmation;
    case ExtrinsicType.REDEEM_QDOT:
    case ExtrinsicType.REDEEM_VDOT:
    case ExtrinsicType.REDEEM_LDOT:
    case ExtrinsicType.REDEEM_SDOT:
    case ExtrinsicType.REDEEM_STDOT:
    case ExtrinsicType.REDEEM_VMANTA:
      return FastWithdrawTransactionConfirmation;
    case ExtrinsicType.UNSTAKE_QDOT:
    case ExtrinsicType.UNSTAKE_VDOT:
    case ExtrinsicType.UNSTAKE_LDOT:
    case ExtrinsicType.UNSTAKE_SDOT:
    case ExtrinsicType.UNSTAKE_STDOT:
    case ExtrinsicType.UNSTAKE_VMANTA:
      return DefaultWithdrawTransactionConfirmation;
    case ExtrinsicType.TOKEN_APPROVE:
      return TokenApproveConfirmation;
    case ExtrinsicType.SWAP:
      return SwapTransactionConfirmation;
    case ExtrinsicType.CROWDLOAN:
    case ExtrinsicType.STAKING_CANCEL_COMPOUNDING:
    case ExtrinsicType.STAKING_COMPOUNDING:
    case ExtrinsicType.EVM_EXECUTE:
    case ExtrinsicType.UNKNOWN:
      return BaseTransactionConfirmation;
  }
};

const Component: React.FC<Props> = (props: Props) => {
  const { className, closeAlert, confirmation: { item, type },
    openAlert } = props;
  const { id } = item;

  const { t } = useTranslation();

  const { transactionRequest } = useSelector((state: RootState) => state.requestState);
  const { chainInfoMap } = useSelector((state: RootState) => state.chainStore);

  const transaction = useMemo(() => transactionRequest[id], [transactionRequest, id]);

  const network = useMemo(() => chainInfoMap[transaction.chain], [chainInfoMap, transaction.chain]);

  const renderContent = useCallback((transaction: SWTransactionResult): React.ReactNode => {
    const { extrinsicType } = transaction;

    const Component = getTransactionComponent(extrinsicType);

    return (
      <Component
        closeAlert={closeAlert}
        openAlert={openAlert}
        transaction={transaction}
      />
    );
  }, [closeAlert, openAlert]);

  const txExpirationTime = useMemo((): number | undefined => {
    // transaction might only be valid for a certain period of time
    if (transaction.extrinsicType === ExtrinsicType.SWAP) {
      const data = transaction.data as SwapTxData;

      return data.quote.aliveUntil;
    }
    // todo: there might be more types of extrinsic

    return undefined;
  }, [transaction.data, transaction.extrinsicType]);

  return (
    <>
      <div className={CN(className, 'confirmation-content')}>
        {renderContent(transaction)}
        {!!transaction.estimateFee?.tooHigh && (
          <AlertBox
            className='network-box'
            description={t('Gas fees on {{networkName}} are high due to high demands, so gas estimates are less accurate.', { replace: { networkName: network?.name } })}
            title={t('Pay attention!')}
            type='warning'
          />
        )}
      </div>
      {
        type === 'signingRequest' && (
          <SubstrateSignArea
            account={(item as SigningRequest).account}
            extrinsicType={transaction.extrinsicType}
            id={item.id}
            request={(item as SigningRequest).request}
            txExpirationTime={txExpirationTime}
          />
        )
      }
      {
        (type === 'evmSendTransactionRequest' || type === 'evmWatchTransactionRequest') && (
          <EvmSignArea
            extrinsicType={transaction.extrinsicType}
            id={item.id}
            payload={(item as ConfirmationDefinitions['evmSendTransactionRequest' | 'evmWatchTransactionRequest'][0])}
            txExpirationTime={txExpirationTime}
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

    '.network-box': {
      marginTop: token.marginSM
    },

    '.-to-right': {
      '.__value': {
        textAlign: 'right'
      }
    }
  };
});

export default TransactionConfirmation;
