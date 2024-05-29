// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { getValidatorLabel } from '@subwallet/extension-base/koni/api/staking/bonding/utils';
import { _STAKING_CHAIN_GROUP } from '@subwallet/extension-base/services/earning-service/constants';
import { MetaInfo } from '@subwallet/extension-koni-ui/components';
import { VALIDATOR_DETAIL_MODAL } from '@subwallet/extension-koni-ui/constants';
import { useGetChainPrefixBySlug } from '@subwallet/extension-koni-ui/hooks';
import useTranslation from '@subwallet/extension-koni-ui/hooks/common/useTranslation';
import { ThemeProps, ValidatorDataType } from '@subwallet/extension-koni-ui/types';
import { ModalContext, Number, SwModal } from '@subwallet/react-ui';
import React, { useCallback, useContext, useMemo } from 'react';
import styled from 'styled-components';

type Props = ThemeProps & {
  onCancel?: () => void;
  validatorItem: ValidatorDataType;
  chain: string;
  maxPoolMembersValue?: number;
};

function Component (props: Props): React.ReactElement<Props> {
  const { chain, className, maxPoolMembersValue, onCancel, validatorItem } = props;
  const { address: validatorAddress,
    commission,
    decimals,
    expectedReturn: earningEstimated = '',
    identity: validatorName = '',
    minBond: minStake,
    nominatorCount,
    otherStake,
    ownStake,
    symbol,
    totalStake } = validatorItem;
  const { t } = useTranslation();

  const { inactiveModal } = useContext(ModalContext);

  const networkPrefix = useGetChainPrefixBySlug(chain);

  const isRelayChain = useMemo(() => {
    return _STAKING_CHAIN_GROUP.relay.includes(chain);
  }, [chain]);

  const isParaChain = useMemo(() => {
    return _STAKING_CHAIN_GROUP.para.includes(chain) || _STAKING_CHAIN_GROUP.amplitude.includes(chain);
  }, [chain]);
  const title = useMemo(() => {
    const label = getValidatorLabel(chain);

    switch (label) {
      case 'dApp':
        return t('DApp details');
      case 'Collator':
        return t('Collator details');
      case 'Validator':
        return t('Validator details');
    }
  }, [t, chain]);

  const _onCancel = useCallback(() => {
    inactiveModal(VALIDATOR_DETAIL_MODAL);

    onCancel && onCancel();
  }, [inactiveModal, onCancel]);

  const ratePercent = useMemo(() => {
    const rate = maxPoolMembersValue && (nominatorCount / maxPoolMembersValue);

    if (rate !== undefined) {
      if (rate < 0.9) {
        return 'default';
      } else if (rate >= 0.9 && rate < 1) {
        return 'gold';
      } else {
        return 'danger';
      }
    }

    return undefined;
  }, [maxPoolMembersValue, nominatorCount]);

  return (
    <SwModal
      className={className}
      id={VALIDATOR_DETAIL_MODAL}
      onCancel={_onCancel}
      title={title}
    >
      <MetaInfo
        hasBackgroundWrapper
        spaceSize={'xs'}
        valueColorScheme={'light'}
      >
        <MetaInfo.Account
          address={validatorAddress}
          label={t(getValidatorLabel(chain))}
          name={validatorName}
          networkPrefix={networkPrefix}
        />

        {/* <MetaInfo.Status */}
        {/*  label={t('Status')} */}
        {/*  statusIcon={StakingStatusUi[status].icon} */}
        {/*  statusName={StakingStatusUi[status].name} */}
        {/*  valueColorSchema={StakingStatusUi[status].schema} */}
        {/* /> */}

        <MetaInfo.Number
          decimals={decimals}
          label={t('Minimum stake required')}
          suffix={symbol}
          value={minStake}
          valueColorSchema={'even-odd'}
        />

        {
          totalStake !== '0' && <MetaInfo.Number
            decimals={decimals}
            label={t('Total stake')}
            suffix={symbol}
            value={totalStake}
            valueColorSchema={'even-odd'}
          />
        }

        <MetaInfo.Number
          decimals={decimals}
          label={t('Own stake')}
          suffix={symbol}
          value={ownStake}
          valueColorSchema={'even-odd'}
        />

        {
          otherStake !== '0' && <MetaInfo.Number
            decimals={decimals}
            label={t('Stake from others')}
            suffix={symbol}
            value={otherStake}
            valueColorSchema={'even-odd'}
          />
        }

        {
          earningEstimated > 0 && earningEstimated !== '' && <MetaInfo.Number
            label={t('Estimated APY')}
            suffix={'%'}
            value={earningEstimated}
            valueColorSchema={'even-odd'}
          />
        }

        <MetaInfo.Number
          label={t('Commission')}
          suffix={'%'}
          value={commission}
          valueColorSchema={'even-odd'}
        />

        {!maxPoolMembersValue && (isParaChain || isRelayChain) &&
          <MetaInfo.Number
            label={t(isParaChain ? 'Delegator' : 'Nominator')}
            value={nominatorCount}
            valueColorSchema={'even-odd'}
          />}

        {
          !!maxPoolMembersValue && !!ratePercent && (isParaChain || isRelayChain) && (
            <MetaInfo.Default
              className={'__maximum-validator'}
              label={t(isParaChain ? 'Delegator' : 'Nominator')}
              labelAlign='top'
              valueColorSchema={`${ratePercent}`}
            >
              <Number
                decimal={0}
                value={nominatorCount}
              /> &nbsp;/&nbsp; <Number
                decimal={0}
                value={maxPoolMembersValue}
              />
            </MetaInfo.Default>
          )
        }
      </MetaInfo>
    </SwModal>
  );
}

const EarningValidatorDetailModal = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return ({
    '.__maximum-validator .__value': {
      display: 'flex'
    }
  });
});

export default EarningValidatorDetailModal;
