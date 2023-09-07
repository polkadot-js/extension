import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { FormCallbacks, FormFieldData, Theme, ThemeProps } from '@subwallet/extension-koni-ui/types';
import { BaseModal } from '@subwallet/extension-koni-ui/components/Modal/BaseModal';
import { useTranslation } from 'react-i18next';
import { Button, Divider, Form, Icon, Logo, ModalContext, Typography } from '@subwallet/react-ui';
import styled, { useTheme } from 'styled-components';
import EarningBtn from '@subwallet/extension-koni-ui/components/EarningBtn';
import { EarningMethodSelector } from '@subwallet/extension-koni-ui/components/Field/EarningMethodSelector';
import { useSelector } from 'react-redux';
import { RootState } from '@subwallet/extension-koni-ui/stores';
import { AccountSelector, AmountInput } from '@subwallet/extension-koni-ui/components';
import BigN from 'bignumber.js';
import { ArrowCircleRight, CheckCircle, Question } from 'phosphor-react';
import CN from 'classnames';
import { YieldPoolInfo, YieldStepDetail } from '@subwallet/extension-base/background/KoniTypes';
import { useGetChainPrefixBySlug } from '@subwallet/extension-koni-ui/hooks';
import { _isChainEvmCompatible } from '@subwallet/extension-base/services/chain-service/utils';
import { _ChainInfo } from '@subwallet/chain-list/types';
import { AccountJson } from '@subwallet/extension-base/background/types';
import { isEthereumAddress } from '@polkadot/util-crypto';
import { FreeBalance } from '@subwallet/extension-koni-ui/Popup/Transaction/parts';
import StakingProcessModal, {
  STAKING_PROCESS_MODAL_ID
} from '@subwallet/extension-koni-ui/Popup/Home/Earning/StakingProcessModal';
import { getOptimalYieldPath } from '@subwallet/extension-koni-ui/messaging';

interface Props extends ThemeProps {
  item: YieldPoolInfo;

}

enum FormFieldName {
  VALUE = 'amount',
  METHOD = 'method',
  FROM = 'from',
}

interface EarningCalculatorFormProps {
  [FormFieldName.VALUE]: string;
  [FormFieldName.METHOD]: string;
  [FormFieldName.FROM]: string;
}

export const STAKING_MODAL_ID = 'staking-modal-id';

const Component = ({ className, item }: Props) => {
  const { t } = useTranslation();
  const { inactiveModal, activeModal } = useContext(ModalContext);
  const { isAllAccount, currentAccount } = useSelector((state: RootState) => state.accountState);
  const chainInfoMap = useSelector((state: RootState) => state.chainStore.chainInfoMap);
  const [yieldSteps, setYieldSteps] = useState<YieldStepDetail[]>();
  const [isBalanceReady, setIsBalanceReady] = useState(true);
  const [step, setStep] = useState<number>(1);
  const chainNetworkPrefix = useGetChainPrefixBySlug(item.chain);
  const { token } = useTheme() as Theme;
  const { poolInfo } = useSelector((state: RootState) => state.yieldPool);
  const [form] = Form.useForm<EarningCalculatorFormProps>();
  const formDefault: EarningCalculatorFormProps = useMemo(() => {
    return {
      [FormFieldName.VALUE]: '0',
      [FormFieldName.METHOD]: '',
      [FormFieldName.FROM]: !isAllAccount ? currentAccount?.address || '' : '',
    };
  }, []);

  useEffect(() => {
    const selectedPool = Object.values(poolInfo)[0];

    getOptimalYieldPath({
      amount: '100000000000',
      poolInfo: selectedPool
    })
      .then((res) => {
        setYieldSteps(res?.steps);
      })
      .catch(console.error);
  }, [poolInfo]);

  const currentFrom = Form.useWatch('from', form);

  const onCloseModal = useCallback(() => {
    setStep(1);
    inactiveModal(STAKING_MODAL_ID);
  }, [inactiveModal]);

  const accountFilterFunc = (chainInfoMap: Record<string, _ChainInfo>): ((account: AccountJson) => boolean) => {
    return (account: AccountJson) => {
      const chain = chainInfoMap[item.chain];
      const isEvmChain = _isChainEvmCompatible(chain);
      const isEvmAddress = isEthereumAddress(account.address);

      return isEvmChain === isEvmAddress;
    };
  };

  const onFieldsChange: FormCallbacks<EarningCalculatorFormProps>['onFieldsChange'] = useCallback((changedFields: FormFieldData[], allFields: FormFieldData[]) => {
  }, [])

  return (
    <BaseModal
      className={className}
      closable
      id={STAKING_MODAL_ID}
      maskClosable
      onCancel={onCloseModal}
      title={t('Staking')}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: token.paddingSM, paddingTop: token.paddingXS }}>
        <EarningBtn icon={<Logo className={'earning-calculator-tag'} size={16} network={'polkadot'} />} size={'xs'}>
          {'DOT'}
        </EarningBtn>

        <Form
          className={'form-container form-space-sm earning-calculator-form-container'}
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

          <Divider style={{ backgroundColor: token.colorBgDivider, marginTop: token.marginSM, marginBottom: token.marginSM }} />

          {yieldSteps && (
            <div style={{ display: 'flex', alignItems: 'center' }}>
            <Typography.Text
              style={{ fontWeight: '600' }}
              size={'lg'}
            >
              {t('Step 0{{step}}: {{label}}', {
                replace: { step, label: yieldSteps[step - 1].name}
              })}
            </Typography.Text>
            <Button
              onClick={() => activeModal(STAKING_PROCESS_MODAL_ID)}
              size={'xs'}
              icon={<Icon phosphorIcon={Question} size={'xs'} weight={'fill'} iconColor={token.colorPrimary}/>}
              type={'primary'}
            />
          </div>
          )}


          <Form.Item
            className={CN({ hidden: !isAllAccount })}
            name={'from'}
          >
            <AccountSelector
              addressPrefix={chainNetworkPrefix}
              disabled={!isAllAccount}
              filter={accountFilterFunc(chainInfoMap)}
            />
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

          <FreeBalance
            address={currentFrom}
            chain={item.chain}
            className={'account-free-balance'}
            label={t('Available balance:')}
            onBalanceReady={setIsBalanceReady}
          />
        </Form>
      </div>


      <Typography.Text style={{ color: token.colorTextLight4 }}>
        {t('This content is for informational purposes only and does not constitute a guarantee. All rates are annualized and are subject to change.')}
      </Typography.Text>

      <Button
        disabled={!isBalanceReady}
        style={{ marginTop: token.paddingXL }}
        block
        onClick={() => {
          if (yieldSteps && step === yieldSteps.length) {
            onCloseModal();
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

      <StakingProcessModal currentStep={step} yieldSteps={yieldSteps} />
    </BaseModal>
  );
};

const StakingModal = styled(Component)<Props>(({ theme: { token } }: Props) => {
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
        alignItems: 'center',
      },

      '.ant-form-item-label > label': {
        color: token.colorTextLight4
      },
    }
  }
});

export default StakingModal;
