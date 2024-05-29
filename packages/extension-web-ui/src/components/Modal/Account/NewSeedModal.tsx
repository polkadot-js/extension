// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { CREATE_ACCOUNT_MODAL, NEW_SEED_MODAL, SEED_PHRASE_MODAL } from '@subwallet/extension-web-ui/constants';
import { useTranslation } from '@subwallet/extension-web-ui/hooks';
import { ThemeProps } from '@subwallet/extension-web-ui/types';
import React from 'react';
import styled from 'styled-components';

import AccountTypeModal from './AccountTypeModal';

type Props = ThemeProps;

const Component: React.FC<Props> = ({ className }: Props) => {
  const { t } = useTranslation();

  return (
    <AccountTypeModal
      className={className}
      id={NEW_SEED_MODAL}
      label={t('Confirm')}
      nextId={SEED_PHRASE_MODAL}
      previousId={CREATE_ACCOUNT_MODAL}
      url={'/accounts/new-seed-phrase'}
    />
  );
};

const NewSeedModal = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {};
});

export default NewSeedModal;
