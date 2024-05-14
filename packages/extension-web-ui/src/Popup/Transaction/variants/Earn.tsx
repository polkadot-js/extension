// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _ChainAsset } from '@subwallet/chain-list/types';
import { ExtrinsicType, NotificationType } from '@subwallet/extension-base/background/KoniTypes';
import { getValidatorLabel } from '@subwallet/extension-base/koni/api/staking/bonding/utils';
import { _getAssetDecimals, _getAssetSymbol, _getSubstrateGenesisHash, _isChainEvmCompatible } from '@subwallet/extension-base/services/chain-service/utils';
import { _STAKING_CHAIN_GROUP } from '@subwallet/extension-base/services/earning-service/constants';
import { isLendingPool, isLiquidPool } from '@subwallet/extension-base/services/earning-service/utils';
import { SWTransactionResponse } from '@subwallet/extension-base/services/transaction-service/types';
import { EarningStatus, NominationPoolInfo, OptimalYieldPath, OptimalYieldPathParams, SubmitJoinNativeStaking, SubmitJoinNominationPool, SubmitYieldJoinData, ValidatorInfo, YieldPoolInfo, YieldPoolType, YieldStepType } from '@subwallet/extension-base/types';
import { addLazy } from '@subwallet/extension-base/utils';
import { AccountSelector, AlertBox, AmountInput, EarningPoolSelector, EarningValidatorSelector, HiddenInput, InfoIcon, LoadingScreen, MetaInfo } from '@subwallet/extension-web-ui/components';
import { EarningProcessItem } from '@subwallet/extension-web-ui/components/Earning';
import { getInputValuesFromString } from '@subwallet/extension-web-ui/components/Field/AmountInput';
import { EarningInstructionModal } from '@subwallet/extension-web-ui/components/Modal/Earning';
import { BN_ZERO, CREATE_RETURN, DEFAULT_ROUTER_PATH, EARNING_INSTRUCTION_MODAL, EVM_ACCOUNT_TYPE, STAKE_ALERT_DATA, SUBSTRATE_ACCOUNT_TYPE } from '@subwallet/extension-web-ui/constants';
import { ScreenContext } from '@subwallet/extension-web-ui/contexts/ScreenContext';
import { WebUIContext } from '@subwallet/extension-web-ui/contexts/WebUIContext';
import { useChainConnection, useFetchChainState, useGetBalance, useGetNativeTokenSlug, useInitValidateTransaction, usePreCheckAction, useRestoreTransaction, useSelector, useSetSelectedAccountTypes, useTransactionContext, useWatchTransaction, useYieldPositionDetail } from '@subwallet/extension-web-ui/hooks';
import { insufficientMessages } from '@subwallet/extension-web-ui/hooks/transaction/useHandleSubmitTransaction';
import { fetchPoolTarget, getOptimalYieldPath, submitJoinYieldPool, validateYieldProcess } from '@subwallet/extension-web-ui/messaging';
// import { unlockDotCheckCanMint } from '@subwallet/extension-web-ui/messaging/campaigns';
import { DEFAULT_YIELD_PROCESS, EarningActionType, earningReducer } from '@subwallet/extension-web-ui/reducer';
import { store } from '@subwallet/extension-web-ui/stores';
import { EarnParams, FormCallbacks, FormFieldData, Theme, ThemeProps } from '@subwallet/extension-web-ui/types';
import { convertFieldToObject, getValidatorKey, isAccountAll, parseNominations, reformatAddress, simpleCheckForm } from '@subwallet/extension-web-ui/utils';
import { ActivityIndicator, Button, ButtonProps, Form, Icon, ModalContext, Number, Typography } from '@subwallet/react-ui';
import BigN from 'bignumber.js';
import CN from 'classnames';
import { CheckCircle, PlusCircle, XCircle } from 'phosphor-react';
import React, { useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import { Divider } from 'semantic-ui-react';
import styled, { useTheme } from 'styled-components';
import { useLocalStorage } from 'usehooks-ts';

import { isEthereumAddress } from '@polkadot/util-crypto';

import useNotification from '../../../hooks/common/useNotification';
import { getJoinYieldParams } from '../helper';
import { EarnOutlet, FreeBalance, FreeBalanceToEarn, TransactionContent, TransactionFooter } from '../parts';

type Props = ThemeProps;
type ComponentProps = { className?: string; }

const hideFields: Array<keyof EarnParams> = ['slug', 'chain', 'asset'];
const validateFields: Array<keyof EarnParams> = ['from'];
const loadingStepPromiseKey = 'earning.step.loading';

const instructionModalId = EARNING_INSTRUCTION_MODAL;

// Not enough balance to xcm;
export const insufficientXCMMessages = ['You can only enter a maximum'];

const earningTypeLabelMap = {
  [YieldPoolType.NATIVE_STAKING]: 'direct nomination',
  [YieldPoolType.NOMINATION_POOL]: 'nomination pool',
  [YieldPoolType.LENDING]: 'lending',
  [YieldPoolType.LIQUID_STAKING]: 'liquid staking',
  [YieldPoolType.PARACHAIN_STAKING]: 'direct nomination',
  [YieldPoolType.SINGLE_FARMING]: 'single farming'
};

type LocationStateRW = {
  from?: string
}

const Component = ({ className }: ComponentProps) => {
  const { t } = useTranslation();
  const notify = useNotification();
  const { activeModal, inactiveModal } = useContext(ModalContext);
  const { isWebUI } = useContext(ScreenContext);
  const { token } = useTheme() as Theme;
  const { setOnBack } = useContext(WebUIContext);
  const { currencyData } = useSelector((state) => state.price);
  const stateLocation = useLocation().state as LocationStateRW;
  const navigate = useNavigate();

  const { closeAlert, defaultData, goBack, onDone,
    openAlert, persistData,
    setBackProps, setSubHeaderRightButtons } = useTransactionContext<EarnParams>();

  const { hasPreSelectTarget, redirectFromPreview, slug, target } = defaultData;
  const defaultTarget = useRef<string>(target);
  const autoCheckValidatorGetFromPreview = useRef<boolean>(true);
  const autoCheckCompoundRef = useRef<boolean>(true);
  const isReadyToShowAlertRef = useRef<boolean>(true);
  const { accounts, currentAccount, isAllAccount } = useSelector((state) => state.accountState);
  const [, setReturnPath] = useLocalStorage(CREATE_RETURN, DEFAULT_ROUTER_PATH);
  const chainInfoMap = useSelector((state) => state.chainStore.chainInfoMap);
  const poolInfoMap = useSelector((state) => state.earning.poolInfoMap);
  const poolTargetsMap = useSelector((state) => state.earning.poolTargetsMap);
  const chainAsset = useSelector((state) => state.assetRegistry.assetRegistry);
  const priceMap = useSelector((state) => state.price.priceMap);

  const [form] = Form.useForm<EarnParams>();
  const [isFromStakingRW, setIsFromStakingRW] = useState(false);
  const formDefault = useMemo((): EarnParams => ({ ...defaultData }), [defaultData]);

  const fromValue = useWatchTransaction('from', form, defaultData);
  const amountValue = useWatchTransaction('value', form, defaultData);
  const chainValue = useWatchTransaction('chain', form, defaultData);
  const poolTargetValue = useWatchTransaction('target', form, defaultData);

  const nativeTokenSlug = useGetNativeTokenSlug(chainValue);

  const isClickInfoButtonRef = useRef<boolean>(false);

  const [processState, dispatchProcessState] = useReducer(earningReducer, DEFAULT_YIELD_PROCESS);

  const currentStep = processState.currentStep;
  const firstStep = currentStep === 0;
  const submitStepType = processState.steps?.[!currentStep ? currentStep + 1 : currentStep]?.type;

  const { compound } = useYieldPositionDetail(slug);
  const { nativeTokenBalance } = useGetBalance(chainValue, fromValue);
  const { checkChainConnected, turnOnChain } = useChainConnection();
  const [isConnectingChainSuccess, setIsConnectingChainSuccess] = useState<boolean>(false);
  const [isLoadingChainConnection, setIsLoadingChainConnection] = useState<boolean>(false);
  const [useParamValidator, setUseParamValidator] = useState<boolean>(hasPreSelectTarget);
  const setSelectedAccountTypes = useSetSelectedAccountTypes(false);

  const poolInfo = poolInfoMap[slug] as YieldPoolInfo | undefined;
  const poolType = poolInfo?.type || '';
  const poolChain = poolInfo?.chain || '';

  const [isBalanceReady, setIsBalanceReady] = useState<boolean>(true);
  const [forceFetchValidator, setForceFetchValidator] = useState(false);
  const [targetLoading, setTargetLoading] = useState(true);
  const [stepLoading, setStepLoading] = useState<boolean>(true);
  const [screenLoading, setScreenLoading] = useState(true);
  const [checkValidAccountLoading, setCheckValidAccountLoading] = useState(true);
  const [checkCompoundLoading, setCheckCompoundLoading] = useState(true);
  const [submitString, setSubmitString] = useState<string | undefined>();
  const [connectionError, setConnectionError] = useState<string>();
  // const [, setCanMint] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  // const [checkMintLoading, setCheckMintLoading] = useState(false);
  const [isFormInvalid, setIsFormInvalid] = useState(true);

  const chainState = useFetchChainState(poolInfo?.chain || '');

  const mustChooseTarget = useMemo(
    () => !!poolType && [YieldPoolType.NATIVE_STAKING, YieldPoolType.NOMINATION_POOL].includes(poolType as YieldPoolType),
    [poolType]
  );

  const balanceTokens = useMemo(() => {
    const result: Array<{ chain: string; token: string }> = [];

    if (!poolInfo) {
      return [];
    }

    const _chain = poolInfo.chain;

    result.push({
      token: poolInfo?.metadata.inputAsset,
      chain: _chain
    });

    if (poolInfo?.type === YieldPoolType.LENDING || poolInfo?.type === YieldPoolType.LIQUID_STAKING) {
      const altAsset = poolInfo?.metadata?.altInputAssets;
      const asset = chainAsset[altAsset || ''];

      if (asset) {
        result.push({
          token: asset.slug,
          chain: asset.originChain
        });
      }
    }

    return result;
  }, [chainAsset, poolInfo]);

  const isDisabledButton = useMemo(
    () =>
      // checkMintLoading ||
      stepLoading ||
      !!connectionError ||
      !amountValue ||
      !isBalanceReady ||
      isFormInvalid ||
      submitLoading ||
      targetLoading ||
      (mustChooseTarget && !poolTargetValue),
    [stepLoading, connectionError, amountValue, isBalanceReady, isFormInvalid, submitLoading, targetLoading, mustChooseTarget, poolTargetValue]
  );

  const inputAsset = useMemo<_ChainAsset | undefined>(
    () => chainAsset[poolInfo?.metadata?.inputAsset || ''],
    [chainAsset, poolInfo?.metadata?.inputAsset]
  );

  const nativeAsset = useMemo(() => chainAsset[nativeTokenSlug], [chainAsset, nativeTokenSlug]);

  const assetDecimals = inputAsset ? _getAssetDecimals(inputAsset) : 0;
  const priceValue = priceMap[inputAsset?.priceId || ''] || 0;
  const convertValue = amountValue ? parseFloat(amountValue) / 10 ** assetDecimals : 0;
  const transformAmount = convertValue * priceValue;

  const estimatedFee = useMemo(() => {
    let _totalFee = 0;

    if (processState.feeStructure) {
      processState.feeStructure.forEach((fee) => {
        if (fee.slug !== '') {
          const asset = chainAsset[fee.slug];
          const feeDecimals = _getAssetDecimals(asset);
          const _priceValue = asset.priceId ? priceMap[asset.priceId] : 0;
          const feeNumb = _priceValue * (fee.amount ? parseFloat(fee.amount) / 10 ** feeDecimals : 0);

          _totalFee += feeNumb;
        }
      });
    }

    return _totalFee;
  }, [chainAsset, priceMap, processState.feeStructure]);

  const maintainString = useMemo(() => {
    if (!poolInfo) {
      return '';
    }

    const maintainAsset = chainAsset[poolInfo?.metadata?.maintainAsset];
    const maintainBalance = poolInfo?.metadata?.maintainBalance;

    return `${getInputValuesFromString(maintainBalance, maintainAsset.decimals || 0)} ${maintainAsset.symbol}`;
  }, [poolInfo, chainAsset]);

  const poolTargets = useMemo(() => {
    const _poolTargets = poolTargetsMap[slug];

    if (!_poolTargets) {
      return [];
    } else {
      if (YieldPoolType.NOMINATION_POOL === poolType) {
        const poolTargets = _poolTargets as NominationPoolInfo[];

        for (const pool of poolTargets) {
          if (String(pool.id) === poolTargetValue) {
            return [pool];
          }
        }

        return [];
      } else if (YieldPoolType.NATIVE_STAKING === poolType) {
        const validatorList = _poolTargets as ValidatorInfo[];

        if (!validatorList) {
          return [];
        }

        const result: ValidatorInfo[] = [];
        const nominations = parseNominations(poolTargetValue);
        const newValidatorList: { [address: string]: ValidatorInfo } = {};

        validatorList.forEach((validator) => {
          newValidatorList[reformatAddress(validator.address)] = validator;
        });
        nominations.forEach((nomination) => {
          if (newValidatorList?.[reformatAddress(nomination)]) {
            // remember the format of the address
            result.push(newValidatorList[reformatAddress(nomination)]);
          }
        });

        return result;
      } else {
        return [];
      }
    }
  }, [poolTargetValue, poolTargetsMap, poolType, slug]);

  const accountSelectorList = useMemo(() => {
    const chainInfo = chainInfoMap[poolChain];

    if (!chainInfo) {
      return [];
    }

    return accounts.filter((a) => {
      if (isAccountAll(a.address)) {
        return false;
      }

      if (a.originGenesisHash && _getSubstrateGenesisHash(chainInfo) !== a.originGenesisHash) {
        return false;
      }

      return _isChainEvmCompatible(chainInfo) === isEthereumAddress(a.address);
    });
  }, [accounts, chainInfoMap, poolChain]);

  const onFieldsChange: FormCallbacks<EarnParams>['onFieldsChange'] = useCallback((changedFields: FormFieldData[], allFields: FormFieldData[]) => {
    // TODO: field change
    const { empty, error } = simpleCheckForm(allFields, ['--asset']);

    const values = convertFieldToObject<EarnParams>(allFields);

    setIsFormInvalid(empty || error);
    persistData(values);
  }, [persistData]);

  const handleDataForInsufficientAlert = useCallback(() => {
    const _assetDecimals = nativeAsset.decimals || 0;
    const existentialDeposit = nativeAsset.minAmount || '0';

    return {
      existentialDeposit: getInputValuesFromString(existentialDeposit, _assetDecimals),
      availableBalance: getInputValuesFromString(nativeTokenBalance.value, _assetDecimals),
      maintainBalance: getInputValuesFromString(poolInfo?.metadata.maintainBalance || '0', _assetDecimals),
      symbol: nativeAsset.symbol
    };
  }, [nativeAsset, nativeTokenBalance.value, poolInfo?.metadata.maintainBalance]);

  const onError = useCallback(
    (error: Error) => {
      if (insufficientMessages.some((v) => error.message.includes(v))) {
        const availableBalanceBN = new BigN(nativeTokenBalance.value || 0);

        if (availableBalanceBN.gt(BN_ZERO) && new BigN(amountValue || 0).gt(availableBalanceBN)) {
          openAlert({
            title: t('Insufficient balance'),
            type: NotificationType.ERROR,
            content: t('Insufficient balance. Amount must be smaller than available balance'),
            okButton: {
              text: t('I understand'),
              onClick: closeAlert,
              icon: CheckCircle
            }
          });
        } else {
          openAlert({
            title: t('Insufficient balance'),
            type: NotificationType.ERROR,
            content: t('Your available balance is {{availableBalance}} {{symbol}}, you need to leave {{existentialDeposit}} {{symbol}} as minimal balance (existential deposit) and pay network fees. Make sure you have at least {{maintainBalance}} {{symbol}} in your transferable balance to proceed.', { replace: { ...handleDataForInsufficientAlert() } }),
            okButton: {
              text: t('I understand'),
              onClick: closeAlert,
              icon: CheckCircle
            }
          });
        }

        dispatchProcessState({
          type: EarningActionType.STEP_ERROR_ROLLBACK,
          payload: error
        });

        return;
      } else if (insufficientXCMMessages.some((v) => error.message.includes(v))) {
        openAlert({
          title: t('Insufficient balance'),
          type: NotificationType.ERROR,
          content: error.message,
          okButton: {
            text: t('I understand'),
            onClick: closeAlert,
            icon: CheckCircle
          }
        });

        dispatchProcessState({
          type: EarningActionType.STEP_ERROR_ROLLBACK,
          payload: error
        });

        return;
      }

      notify({
        message: error.message,
        type: 'error',
        duration: 8
      });

      dispatchProcessState({
        type: EarningActionType.STEP_ERROR_ROLLBACK,
        payload: error
      });
    },
    [amountValue, closeAlert, handleDataForInsufficientAlert, nativeTokenBalance.value, notify, openAlert, t]
  );

  const onSuccess = useCallback(
    (lastStep: boolean, needRollback: boolean): ((rs: SWTransactionResponse) => boolean) => {
      return (rs: SWTransactionResponse): boolean => {
        const { errors: _errors, id, warnings } = rs;

        if (_errors.length || warnings.length) {
          if (_errors[0]?.message !== 'Rejected by user') {
            if (
              _errors[0]?.message.startsWith('UnknownError Connection to Indexed DataBase server lost') ||
              _errors[0]?.message.startsWith('Provided address is invalid, the capitalization checksum test failed') ||
              _errors[0]?.message.startsWith('connection not open on send()')
            ) {
              notify({
                message: t('Your selected network has lost connection. Update it by re-enabling it or changing network provider'),
                type: 'error',
                duration: 8
              });

              return false;
            }

            // hideAll();
            onError(_errors[0]);

            return false;
          } else {
            dispatchProcessState({
              type: needRollback ? EarningActionType.STEP_ERROR_ROLLBACK : EarningActionType.STEP_ERROR,
              payload: _errors[0]
            });

            return false;
          }
        } else if (id) {
          dispatchProcessState({
            type: EarningActionType.STEP_COMPLETE,
            payload: rs
          });

          if (lastStep) {
            onDone(id);

            return false;
          }

          return true;
        } else {
          return false;
        }
      };
    },
    [notify, onDone, onError, t]
  );

  const onSubmit: FormCallbacks<EarnParams>['onFinish'] = useCallback((values: EarnParams) => {
    if (!poolInfo) {
      return;
    }

    setSubmitLoading(true);
    const { from, slug, target, value: _currentAmount } = values;

    const getData = (submitStep: number): SubmitYieldJoinData => {
      if ([YieldPoolType.NOMINATION_POOL, YieldPoolType.NATIVE_STAKING].includes(poolInfo.type) && target) {
        const targets = poolTargets;

        if (poolInfo?.type === YieldPoolType.NOMINATION_POOL) {
          const selectedPool = targets[0];

          return {
            slug: slug,
            address: from,
            amount: _currentAmount,
            selectedPool
          } as SubmitJoinNominationPool;
        } else {
          return {
            slug: slug,
            address: from,
            amount: _currentAmount,
            selectedValidators: targets
          } as SubmitJoinNativeStaking;
        }
      } else {
        return getJoinYieldParams(poolInfo, from, _currentAmount, processState.feeStructure[submitStep]);
      }
    };

    const path: OptimalYieldPath = {
      steps: processState.steps,
      totalFee: processState.feeStructure
    };

    const submitData = async (step: number): Promise<boolean> => {
      dispatchProcessState({
        type: EarningActionType.STEP_SUBMIT,
        payload: null
      });
      const isFirstStep = step === 0;
      const isLastStep = step === processState.steps.length - 1;
      const needRollback = step === 1;
      const data = getData(step);

      try {
        if (isFirstStep) {
          const validatePromise = validateYieldProcess({
            path: path,
            data: data
          });

          const _errors = await validatePromise;

          if (_errors.length) {
            onError(_errors[0]);

            return false;
          } else {
            dispatchProcessState({
              type: EarningActionType.STEP_COMPLETE,
              payload: true
            });
            dispatchProcessState({
              type: EarningActionType.STEP_SUBMIT,
              payload: null
            });

            return await submitData(step + 1);
          }
        } else {
          const submitPromise: Promise<SWTransactionResponse> = submitJoinYieldPool({
            path: path,
            data: data,
            currentStep: step
          });

          const rs = await submitPromise;
          const success = onSuccess(isLastStep, needRollback)(rs);

          if (success) {
            return await submitData(step + 1);
          } else {
            return false;
          }
        }
      } catch (e) {
        onError(e as Error);

        return false;
      }
    };

    const maxCount = poolInfo?.statistic?.maxCandidatePerFarmer ?? 1;
    const userSelectedPoolCount = poolTargetValue?.split(',').length ?? 1;
    const label = getValidatorLabel(chainValue);

    if (userSelectedPoolCount < maxCount && label === 'Validator') {
      openAlert({
        title: t('Pay attention!'),
        content: t('You are recommended to choose {{maxCount}} validators to optimize your earnings. Do you wish to continue with {{userSelectedPoolCount}} validator{{x}}?', { replace: { maxCount, userSelectedPoolCount, x: userSelectedPoolCount === 1 ? '' : 's' } }),
        okButton: {
          text: t('Continue'),
          onClick: () => {
            closeAlert();
            submitData(currentStep)
              .catch(onError)
              .finally(() => {
                setSubmitLoading(false);
              });
          }
        },
        cancelButton: {
          text: t('Go back'),
          onClick: () => {
            setSubmitLoading(false);
            closeAlert();
          }
        },
        closable: false
      });

      return;
    }

    setTimeout(() => {
      submitData(currentStep)
        .catch(onError)
        .finally(() => {
          setSubmitLoading(false);
        });
    }, 300);
  }, [chainValue, closeAlert, currentStep, onError, onSuccess, openAlert, poolInfo, poolTargetValue, poolTargets, processState.feeStructure, processState.steps, t]);

  const renderMetaInfo = useCallback(() => {
    if (!poolInfo || !inputAsset) {
      return null;
    }

    const value = amountValue ? parseFloat(amountValue) / 10 ** assetDecimals : 0;
    const assetSymbol = inputAsset.symbol;

    const assetEarnings =
      poolInfo?.statistic && 'assetEarning' in poolInfo.statistic ? poolInfo.statistic.assetEarning : [];
    const derivativeAssets = poolInfo?.metadata && 'derivativeAssets' in poolInfo.metadata ? poolInfo.metadata.derivativeAssets : [];
    const showFee = [YieldPoolType.LENDING, YieldPoolType.LIQUID_STAKING].includes(poolInfo?.type);

    let minJoinPool: string | undefined;

    if (poolInfo.statistic) {
      const minPoolJoin = poolInfo.statistic.earningThreshold.join;
      const targeted = poolTargets[0];

      if (targeted) {
        if ('minBond' in targeted) {
          const minTargetJoin = new BigN(targeted.minBond || '0');

          minJoinPool = minTargetJoin.gt(minPoolJoin || '0') ? minTargetJoin.toString() : (minPoolJoin || '0');
        } else {
          minJoinPool = minPoolJoin;
        }
      } else {
        minJoinPool = minPoolJoin;
      }
    }

    return (
      <MetaInfo
        labelColorScheme={'gray'}
        spaceSize={'sm'}
        valueColorScheme={'gray'}
      >
        {!!assetEarnings.length &&
          assetEarnings.map((item) => {
            if (item.exchangeRate === undefined || !derivativeAssets.length) {
              return null;
            }

            const derivativeAssetSlug = derivativeAssets[0];
            const derivativeAssetInfo = chainAsset[derivativeAssetSlug];

            return (
              <MetaInfo.Number
                decimals={0}
                key={item.slug}
                label={t("You'll receive")}
                suffix={_getAssetSymbol(derivativeAssetInfo)}
                value={value / item.exchangeRate}
              />
            );
          })}
        {(
          <MetaInfo.Number
            decimals={assetDecimals}
            label={t('Minimum active stake')}
            suffix={assetSymbol}
            value={minJoinPool || 0}
          />
        )}

        <MetaInfo.Chain
          chain={chainValue}
          label={t('Network')}
        />

        {showFee && (
          <MetaInfo.Number
            decimals={0}
            label={t('Estimated fee')}
            prefix={(currencyData?.isPrefix && currencyData.symbol) || ''}
            suffix={(!currencyData?.isPrefix && currencyData?.symbol) || ''}
            value={estimatedFee}
          />
        )}
      </MetaInfo>
    );
  }, [poolInfo, inputAsset, amountValue, assetDecimals, t, chainValue, currencyData?.isPrefix, currencyData.symbol, estimatedFee, poolTargets, chainAsset]);

  const onPreCheck = usePreCheckAction(fromValue);

  const exType = useMemo(() => {
    if (poolType === YieldPoolType.NOMINATION_POOL || poolType === YieldPoolType.NATIVE_STAKING) {
      return ExtrinsicType.STAKING_BOND;
    }

    if (poolType === YieldPoolType.LIQUID_STAKING) {
      if (chainValue === 'moonbeam') {
        return ExtrinsicType.MINT_STDOT;
      }

      return ExtrinsicType.MINT_LDOT;
    }

    if (poolType === YieldPoolType.LENDING) {
      return ExtrinsicType.MINT_LDOT;
    }

    return ExtrinsicType.STAKING_BOND;
  }, [poolType, chainValue]);

  useRestoreTransaction(form);
  useInitValidateTransaction(validateFields, form, defaultData);

  const onBack = useCallback(() => {
    if (firstStep) {
      goBack();
    } else {
      openAlert({
        title: t('Cancel earning process?'),
        type: NotificationType.WARNING,
        content: t('Going back will cancel the current earning process. Do you wish to cancel?'),
        okButton: {
          text: t('Cancel earning'),
          onClick: goBack,
          schema: 'warning'
        },
        cancelButton: {
          text: t('Not now'),
          onClick: closeAlert
        }
      });
    }
  }, [closeAlert, firstStep, goBack, openAlert, t]);

  const processText = (() => {
    if (!poolInfo) {
      return '';
    }

    const _shortName = poolInfo.metadata.shortName;
    const _type = t(earningTypeLabelMap[poolInfo.type]);

    return t('{{shortName}} {{type}} process:', { replace: { shortName: _shortName, type: _type } });
  })();

  const onCancelInstructionModal = useCallback(() => {
    if (!isClickInfoButtonRef.current) {
      goBack();
    }

    setIsFromStakingRW(false);
  }, [goBack]);

  const onStakeMore = useCallback((slug: string, chain: string) => {
    inactiveModal(instructionModalId);

    setIsFromStakingRW(false);
  }, [inactiveModal]);

  const altChain = useMemo(() => {
    if (poolInfo && (isLiquidPool(poolInfo) || isLendingPool(poolInfo))) {
      const asset = chainAsset[poolInfo.metadata.altInputAssets || ''];

      return asset ? asset.originChain : '';
    }

    return '';
  }, [chainAsset, poolInfo]);

  useEffect(() => {
    let timer: NodeJS.Timer;
    let timeout: NodeJS.Timeout;

    if (checkCompoundLoading && redirectFromPreview) {
      const checkCompoundReady = () => {
        if (compound) {
          clearInterval(timer);
          clearTimeout(timeout);
          setCheckCompoundLoading(false);
        }
      };

      timer = setInterval(checkCompoundReady, 500);

      timeout = setTimeout(() => {
        clearInterval(timer);
        setCheckCompoundLoading(false);
      }, 5000);
    } else {
      setTimeout(() => setCheckCompoundLoading(false), 350);
    }

    return () => {
      clearInterval(timer);
      clearTimeout(timeout);
    };
  }, [checkCompoundLoading, compound, redirectFromPreview]);

  useEffect(() => {
    if (redirectFromPreview && !accountSelectorList.length && checkValidAccountLoading) {
      const isChainEvm = chainInfoMap[poolChain] && _isChainEvmCompatible(chainInfoMap[poolChain]);

      setSelectedAccountTypes([isChainEvm ? EVM_ACCOUNT_TYPE : SUBSTRATE_ACCOUNT_TYPE]);
      navigate('/home/earning', { state: { view: 'position', redirectFromPreview: true, chainName: chainInfoMap[poolChain]?.name || '' } });
    } else {
      setCheckValidAccountLoading(false);
    }
  }, [accountSelectorList, chainInfoMap, checkValidAccountLoading, navigate, poolChain, redirectFromPreview, setSelectedAccountTypes]);

  const checkUnrecommendedValidator = useCallback((onValid?: () => void) => {
    fetchPoolTarget({ slug }).then((rs) => {
      const isValidatorSupported = rs.targets.some((item) => {
        if (poolType === YieldPoolType.NOMINATION_POOL) {
          return (item as NominationPoolInfo).id.toString() === defaultTarget.current;
        } else if (poolType === YieldPoolType.NATIVE_STAKING) {
          const _item = item as ValidatorInfo;
          const key = getValidatorKey(_item.address, _item.identity);

          return key === defaultTarget.current;
        } else {
          return false;
        }
      });

      if (!isValidatorSupported && defaultTarget.current) {
        isReadyToShowAlertRef.current && openAlert({
          title: t('Unrecommended validator'),
          type: NotificationType.ERROR,
          content: t('Your chosen validator is not recommended by SubWallet as staking with this validator won’t accrue any rewards. Select another validator and try again.'),
          cancelButton: {
            text: t('Dismiss'),
            onClick: () => {
              isReadyToShowAlertRef.current = true;
              closeAlert();
            },
            icon: XCircle
          },
          okButton: {
            text: t('Select validators'),
            onClick: () => {
              isReadyToShowAlertRef.current = true;
              closeAlert();
              activeModal('target');
            },
            icon: CheckCircle
          }
        });
        isReadyToShowAlertRef.current = false;
      } else {
        onValid && onValid();
      }
    }).catch((e) => console.error(e));
  }, [activeModal, closeAlert, openAlert, poolType, slug, t]);

  const isUnstakeAll = useMemo(() => {
    if (compound) {
      if (compound.nominations && compound.nominations.length) {
        return compound.nominations.some((item) => item.activeStake === '0' && item.status === EarningStatus.NOT_EARNING);
      } else {
        return true;
      }
    }

    return false;
  }, [compound]);

  useEffect(() => {
    if (hasPreSelectTarget && !targetLoading && !screenLoading && !checkCompoundLoading && !isFromStakingRW) {
      if (compound) {
        if (autoCheckCompoundRef.current) {
          autoCheckCompoundRef.current = false;

          if (isUnstakeAll) {
            if (poolType === YieldPoolType.NOMINATION_POOL) {
              isReadyToShowAlertRef.current && openAlert({
                title: t('Pay attention'),
                content: t('This account is unstaking all stake and can\'t nominate validators. You can change your account on the Account tab or try again after withdrawing unstaked funds'),
                type: NotificationType.WARNING,
                okButton: {
                  text: t('I understand'),
                  onClick: () => {
                    isReadyToShowAlertRef.current = true;
                    closeAlert();
                  },
                  icon: CheckCircle
                }
              });
              isReadyToShowAlertRef.current = false;

              return;
            } else if (poolType === YieldPoolType.NATIVE_STAKING) {
              if (_STAKING_CHAIN_GROUP.para.includes(chainValue)) {
                isReadyToShowAlertRef.current && openAlert({
                  title: t('Pay attention'),
                  content: t('This account is unstaking all stake and can\'t nominate validators. You can change your account on the Account tab or try again after withdrawing unstaked funds'),
                  type: NotificationType.WARNING,
                  okButton: {
                    text: t('I understand'),
                    onClick: () => {
                      isReadyToShowAlertRef.current = true;
                      closeAlert();
                    },
                    icon: CheckCircle
                  }
                });
                isReadyToShowAlertRef.current = false;

                return;
              } else {
                return;
              }
            }
          }

          const content = poolType === YieldPoolType.NATIVE_STAKING
            ? t('This account is currently nominating {{number}} validators. You can change validators or change your account on the Account tab', { number: compound.nominations.length })
            : poolType === YieldPoolType.NOMINATION_POOL
              ? t('This account is currently a member of a nomination pool. You can continue using nomination pool, explore other Earning options or change your account on the Account tab', { x: compound?.nominations[0]?.validatorIdentity || compound?.nominations[0]?.validatorAddress || '' })
              : '';

          const onPressContinue = () => {
            isReadyToShowAlertRef.current = true;

            if (poolType === YieldPoolType.NATIVE_STAKING) {
              checkUnrecommendedValidator(() => form.setFieldValue('target', defaultTarget.current));
            }

            closeAlert();
          };

          const onPressCancel = () => {
            if (poolType === YieldPoolType.NOMINATION_POOL) {
              goBack();
            }

            setUseParamValidator(false);
            closeAlert();
          };

          isReadyToShowAlertRef.current && openAlert({
            title: t('Pay attention'),
            content: content,
            className: CN(className, 'earning-alert-modal'),
            type: NotificationType.WARNING,
            cancelButton: {
              text: poolType === YieldPoolType.NATIVE_STAKING ? t('Keep current validators') : poolType === YieldPoolType.NOMINATION_POOL ? t('Explore Earning options') : '',
              onClick: onPressCancel
            },
            okButton: {
              text: poolType === YieldPoolType.NATIVE_STAKING ? t('Change validators') : poolType === YieldPoolType.NOMINATION_POOL ? t('Use nomination pool') : '',
              onClick: onPressContinue
            }
          });
          isReadyToShowAlertRef.current = false;
        }
      } else {
        if (autoCheckValidatorGetFromPreview.current) {
          autoCheckValidatorGetFromPreview.current = false;
          checkUnrecommendedValidator();
        }
      }
    }
  }, [isUnstakeAll, checkUnrecommendedValidator, className, closeAlert, compound, form, goBack, openAlert, poolType, hasPreSelectTarget, t, targetLoading, chainValue, screenLoading, checkCompoundLoading, isFromStakingRW]);

  useEffect(() => {
    if (poolChain) {
      if (altChain) {
        if (checkChainConnected(poolChain) && checkChainConnected(altChain)) {
          setScreenLoading(false);
        } else if (!checkChainConnected(altChain)) {
          turnOnChain(altChain);
          setIsLoadingChainConnection(true);
        } else {
          setIsLoadingChainConnection(true);
        }
      } else {
        if (checkChainConnected(poolChain)) {
          setScreenLoading(false);
        } else {
          setIsLoadingChainConnection(true);
        }
      }
    }
  }, [altChain, poolChain, checkChainConnected, turnOnChain]);

  useEffect(() => {
    if (stateLocation?.from && stateLocation.from === '/transaction/earn') {
      setIsFromStakingRW(true);
      activeModal(instructionModalId);
      setReturnPath(DEFAULT_ROUTER_PATH);
    } else {
      setIsFromStakingRW(false);
    }
  }, [activeModal, setReturnPath, stateLocation]);

  const { altChainName, poolChainName } = useMemo(() => ({
    poolChainName: poolChain ? chainInfoMap[poolChain]?.name : '',
    altChainName: altChain ? chainInfoMap[altChain]?.name : ''
  }), [altChain, chainInfoMap, poolChain]);

  useEffect(() => {
    let timer: NodeJS.Timer;
    let timeout: NodeJS.Timeout;

    if (isLoadingChainConnection && poolChain) {
      const checkConnection = () => {
        if (altChain) {
          if (checkChainConnected(poolChain) && checkChainConnected(altChain)) {
            setIsConnectingChainSuccess(true);
            setIsLoadingChainConnection(false);
            clearTimeout(timeout);
            setScreenLoading(false);
          }
        } else {
          if (checkChainConnected(poolChain)) {
            setIsConnectingChainSuccess(true);
            clearInterval(timer);
            clearTimeout(timeout);
            setScreenLoading(false);
          }
        }
      };

      // Check network connection every 0.5 second
      timer = setInterval(checkConnection, 500);
      timeout = setTimeout(() => {
        clearInterval(timer);

        if (!isConnectingChainSuccess) {
          setIsLoadingChainConnection(false);
          openAlert({
            title: t('Connection lost'),
            type: NotificationType.ERROR,
            content: altChain
              ? t(`${poolChainName} network or ${altChainName} network has lost connection. Re-enable the network and try again`)
              : t(`${poolChainName} network has lost connection. Re-enable the network and try again`),
            okButton: {
              text: t('I understand'),
              onClick: closeAlert,
              icon: CheckCircle
            }
          });
        }
      }, 9000);
    }

    return () => {
      clearInterval(timer);
      clearTimeout(timeout);
    };
  }, [altChain, poolChain, checkChainConnected, closeAlert, isConnectingChainSuccess, isLoadingChainConnection, openAlert, t, poolChainName, altChainName]);

  useEffect(() => {
    form.setFieldValue('asset', inputAsset?.slug || '');
  }, [form, inputAsset?.slug]);

  useEffect(() => {
    if (!fromValue && (isAllAccount || accountSelectorList.length === 1)) {
      if ((hasPreSelectTarget && accountSelectorList.length >= 1) || accountSelectorList.length === 1) {
        form.setFieldValue('from', accountSelectorList[0].address);
      }
    }
  }, [accountSelectorList, form, fromValue, isAllAccount, hasPreSelectTarget]);

  useEffect(() => {
    if (currentStep === 0) {
      const submitData: OptimalYieldPathParams = {
        address: fromValue,
        amount: amountValue,
        slug: slug,
        targets: poolTargetValue ? poolTargets : undefined
      };

      const newData = JSON.stringify(submitData);

      if (newData !== submitString) {
        setSubmitString(newData);

        setStepLoading(true);

        addLazy(
          loadingStepPromiseKey,
          () => {
            getOptimalYieldPath(submitData)
              .then((res) => {
                dispatchProcessState({
                  payload: {
                    steps: res.steps,
                    feeStructure: res.totalFee
                  },
                  type: EarningActionType.STEP_CREATE
                });

                const errorNetwork = res.connectionError;

                if (errorNetwork) {
                  const networkName = chainInfoMap[errorNetwork].name;
                  const text = 'Please enable {{networkName}} network'.replace('{{networkName}}', networkName);

                  notify({
                    message: text,
                    type: 'error',
                    duration: 8
                  });
                }

                setConnectionError(errorNetwork);
              })
              .catch(console.error)
              .finally(() => setStepLoading(false));
          },
          1000,
          5000,
          false
        );
      }
    }
  }, [submitString, currentStep, chainInfoMap, slug, fromValue, amountValue, notify, poolTargetValue, poolTargets]);

  // useEffect(() => {
  //   setCheckMintLoading(true);
  //
  //   unlockDotCheckCanMint({
  //     slug: poolInfo?.slug || '',
  //     address: fromValue,
  //     network: poolInfo?.chain || ''
  //   })
  //     .then((value) => {
  //       setCanMint(value);
  //     })
  //     .finally(() => {
  //       setCheckMintLoading(false);
  //     });
  //
  //   return () => {
  //     setCanMint(false);
  //   };
  // }, [fromValue, poolInfo?.chain, poolInfo?.slug]);

  useEffect(() => {
    let unmount = false;

    if ((!!chainValue && !!fromValue && chainState?.active) || forceFetchValidator) {
      setTargetLoading(true);
      fetchPoolTarget({ slug })
        .then((result) => {
          if (!unmount) {
            store.dispatch({ type: 'earning/updatePoolTargets', payload: result });
          }
        })
        .catch(console.error)
        .finally(() => {
          if (!unmount) {
            setTargetLoading(false);
            setForceFetchValidator(false);
          }
        });
    }

    return () => {
      unmount = true;
    };
  }, [chainState?.active, forceFetchValidator, slug, chainValue, fromValue]);

  useEffect(() => {
    if (!redirectFromPreview && !isWebUI && !compound && !screenLoading) {
      isClickInfoButtonRef.current = false;
      activeModal(instructionModalId);
    }
  }, [activeModal, compound, isWebUI, redirectFromPreview, screenLoading]);

  const subHeaderButtons: ButtonProps[] = useMemo(() => {
    return [
      {
        icon: <InfoIcon />,
        disabled: screenLoading || submitLoading,
        onClick: () => {
          if (screenLoading || submitLoading) {
            return;
          }

          isClickInfoButtonRef.current = true;
          activeModal(instructionModalId);
        }
      }
    ];
  }, [activeModal, screenLoading, submitLoading]);

  useEffect(() => {
    setSubHeaderRightButtons(subHeaderButtons);

    return () => {
      setSubHeaderRightButtons(undefined);
    };
  }, [setSubHeaderRightButtons, subHeaderButtons]);

  useEffect(() => {
    setBackProps((prev) => ({
      ...prev,
      disabled: submitLoading
    }));
  }, [setBackProps, submitLoading]);

  useEffect(() => {
    setBackProps((prev) => ({
      ...prev,
      onClick: onBack
    }));
  }, [onBack, setBackProps]);

  useEffect(() => {
    setOnBack(onBack);

    return () => {
      setOnBack(undefined);
    };
  }, [onBack, setOnBack]);

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const amountInputRef = form.getFieldInstance('value');

  useEffect(() => {
    if (hasPreSelectTarget) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
      amountInputRef?.focus?.();
    }
  }, [amountInputRef, hasPreSelectTarget]);

  const validatorDefaultValue = (() => {
    if (useParamValidator) {
      return defaultData.target === 'not-support' ? '' : defaultTarget.current;
    } else {
      if (defaultData.target === 'not-support' || !!compound) {
        return undefined;
      } else {
        return defaultTarget.current;
      }
    }
  })();

  return (
    <>
      {
        (screenLoading || checkValidAccountLoading) && (
          <LoadingScreen />
        )
      }

      {
        (!screenLoading && !checkValidAccountLoading) && (
          <>
            <div className={'__transaction-block'}>
              <TransactionContent>
                {processState.steps && (
                  <>
                    <div className={'__process-item-wrapper'}>
                      {stepLoading
                        ? (
                          <div className={'__process-item-loading'}>
                            <ActivityIndicator size={24} />
                          </div>
                        )
                        : (
                          <EarningProcessItem
                            index={processState.currentStep}
                            stepName={processState.steps[processState.currentStep]?.name}
                            stepStatus={processState.stepResults[processState.currentStep]?.status}
                          />
                        )}
                    </div>
                  </>
                )}

                <Form
                  className={'form-container form-space-sm'}
                  form={form}
                  initialValues={formDefault}
                  onFieldsChange={onFieldsChange}
                  onFinish={onSubmit}
                >
                  <HiddenInput fields={hideFields} />

                  <Form.Item
                    name={'from'}
                  >
                    <AccountSelector
                      disabled={!isAllAccount}
                      doFilter={false}
                      externalAccounts={accountSelectorList}
                    />
                  </Form.Item>

                  <div className={'__balance-display-area'}>
                    <FreeBalanceToEarn
                      address={fromValue}
                      hidden={submitStepType !== YieldStepType.XCM}
                      label={`${t('Available balance')}:`}
                      onBalanceReady={setIsBalanceReady}
                      tokens={balanceTokens}
                    />

                    <FreeBalance
                      address={fromValue}
                      chain={poolInfo?.chain || ''}
                      hidden={[YieldStepType.XCM].includes(submitStepType)}
                      isSubscribe={true}
                      label={`${t('Available balance')}:`}
                      tokenSlug={inputAsset?.slug}
                    />
                  </div>

                  <Form.Item
                    name={'value'}
                  >
                    <AmountInput
                      decimals={assetDecimals}
                      disabled={processState.currentStep !== 0}
                      maxValue={'1'} // todo: no maxValue, this is just temporary solution
                      showMaxButton={false}
                    />
                  </Form.Item>

                  <div className={'__transformed-amount-value'}>
                    <Number
                      decimal={0}
                      prefix={(currencyData?.isPrefix && currencyData.symbol) || ''}
                      suffix={(!currencyData?.isPrefix && currencyData?.symbol) || ''}
                      value={transformAmount}
                    />
                  </div>

                  {poolType === YieldPoolType.NOMINATION_POOL && (
                    <Form.Item
                      name={'target'}
                    >
                      <EarningPoolSelector
                        chain={poolChain}
                        defaultValue={defaultData.target === 'not-support' || !!compound ? '' : defaultData.target}
                        disabled={submitLoading}
                        from={fromValue}
                        label={t('Pool')}
                        loading={targetLoading}
                        setForceFetchValidator={setForceFetchValidator}
                        slug={slug}
                      />
                    </Form.Item>
                  )}

                  {poolType === YieldPoolType.NATIVE_STAKING && (
                    <Form.Item
                      name={'target'}
                    >
                      <EarningValidatorSelector
                        chain={chainValue}
                        defaultValue={validatorDefaultValue}
                        disabled={submitLoading}
                        from={fromValue}
                        loading={targetLoading}
                        setForceFetchValidator={setForceFetchValidator}
                        slug={slug}
                      />
                    </Form.Item>
                  )}
                </Form>

                {renderMetaInfo()}

                <AlertBox
                  className={'__alert-box'}
                  description={STAKE_ALERT_DATA.description.replace('{tokenAmount}', maintainString)}
                  title={STAKE_ALERT_DATA.title}
                  type={'warning'}
                />
              </TransactionContent>
              <TransactionFooter>
                <Button
                  block={true}
                  className={'__start-earning-button'}
                  disabled={isDisabledButton}
                  icon={(
                    <Icon
                      phosphorIcon={PlusCircle}
                      weight={'fill'}
                    />
                  )}
                  loading={submitLoading}
                  onClick={onPreCheck(form.submit, exType)}
                >
                  {processState.currentStep === 0 ? t('Stake') : t('Continue')}
                </Button>
              </TransactionFooter>
            </div>

            {isWebUI && (
              <div className={'__transaction-process'}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: token.paddingSM, paddingTop: token.paddingXS }}>

                  <Typography.Text className={'earning-calculator-message'}>{processText}</Typography.Text>

                  {!stepLoading && processState.steps.map((item, index) => {
                    return (
                      <EarningProcessItem
                        index={index}
                        key={index}
                        stepName={item.name}
                        stepStatus={processState.stepResults[index]?.status}
                      />
                    );
                  })}

                  {
                    stepLoading && (
                      <ActivityIndicator
                        prefixCls={'ant'}
                        size={'32px'}
                      />
                    )
                  }
                  <Divider style={{ backgroundColor: token.colorBgDivider, marginTop: token.marginSM, marginBottom: token.marginSM, height: 2 }} />

                  <Typography.Text style={{ color: token.colorTextLight4 }}>
                    {t('All steps in the process are designed based on your available multi-chain assets to optimize fee structure and enhance your overall experience.')}
                  </Typography.Text>
                </div>
              </div>
            )}
          </>
        )
      }

      {
        (!isWebUI || isFromStakingRW) && (
          <EarningInstructionModal
            address={currentAccount?.address}
            assetRegistry={chainAsset}
            closeAlert={closeAlert}
            isShowStakeMoreButton={!isClickInfoButtonRef.current}
            onCancel={onCancelInstructionModal}
            onStakeMore={onStakeMore}
            openAlert={openAlert}
            poolInfo={poolInfo}
          />
        )
      }
    </>
  );
};

