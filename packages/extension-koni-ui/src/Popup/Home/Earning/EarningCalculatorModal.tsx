// [object Object]
// SPDX-License-Identifier: Apache-2.0

import { YieldAssetExpectedEarning, YieldCompoundingPeriod, YieldPoolInfo } from '@subwallet/extension-base/background/KoniTypes';
import { calculateReward } from '@subwallet/extension-base/koni/api/yield';
import { AmountInput } from '@subwallet/extension-koni-ui/components';
import EarningBtn from '@subwallet/extension-koni-ui/components/EarningBtn';
import { EarningMethodSelector } from '@subwallet/extension-koni-ui/components/Field/EarningMethodSelector';
import { BaseModal } from '@subwallet/extension-koni-ui/components/Modal/BaseModal';
import EarningCalculatorInfo from '@subwallet/extension-koni-ui/components/StakingCalculatorInfo';
import { RootState } from '@subwallet/extension-koni-ui/stores';
import { FormCallbacks, FormFieldData, Theme, ThemeProps } from '@subwallet/extension-koni-ui/types';
import { Button, Divider, Form, Icon, ModalContext, Typography } from '@subwallet/react-ui';
import BigN from 'bignumber.js';
import { PlusCircle } from 'phosphor-react';
import React, { useCallback, useContext, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import styled, { useTheme } from 'styled-components';

interface Props extends ThemeProps {
  item: YieldPoolInfo;
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

export const STAKING_CALCULATOR_MODAL_ID = 'staking-calculator-modal-id';

const Component = ({ className, item }: Props) => {
  const { t } = useTranslation();
  const { inactiveModal } = useContext(ModalContext);
  const { token } = useTheme() as Theme;
  const { poolInfo } = useSelector((state: RootState) => state.yieldPool);
  const [form] = Form.useForm<EarningCalculatorFormProps>();
  const formDefault: EarningCalculatorFormProps = useMemo(() => {
    return {
      [FormFieldName.VALUE]: '0',
      [FormFieldName.METHOD]: ''
    };
  }, []);

  useEffect(() => {
    form.setFieldValue(FormFieldName.METHOD, item.slug);
  }, [form, item]);

  const currentAmount = Form.useWatch(FormFieldName.VALUE, form);

  const transformAssetEarnings: TransformAssetEarningMap = useMemo(() => {
    const dailyEarnings: Record<string, YieldAssetExpectedEarning> = {};
    const weeklyEarnings: Record<string, YieldAssetExpectedEarning> = {};
    const monthlyEarnings: Record<string, YieldAssetExpectedEarning> = {};
    const yearlyEarnings: Record<string, YieldAssetExpectedEarning> = {};

    if (item?.stats?.assetEarning) {
      item?.stats?.assetEarning.forEach((assetEarningStats) => {
        const assetApr = assetEarningStats?.apr || 0;
        const assetSlug = assetEarningStats.slug;

        const _1dEarning = calculateReward(assetApr, parseFloat(currentAmount), YieldCompoundingPeriod.DAILY);
        const _7dEarning = calculateReward(assetApr, parseFloat(currentAmount), YieldCompoundingPeriod.WEEKLY);
        const _monthlyEarning = calculateReward(assetApr, parseFloat(currentAmount), YieldCompoundingPeriod.MONTHLY);
        const _yearlyEarning = calculateReward(assetApr, parseFloat(currentAmount), YieldCompoundingPeriod.YEARLY);

        dailyEarnings[assetSlug] = _1dEarning;
        weeklyEarnings[assetSlug] = _7dEarning;
        monthlyEarnings[assetSlug] = _monthlyEarning;
        yearlyEarnings[assetSlug] = _yearlyEarning;
      });
    }

    return { dailyEarnings, weeklyEarnings, monthlyEarnings, yearlyEarnings };
  }, [currentAmount]);

  const onCloseModal = useCallback(() => {
    inactiveModal(STAKING_CALCULATOR_MODAL_ID);
  }, [inactiveModal]);

  const onFieldsChange: FormCallbacks<EarningCalculatorFormProps>['onFieldsChange'] = useCallback((changedFields: FormFieldData[], allFields: FormFieldData[]) => {
  }, []);

  return (
    <BaseModal
      className={className}
      closable
      id={STAKING_CALCULATOR_MODAL_ID}
      maskClosable
      onCancel={onCloseModal}
      title={t('Staking calculator')}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: token.paddingSM, paddingTop: token.paddingXS }}>
        <EarningBtn network={'polkadot'} size={'xs'}>
          {'DOT'}
        </EarningBtn>

        <Typography.Text className={'earning-calculator-message'}>{t('Enter the number of tokens to estimate the rewards')}</Typography.Text>

        <Form
          className={'form-container form-space-sm earning-calculator-form-container'}
          form={form}
          initialValues={formDefault}
          onFieldsChange={onFieldsChange}
        >
          <Form.Item
            colon={false}
            label={'Select method'}
            name={FormFieldName.METHOD}
          >
            <EarningMethodSelector
              items={Object.values(poolInfo)}
              showChainInSelected
            />
          </Form.Item>

          <Form.Item
            colon={false}
            label={'Staking amount'}
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
            statusHelpAsTooltip={true}
          >
            <AmountInput
              decimals={0}
              maxValue={'1'}
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
        {t('This content is for informational purposes only and does not constitute a guarantee. All rates are annualized and are subject to change.')}
      </Typography.Text>

      <Button
        block
        icon={<Icon
          phosphorIcon={PlusCircle}
          weight={'fill'}
        />}
        style={{ marginTop: token.paddingXL }}
      >{t('Stake now')}</Button>
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
      }
    }
  };
});

export default EarningCalculatorModal;
