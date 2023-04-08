// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { BasicOnChangeFunction } from "@subwallet-webapp/components/Field/Base";
import { ModalContext } from "@subwallet/react-ui";
import { useCallback, useContext, useState } from "react";

export function useSelectValidators(
  modalId: string,
  maxCount: number,
  onChange?: BasicOnChangeFunction,
  isSingleSelect?: boolean
) {
  const [defaultSelected, setDefaultSelected] = useState<string[]>([]);
  const [changeValidators, setChangeValidators] = useState<string[]>([]);
  const { inactiveModal } = useContext(ModalContext);

  const onChangeSelectedValidator = useCallback(
    (changeVal: string) => {
      setChangeValidators((changeValidators) => {
        let result: string[];

        if (!changeValidators.includes(changeVal)) {
          if (
            (isSingleSelect ? defaultSelected : changeValidators).length >=
            maxCount
          ) {
            return changeValidators;
          }

          if (isSingleSelect) {
            result = [...defaultSelected, changeVal];
          } else {
            result = [...changeValidators, changeVal];
          }

          return result;
        } else {
          result = changeValidators.filter((item) => item !== changeVal);

          return result;
        }
      });
    },
    [defaultSelected, isSingleSelect, maxCount]
  );

  const onApplyChangeValidators = useCallback(() => {
    onChange && onChange({ target: { value: changeValidators.join(",") } });

    inactiveModal(modalId);
  }, [changeValidators, inactiveModal, modalId, onChange]);

  const onCancelSelectValidator = useCallback(() => {
    setChangeValidators(defaultSelected);
    inactiveModal(modalId);
  }, [defaultSelected, inactiveModal, modalId]);

  const onInitValidators = useCallback((selected: string) => {
    if (!selected) {
      setDefaultSelected([]);
      setChangeValidators([]);
    } else {
      setDefaultSelected(selected.split(","));
      setChangeValidators(selected.split(","));
    }
  }, []);

  return {
    onChangeSelectedValidator,
    changeValidators,
    onApplyChangeValidators,
    onCancelSelectValidator,
    onInitValidators,
  };
}
