// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _getAssetDecimals, _getAssetSymbol } from '@subwallet/extension-base/services/chain-service/utils';
import { SWTransactionResponse } from '@subwallet/extension-base/services/transaction-service/types';
import { NominationPoolInfo, OptimalYieldPath, OptimalYieldPathParams, SubmitJoinNativeStaking, SubmitJoinNominationPool, SubmitYieldJoinData, ValidatorInfo, YieldPoolType } from '@subwallet/extension-base/types';
import { addLazy, isSameAddress } from '@subwallet/extension-base/utils';
import { HiddenInput, MetaInfo, PageWrapper } from '@subwallet/extension-koni-ui/components';
import { getInputValuesFromString } from '@subwallet/extension-koni-ui/components/Field/AmountInput';
import { DataContext } from '@subwallet/extension-koni-ui/contexts/DataContext';
import { useFetchChainState, useGetBalance, useInitValidateTransaction, usePreCheckAction, useRestoreTransaction, useSelector, useTransactionContext, useWatchTransaction } from '@subwallet/extension-koni-ui/hooks';
import { useYieldPositionDetail } from '@subwallet/extension-koni-ui/hooks/earning';
import { insufficientMessages } from '@subwallet/extension-koni-ui/hooks/transaction/useHandleSubmitTransaction';
import { fetchPoolTarget, getOptimalYieldPath, submitJoinYieldPool, validateYieldProcess } from '@subwallet/extension-koni-ui/messaging';
import { unlockDotCheckCanMint } from '@subwallet/extension-koni-ui/messaging/campaigns';
import { DEFAULT_YIELD_PROCESS, EarningActionType, earningReducer } from '@subwallet/extension-koni-ui/reducer';
import { store } from '@subwallet/extension-koni-ui/stores';
import { EarnParams, FormCallbacks, FormFieldData, ThemeProps } from '@subwallet/extension-koni-ui/types';
import { convertFieldToObject, parseNominations, simpleCheckForm } from '@subwallet/extension-koni-ui/utils';
import { Form } from '@subwallet/react-ui';
import BigN from 'bignumber.js';
import CN from 'classnames';
import React, { useCallback, useContext, useEffect, useMemo, useReducer, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

import { accountFilterFunc, getJoinYieldParams } from '../helper';
import { EarnOutlet, TransactionContent, TransactionFooter } from '../parts';

type Props = ThemeProps;

const hideFields: Array<keyof EarnParams> = ['slug', 'chain', 'asset'];
const validateFields: Array<keyof EarnParams> = ['from'];
const loadingStepPromiseKey = 'earning.step.loading';

const Component = () => {
  const { t } = useTranslation();
  // @ts-ignore
  const navigate = useNavigate();

  const dataContext = useContext(DataContext);
  const { defaultData, onDone, persistData } = useTransactionContext<EarnParams>();
  const { slug } = defaultData;

  // @ts-ignore
  const { accounts, isAllAccount } = useSelector((state) => state.accountState);
  const { chainInfoMap } = useSelector((state) => state.chainStore);
  const { poolInfoMap, poolTargetsMap } = useSelector((state) => state.earning);
  const { assetRegistry: chainAsset } = useSelector((state) => state.assetRegistry);
  const { priceMap } = useSelector((state) => state.price);
  // @ts-ignore
  const { assetRegistry } = useSelector((state) => state.assetRegistry);

  const [form] = Form.useForm<EarnParams>();
  const formDefault = useMemo((): EarnParams => ({ ...defaultData }), [defaultData]);

  const fromValue = useWatchTransaction('from', form, defaultData);
  const amountValue = useWatchTransaction('value', form, defaultData);
  const chainValue = useWatchTransaction('chain', form, defaultData);
  const poolTarget = useWatchTransaction('target', form, defaultData);

  const [processState, dispatchProcessState] = useReducer(earningReducer, DEFAULT_YIELD_PROCESS);

  const currentStep = processState.currentStep;
  // @ts-ignore
  const firstStep = currentStep === 0;
  // @ts-ignore
  const submitStepType = processState.steps?.[!currentStep ? currentStep + 1 : currentStep]?.type;
  // @ts-ignore
  const { compound } = useYieldPositionDetail(slug);
  // @ts-ignore
  const { nativeTokenBalance } = useGetBalance(chainValue, fromValue);

  const poolInfo = poolInfoMap[slug];
  const poolType = poolInfo.type;
  const poolChain = poolInfo.chain;

  // @ts-ignore
  const [isBalanceReady, setIsBalanceReady] = useState<boolean>(true);
  // @ts-ignore
  const [detailModalVisible, setDetailModalVisible] = useState<boolean>(false);
  const [forceFetchValidator, setForceFetchValidator] = useState(false);
  const [targetLoading, setTargetLoading] = useState(false);
  const [stepLoading, setStepLoading] = useState<boolean>(true);
  const [submitString, setSubmitString] = useState<string | undefined>();
  const [connectionError, setConnectionError] = useState<string>();
  const [, setCanMint] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [checkMintLoading, setCheckMintLoading] = useState(false);
  // @ts-ignore
  const [isTransactionDone, setTransactionDone] = useState(false);
  // @ts-ignore
  const [loading, setLoading] = useState(true);
  const [isFormInvalid, setIsFormInvalid] = useState(true);

  const chainState = useFetchChainState(poolInfo.chain);

  const mustChooseTarget = useMemo(
    () => [YieldPoolType.NATIVE_STAKING, YieldPoolType.NOMINATION_POOL].includes(poolType),
    [poolType]
  );

  // @ts-ignore
  const balanceTokens = useMemo(() => {
    const result: Array<{ chain: string; token: string }> = [];

    const _chain = poolInfo.chain;

    result.push({
      token: poolInfo.metadata.inputAsset,
      chain: _chain
    });

    if (poolInfo.type === YieldPoolType.LENDING || poolInfo.type === YieldPoolType.LIQUID_STAKING) {
      const altAsset = poolInfo.metadata.altInputAssets;
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

  // @ts-ignore
  const isDisabledButton = useMemo(
    () =>
      checkMintLoading ||
      stepLoading ||
      !!connectionError ||
      !amountValue ||
      !isBalanceReady ||
      isFormInvalid ||
      submitLoading ||
      targetLoading ||
      (mustChooseTarget && !poolTarget),
    [checkMintLoading, stepLoading, connectionError, amountValue, isBalanceReady, isFormInvalid, submitLoading, targetLoading, mustChooseTarget, poolTarget]
  );

  const inputAsset = useMemo(
    () => chainAsset[poolInfo.metadata.inputAsset],
    [chainAsset, poolInfo.metadata.inputAsset]
  );
  const assetDecimals = inputAsset ? _getAssetDecimals(inputAsset) : 0;
  const priceValue = priceMap[inputAsset.priceId || ''] || 0;
  const convertValue = amountValue ? parseFloat(amountValue) / 10 ** assetDecimals : 0;
  // @ts-ignore
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

  // @ts-ignore
  const maintainString = useMemo(() => {
    const maintainAsset = chainAsset[poolInfo.metadata.maintainAsset];
    const maintainBalance = poolInfo.metadata.maintainBalance;

    return `${getInputValuesFromString(maintainBalance, maintainAsset.decimals || 0)} ${maintainAsset.symbol}`;
  }, [poolInfo.metadata.maintainAsset, poolInfo.metadata.maintainBalance, chainAsset]);

  const getTargetedPool = useCallback(
    (target: string) => {
      const _poolTargets = poolTargetsMap[slug];

      if (!_poolTargets) {
        return [];
      } else {
        if (YieldPoolType.NOMINATION_POOL === poolType) {
          const poolTargets = _poolTargets as NominationPoolInfo[];

          for (const pool of poolTargets) {
            if (String(pool.id) === target) {
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
          const nominations = parseNominations(target);

          validatorList.forEach((validator) => {
            if (nominations.some((nomination) => isSameAddress(nomination, validator.address))) {
              // remember the format of the address
              result.push(validator);
            }
          });

          return result;
        } else {
          return [];
        }
      }
    },
    [poolTargetsMap, poolType, slug]
  );

  const accountSelectorList = useMemo(() => {
    return accounts.filter(accountFilterFunc(chainInfoMap, poolType, poolChain));
  }, [accounts, chainInfoMap, poolChain, poolType]);

  const onFieldsChange: FormCallbacks<EarnParams>['onFieldsChange'] = useCallback((changedFields: FormFieldData[], allFields: FormFieldData[]) => {
    // TODO: field change
    const { empty, error } = simpleCheckForm(allFields, ['--asset']);

    const values = convertFieldToObject<EarnParams>(allFields);

    setIsFormInvalid(empty || error);
    persistData(values);
  }, [persistData]);

  const onError = useCallback(
    (error: Error) => {
      if (insufficientMessages.some((v) => error.message.includes(v))) {
        // todo: alert here

        dispatchProcessState({
          type: EarningActionType.STEP_ERROR_ROLLBACK,
          payload: error
        });

        return;
      }

      setTransactionDone(false);
      // hideAll();
      // show(error.message, { type: 'danger', duration: 8000 });
      dispatchProcessState({
        type: EarningActionType.STEP_ERROR_ROLLBACK,
        payload: error
      });
    },
    []
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
              // hideAll();
              // show(
              //   'Your selected network has lost connection. Update it by re-enabling it or changing network provider',
              //   { type: 'danger', duration: 8000 },
              // );

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
            setTransactionDone(false);

            return false;
          }
        } else if (id) {
          dispatchProcessState({
            type: EarningActionType.STEP_COMPLETE,
            payload: rs
          });

          if (lastStep) {
            onDone(id);
            setTransactionDone(true);

            return false;
          }

          return true;
        } else {
          return false;
        }
      };
    },
    [onDone, onError]
  );

  const onSubmit: FormCallbacks<EarnParams>['onFinish'] = useCallback((values: EarnParams) => {
    setSubmitLoading(true);
    const { from, slug, target, value: _currentAmount } = values;

    const getData = (submitStep: number): SubmitYieldJoinData => {
      if ([YieldPoolType.NOMINATION_POOL, YieldPoolType.NATIVE_STAKING].includes(poolInfo.type) && target) {
        const targets = getTargetedPool(target);

        if (poolInfo.type === YieldPoolType.NOMINATION_POOL) {
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

    setTimeout(() => {
      submitData(currentStep)
        .catch(onError)
        .finally(() => {
          setSubmitLoading(false);
        });
    }, 300);
  }, [currentStep, getTargetedPool, onError, onSuccess, poolInfo, processState.feeStructure, processState.steps]);

  // @ts-ignore
  const renderMetaInfo = useCallback(() => {
    const value = amountValue ? parseFloat(amountValue) / 10 ** assetDecimals : 0;
    const assetSymbol = inputAsset.symbol;

    const assetEarnings =
      poolInfo.statistic && 'assetEarning' in poolInfo.statistic ? poolInfo.statistic.assetEarning : [];
    const derivativeAssets = 'derivativeAssets' in poolInfo.metadata ? poolInfo.metadata.derivativeAssets : [];
    const showFee = [YieldPoolType.LENDING, YieldPoolType.LIQUID_STAKING].includes(poolInfo.type);

    let minJoinPool: string | undefined;

    if (poolInfo.statistic) {
      const minPoolJoin = poolInfo.statistic.earningThreshold.join;
      const targeted = getTargetedPool(poolTarget)[0];

      if (targeted) {
        if ('minBond' in targeted) {
          const minTargetJoin = new BigN(targeted.minBond || '0');

          minJoinPool = minTargetJoin.gt(minJoinPool || '0') ? minTargetJoin.toString() : minJoinPool;
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
        {minJoinPool && (
          <MetaInfo.Number
            decimals={assetDecimals}
            label={t('Minimum active stake')}
            suffix={assetSymbol}
            value={minJoinPool}
          />
        )}

        <MetaInfo.Chain
          chain={chainInfoMap[chainValue].slug}
          label={t('Network')}
        />

        {showFee && (
          <MetaInfo.Number
            decimals={0}
            label={t('Estimated fee')}
            prefix={'$'}
            value={estimatedFee}
          />
        )}
      </MetaInfo>
    );
  }, [amountValue, assetDecimals, inputAsset.symbol, poolInfo.statistic, poolInfo.metadata, poolInfo.type, t, chainInfoMap, chainValue, estimatedFee, getTargetedPool, poolTarget, chainAsset]);

  // @ts-ignore
  const onPreCheck = usePreCheckAction(fromValue);

  useRestoreTransaction(form);
  useInitValidateTransaction(validateFields, form, defaultData);

  useEffect(() => {
    form.setFieldValue('asset', inputAsset.slug || '');
  }, [form, inputAsset.slug]);

  useEffect(() => {
    if (!fromValue && accountSelectorList.length >= 1) {
      form.setFieldValue('from', accountSelectorList[0].address);
    }
  }, [accountSelectorList, form, fromValue]);

  useEffect(() => {
    if (currentStep === 0) {
      const submitData: OptimalYieldPathParams = {
        address: fromValue,
        amount: amountValue,
        slug: slug,
        targets: poolTarget ? getTargetedPool(poolTarget) : undefined
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

                  // todo: toast here
                  console.log(text);
                  // hideAll();
                  // show(text, { type: 'danger', duration: 8000 });
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
  }, [submitString, currentStep, chainInfoMap, slug, poolTarget, getTargetedPool, fromValue, amountValue]);

  useEffect(() => {
    setCheckMintLoading(true);

    unlockDotCheckCanMint({
      slug: poolInfo.slug,
      address: fromValue,
      network: poolInfo.chain
    })
      .then((value) => {
        setCanMint(value);
      })
      .finally(() => {
        setCheckMintLoading(false);
      });

    return () => {
      setCanMint(false);
    };
  }, [fromValue, poolInfo.chain, poolInfo.slug]);

  useEffect(() => {
    let unmount = false;

    if ((!!chainValue && !!fromValue && chainState?.active) || forceFetchValidator) {
      setTargetLoading(true);
      fetchPoolTarget({ slug })
        .then((result) => {
          store.dispatch({ type: 'earning/updatePoolTargets', payload: result });
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

  return (
    <>
      <TransactionContent>
        <PageWrapper resolve={dataContext.awaitStores(['earning'])}>
          <Form
            className={'form-container form-space-sm'}
            form={form}
            initialValues={formDefault}
            onFieldsChange={onFieldsChange}
            onFinish={onSubmit}
          >
            <HiddenInput fields={hideFields} />
          </Form>
        </PageWrapper>
      </TransactionContent>
      <TransactionFooter
        errors={[]}
        warnings={[]}
      >
        <div></div>
      </TransactionFooter>
    </>
  );
};

const Wrapper: React.FC<Props> = (props: Props) => {
  const { className } = props;

  return (
    <EarnOutlet
      className={CN(className)}
      path={'/transaction/earn'}
      stores={['price', 'chainStore', 'assetRegistry']}
    >
      <Component />
    </EarnOutlet>
  );
};

const Earn = styled(Wrapper)<Props>(({ theme: { token } }: Props) => {
  return {

  };
});

export default Earn;
