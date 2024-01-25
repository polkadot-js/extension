// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ScreenContext } from '@subwallet/extension-web-ui/contexts/ScreenContext';
import { SwModalFuncProps } from '@subwallet/react-ui';
import { useContext, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { useConfirmModal } from '../modal';

const modalId = 'delete-account-modal';

const useDeleteAccount = () => {
  const { t } = useTranslation();
  const { isWebUI } = useContext(ScreenContext);
  const modalProps: SwModalFuncProps = useMemo(() => {
    return {
      closable: true,
      content: isWebUI ? t('If you ever want to use this account again, you would need to import it again with seedphrase, private key, or JSON file') : t('You will no longer be able to access this account via this extension'),
      id: modalId,
      okText: isWebUI ? t('Delete') : t('Remove'),
      subTitle: isWebUI ? t('Delete this account') : t('Remove this account?'),
      title: isWebUI ? t('Remove account') : t('Confirmation'),
      type: 'error'
    };
  }, [isWebUI, t]);

  const { handleSimpleConfirmModal } = useConfirmModal(modalProps);

  return handleSimpleConfirmModal;
};

export default useDeleteAccount;
