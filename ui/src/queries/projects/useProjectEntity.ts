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

import { useCallback, useMemo } from 'react';

import { useProject } from '@queries';
import { APIResponse } from '@shared/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { validateApiResponse } from '@utils/validateApiResponse';

import { QUERY_DEFAULTS } from '@constants';

type FetchFn<T> = (projectName: string) => Promise<APIResponse<T[]>>;
type CreateFn<T> = (projectName: string, data: T) => Promise<void>;
type UpdateFn<T> = (projectName: string, data: Partial<T>) => Promise<void>;
type DeleteFn = (projectName: string, id: string) => Promise<void>;

export function useProjectEntity<T>(
  key: string,
  fetchFn: FetchFn<T>,
  createFn: CreateFn<T>,
  updateFn: UpdateFn<T>,
  deleteFn: DeleteFn,
) {
  const queryClient = useQueryClient();
  const { data: project } = useProject();

  const projectName = useMemo(() => project?.name ?? '', [project]);

  const query = useQuery<T[]>({
    queryKey: [key, projectName],
    queryFn: async () => {
      if (!projectName) return [];
      return validateApiResponse(fetchFn(projectName), `fetch ${key}`);
    },
    enabled: !!projectName,
    ...QUERY_DEFAULTS,
  });

  const invalidate = useCallback(
    () => queryClient.invalidateQueries({ queryKey: [key, projectName] }),
    [queryClient, key, projectName],
  );

  const create = useMutation({
    mutationFn: async (entity: T) => {
      if (!projectName)
        throw new Error(
          `[useProjectEntity:${key}] create called without a project selected`,
        );
      return createFn(projectName, entity);
    },
    onSuccess: invalidate,
  });

  const update = useMutation({
    mutationFn: async (entity: Partial<T>) => {
      if (!projectName)
        throw new Error(
          `[useProjectEntity:${key}] update called without a project selected`,
        );
      return updateFn(projectName, entity);
    },
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      if (!projectName)
        throw new Error(
          `[useProjectEntity:${key}] remove called without a project selected`,
        );
      return deleteFn(projectName, id);
    },
    onSuccess: invalidate,
  });

  return {
    ...query,
    create,
    update,
    remove,
    project,
  };
}
