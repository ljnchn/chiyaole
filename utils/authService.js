/**
 * 登录授权服务
 * 统一管理 token / refreshToken / 微信会话有效性
 */
const { apiBaseUrl: BASE_URL } = require("./apiConfig");

const AUTH_KEY = "cym_auth";
const AUTH_EXPIRE_GUARD_MS = 60 * 1000;
let _loginPromise = null;
let _refreshPromise = null;
let _recoverPromise = null;

/**
 * 获取本地认证信息
 * @returns {{ token: string, refreshToken: string, expireAt: number }|null}
 */
function getAuth() {
  try {
    return wx.getStorageSync(AUTH_KEY) || null;
  } catch (e) {
    return null;
  }
}

/**
 * 保存认证信息
 * @param {Object} auth
 */
function setAuth(auth) {
  try {
    wx.setStorageSync(AUTH_KEY, auth);
  } catch (e) {
    /* ignore */
  }
}

/**
 * 清除认证信息
 */
function clearAuth() {
  try {
    wx.removeStorageSync(AUTH_KEY);
  } catch (e) {
    /* ignore */
  }
}

/**
 * 获取当前 token 字符串
 * @returns {string}
 */
function getToken() {
  const auth = getAuth();
  return auth && auth.token ? auth.token : "";
}

/**
 * 标准化后端 auth 返回
 * @param {Object} data
 * @param {Object} [oldAuth]
 * @returns {{ token: string, refreshToken: string, expireAt: number }}
 */
function normalizeAuth(data, oldAuth) {
  const now = Date.now();
  let expireAt = data.expireAt;
  if (!expireAt && data.expiresIn) {
    expireAt = now + Number(data.expiresIn) * 1000;
  }

  return {
    token: data.token || "",
    refreshToken:
      data.refreshToken ||
      (oldAuth && oldAuth.refreshToken ? oldAuth.refreshToken : ""),
    expireAt: Number(expireAt || 0),
  };
}

/**
 * token 是否仍可用（提前留保护窗口，避免边界失效）
 * @param {Object|null} auth
 * @returns {boolean}
 */
function hasUsableToken(auth) {
  if (!auth || !auth.token) return false;
  if (!auth.expireAt) return false;
  return auth.expireAt - Date.now() > AUTH_EXPIRE_GUARD_MS;
}

/**
 * 是否已登录（token 存在且未过期）
 * @returns {boolean}
 */
function isLogged() {
  return hasUsableToken(getAuth());
}

/**
 * 请求 auth 接口
 * @param {string} path
 * @param {Object} data
 * @returns {Promise<any>}
 */
function authRequest(path, data) {
  return new Promise(function (resolve, reject) {
    wx.request({
      url: BASE_URL + path,
      method: "POST",
      data: data || {},
      header: { "content-type": "application/json" },
      success: function (res) {
        const body = res.data;
        if (body && body.code === 0) {
          resolve(body.data || {});
          return;
        }
        reject(new Error((body && body.message) || "认证请求失败"));
      },
      fail: function (err) {
        reject(err);
      },
    });
  });
}

/**
 * 静默登录：wx.login 获取 code -> POST /auth/login
 * @returns {Promise<Object>}
 */
function login() {
  if (_loginPromise) return _loginPromise;

  _loginPromise = new Promise(function (resolve, reject) {
    wx.login({
      success: function (res) {
        if (!res.code) {
          reject(new Error("wx.login 获取 code 失败"));
          return;
        }

        authRequest("/auth/login", { code: res.code })
          .then(function (data) {
            const auth = normalizeAuth(data, null);
            setAuth(auth);
            resolve(auth);
          })
          .catch(reject);
      },
      fail: function (err) {
        reject(err);
      },
    });
  })
    .finally(function () {
      _loginPromise = null;
    });

  return _loginPromise;
}

/**
 * 刷新 token
 * @returns {Promise<Object>}
 */
function refresh() {
  if (_refreshPromise) return _refreshPromise;

  const auth = getAuth();
  if (!auth || !auth.refreshToken) {
    return Promise.reject(new Error("无 refreshToken"));
  }

  _refreshPromise = authRequest("/auth/refresh", {
    refreshToken: auth.refreshToken,
  })
    .then(function (data) {
      const newAuth = normalizeAuth(data, auth);
      setAuth(newAuth);
      return newAuth;
    })
    .finally(function () {
      _refreshPromise = null;
    });

  return _refreshPromise;
}

/**
 * 检查微信会话是否有效
 * @returns {Promise<boolean>}
 */
function checkSession() {
  return new Promise(function (resolve) {
    wx.checkSession({
      success: function () {
        resolve(true);
      },
      fail: function () {
        resolve(false);
      },
    });
  });
}

/**
 * 恢复认证状态：优先 refresh，失败则重新 login（单飞）
 * @returns {Promise<Object>}
 */
function recoverAuth() {
  if (_recoverPromise) return _recoverPromise;

  _recoverPromise = Promise.resolve()
    .then(function () {
      const auth = getAuth();
      if (auth && auth.refreshToken) {
        return refresh().catch(function () {
          return login();
        });
      }
      return login();
    })
    .finally(function () {
      _recoverPromise = null;
    });

  return _recoverPromise;
}

/**
 * 确保认证可用
 * @param {{checkWechatSession?: boolean, forceLogin?: boolean}} options
 * @returns {Promise<Object>}
 */
async function ensureAuthorized(options) {
  const opts = options || {};
  if (opts.forceLogin) {
    clearAuth();
    return login();
  }

  const auth = getAuth();
  if (hasUsableToken(auth)) {
    if (!opts.checkWechatSession) return auth;
    const valid = await checkSession();
    if (valid) return auth;
  }

  return recoverAuth();
}

/**
 * 兼容旧调用名
 * @returns {Promise<Object>}
 */
function autoLogin() {
  return ensureAuthorized({ checkWechatSession: true });
}

/**
 * 退出登录：清除本地认证信息，静默通知后端
 */
function logout() {
  const auth = getAuth();
  clearAuth();

  if (!auth || !auth.token) return;

  wx.request({
    url: BASE_URL + "/users/me/data",
    method: "DELETE",
    header: {
      "content-type": "application/json",
      Authorization: "Bearer " + auth.token,
    },
    fail: function () {
      /* 静默忽略 */
    },
  });
}

module.exports = {
  getAuth,
  getToken,
  isLogged,
  login,
  refresh,
  checkSession,
  recoverAuth,
  ensureAuthorized,
  autoLogin,
  clearAuth,
  logout,
};
