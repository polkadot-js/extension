// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { EarningStatus, YieldPoolInfo, YieldPoolType, YieldPositionInfo } from '@subwallet/extension-base/types';
import { BaseModal, MetaInfo } from '@subwallet/extension-web-ui/components';
import { StakingStatusUi, TRANSACTION_YIELD_UNSTAKE_MODAL } from '@subwallet/extension-web-ui/constants';
import { ScreenContext } from '@subwallet/extension-web-ui/contexts/ScreenContext';
import { useTranslation } from '@subwallet/extension-web-ui/hooks';
import Transaction from '@subwallet/extension-web-ui/Popup/Transaction/Transaction';
import Unbond from '@subwallet/extension-web-ui/Popup/Transaction/variants/Unbond';
import { ThemeProps } from '@subwallet/extension-web-ui/types';
import { Button, Icon, ModalContext } from '@subwallet/react-ui';
import CN from 'classnames';
import { MinusCircle, PlusCircle } from 'phosphor-react';
import React, { useCallback, useContext, useMemo } from 'react';
import styled from 'styled-components';

type Props = ThemeProps & {
  poolInfo: YieldPoolInfo;
  compound: YieldPositionInfo;
  onLeavePool: VoidFunction;
  onEarnMore: VoidFunction;
};

function Component ({ className, compound, onEarnMore, onLeavePool,
  poolInfo }: Props) {
  const { t } = useTranslation();
  const { inactiveModal } = useContext(ModalContext);
  const { isWebUI } = useContext(ScreenContext);

  const earningStatus = useMemo(() => {
    const stakingStatusUi = StakingStatusUi;
    const status = compound.status;

    if (status === EarningStatus.EARNING_REWARD) {
      return stakingStatusUi.active;
    }

    if (status === EarningStatus.PARTIALLY_EARNING) {
      return stakingStatusUi.partialEarning;
    }

    if (status === EarningStatus.WAITING) {
      return stakingStatusUi.waiting;
    }

    return stakingStatusUi.inactive;
  }, [compound.status]);

  const handleCloseUnstake = useCallback(() => {
    inactiveModal(TRANSACTION_YIELD_UNSTAKE_MODAL);
  }, [inactiveModal]);

  return (
    <>
      <div
        className={CN(className, '__earning-info-desktop-part')}
      >
        <MetaInfo
          labelColorScheme='gray'
          labelFontWeight='regular'
          spaceSize='sm'
        >
          <MetaInfo.Status
            label={t('Earning status')}
            statusIcon={earningStatus.icon}
            statusName={earningStatus.name}
            valueColorSchema={earningStatus.schema}
          />
          <MetaInfo.Chain
            chain={poolInfo.chain}
            label={t('Network')}
            valueColorSchema='gray'
          />
        </MetaInfo>
        <div className='__separator' />
        <div className={'__earning-actions'}>
          <Button
            block={true}
            icon={(
              <Icon
                phosphorIcon={MinusCircle}
                weight='fill'
              />
            )}
            onClick={onLeavePool}
            type={'ghost'}
          >
            {poolInfo.type === YieldPoolType.LENDING ? t('Withdraw') : t('Unstake')}
          </Button>

          <Button
            block={true}
            icon={(
              <Icon
                phosphorIcon={PlusCircle}
                weight='fill'
              />
            )}
            onClick={onEarnMore}
            type={'ghost'}
          >
            {poolInfo.type === YieldPoolType.LENDING ? t('Supply more') : t('Stake more')}
          </Button>
        </div>
      </div>
      <BaseModal
        className={'right-side-modal'}
        destroyOnClose={true}
        id={TRANSACTION_YIELD_UNSTAKE_MODAL}
        onCancel={handleCloseUnstake}
        title={t('Unstake')}
      >
        <Transaction
          modalContent={isWebUI}
          modalId={TRANSACTION_YIELD_UNSTAKE_MODAL}
        >
          <Unbond />
        </Transaction>
      </BaseModal>
    </>
  );
}

export const EarningInfoDesktopPart = styled(Component)<Props>(({ theme: { token } }: Props) => ({
  borderRadius: token.borderRadiusLG,
  backgroundColor: token.colorBgSecondary,
  paddingTop: token.padding,
  paddingLeft: 24,
  paddingRight: 24,
  flex: 1,

  '.__separator': {
    height: 2,
    backgroundColor: 'rgba(33, 33, 33, 0.80)',
    marginTop: token.marginSM,
    marginBottom: token.marginSM
  },

  '.__label.__label': {
    color: token.colorWhite
  },

  '.__earning-actions': {
    display: 'flex',
    gap: token.sizeSM
  }
}));
