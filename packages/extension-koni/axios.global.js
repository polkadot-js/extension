// Copyright 2019-2022 @polkadot/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import axios from 'axios_raw';
import buildFullPath from 'axios_raw/lib/core/buildFullPath';
import settle from 'axios_raw/lib/core/settle';
import buildURL from 'axios_raw/lib/helpers/buildURL';
import utilsFunc from 'axios_raw/lib/utils';

const { isFormData, isStandardBrowserEnv, isUndefined } = utilsFunc;

/**
 * - Create a request object
 * - Get response body
 * - Check if timeout
 */
const fetchAdapter = async (config) => {
  const request = createRequest(config);
  const promiseChain = [await getResponse(request, config)];

  if (config.timeout && config.timeout > 0) {
    promiseChain.push(
      new Promise((resolve) => {
        setTimeout(() => {
          const message = config.timeoutErrorMessage
            ? config.timeoutErrorMessage
            : 'timeout of ' + config.timeout + 'ms exceeded';

          resolve(createError(message, config, 'ECONNABORTED', request));
        }, config.timeout);
      })
    );
  }

  const data = await Promise.race(promiseChain);

  return new Promise((resolve, reject) => {
    if (data instanceof Error) {
      reject(data);
    } else {
      Object.prototype.toString.call(config.settle) === '[object Function]'
        ? config.settle(resolve, reject, data)
        : settle(resolve, reject, data);
    }
  });
};

/**
 * Fetch API stage two is to get response body. This funtion tries to retrieve
 * response body based on response's type
 */
async function getResponse (request, config) {
  let stageOne;

  try {
    stageOne = await fetch(request);
  } catch (e) {
    return createError('Network Error', config, 'ERR_NETWORK', request);
  }

  const response = {
    ok: stageOne.ok,
    status: stageOne.status,
    statusText: stageOne.statusText,
    headers: new Headers(stageOne.headers), // Make a copy of headers
    config: config,
    request
  };

  if (stageOne.status >= 200 && stageOne.status !== 204) {
    switch (config.responseType) {
      case 'arraybuffer':
        response.data = await stageOne.arrayBuffer();
        break;
      case 'blob':
        response.data = await stageOne.blob();
        break;
      case 'json':
        response.data = await stageOne.json();
        break;
      case 'formData':
        response.data = await stageOne.formData();
        break;
      default:
        response.data = await stageOne.text();
        break;
    }
  }

  return response;
}

/**
 * This function will create a Request object based on configuration's axios
 */
function createRequest (config) {
  const headers = new Headers(config.headers);

  // HTTP basic authentication
  if (config.auth) {
    const username = config.auth.username || '';
    const password = config.auth.password ? decodeURI(encodeURIComponent(config.auth.password)) : '';

    headers.set('Authorization', `Basic ${btoa(username + ':' + password)}`);
  }

  const method = config.method.toUpperCase();
  const options = {
    headers: headers,
    method
  };

  if (method !== 'GET' && method !== 'HEAD') {
    options.body = config.data;

    // In these cases the browser will automatically set the correct Content-Type,
    // but only if that header hasn't been set yet. So that's why we're deleting it.
    if (isFormData(options.body) && isStandardBrowserEnv()) {
      headers.delete('Content-Type');
    }
  }

  if (config.mode) {
    options.mode = config.mode;
  }

  if (config.cache) {
    options.cache = config.cache;
  }

  if (config.integrity) {
    options.integrity = config.integrity;
  }

  if (config.redirect) {
    options.redirect = config.redirect;
  }

  if (config.referrer) {
    options.referrer = config.referrer;
  }

  // This config is similar to XHR’s withCredentials flag, but with three available values instead of two.
  // So if withCredentials is not set, default value 'same-origin' will be used
  if (!isUndefined(config.withCredentials)) {
    options.credentials = config.withCredentials ? 'include' : 'omit';
  }

  const fullPath = buildFullPath(config.baseURL, config.url);
  const url = buildURL(fullPath, config.params, config.paramsSerializer);

  // Expected browser to throw error if there is any wrong configuration value
  return new Request(url, options);
}

function createError (message, config, code, request, response) {
  if (axios.AxiosError && typeof axios.AxiosError === 'function') {
    return new axios.AxiosError(message, axios.AxiosError[code], config, request, response);
  }

  const error = new Error(message);

  return enhanceError(error, config, code, request, response);
}

function enhanceError (error, config, code, request, response) {
  error.config = config;

  if (code) {
    error.code = code;
  }

  error.request = request;
  error.response = response;
  error.isAxiosError = true;

  error.toJSON = function toJSON () {
    return {
      // Standard
      message: this.message,
      name: this.name,
      // Microsoft
      description: this.description,
      number: this.number,
      // Mozilla
      fileName: this.fileName,
      lineNumber: this.lineNumber,
      columnNumber: this.columnNumber,
      stack: this.stack,
      // Axios
      config: this.config,
      code: this.code,
      status: this.response && this.response.status ? this.response.status : null
    };
  };

  return error;
}

export default axios.create({
  adapter: fetchAdapter
});
