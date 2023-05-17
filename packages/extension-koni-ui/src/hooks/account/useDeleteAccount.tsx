// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { SwModalFuncProps } from '@subwallet/react-ui';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { useConfirmModal } from '../modal';

const modalId = 'delete-account-modal';

const useDeleteAccount = () => {
  const { t } = useTranslation();

  const modalProps: SwModalFuncProps = useMemo(() => {
    return {
      closable: true,
      content: t('You will no longer be able to access this account via this extension'),
      id: modalId,
      okText: t('Remove'),
      subTitle: t('Remove this account?'),
      title: t('Confirmation'),
      type: 'error'
    };
  }, [t]);

  const { handleSimpleConfirmModal } = useConfirmModal(modalProps);

  return handleSimpleConfirmModal;
};

export default useDeleteAccount;
