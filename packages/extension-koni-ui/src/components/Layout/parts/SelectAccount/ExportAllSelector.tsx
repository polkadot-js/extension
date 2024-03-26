// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import {AccountJson} from '@subwallet/extension-base/background/types';
import {AccountItemWithName, GeneralEmptyList} from '@subwallet/extension-koni-ui/components';
import {BasicInputWrapper} from '@subwallet/extension-koni-ui/components/Field/Base';
import ExportAllSelectItem
  from '@subwallet/extension-koni-ui/components/Layout/parts/SelectAccount/ExportAllSelectItem';
import {FilterModal} from '@subwallet/extension-koni-ui/components/Modal/FilterModal';
import {EXPORT_ACCOUNTS_PASSWORD_MODAL} from '@subwallet/extension-koni-ui/constants';
import {useDefaultNavigate, useFilterModal} from '@subwallet/extension-koni-ui/hooks';
import {ThemeProps, ValidatorDataType} from '@subwallet/extension-koni-ui/types';
import {isAccountAll} from '@subwallet/extension-koni-ui/utils';
import {getValidatorKey} from '@subwallet/extension-koni-ui/utils/transaction/stake';
import {Button, Icon, InputRef, ModalContext, SwList, SwModal, useExcludeModal} from '@subwallet/react-ui';
import {SwListSectionRef} from '@subwallet/react-ui/es/sw-list';
import {CaretLeft, Export, FadersHorizontal} from 'phosphor-react';
import React, {ForwardedRef, forwardRef, useCallback, useContext, useEffect, useMemo, useRef} from 'react';
import {useTranslation} from 'react-i18next';
import styled from 'styled-components';

interface Props extends ThemeProps, BasicInputWrapper {
  items: AccountJson[];
  showAllAccount: boolean;
}

const FILTER_MODAL_ID = 'nominated-filter-modal';

const filterOptions = [
  {
    label: 'Active validator',
    value: '1'
  },
  {
    label: 'Waiting list',
    value: '2'
  },
  {
    label: 'Locked',
    value: '3'
  },
  {
    label: 'Destroying',
    value: '4'
  }
];
const renderEmpty = () => <GeneralEmptyList />;
const defaultModalId = 'multi-export-account-selector';

const Component = (props: Props, ref: ForwardedRef<InputRef>) => {
  const { className = ''
    , id = defaultModalId
    , items,
    showAllAccount } = props;
  const { t } = useTranslation();
  const { activeModal, checkActive } = useContext(ModalContext);
  const { goBack } = useDefaultNavigate();

  useExcludeModal(id);
  const isActive = checkActive(id);

  const sectionRef = useRef<SwListSectionRef>(null);

  // const { changeValidators,
  //   onApplyChangeValidators,
  //   onCancelSelectValidator,
  //   onChangeSelectedValidator,
  //   onInitValidators } = useSelectValidators(id, chain, maxCount, onChange, isSingleSelect);

  const { filterSelectionMap, onApplyFilter, onChangeFilterOption, onCloseFilterModal, onResetFilter, selectedFilters } = useFilterModal(FILTER_MODAL_ID);

  const filterFunction = useMemo<(item: ValidatorDataType) => boolean>(() => {
    return (item) => {
      if (!selectedFilters.length) {
        return true;
      }

      // todo: logic filter here

      return true;
    };
  }, [selectedFilters]);

  // const onClickItem = useCallback((value: string) => {
  //   onChangeSelectedValidator(value);
  // }, [onChangeSelectedValidator]);

  const renderItem = useCallback((item: AccountJson) => {
    const key = getValidatorKey(item.address);
    const currentAccountIsAll = isAccountAll(item.address);

    if (currentAccountIsAll) {
      if (showAllAccount) {
        return (
          <AccountItemWithName
            address={item.address}
            className='all-account-selection'
            isSelected={true}
          />
        );
      } else {
        return null;
      }
    }

    return (
      // <StakingValidatorItem
      //   apy={item?.expectedReturn?.toString() || '0'}
      //   className={'pool-item'}
      //   isNominated={nominated}
      //   isSelected={selected}
      //   key={key}
      //   onClick={onClickItem}
      //   onClickMoreBtn={onClickMore(item)}
      //   validatorInfo={item}
      // />
      <ExportAllSelectItem
        accountName={item.name || ''}
        address={item.address}
        className={className}
        genesisHash={item.genesisHash}
        isSelected={true}
        source={item.source}
      />
    );
  }, [className]);

  const onClickActionBtn = useCallback(() => {
    activeModal(FILTER_MODAL_ID);
  }, [activeModal]);

  const searchFunction = useCallback((item: ValidatorDataType, searchText: string) => {
    const searchTextLowerCase = searchText.toLowerCase();

    return (
      item.address.toLowerCase().includes(searchTextLowerCase) ||
      (item.identity
        ? item.identity.toLowerCase().includes(searchTextLowerCase)
        : false)
    );
  }, []);

  const onCancelSelectValidator = useCallback(() => {
    alert('hello');
  }, []);
  const onApplyChangeValidators = useCallback(() => {
    alert('hello');
  }, []);

  // useEffect(() => {
  //   const selected = defaultValue;
  //
  //   onChange && onChange({ target: { value: selected } });
  // }, [defaultValue, onChange]);

  useEffect(() => {
    if (!isActive) {
      onResetFilter();
    }
  }, [isActive, onResetFilter]);

  const exportAllAccounts = useCallback(() => {
    activeModal(EXPORT_ACCOUNTS_PASSWORD_MODAL);
  }, [activeModal]);

  return (
    <>
      <SwModal
        className={`${className} modal-full`}
        closeIcon={(
          <Icon
            phosphorIcon={CaretLeft}
            size='md'
          />
        )}
        footer={(
          <Button
            block
            disabled={false}
            icon={(
              <Icon
                phosphorIcon={Export}
                weight={'fill'}
              />
            )}
            onClick={exportAllAccounts}
          >
            {t('Export ... account')}
          </Button>
        )}
        id={id}
        onCancel={goBack}
        title={t('Export account')}
      >
        <SwList.Section
          actionBtnIcon={<Icon phosphorIcon={FadersHorizontal} />}
          enableSearchInput={true}
          filterBy={filterFunction}
          list={items}
          onClickActionBtn={onClickActionBtn}
          ref={sectionRef}
          renderItem={renderItem}
          renderWhenEmpty={renderEmpty}
          searchFunction={searchFunction}
          searchMinCharactersCount={2}
          searchPlaceholder={t<string>('Account name')}
          // showActionBtn
        />
      </SwModal>

      <FilterModal
        id={FILTER_MODAL_ID}
        onApplyFilter={onApplyFilter}
        onCancel={onCloseFilterModal}
        onChangeOption={onChangeFilterOption}
        optionSelectionMap={filterSelectionMap}
        options={filterOptions}
      />
    </>
  );
};

const ExportAllSelector = styled(forwardRef(Component))<Props>(({ theme: { token } }: Props) => {
  return {
    '.ant-sw-modal-header': {
      paddingTop: token.paddingXS,
      paddingBottom: token.paddingLG
    },

    '.ant-sw-modal-body': {
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column'
    },

    '.ant-sw-modal-footer': {
      margin: 0,
      marginTop: token.marginXS,
      borderTop: 0,
      marginBottom: token.margin
    },

    '.pool-item:not(:last-child)': {
      marginBottom: token.marginXS
    }
  };
});

export default ExportAllSelector;
