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

export function filterTableData<T extends Record<string, unknown>>(
  data: T[],
  filterText: string,
): T[] {
  if (!filterText) return data;

  const lowerFilter = filterText.toLowerCase();

  return data.filter((item) =>
    Object.values(item).some((value) =>
      value?.toString().toLowerCase().includes(lowerFilter),
    ),
  );
}

export function sortTableData<T extends Record<string, string | number | Date>>(
  rows: T[],
  key: Extract<keyof T, string> | null,
): T[] {
  if (!key) return rows;

  return [...rows].sort((first, second) => {
    const firstValue = first[key];
    const secondValue = second[key];

    const firstDate =
      firstValue instanceof Date ? firstValue : new Date(firstValue);
    const secondDate =
      secondValue instanceof Date ? secondValue : new Date(secondValue);
    const isValidDate =
      !isNaN(firstDate.getTime()) && !isNaN(secondDate.getTime());

    if (isValidDate) {
      return firstDate.getTime() - secondDate.getTime();
    }

    const firstNumber = Number(firstValue);
    const secondNumber = Number(secondValue);
    const isNumber = !isNaN(firstNumber) && !isNaN(secondNumber);

    if (isNumber) {
      return firstNumber - secondNumber;
    }

    return String(firstValue ?? '').localeCompare(String(secondValue ?? ''));
  });
}
