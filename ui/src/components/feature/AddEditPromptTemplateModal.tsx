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
import { PromptTemplate } from '@shared/types/promptTemplate'
import { useAtom } from 'jotai'
import React, { useEffect, useState } from 'react'

type PromptTemplateModalProps = {
  isOpen: boolean
  onClose: () => void
  onSave: (promptTemplate: PromptTemplate) => void
  promptTemplate?: PromptTemplate
}

const AddEditPromptTemplateModal: React.FC<PromptTemplateModalProps> = ({
  isOpen,
  onClose,
  onSave,
  promptTemplate
}) => {
  const [publicUser] = useAtom(publicUserAtom)
  const [formData, setFormData] = useState<PromptTemplate>(
    promptTemplate || {
      name: '',
      description: '',
      owner_id: publicUser.uid as string,
      project_id: '',
      text: '',
      arguments: ['prompt']
    }
  )
  useEffect(() => {
    if (promptTemplate) {
      setFormData(promptTemplate)
    }
  }, [promptTemplate])

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
          {promptTemplate?.uid ? 'Edit' : 'Add New'} {' PromptTemplate'}
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <FormControl id="name" mb={4}>
            <FormLabel>PromptTemplate Name</FormLabel>
            <Input type="text" name="name" value={formData.name || ''} onChange={handleChange} />
          </FormControl>
          <FormControl id="description" mb={4}>
            <FormLabel>Description</FormLabel>
            <Input type="text" name="description" value={formData.description || ''} onChange={handleChange} />
          </FormControl>
          <FormControl id="text" mb={4}>
            <FormLabel>Text</FormLabel>
            <Input type="text" name="text" value={formData.text || ''} onChange={handleChange} />
          </FormControl>
        </ModalBody>
        <ModalFooter>
          <Button isDisabled={!formData.description || !formData.name} colorScheme="blue" mr={3} onClick={handleSubmit}>
            {promptTemplate ? 'Save Changes' : 'Add PromptTemplate'}
          </Button>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}

export default AddEditPromptTemplateModal
