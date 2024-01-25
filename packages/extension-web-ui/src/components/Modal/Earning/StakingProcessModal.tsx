// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { YieldStepDetail } from '@subwallet/extension-base/background/KoniTypes';
import { BaseModal, EarningProcessItem } from '@subwallet/extension-web-ui/components';
import { STAKING_PROCESS_MODAL } from '@subwallet/extension-web-ui/constants';
import { Theme, ThemeProps } from '@subwallet/extension-web-ui/types';
import { Divider, ModalContext, Typography } from '@subwallet/react-ui';
import React, { useCallback, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import styled, { useTheme } from 'styled-components';

interface Props extends ThemeProps {
  currentStep: number;
  yieldSteps?: YieldStepDetail[];
}

const modalId = STAKING_PROCESS_MODAL;

const Component = ({ className, currentStep, yieldSteps }: Props) => {
  const { t } = useTranslation();
  const { inactiveModal } = useContext(ModalContext);
  const { token } = useTheme() as Theme;
  const onCloseModal = useCallback(() => {
    inactiveModal(modalId);
  }, [inactiveModal]);

  return (
    <BaseModal
      className={className}
      closable
      id={modalId}
      maskClosable
      onCancel={onCloseModal}
      title={t('Earning process')}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: token.paddingSM, paddingTop: token.paddingXS }}>

        <Typography.Text className={'earning-calculator-message'}>{t('Earning process:')}</Typography.Text>

        {
          yieldSteps && yieldSteps.map((item, index) => {
            const isSelected = currentStep === index;

            return (
              <EarningProcessItem
                index={index}
                isSelected={isSelected}
                key={index}
                stepName={item.name}
              />
            );
          })
        }
        <Divider style={{ backgroundColor: token.colorBgDivider, marginTop: token.marginSM, marginBottom: token.marginSM }} />

        <Typography.Text style={{ color: token.colorTextLight4 }}>
          {t('All steps in the process are designed based on your available multi-chain assets to optimize fee structure and enhance your overall experience.')}
        </Typography.Text>
      </div>
    </BaseModal>
  );
};

const StakingProcessModal = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {};
});

export default StakingProcessModal;
