import * as Yup from "yup";
import {validateWith} from "./validate";

// Mỗi bước của wizard tạo yêu cầu có một schema riêng.
const stepSchemas = {
  1: Yup.object({
    categoryId: Yup.mixed().required("Vui lòng chọn danh mục dịch vụ"),
  }),
  2: Yup.object({
    description: Yup.string()
      .trim()
      .min(10, "Mô tả cần ít nhất 10 ký tự để thợ hiểu sự cố"),
  }),
  3: Yup.object({
    addressSnapshot: Yup.string().trim().required("Vui lòng nhập địa chỉ cần sửa"),
  }),
};

/** Trả lỗi đầu tiên của bước n dưới dạng {field, message}, hoặc null nếu hợp lệ. */
export function validateStep(n, form) {
  const schema = stepSchemas[n];
  if (!schema) return null;
  const [first] = Object.entries(validateWith(schema, form));
  return first ? {field: first[0], message: first[1]} : null;
}
