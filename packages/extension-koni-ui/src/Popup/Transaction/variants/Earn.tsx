// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _ChainInfo } from '@subwallet/chain-list/types';
import { NominationPoolInfo, SubmitJoinNativeStaking, ValidatorInfo, YieldAssetExpectedEarning, YieldCompoundingPeriod, YieldPoolInfo, YieldPoolType, YieldStepDetail, YieldTokenBaseInfo } from '@subwallet/extension-base/background/KoniTypes';
import { AccountJson } from '@subwallet/extension-base/background/types';
import { calculateReward } from '@subwallet/extension-base/koni/api/yield';
import { _getAssetDecimals, _isChainEvmCompatible } from '@subwallet/extension-base/services/chain-service/utils';
import { SWTransactionResponse } from '@subwallet/extension-base/services/transaction-service/types';
import { isSameAddress } from '@subwallet/extension-base/utils';
import { AccountSelector, AmountInput, MetaInfo, MultiValidatorSelector, PageWrapper, PoolSelector } from '@subwallet/extension-koni-ui/components';
import EarningProcessItem from '@subwallet/extension-koni-ui/components/EarningProcessItem';
import { ALL_KEY } from '@subwallet/extension-koni-ui/constants';
import { DataContext } from '@subwallet/extension-koni-ui/contexts/DataContext';
import { ScreenContext } from '@subwallet/extension-koni-ui/contexts/ScreenContext';
import { useFetchChainState, useGetChainPrefixBySlug, useHandleSubmitTransaction } from '@subwallet/extension-koni-ui/hooks';
import { getOptimalYieldPath, submitJoinYieldPool, submitPoolBonding } from '@subwallet/extension-koni-ui/messaging';
import StakingProcessModal from '@subwallet/extension-koni-ui/Popup/Home/Earning/StakingProcessModal';
import { fetchEarningChainValidators } from '@subwallet/extension-koni-ui/Popup/Transaction/helper/earning/earningHandler';
import { TransactionContent } from '@subwallet/extension-koni-ui/Popup/Transaction/parts';
import FreeBalanceToStake from '@subwallet/extension-koni-ui/Popup/Transaction/parts/FreeBalanceToStake';
import { TransactionContext } from '@subwallet/extension-koni-ui/Popup/Transaction/Transaction';
import { RootState } from '@subwallet/extension-koni-ui/stores';
import { FormCallbacks, FormFieldData, Theme, ThemeProps } from '@subwallet/extension-koni-ui/types';
import { convertFieldToObject, parseNominations, simpleCheckForm } from '@subwallet/extension-koni-ui/utils';
import { Button, Divider, Form, Icon, Logo, Number, Typography } from '@subwallet/react-ui';
import CN from 'classnames';
import { ArrowCircleRight, CheckCircle } from 'phosphor-react';
import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { useParams } from 'react-router';
import styled, { useTheme } from 'styled-components';

import { isEthereumAddress } from '@polkadot/util-crypto';

import useGetNativeTokenBasicInfo from '../../../hooks/common/useGetNativeTokenBasicInfo';

interface Props extends ThemeProps {
  item: YieldPoolInfo;
}

enum FormFieldName {
  FROM = 'from',
  NOMINATE = 'nominate',
  POOL = 'pool',
}

const formFieldPrefix = 'amount-';

interface StakingFormProps extends Record<`amount-${number}`, string> {
  [FormFieldName.FROM]: string;
  [FormFieldName.NOMINATE]: string;
  [FormFieldName.POOL]: string;
}