const Wrapper: React.FC<Props> = (props: Props) => {
  const { defaultData } = useTransactionContext<EarnParams>();
  const { setWebBaseClassName } = useContext(WebUIContext);

  const { className } = props;

  useEffect(() => {
    setWebBaseClassName(`${className || ''}-web-base-container`);

    return () => {
      setWebBaseClassName('');
    };
  }, [className, setWebBaseClassName]);

  return (
    <EarnOutlet
      autoEnableChain={defaultData.redirectFromPreview}
      className={CN(className)}
      path={'/transaction/earn'}
      stores={['price', 'chainStore', 'assetRegistry', 'earning']}
    >
      <Component className={className} />
    </EarnOutlet>
  );
};

const Earn = styled(Wrapper)<Props>(({ theme: { token } }: Props) => {
  return {
    display: 'flex',
    flexDirection: 'row',
    maxWidth: 784,
    width: '100%',
    marginLeft: 'auto',
    marginRight: 'auto',
    gap: token.size,

    '&.earning-alert-modal': {
      alignItems: 'center',

      '.ant-sw-modal-body': {
        paddingBottom: token.padding
      },

      '.ant-sw-modal-footer': {
        flexWrap: 'wrap',
        gap: token.paddingSM
      },

      '.ant-btn.ant-btn.ant-btn': {
        marginInlineStart: 0,
        order: 2
      },

      '.ant-btn.ant-btn.ant-btn:last-child': {
        order: 1
      }
    },

    '.__process-item-wrapper': {
      paddingBottom: token.paddingSM,
      borderBottom: '2px solid',
      borderBottomColor: 'rgba(33, 33, 33, 0.80)',
      marginBottom: token.marginSM
    },

    '.__col': {
      flex: '0 1 auto'
    },

    '.__chain-name': {
      'white-space': 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis'

    },

    '.__chain-item': {
      paddingLeft: 8
    },

    '.__process-item-loading': {
      height: 32,
      display: 'flex',
      alignItems: 'center'
    },

    '.__balance-display-area': {
      marginBottom: token.marginSM
    },

    '.__transformed-amount-value': {
      color: token.colorTextLight4,
      fontSize: token.fontSize,
      lineHeight: token.lineHeight,
      marginBottom: token.marginSM,

      '.ant-number, .ant-typography': {
        color: 'inherit !important',
        fontSize: 'inherit !important',
        fontWeight: 'inherit !important',
        lineHeight: 'inherit'
      }
    },
    '.__transaction-block': {
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    },

    '.__alert-box': {
      marginTop: token.marginSM
    },

    '.earning-wrapper': {
      display: 'flex',
      flex: 1
    },

    '.web-ui-enable &': {
      '.__transaction-block, .__transaction-process': {
        flex: 1
      },

      '.__transaction-block': {
        display: 'block'
      },

      '.transaction-content, .transaction-footer': {
        paddingRight: 0,
        paddingLeft: 0
      },

      '.meta-info': {
        marginBottom: token.marginSM
      }
    },

    '&-web-base-container': {
      '.web-layout-content': {
        position: 'relative'
      },

      '.common-pages': {
        height: 'auto'
      },

      '.web-layout-content .loading-layer': {
        position: 'absolute',
        inset: 0
      }
    }
  };
});

export default Earn;
