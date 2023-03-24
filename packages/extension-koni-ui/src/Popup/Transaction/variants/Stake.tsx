// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ExtrinsicType, NominationPoolInfo, StakingType, ValidatorInfo } from '@subwallet/extension-base/background/KoniTypes';
import { ALL_ACCOUNT_KEY } from '@subwallet/extension-base/constants';
import { _getChainNativeTokenBasicInfo, _getChainNativeTokenSlug, _getOriginChainOfAsset } from '@subwallet/extension-base/services/chain-service/utils';
import { SWTransactionResponse } from '@subwallet/extension-base/services/transaction-service/types';
import { PageWrapper } from '@subwallet/extension-koni-ui/components';
import { AccountSelector } from '@subwallet/extension-koni-ui/components/Field/AccountSelector';
import AmountInput from '@subwallet/extension-koni-ui/components/Field/AmountInput';
import MultiValidatorSelector from '@subwallet/extension-koni-ui/components/Field/MultiValidatorSelector';
import PoolSelector from '@subwallet/extension-koni-ui/components/Field/PoolSelector';
import { TokenSelector } from '@subwallet/extension-koni-ui/components/Field/TokenSelector';
import MetaInfo from '@subwallet/extension-koni-ui/components/MetaInfo';
import { StakingNetworkDetailModal } from '@subwallet/extension-koni-ui/components/Modal/Staking/StakingNetworkDetailModal';
import RadioGroup from '@subwallet/extension-koni-ui/components/RadioGroup';
import { ALL_KEY } from '@subwallet/extension-koni-ui/constants/commont';
import { DataContext } from '@subwallet/extension-koni-ui/contexts/DataContext';
import useGetChainStakingMetadata from '@subwallet/extension-koni-ui/hooks/screen/staking/useGetChainStakingMetadata';
import useGetNominatorInfo from '@subwallet/extension-koni-ui/hooks/screen/staking/useGetNominatorInfo';
import useGetSupportedStakingTokens from '@subwallet/extension-koni-ui/hooks/screen/staking/useGetSupportedStakingTokens';
import { submitBonding, submitPoolBonding } from '@subwallet/extension-koni-ui/messaging';
import { accountFilterFunc, fetchChainValidators } from '@subwallet/extension-koni-ui/Popup/Transaction/helper/stakingHandler';
import FreeBalance from '@subwallet/extension-koni-ui/Popup/Transaction/parts/FreeBalance';
import TransactionContent from '@subwallet/extension-koni-ui/Popup/Transaction/parts/TransactionContent';
import TransactionFooter from '@subwallet/extension-koni-ui/Popup/Transaction/parts/TransactionFooter';
import { TransactionContext, TransactionFormBaseProps } from '@subwallet/extension-koni-ui/Popup/Transaction/Transaction';
import { RootState } from '@subwallet/extension-koni-ui/stores';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { isAccountAll } from '@subwallet/extension-koni-ui/util';
import { parseNominations } from '@subwallet/extension-koni-ui/util/transaction/stake';
import { Button, Divider, Form, Icon } from '@subwallet/react-ui';
import { useForm } from '@subwallet/react-ui/es/form/Form';
import { RadioChangeEvent } from '@subwallet/react-ui/es/radio/interface';
import { PlusCircle } from 'phosphor-react';
import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { useParams } from 'react-router';
import styled from 'styled-components';

type Props = ThemeProps

interface StakeFromProps extends TransactionFormBaseProps {
  token: string;
  value: string;
  nominate: string;
  pool: string;
}

