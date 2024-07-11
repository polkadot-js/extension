// Copyright 2019-2022 @subwallet/extension-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _ChainAsset, _ChainInfo } from '@subwallet/chain-list/types';
import { TransactionError } from '@subwallet/extension-base/background/errors/TransactionError';
import { _Address, AmountData, BasicTxErrorType, BasicTxWarningCode, ExtrinsicType, FeeData, TransferTxErrorType } from '@subwallet/extension-base/background/KoniTypes';
import { TransactionWarning } from '@subwallet/extension-base/background/warnings/TransactionWarning';
import { XCM_MIN_AMOUNT_RATIO } from '@subwallet/extension-base/constants';
import { _canAccountBeReaped, FrameSystemAccountInfo } from '@subwallet/extension-base/core/substrate/system-pallet';
import { _TRANSFER_CHAIN_GROUP } from '@subwallet/extension-base/services/chain-service/constants';
import { _EvmApi } from '@subwallet/extension-base/services/chain-service/types';
import { _getChainExistentialDeposit, _getChainNativeTokenBasicInfo, _getContractAddressOfToken, _getTokenMinAmount, _isNativeToken, _isTokenEvmSmartContract } from '@subwallet/extension-base/services/chain-service/utils';
import { calculateGasFeeParams } from '@subwallet/extension-base/services/fee-service/utils';
import { isSubstrateTransaction } from '@subwallet/extension-base/services/transaction-service/helpers';
import { OptionalSWTransaction, SWTransactionInput, SWTransactionResponse } from '@subwallet/extension-base/services/transaction-service/types';
import { balanceFormatter, formatNumber } from '@subwallet/extension-base/utils';
import { KeyringPair } from '@subwallet/keyring/types';
import { keyring } from '@subwallet/ui-keyring';
import BigN from 'bignumber.js';
import { t } from 'i18next';

import { isEthereumAddress } from '@polkadot/util-crypto';

// normal transfer
export function validateTransferRequest (tokenInfo: _ChainAsset, from: _Address, to: _Address, value: string | undefined, transferAll: boolean | undefined): [TransactionError[], KeyringPair | undefined, BigN | undefined] {
  const errors: TransactionError[] = [];
  const keypair = keyring.getPair(from);
  let transferValue;

  if (!transferAll) {
    if (value === undefined) {
      errors.push(new TransactionError(BasicTxErrorType.INVALID_PARAMS, t('Transfer amount is required')));
    }

    if (value) {
      transferValue = new BigN(value);
    }
  }

  if (!tokenInfo) {
    errors.push(new TransactionError(BasicTxErrorType.INVALID_PARAMS, t('Not found token from registry')));
  }

  if (isEthereumAddress(from) && isEthereumAddress(to) && _isTokenEvmSmartContract(tokenInfo) && _getContractAddressOfToken(tokenInfo).length === 0) {
    errors.push(new TransactionError(BasicTxErrorType.INVALID_PARAMS, t('Not found ERC20 address for this token')));
  }

  return [errors, keypair, transferValue];
}

export function additionalValidateTransfer (tokenInfo: _ChainAsset, extrinsicType: ExtrinsicType, receiverTransferTokenFreeBalance: string, transferAmount: string, senderTransferTokenTransferable?: string): [TransactionWarning | undefined, TransactionError | undefined] {
  const minAmount = _getTokenMinAmount(tokenInfo);
  let warning: TransactionWarning | undefined;
  let error: TransactionError | undefined;

  // Check ed of not native token for sender
  if (extrinsicType === ExtrinsicType.TRANSFER_TOKEN && senderTransferTokenTransferable) {
    if (new BigN(senderTransferTokenTransferable).minus(transferAmount).lt(minAmount)) {
      warning = new TransactionWarning(BasicTxWarningCode.NOT_ENOUGH_EXISTENTIAL_DEPOSIT);
    }
  }

  // Check ed for receiver
  if (new BigN(receiverTransferTokenFreeBalance).plus(transferAmount).lt(minAmount)) {
    const atLeast = new BigN(minAmount).minus(receiverTransferTokenFreeBalance).plus((tokenInfo.decimals || 0) === 0 ? 0 : 1);

    const atLeastStr = formatNumber(atLeast, tokenInfo.decimals || 0, balanceFormatter, { maxNumberFormat: tokenInfo.decimals || 6 });

    error = new TransactionError(TransferTxErrorType.RECEIVER_NOT_ENOUGH_EXISTENTIAL_DEPOSIT, t('You must transfer at least {{amount}} {{symbol}} to keep the destination account alive', { replace: { amount: atLeastStr, symbol: tokenInfo.symbol } }));
  }

  return [warning, error];
}

