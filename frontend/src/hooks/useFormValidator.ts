import { useState } from 'react';

export function useFormValidator<T extends Record<string, any>>(
  validateFn: (data: T) => Partial<Record<keyof T, string>>
) {
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});

  const validate = (data: T): boolean => {
    const newErrors = validateFn(data);
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateWithErrors = (data: T): Partial<Record<keyof T, string>> => {
    const newErrors = validateFn(data);
    setErrors(newErrors);
    return newErrors;
  };

  const validateField = (key: keyof T, value: any) => {
    setErrors((prev) => {
      const newErrors = { ...prev };
      if (
        (typeof value === 'string' && value.trim() === '') ||
        (typeof value === 'number' && isNaN(value))
      ) {
        newErrors[key] = '필수 입력 항목입니다.';
      } else {
        delete newErrors[key];
      }
      return newErrors;
    });
  };

  return {
    errors,
    validate,
    validateField,
    validateWithErrors,
  };
}