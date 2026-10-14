import * as Yup from "yup";

export const workerProfileSchema = Yup.object().shape({
  provinceCity: Yup.string().required("Vui lòng chọn Tỉnh/Thành phố"),
  operatingArea: Yup.string().required("Vui lòng chọn khu vực hoạt động"),
  experienceYears: Yup.number()
    .typeError("Số năm kinh nghiệm phải là chữ số")
    .required("Vui lòng nhập số năm kinh nghiệm")
    .min(0, "Kinh nghiệm không được là số âm")
    .max(60, "Kinh nghiệm không quá 60 năm"),
  categoryIds: Yup.array()
    .of(Yup.number())
    .min(1, "Vui lòng chọn ít nhất 1 chuyên môn/ngành nghề"),
  // agreePolicy: Yup.boolean().oneOf(
  //   [true],
  //   "Bạn cần đồng ý với chính sách bảo vệ dữ liệu",
  // ),
});
