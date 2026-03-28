/**
 * 服用剂量输入：仅允许数字与至多一个小数点（如 0.5）
 */
function sanitizeDosageNumericInput(raw) {
  var s = String(raw || '')
  var out = ''
  var seenDot = false
  for (var i = 0; i < s.length; i++) {
    var c = s.charAt(i)
    if (c >= '0' && c <= '9') out += c
    else if (c === '.' && !seenDot) {
      seenDot = true
      out += c
    }
  }
  return out
}

module.exports = {
  sanitizeDosageNumericInput: sanitizeDosageNumericInput
}