// xcm transfer
export function validateXcmTransferRequest (destTokenInfo: _ChainAsset | undefined, sender: _Address, sendingValue: string): [TransactionError[], KeyringPair | undefined, BigN | undefined] {
  const errors = [] as TransactionError[];
  const keypair = keyring.getPair(sender);
  const transferValue = new BigN(sendingValue);

  if (!destTokenInfo) {
    errors.push(new TransactionError(TransferTxErrorType.INVALID_TOKEN, t('Not found token from registry')));
  }

  return [errors, keypair, transferValue];
}

export function additionalValidateXcmTransfer (originTokenInfo: _ChainAsset, destinationTokenInfo: _ChainAsset, sendingAmount: string, senderTransferable: string, receiverNativeBalance: string, destChainInfo: _ChainInfo, isSnowBridge = false): [TransactionWarning | undefined, TransactionError | undefined] {
  const destMinAmount = _getTokenMinAmount(destinationTokenInfo);
  const minSendingRequired = new BigN(destMinAmount).multipliedBy(XCM_MIN_AMOUNT_RATIO);

  let error: TransactionError | undefined;
  let warning: TransactionWarning | undefined;

  // Check sending token ED for receiver
  if (new BigN(sendingAmount).lt(minSendingRequired)) {
    const atLeastStr = formatNumber(minSendingRequired, destinationTokenInfo.decimals || 0, balanceFormatter, { maxNumberFormat: destinationTokenInfo.decimals || 6 });

    error = new TransactionError(TransferTxErrorType.RECEIVER_NOT_ENOUGH_EXISTENTIAL_DEPOSIT, t('You must transfer at least {{amount}} {{symbol}} to keep the destination account alive', { replace: { amount: atLeastStr, symbol: originTokenInfo.symbol } }));
  }

  // check native token ED on dest chain for receiver
  const bnKeepAliveBalance = _isNativeToken(destinationTokenInfo) ? new BigN(receiverNativeBalance).plus(sendingAmount) : new BigN(receiverNativeBalance);

  if (isSnowBridge && bnKeepAliveBalance.lt(_getChainExistentialDeposit(destChainInfo))) {
    const { decimals, symbol } = _getChainNativeTokenBasicInfo(destChainInfo);
    const atLeastStr = formatNumber(_getChainExistentialDeposit(destChainInfo), decimals || 0, balanceFormatter, { maxNumberFormat: 6 });

    error = new TransactionError(TransferTxErrorType.RECEIVER_NOT_ENOUGH_EXISTENTIAL_DEPOSIT, t(' Insufficient {{symbol}} on {{chain}} to cover min balance ({{amount}} {{symbol}})', { replace: { amount: atLeastStr, symbol, chain: destChainInfo.name } }));
  }

  // Check ed for sender
  if (!_isNativeToken(originTokenInfo)) {
    if (new BigN(senderTransferable).minus(sendingAmount).lt(_getTokenMinAmount(originTokenInfo))) {
      warning = new TransactionWarning(BasicTxWarningCode.NOT_ENOUGH_EXISTENTIAL_DEPOSIT);
    }
  }

  return [warning, error];
}

// general validations
export function checkSupportForTransaction (validationResponse: SWTransactionResponse, transaction: OptionalSWTransaction) {
  const { extrinsicType } = validationResponse;

  if (!transaction) {
    if (extrinsicType === ExtrinsicType.SEND_NFT) {
      validationResponse.errors.push(new TransactionError(BasicTxErrorType.UNSUPPORTED, t('This feature is not yet available for this NFT')));
    } else {
      validationResponse.errors.push(new TransactionError(BasicTxErrorType.UNSUPPORTED));
    }
  }
}

