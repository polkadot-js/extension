// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import EmptyList from "@subwallet-webapp/components/EmptyList";
import { MagnifyingGlass } from "phosphor-react";
import React from "react";
import { useTranslation } from "react-i18next";

const GeneralEmptyList: React.FC = () => {
  const { t } = useTranslation();

  return (
    <EmptyList
      emptyMessage={t("Please change your search criteria try again")}
      emptyTitle={t("No results found")}
      phosphorIcon={MagnifyingGlass}
    />
  );
};

export default GeneralEmptyList;
