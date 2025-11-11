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

import { APIResponse } from '@shared/types';

export async function validateApiResponse<T>(
  apiCall: Promise<APIResponse<T>>,
  context: string,
): Promise<T> {
  const response = await apiCall;

  if (!response.success) {
    const message = response.error || `API request failed during ${context}`;
    console.error(`[${context} Error]:`, message);
    throw new Error(message);
  }

  return response.data;
}
