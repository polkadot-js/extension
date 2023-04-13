// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { MetaInfo } from '@subwallet/extension-koni-ui/components';
import { VALIDATOR_DETAIL_MODAL } from '@subwallet/extension-koni-ui/constants';
import useTranslation from '@subwallet/extension-koni-ui/hooks/common/useTranslation';
import { ValidatorDataType } from '@subwallet/extension-koni-ui/hooks/screen/staking/useGetValidatorList';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { ModalContext, SwModal } from '@subwallet/react-ui';
import React, { useCallback, useContext } from 'react';
import styled from 'styled-components';

type Props = ThemeProps & {
  onCancel?: () => void;
  validatorItem: ValidatorDataType;
};

function Component (props: Props): React.ReactElement<Props> {
  const { className, onCancel, validatorItem } = props;
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

  const _onCancel = useCallback(() => {
    inactiveModal(VALIDATOR_DETAIL_MODAL);

    onCancel && onCancel();
  }, [inactiveModal, onCancel]);

  return (
    <SwModal
      className={className}
      id={VALIDATOR_DETAIL_MODAL}
      onCancel={_onCancel}
      title={t('Validator details')}
    >
      <MetaInfo
        hasBackgroundWrapper
        spaceSize={'xs'}
        valueColorScheme={'light'}
      >
        <MetaInfo.Account
          address={validatorAddress}
          label={t('Validator')}
          name={validatorName}
        />

        {/* <MetaInfo.Status */}
        {/*  label={t('Status')} */}
        {/*  statusIcon={StakingStatusUi[status].icon} */}
        {/*  statusName={StakingStatusUi[status].name} */}
        {/*  valueColorSchema={StakingStatusUi[status].schema} */}
        {/* /> */}

        <MetaInfo.Number
          decimals={decimals}
          label={t('Min stake')}
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
            label={t('Other stake')}
            suffix={symbol}
            value={otherStake}
            valueColorSchema={'even-odd'}
          />
        }

        {
          earningEstimated > 0 && earningEstimated !== '' && <MetaInfo.Number
            label={t('Earning estimated')}
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
    </SwModal>
  );
}

export const ValidatorDetailModal = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return ({});
});
