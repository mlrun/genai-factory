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

import {
  Button,
  FormControl,
  FormLabel,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Select
} from '@chakra-ui/react'
import React, { useEffect, useState } from 'react'
import { ModalField } from '@shared/types/modalFieldConfigs'

type AddEditModalProps<T> = {
  isOpen: boolean
  onClose: () => void
  onSave: (data: T) => void
  entity: T
  fields: ModalField[]
  title: string
}

function AddEditModal<T extends { uid?: string }>({
  isOpen,
  onClose,
  onSave,
  entity,
  fields,
  title
}: AddEditModalProps<T>) {

  const [formData, setFormData] = useState<T>(entity)

  useEffect(() => {
    setFormData(entity)
  }, [entity])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const isSaveDisabled = fields.some(
    (field) => field.required && !(formData[field.name as keyof T] ?? '').toString().trim()
  )

  const handleSubmit = () => {
    onSave(formData)
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>{entity?.uid ? 'Edit' : 'Add New'} {title}</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          {fields.map((field) => (
            <FormControl key={field.name} id={field.name} mb={4} isRequired={field.required}>
              <FormLabel>
                {field.label}
                {field.required && <span style={{ color: 'red' }}> *</span>}
              </FormLabel>

              {field.options ? (
                <Select
                  name={field.name}
                  value={(formData[field.name as keyof T] as string) || ''}
                  onChange={handleChange}
                >
                  {field.options.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
              ) : (
                <Input
                  type="text"
                  name={field.name}
                  value={(formData[field.name as keyof T] as string) || ''}
                  onChange={handleChange}
                />
              )}
            </FormControl>
          ))}
        </ModalBody>
        <ModalFooter>
          <Button isDisabled={isSaveDisabled} colorScheme="blue" mr={3} onClick={handleSubmit}>
            {entity?.uid ? 'Save Changes' : `Add ${title}`}
          </Button>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}

export default AddEditModal
