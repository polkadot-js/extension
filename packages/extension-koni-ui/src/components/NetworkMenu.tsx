import type {ThemeProps} from '../types';
import React, {useCallback, useEffect, useState} from 'react';
import styled from 'styled-components';
import Menu from "@polkadot/extension-koni-ui/components/Menu";
import useGenesisHashOptions from "@polkadot/extension-koni-ui/hooks/useGenesisHashOptions";
import check from "@polkadot/extension-koni-ui/assets/check.svg";
import {getLogoByGenesisHash} from "@polkadot/extension-koni-ui/util/logoByGenesisHashMap";
import InputFilter from "@polkadot/extension-koni-ui/components/InputFilter";
import useTranslation from "@polkadot/extension-koni-ui/hooks/useTranslation";

interface Props extends ThemeProps {
  className?: string;
  reference: React.MutableRefObject<null>;
  onFilter?: (filter: string) => void;
  closeSetting?: () => void;
  currentNetwork?: string;
  selectNetwork: (genesisHash: string, networkPrefix: number, icon: String, networkName: string) => void;
  isNotHaveAccount?: boolean;
}

function KoniNetworkMenu ({ className, reference, currentNetwork, selectNetwork, isNotHaveAccount, onFilter }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  let genesisOptions = useGenesisHashOptions();
  const [filteredGenesisOptions, setFilteredGenesisOption] = useState(genesisOptions);
  const [filteredNetwork, setFilteredNetwork] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('');
  const filterCategories = [
    {
      text: "All",
      type: ""
    },
    {
      text: "Relaychains",
      type: "RELAY_CHAIN"
    },
    {
      text: "DOT Chains",
      type: "POLKADOT_PARACHAIN"
    },
    {
      text: "KSM Chains",
      type: "KUSAMA_PARACHAIN"
    }
  ]
  if (isNotHaveAccount) {
    genesisOptions = useGenesisHashOptions().slice(0, 1);
  }

  useEffect(() => {
    if (filteredNetwork) {
      if (selectedGroup && selectedGroup.length) {
        setFilteredGenesisOption(genesisOptions.filter(network => network.text.toLowerCase().includes(filteredNetwork) && network.group === selectedGroup))
      } else {
        setFilteredGenesisOption(genesisOptions.filter(network => network.text.toLowerCase().includes(filteredNetwork)))
      }

    } else {
      if (selectedGroup && selectedGroup.length) {
        setFilteredGenesisOption(genesisOptions.filter(network => network.group === selectedGroup));
      } else {
        setFilteredGenesisOption(genesisOptions);
      }
    }
  }, [filteredNetwork, selectedGroup])

  const _onChangeFilter = useCallback((filter: string) => {
    setFilteredNetwork(filter);
    onFilter && onFilter(filter);
  }, [])



  const _selectGroup = useCallback(
    (type): void => {
      setSelectedGroup(type);
      if (type && type.length) {
        setFilteredGenesisOption(genesisOptions.filter(f => f.group === type && f.text.toLowerCase().includes(filteredNetwork)));
      } else {
        setFilteredGenesisOption(genesisOptions.filter(f => f.text.toLowerCase().includes(filteredNetwork)));
      }
    },
    [selectedGroup]
  )

  return (
    <Menu
      className={className}
      reference={reference}
    >
      <div className='network-item-list-header'>
        <span>{t<string>('Network')}</span>
        <InputFilter
          onChange={_onChangeFilter}
          placeholder={t<string>('Search network...')}
          value={filteredNetwork}
          withReset
        />
      </div>
      <div className='network-filter-list'>

        {filterCategories.map(({text, type}) : React.ReactNode => (
          <div key={text} onClick={() => {_selectGroup(type)}}
               className={type === selectedGroup ? 'network-filter-item__selected-text' : 'network-filter-item__text'}>
              {text}
          </div>
        ))}
      </div>
      <div className='network-item-list'>
        {
          filteredGenesisOptions && filteredGenesisOptions.length ?
            filteredGenesisOptions.map(({ text, value , networkPrefix, icon, networkName}): React.ReactNode => (
              <div key={value} className='network-item-container' onClick={() => {
                selectNetwork(value, networkPrefix, icon, networkName)
              }}>
                <img src={getLogoByGenesisHash(value)} alt="logo" className={'network-logo'} />

                <span className={value == currentNetwork ? 'koni-network-text__selected': 'koni-network-text'}>{text}</span>
                {value == currentNetwork
                  ?
                  (
                    <img src={check} alt="check" className='checkIcon'/>
                  ) : (
                    <div className='uncheckedItem'/>
                  )
                }
              </div>
            )) :
            <div className='kn-no-result'>No results</div>
        }
      </div>
    </Menu>
  );
}

export default React.memo(styled(KoniNetworkMenu)(({ theme }: Props) => `
  margin-top: 60px;
  right: 15px;
  user-select: none;
  border-radius: 8px;

  .network-item-list-header {
    padding: 10px;
    width: 350px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 20px;
    line-height: 32px;
    font-weight: 500;
    border-bottom: 1px solid ${theme.inputBorderColor};
  }

  .network-filter-list {
    display: flex;
    padding: 10px;
    justify-content: space-between;
  }

  .network-filter-item__text {
    color: ${theme.textColor2};
    cursor: pointer;
  }

  .network-filter-item__selected-text {
    color: ${theme.textColor};
    text-decoration: underline;
    cursor: pointer;
  }

  .kn-no-result {
    color: ${theme.textColor2};
    text-align: center;
  }

  .network-item-list {
    max-height: 275px;
    overflow-y: auto;
    padding: 10px 10px 10px;
  }

  .network-item-container {
    padding: 5px 0;
    cursor: pointer;
    display: flex;
    align-items: center;

    &:hover {
      .koni-network-text {
        color: ${theme.textColor};
      }
    }
  }

  .network-logo {
    min-width: 30px;
    width: 30px;
    height: 30px;
    border-radius: 100%;
    overflow: hidden;
    image-rendering: -webkit-optimize-contrast;
    image-rendering: crisp-edges;
    border: 1px solid #fff;
    background: #fff;
    margin-right: 10px;
  }

  .koni-network-text {
    font-size: 16px;
    line-height: 26px;
    color: ${theme.textColor2};

    &__selected {
      color: ${theme.textColor}
    }
  }

  .checkIcon {
    margin-left: 4px;
  }

  .uncheckedItem {
    width: 14px;
    height: 100%;
    margin-left: 14px;
  }

  .check-radio-wrapper {
    position: relative;
    height: 100%;
    width: 16px;
    display: flex;
    align-items: center;
    margin-right: 11px;
  }

  .check-radio {
    width: 100%;
    height: 16px;
  }

  .check-dot {
    position: absolute;
    width: 10px;
    height: 10px;
    background-color: ${theme.checkDotColor};
    border-radius: 50%;
    top: 3px;
    left: 3px;
  }

`));
