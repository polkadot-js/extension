"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.TransferStep = exports.TransferErrorCode = exports.RMRK_VER = exports.CrowdloanParaState = exports.ApiInitStatus = exports.APIItemState = void 0;
// Copyright 2019-2022 @polkadot/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0
let ApiInitStatus;
exports.ApiInitStatus = ApiInitStatus;

(function (ApiInitStatus) {
  ApiInitStatus[ApiInitStatus["SUCCESS"] = 0] = "SUCCESS";
  ApiInitStatus[ApiInitStatus["ALREADY_EXIST"] = 1] = "ALREADY_EXIST";
  ApiInitStatus[ApiInitStatus["NOT_SUPPORT"] = 2] = "NOT_SUPPORT";
})(ApiInitStatus || (exports.ApiInitStatus = ApiInitStatus = {}));

let APIItemState;
exports.APIItemState = APIItemState;

(function (APIItemState) {
  APIItemState["PENDING"] = "pending";
  APIItemState["READY"] = "ready";
  APIItemState["CACHED"] = "cached";
  APIItemState["ERROR"] = "error";
  APIItemState["NOT_SUPPORT"] = "not_support";
})(APIItemState || (exports.APIItemState = APIItemState = {}));

let RMRK_VER;
exports.RMRK_VER = RMRK_VER;

(function (RMRK_VER) {
  RMRK_VER["VER_1"] = "1.0.0";
  RMRK_VER["VER_2"] = "2.0.0";
})(RMRK_VER || (exports.RMRK_VER = RMRK_VER = {}));

let CrowdloanParaState;
exports.CrowdloanParaState = CrowdloanParaState;

(function (CrowdloanParaState) {
  CrowdloanParaState["ONGOING"] = "ongoing";
  CrowdloanParaState["COMPLETED"] = "completed";
  CrowdloanParaState["FAILED"] = "failed";
})(CrowdloanParaState || (exports.CrowdloanParaState = CrowdloanParaState = {}));

let TransferErrorCode;
exports.TransferErrorCode = TransferErrorCode;

(function (TransferErrorCode) {
  TransferErrorCode["INVALID_FROM_ADDRESS"] = "invalidFromAccount";
  TransferErrorCode["INVALID_TO_ADDRESS"] = "invalidToAccount";
  TransferErrorCode["NOT_ENOUGH_VALUE"] = "notEnoughValue";
  TransferErrorCode["INVALID_VALUE"] = "invalidValue";
  TransferErrorCode["INVALID_TOKEN"] = "invalidToken";
  TransferErrorCode["KEYRING_ERROR"] = "keyringError";
  TransferErrorCode["TRANSFER_ERROR"] = "transferError";
  TransferErrorCode["TIMEOUT"] = "timeout";
  TransferErrorCode["UNSUPPORTED"] = "unsupported";
})(TransferErrorCode || (exports.TransferErrorCode = TransferErrorCode = {}));

let TransferStep;
exports.TransferStep = TransferStep;

(function (TransferStep) {
  TransferStep["READY"] = "ready";
  TransferStep["START"] = "start";
  TransferStep["PROCESSING"] = "processing";
  TransferStep["SUCCESS"] = "success";
  TransferStep["ERROR"] = "error";
})(TransferStep || (exports.TransferStep = TransferStep = {}));