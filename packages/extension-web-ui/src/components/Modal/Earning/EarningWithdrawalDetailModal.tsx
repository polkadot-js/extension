// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { BaseModal, MetaInfo } from '@subwallet/extension-web-ui/components';
import { useTranslation } from '@subwallet/extension-web-ui/hooks';
import { ThemeProps } from '@subwallet/extension-web-ui/types';
import { openInNewTab } from '@subwallet/extension-web-ui/utils';
import { Button, Icon, ModalContext } from '@subwallet/react-ui';
import CN from 'classnames';
import { CheckCircle, ProhibitInset } from 'phosphor-react';
import React, { useCallback, useContext } from 'react';
import styled from 'styled-components';

type Props = ThemeProps;
const modalId = 'earning-withdrawal-detail-modal';

function Component ({ className }: Props) {
  const { t } = useTranslation();
  const { inactiveModal } = useContext(ModalContext);
  const onClickViewExplore = useCallback(() => {
    const currentAccount = 'p8DyH23aDbJCpioSXLSv9unX7b1fsF1Wg4FzKuyoPpUwW4yFL';

    if (currentAccount) {
      const subscanSlug = 'dung-nguyen';

      if (subscanSlug) {
        openInNewTab(`https://${subscanSlug}.subscan.io/account/${currentAccount}?tab=reward`)();
      }
    }
  }, []);
  const closeModal = useCallback(() => {
    inactiveModal(modalId);
  }, [inactiveModal]);

  return (
    <BaseModal
      className={CN(className)}
      id={modalId}
      onCancel={closeModal}
      title={'Withdraw info'}
    >
      <MetaInfo
        labelColorScheme='gray'
        labelFontWeight='regular'
        spaceSize='sm'
        valueColorScheme='light'
      >
        <MetaInfo.Number
          decimals={2}
          label={(
            <>
              <span className={'__withdraw-now'}>Withdraw now</span>
              <Icon
                className={'earning-item-stake-btn'}
                iconColor={'#4cd9ac'}
                phosphorIcon={CheckCircle}
                size='sm'
                weight='fill'
              />
            </>
          )}
          suffix={'DOT'}
          value={2008}
        />
        <MetaInfo.Number
          decimals={1}
          label={'9 days until withdraw'}
          suffix={'DOT'}
          value={402}
        />
        <MetaInfo.Number
          decimals={2}
          label={'10 days until withdraw'}
          suffix={'DOT'}
          value={102}
        />
      </MetaInfo>

      <Button
        block={true}
        className={'__cancel-unstake-button'}
        icon={(
          <Icon
            phosphorIcon={ProhibitInset}
            weight={'fill'}
          />
        )}
        onClick={onClickViewExplore}
        size={'xs'}
        type={'ghost'}
      >
        {t('Cancel unstake')}
      </Button>
    </BaseModal>
  );
}

export const EarningWithdrawalDetailModal = styled(Component)<Props>(({ theme: { token } }: Props) => ({
  borderRadius: token.borderRadiusLG,
  backgroundColor: token.colorBgSecondary,
  minHeight: 54,

  '.__part-title': {
    paddingTop: token.padding,
    paddingLeft: token.padding,
    paddingRight: token.padding
  },

  '.__withdraw-now': {
    paddingRight: token.paddingXXS
  },

  '.__separator': {
    height: 2,
    backgroundColor: 'rgba(33, 33, 33, 0.80)',
    marginTop: token.marginSM,
    marginBottom: token.marginSM,
    marginLeft: token.margin,
    marginRight: token.margin
  },

  '.__claim-reward-area': {
    display: 'flex',
    gap: token.sizeSM,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: token.paddingSM,
    paddingLeft: token.padding,
    paddingRight: token.padding
  },

  '.__claim-reward-value': {
    fontSize: token.fontSizeHeading4,
    lineHeight: token.lineHeightHeading4,
    fontWeight: token.headingFontWeight,
    color: token.colorTextLight1,

    '.ant-number-integer': {
      color: 'inherit !important',
      fontSize: 'inherit !important',
      fontWeight: 'inherit !important',
      lineHeight: 'inherit'
    },

    '.ant-number-decimal, .ant-number-suffix': {
      color: `${token.colorTextLight3} !important`,
      fontSize: `${token.fontSizeHeading5}px !important`,
      fontWeight: 'inherit !important',
      lineHeight: token.lineHeightHeading5
    }
  },

  '.__visit-dapp-label': {
    fontSize: token.fontSize,
    lineHeight: token.lineHeight,
    color: token.colorTextLight4
  },

  '.__claim-reward-area + .__separator': {
    marginTop: 0
  },

  '.__separator + .__reward-history-panel': {
    marginTop: -13
  },

  '.__cancel-unstake-button': {
    marginTop: token.marginSM
  }
}));
