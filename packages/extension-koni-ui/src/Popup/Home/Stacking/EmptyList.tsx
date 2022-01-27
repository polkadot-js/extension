import React from "react";
import styled from "styled-components";
import {ThemeProps} from "@polkadot/extension-koni-ui/types";
import stackingEmptyData from "@polkadot/extension-koni-ui/assets/stacking-empty-list.png";
import useTranslation from "@polkadot/extension-koni-ui/hooks/useTranslation";

interface Props extends ThemeProps {
  className?: string;
}

function StackingEmptyList({className}: Props): React.ReactElement {
  const {t} = useTranslation();
  return (
    <div className={`${className} empty-list stacking-empty-list`}>
      <img src={stackingEmptyData} alt="Empty" className='empty-list__img'/>
      <div className='empty-list__text'>{t<string>('No staking data was recorded')}</div>
    </div>
  );
}

export default styled(StackingEmptyList)`
  display: flex;
  align-items: center;
  flex-direction: column;
  position: relative;

  .empty-list__img {
    height: 168px;
    width: auto;
    position: absolute;
    left: 0;
    right: 0;
    top: 35px;
    margin: 0 auto;
  }

  .empty-list__text {
    padding: 215px 15px 0;
    font-size: 15px;
    line-height: 26px;
    text-align: center;
    font-weight: 500;
  }
`
