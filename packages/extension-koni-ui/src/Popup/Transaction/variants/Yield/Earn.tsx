// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { SubmitJoinNativeStaking, SubmitJoinNominationPool, ValidatorInfo, YieldAssetExpectedEarning, YieldCompoundingPeriod, YieldPoolInfo, YieldPoolType } from '@subwallet/extension-base/background/KoniTypes';
import { AccountJson } from '@subwallet/extension-base/background/types';
import { calculateReward } from '@subwallet/extension-base/koni/api/yield';
import { _getAssetDecimals, _isChainEvmCompatible } from '@subwallet/extension-base/services/chain-service/utils';
import { SWTransactionResponse } from '@subwallet/extension-base/services/transaction-service/types';
import { isSameAddress } from '@subwallet/extension-base/utils';
import { AccountSelector, AmountInput, EarningProcessItem, HiddenInput, MetaInfo, PageWrapper, PoolSelector, StakingProcessModal, YieldMultiValidatorSelector } from '@subwallet/extension-koni-ui/components';
import { DataContext } from '@subwallet/extension-koni-ui/contexts/DataContext';
import { ScreenContext } from '@subwallet/extension-koni-ui/contexts/ScreenContext';
import { useFetchChainState, useGetChainPrefixBySlug, useNotification, useTransactionContext, useWatchTransaction } from '@subwallet/extension-koni-ui/hooks';
import { getOptimalYieldPath } from '@subwallet/extension-koni-ui/messaging';
import { DEFAULT_YIELD_PROCESS, EarningActionType, earningReducer } from '@subwallet/extension-koni-ui/reducer';
import { RootState } from '@subwallet/extension-koni-ui/stores';
import { FormCallbacks, FormFieldData, FormRule, Theme, ThemeProps, YieldParams } from '@subwallet/extension-koni-ui/types';
import { convertFieldToObject, isAccountAll, parseNominations, simpleCheckForm } from '@subwallet/extension-koni-ui/utils';
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
import { FreeBalanceToStake, TransactionContent } from '../../parts';

interface Props extends ThemeProps {
  item: YieldPoolInfo;
}

const formFieldPrefix = 'amount-';

const hiddenFields: Array<keyof YieldParams> = ['chain', 'asset', 'method'];

interface _YieldAssetExpectedEarning extends YieldAssetExpectedEarning {
  symbol: string;
}

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

  const currentStep = processState.currentStep;

  const [form] = Form.useForm<YieldParams>();

  const currentAmount = useWatchTransaction(`${formFieldPrefix}0`, form, defaultData);
  const currentFrom = useWatchTransaction('from', form, defaultData);
  const currentPoolInfo = useMemo(() => poolInfoMap[methodSlug], [methodSlug, poolInfoMap]);

  const chainState = useFetchChainState(currentPoolInfo.chain);
  const chainNetworkPrefix = useGetChainPrefixBySlug(currentPoolInfo.chain);

  const onDone = useCallback((extrinsicHash: string) => {
    const chainType = isEthereumAddress(currentFrom) ? 'ethereum' : 'substrate';

    navigate(`/transaction-done/${chainType}/${currentPoolInfo.chain}/${extrinsicHash}`, { replace: true });
  }, [currentFrom, currentPoolInfo.chain, navigate]);

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

  const onSuccess = useCallback((rs: SWTransactionResponse) => {
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
      onDone(id);
    }
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
              rewardInToken: assetEarningStats.apy * currentAmountNumb,
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
    const assetDecimals = chainAsset[asset].decimals || 0;
    const value = currentAmount ? parseFloat(currentAmount) / (10 ** assetDecimals) : 0;

    return (
      <MetaInfo
        labelColorScheme={'gray'}
        valueColorScheme={'gray'}
      >
        {
          currentPoolInfo?.stats?.assetEarning?.map((item) => {
            if (item.exchangeRate === undefined) {
              return null;
            }

            return (
              <MetaInfo.Number
                decimals={0}
                key={item.slug}
                label={t('You\'ll receive')}
                suffix={chainAsset[item.slug].symbol}
                value={value * item.exchangeRate}
              />
            );
          })
        }

        {
          Object.values(_assetEarnings).map((value) => {
            return (
              <>
                <MetaInfo.Number
                  label={t('Yearly rewards')}
                  suffix={'%'}
                  value={(value.apy || 0) * 100}
                />
                <MetaInfo.Number
                  label={t('Estimated earnings')}
                  suffix={`${value.symbol}/Year`}
                  value={value.rewardInToken || 0}
                />
              </>
            );
          })
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

    if (currentPoolInfo.type === YieldPoolType.NOMINATION_POOL && pool) {
      const selectedPool = getSelectedPool(pool);

      data = {
        amount: currentAmount,
        selectedPool
      } as SubmitJoinNominationPool;
    } else if (currentPoolInfo.type === YieldPoolType.NATIVE_STAKING && pool) {
      const selectedValidators = getSelectedValidators(parseNominations(nominate));

      data = {
        amount: currentAmount,
        selectedValidators
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
              onSuccess(rs);
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
          .then(onSuccess)
          .catch(onError)
          .finally(() => {
            setSubmitLoading(false);
          });
      }, 300);
    }
  }, [currentPoolInfo, form, getSelectedPool, getSelectedValidators, onError, onSuccess, processState]);

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
      setStepLoading(true);

      getOptimalYieldPath({
        amount: currentAmount,
        poolInfo: currentPoolInfo
      })
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
    }
  }, [currentPoolInfo, currentAmount, currentStep]);

  return (
    <div className={'earning-wrapper'}>
      <div className={'__transaction-block'}>
        <TransactionContent>
          <div style={{ display: 'flex', flexDirection: 'column', gap: token.paddingSM, paddingTop: token.paddingXS }}>
            {/* <EarningBtn icon={<Logo className={'earning-calculator-tag'} size={16} network={'polkadot'} />} size={'xs'}> */}
            {/*  {'DOT'} */}
            {/* </EarningBtn> */}

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
                <PoolSelector
                  chain={currentPoolInfo.chain}
                  disabled={processState.currentStep !== 0}
                  from={currentFrom}
                  label={t('Select pool')}
                  loading={poolLoading}
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
            disabled={submitLoading || isSubmitDisable || !isBalanceReady || stepLoading}
            icon={
              <Icon
                phosphorIcon={isProcessDone ? CheckCircle : ArrowCircleRight}
                weight={'fill'}
              />
            }
            loading={submitLoading}
            onClick={onClick}
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
          <Divider style={{ backgroundColor: token.colorBgDivider, marginTop: token.marginSM, marginBottom: token.marginSM }} />

          <Typography.Text style={{ color: token.colorTextLight4 }}>
            {t('This content is for informational purposes only and does not constitute a guarantee. All rates are annualized and are subject to change.')}
          </Typography.Text>
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

  const dataContext = useContext(DataContext);

  return (
    <PageWrapper
      className={CN(className, 'page-wrapper')}
      resolve={dataContext.awaitStores(['yieldPool', 'price', 'chainStore', 'assetRegistry'])}
    >
      <Component />
    </PageWrapper>
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
