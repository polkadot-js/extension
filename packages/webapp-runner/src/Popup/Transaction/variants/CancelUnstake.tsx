// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import {
  ExtrinsicType,
  StakingType,
} from "@subwallet/extension-base/background/KoniTypes";
import {
  AccountSelector,
  CancelUnstakeSelector,
  PageWrapper,
} from "@subwallet-webapp/components";
import { DataContext } from "@subwallet-webapp/contexts/DataContext";
import {
  useDefaultNavigate,
  useGetNominatorInfo,
  usePreCheckReadOnly,
  useSelector,
} from "@subwallet-webapp/hooks";
import { submitStakeCancelWithdrawal } from "@subwallet-webapp/messaging";
import {
  FormCallbacks,
  FormFieldData,
  ThemeProps,
} from "@subwallet-webapp/types";
import {
  convertFieldToObject,
  isAccountAll,
  simpleCheckForm,
} from "@subwallet-webapp/util";
import { Button, Form, Icon } from "@subwallet/react-ui";
import { ArrowCircleRight, XCircle } from "phosphor-react";
import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router";
import styled from "styled-components";

import { FreeBalance, TransactionContent, TransactionFooter } from "../parts";
import { TransactionContext, TransactionFormBaseProps } from "../Transaction";

type Props = ThemeProps;

enum FormFieldName {
  UNSTAKE = "unstake",
}

interface CancelUnstakeFormProps extends TransactionFormBaseProps {
  [FormFieldName.UNSTAKE]: string;
}

const Component: React.FC<Props> = (props: Props) => {
  const { className = "" } = props;

  const { chain: stakingChain, type: _stakingType } = useParams();
  const stakingType = _stakingType as StakingType;

  const dataContext = useContext(DataContext);
  const { asset, chain, from, onDone, setChain, setFrom, setTransactionType } =
    useContext(TransactionContext);

  const { currentAccount, isAllAccount } = useSelector(
    (state) => state.accountState
  );

  const { goHome } = useDefaultNavigate();

  const nominatorInfo = useGetNominatorInfo(stakingChain, stakingType, from);
  const nominatorMetadata = nominatorInfo[0];

  const [isDisable, setIsDisable] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);

  const [form] = Form.useForm<CancelUnstakeFormProps>();
  const formDefault = useMemo(
    (): CancelUnstakeFormProps => ({
      from: from,
      chain: chain,
      asset: asset,
      [FormFieldName.UNSTAKE]: "",
    }),
    [asset, chain, from]
  );

  const onFieldsChange: FormCallbacks<CancelUnstakeFormProps>["onFieldsChange"] =
    useCallback(
      (changedFields: FormFieldData[], allFields: FormFieldData[]) => {
        // TODO: field change
        const { empty, error } = simpleCheckForm(allFields);

        const changesMap =
          convertFieldToObject<CancelUnstakeFormProps>(changedFields);

        const { from } = changesMap;

        if (from !== undefined) {
          setFrom(from);
        }

        setIsDisable(empty || error);
      },
      [setFrom]
    );

  const { t } = useTranslation();

  const onSubmit: FormCallbacks<CancelUnstakeFormProps>["onFinish"] =
    useCallback(
      (values: CancelUnstakeFormProps) => {
        setLoading(true);

        const { [FormFieldName.UNSTAKE]: unstakeIndex } = values;

        setTimeout(() => {
          submitStakeCancelWithdrawal({
            address: from,
            chain: chain,
            selectedUnstaking:
              nominatorMetadata.unstakings[parseInt(unstakeIndex)],
          })
            .then((result) => {
              const { errors, extrinsicHash, warnings } = result;

              if (errors.length || warnings.length) {
                setLoading(false);
                setErrors(errors.map((e) => e.message));
                setWarnings(warnings.map((w) => w.message));
              } else if (extrinsicHash) {
                onDone(extrinsicHash);
              }
            })
            .catch((error: Error) => {
              setLoading(false);
              setErrors([error.message]);
            });
        }, 300);
      },
      [chain, from, nominatorMetadata.unstakings, onDone]
    );

  const onPreCheckReadOnly = usePreCheckReadOnly(from);

  useEffect(() => {
    const address = currentAccount?.address || "";

    if (address) {
      if (!isAccountAll(address)) {
        setFrom(address);
      }
    }
  }, [currentAccount?.address, setFrom]);

  useEffect(() => {
    setChain(stakingChain || "");
    setTransactionType(ExtrinsicType.STAKING_CANCEL_UNSTAKE);
  }, [setChain, setTransactionType, stakingChain]);

  return (
    <>
      <TransactionContent>
        <PageWrapper resolve={dataContext.awaitStores(["staking"])}>
          <Form
            className={`${className} form-container form-space-sm`}
            form={form}
            initialValues={formDefault}
            onFieldsChange={onFieldsChange}
            onFinish={onSubmit}
          >
            {isAllAccount && (
              <Form.Item name={"from"}>
                <AccountSelector />
              </Form.Item>
            )}
            <FreeBalance
              address={from}
              chain={chain}
              className={"free-balance"}
              label={t("Available balance:")}
            />
            <Form.Item name={FormFieldName.UNSTAKE}>
              <CancelUnstakeSelector
                chain={chain}
                disabled={!from}
                label={t("Select unstake request")}
                nominators={from ? nominatorMetadata?.unstakings || [] : []}
              />
            </Form.Item>
          </Form>
        </PageWrapper>
      </TransactionContent>
      <TransactionFooter errors={errors} warnings={warnings}>
        <Button
          disabled={loading}
          icon={<Icon phosphorIcon={XCircle} weight="fill" />}
          onClick={goHome}
          schema={"secondary"}
        >
          {t("Cancel")}
        </Button>

        <Button
          disabled={isDisable}
          icon={<Icon phosphorIcon={ArrowCircleRight} weight="fill" />}
          loading={loading}
          onClick={onPreCheckReadOnly(form.submit)}
        >
          {t("Continue")}
        </Button>
      </TransactionFooter>
    </>
  );
};

const CancelUnstake = styled(Component)<Props>(
  ({ theme: { token } }: Props) => {
    return {
      ".unstaked-field, .free-balance": {
        marginBottom: token.marginXS,
      },

      ".meta-info": {
        marginTop: token.paddingSM,
      },

      ".cancel-unstake-info-item > .__col": {
        flex: "initial",
        paddingRight: token.paddingXXS,
      },
    };
  }
);

export default CancelUnstake;
