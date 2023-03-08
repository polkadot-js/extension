// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { CONFIRMATION_DETAIL_MODAL } from '@subwallet/extension-koni-ui/constants/modal';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { Button, Icon, ModalContext, SwModal, SwModalProps } from '@subwallet/react-ui';
import CN from 'classnames';
import { XCircle } from 'phosphor-react';
import React, { useCallback, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

interface Props extends ThemeProps {
  children: React.ReactNode | React.ReactNode[];
  title: SwModalProps['title'];
}

const modalId = CONFIRMATION_DETAIL_MODAL;

const closeIcon = (
  <Icon
    phosphorIcon={XCircle}
    weight='fill'
  />
);

const Component: React.FC<Props> = (props: Props) => {
  const { children, className, title } = props;

  const { t } = useTranslation();
  const { inactiveModal } = useContext(ModalContext);

  const onClose = useCallback(() => {
    inactiveModal(modalId);
  }, [inactiveModal]);

  return (
    <SwModal
      className={CN(className)}
      destroyOnClose={true}
      footer={(
        <Button
          block={true}
          icon={closeIcon}
          onClick={onClose}
        >
          {t('Close')}
        </Button>
      )}
      id={modalId}
      onCancel={onClose}
      title={title}
    >
      {children}
    </SwModal>
  );
};

const BaseDetailModal = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {
    '.ant-sw-modal-footer': {
      borderTop: 'none'
    },

    '.__label': {
      textTransform: 'capitalize'
    }
  };
});

export default BaseDetailModal;
