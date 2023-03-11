// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ExtrinsicType } from '@subwallet/extension-base/background/KoniTypes';
import { AccountSelector } from '@subwallet/extension-koni-ui/components/Field/AccountSelector';
import AmountInput from '@subwallet/extension-koni-ui/components/Field/AmountInput';
import MultiValidatorSelector from '@subwallet/extension-koni-ui/components/Field/MultiValidatorSelector';
import PoolSelector from '@subwallet/extension-koni-ui/components/Field/PoolSelector';
import { TokenItemType, TokenSelector } from '@subwallet/extension-koni-ui/components/Field/TokenSelector';
import MetaInfo from '@subwallet/extension-koni-ui/components/MetaInfo';
import { StakingNetworkDetailModal, StakingNetworkDetailModalId } from '@subwallet/extension-koni-ui/components/Modal/Staking/StakingNetworkDetailModal';
import ScreenTab from '@subwallet/extension-koni-ui/components/ScreenTab';
import SelectValidatorInput from '@subwallet/extension-koni-ui/components/SelectValidatorInput';
import FreeBalance from '@subwallet/extension-koni-ui/Popup/Transaction/parts/FreeBalance';
import TransactionContent from '@subwallet/extension-koni-ui/Popup/Transaction/parts/TransactionContent';
import TransactionFooter from '@subwallet/extension-koni-ui/Popup/Transaction/parts/TransactionFooter';
import { TransactionContext, TransactionFormBaseProps } from '@subwallet/extension-koni-ui/Popup/Transaction/Transaction';
import { RootState } from '@subwallet/extension-koni-ui/stores';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { isAccountAll } from '@subwallet/extension-koni-ui/util';
import { Button, Divider, Form, Icon } from '@subwallet/react-ui';
import { useForm } from '@subwallet/react-ui/es/form/Form';
import { ModalContext } from '@subwallet/react-ui/es/sw-modal/provider';
import { PlusCircle } from 'phosphor-react';
import React, { useCallback, useContext, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

type Props = ThemeProps

interface StakeFromProps extends TransactionFormBaseProps {
  token: string
  value: string
  nominate: string
}

const Component: React.FC<Props> = (props: Props) => {
  const { className } = props;
  const transactionContext = useContext(TransactionContext);
  const assetRegistry = useSelector((root: RootState) => root.assetRegistry.assetRegistry);
  const currentAccount = useSelector((state: RootState) => state.accountState.currentAccount);
  const isAll = isAccountAll(currentAccount?.address || '');
  const [form] = useForm<StakeFromProps>();
  const formDefault = {
    from: transactionContext.from,
    value: '0'
  };

  const { activeModal, inactiveModal } = useContext(ModalContext);

  useEffect(() => {
    transactionContext.setTransactionType(ExtrinsicType.STAKING_STAKE);
    transactionContext.setShowRightBtn(true);
  }, [transactionContext]);

  const onFieldsChange = useCallback(({ from, nominate, token }: Partial<StakeFromProps>, values: StakeFromProps) => {
    // TODO: field change

    if (from) {
      transactionContext.setFrom(from);
    }

    if (token) {
      const chain = token.split('-')[0];

      transactionContext.setChain(chain);
      form.setFieldValue('token', token);
    }

    if (nominate) {
      form.setFieldValue('nominate', nominate);
    }
  }, [form, transactionContext]);

  console.log('values', form.getFieldsValue().nominate);

  const tokenList = useMemo<TokenItemType[]>(() => (
    Object.values(assetRegistry).map(({ name, originChain, slug, symbol }) => ({ name, slug, originChain, symbol }))
  ), [assetRegistry]);

  const { t } = useTranslation();

  const submitTransaction = useCallback(() => {
    // TODO: submit transaction
  }, []);

  const getMetaInfo = () => {
    return (
      <MetaInfo
        className={'meta-info'}
        labelColorScheme={'gray'}
        spaceSize={'xs'}
        valueColorScheme={'light'}
      >
        <MetaInfo.Default
          label={t('Estimated earnings:')}
        >
          {'15% / year'}
        </MetaInfo.Default>

        <MetaInfo.Number
          label={t('Minimum active:')}
          suffix={'DOT'}
          value={'293.7'}
          valueColorSchema={'success'}
        />
      </MetaInfo>
    );
  };

  const onCloseInfoModal = () => {
    inactiveModal(StakingNetworkDetailModalId);
  };

  return (
    <>
      <ScreenTab className={className}>
        <ScreenTab.SwTabPanel label={t('Pools')}>
          <TransactionContent>
            <Form
              className={'form-container form-space-sm'}
              form={form}
              initialValues={formDefault}
              onValuesChange={onFieldsChange}
            >
              {isAll &&
                <Form.Item name={'from'}>
                  <AccountSelector />
                </Form.Item>
              }

              {!isAll && <Form.Item name={'token'}>
                <TokenSelector
                  items={tokenList}
                  prefixShape='circle'
                />
              </Form.Item>
              }

              <FreeBalance
                className={'account-free-balance'}
                label={t('Available balance:')}
              />

              <div className={'form-row'}>
                {isAll && <Form.Item name={'token'}>
                  <TokenSelector
                    items={tokenList}
                    prefixShape='circle'
                  />
                </Form.Item>}

                <Form.Item
                  hideError
                  name={'value'}
                  rules={[{ required: true }]}
                >
                  <AmountInput
                    decimals={10}
                    maxValue={'10000'}
                  />
                </Form.Item>
              </div>

              <Form.Item name={'pool'}>
                <PoolSelector
                  chain={'polkadot'}
                  label={t('Select pool')}
                />
              </Form.Item>

              <Divider />

              {getMetaInfo()}
            </Form>
          </TransactionContent>
        </ScreenTab.SwTabPanel>

        <ScreenTab.SwTabPanel label={t('Nominate')}>
          <TransactionContent>
            <Form
              className={'form-container form-space-sm'}
              form={form}
              initialValues={formDefault}
              onValuesChange={onFieldsChange}
            >
              {isAll &&
                <Form.Item name={'from'}>
                  <AccountSelector />
                </Form.Item>
              }

              {!isAll && <Form.Item name={'token'}>
                <TokenSelector
                  items={tokenList}
                  prefixShape='circle'
                />
              </Form.Item>
              }

              <FreeBalance
                className={'account-free-balance'}
                label={t('Available balance:')}
              />

              <div className={'form-row'}>
                {isAll && <Form.Item name={'token'}>
                  <TokenSelector
                    items={tokenList}
                    prefixShape='circle'
                  />
                </Form.Item>}

                <Form.Item name={'value'}>
                  <AmountInput
                    decimals={10}
                    maxValue={'10000'}
                  />
                </Form.Item>
              </div>
              <SelectValidatorInput
                label={t('Select validator')}
                // eslint-disable-next-line react/jsx-no-bind
                onClick={() => activeModal('multi-validator-selector')}
                value={form.getFieldsValue().nominate}
              />

              <Form.Item name={'nominate'}>
                <MultiValidatorSelector
                  chain={'polkadot'}
                  id={'multi-validator-selector'}
                />
              </Form.Item>

              <Divider />

              {getMetaInfo()}
            </Form>
          </TransactionContent>
        </ScreenTab.SwTabPanel>
      </ScreenTab>
      <TransactionFooter errors={[]}>
        <Button
          icon={<Icon
            phosphorIcon={PlusCircle}
            weight={'fill'}
          />}
          loading={false}
          onClick={submitTransaction}
        >
          {t('Stake')}
        </Button>
      </TransactionFooter>

      <StakingNetworkDetailModal
        activeNominators={['0', '0']}
        estimatedEarning={'0'}
        minimumActive={{ decimals: 10, value: '100', symbol: 'DOT' }}
        // eslint-disable-next-line react/jsx-no-bind
        onCancel={onCloseInfoModal}

        unstakingPeriod={'0'}
      />
    </>
  );
};

const Stake = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {
    paddingTop: token.paddingXS,

    '.account-free-balance': {
      marginBottom: token.marginXS
    },

    '.meta-info': {
      marginTop: token.paddingSM
    }
  };
});

export default Stake;
