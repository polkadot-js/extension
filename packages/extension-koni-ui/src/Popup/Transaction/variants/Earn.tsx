// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React, {useCallback, useContext, useEffect, useMemo, useState} from 'react';
import {FormCallbacks, FormFieldData, Theme, ThemeProps} from '@subwallet/extension-koni-ui/types';
import {useTranslation} from 'react-i18next';
import {Button, Divider, Form, Icon, Logo, Typography} from '@subwallet/react-ui';
import styled, {useTheme} from 'styled-components';
import {useSelector} from 'react-redux';
import {RootState} from '@subwallet/extension-koni-ui/stores';
import {
  AccountSelector,
  AmountInput,
  MetaInfo, MultiValidatorSelector,
  PageWrapper,
  PoolSelector
} from '@subwallet/extension-koni-ui/components';
import BigN from 'bignumber.js';
import {ArrowCircleRight, CheckCircle} from 'phosphor-react';
import {
  YieldAssetExpectedEarning,
  YieldCompoundingPeriod,
  YieldPoolInfo, YieldPoolType,
  YieldStepDetail, YieldTokenBaseInfo
} from '@subwallet/extension-base/background/KoniTypes';
import {useFetchChainState, useGetChainPrefixBySlug} from '@subwallet/extension-koni-ui/hooks';
import {_getAssetDecimals, _isChainEvmCompatible} from '@subwallet/extension-base/services/chain-service/utils';
import {_ChainInfo} from '@subwallet/chain-list/types';
import {AccountJson} from '@subwallet/extension-base/background/types';
import {isEthereumAddress} from '@polkadot/util-crypto';
import {getOptimalYieldPath} from '@subwallet/extension-koni-ui/messaging';
import useGetNativeTokenBasicInfo from '../../../hooks/common/useGetNativeTokenBasicInfo';
import FreeBalanceToStake from '@subwallet/extension-koni-ui/Popup/Transaction/parts/FreeBalanceToStake';
import {useParams} from 'react-router';
import {TransactionContent} from "@subwallet/extension-koni-ui/Popup/Transaction/parts";
import {DataContext} from "@subwallet/extension-koni-ui/contexts/DataContext";
import CN from "classnames";
import EarningProcessItem from "@subwallet/extension-koni-ui/components/EarningProcessItem";
import {calculateReward} from "@subwallet/extension-base/koni/api/yield";
import {ALL_KEY} from "@subwallet/extension-koni-ui/constants";
import {
  fetchEarningChainValidators
} from "@subwallet/extension-koni-ui/Popup/Transaction/helper/earning/earningHandler";
import {convertFieldToObject, simpleCheckForm} from "@subwallet/extension-koni-ui/utils";

interface Props extends ThemeProps {
  item: YieldPoolInfo;

}

enum FormFieldName {
  METHOD = 'method',
  FROM = 'from',
  NOMINATE = 'nominate',
  POOL = 'pool',
}

const formFieldPrefix = 'amount-';

interface StakingFormProps extends Record<`amount-${number}`, string> {
  [FormFieldName.METHOD]: string;
  [FormFieldName.FROM]: string;
  [FormFieldName.NOMINATE]: string;
  [FormFieldName.POOL]: string;
}

