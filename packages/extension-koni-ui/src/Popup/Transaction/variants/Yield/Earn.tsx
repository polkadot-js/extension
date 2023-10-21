// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { NominatorMetadata, OptimalYieldPathRequest, SubmitJoinNativeStaking, SubmitJoinNominationPool, ValidatorInfo, YieldAssetExpectedEarning, YieldCompoundingPeriod, YieldPoolInfo, YieldPoolType } from '@subwallet/extension-base/background/KoniTypes';
import { AccountJson } from '@subwallet/extension-base/background/types';
import { calculateReward } from '@subwallet/extension-base/koni/api/yield';
import { _getAssetDecimals, _getAssetSymbol, _isChainEvmCompatible } from '@subwallet/extension-base/services/chain-service/utils';
import { SWTransactionResponse } from '@subwallet/extension-base/services/transaction-service/types';
import { addLazy, isSameAddress } from '@subwallet/extension-base/utils';
import { balanceFormatter, formatNumber } from '@subwallet/extension-base/utils/number';
import { AccountSelector, AmountInput, EarningProcessItem, HiddenInput, MetaInfo, StakingProcessModal, YieldMultiValidatorSelector, YieldPoolSelector } from '@subwallet/extension-koni-ui/components';
import { ScreenContext } from '@subwallet/extension-koni-ui/contexts/ScreenContext';
import { useFetchChainState, useGetChainPrefixBySlug, useNotification, usePreCheckAction, useTransactionContext, useWatchTransaction } from '@subwallet/extension-koni-ui/hooks';
import useGetYieldPositionByAddressAndSlug from '@subwallet/extension-koni-ui/hooks/screen/earning/useGetYieldPositionByAddressAndSlug';
import { getOptimalYieldPath } from '@subwallet/extension-koni-ui/messaging';
import { unlockDotCheckCanMint } from '@subwallet/extension-koni-ui/messaging/campaigns';
import { DEFAULT_YIELD_PROCESS, EarningActionType, earningReducer } from '@subwallet/extension-koni-ui/reducer';
import { RootState } from '@subwallet/extension-koni-ui/stores';
import { FormCallbacks, FormFieldData, FormRule, Theme, ThemeProps, YieldParams } from '@subwallet/extension-koni-ui/types';
import { convertFieldToObject, findNetworkJsonByGenesisHash, getEarnExtrinsicType, isAccountAll, parseNominations, simpleCheckForm, transactionDefaultFilterAccount } from '@subwallet/extension-koni-ui/utils';
import { ActivityIndicator, Button, Divider, Form, Icon, Logo, Number, Typography } from '@subwallet/react-ui';
import BigN from 'bignumber.js';
import CN from 'classnames';
import { ArrowCircleRight, CheckCircle } from 'phosphor-react';
import React, { useCallback, useContext, useEffect, useMemo, useReducer, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import styled, { useTheme } from 'styled-components';

import { isEthereumAddress } from '@polkadot/util-crypto';

import { fetchEarningChainValidators, getJoinYieldParams, handleValidateYield, handleYieldStep } from '../../helper';
import { FreeBalanceToStake, TransactionContent, YieldOutlet } from '../../parts';

interface Props extends ThemeProps {
  item: YieldPoolInfo;
}

const formFieldPrefix = 'amount-';

const hiddenFields: Array<keyof YieldParams> = ['chain', 'asset', 'method'];

const loadingStepPromiseKey = 'earning.step.loading';

interface _YieldAssetExpectedEarning extends YieldAssetExpectedEarning {
  symbol: string;
}

const dotPolkadotSlug = 'polkadot-NATIVE-DOT';

const Component = () => {
  const { t } = useTranslation();
  const notify = useNotification();
  const { token } = useTheme() as Theme;

  const { isWebUI } = useContext(ScreenContext);

  const navigate = useNavigate();

  const poolInfoMap = useSelector((state: RootState) => state.yieldPool.poolInfo);
  const chainInfoMap = useSelector((state: RootState) => state.chainStore.chainInfoMap);
  const priceMap = useSelector((state: RootState) => state.price.priceMap);
  const chainAsset = useSelector((state: RootState) => state.assetRegistry.assetRegistry);

  const { defaultData } = useTransactionContext<YieldParams>();
  const { method: methodSlug } = defaultData;
  const { isAllAccount } = useSelector((state: RootState) => state.accountState);
  const { nominationPoolInfoMap, validatorInfoMap } = useSelector((state: RootState) => state.bonding);

  const [processState, dispatchProcessState] = useReducer(earningReducer, DEFAULT_YIELD_PROCESS);

  const [isBalanceReady, setIsBalanceReady] = useState<boolean>(true);

  const [forceFetchValidator, setForceFetchValidator] = useState<boolean>(false);
  const [poolLoading, setPoolLoading] = useState<boolean>(false);
  const [validatorLoading, setValidatorLoading] = useState<boolean>(false);

  const [isSubmitDisable, setIsSubmitDisable] = useState<boolean>(true);
  const [stepLoading, setStepLoading] = useState<boolean>(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [checkMintLoading, setCheckMintLoading] = useState(false);
  const [canMint, setCanMint] = useState(false);
  const [submitString, setSubmitString] = useState<string | undefined>();

  const currentStep = processState.currentStep;

  const [form] = Form.useForm<YieldParams>();

  const currentAmount = useWatchTransaction(`${formFieldPrefix}0`, form, defaultData);
  const currentFrom = useWatchTransaction('from', form, defaultData);
  const currentPoolInfo = useMemo(() => poolInfoMap[methodSlug], [methodSlug, poolInfoMap]);

  const needDotBalance = useMemo(() => !['westend', 'polkadot'].includes(currentPoolInfo.chain), [currentPoolInfo.chain]);

  const [isDotBalanceReady, setIsDotBalanceReady] = useState<boolean>(!needDotBalance);

  const chainState = useFetchChainState(currentPoolInfo.chain);
  const chainNetworkPrefix = useGetChainPrefixBySlug(currentPoolInfo.chain);
  const preCheckAction = usePreCheckAction(currentFrom);

  const extrinsicType = useMemo(() => getEarnExtrinsicType(methodSlug), [methodSlug]);

  const currentYieldPosition = useGetYieldPositionByAddressAndSlug(currentFrom, currentPoolInfo.slug);

  const onDone = useCallback((extrinsicHash: string) => {
    const chainType = isEthereumAddress(currentFrom) ? 'ethereum' : 'substrate';

    let donePath = 'transaction-done';

    if (canMint) {
      donePath = 'earning-done';
    }

    navigate(`/${donePath}/${chainType}/${currentPoolInfo.chain}/${extrinsicHash}`, { replace: true });
  }, [currentFrom, currentPoolInfo.chain, canMint, navigate]);

  const onError = useCallback((error: Error) => {
    notify({
      message: t(error.message),
      type: 'error'
    });
    dispatchProcessState({
      type: EarningActionType.STEP_ERROR_ROLLBACK,
      payload: error
    });
  }, [t, notify]);

  const onSuccess = useCallback((lastStep: boolean) => {
    return (rs: SWTransactionResponse) => {
      const { errors, id, warnings } = rs;

      if (errors.length || warnings.length) {
        if (![t('Rejected by user'), 'Rejected by user'].includes(errors[0]?.message)) {
          notify({
            message: errors[0]?.message || warnings[0]?.message,
            type: errors.length ? 'error' : 'warning'
          });
          onError(errors[0]);
        } else {
          dispatchProcessState({
            type: EarningActionType.STEP_ERROR_ROLLBACK,
            payload: errors[0]
          });
        }
      } else if (id) {
        dispatchProcessState({
          type: EarningActionType.STEP_COMPLETE,
          payload: rs
        });

        if (lastStep) {
          onDone(id);
        }
      }
    };
  }, [t, notify, onError, onDone]);

  const formDefault: YieldParams = useMemo(() => ({
    ...defaultData
  }), [defaultData]);

  const _assetEarnings: Record<string, _YieldAssetExpectedEarning> = useMemo(() => {
    const yearlyEarnings: Record<string, _YieldAssetExpectedEarning> = {};

    if (currentPoolInfo) {
      const inputAsset = chainAsset[currentPoolInfo.inputAssets[0] || ''];
      const decimals = _getAssetDecimals(inputAsset);
      const currentAmountNumb = currentAmount ? parseFloat(currentAmount) / (10 ** decimals) : 0;

      if (currentPoolInfo.stats?.assetEarning) {
        currentPoolInfo.stats?.assetEarning.forEach((assetEarningStats) => {
          const assetSlug = assetEarningStats.slug;
          const rewardAsset = chainAsset[assetSlug];

          if (assetEarningStats.apy !== undefined) {
            yearlyEarnings[assetSlug] = {
              apy: assetEarningStats.apy,
              rewardInToken: (assetEarningStats.apy) / 100 * currentAmountNumb,
              symbol: rewardAsset.symbol
            };
          } else {
            const assetApr = assetEarningStats?.apr || 0;

            yearlyEarnings[assetSlug] = {
              ...calculateReward(assetApr, currentAmountNumb, YieldCompoundingPeriod.YEARLY),
              symbol: rewardAsset.symbol
            };
          }
        });
      }
    }

    return yearlyEarnings;
  }, [chainAsset, currentAmount, currentPoolInfo]);

  const estimatedFee = useMemo(() => {
    let _totalFee = 0;

    if (processState.feeStructure) {
      processState.feeStructure.forEach((fee) => {
        if (fee.slug !== '') {
          const asset = chainAsset[fee.slug];
          const feeDecimals = _getAssetDecimals(asset);
          const priceValue = asset.priceId ? priceMap[asset.priceId] : 0;
          const feeNumb = priceValue * (fee.amount ? (parseFloat(fee.amount) / (10 ** feeDecimals)) : 0);

          _totalFee += feeNumb;
        }
      });
    }

    return _totalFee;
  }, [chainAsset, priceMap, processState.feeStructure]);

  const accountFilterFunc = useCallback((account: AccountJson): boolean => {
    if (isAccountAll(account.address)) {
      return false;
    }

    const chain = chainInfoMap[currentPoolInfo.chain];
    const isEvmChain = _isChainEvmCompatible(chain);
    const isEvmAddress = isEthereumAddress(account.address);

    const isLedger = !!account.isHardware;
    const validGen: string[] = account.availableGenesisHashes || [];
    const validLedgerNetwork = validGen.map((genesisHash) => findNetworkJsonByGenesisHash(chainInfoMap, genesisHash)?.slug) || [];

    if (!transactionDefaultFilterAccount(account)) {
      return false;
    }

    if (isLedger) {
      if (isEvmAddress) {
        return false;
      } else {
        return validLedgerNetwork.includes(currentPoolInfo?.chain);
      }
    }

    return isEvmChain === isEvmAddress;
  }, [chainInfoMap, currentPoolInfo.chain]);

  const onFieldsChange: FormCallbacks<YieldParams>['onFieldsChange'] = useCallback((changedFields: FormFieldData[], allFields: FormFieldData[]) => {
    const { error } = simpleCheckForm(allFields);

    const allMap = convertFieldToObject<YieldParams>(allFields);
    // const changesMap = convertFieldToObject<StakingFormProps>(changedFields);
    const checkEmpty: Record<string, boolean> = {};

    for (const [key, value] of Object.entries(allMap)) {
      checkEmpty[key] = !!value;
    }

    if (currentPoolInfo.type === YieldPoolType.NOMINATION_POOL) {
      checkEmpty.nominate = true;
    } else if (currentPoolInfo.type === YieldPoolType.NATIVE_STAKING) {
      checkEmpty.pool = true;
    } else {
      checkEmpty.pool = true;
      checkEmpty.nominate = true;
    }

    setIsSubmitDisable(error || Object.values(checkEmpty).some((value) => !value));
  }, [currentPoolInfo.type]);

  const renderMetaInfo = useCallback(() => {
    const asset = currentPoolInfo?.inputAssets[0] || '';
    const assetSymbol = chainAsset[asset].symbol || '';
    const assetDecimals = chainAsset[asset].decimals || 0;
    const value = currentAmount ? parseFloat(currentAmount) / (10 ** assetDecimals) : 0;

    return (
      <MetaInfo
        labelColorScheme={'gray'}
        valueColorScheme={'gray'}
      >
        {
          currentPoolInfo?.stats?.assetEarning?.map((item) => {
            if (item.exchangeRate === undefined || !currentPoolInfo.derivativeAssets) {
              return null;
            }

            const derivativeAssetSlug = currentPoolInfo.derivativeAssets[0];
            const derivativeAssetInfo = chainAsset[derivativeAssetSlug];

            return (
              <MetaInfo.Number
                decimals={0}
                key={item.slug}
                label={t('You\'ll receive')}
                suffix={_getAssetSymbol(derivativeAssetInfo)}
                value={value / item.exchangeRate}
              />
            );
          })
        }

        <MetaInfo.Default label={t('Yearly rewards')}>
          <div>
            {
              Object.values(_assetEarnings).map((value) => {
                const amount = (value.apy || 0);

                return `${formatNumber(amount, 0, balanceFormatter)}% ${value.symbol}`;
              }).join(' - ')
            }
          </div>
        </MetaInfo.Default>
        <MetaInfo.Default label={t('Estimated earnings')}>
          <div>
            {
              Object.values(_assetEarnings).map((value) => {
                const amount = value.rewardInToken || 0;

                return `${formatNumber(amount, 0, balanceFormatter)} ${value.symbol}`;
              }).join(' - ').concat('/year')
            }
          </div>
        </MetaInfo.Default>

        {
          currentPoolInfo.stats?.minJoinPool && (
            <MetaInfo.Number
              decimals={assetDecimals}
              label={t('Minimum active stake')}
              suffix={assetSymbol}
              value={currentPoolInfo.stats.minJoinPool}
            />
          )
        }

        <MetaInfo.Number
          decimals={0}
          label={t('Estimated fee')}
          prefix={'$'}
          value={estimatedFee}
        />
      </MetaInfo>
    );
  }, [currentPoolInfo, chainAsset, currentAmount, _assetEarnings, t, estimatedFee]);

  const getSelectedValidators = useCallback((nominations: string[]) => {
    const validatorList = validatorInfoMap[currentPoolInfo.chain];

    if (!validatorList) {
      return [];
    }

    const result: ValidatorInfo[] = [];

    validatorList.forEach((validator) => {
      if (nominations.some((nomination) => isSameAddress(nomination, validator.address))) { // remember the format of the address
        result.push(validator);
      }
    });

    return result;
  }, [currentPoolInfo.chain, validatorInfoMap]);

  const getSelectedPool = useCallback((poolId?: string) => {
    const nominationPoolList = nominationPoolInfoMap[currentPoolInfo.chain];

    for (const pool of nominationPoolList) {
      if (String(pool.id) === poolId) {
        return pool;
      }
    }

    return undefined;
  }, [nominationPoolInfoMap, currentPoolInfo.chain]);

  const amountValidator = useMemo((): FormRule => ({
    validator: (rule, value: string) => {
      if (!value) {
        return Promise.reject(t('Amount is required'));
      } else {
        if (new BigN(value).lte(0)) {
          return Promise.reject(t('Amount must be greater than 0'));
        } else {
          return Promise.resolve();
        }
      }
    }
  }), [t]);

  const isProcessDone = useMemo(() => {
    return processState.currentStep === processState.steps.length - 1;
  }, [processState.currentStep, processState.steps.length]);

  const onClick = useCallback(() => {
    setSubmitLoading(true);
    dispatchProcessState({
      type: EarningActionType.STEP_SUBMIT,
      payload: null
    });

    const values = form.getFieldsValue();
    const { from, nominate, pool } = values;
    const currentAmount = values[`${formFieldPrefix}0`];

    let data;
    const isFirstStep = processState.currentStep === 0;

    const submitStep = isFirstStep ? processState.currentStep + 1 : processState.currentStep;
    const isLastStep = submitStep === processState.steps.length - 1;

    if (currentPoolInfo.type === YieldPoolType.NOMINATION_POOL && pool) {
      const selectedPool = getSelectedPool(pool);

      data = {
        amount: currentAmount,
        selectedPool,
        nominatorMetadata: currentYieldPosition?.metadata as NominatorMetadata | undefined
      } as SubmitJoinNominationPool;
    } else if (currentPoolInfo.type === YieldPoolType.NATIVE_STAKING && pool) {
      const selectedValidators = getSelectedValidators(parseNominations(nominate));

      data = {
        amount: currentAmount,
        selectedValidators,
        nominatorMetadata: currentYieldPosition?.metadata as NominatorMetadata | undefined
      } as SubmitJoinNativeStaking;
    } else {
      data = getJoinYieldParams(currentPoolInfo, currentAmount, processState.feeStructure[submitStep]);
    }

    const submitPromise: Promise<SWTransactionResponse> = handleYieldStep(
      from,
      currentPoolInfo,
      {
        steps: processState.steps,
        totalFee: processState.feeStructure
      },
      submitStep,
      data);

    if (isFirstStep) {
      const validatePromise = handleValidateYield(
        from,
        currentPoolInfo,
        {
          steps: processState.steps,
          totalFee: processState.feeStructure
        },
        currentAmount,
        data);

      setTimeout(() => {
        validatePromise
          .then((errors) => {
            if (errors.length) {
              onError(errors[0]);

              return undefined;
            } else {
              dispatchProcessState({
                type: EarningActionType.STEP_COMPLETE,
                payload: true
              });
              dispatchProcessState({
                type: EarningActionType.STEP_SUBMIT,
                payload: null
              });

              return submitPromise;
            }
          })
          .then((rs) => {
            if (rs) {
              onSuccess(isLastStep)(rs);
            }
          })
          .catch(onError)
          .finally(() => {
            setSubmitLoading(false);
          });
      }, 300);
    } else {
      setTimeout(() => {
        submitPromise
          .then(onSuccess(isLastStep))
          .catch(onError)
          .finally(() => {
            setSubmitLoading(false);
          });
      }, 300);
    }
  }, [currentPoolInfo, currentYieldPosition?.metadata, form, getSelectedPool, getSelectedValidators, onError, onSuccess, processState.currentStep, processState.feeStructure, processState.steps]);

  useEffect(() => {
    let unmount = false;

    if ([YieldPoolType.NATIVE_STAKING, YieldPoolType.NOMINATION_POOL].includes(currentPoolInfo.type)) {
      // fetch validators when change chain
      // _stakingType is predefined form start
      if ((!!currentPoolInfo.chain && !!currentFrom && chainState?.active) || forceFetchValidator) {
        fetchEarningChainValidators(currentPoolInfo, unmount, setPoolLoading, setValidatorLoading, setForceFetchValidator);
      }
    }

    return () => {
      unmount = true;
    };
  }, [currentPoolInfo, currentFrom, chainState?.active, forceFetchValidator]);

  useEffect(() => {
    if (currentStep === 0) {
      const submitData: OptimalYieldPathRequest = {
        address: currentFrom,
        amount: currentAmount,
        poolInfo: currentPoolInfo
      };

      const newData = JSON.stringify(submitData);

      if (newData !== submitString) {
        setSubmitString(newData);

        setStepLoading(true);

        addLazy(loadingStepPromiseKey, () => {
          getOptimalYieldPath(submitData)
            .then((res) => {
              dispatchProcessState({
                payload: {
                  steps: res.steps,
                  feeStructure: res.totalFee
                },
                type: EarningActionType.STEP_CREATE
              });
            })
            .catch(console.error)
            .finally(() => setStepLoading(false));
        }, 1000, 5000, false);
      }
    }
  }, [submitString, currentPoolInfo, currentAmount, currentStep, currentFrom]);

  useEffect(() => {
    setCheckMintLoading(true);

    unlockDotCheckCanMint({
      slug: currentPoolInfo.slug,
      address: currentFrom,
      network: currentPoolInfo.chain
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
  }, [currentFrom, currentPoolInfo.chain, currentPoolInfo.slug]);

  return (
    <div className={'earning-wrapper'}>
      <div className={'__transaction-block'}>
        <TransactionContent>
          <div style={{ display: 'flex', flexDirection: 'column', gap: token.paddingSM, paddingTop: token.paddingXS }}>
            <Form
              className={'form-container form-space-sm earning-calculator-form-container'}
              form={form}
              initialValues={formDefault}
              onFieldsChange={onFieldsChange}
            >
              <HiddenInput fields={hiddenFields} />
              {/* <Form.Item */}
              {/*  name={FormFieldName.METHOD} */}
              {/*  label={t('Select method')} */}
              {/*  colon={false} */}
              {/* > */}
              {/*  <EarningMethodSelector items={Object.values(poolInfo)} /> */}
              {/* </Form.Item> */}

              {/* <Divider className={'staking-modal-divider'} /> */}

              {processState.steps && (
                <div style={{ display: 'flex', alignItems: 'center', paddingBottom: token.paddingSM }}>
                  {stepLoading
                    ? (
                      <ActivityIndicator
                        prefixCls={'ant'}
                        size={'24px'}
                      />
                    )
                    : (
                      <Typography.Text
                        size={'lg'}
                        style={{ fontWeight: '600' }}
                      >
                        {t('Step {{step}}: {{label}}', {
                          replace: { step: processState.currentStep + 1, label: processState.steps[processState.currentStep]?.name }
                        })}
                      </Typography.Text>
                    )}
                </div>
              )}

              <Form.Item
                // className={CN({ hidden: !isAllAccount })}
                name={'from'}
              >
                <AccountSelector
                  addressPrefix={chainNetworkPrefix}
                  disabled={!isAllAccount || processState.currentStep !== 0}
                  filter={accountFilterFunc}
                />
              </Form.Item>

              {
                !['westend', 'polkadot'].includes(currentPoolInfo.chain) && (
                  <FreeBalanceToStake
                    address={currentFrom}
                    chain={'polkadot'}
                    className={'account-free-balance'}
                    label={t('Available DOT on Polkadot:')}
                    onBalanceReady={setIsDotBalanceReady}
                    tokenSlug={dotPolkadotSlug}
                  />
                )
              }

              {currentPoolInfo.inputAssets.map((asset, index) => {
                const name = formFieldPrefix + String(index);
                const _asset = chainAsset[asset];
                const assetDecimals = _asset ? _getAssetDecimals(_asset) : 0;
                const priceValue = _asset && _asset.priceId ? priceMap[_asset.priceId] : 0;
                const value = currentAmount ? parseFloat(currentAmount) / (10 ** assetDecimals) : 0;
                const transformAmount = value * priceValue;

                return (
                  <div
                    key={name}
                    style={{ display: 'flex', flexDirection: 'column' }}
                  >
                    <FreeBalanceToStake
                      address={currentFrom}
                      chain={currentPoolInfo.chain}
                      className={'account-free-balance'}
                      label={t('Available to stake:')}
                      onBalanceReady={setIsBalanceReady}
                      tokenSlug={asset}
                    />

                    <Form.Item
                      colon={false}
                      name={name}
                      rules={[
                        amountValidator
                      ]}
                      statusHelpAsTooltip={true}
                    >
                      <AmountInput
                        decimals={assetDecimals}
                        disabled={processState.currentStep !== 0}
                        maxValue={'1'}
                        prefix={(
                          <Logo
                            className={'amount-prefix'}
                            size={20}
                            token={asset.split('-')[2].toLowerCase()}
                          />
                        )}
                        showMaxButton={false}
                        tooltip={t('Amount')}
                      />
                    </Form.Item>

                    <Number
                      className={'earn-transform-amount'}
                      decimal={0}
                      decimalColor={token.colorTextLight4}
                      intColor={token.colorTextLight4}
                      prefix={'$'}
                      unitColor={token.colorTextLight4}
                      value={transformAmount}
                    />
                  </div>
                );
              })}
              <Form.Item
                hidden={currentPoolInfo.type !== YieldPoolType.NOMINATION_POOL}
                name={'pool'}
              >
                <YieldPoolSelector
                  chain={currentPoolInfo.chain}
                  disabled={processState.currentStep !== 0}
                  from={currentFrom}
                  label={t('Select pool')}
                  loading={poolLoading}
                  method={currentPoolInfo.slug}
                  setForceFetchValidator={setForceFetchValidator}
                />
              </Form.Item>

              <Form.Item
                hidden={currentPoolInfo.type !== YieldPoolType.NATIVE_STAKING}
                name={'nominate'}
              >
                <YieldMultiValidatorSelector
                  chain={currentPoolInfo.chain}
                  disabled={processState.currentStep !== 0}
                  from={currentFrom}
                  loading={validatorLoading}
                  setForceFetchValidator={setForceFetchValidator}
                  slug={currentPoolInfo.slug}
                />
              </Form.Item>
            </Form>
          </div>

          <Button
            block
            disabled={submitLoading || isSubmitDisable || !isBalanceReady || !isDotBalanceReady || stepLoading || checkMintLoading}
            icon={
              <Icon
                phosphorIcon={isProcessDone ? CheckCircle : ArrowCircleRight}
                weight={'fill'}
              />
            }
            loading={submitLoading}
            onClick={preCheckAction(onClick, extrinsicType)}
          >
            {processState.currentStep === 0 ? t('Submit') : (!isProcessDone ? t('Continue') : t('Finish'))}
          </Button>

          <Divider className={'staking-modal-divider'} />

          {renderMetaInfo()}

          <Divider className={'staking-modal-divider'} />

          <Typography.Text style={{ color: token.colorTextLight4 }}>
            {t('This content is for informational purposes only and does not constitute a guarantee. All rates are annualized and are subject to change.')}
          </Typography.Text>
        </TransactionContent>
      </div>

      {isWebUI && (
        <div className={'__transaction-process'}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: token.paddingSM, paddingTop: token.paddingXS }}>

            <Typography.Text className={'earning-calculator-message'}>{t(`${currentPoolInfo.name} process:`)}</Typography.Text>

            {!stepLoading && processState.steps.map((item, index) => {
              const isSelected = processState.currentStep === index;

              return (
                <EarningProcessItem
                  index={index}
                  isSelected={isSelected}
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
          </div>
        </div>
      )}

      <StakingProcessModal
        currentStep={processState.currentStep}
        yieldSteps={processState.steps}
      />
    </div>
  );
};

const Wrapper: React.FC<Props> = (props: Props) => {
  const { className } = props;

  return (
    <YieldOutlet
      className={CN(className)}
      path={'/transaction/earn'}
      stores={['yieldPool', 'price', 'chainStore', 'assetRegistry']}
    >
      <Component />
    </YieldOutlet>
  );
};

const Earn = styled(Wrapper)<Props>(({ theme: { token } }: Props) => {
  return {
    '.earning-wrapper': {
      display: 'flex',
      flex: 1
    },

    '.__transaction-block': {
      display: 'flex',
      flexDirection: 'column',
      flex: 1
    },

    '.web-ui-enable &': {
      '.earning-wrapper': {
        paddingTop: 24,
        maxWidth: 784,
        width: '100%',
        marginLeft: 'auto',
        marginRight: 'auto',
        gap: token.size
      },

      '.__transaction-block': {
        display: 'block',
        maxWidth: 384,
        flex: 1
      },

      '.transaction-content': {
        paddingLeft: 0,
        paddingRight: 0
      },

      '.transaction-footer': {
        paddingTop: 4,
        paddingLeft: 0,
        paddingRight: 0,
        marginBottom: 0
      },

      '.meta-info': {
        marginBottom: token.marginSM
      }

    },

    '.__transaction-process': {
      flex: 1
    },

    '.ant-form-item-label > label': {
      color: token.colorTextLight4
    },

    '.amount-prefix': {
      marginBottom: token.marginXXS / 2
    },

    '.staking-modal-divider': {
      backgroundColor: token.colorBgDivider,
      marginTop: token.marginSM,
      marginBottom: token.marginSM
    },

    '.earn-transform-amount, .account-free-balance': {
      paddingBottom: token.paddingSM
    },

    '.ant-loading-icon': {
      display: 'flex',
      justifyContent: 'center'
    }
  };
});

export default Earn;
