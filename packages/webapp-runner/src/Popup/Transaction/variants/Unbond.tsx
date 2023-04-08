// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _ChainInfo } from "@subwallet/chain-list/types";
import {
  ExtrinsicType,
  NominationInfo,
  NominatorMetadata,
  RequestStakePoolingUnbonding,
  RequestUnbondingSubmit,
  StakingType,
} from "@subwallet/extension-base/background/KoniTypes";
import { AccountJson } from "@subwallet/extension-base/background/types";
import { isActionFromValidator } from "@subwallet/extension-base/koni/api/staking/bonding/utils";
import { SWTransactionResponse } from "@subwallet/extension-base/services/transaction-service/types";
import {
  AccountSelector,
  AmountInput,
  NominationSelector,
  PageWrapper,
} from "@subwallet-webapp/components";
import { BN_ZERO } from "@subwallet-webapp/constants";
import { DataContext } from "@subwallet-webapp/contexts/DataContext";
import {
  useGetChainStakingMetadata,
  useGetNativeTokenBasicInfo,
  useGetNominatorInfo,
  useHandleSubmitTransaction,
  usePreCheckReadOnly,
  useSelector,
} from "@subwallet-webapp/hooks";
import {
  submitPoolUnbonding,
  submitUnbonding,
} from "@subwallet-webapp/messaging";
import {
  FormCallbacks,
  FormFieldData,
  ThemeProps,
} from "@subwallet-webapp/types";
import {
  convertFieldToObject,
  isAccountAll,
  simpleCheckForm,
  validateUnStakeValue,
} from "@subwallet-webapp/util";
import { Button, Form, Icon } from "@subwallet/react-ui";
import BigN from "bignumber.js";
import CN from "classnames";
import { MinusCircle } from "phosphor-react";
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

import { accountFilterFunc } from "../helper";
import {
  BondedBalance,
  FreeBalance,
  TransactionContent,
  TransactionFooter,
} from "../parts";
import { TransactionContext, TransactionFormBaseProps } from "../Transaction";

type Props = ThemeProps;

enum FormFieldName {
  VALUE = "value",
  VALIDATOR = "validator",
}

interface UnstakeFormProps extends TransactionFormBaseProps {
  [FormFieldName.VALUE]: string;
  [FormFieldName.VALIDATOR]?: string;
}

const _accountFilterFunc = (
  allNominator: NominatorMetadata[],
  chainInfoMap: Record<string, _ChainInfo>,
  stakingType: StakingType,
  stakingChain?: string
): ((account: AccountJson) => boolean) => {
  return (account: AccountJson): boolean => {
    const nominator = allNominator.find(
      (item) => item.address.toLowerCase() === account.address.toLowerCase()
    );

    return (
      new BigN(nominator?.activeStake || BN_ZERO).gt(BN_ZERO) &&
      accountFilterFunc(chainInfoMap, stakingType, stakingChain)(account)
    );
  };
};

