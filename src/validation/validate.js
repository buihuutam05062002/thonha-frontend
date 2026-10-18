import {ValidationError} from "yup";

/**
 * Chạy schema Yup và trả về map { tênTrường: thôngBáoĐầuTiên }.
 * Trả {} nếu hợp lệ, nên dùng được cho cả setState lỗi lẫn kiểm tra nhanh bằng Object.keys.
 */
export function validateWith(schema, values) {
  try {
    schema.validateSync(values, {abortEarly: false});
    return {};
  } catch (e) {
    if (!(e instanceof ValidationError)) throw e;
    const errors = {};
    for (const item of e.inner.length ? e.inner : [e]) {
      if (item.path && !errors[item.path]) errors[item.path] = item.message;
    }
    return errors;
  }
}
