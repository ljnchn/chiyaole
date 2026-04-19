/**
 * HTTP 请求封装
 * 基于 wx.request，自动注入 Authorization 头，支持鉴权恢复与重试
 */
const { apiBaseUrl: BASE_URL } = require("./apiConfig");
const authService = require("./authService");

/**
 * 将对象转为查询字符串
 * @param {Object} params
 * @returns {string} 如 "a=1&b=2"
 */
function toQuery(params) {
  if (!params || typeof params !== "object") return "";
  return Object.keys(params)
    .filter((k) => params[k] !== undefined && params[k] !== null)
    .map((k) => `${encodeURIComponent(k)}=${encodeURIComponent(params[k])}`)
    .join("&");
}

function isAuthPath(path) {
  return path === "/auth/login" || path === "/auth/refresh";
}

function isAuthError(code, statusCode) {
  return (
    code === 40100 ||
    code === 40101 ||
    code === 40102 ||
    statusCode === 401
  );
}

/**
 * 核心请求函数
 * @param {string} method - HTTP 方法
 * @param {string} path - 接口路径（如 /medications）
 * @param {Object} [data] - 请求体或查询参数
 * @param {Object} [extraHeaders] - 额外请求头
 * @param {boolean} [isRetry] - 是否为 token 刷新后的重试请求
 * @returns {Promise<any>} 解析后的 data 字段
 */
function request(method, path, data, extraHeaders, isRetry) {
  return new Promise((resolve, reject) => {
    const pathIsAuth = isAuthPath(path);

    const doRequest = () => {
      const header = {
        "content-type": "application/json",
      };
      const token = authService.getToken();
      if (token) {
        header["Authorization"] = "Bearer " + token;
      }
      if (extraHeaders) {
        Object.assign(header, extraHeaders);
      }

      let url = BASE_URL + path;
      let reqData = undefined;

      if (method === "GET" && data) {
        const qs = toQuery(data);
        if (qs) url += "?" + qs;
      } else if (data) {
        reqData = data;
      }

      wx.request({
        url: url,
        method: method,
        data: reqData,
        header: header,
        success(res) {
          const body = res.data || {};
          const code = body.code;

          // 登录态失效：尝试恢复认证后重试一次
          if (!pathIsAuth && !isRetry && isAuthError(code, res.statusCode)) {
            authService
              .recoverAuth()
              .then(function () {
                request(method, path, data, extraHeaders, true)
                  .then(resolve)
                  .catch(reject);
              })
              .catch(function () {
                authService.clearAuth();
                wx.showToast({ title: "登录已过期，请重新登录", icon: "none" });
                reject(new Error("登录已过期"));
              });
            return;
          }

          if (code === 0) {
            resolve(body.data);
          } else {
            var msg = body && body.message ? body.message : "请求失败";
            wx.showToast({ title: msg, icon: "none" });
            reject(new Error(msg));
          }
        },
        fail(err) {
          wx.showToast({ title: "网络异常，请稍后重试", icon: "none" });
          reject(err);
        },
      });
    };

    // 业务接口请求前先确保登录态可用，减少“先失败再恢复”的感知
    if (!pathIsAuth && !isRetry) {
      authService
        .ensureAuthorized()
        .then(function () {
          doRequest();
        })
        .catch(function (err) {
          wx.showToast({ title: "登录失败，请稍后重试", icon: "none" });
          reject(err);
        });
      return;
    }

    doRequest();
  });
}

/**
 * GET 请求
 * @param {string} path
 * @param {Object} [params] - 查询参数
 * @returns {Promise<any>}
 */
function get(path, params) {
  return request("GET", path, params);
}

/**
 * POST 请求
 * @param {string} path
 * @param {Object} [data]
 * @returns {Promise<any>}
 */
function post(path, data) {
  return request("POST", path, data);
}

/**
 * PATCH 请求
 * @param {string} path
 * @param {Object} [data]
 * @returns {Promise<any>}
 */
function patch(path, data) {
  return request("PATCH", path, data);
}

/**
 * DELETE 请求
 * @param {string} path
 * @param {Object} [extraHeaders]
 * @returns {Promise<any>}
 */
function del(path, extraHeaders) {
  return request("DELETE", path, undefined, extraHeaders);
}

module.exports = {
  BASE_URL,
  toQuery,
  get,
  post,
  patch,
  del,
  request,
};
