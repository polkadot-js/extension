// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _ChainAsset } from '@subwallet/chain-list/types';
import { _STAKING_CHAIN_GROUP } from '@subwallet/extension-base/services/earning-service/constants';
import { YieldPositionInfo } from '@subwallet/extension-base/types';
import { Avatar } from '@subwallet/extension-koni-ui/components';
import { EARNING_NOMINATION_MODAL } from '@subwallet/extension-koni-ui/constants';
import useTranslation from '@subwallet/extension-koni-ui/hooks/common/useTranslation';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { toShort } from '@subwallet/extension-koni-ui/utils';
import { Number, SwModal } from '@subwallet/react-ui';
import React, { useMemo } from 'react';
import styled from 'styled-components';

type Props = ThemeProps & {
  onCancel: () => void,
  item: YieldPositionInfo | undefined;
  inputAsset: _ChainAsset;
};

function Component ({ className, inputAsset, item, onCancel }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();

  const isRelayChain = useMemo(() => _STAKING_CHAIN_GROUP.relay.includes(item?.chain || ''), [item?.chain]);

  return (
    <SwModal
      className={className}
      id={EARNING_NOMINATION_MODAL}
      onCancel={onCancel}
      title={t('Nomination info')}
    >
      {item?.nominations.map((nomination) => {
        return (
          <div key={nomination.validatorAddress}>
            <div>
              <Avatar
                size={24}
                value={nomination.validatorAddress}
              />
              <div>
                {nomination.validatorIdentity || toShort(nomination.validatorAddress)}
              </div>
            </div>
            {!isRelayChain && (
              <Number
                decimal={inputAsset?.decimals || 0}
                decimalOpacity={0.45}
                suffix={inputAsset?.symbol}
                value={nomination.activeStake}
              />
            )}
          </div>
        );
      })}
    </SwModal>
  );
}

const EarningPoolDetailModal = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return ({

  });
});

export default EarningPoolDetailModal;
