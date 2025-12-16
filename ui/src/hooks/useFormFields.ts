/*
Copyright 2024 Iguazio Systems Ltd.

Licensed under the Apache License, Version 2.0 (the "License") with
an addition restriction as set forth herein. You may not use this
file except in compliance with the License. You may obtain a copy of
the License at http://www.apache.org/licenses/LICENSE-2.0.

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or
implied. See the License for the specific language governing
permissions and limitations under the License.

In addition, you may not use the software for any purposes that are
illegal under applicable law, and the grant of the foregoing license
under the Apache 2.0 license is conditioned upon your compliance with
such restriction.
*/

import { useEffect, useState } from 'react';

import { ModalField } from '@shared/types/modalFieldConfigs';

export const useFormFields = <T extends { uid?: string }>(
  entity: T,
  fields: ModalField[],
) => {
  const [formData, setFormData] = useState<T>(entity);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setFormData(entity);
    setErrors({});
  }, [entity]);

  const handleChange = (name: keyof T, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleBlur = (field: ModalField, value: string) => {
    let error = '';

    if (field.required && !value.trim()) {
      error = 'This field is required';
    } else if (field.required && !/^.{3,}$/.test(value.trim())) {
      error = 'Minimum 3 characters required';
    } else if (
      field.validation?.regex &&
      value.trim() &&
      !field.validation.regex.test(value.trim())
    ) {
      error = field.validation.message || 'Invalid format';
    }

    setErrors((prev) => ({ ...prev, [field.name]: error }));
  };

  const resetForm = () => {
    setFormData(entity);
    setErrors({});
  };

  const isSaveDisabled = fields.some((field) => {
    const value = (formData[field.name as keyof T] ?? '').toString().trim();

    if (field.required && (!value || value.length < 3)) return true;

    if (field.validation?.regex && value && !field.validation.regex.test(value))
      return true;

    return !!errors[field.name];
  });

  return {
    formData,
    errors,
    handleChange,
    handleBlur,
    resetForm,
    isSaveDisabled,
  };
};
