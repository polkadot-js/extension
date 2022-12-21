// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { Button, Checkbox } from '@subwallet/extension-koni-ui/components';
import AccountInfo from '@subwallet/extension-koni-ui/components/AccountInfo';
import Loading from '@subwallet/extension-koni-ui/components/Loading';
import useGetAccountByAddress from '@subwallet/extension-koni-ui/hooks/useGetAccountByAddress';
import useTranslation from '@subwallet/extension-koni-ui/hooks/useTranslation';
import { getListDeriveAccounts } from '@subwallet/extension-koni-ui/messaging';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { DeriveAccount } from '@subwallet/extension-koni-ui/types/derive';
import CN from 'classnames';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import InfiniteScroll from 'react-infinite-scroll-component';
import styled from 'styled-components';

interface Props extends ThemeProps {
  parentAddress: string;
  setStep: (val: number) => void;
  setDeriveAccounts: (values: DeriveAccount[]) => void;
}

interface DeriveItem extends DeriveAccount {
  selected: boolean;
}

const LIMIT_PER_PAGE = 20;

const AutoPath = ({ className, parentAddress, setDeriveAccounts, setStep }: Props) => {
  const { t } = useTranslation();

  const parentAccount = useGetAccountByAddress(parentAddress);
  const parentName = useMemo((): string => parentAccount?.name || '', [parentAccount]);

  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<DeriveItem[]>([]);

  const onClickItem = useCallback((address: string): () => void => {
    return () => {
      setItems((items) => {
        const result = [...items];

        const exist = result.find((i) => i.address === address);

        if (exist) {
          exist.selected = !exist.selected;
        }

        return result;
      });
    };
  }, []);

  const onNext = useCallback(() => {
    const result: DeriveAccount[] = items
      .filter((i) => i.selected)
      .map((i) => ({
        name: i.name,
        suri: i.suri,
        address: i.address
      }));

    setDeriveAccounts(result);
    setStep(3);
  }, [setStep, items, setDeriveAccounts]);

  const onLoadMore = useCallback(() => {
    if (!loading) {
      setLoading(true);
      setPage((page) => page + 1);
    }
  }, [loading]);

  useEffect(() => {
    setPage(1);
    setItems([]);
  }, [parentAddress]);

  useEffect(() => {
    let amount = true;

    getListDeriveAccounts({
      page: page,
      limit: LIMIT_PER_PAGE,
      parentAddress: parentAddress
    })
      .then((res) => {
        if (amount) {
          setItems((items) => {
            const result = [...items];

            result.push(...res.result.map((item) => {
              const paths = item.suri.split('//');
              const index = paths[1] || '0';
              const name = `${parentName} ${index}`;

              return {
                name: name,
                address: item.address,
                suri: item.suri,
                selected: false
              };
            }));

            return result;
          });
        }
      })
      .catch(console.error)
      .finally(() => {
        if (amount) {
          setLoading(false);
        }
      });

    return () => {
      amount = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, parentName]);

  return (
    <div className={CN(className)}>
      <div
        className={CN('body-container')}
        id='scrollableDiv'
      >
        <InfiniteScroll
          className={'items-container'}
          dataLength={items.length}
          hasMore={true}
          loader={<div />}
          next={onLoadMore}
          scrollableTarget='scrollableDiv'
        >
          {
            items.map((item) => {
              return (
                <div
                  className={CN('item-row')}
                  key={item.address}
                  onClick={onClickItem(item.address)}
                >
                  <Checkbox
                    checked={item.selected}
                    label={''}
                    onClick={onClickItem(item.address)}
                  />
                  <AccountInfo
                    address={item.address}
                    className='derive-account-info'
                    name={item.name}
                    parentName={parentAccount?.name}
                    showCopyBtn={false}
                    suri={item.suri}
                  />
                </div>
              );
            })
          }
          {loading && <Loading className={'loading'} />}
        </InfiniteScroll>
      </div>
      <div className={CN('footer-container')}>
        <Button
          className='next-step-btn'
          data-button-action='create derived account'
          isDisabled={!items.filter((i) => i.selected).length}
          onClick={onNext}
        >
          {t<string>('Next')}
        </Button>
      </div>
    </div>
  );
};

export default React.memo(styled(AutoPath)(({ theme }: Props) => `
  padding: 25px 15px 15px;
  flex: 1;
  overflow-y: hidden;
  display: flex;
  flex-direction: column;

  .body-container {
    flex: 1;
    position: relative;
    padding: 0 15px;
    margin: 0 -15px;
    border-bottom: solid 1px ${theme.boxBorderColor};
    display: flex;
    flex-direction: column;
    overflow: auto;
    scrollbar-width: thin;
  }

  .items-container {
    padding: 0 15px;
    margin: 0 -15px;

    .item-row {
      display: flex;
      flex-direction: row;
      align-items: center;
      cursor: pointer;
      margin-bottom: 8px;
    }

    .derive-account-info {
      padding: 2px 14px;
      border: 2px solid ${theme.borderColor2};
      border-radius: 8px;
    }

    .loading {
      height: 32px;
      width: 32px;
      margin: auto;
      margin-bottom: 8px;
    }
  }

  .footer-container {
    margin: 20px 0 5px;
  }
`));