const Component = () => {
  const { t } = useTranslation();
  const { token } = useTheme() as Theme;
  const { slug: _methodSlug } = useParams();

  const { isWebUI } = useContext(ScreenContext);
  const methodSlug = useMemo(() => {
    return _methodSlug || '';
  }, [_methodSlug]);

  const poolInfoMap = useSelector((state: RootState) => state.yieldPool.poolInfo);
  const chainInfoMap = useSelector((state: RootState) => state.chainStore.chainInfoMap);
  const priceMap = useSelector((state: RootState) => state.price.priceMap);
  const chainAsset = useSelector((state: RootState) => state.assetRegistry.assetRegistry);
  const { setShowRightBtn } = useContext(TransactionContext);
  const { currentAccount, isAllAccount } = useSelector((state: RootState) => state.accountState);
  const { nominationPoolInfoMap, validatorInfoMap } = useSelector((state: RootState) => state.bonding);

  const [yieldSteps, setYieldSteps] = useState<YieldStepDetail[]>();
  const [totalFee, setTotalFee] = useState<YieldTokenBaseInfo[]>();
  const [isBalanceReady, setIsBalanceReady] = useState(true);
  const [step, setStep] = useState<number>(1);

  const [forceFetchValidator, setForceFetchValidator] = useState(false);
  const [poolLoading, setPoolLoading] = useState(false);
  const [validatorLoading, setValidatorLoading] = useState(false);

  const [isSubmitDisable, setIsSubmitDisable] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);

  const onDone = useCallback((extrinsicHash: string) => {
    console.log('extrinsicHash', extrinsicHash);
  }, []);

  const { onError, onSuccess } = useHandleSubmitTransaction(onDone);

  // TODO: transaction interface
  // TODO: process manager
  // TODO: listening to transaction progress
  const [form] = Form.useForm<StakingFormProps>();

  const currentAmount = Form.useWatch(`${formFieldPrefix}0`, form);
  const currentFrom = Form.useWatch(FormFieldName.FROM, form);
  const currentPoolInfo = useMemo(() => poolInfoMap[methodSlug], [methodSlug, poolInfoMap]);

  const chainState = useFetchChainState(currentPoolInfo.chain);
  const { decimals, symbol } = useGetNativeTokenBasicInfo(currentPoolInfo.chain);
  const chainNetworkPrefix = useGetChainPrefixBySlug(currentPoolInfo.chain);

  const formDefault: StakingFormProps = useMemo(() => {
    return {
      [FormFieldName.FROM]: !isAllAccount ? currentAccount?.address || '' : '',
      [FormFieldName.POOL]: '',
      [FormFieldName.NOMINATE]: ''
    };
  }, [currentAccount?.address, isAllAccount]);

  useEffect(() => {
    setShowRightBtn(true);
  }, [setShowRightBtn]);

  useEffect(() => {
    let unmount = false;

    // fetch validators when change chain
    // _stakingType is predefined form start
    if ((!!currentPoolInfo.chain && !!currentFrom && chainState?.active) || forceFetchValidator) {
      fetchEarningChainValidators(currentPoolInfo.chain, currentPoolInfo.type || ALL_KEY, unmount, setPoolLoading, setValidatorLoading, setForceFetchValidator);
    }

    return () => {
      unmount = true;
    };
  }, [currentPoolInfo, currentFrom, chainState?.active, forceFetchValidator]);

  useEffect(() => {
    getOptimalYieldPath({
      amount: currentAmount,
      poolInfo: currentPoolInfo
    })
      .then((res) => {
        setYieldSteps(res?.steps);
        setTotalFee(res?.totalFee);
      })
      .catch(console.error);
  }, [currentPoolInfo, currentAmount]);

  const _assetEarnings: Record<string, YieldAssetExpectedEarning> = useMemo(() => {
    const yearlyEarnings: Record<string, YieldAssetExpectedEarning> = {};
    const currentAmountNumb = currentAmount ? parseFloat(currentAmount) / (10 ** decimals) : 0;

    if (currentPoolInfo?.stats?.assetEarning) {
      currentPoolInfo?.stats?.assetEarning.forEach((assetEarningStats) => {
        const assetApr = assetEarningStats?.apr || 0;
        const assetSlug = assetEarningStats.slug;

        yearlyEarnings[assetSlug] = calculateReward(assetApr, currentAmountNumb, YieldCompoundingPeriod.YEARLY);
      });
    }

    return yearlyEarnings;
  }, [currentAmount, currentPoolInfo?.stats?.assetEarning, decimals]);

  const estimatedFee = useMemo(() => {
    let _totalFee = 0;

    if (totalFee) {
      totalFee.forEach((fee) => {
        const asset = chainAsset[fee.slug];
        const feeDecimals = _getAssetDecimals(asset);
        const priceValue = asset.priceId ? priceMap[asset.priceId] : 0;
        const feeNumb = priceValue * (fee.amount ? (parseFloat(fee.amount) / (10 ** feeDecimals)) : 0);

        _totalFee += feeNumb;
      });
    }

    return _totalFee;
  }, [chainAsset, priceMap, totalFee]);

  const accountFilterFunc = (chainInfoMap: Record<string, _ChainInfo>): ((account: AccountJson) => boolean) => {
    return (account: AccountJson) => {
      const chain = chainInfoMap[currentPoolInfo.chain];
      const isEvmChain = _isChainEvmCompatible(chain);
      const isEvmAddress = isEthereumAddress(account.address);

      return isEvmChain === isEvmAddress;
    };
  };

  const onFieldsChange: FormCallbacks<StakingFormProps>['onFieldsChange'] = useCallback((changedFields: FormFieldData[], allFields: FormFieldData[]) => {
    const { error } = simpleCheckForm(allFields);

    const allMap = convertFieldToObject<StakingFormProps>(allFields);
    // const changesMap = convertFieldToObject<StakingFormProps>(changedFields);
    const checkEmpty: Record<string, boolean> = {};

    for (const [key, value] of Object.entries(allMap)) {
      checkEmpty[key] = !!value;
    }

    if (currentPoolInfo.type === YieldPoolType.NOMINATION_POOL) {
      checkEmpty.nominate = true;
    } else if (currentPoolInfo.type === YieldPoolType.NATIVE_STAKING) {
      checkEmpty.pool = true;
    }

    setIsSubmitDisable(error || Object.values(checkEmpty).some((value) => !value));
  }, [currentPoolInfo.type]);

  const renderMetaInfo = useCallback(() => {
    return (
      <MetaInfo
        labelColorScheme={'gray'}
        valueColorScheme={'gray'}
      >
        <MetaInfo.Number
          label={t('Yearly rewards')}
          suffix={'%'}
          value={(Object.values(_assetEarnings)[0].apy || 0) * 100}
        />
        <MetaInfo.Number
          label={t('Estimated earnings')}
          suffix={`${symbol}/Year`}
          value={Object.values(_assetEarnings)[0].rewardInToken || 0}
        />
        <MetaInfo.Number
          decimals={0}
          label={t('Estimated fee')}
          prefix={'$'}
          value={estimatedFee}
        />
      </MetaInfo>
    );
  }, [t, _assetEarnings, symbol, estimatedFee]);

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

  const onClick = useCallback(() => {
    setSubmitLoading(true);

    const { from, nominate, pool } = form.getFieldsValue();

    let submitPromise: Promise<SWTransactionResponse>;

    if (currentPoolInfo.type === YieldPoolType.NOMINATION_POOL && pool) {
      const selectedPool = getSelectedPool(pool);

      submitPromise = submitPoolBonding({
        amount: currentAmount,
        chain: currentPoolInfo.chain,
        selectedPool: selectedPool as NominationPoolInfo,
        address: from
      });
    } else {
      const selectedValidators = getSelectedValidators(parseNominations(nominate));

      submitPromise = submitJoinYieldPool({
        address: from,
        yieldPoolInfo: currentPoolInfo,
        data: {
          amount: currentAmount,
          selectedValidators
        } as SubmitJoinNativeStaking
      });
    }

    if (!(yieldSteps && step === yieldSteps.length)) {
      setStep(step + 1);
    }

    setTimeout(() => {
      submitPromise
        .then(onSuccess)
        .catch(onError)
        .finally(() => {
          setSubmitLoading(false);
        });
    }, 300);
  }, [currentAmount, currentPoolInfo, form, getSelectedPool, getSelectedValidators, onError, onSuccess, step, yieldSteps]);

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
              {/* <Form.Item */}
              {/*  name={FormFieldName.METHOD} */}
              {/*  label={t('Select method')} */}
              {/*  colon={false} */}
              {/* > */}
              {/*  <EarningMethodSelector items={Object.values(poolInfo)} /> */}
              {/* </Form.Item> */}

              {/* <Divider className={'staking-modal-divider'} /> */}

              {yieldSteps && (
                <div style={{ display: 'flex', alignItems: 'center', paddingBottom: token.paddingSM }}>
                  <Typography.Text
                    size={'lg'}
                    style={{ fontWeight: '600' }}
                  >
                    {t('Step {{step}}: {{label}}', {
                      replace: { step, label: yieldSteps[step - 1].name }
                    })}
                  </Typography.Text>
                </div>
              )}

              <Form.Item
                // className={CN({ hidden: !isAllAccount })}
                name={'from'}
              >
                <AccountSelector
                  addressPrefix={chainNetworkPrefix}
                  disabled={!isAllAccount}
                  filter={accountFilterFunc(chainInfoMap)}
                />
              </Form.Item>

              {currentPoolInfo.inputAssets.map((asset, index) => {
                const name = formFieldPrefix + String(index);
                const _asset = chainAsset[asset];
                const assetDecimals = _getAssetDecimals(_asset);
                const priceValue = _asset.priceId ? priceMap[_asset.priceId] : 0;
                const transformAmount = currentAmount ? (parseFloat(currentAmount) / (10 ** assetDecimals)) * priceValue : 0;

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
                      rules={[{ required: true, message: t('Amount is required') }]}
                      statusHelpAsTooltip={true}
                    >
                      <AmountInput
                        decimals={decimals}
                        maxValue={'1'}
                        prefix={<Logo
                          className={'amount-prefix'}
                          size={20}
                          token={asset.split('-')[2].toLowerCase()}
                        />}
                        showMaxButton={true}
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
                name={FormFieldName.POOL}
              >
                <PoolSelector
                  chain={currentPoolInfo.chain}
                  from={currentFrom}
                  label={t('Select pool')}
                  loading={poolLoading}
                  setForceFetchValidator={setForceFetchValidator}
                />
              </Form.Item>

              <Form.Item
                hidden={currentPoolInfo.type !== YieldPoolType.NATIVE_STAKING}
                name={FormFieldName.NOMINATE}
              >
                <MultiValidatorSelector
                  chain={currentPoolInfo.chain}
                  from={currentFrom}
                  loading={validatorLoading}
                  setForceFetchValidator={setForceFetchValidator}
                />
              </Form.Item>
            </Form>
          </div>

          <Button
            block
            disabled={submitLoading || isSubmitDisable || !isBalanceReady}
            icon={
              <Icon
                phosphorIcon={yieldSteps && step === yieldSteps.length ? CheckCircle : ArrowCircleRight}
                weight={'fill'}
              />
            }
            onClick={onClick}
          >
            {yieldSteps && step === yieldSteps.length ? t('Finish') : t('Submit')}
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

            <Typography.Text className={'earning-calculator-message'}>{t('Staking process:')}</Typography.Text>

            {yieldSteps && yieldSteps.map((item, index) => {
              const isSelected = step === index + 1;

              return (
                <EarningProcessItem
                  index={index}
                  isSelected={isSelected}
                  key={index}
                  stepName={item.name}
                />
              );
            })}
          </div>
          <Divider style={{ backgroundColor: token.colorBgDivider, marginTop: token.marginSM, marginBottom: token.marginSM }} />

          <Typography.Text style={{ color: token.colorTextLight4 }}>
            {t('This content is for informational purposes only and does not constitute a guarantee. All rates are annualized and are subject to change.')}
          </Typography.Text>
        </div>
      )}

      {<StakingProcessModal
        currentStep={step}
        yieldSteps={yieldSteps}
      />}
    </div>
  );
};

const Wrapper: React.FC<Props> = (props: Props) => {
  const { className } = props;

  const dataContext = useContext(DataContext);

  return (
    <PageWrapper
      className={CN(className, 'page-wrapper')}
      resolve={dataContext.awaitStores(['yieldPool', 'price'])}
    >
      <Component />
    </PageWrapper>
  );
};

const Earn = styled(Wrapper)<Props>(({ theme: { token } }: Props) => {
  return {
    '.earning-calculator-tag': {
      paddingRight: token.paddingXXS,

      '.ant-image-img': {
        marginBottom: '2px'
      }
    },

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
    }
  };
});

export default Earn;
