import React, { useCallback, useContext, useEffect, useMemo } from 'react';
import { FormCallbacks, FormFieldData, Theme, ThemeProps } from '@subwallet/extension-koni-ui/types';
import { BaseModal } from '@subwallet/extension-koni-ui/components/Modal/BaseModal';
import { useTranslation } from 'react-i18next';
import { Button, Divider, Form, Icon, Logo, ModalContext, Typography } from '@subwallet/react-ui';
import styled, { useTheme } from 'styled-components';
import EarningBtn from '@subwallet/extension-koni-ui/components/EarningBtn';
import { EarningMethodSelector } from '@subwallet/extension-koni-ui/components/Field/EarningMethodSelector';
import { useSelector } from 'react-redux';
import { RootState } from '@subwallet/extension-koni-ui/stores';
import { AmountInput } from '@subwallet/extension-koni-ui/components';
import BigN from 'bignumber.js';
import {
  YieldAssetExpectedEarning,
  YieldCompoundingPeriod,
  YieldPoolInfo
} from '@subwallet/extension-base/background/KoniTypes';
import { calculateReward } from '@subwallet/extension-base/koni/api/yield';
import EarningCalculatorInfo from '@subwallet/extension-koni-ui/components/StakingCalculatorInfo';
import { PlusCircle } from 'phosphor-react';

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
      [FormFieldName.METHOD]: '',
    };
  }, []);

  useEffect(() => {
    form.setFieldValue(FormFieldName.METHOD, item.slug);
  }, [form, item]);

  const currentAmount = Form.useWatch('amount', form);


  const transformAssetEarnings: TransformAssetEarningMap = useMemo(() => {
    let dailyEarnings: Record<string, YieldAssetExpectedEarning> = {};
    let weeklyEarnings: Record<string, YieldAssetExpectedEarning> = {};
    let monthlyEarnings: Record<string, YieldAssetExpectedEarning> = {};
    let yearlyEarnings: Record<string, YieldAssetExpectedEarning> = {};

    if (item?.stats?.assetEarning) {
      item?.stats?.assetEarning.forEach((assetEarningStats) => {
        const assetApr = assetEarningStats?.apr || 0;
        const assetSlug = assetEarningStats.slug;

        const _1dEarning = calculateReward(assetApr, currentAmount, YieldCompoundingPeriod.DAILY);
        const _7dEarning = calculateReward(assetApr, currentAmount, YieldCompoundingPeriod.WEEKLY);
        const _monthlyEarning = calculateReward(assetApr, currentAmount, YieldCompoundingPeriod.MONTHLY);
        const _yearlyEarning = calculateReward(assetApr, currentAmount, YieldCompoundingPeriod.YEARLY);

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
  }, [])

  return (
    <BaseModal
      className={className}
      closable
      id={STAKING_CALCULATOR_MODAL_ID}
      maskClosable
      onCancel={onCloseModal}
      title={t('Staking calculator')}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: token.paddingSM, paddingTop: token.paddingXS }}>
        <EarningBtn icon={<Logo className={'staking-calculator-tag'} size={16} network={'polkadot'} />} size={'xs'}>
          {'DOT'}
        </EarningBtn>

        <Typography.Text className={'staking-calculator-message'}>{t('Enter the number of tokens to estimate the rewards')}</Typography.Text>


        <Form
          className={'form-container form-space-sm staking-calculator-form-container'}
          form={form}
          initialValues={formDefault}
          onFieldsChange={onFieldsChange}
        >
          <Form.Item
            name={FormFieldName.METHOD}
            label={'Select method'}
            colon={false}
          >
            <EarningMethodSelector items={Object.values(poolInfo)} />
          </Form.Item>


          <Form.Item
            label={'Staking amount'}
            colon={false}
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

      <EarningCalculatorInfo label={t('Daily earnings')} earningAssets={transformAssetEarnings.dailyEarnings} />
      <EarningCalculatorInfo label={t('Weekly earnings')} earningAssets={transformAssetEarnings.weeklyEarnings} />
      <EarningCalculatorInfo label={t('Monthly earnings')} earningAssets={transformAssetEarnings.monthlyEarnings} />
      <EarningCalculatorInfo label={t('Yearly earnings')} earningAssets={transformAssetEarnings.yearlyEarnings} />

      <Typography.Text style={{ color: token.colorTextLight4 }}>
        {t('This content is for informational purposes only and does not constitute a guarantee. All rates are annualized and are subject to change.')}
      </Typography.Text>

      <Button style={{ marginTop: token.paddingXL }} block icon={<Icon phosphorIcon={PlusCircle} weight={'fill'} />}>{t('Stake now')}</Button>
    </BaseModal>
  );
};

const StakingCalculatorModal = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {
    '.staking-calculator-tag': {
      paddingRight: token.paddingXXS
    },

    '.staking-calculator-message': {
      color: token.colorTextLight4
    },

    '.staking-calculator-form-container': {
      '.ant-form-item-label': {
        display: 'flex',
        alignItems: 'center',
      },

      '.ant-form-item-label > label': {
        color: token.colorTextLight4
      },
    }
  }
});

export default StakingCalculatorModal;
