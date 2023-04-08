// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { SettingItemSelection } from "@subwallet-webapp/components/Setting/SettingItemSelection";
import { ThemeProps } from "@subwallet-webapp/types";
import { BackgroundIcon, SwModal } from "@subwallet/react-ui";
import { SortAscending } from "phosphor-react";
import React from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";

export type OptionType = {
  label: string;
  value: string;
};

type Props = ThemeProps & {
  id: string;
  onCancel: () => void;
  title?: string;
  optionSelection: string;
  options: OptionType[];
  onChangeOption: (value: string) => void;
};

function Component(props: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const {
    className = "",
    id,
    onCancel,
    onChangeOption,
    optionSelection,
    options,
    title,
  } = props;

  return (
    <SwModal
      className={className}
      id={id}
      onCancel={onCancel}
      title={title || t("Sorting")}
    >
      <div className={"__options-container"}>
        {options.map((option) => (
          <SettingItemSelection
            className={"sorting-item"}
            isSelected={optionSelection === option.value}
            key={option.value}
            label={option.label}
            leftItemIcon={
              <BackgroundIcon phosphorIcon={SortAscending} size={"sm"} />
            }
            // eslint-disable-next-line react/jsx-no-bind
            onClickItem={() => onChangeOption(option.value)}
          />
        ))}
      </div>
    </SwModal>
  );
}

export const SortingModal = styled(Component)<Props>(
  ({ theme: { token } }: Props) => {
    return {
      ".ant-sw-modal-body": {
        paddingBottom: 12,
      },

      ".sorting-item:not(:last-child)": {
        marginBottom: token.marginXS,
      },
    };
  }
);
