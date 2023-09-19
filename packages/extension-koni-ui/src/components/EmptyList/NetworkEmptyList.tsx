// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ButtonProps, Icon, ModalContext } from '@subwallet/react-ui';
import { ListChecks, PlusCircle } from 'phosphor-react';
import React, { useContext, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import EmptyList from './EmptyList';

interface Props {
  modalId?: string;
}

const NetworkEmptyList: React.FC<Props> = (props: Props) => {
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
      children: t('Add network'),
      shape: 'circle',
      size: 'xs',
      onClick: () => {
        if (modalId) {
          inactiveModal(modalId);
        }

        navigate('/settings/chains/import', { state: { isExternalRequest: false } });
      }
    };
  }, [inactiveModal, modalId, navigate, t]);

  return (
    <EmptyList
      buttonProps={buttonProps}
      emptyMessage={t('Try adding one manually')}
      emptyTitle={t('No networks found')}
      phosphorIcon={ListChecks}
    />
  );
};

export default NetworkEmptyList;
