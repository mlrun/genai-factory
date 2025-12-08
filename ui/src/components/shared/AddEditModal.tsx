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

import React from 'react';

import { Button } from '@components/shared/Button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@components/shared/Dialog';
import {
  Field,
  FieldContent,
  FieldError,
  FieldLabel,
} from '@components/shared/Field';
import { Input } from '@components/shared/Input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@components/shared/Select';
import { Separator } from '@components/shared/Separator';
import { ModalField } from '@shared/types/modalFieldConfigs';

import { useFormFields } from '@hooks/useFormFields';
import { cn } from '@shared/cn/utils';

type AddEditModalProps<T> = {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: T) => void;
  entity: T;
  fields: ModalField[];
  title: string;
};

const AddEditModal = <T extends { uid?: string }>({
  entity,
  fields,
  isOpen,
  onClose,
  onSave,
  title,
}: AddEditModalProps<T>) => {
  const {
    errors,
    formData,
    handleBlur,
    handleChange,
    isSaveDisabled,
    resetForm,
  } = useFormFields(entity, fields);

  const handleSubmit = () => {
    if (!isSaveDisabled) {
      onSave(formData);
      onClose();
      resetForm();
    }
  };

  const handleClose = () => {
    onClose();
    resetForm();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>
            {entity?.uid ? 'Edit' : 'New'} {title}
          </DialogTitle>
        </DialogHeader>
        <Separator />
        <form
          className="grid gap-7 p-8 max-h-[500px] 2xl:max-h-[700px] overflow-auto"
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
          autoComplete="off"
        >
          {fields.map((field) => (
            <Field key={field.name}>
              <FieldLabel htmlFor={field.name}>
                {field.label}
                {field.required && <span className="text-red-500">*</span>}
              </FieldLabel>

              <FieldContent className="relative">
                {field.options ? (
                  <Select
                    value={(formData[field.name as keyof T] as string) || ''}
                    name={field.name}
                    onValueChange={(value) =>
                      handleChange(field.name as keyof T, value)
                    }
                    required={field.required}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {field.options.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    type={field.type || 'text'}
                    name={field.name}
                    value={(formData[field.name as keyof T] as string) || ''}
                    onChange={(e) =>
                      handleChange(field.name as keyof T, e.target.value)
                    }
                    onBlur={(e) => handleBlur(field, e.target.value)}
                    required={field.required}
                    className={cn(
                      errors[field.name] && 'border-red-500 bg-red-100',
                    )}
                  />
                )}

                {errors[field.name] && (
                  <FieldError className="absolute -bottom-2/4">
                    {errors[field.name]}
                  </FieldError>
                )}
              </FieldContent>
            </Field>
          ))}
        </form>

        <DialogFooter className="flex justify-end gap-2 pt-20 pb-6 px-8">
          <Button disabled={isSaveDisabled} onClick={handleSubmit}>
            {entity?.uid ? 'Save Changes' : `Add ${title}`}
          </Button>
          {entity?.uid && (
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddEditModal;