const Component = () => {
  const { t } = useTranslation();
  const { token } = useTheme() as Theme;
  const { slug: _methodSlug } = useParams();
  const methodSlug = _methodSlug || '';
  const { poolInfo } = useSelector((state: RootState) => state.yieldPool);
  const chainInfoMap = useSelector((state: RootState) => state.chainStore.chainInfoMap);
  const priceMap = useSelector((state: RootState) => state.price.priceMap);
  const chainAsset = useSelector((state: RootState) => state.assetRegistry.assetRegistry);
  const { isAllAccount, currentAccount } = useSelector((state: RootState) => state.accountState);
  const [yieldSteps, setYieldSteps] = useState<YieldStepDetail[]>();
  const [totalFee, setTotalFee] = useState<YieldTokenBaseInfo[]>();
  const [isBalanceReady, setIsBalanceReady] = useState(true);
  const [step, setStep] = useState<number>(1);
  const [forceFetchValidator, setForceFetchValidator] = useState(false);
  const [poolLoading, setPoolLoading] = useState(false);
  const [validatorLoading, setValidatorLoading] = useState(false);
  const [isDisable, setIsDisable] = useState(true);

  const defaultInfo = useMemo(() => poolInfo[methodSlug], [poolInfo, methodSlug]);
  const [form] = Form.useForm<StakingFormProps>();

  useEffect(() => {
    form.setFieldValue(FormFieldName.METHOD, defaultInfo.slug);
  }, [form, defaultInfo]);

  const currentAmount = Form.useWatch(`${formFieldPrefix}0`, form);
  const currentFrom = Form.useWatch('from', form);
  const currentMethod = Form.useWatch(FormFieldName.METHOD, form);
  const currentInfo = useMemo(() => poolInfo[currentMethod || methodSlug], [currentMethod, methodSlug]);
  const chainState = useFetchChainState(currentInfo.chain);
  const { decimals, symbol } = useGetNativeTokenBasicInfo(currentInfo.chain);
  const chainNetworkPrefix = useGetChainPrefixBySlug(currentInfo.chain);

  const formDefault: StakingFormProps = useMemo(() => {
    return {
      [FormFieldName.METHOD]: defaultInfo.slug,
      [FormFieldName.FROM]: !isAllAccount ? currentAccount?.address || '' : '',
      [FormFieldName.POOL]: '',
      [FormFieldName.NOMINATE]: '',
    };
  }, [defaultInfo, isAllAccount]);


  useEffect(() => {
    let unmount = false;

    // fetch validators when change chain
    // _stakingType is predefined form start
    if ((!!currentInfo.chain && !!currentFrom && chainState?.active) || forceFetchValidator) {
      fetchEarningChainValidators(currentInfo.chain, currentInfo.type || ALL_KEY, unmount, setPoolLoading, setValidatorLoading, setForceFetchValidator);
    }

    return () => {
      unmount = true;
    };
  }, [currentInfo, currentFrom, chainState?.active, forceFetchValidator]);

  useEffect(() => {
    getOptimalYieldPath({
      amount: currentAmount,
      poolInfo: currentInfo
    })
      .then((res) => {
        setYieldSteps(res?.steps);
        setTotalFee(res?.totalFee)
      })
      .catch(console.error);
  }, [currentInfo, currentAmount]);

  const _assetEarnings: Record<string, YieldAssetExpectedEarning> = useMemo(() => {
    let yearlyEarnings: Record<string, YieldAssetExpectedEarning> = {};
    const currentAmountNumb = currentAmount ? Number(currentAmount) / (10 ** decimals) : 0;

    if (currentInfo?.stats?.assetEarning) {
      currentInfo?.stats?.assetEarning.forEach((assetEarningStats) => {
        const assetApr = assetEarningStats?.apr || 0;
        const assetSlug = assetEarningStats.slug;

        yearlyEarnings[assetSlug] = calculateReward(assetApr, currentAmountNumb, YieldCompoundingPeriod.YEARLY);
      });
    }

    return yearlyEarnings;
  }, [currentAmount]);

  const estimatedFee = useMemo(() => {
    let _totalFee = 0;
    if (totalFee) {
      totalFee.forEach(fee => {
        const asset = chainAsset[fee.slug];
        const feeDecimals = _getAssetDecimals(asset);
        const priceValue = asset.priceId ? priceMap[asset.priceId] : 0;
        const feeNumb = priceValue * (fee.amount ? (Number(fee.amount) / (10 ** feeDecimals)) : 0);
        _totalFee += feeNumb;
      })
    }

    return _totalFee;
  }, [totalFee]);

  const accountFilterFunc = (chainInfoMap: Record<string, _ChainInfo>): ((account: AccountJson) => boolean) => {
    return (account: AccountJson) => {
      const chain = chainInfoMap[currentInfo.chain];
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
    if (currentInfo.type === YieldPoolType.NOMINATION_POOL) {
      checkEmpty.nominate = true;
    } else if (currentInfo.type === YieldPoolType.NATIVE_STAKING) {
      checkEmpty.pool = true;
    }
    setIsDisable(error || Object.values(checkEmpty).some((value) => !value));
  }, []);

  const renderMetaInfo = useCallback(() => {
    return (
      <MetaInfo labelColorScheme={'gray'} valueColorScheme={'gray'}>
        <MetaInfo.Number label={t('Yearly rewards')} value={(Object.values(_assetEarnings)[0].apy || 0) * 100} suffix={'%'} />
        <MetaInfo.Number label={t('Estimated earnings')} value={Object.values(_assetEarnings)[0].rewardInToken || 0} suffix={`${symbol}/Year`} />
        <MetaInfo.Number label={t('Estimated fee')} value={estimatedFee} decimals={0} prefix={'$'} />
      </MetaInfo>
    );
  }, [_assetEarnings, symbol, estimatedFee]);

  return (
      <div className={'earning-wrapper'}>
        <div className={'__transaction-block'}>
          <TransactionContent>
            <div style={{ display: 'flex', flexDirection: 'column', gap: token.paddingSM, paddingTop: token.paddingXS }}>
              {/*<EarningBtn icon={<Logo className={'earning-calculator-tag'} size={16} network={'polkadot'} />} size={'xs'}>*/}
              {/*  {'DOT'}*/}
              {/*</EarningBtn>*/}

              <Form
                className={'form-container form-space-sm earning-calculator-form-container'}
                form={form}
                initialValues={formDefault}
                onFieldsChange={onFieldsChange}
              >
                {/*<Form.Item*/}
                {/*  name={FormFieldName.METHOD}*/}
                {/*  label={t('Select method')}*/}
                {/*  colon={false}*/}
                {/*>*/}
                {/*  <EarningMethodSelector items={Object.values(poolInfo)} />*/}
                {/*</Form.Item>*/}

                {/*<Divider className={'staking-modal-divider'} />*/}

                {yieldSteps && (
                  <div style={{ display: 'flex', alignItems: 'center', paddingBottom: token.paddingSM }}>
                    <Typography.Text
                      style={{ fontWeight: '600' }}
                      size={'lg'}
                    >
                      {t('Step 0{{step}}: {{label}}', {
                        replace: { step, label: yieldSteps[step - 1].name}
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

                {currentInfo.inputAssets.map((asset, index) => {
                  const name = formFieldPrefix + String(index);
                  return (
                    <div key={name} style={{ display: 'flex', flexDirection: 'column', gap: token.paddingSM }}>
                      <FreeBalanceToStake
                        address={currentFrom}
                        chain={currentInfo.chain}
                        tokenSlug={asset}
                        className={'account-free-balance'}
                        label={t('Available to stake:')}
                        onBalanceReady={setIsBalanceReady}
                      />

                      <Form.Item
                        colon={false}
                        name={name}
                        rules={[
                          { required: true, message: t('Amount is required') },
                          () => ({
                            validator: (_, value: string) => {
                              const val = new BigN(value);

                              if (currentInfo.type === YieldPoolType.NOMINATION_POOL) {
                                if (val.lte(0)) {
                                  return Promise.reject(new Error(t('Amount must be greater than 0')));
                                }
                              } else {

                              }

                              return Promise.resolve();
                            }
                          })
                        ]}
                        statusHelpAsTooltip={true}
                      >
                        <AmountInput
                          decimals={decimals}
                          maxValue={'1'}
                          prefix={<Logo size={20} token={asset.split('-')[2].toLowerCase()} className={'amount-prefix'} />}
                          showMaxButton={true}
                          tooltip={t('Amount')}
                        />
                      </Form.Item>
                    </div>
                  );
                })}

                <Form.Item
                  hidden={currentInfo.type !== YieldPoolType.NOMINATION_POOL}
                  name={FormFieldName.POOL}
                >
                  <PoolSelector
                    chain={currentInfo.chain}
                    from={currentFrom}
                    label={t('Select pool')}
                    loading={poolLoading}
                    setForceFetchValidator={setForceFetchValidator}
                  />
                </Form.Item>

                <Form.Item
                  hidden={currentInfo.type !== YieldPoolType.NATIVE_STAKING}
                  name={FormFieldName.NOMINATE}
                >
                  <MultiValidatorSelector
                    chain={currentInfo.chain}
                    from={currentFrom}
                    loading={validatorLoading}
                    setForceFetchValidator={setForceFetchValidator}
                  />
                </Form.Item>
              </Form>
            </div>

            <Button
              disabled={isDisable || !isBalanceReady}
              block
              onClick={() =>  {
                if (yieldSteps && step === yieldSteps.length) {
                  // onCloseModal();
                } else {
                  setStep(step + 1);
                }
              }}
              icon={
                <Icon
                  phosphorIcon={yieldSteps && step === yieldSteps.length ? CheckCircle : ArrowCircleRight}
                  weight={'fill'}
                />
              }>
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

        <div className={'__transaction-process'}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: token.paddingSM, paddingTop: token.paddingXS }}>

            <Typography.Text className={'earning-calculator-message'}>{t('Staking process:')}</Typography.Text>

            {yieldSteps && yieldSteps.map((item, index) => {
              const isSelected = step === index + 1;
              return <EarningProcessItem isSelected={isSelected} index={index} stepName={item.name} />
            })}
          </div>
          <Divider style={{ backgroundColor: token.colorBgDivider, marginTop: token.marginSM, marginBottom: token.marginSM }} />

          <Typography.Text style={{ color: token.colorTextLight4 }}>
            {t('This content is for informational purposes only and does not constitute a guarantee. All rates are annualized and are subject to change.')}
          </Typography.Text>
        </div>
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
      flex: 1,
      paddingTop: 24,
      maxWidth: 784,
      width: '100%',
      marginLeft: 'auto',
      marginRight: 'auto',
      gap: token.size,
    },

    '.__transaction-block': {
      display: 'block',
      maxWidth: 384,
      flex: 1
    },
    '.__transaction-process': {
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
  }
});

export default Earn;
