/**
 * HTTP 请求封装
 * 基于 wx.request，自动注入 Authorization 头，支持 token 刷新重试
 */

const { apiBaseUrl: BASE_URL } = require("./apiConfig");
const AUTH_KEY = "cym_auth";
let _loginPromise = null;

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

/**
 * 获取本地存储的认证信息
 * @returns {{ token: string, refreshToken: string, expireAt: number }|null}
 */
function _getAuth() {
  try {
    return wx.getStorageSync(AUTH_KEY) || null;
  } catch (e) {
    return null;
  }
}

/**
 * 无 token 时执行静默登录（单飞）
 * - 避免首次进入页面时业务接口抢跑
 * - 避免并发请求触发多次 wx.login
 * @returns {Promise<string>} token
 */
function _ensureToken() {
  const auth = _getAuth();
  if (auth && auth.token) return Promise.resolve(auth.token);
  if (_loginPromise) return _loginPromise;

  _loginPromise = new Promise((resolve, reject) => {
    wx.login({
      success(res) {
        if (!res.code) {
          _loginPromise = null;
          reject(new Error("wx.login 获取 code 失败"));
          return;
        }

        wx.request({
          url: `${BASE_URL}/auth/login`,
          method: "POST",
          data: { code: res.code },
          header: { "content-type": "application/json" },
          success(r) {
            const body = r.data;
            if (body && body.code === 0 && body.data) {
              const newAuth = {
                token: body.data.token,
                refreshToken: body.data.refreshToken,
                expireAt: body.data.expireAt,
              };
              try {
                wx.setStorageSync(AUTH_KEY, newAuth);
              } catch (e) {
                /* ignore */
              }
              _loginPromise = null;
              resolve(newAuth.token);
            } else {
              _loginPromise = null;
              reject(new Error("登录失败"));
            }
          },
          fail(err) {
            _loginPromise = null;
            reject(err);
          },
        });
      },
      fail(err) {
        _loginPromise = null;
        reject(err);
      },
    });
  });

  return _loginPromise;
}

/**
 * 尝试使用 refreshToken 刷新 access token
 * @returns {Promise<string>} 新的 access token
 */
function _refreshToken() {
  const auth = _getAuth();
  if (!auth || !auth.refreshToken) {
    return Promise.reject(new Error("无 refreshToken"));
  }

  return new Promise((resolve, reject) => {
    wx.request({
      url: `${BASE_URL}/auth/refresh`,
      method: "POST",
      data: { refreshToken: auth.refreshToken },
      header: { "content-type": "application/json" },
      success(res) {
        if (res.data && res.data.code === 0 && res.data.data) {
          const newAuth = {
            token: res.data.data.token,
            refreshToken: res.data.data.refreshToken,
            expireAt: res.data.data.expireAt,
          };
          try {
            wx.setStorageSync("cym_auth", newAuth);
          } catch (e) {
            /* ignore */
          }
          resolve(newAuth.token);
        } else {
          reject(new Error("刷新 token 失败"));
        }
      },
      fail(err) {
        reject(err);
      },
    });
  });
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
    const isAuthPath = path === "/auth/login" || path === "/auth/refresh";
    const auth = _getAuth();

    const doRequest = () => {
      const auth2 = _getAuth();
      const header = {
        "content-type": "application/json",
      };
      if (auth2 && auth2.token) {
        header["Authorization"] = "Bearer " + auth2.token;
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
          const body = res.data;

          // 40100 表示 token 过期，尝试刷新后重试一次
          if (body && body.code === 40100 && !isRetry) {
            _refreshToken()
              .then(function () {
                request(method, path, data, extraHeaders, true)
                  .then(resolve)
                  .catch(reject);
              })
              .catch(function () {
                wx.showToast({ title: "登录已过期，请重新登录", icon: "none" });
                reject(new Error("登录已过期"));
              });
            return;
          }

          if (body && body.code === 0) {
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

    // 首次登录：业务接口在无 token 时先执行静默登录再发起请求
    if (!isAuthPath && (!auth || !auth.token) && !isRetry) {
      _ensureToken()
        .then(function () {
          doRequest();
        })
        .catch(function (err) {
          wx.showToast({ title: "登录中，请稍后再试", icon: "none" });
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
