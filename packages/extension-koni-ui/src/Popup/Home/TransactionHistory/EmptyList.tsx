import {ThemeProps} from "@polkadot/extension-koni-ui/types";
import styled from "styled-components";
import React from "react";
import useTranslation from "@polkadot/extension-koni-ui/hooks/useTranslation";
import transactionHistoryComingSoon from "../../../assets/transaction-history-coming-soon.png";
interface Props extends ThemeProps {
  className?: string;
}

function TransactionHistoryEmptyList({className}: Props): React.ReactElement<Props> {
  const {t} = useTranslation();
  return (
    <div className={`${className} empty-list transaction-history-empty-list`}>
      <img src={transactionHistoryComingSoon} alt="Empty" className='empty-list__img'/>
      <div className='empty-list__text'>{t<string>('Transactions will appear here')}</div>
    </div>
  );
}

export default styled(TransactionHistoryEmptyList)`
  display: flex;
  align-items: center;
  flex-direction: column;
  position: relative;

  .empty-list__img {
    height: 222px;
    width: auto;
    position: absolute;
    left: 0;
    right: 0;
    top: 20px;
    margin: 0 auto;
  }

  .empty-list__text {
    padding: 215px 15px 0;
    font-size: 15px;
    font-weight: 500;
    line-height: 26px;
    text-align: center;
  }
`;