const Component: React.FC<Props> = (props: Props) => {
  const { className } = props;

  const { t } = useTranslation();
  const { chain: stakingChain, type: _stakingType } = useParams();

  const dataContext = useContext(DataContext);
  const { chain, from, onDone, setChain, setDisabledRightBtn, setFrom, setShowRightBtn, setTransactionType } = useContext(TransactionContext);

  const [stakingType, setStakingType] = useState<StakingType>(() => {
    switch (_stakingType) {
      case StakingType.POOLED:
        return StakingType.POOLED;
      case StakingType.NOMINATED:
        return StakingType.NOMINATED;
      default:
        return StakingType.POOLED;
    }
  });

  const [form] = useForm<StakeFromProps>();

  const currentValue = Form.useWatch('value', form);
  const currentTokenSlug = Form.useWatch('token', form);
  const currentPool = Form.useWatch('pool', form);
  const currentNominator = Form.useWatch('nominate', form);

  const currentChain = (stakingChain === ALL_KEY ? (currentTokenSlug && _getOriginChainOfAsset(currentTokenSlug)) : stakingChain);

  const chainStakingMetadata = useGetChainStakingMetadata(currentChain);
  const nominatorMetadata = useGetNominatorInfo(currentChain, stakingType, from);

  const tokenList = useGetSupportedStakingTokens(stakingType, from, stakingChain);
  const [loading, setLoading] = useState(false);

  // TODO: should do better to get validators info
  const { nominationPoolInfoMap, validatorInfoMap } = useSelector((state: RootState) => state.bonding);
  const { chainInfoMap } = useSelector((state: RootState) => state.chainStore);
  const { currentAccount } = useSelector((state: RootState) => state.accountState);

  const [{ decimals, symbol }, setNativeTokenBasicInfo] = useState<{ decimals: number, symbol: string }>({
    decimals: 0,
    symbol: 'Unit'
  });

  const isAllAccount = isAccountAll(currentAccount?.address || '');

  const defaultSlug = useMemo(() => {
    if (stakingChain && stakingChain !== ALL_KEY) {
      const chainInfo = chainInfoMap[stakingChain];

      return _getChainNativeTokenSlug(chainInfo);
    }

    return '';
  }, [chainInfoMap, stakingChain]);

  const formDefault = useMemo(() => {
    return {
      from: from,
      token: defaultSlug,
      value: '0'
    };
  }, [defaultSlug, from]);

  const onValuesChange = useCallback(({ from, nominate, token, value }: Partial<StakeFromProps>, values: StakeFromProps) => {
    // TODO: field change

    if (from) {
      setFrom(from);
    }

    if (token !== undefined) {
      const chain = _getOriginChainOfAsset(token);

      setChain(chain);
    }

    if (nominate) {
      form.setFieldValue('nominate', nominate);
    }
  }, [form, setChain, setFrom]);

  const getSelectedValidators = useCallback((nominations: string[]) => {
    const validatorList = validatorInfoMap[chain];

    if (!validatorList) {
      return [];
    }

    const result: ValidatorInfo[] = [];

    validatorList.forEach((validator) => {
      if (nominations.includes(validator.address)) {
        result.push(validator);
      }
    });

    return result;
  }, [chain, validatorInfoMap]);

  const getSelectedPool = useCallback((poolId?: string) => {
    const nominationPoolList = nominationPoolInfoMap[chain];

    for (const pool of nominationPoolList) {
      if (String(pool.id) === poolId) {
        return pool;
      }
    }

    return undefined;
  }, [nominationPoolInfoMap, chain]);

  const submitTransaction = useCallback(() => {
    form.validateFields()
      .then((values) => {
        setLoading(true);
        const { from, nominate, pool, value } = values;
        let bondingPromise: Promise<SWTransactionResponse>;

        if (pool) {
          const selectedPool = getSelectedPool(pool);

          bondingPromise = submitPoolBonding({
            amount: value, // TODO: value is wrong
            chain: chain,
            nominatorMetadata: nominatorMetadata[0],
            selectedPool: selectedPool as NominationPoolInfo,
            address: from
          });
        } else {
          const selectedValidators = getSelectedValidators(parseNominations(nominate));

          bondingPromise = submitBonding({
            amount: value,
            chain: chain,
            nominatorMetadata: nominatorMetadata[0],
            selectedValidators,
            type: StakingType.NOMINATED
          });
        }

        bondingPromise
          .then((response) => {
            const { errors, extrinsicHash, warnings } = response;

            if (errors.length || warnings.length) {
              console.log('failed', errors, warnings);
              setLoading(false);
              // setErrors(errors.map((e) => e.message));
              // setWarnings(warnings.map((w) => w.message));
            } else if (extrinsicHash) {
              onDone(extrinsicHash);
            }
          })
          .catch((error) => {
            setLoading(false);
            console.log(error);
          });
      })
      .catch((error: Error) => {
        console.log(error);
        setLoading(false);
      });
  }, [nominatorMetadata, chain, form, getSelectedPool, getSelectedValidators, onDone]);

  const getMetaInfo = useCallback(() => {
    if (chainStakingMetadata) {
      return (
        <MetaInfo
          className={'meta-info'}
          labelColorScheme={'gray'}
          spaceSize={'xs'}
          valueColorScheme={'light'}
        >
          {chainStakingMetadata.expectedReturn && <MetaInfo.Number
            label={t('Estimated earnings:')}
            suffix={'% / year'}
            value={chainStakingMetadata.expectedReturn}
          />}

          {chainStakingMetadata.minStake && <MetaInfo.Number
            decimals={decimals}
            label={t('Minimum active:')}
            suffix={symbol}
            value={chainStakingMetadata.minStake}
            valueColorSchema={'success'}
          />}
        </MetaInfo>
      );
    }

    return null;
  }, [chainStakingMetadata, decimals, symbol, t]);

  const isDisabledStakeBtn = useMemo(() => {
    const isDisabled = !currentTokenSlug || currentValue === '0' || !currentValue || from === ALL_ACCOUNT_KEY;

    if (stakingType === StakingType.POOLED) {
      return isDisabled || !currentPool;
    } else {
      return isDisabled || !currentNominator;
    }
  }, [from, currentNominator, currentPool, currentTokenSlug, currentValue, stakingType]);

  const onChangeTab = useCallback((event: RadioChangeEvent) => {
    setStakingType(event.target.value as StakingType);
  }, []);

  useEffect(() => {
    const address = currentAccount?.address || '';

    if (address) {
      if (!isAccountAll(address)) {
        setFrom(address);
      }
    }
  }, [currentAccount?.address, setFrom]);

  useEffect(() => {
    if (defaultSlug) {
      const chain = _getOriginChainOfAsset(defaultSlug);

      setChain(chain);
    }
  }, [defaultSlug, setChain]);

  useEffect(() => {
    if (chainStakingMetadata) {
      const chainInfo = chainInfoMap[chainStakingMetadata.chain];

      setNativeTokenBasicInfo(_getChainNativeTokenBasicInfo(chainInfo));
    }
  }, [chainInfoMap, chainStakingMetadata]);

  useEffect(() => {
    setTransactionType(ExtrinsicType.STAKING_JOIN_POOL);
    setShowRightBtn(true);
  }, [setShowRightBtn, setTransactionType]);

  useEffect(() => {
    setDisabledRightBtn(!chainStakingMetadata);
  }, [chainStakingMetadata, setDisabledRightBtn]);

  useEffect(() => {
    // fetch validators when change chain
    // _stakingType is predefined form start
    if (!!chain && !!from) {
      fetchChainValidators(chain, _stakingType || ALL_KEY);
    }
  }, [from, _stakingType, chain]);

  return (
    <>
      <TransactionContent>
        <PageWrapper
          className={className}
          resolve={dataContext.awaitStores(['staking'])}
        >
          <Form
            className={'form-container form-space-sm'}
            form={form}
            initialValues={formDefault}
            onValuesChange={onValuesChange}
          >
            <Form.Item
              className='staking-type'
              hidden={_stakingType !== ALL_KEY}
            >
              <RadioGroup
                onChange={onChangeTab}
                optionType='button'
                options={[
                  {
                    label: 'Pools',
                    value: StakingType.POOLED
                  },
                  {
                    label: 'Nominate',
                    value: StakingType.NOMINATED
                  }
                ]}
                value={stakingType}
              />
            </Form.Item>
            <Form.Item
              hidden={!isAllAccount}
              name={'from'}
            >
              <AccountSelector filter={accountFilterFunc(chainInfoMap, stakingChain)} />
            </Form.Item>

            {
              !isAllAccount &&
              (
                <Form.Item name={'token'}>
                  <TokenSelector
                    disabled={stakingChain !== ALL_KEY}
                    items={tokenList}
                    prefixShape='circle'
                  />
                </Form.Item>
              )
            }

            <FreeBalance
              address={from}
              chain={chain}
              className={'account-free-balance'}
              label={t('Available balance:')}
            />

            <div className={'form-row'}>
              {isAllAccount && <Form.Item name={'token'}>
                <TokenSelector
                  disabled={stakingChain !== ALL_KEY}
                  items={tokenList}
                  prefixShape='circle'
                />
              </Form.Item>}

              <Form.Item
                hideError
                name={'value'}
                rules={[
                  { required: true },
                  { max: 100 }
                ]}
              >
                <AmountInput
                  decimals={decimals}
                  maxValue={'10000'} // TODO
                />
              </Form.Item>
            </div>

            <Form.Item
              hidden={stakingType !== StakingType.POOLED}
              name={'pool'}
            >
              <PoolSelector
                chain={chain}
                from={from}
                label={t('Select pool')}
              />
            </Form.Item>

            <Form.Item
              hidden={stakingType !== StakingType.NOMINATED}
              name={'nominate'}
            >
              <MultiValidatorSelector
                chain={currentTokenSlug ? chain : ''}
                from={currentTokenSlug ? from : ''}
              />
            </Form.Item>
          </Form>
          {
            chainStakingMetadata && (
              <>
                <Divider />
                {getMetaInfo()}
              </>
            )
          }
        </PageWrapper>
      </TransactionContent>

      <TransactionFooter
        errors={[]}
        warnings={[]}
      >
        <Button
          disabled={isDisabledStakeBtn}
          icon={(
            <Icon
              phosphorIcon={PlusCircle}
              weight={'fill'}
            />
          )}
          loading={loading}
          onClick={submitTransaction}
        >
          {t('Stake')}
        </Button>
      </TransactionFooter>

      {
        chainStakingMetadata &&
        (
          <StakingNetworkDetailModal
            estimatedEarning={chainStakingMetadata.expectedReturn}
            inflation={chainStakingMetadata.inflation}
            maxValidatorPerNominator={chainStakingMetadata.maxValidatorPerNominator}
            minimumActive={{ decimals, value: chainStakingMetadata.minStake, symbol }}
            unstakingPeriod={chainStakingMetadata.unstakingPeriod}
          />
        )
      }
    </>
  );
};

const Stake = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {
    '.staking-type': {
      marginBottom: token.margin
    },

    '.account-free-balance': {
      marginBottom: token.marginXS
    },

    '.meta-info': {
      marginTop: token.paddingSM
    },

    '.react-tabs__tab-list': {
      marginLeft: 0,
      marginRight: 0
    }
  };
});

export default Stake;
