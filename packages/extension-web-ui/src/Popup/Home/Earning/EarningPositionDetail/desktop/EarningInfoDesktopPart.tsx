// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { YieldPoolInfo, YieldPoolType, YieldPositionInfo } from '@subwallet/extension-base/types';
import { BaseModal, MetaInfo } from '@subwallet/extension-web-ui/components';
import { EarningStatusUi, TRANSACTION_YIELD_UNSTAKE_MODAL } from '@subwallet/extension-web-ui/constants';
import { ScreenContext } from '@subwallet/extension-web-ui/contexts/ScreenContext';
import { useTranslation } from '@subwallet/extension-web-ui/hooks';
import Transaction from '@subwallet/extension-web-ui/Popup/Transaction/Transaction';
import Unbond from '@subwallet/extension-web-ui/Popup/Transaction/variants/Unbond';
import { ThemeProps } from '@subwallet/extension-web-ui/types';
import { Button, Icon, ModalContext } from '@subwallet/react-ui';
import CN from 'classnames';
import { MinusCircle, PlusCircle } from 'phosphor-react';
import React, { useCallback, useContext } from 'react';
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
            statusIcon={EarningStatusUi[compound.status].icon}
            statusName={EarningStatusUi[compound.status].name}
            valueColorSchema={EarningStatusUi[compound.status].schema}
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
            className={'__left-item -ghost-type-3'}
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
            className={'__right-item -ghost-type-3'}
            disabled={poolInfo.chain === 'parallel' && poolInfo.type === YieldPoolType.LIQUID_STAKING}
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
  flexBasis: 384,

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