export async function estimateFeeForTransaction (validationResponse: SWTransactionResponse, transaction: OptionalSWTransaction, chainInfo: _ChainInfo, evmApi: _EvmApi): Promise<FeeData> {
  const estimateFee: FeeData = {
    symbol: '',
    decimals: 0,
    value: '0',
    tooHigh: false
  };
  const { decimals, symbol } = _getChainNativeTokenBasicInfo(chainInfo);

  estimateFee.decimals = decimals;
  estimateFee.symbol = symbol;

  if (transaction) {
    try {
      if (isSubstrateTransaction(transaction)) {
        estimateFee.value = (await transaction.paymentInfo(validationResponse.address)).partialFee.toString();
      } else {
        const gasLimit = await evmApi.api.eth.estimateGas(transaction);

        const priority = await calculateGasFeeParams(evmApi, chainInfo.slug);

        if (priority.baseGasFee) {
          const maxFee = priority.maxFeePerGas; // TODO: Need review

          estimateFee.value = maxFee.multipliedBy(gasLimit).toFixed(0);
        } else {
          estimateFee.value = new BigN(priority.gasPrice).multipliedBy(gasLimit).toFixed(0);
        }

        estimateFee.tooHigh = priority.busyNetwork;
      }
    } catch (e) {
      const error = e as Error;

      if (error.message.includes('gas required exceeds allowance') && error.message.includes('insufficient funds')) {
        validationResponse.errors.push(new TransactionError(BasicTxErrorType.NOT_ENOUGH_BALANCE));
      }
    }
  }

  return estimateFee;
}

export function checkSigningAccountForTransaction (validationResponse: SWTransactionResponse) {
  const pair = keyring.getPair(validationResponse.address);

  if (!pair) {
    validationResponse.errors.push(new TransactionError(BasicTxErrorType.INTERNAL_ERROR, t('Unable to find account')));
  } else {
    if (pair.meta?.isReadOnly) {
      validationResponse.errors.push(new TransactionError(BasicTxErrorType.INTERNAL_ERROR, t('This account is watch-only')));
    }
  }
}

export function checkBalanceWithTransactionFee (validationResponse: SWTransactionResponse, transactionInput: SWTransactionInput, nativeTokenInfo: _ChainAsset, nativeTokenAvailable: AmountData) {
  if (!validationResponse.estimateFee) { // todo: estimateFee should be must-have, need to refactor interface
    return;
  }

  const { edAsWarning, extrinsicType, isTransferAll, skipFeeValidation } = transactionInput;

  if (skipFeeValidation) {
    return;
  }

  const bnFee = new BigN(validationResponse.estimateFee.value);
  const bnNativeTokenAvailable = new BigN(nativeTokenAvailable.value);
  const bnNativeTokenTransferAmount = new BigN(validationResponse.transferNativeAmount || '0');

  if (!bnNativeTokenAvailable.gt(0)) {
    validationResponse.errors.push(new TransactionError(BasicTxErrorType.NOT_ENOUGH_BALANCE));
  }

  const isChainNotSupportTransferAll = [
    ..._TRANSFER_CHAIN_GROUP.acala,
    ..._TRANSFER_CHAIN_GROUP.genshiro,
    ..._TRANSFER_CHAIN_GROUP.bitcountry,
    ..._TRANSFER_CHAIN_GROUP.statemine
  ].includes(nativeTokenInfo.originChain);

  if (bnNativeTokenTransferAmount.plus(bnFee).gt(bnNativeTokenAvailable) && (!isTransferAll || isChainNotSupportTransferAll)) {
    validationResponse.errors.push(new TransactionError(BasicTxErrorType.NOT_ENOUGH_BALANCE)); // todo: should be generalized and reused in all features
  }

  // todo: only system.pallet has metadata, we should add for other pallets and mechanisms as well
  const isNeedCheckRemainingBalance = !isTransferAll && extrinsicType === ExtrinsicType.TRANSFER_BALANCE && nativeTokenAvailable.metadata && _canAccountBeReaped(nativeTokenAvailable.metadata as FrameSystemAccountInfo);
  const isRemainingBalanceValid = bnNativeTokenAvailable.minus(bnNativeTokenTransferAmount).minus(bnFee).lt(_getTokenMinAmount(nativeTokenInfo));

  if (isNeedCheckRemainingBalance && isRemainingBalanceValid) {
    edAsWarning
      ? validationResponse.warnings.push(new TransactionWarning(BasicTxWarningCode.NOT_ENOUGH_EXISTENTIAL_DEPOSIT))
      : validationResponse.errors.push(new TransactionError(BasicTxErrorType.NOT_ENOUGH_EXISTENTIAL_DEPOSIT));
  }
}
