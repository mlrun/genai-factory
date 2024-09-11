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
import { Workflow, WorkflowType } from '@shared/types/workflow'
import { useAtom } from 'jotai'
import React, { useEffect, useState } from 'react'

type WorkflowModalProps = {
  isOpen: boolean
  onClose: () => void
  onSave: (workflow: Workflow) => void
  workflow?: Workflow
}

const AddEditWorkflowModal: React.FC<WorkflowModalProps> = ({ isOpen, onClose, onSave, workflow }) => {
  const [publicUser] = useAtom(publicUserAtom)
  const [formData, setFormData] = useState<Workflow>(
    workflow || {
      name: '',
      description: '',
      owner_id: publicUser.uid as string,
      project_id: '',
      workflow_type: WorkflowType.APPLICATION,
      deployment: ''
    }
  )
  useEffect(() => {
    if (workflow) {
      setFormData(workflow)
    }
  }, [workflow])

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
          {workflow?.uid ? 'Edit' : 'Add New'} {' Workflow'}
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <FormControl id="name" mb={4}>
            <FormLabel>Workflow Name</FormLabel>
            <Input type="text" name="name" value={formData.name || ''} onChange={handleChange} />
          </FormControl>
          <FormControl id="description" mb={4}>
            <FormLabel>Description</FormLabel>
            <Input type="text" name="description" value={formData.description || ''} onChange={handleChange} />
          </FormControl>
          <FormControl id="deployment" mb={4}>
            <FormLabel>Deployment</FormLabel>
            <Input type="text" name="deployment" value={formData.deployment || ''} onChange={handleChange} />
          </FormControl>
        </ModalBody>
        <ModalFooter>
          <Button isDisabled={!formData.description || !formData.name} colorScheme="blue" mr={3} onClick={handleSubmit}>
            {workflow ? 'Save Changes' : 'Add Workflow'}
          </Button>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}

export default AddEditWorkflowModal
