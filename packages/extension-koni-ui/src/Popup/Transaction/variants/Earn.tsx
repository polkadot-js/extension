// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ExtrinsicType } from '@subwallet/extension-base/background/KoniTypes';
import { _getAssetDecimals, _getAssetSymbol } from '@subwallet/extension-base/services/chain-service/utils';
import { SWTransactionResponse } from '@subwallet/extension-base/services/transaction-service/types';
import { NominationPoolInfo, OptimalYieldPath, OptimalYieldPathParams, SubmitJoinNativeStaking, SubmitJoinNominationPool, SubmitYieldJoinData, ValidatorInfo, YieldPoolType, YieldStepType } from '@subwallet/extension-base/types';
import { addLazy, isSameAddress } from '@subwallet/extension-base/utils';
import { AccountSelector, AlertBox, AmountInput, EarningPoolSelector, EarningValidatorSelector, HiddenInput, InfoIcon, MetaInfo } from '@subwallet/extension-koni-ui/components';
import { EarningProcessItem } from '@subwallet/extension-koni-ui/components/Earning';
import { getInputValuesFromString } from '@subwallet/extension-koni-ui/components/Field/AmountInput';
import { EarningInstructionModal } from '@subwallet/extension-koni-ui/components/Modal/Earning';
import { EARNING_INSTRUCTION_MODAL, STAKE_ALERT_DATA } from '@subwallet/extension-koni-ui/constants';
import { useFetchChainState, useGetBalance, useGetNativeTokenSlug, useInitValidateTransaction, usePreCheckAction, useRestoreTransaction, useSelector, useTransactionContext, useWatchTransaction } from '@subwallet/extension-koni-ui/hooks';
import { useYieldPositionDetail } from '@subwallet/extension-koni-ui/hooks/earning';
import { insufficientMessages } from '@subwallet/extension-koni-ui/hooks/transaction/useHandleSubmitTransaction';
import { fetchPoolTarget, getOptimalYieldPath, submitJoinYieldPool, validateYieldProcess } from '@subwallet/extension-koni-ui/messaging';
import { unlockDotCheckCanMint } from '@subwallet/extension-koni-ui/messaging/campaigns';
import { DEFAULT_YIELD_PROCESS, EarningActionType, earningReducer } from '@subwallet/extension-koni-ui/reducer';
import { store } from '@subwallet/extension-koni-ui/stores';
import { EarnParams, FormCallbacks, FormFieldData, ThemeProps } from '@subwallet/extension-koni-ui/types';
import { convertFieldToObject, parseNominations, simpleCheckForm } from '@subwallet/extension-koni-ui/utils';
import { ActivityIndicator, Button, ButtonProps, Form, Icon, ModalContext, Number } from '@subwallet/react-ui';
import BigN from 'bignumber.js';
import CN from 'classnames';
import { PlusCircle } from 'phosphor-react';
import React, { useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

import useNotification from '../../../hooks/common/useNotification';
import { accountFilterFunc, getJoinYieldParams } from '../helper';
import { EarnOutlet, FreeBalance, FreeBalanceToEarn, TransactionContent, TransactionFooter } from '../parts';

type Props = ThemeProps;

const hideFields: Array<keyof EarnParams> = ['slug', 'chain', 'asset'];
const validateFields: Array<keyof EarnParams> = ['from'];
const loadingStepPromiseKey = 'earning.step.loading';

const instructionModalId = EARNING_INSTRUCTION_MODAL;

// Not enough balance to xcm;
export const insufficientXCMMessages = ['You can only enter a maximum'];

const Component = () => {
  const { t } = useTranslation();
  const notify = useNotification();
  const { activeModal } = useContext(ModalContext);

  const { closeAlert, defaultData, goBack, onDone,
    openAlert, persistData,
    setBackProps, setSubHeaderRightButtons } = useTransactionContext<EarnParams>();

  const { slug } = defaultData;

  const { accounts, isAllAccount } = useSelector((state) => state.accountState);
  const { chainInfoMap } = useSelector((state) => state.chainStore);
  const { poolInfoMap, poolTargetsMap } = useSelector((state) => state.earning);
  const { assetRegistry: chainAsset } = useSelector((state) => state.assetRegistry);
  const { priceMap } = useSelector((state) => state.price);

  const [form] = Form.useForm<EarnParams>();
  const formDefault = useMemo((): EarnParams => ({ ...defaultData }), [defaultData]);

  const fromValue = useWatchTransaction('from', form, defaultData);
  const amountValue = useWatchTransaction('value', form, defaultData);
  const chainValue = useWatchTransaction('chain', form, defaultData);
  const poolTarget = useWatchTransaction('target', form, defaultData);

  const nativeTokenSlug = useGetNativeTokenSlug(chainValue);

  const isClickInfoButtonRef = useRef<boolean>(false);

  const [processState, dispatchProcessState] = useReducer(earningReducer, DEFAULT_YIELD_PROCESS);

  const currentStep = processState.currentStep;
  const firstStep = currentStep === 0;
  const submitStepType = processState.steps?.[!currentStep ? currentStep + 1 : currentStep]?.type;

  const { compound } = useYieldPositionDetail(slug);
  const { nativeTokenBalance } = useGetBalance(chainValue, fromValue);

  const poolInfo = poolInfoMap[slug];
  const poolType = poolInfo.type;
  const poolChain = poolInfo.chain;

  const [isBalanceReady, setIsBalanceReady] = useState<boolean>(true);
  const [forceFetchValidator, setForceFetchValidator] = useState(false);
  const [targetLoading, setTargetLoading] = useState(false);
  const [stepLoading, setStepLoading] = useState<boolean>(true);
  const [submitString, setSubmitString] = useState<string | undefined>();
  const [connectionError, setConnectionError] = useState<string>();
  const [, setCanMint] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [checkMintLoading, setCheckMintLoading] = useState(false);
  const [isFormInvalid, setIsFormInvalid] = useState(true);

  const chainState = useFetchChainState(poolInfo.chain);

  const mustChooseTarget = useMemo(
    () => [YieldPoolType.NATIVE_STAKING, YieldPoolType.NOMINATION_POOL].includes(poolType),
    [poolType]
  );

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

  const nativeAsset = useMemo(() => chainAsset[nativeTokenSlug], [chainAsset, nativeTokenSlug]);

  const assetDecimals = inputAsset ? _getAssetDecimals(inputAsset) : 0;
  const priceValue = priceMap[inputAsset.priceId || ''] || 0;
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

  const handleDataForInsufficientAlert = useCallback(() => {
    const _assetDecimals = nativeAsset.decimals || 0;
    const existentialDeposit = nativeAsset.minAmount || '0';

    return {
      existentialDeposit: getInputValuesFromString(existentialDeposit, _assetDecimals),
      availableBalance: getInputValuesFromString(nativeTokenBalance.value, _assetDecimals),
      maintainBalance: getInputValuesFromString(poolInfo.metadata.maintainBalance || '0', _assetDecimals),
      symbol: nativeAsset.symbol
    };
  }, [nativeAsset, nativeTokenBalance.value, poolInfo.metadata.maintainBalance]);

  const onError = useCallback(
    (error: Error) => {
      if (insufficientMessages.some((v) => error.message.includes(v))) {
        openAlert({
          title: t('Insufficient balance'),
          content: t('Your available balance is {{availableBalance}} {{symbol}}, you need to leave {{existentialDeposit}} {{symbol}} as minimal balance (existential deposit) and pay network fees. Make sure you have at least {{maintainBalance}} {{symbol}} in your transferable balance to proceed.', { replace: { ...handleDataForInsufficientAlert() } }),
          okButton: {
            text: t('I understand'),
            onClick: () => {
              closeAlert();
            }
          }
        });
        dispatchProcessState({
          type: EarningActionType.STEP_ERROR_ROLLBACK,
          payload: error
        });

        return;
      } else if (insufficientXCMMessages.some((v) => error.message.includes(v))) {
        openAlert({
          title: t('Insufficient balance'),
          content: error.message,
          okButton: {
            text: t('I understand'),
            onClick: () => {
              closeAlert();
            }
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
    [closeAlert, handleDataForInsufficientAlert, notify, openAlert, t]
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

  const onPreCheck = usePreCheckAction(fromValue);

  useRestoreTransaction(form);
  useInitValidateTransaction(validateFields, form, defaultData);

  const onBack = useCallback(() => {
    if (firstStep) {
      goBack();
    } else {
      openAlert({
        title: t('Cancel earning process?'),
        content: t('Going back will cancel the current earning process. Do you wish to cancel?'),
        okButton: {
          text: t('Cancel earning'),
          onClick: goBack,
          schema: 'error'
        },
        cancelButton: {
          text: t('Not now'),
          onClick: () => {
            closeAlert();
          }
        }
      });
    }
  }, [closeAlert, firstStep, goBack, openAlert, t]);

  const onCancelInstructionModal = useCallback(() => {
    if (!isClickInfoButtonRef.current) {
      goBack();
    }
  }, [goBack]);

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
  }, [submitString, currentStep, chainInfoMap, slug, poolTarget, getTargetedPool, fromValue, amountValue, notify]);

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

  useEffect(() => {
    if (!compound) {
      isClickInfoButtonRef.current = false;
      activeModal(instructionModalId);
    }
  }, [activeModal, compound]);

  const subHeaderButtons: ButtonProps[] = useMemo(() => {
    return [
      {
        icon: <InfoIcon />,
        onClick: () => {
          isClickInfoButtonRef.current = true;
          activeModal(EARNING_INSTRUCTION_MODAL);
        }
      }
    ];
  }, [activeModal]);

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

  return (
    <>
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
              chain={poolInfo.chain}
              hidden={[YieldStepType.XCM].includes(submitStepType)}
              isSubscribe={true}
              label={`${t('Available balance')}:`}
              tokenSlug={inputAsset.slug}
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
              prefix={'$'}
              value={transformAmount}
            />
          </div>

          {poolType === YieldPoolType.NOMINATION_POOL && (
            <Form.Item
              name={'target'}
            >
              <EarningPoolSelector
                chain={poolChain}
                disabled={submitLoading}
                from={fromValue}
                label={t('Select pool')}
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
          disabled={isDisabledButton}
          icon={(
            <Icon
              phosphorIcon={PlusCircle}
              weight={'fill'}
            />
          )}
          loading={submitLoading}
          onClick={onPreCheck(form.submit, ExtrinsicType.JOIN_YIELD_POOL)}
        >
          {t('Stake')}
        </Button>
      </TransactionFooter>

      <EarningInstructionModal
        closeAlert={closeAlert}
        isShowStakeMoreButton={!isClickInfoButtonRef.current}
        onCancel={onCancelInstructionModal}
        openAlert={openAlert}
        slug={slug}
      />
    </>
  );
};

const Wrapper: React.FC<Props> = (props: Props) => {
  const { className } = props;

  return (
    <EarnOutlet
      className={CN(className)}
      path={'/transaction/earn'}
      stores={['price', 'chainStore', 'assetRegistry', 'earning']}
    >
      <Component />
    </EarnOutlet>
  );
};

const Earn = styled(Wrapper)<Props>(({ theme: { token } }: Props) => {
  return {
    '.__process-item-wrapper': {
      paddingBottom: token.paddingSM,
      borderBottom: '2px solid',
      borderBottomColor: 'rgba(33, 33, 33, 0.80)',
      marginBottom: token.marginSM
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

    '.__alert-box': {
      marginTop: token.marginSM
    }
  };
});

export default Earn;
