// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _ChainAsset } from '@subwallet/chain-list/types';
import { _STAKING_CHAIN_GROUP } from '@subwallet/extension-base/services/earning-service/constants';
import { YieldPoolInfo, YieldPoolType, YieldPositionInfo } from '@subwallet/extension-base/types';
import { isAccountAll } from '@subwallet/extension-base/utils';
import { Avatar, CollapsiblePanel } from '@subwallet/extension-koni-ui/components';
import { useTranslation } from '@subwallet/extension-koni-ui/hooks';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { toShort } from '@subwallet/extension-koni-ui/utils';
import { Number } from '@subwallet/react-ui';
import CN from 'classnames';
import React, { useMemo } from 'react';
import styled from 'styled-components';

type Props = ThemeProps & {
  compound: YieldPositionInfo;
  poolInfo: YieldPoolInfo;
  inputAsset: _ChainAsset;
};

function Component ({ className, compound,
  inputAsset,
  poolInfo }: Props) {
  const { t } = useTranslation();

  const isAllAccount = useMemo(() => isAccountAll(compound.address), [compound.address]);

  const isRelayChain = useMemo(() => _STAKING_CHAIN_GROUP.relay.includes(poolInfo.chain), [poolInfo.chain]);

  const haveNomination = useMemo(() => {
    return [YieldPoolType.NOMINATION_POOL, YieldPoolType.NATIVE_STAKING].includes(poolInfo.type);
  }, [poolInfo.type]);

  const noNomination = useMemo(
    () => !haveNomination || isAllAccount || !compound.nominations.length,
    [compound.nominations.length, haveNomination, isAllAccount]
  );

  if (noNomination) {
    return null;
  }

  return (
    <CollapsiblePanel
      className={CN(className)}
      initOpen={true}
      title={t('Nomination info')}
    >
      {compound.nominations.map((item) => {
        return (
          <div key={item.validatorAddress}>
            <div>
              <Avatar
                size={24}
                value={item.validatorAddress}
              />
              <div>
                {item.validatorIdentity || toShort(item.validatorAddress)}
              </div>
            </div>
            {!isRelayChain && (
              <Number
                decimal={inputAsset?.decimals || 0}
                decimalOpacity={0.45}
                suffix={inputAsset?.symbol}
                value={item.activeStake}
              />
            )}
          </div>
        );
      })}
    </CollapsiblePanel>
  );
}

export const NominationInfoPart = styled(Component)<Props>(({ theme: { token } }: Props) => ({

}));
