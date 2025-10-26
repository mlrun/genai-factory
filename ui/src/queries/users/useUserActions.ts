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

import Client from '@services/Api';
import { APIResponse, User } from '@shared/types';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export function useUserActions() {
  const queryClient = useQueryClient();

  const invalidateUsers = async () => {
    await queryClient.invalidateQueries({ queryKey: ['users'] });
  };

  const validateApiResponse = async (apiCall: Promise<APIResponse>) => {
    const response = await apiCall;
    if (!response.success) {
      throw new Error(response.error || 'API request failed');
    }
    return response.data;
  };

  const createUser = useMutation({
    mutationFn: (user: User) => validateApiResponse(Client.createUser(user)),
    onSuccess: invalidateUsers,
  });

  const updateUser = useMutation({
    mutationFn: (user: User) => validateApiResponse(Client.updateUser(user)),
    onSuccess: invalidateUsers,
  });

  const deleteUser = useMutation({
    mutationFn: (id: string) => validateApiResponse(Client.deleteUser(id)),
    onSuccess: invalidateUsers,
  });

  return { createUser, updateUser, deleteUser };
}
