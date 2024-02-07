// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { getValidatorLabel } from '@subwallet/extension-base/koni/api/staking/bonding/utils';
import { BaseModal, MetaInfo } from '@subwallet/extension-web-ui/components';
import { VALIDATOR_DETAIL_MODAL } from '@subwallet/extension-web-ui/constants';
import { useGetChainPrefixBySlug } from '@subwallet/extension-web-ui/hooks';
import useTranslation from '@subwallet/extension-web-ui/hooks/common/useTranslation';
import { ThemeProps, ValidatorDataType } from '@subwallet/extension-web-ui/types';
import { ModalContext } from '@subwallet/react-ui';
import React, { useCallback, useContext, useMemo } from 'react';
import styled from 'styled-components';

type Props = ThemeProps & {
  onCancel?: () => void;
  validatorItem: ValidatorDataType;
  chain: string;
};

function Component (props: Props): React.ReactElement<Props> {
  const { chain, className, onCancel, validatorItem } = props;
  const { address: validatorAddress,
    commission,
    decimals,
    expectedReturn: earningEstimated = '',
    identity: validatorName = '',
    minBond: minStake,
    otherStake,
    ownStake,
    symbol,
    totalStake } = validatorItem;
  const { t } = useTranslation();

  const { inactiveModal } = useContext(ModalContext);

  const networkPrefix = useGetChainPrefixBySlug(chain);

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

  return (
    <BaseModal
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

        {
          ownStake !== '0' && <MetaInfo.Number
            decimals={decimals}
            label={t('Own stake')}
            suffix={symbol}
            value={ownStake}
            valueColorSchema={'even-odd'}
          />
        }

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
      </MetaInfo>
    </BaseModal>
  );
}

const EarningValidatorDetailModal = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return ({});
});

export default EarningValidatorDetailModal;