const Component: React.FC<Props> = (props: Props) => {
  const { className = "" } = props;
  const { chain: stakingChain, type: _stakingType } = useParams();
  const stakingType = _stakingType as StakingType;

  const { t } = useTranslation();

  const dataContext = useContext(DataContext);
  const { chain, from, onDone, setChain, setFrom, setTransactionType } =
    useContext(TransactionContext);

  const currentAccount = useSelector(
    (state) => state.accountState.currentAccount
  );
  const chainInfoMap = useSelector((state) => state.chainStore.chainInfoMap);
  const isAll = isAccountAll(currentAccount?.address || "");

  const [form] = Form.useForm<UnstakeFormProps>();

  const formDefault = useMemo(
    (): UnstakeFormProps => ({
      from: from,
      chain: chain,
      asset: "",
      [FormFieldName.VALIDATOR]: "",
      [FormFieldName.VALUE]: "0",
    }),
    [chain, from]
  );

  const { decimals, symbol } = useGetNativeTokenBasicInfo(stakingChain || "");
  const chainStakingMetadata = useGetChainStakingMetadata(stakingChain);
  const allNominatorInfo = useGetNominatorInfo(stakingChain, stakingType);
  const nominatorInfo = useGetNominatorInfo(stakingChain, stakingType, from);
  const nominatorMetadata = nominatorInfo[0];

  const currentValidator = Form.useWatch(FormFieldName.VALIDATOR, form);
  const selectedValidator = useMemo((): NominationInfo | undefined => {
    if (nominatorMetadata) {
      return nominatorMetadata.nominations.find(
        (item) => item.validatorAddress === currentValidator
      );
    } else {
      return undefined;
    }
  }, [currentValidator, nominatorMetadata]);

  const mustChooseValidator = useMemo(() => {
    return isActionFromValidator(stakingType, stakingChain || "");
  }, [stakingChain, stakingType]);

  const bondedValue = useMemo((): string => {
    if (!mustChooseValidator) {
      return nominatorMetadata?.activeStake || "0";
    } else {
      return selectedValidator?.activeStake || "0";
    }
  }, [
    mustChooseValidator,
    nominatorMetadata?.activeStake,
    selectedValidator?.activeStake,
  ]);

  const minValue = useMemo((): string => {
    if (stakingType === StakingType.POOLED) {
      return chainStakingMetadata?.minJoinNominationPool || "0";
    } else {
      const minChain = new BigN(chainStakingMetadata?.minStake || "0");
      const minValidator = new BigN(
        selectedValidator?.validatorMinStake || "0"
      );

      return minChain.gt(minValidator)
        ? minChain.toString()
        : minValidator.toString();
    }
  }, [
    chainStakingMetadata?.minJoinNominationPool,
    chainStakingMetadata?.minStake,
    selectedValidator?.validatorMinStake,
    stakingType,
  ]);

  const unBondedTime = useMemo((): string => {
    if (chainStakingMetadata) {
      const time = chainStakingMetadata.unstakingPeriod;

      if (time >= 24) {
        const days = Math.floor(time / 24);
        const hours = time - days * 24;

        return `${days} ${t("days")}${hours ? ` ${hours} ${t("hours")}` : ""}`;
      } else {
        return `${time} ${t("hours")}`;
      }
    } else {
      return t("unknown time");
    }
  }, [chainStakingMetadata, t]);

  const [loading, setLoading] = useState(false);
  const [isDisable, setIsDisable] = useState(true);
  const { onError, onSuccess } = useHandleSubmitTransaction(onDone);

  const onFieldsChange: FormCallbacks<UnstakeFormProps>["onFieldsChange"] =
    useCallback(
      (changedFields: FormFieldData[], allFields: FormFieldData[]) => {
        // TODO: field change
        const { error } = simpleCheckForm(allFields);

        const allMap = convertFieldToObject<UnstakeFormProps>(allFields);
        const changesMap =
          convertFieldToObject<UnstakeFormProps>(changedFields);

        const { from } = changesMap;

        if (from) {
          setFrom(from);
        }

        const checkEmpty: Record<string, boolean> = {};

        for (const [key, value] of Object.entries(allMap)) {
          checkEmpty[key] = !!value;
        }

        if (!mustChooseValidator) {
          checkEmpty[FormFieldName.VALIDATOR] = true;
        }

        setIsDisable(
          error || Object.values(checkEmpty).some((value) => !value)
        );
      },
      [mustChooseValidator, setFrom]
    );

  const onSubmit: FormCallbacks<UnstakeFormProps>["onFinish"] = useCallback(
    (values: UnstakeFormProps) => {
      const { [FormFieldName.VALUE]: value } = values;
      // const selectedValidator = nominatorMetadata.nominations[0].validatorAddress;

      let unbondingPromise: Promise<SWTransactionResponse>;

      if (nominatorMetadata.type === StakingType.POOLED) {
        const params: RequestStakePoolingUnbonding = {
          amount: value,
          chain: nominatorMetadata.chain,
          nominatorMetadata,
        };

        unbondingPromise = submitPoolUnbonding(params);
      } else {
        const params: RequestUnbondingSubmit = {
          amount: value,
          chain: nominatorMetadata.chain,
          nominatorMetadata,
        };

        if (mustChooseValidator) {
          params.validatorAddress = ""; // TODO
        }

        unbondingPromise = submitUnbonding(params);
      }

      setLoading(true);

      setTimeout(() => {
        unbondingPromise
          .then(onSuccess)
          .catch(onError)
          .finally(() => {
            setLoading(false);
          });
      }, 300);
    },
    [mustChooseValidator, nominatorMetadata, onError, onSuccess]
  );

  const renderBounded = useCallback(() => {
    return (
      <BondedBalance
        bondedBalance={bondedValue}
        className={"bonded-balance"}
        decimals={decimals}
        symbol={symbol}
      />
    );
  }, [bondedValue, decimals, symbol]);

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
    setTransactionType(ExtrinsicType.STAKING_LEAVE_POOL);
  }, [setTransactionType]);

  useEffect(() => {
    setChain(stakingChain || "");
  }, [setChain, stakingChain]);

  return (
    <>
      <TransactionContent>
        <PageWrapper resolve={dataContext.awaitStores(["staking"])}>
          <Form
            className={`${className} form-container form-space-xxs`}
            form={form}
            initialValues={formDefault}
            name="unstake-form"
            onFieldsChange={onFieldsChange}
            onFinish={onSubmit}
          >
            {isAll && (
              <Form.Item name={"from"}>
                <AccountSelector
                  filter={_accountFilterFunc(
                    allNominatorInfo,
                    chainInfoMap,
                    stakingType,
                    stakingChain
                  )}
                  label={t("Unstake from account")}
                />
              </Form.Item>
            )}
            <FreeBalance
              address={from}
              chain={chain}
              className={"free-balance"}
              label={t("Available balance:")}
            />

            {mustChooseValidator && (
              <>
                <Form.Item name={FormFieldName.VALIDATOR}>
                  <NominationSelector
                    disabled={!from}
                    label={t("Select collator")}
                    nominators={
                      from ? nominatorMetadata?.nominations || [] : []
                    }
                  />
                </Form.Item>

                {renderBounded()}
              </>
            )}

            <Form.Item
              name={FormFieldName.VALUE}
              rules={[
                { required: true, message: "Value is required" },
                validateUnStakeValue(minValue, bondedValue, decimals),
              ]}
              statusHelpAsTooltip={true}
            >
              <AmountInput decimals={decimals} maxValue={bondedValue} />
            </Form.Item>

            {!mustChooseValidator && renderBounded()}

            <div className={CN("text-light-4", { mt: mustChooseValidator })}>
              {t(
                "Once unbonded, your funds would be available after {{time}}.",
                {
                  replace: {
                    time: unBondedTime,
                  },
                }
              )}
            </div>
          </Form>
        </PageWrapper>
      </TransactionContent>
      <TransactionFooter errors={[]} warnings={[]}>
        <Button
          disabled={isDisable}
          icon={<Icon phosphorIcon={MinusCircle} weight={"fill"} />}
          loading={loading}
          onClick={onPreCheckReadOnly(form.submit)}
        >
          {t("Submit")}
        </Button>
      </TransactionFooter>
    </>
  );
};

const Unbond = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {
    ".bonded-balance, .free-balance": {
      marginBottom: token.margin,
    },

    ".meta-info": {
      marginTop: token.paddingSM,
    },

    ".mt": {
      marginTop: token.marginSM,
    },
  };
});

export default Unbond;
