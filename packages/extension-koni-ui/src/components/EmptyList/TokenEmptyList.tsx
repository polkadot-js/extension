// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ButtonProps, Icon, ModalContext } from '@subwallet/react-ui';
import { Coin, PlusCircle } from 'phosphor-react';
import React, { useContext, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import EmptyList from './EmptyList';

interface Props {
  modalId?: string;
}

const TokenEmptyList: React.FC<Props> = (props: Props) => {
  const { modalId } = props;

  const { t } = useTranslation();
  const navigate = useNavigate();

  const { inactiveModal } = useContext(ModalContext);

  const buttonProps = useMemo((): ButtonProps => {
    return {
      icon: (
        <Icon
          phosphorIcon={PlusCircle}
          weight='fill'
        />
      ),
      children: t('Import token'),
      shape: 'circle',
      size: 'xs',
      onClick: () => {
        if (modalId) {
          inactiveModal(modalId);
        }

        navigate('/settings/tokens/import-token', { state: { isExternalRequest: false } });
      }
    };
  }, [inactiveModal, modalId, navigate, t]);

  return (
    <EmptyList
      buttonProps={buttonProps}
      emptyMessage={t('Add tokens to get started')}
      emptyTitle={t('No tokens found')}
      phosphorIcon={Coin}
    />
  );
};

export default TokenEmptyList;
