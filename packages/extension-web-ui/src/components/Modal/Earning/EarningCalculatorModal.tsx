// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _getAssetDecimals, _isChainEvmCompatible } from '@subwallet/extension-base/services/chain-service/utils';
import { calculateReward } from '@subwallet/extension-base/services/earning-service/utils';
import { YieldAssetExpectedEarning, YieldCompoundingPeriod, YieldPoolInfo } from '@subwallet/extension-base/types';
import { BN_TEN, CREATE_RETURN, DEFAULT_ROUTER_PATH, DEFAULT_YIELD_PARAMS, STAKING_CALCULATOR_MODAL, YIELD_TRANSACTION } from '@subwallet/extension-web-ui/constants';
import { ScreenContext } from '@subwallet/extension-web-ui/contexts/ScreenContext';
import { usePreCheckAction } from '@subwallet/extension-web-ui/hooks';
import { RootState } from '@subwallet/extension-web-ui/stores';
import { FormCallbacks, FormFieldData, Theme, ThemeProps } from '@subwallet/extension-web-ui/types';
import { findNetworkJsonByGenesisHash, getEarnExtrinsicType, getEvmLedgerCanYield, isAccountAll } from '@subwallet/extension-web-ui/utils';
import { Button, Divider, Form, Icon, ModalContext, Typography } from '@subwallet/react-ui';
import BigN from 'bignumber.js';
import { PlusCircle } from 'phosphor-react';
import React, { useCallback, useContext, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import styled, { useTheme } from 'styled-components';
import { useLocalStorage } from 'usehooks-ts';

import { isEthereumAddress } from '@polkadot/util-crypto';

import { EarningCalculatorInfo, EarningTokenList } from '../../Earning';
import { AmountInput, EarningMethodSelector } from '../../Field';
import { BaseModal } from '../BaseModal';

interface Props extends ThemeProps {
  defaultItem: YieldPoolInfo;
}

enum FormFieldName {
  VALUE = 'amount',
  METHOD = 'method'
}

export type TransformAssetEarning = Record<string, YieldAssetExpectedEarning>;
export type TransformAssetEarningMap = {
  dailyEarnings: TransformAssetEarning
  weeklyEarnings: TransformAssetEarning
  monthlyEarnings: TransformAssetEarning
  yearlyEarnings: TransformAssetEarning
};

interface EarningCalculatorFormProps {
  [FormFieldName.VALUE]: string;
  [FormFieldName.METHOD]: string;
}

const modalId = STAKING_CALCULATOR_MODAL;

const Component = (props: Props) => {
  const { className, defaultItem } = props;

  const { t } = useTranslation();
  const navigate = useNavigate();
  const { token } = useTheme() as Theme;
  const { isWebUI } = useContext(ScreenContext);

  const { addExclude, checkActive, inactiveModal, removeExclude } = useContext(ModalContext);

  const isActive = checkActive(modalId);

  const { poolInfo } = useSelector((state: RootState) => state.yieldPool);
  const { currentAccount, isNoAccount } = useSelector((state: RootState) => state.accountState);
  const { assetRegistry } = useSelector((state: RootState) => state.assetRegistry);
  const { chainInfoMap } = useSelector((state: RootState) => state.chainStore);

  const [, setYieldStorage] = useLocalStorage(YIELD_TRANSACTION, DEFAULT_YIELD_PARAMS);
  const [, setReturnStorage] = useLocalStorage(CREATE_RETURN, DEFAULT_ROUTER_PATH);
  const [form] = Form.useForm<EarningCalculatorFormProps>();

  const formDefault: EarningCalculatorFormProps = useMemo(() => {
    return {
      [FormFieldName.VALUE]: '0',
      [FormFieldName.METHOD]: ''
    };
  }, []);

  const currentAmount = Form.useWatch(FormFieldName.VALUE, form);
  const currentMethod = Form.useWatch(FormFieldName.METHOD, form);

  const preCheckAction = usePreCheckAction(currentAccount?.address, false);

  const currentItem = useMemo(() => currentMethod ? poolInfo[currentMethod] : defaultItem, [currentMethod, poolInfo, defaultItem]);

  const currentDecimal = useMemo(() => {
    const asset = assetRegistry[currentItem.inputAssets[0]];

    return asset ? _getAssetDecimals(asset) : 0;
  }, [assetRegistry, currentItem.inputAssets]);

  const transformAssetEarnings: TransformAssetEarningMap = useMemo(() => {
    const dailyEarnings: Record<string, YieldAssetExpectedEarning> = {};
    const weeklyEarnings: Record<string, YieldAssetExpectedEarning> = {};
    const monthlyEarnings: Record<string, YieldAssetExpectedEarning> = {};
    const yearlyEarnings: Record<string, YieldAssetExpectedEarning> = {};

    const amount = new BigN(currentAmount).div(BN_TEN.pow(currentDecimal)).toNumber();

    if (currentItem?.stats?.assetEarning) {
      currentItem?.stats?.assetEarning.forEach((assetEarningStats) => {
        const assetApr = assetEarningStats?.apr || 0;
        const assetApy = assetEarningStats?.apy || 0;
        const apr = assetApr || assetApy;
        const assetSlug = assetEarningStats.slug;

        const _1dEarning = calculateReward(apr, amount, YieldCompoundingPeriod.DAILY, assetApr === 0);
        const _7dEarning = calculateReward(apr, amount, YieldCompoundingPeriod.WEEKLY, assetApr === 0);
        const _monthlyEarning = calculateReward(apr, amount, YieldCompoundingPeriod.MONTHLY, assetApr === 0);
        const _yearlyEarning = calculateReward(apr, amount, YieldCompoundingPeriod.YEARLY, assetApr === 0);

        dailyEarnings[assetSlug] = _1dEarning;
        weeklyEarnings[assetSlug] = _7dEarning;
        monthlyEarnings[assetSlug] = _monthlyEarning;
        yearlyEarnings[assetSlug] = _yearlyEarning;
      });
    }

    return { dailyEarnings, weeklyEarnings, monthlyEarnings, yearlyEarnings };
  }, [currentAmount, currentDecimal, currentItem?.stats?.assetEarning]);

  const methodOptions = useMemo(() => {
    return Object.values(poolInfo).filter((pool) => {
      if (!currentAccount?.address) {
        return true;
      }

      if (isAccountAll(currentAccount.address)) {
        return true;
      }

      const isLedger = !!currentAccount.isHardware;
      const isEvmAddress = isEthereumAddress(currentAccount.address);
      const validGen: string[] = currentAccount.availableGenesisHashes || [];
      const validLedgerNetwork = validGen.map((genesisHash) => findNetworkJsonByGenesisHash(chainInfoMap, genesisHash)?.slug) || [];

      if (isLedger) {
        return isEvmAddress ? getEvmLedgerCanYield(pool.slug) : validLedgerNetwork.includes(pool.chain);
      }

      const chain = chainInfoMap[pool.chain];
      const isEvmChain = _isChainEvmCompatible(chain);

      return isEvmChain === isEvmAddress;
    });
  }, [chainInfoMap, currentAccount, poolInfo]);

  const onCloseModal = useCallback(() => {
    inactiveModal(modalId);
  }, [inactiveModal]);

  const onFieldsChange: FormCallbacks<EarningCalculatorFormProps>['onFieldsChange'] = useCallback((changedFields: FormFieldData[], allFields: FormFieldData[]) => {
    // Empty
  }, []);

  const onSubmit: FormCallbacks<EarningCalculatorFormProps>['onFinish'] = useCallback((values: EarningCalculatorFormProps) => {
    const { amount, method } = values;

    if (isNoAccount) {
      inactiveModal(modalId);
      setReturnStorage('/home/earning/');
      navigate('/welcome');
    } else {
      const callback = () => {
        inactiveModal(modalId);

        const address = currentAccount ? isAccountAll(currentAccount.address) ? '' : currentAccount.address : '';

        setYieldStorage({
          ...DEFAULT_YIELD_PARAMS,
          method: currentItem.slug,
          from: address,
          chain: currentItem.chain,
          asset: currentItem.inputAssets[0],
          'amount-0': amount
        });

        navigate('/transaction/earn');
      };

      preCheckAction(callback, getEarnExtrinsicType(method))();
    }
  }, [isNoAccount, inactiveModal, setReturnStorage, navigate, preCheckAction, currentAccount, setYieldStorage, currentItem.slug, currentItem.chain, currentItem.inputAssets]);

  useEffect(() => {
    addExclude(modalId);

    return () => {
      removeExclude(modalId);
    };
  }, [addExclude, removeExclude]);

  useEffect(() => {
    form.setFieldValue(FormFieldName.METHOD, defaultItem.slug);
  }, [form, defaultItem, isActive]);

  useEffect(() => {
    if (!isActive) {
      form.resetFields([FormFieldName.VALUE]);
    }
  }, [form, isActive]);

  return (
    <BaseModal
      className={className}
      closable
      id={modalId}
      maskClosable
      onCancel={onCloseModal}
      title={t('Earning calculator')}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: token.paddingSM, paddingTop: token.paddingXS }}>
        <EarningTokenList />

        <Typography.Text className={'earning-calculator-message'}>{t('Enter the amount of tokens to estimate rewards')}</Typography.Text>

        <Form
          className={'form-container form-space-sm earning-calculator-form-container'}
          form={form}
          initialValues={formDefault}
          onFieldsChange={onFieldsChange}
          onFinish={onSubmit}
        >
          <Form.Item
            colon={false}
            label={'Select protocol'}
            name={FormFieldName.METHOD}
          >
            <EarningMethodSelector
              items={methodOptions}
              showChainInSelected
            />
          </Form.Item>

          <Form.Item
            colon={false}
            label={t('Enter amount')}
            name={FormFieldName.VALUE}
            rules={[
              () => ({
                validator: (_, value: string) => {
                  const val = new BigN(value);

                  if (val.lte(0)) {
                    return Promise.reject(new Error(t('Amount must be greater than 0')));
                  }

                  return Promise.resolve();
                }
              })
            ]}
            statusHelpAsTooltip={isWebUI}
          >
            <AmountInput
              decimals={currentDecimal}
              maxValue=''
              showMaxButton={false}
            />
          </Form.Item>
        </Form>
      </div>
      <Divider style={{ backgroundColor: token.colorBgDivider, marginTop: token.marginSM, marginBottom: token.marginSM }} />

      <EarningCalculatorInfo
        earningAssets={transformAssetEarnings.dailyEarnings}
        label={t('Daily earnings')}
      />
      <EarningCalculatorInfo
        earningAssets={transformAssetEarnings.weeklyEarnings}
        label={t('Weekly earnings')}
      />
      <EarningCalculatorInfo
        earningAssets={transformAssetEarnings.monthlyEarnings}
        label={t('Monthly earnings')}
      />
      <EarningCalculatorInfo
        earningAssets={transformAssetEarnings.yearlyEarnings}
        label={t('Yearly earnings')}
      />

      <Typography.Text style={{ color: token.colorTextLight4 }}>
        {t('The provided information is for informational purposes only and should not be considered as guarantee. All rates are calculated on an annual basis and are subject to change.')}
      </Typography.Text>

      <Button
        block
        className='submit-button'
        icon={(
          <Icon
            phosphorIcon={PlusCircle}
            weight='fill'
          />
        )}
        onClick={form.submit}
      >
        {t('Earn now')}
      </Button>
    </BaseModal>
  );
};

const EarningCalculatorModal = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {
    '.earning-calculator-tag': {
      paddingRight: token.paddingXXS,

      '.ant-image-img': {
        marginBottom: '2px'
      }
    },

    '.earning-calculator-message': {
      color: token.colorTextLight4
    },

    '.earning-calculator-form-container': {
      '.ant-form-item-label': {
        display: 'flex',
        alignItems: 'center'
      },

      '.ant-form-item-label > label': {
        color: token.colorTextLight4
      },

      '.ant-form-item-margin-offset': {
        marginBottom: '0 !important'
      }
    },

    '.submit-button': {
      marginTop: token.paddingXL
    },

    '@media (min-width: 992px)': {
      '.earning-calculator-form-container': {
        '.ant-form-item-control': {
          '& > div:nth-child(2)': {
            display: 'none !important'
          }
        }
      }
    },

    '@media (max-width: 991px)': {
      '.earning-calculator-form-container': {
        '.ant-form-item-label, .ant-form-item-control': {
          flexBasis: '100%'
        },

        '.ant-form-item-label': {
          paddingBottom: token.paddingXS
        },

        '.ant-form-item-explain': {
          paddingBottom: 0
        }
      }
    }
  };
});

export default EarningCalculatorModal;
