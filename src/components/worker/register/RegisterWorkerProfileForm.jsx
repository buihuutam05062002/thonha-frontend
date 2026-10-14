import  { useEffect, useState } from "react";
import { getCategories } from "../../../api/categoryApi";
import { workerProfileSchema } from "../../../validation/WorkerProfileSchema";
import { SelectField } from "../../ui/SelectField";
import { InputField } from "../../ui/InputField";
import { MultiSelectChips } from "../../ui/MultiSelectChips";
import { useFormik } from "formik";
import { getProvinces } from "../../../api/provinceApi";



const rr = await getProvinces();
const PROVINCES =  rr.data.map(province => province.name);

const WORK_AREAS = [
  "Nội thành / Trung tâm",
  "Ngoại thành",
  "Toàn tỉnh / thành phố",
  "Khu vực lân cận",
  "Toàn quốc",
];

export function RegisterWorkerProfileForm({ initialValues, onNext }) {
  const [categories, setCategories] = useState([]);
  const [loadingCategory, setLoadingCategory] = useState(true);
  const [formError, setFormError] = useState(null);

  useEffect(() => {
    getCategories()
      .then((data) => setCategories(Array.isArray(data) ? data : []))
      .catch(() =>
        setFormError(
          "Không tải được danh sách chuyên môn. Vui lòng tải lại trang.",
        ),
      )
      .finally(() => setLoadingCategory(false));
  }, []);

  const formik = useFormik({
    initialValues: initialValues ?? {
      provinceCity: "",
      operatingArea: "",
      experienceYears: "",
      categoryIds: [],
    },
    validationSchema: workerProfileSchema,
    validateOnBlur: true,
    onSubmit: (values) => {
      onNext(values);
    },
  });

  const toggleCategory = (id) => {
    const current = formik.values.categoryIds;
    const next = current.includes(id)
      ? current.filter((x) => x !== id)
      : [...current, id];
    formik.setFieldValue("categoryIds", next);
  };

  return (
    <form
      onSubmit={formik.handleSubmit}
      noValidate
      className="w-full flex flex-col"
    >
      {formError && (
        <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {formError}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <SelectField
          label="Tỉnh/ Thành phố đang sinh sống"
          name="provinceCity"
          options={PROVINCES}
          value={formik.values.provinceCity}
          onChange={(v) => formik.setFieldValue("provinceCity", v)}
          onBlur={formik.handleBlur}
          error={
            formik.touched.provinceCity ? formik.errors.provinceCity : undefined
          }
        />

        <SelectField
          label="Bao phủ khu vực làm việc"
          name="operatingArea"
          options={WORK_AREAS}
          value={formik.values.operatingArea}
          onChange={(v) => formik.setFieldValue("operatingArea", v)}
          onBlur={formik.handleBlur}
          error={
            formik.touched.operatingArea
              ? formik.errors.operatingArea
              : undefined
          }
        />

        <div className="md:col-span-2">
          <InputField
            label="Kinh nghiệm làm việc (số năm)"
            name="experienceYears"
            type="number"
            placeholder="Nhập số năm kinh nghiệm"
            value={formik.values.experienceYears}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={
              formik.touched.experienceYears
                ? formik.errors.experienceYears
                : undefined
            }
          />
        </div>

        <div className="md:col-span-2">
          <MultiSelectChips
            label="Chuyên môn / Ngành nghề (chọn 1 hoặc nhiều)"
            options={categories.map((d) => ({
              id: d.id,
              label: d.name,
            }))}
            selectedIds={formik.values.categoryIds}
            onToggle={toggleCategory}
            loading={loadingCategory}
            error={
              formik.touched.categoryIds ? formik.errors.categoryIds : undefined
            }
          />
        </div>
      </div>

      <div className="mt-6 w-full flex justify-center items-center">
        <button
          type="submit"
          className="w-full py-3.5 rounded-xl text-sm font-bold text-white transition-all duration-200 text-center flex justify-center items-center"
          style={{ background: "#111111" }}
        >
          Tiếp theo
        </button>
      </div>
    </form>
  );
}
