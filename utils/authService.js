/**
 * 登录授权服务
 * 使用 request.js 与后端交互，管理微信登录流程和认证状态
 */
const request = require("./request.js");

const AUTH_KEY = "cym_auth";

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
 * 获取当前 token 字符串
 * @returns {string}
 */
function getToken() {
  const auth = getAuth();
  return auth && auth.token ? auth.token : "";
}

/**
 * 是否已登录（token 存在且未过期）
 * @returns {boolean}
 */
function isLogged() {
  const auth = getAuth();
  if (!auth || !auth.token) return false;
  if (auth.expireAt && auth.expireAt < Date.now()) return false;
  return true;
}

/**
 * 静默登录：wx.login 获取 code → POST /auth/login → 存储 token
 * @returns {Promise<Object>} 认证数据
 */
function login() {
  return new Promise(function (resolve, reject) {
    wx.login({
      success: function (res) {
        if (!res.code) {
          reject(new Error("wx.login 获取 code 失败"));
          return;
        }
        request
          .post("/auth/login", { code: res.code })
          .then(function (data) {
            var auth = {
              token: data.token,
              refreshToken: data.refreshToken,
              expireAt: data.expireAt,
            };
            try {
              wx.setStorageSync(AUTH_KEY, auth);
            } catch (e) {
              /* ignore */
            }
            resolve(auth);
          })
          .catch(function (err) {
            reject(err);
          });
      },
      fail: function (err) {
        console.error("[Auth] wx.login 失败:", err);
        reject(err);
      },
    });
  });
}

/**
 * 刷新 token
 * @returns {Promise<Object>} 更新后的认证数据
 */
function refresh() {
  var auth = getAuth();
  if (!auth || !auth.refreshToken) {
    return Promise.reject(new Error("无 refreshToken"));
  }
  return request
    .post("/auth/refresh", { refreshToken: auth.refreshToken })
    .then(function (data) {
      var newAuth = {
        token: data.token,
        refreshToken: data.refreshToken,
        expireAt: data.expireAt,
      };
      try {
        wx.setStorageSync(AUTH_KEY, newAuth);
      } catch (e) {
        /* ignore */
      }
      return newAuth;
    });
}

/**
 * 检查会话是否有效
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
 * 自动登录：检查会话 → 过期则重新登录
 * @returns {Promise<Object>}
 */
async function autoLogin() {
  if (isLogged()) {
    var valid = await checkSession();
    if (valid) return getAuth();
  }
  return login();
}

/**
 * 获取微信用户头像和昵称（需用户主动触发）
 * @returns {Promise<{ nickName: string, avatarUrl: string }>}
 */
function getUserProfile() {
  return new Promise(function (resolve, reject) {
    wx.getUserProfile({
      desc: "用于展示个人信息",
      success: function (res) {
        resolve({
          nickName: res.userInfo.nickName,
          avatarUrl: res.userInfo.avatarUrl,
        });
      },
      fail: function (err) {
        reject(err);
      },
    });
  });
}

/**
 * 退出登录：清除本地认证信息，静默调用 DELETE /users/me/data
 */
function logout() {
  try {
    wx.removeStorageSync(AUTH_KEY);
  } catch (e) {
    /* ignore */
  }
  request.del("/users/me/data").catch(function () {
    /* 静默忽略 */
  });
}

module.exports = {
  getAuth,
  getToken,
  isLogged,
  login,
  refresh,
  checkSession,
  autoLogin,
  getUserProfile,
  logout,
};
