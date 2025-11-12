// Copyright 2024 Iguazio
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//   http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import React, { useEffect, useState } from 'react';

import { Button } from '@components/shared/Button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@components/shared/Dialog';
import { Field, FieldLabel } from '@components/shared/Field';
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
  const [formData, setFormData] = useState<T>(entity);

  useEffect(() => {
    setFormData(entity);
  }, [entity]);

  const handleChange = (name: keyof T, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const isSaveDisabled = fields.some(
    (field) =>
      field.required &&
      !(formData[field.name as keyof T] ?? '').toString().trim(),
  );

  const handleSubmit = () => {
    onSave(formData);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {entity?.uid ? 'Edit' : 'New'} {title}
          </DialogTitle>
        </DialogHeader>
        <Separator />
        <div className="grid gap-7 p-8 max-h-[500px] 2xl:max-h-[700px] overflow-auto">
          {fields.map((field) => (
            <Field key={field.name}>
              <FieldLabel className="text-black gap-x-1" htmlFor={field.name}>
                {field.label}
                {field.required && <span className="text-red-500">*</span>}
              </FieldLabel>
              {field.options ? (
                <Select
                  value={(formData[field.name as keyof T] as string) || ''}
                  name={field.name}
                  onValueChange={(value) =>
                    handleChange(field.name as keyof T, value)
                  }
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
                  id={field.name}
                  type="text"
                  name={field.name}
                  value={(formData[field.name as keyof T] as string) || ''}
                  onChange={(e) =>
                    handleChange(field.name as keyof T, e.target.value)
                  }
                />
              )}
            </Field>
          ))}
        </div>

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
