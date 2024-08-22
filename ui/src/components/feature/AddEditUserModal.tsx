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
  ModalOverlay
} from '@chakra-ui/react'
import { User } from '@shared/types'
import React, { useEffect, useState } from 'react'

type UserModalProps = {
  isOpen: boolean
  onClose: () => void
  onSave: (user: User) => void
  user?: User
}

const AddEditUserModal: React.FC<UserModalProps> = ({ isOpen, onClose, onSave, user }) => {
  const [formData, setFormData] = useState<User>(user || { name: '', email: '', full_name: '' })
  useEffect(() => {
    if (user) {
      setFormData(user)
    }
  }, [user])

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
          {user?.uid ? 'Edit' : 'Add New'} {' User'}
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <FormControl id="name" mb={4}>
            <FormLabel>Username</FormLabel>
            <Input type="text" name="name" value={formData.name || ''} onChange={handleChange} />
          </FormControl>
          <FormControl id="email" mb={4}>
            <FormLabel>Email</FormLabel>
            <Input type="email" name="email" value={formData.email || ''} onChange={handleChange} />
          </FormControl>
          <FormControl id="role" mb={4}>
            <FormLabel>Full Name</FormLabel>
            <Input type="text" name="full_name" value={formData.full_name || ''} onChange={handleChange} />
          </FormControl>
        </ModalBody>
        <ModalFooter>
          <Button
            isDisabled={!formData.email || !formData.name || !formData.full_name}
            colorScheme="blue"
            mr={3}
            onClick={handleSubmit}
          >
            {user ? 'Save Changes' : 'Add User'}
          </Button>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}

export default AddEditUserModal
