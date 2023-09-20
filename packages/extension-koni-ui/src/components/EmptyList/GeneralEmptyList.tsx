// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { MagnifyingGlass } from 'phosphor-react';
import React from 'react';
import { useTranslation } from 'react-i18next';

import EmptyList from './EmptyList';

const GeneralEmptyList: React.FC = () => {
  const { t } = useTranslation();

  return (
    <EmptyList
      emptyMessage={t('Change your search criteria and try again')}
      emptyTitle={t('No results found')}
      phosphorIcon={MagnifyingGlass}
    />
  );
};

export default GeneralEmptyList;
