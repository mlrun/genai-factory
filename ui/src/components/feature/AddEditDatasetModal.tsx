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

import { publicUserAtom } from '@atoms/index'
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
  ModalOverlay
} from '@chakra-ui/react'
import { Dataset } from '@shared/types/dataset'
import { useAtom } from 'jotai'
import React, { useEffect, useState } from 'react'

type DatasetModalProps = {
  isOpen: boolean
  onClose: () => void
  onSave: (dataset: Dataset) => void
  dataset?: Dataset
}

const AddEditDatasetModal: React.FC<DatasetModalProps> = ({ isOpen, onClose, onSave, dataset }) => {
  const [publicUser] = useAtom(publicUserAtom)
  const [formData, setFormData] = useState<Dataset>(
    dataset || {
      name: '',
      description: '',
      owner_id: publicUser.uid as string,
      project_id: '',
      task: '',
      path: ''
    }
  )
  useEffect(() => {
    if (dataset) {
      setFormData(dataset)
    }
  }, [dataset])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })
  }

  const handleSubmit = () => {
    onSave(formData)
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          {dataset?.uid ? 'Edit' : 'Add New'} {' Dataset'}
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <FormControl id="name" mb={4}>
            <FormLabel>Dataset Name</FormLabel>
            <Input type="text" name="name" value={formData.name || ''} onChange={handleChange} />
          </FormControl>
          <FormControl id="description" mb={4}>
            <FormLabel>Description</FormLabel>
            <Input type="text" name="description" value={formData.description || ''} onChange={handleChange} />
          </FormControl>
          <FormControl id="path" mb={4}>
            <FormLabel>Path</FormLabel>
            <Input type="text" name="path" value={formData.path || ''} onChange={handleChange} />
          </FormControl>
          <FormControl id="task" mb={4}>
            <FormLabel>Task</FormLabel>
            <Input type="text" name="task" value={formData.task || ''} onChange={handleChange} />
          </FormControl>
        </ModalBody>
        <ModalFooter>
          <Button isDisabled={!formData.description || !formData.name} colorScheme="blue" mr={3} onClick={handleSubmit}>
            {dataset ? 'Save Changes' : 'Add Dataset'}
          </Button>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}

export default AddEditDatasetModal
