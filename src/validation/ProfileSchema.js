import * as Yup from "yup";

export const profileSchema = Yup.object({
  fullName: Yup.string()
    .trim()
    .required("Vui lòng nhập họ và tên")
    .max(100, "Họ và tên tối đa 100 ký tự"),
});

export const addressSchema = Yup.object({
  label: Yup.string().trim().required("Vui lòng nhập tên gọi cho địa chỉ"),
  fullAddress: Yup.string().trim().required("Vui lòng nhập địa chỉ"),
});

/** Kiểm tra file ảnh đại diện; truyền {type, size} của File. */
export const avatarSchema = (maxMb) =>
  Yup.object({
    type: Yup.string().test(
      "is-image",
      "Chỉ chấp nhận file ảnh",
      (v) => !!v && v.startsWith("image/"),
    ),
    size: Yup.number().max(maxMb * 1024 * 1024, `Ảnh tối đa ${maxMb}MB`),
  });
