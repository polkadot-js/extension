// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { SettingItemSelection } from '@subwallet/extension-koni-ui/components/Setting/SettingItemSelection';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { BackgroundIcon, Button, Icon, ModalContext, SwModal } from '@subwallet/react-ui';
import { ArrowsClockwise, SortAscending, SortDescending } from 'phosphor-react';
import React, { useCallback, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

export type OptionType = {
  label: string;
  value: string;
  desc?: boolean;
};

interface Props extends ThemeProps {
  id: string;
  onCancel?: () => void;
  title?: string;
  optionSelection: string;
  options: OptionType[];
  onChangeOption: (value: string) => void;
  onReset?: () => void;
}

function Component (props: Props): React.ReactElement<Props> {
  const { className = '', id, onCancel, onChangeOption, onReset, optionSelection, options, title } = props;

  const { t } = useTranslation();

  const { inactiveModal } = useContext(ModalContext);

  const _onCancel = useCallback(() => {
    inactiveModal(id);
    onCancel && onCancel();
  }, [id, inactiveModal, onCancel]);

  const onSelectOption = useCallback((value: string) => {
    return () => {
      inactiveModal(id);
      onChangeOption(value);
    };
  }, [id, inactiveModal, onChangeOption]);

  const _onReset = useCallback(() => {
    inactiveModal(id);
    onReset && onReset();
  }, [id, inactiveModal, onReset]);

  return (
    <SwModal
      className={className}
      id={id}
      onCancel={_onCancel}
      title={title || t('Sorting')}
    >
      <div className={'__options-container'}>
        {
          options.map((option) => (
            <SettingItemSelection
              className={'sorting-item'}
              isSelected={optionSelection === option.value}
              key={option.value}
              label={option.label}
              leftItemIcon={
                <BackgroundIcon
                  phosphorIcon={ !option.desc ? SortDescending : SortAscending}
                  size='sm'
                  weight='bold'
                />
              }
              onClickItem={onSelectOption(option.value)}
            />
          ))
        }
        {
          onReset && (
            <Button
              block={true}
              icon={(
                <Icon
                  phosphorIcon={ArrowsClockwise}
                />
              )}
              onClick={_onReset}
            >
              {t('Reset sorting')}
            </Button>
          )
        }
      </div>
    </SwModal>
  );
}

export const SortingModal = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return ({
    '.ant-sw-modal-body': {
      paddingBottom: 12
    },

    '.sorting-item:not(:last-child)': {
      marginBottom: token.marginXS
    }
  });
});
