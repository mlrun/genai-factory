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
  Box,
  Code,
  Heading,
  Tag,
  Text,
  useColorModeValue,
  VStack,
} from '@chakra-ui/react';

type ProjectHeaderProps = {
  name: string;
  description?: string;
  uid?: string;
  created?: string;
  updated?: string;
  labels?: Record<string, string> | string | null;
};

const ProjectHeader = ({
  created,
  description,
  labels,
  name,
  uid,
  updated,
}: ProjectHeaderProps) => {
  const bg = useColorModeValue('gray.50', 'gray.700');

  const renderLabels = () => {
    if (!labels || (typeof labels === 'string' && labels.trim() === ''))
      return <Text color="gray.500">No labels</Text>;

    if (typeof labels === 'string') {
      return (
        <Tag colorScheme="purple" variant="subtle" borderRadius="md">
          {labels}
        </Tag>
      );
    }

    return Object.entries(labels).map(([key, val]) => (
      <Tag
        key={`${key}:${val}`}
        colorScheme="purple"
        variant="subtle"
        borderRadius="md"
        whiteSpace="nowrap"
      >
        {key} : {val}
      </Tag>
    ));
  };

  return (
    <VStack align="start" spacing={6}>
      <Heading fontSize="3xl" fontWeight="bold">
        {name}
      </Heading>

      <Text fontSize="lg" color="gray.600">
        {description ?? 'No description provided.'}
      </Text>

      <Box bg={bg} p={4} rounded="md" w="full">
        <Text fontWeight="medium" mb={1}>
          UID
        </Text>
        <Code
          p={2}
          display="block"
          whiteSpace="nowrap"
          w="full"
          overflowX="auto"
        >
          {uid}
        </Code>
      </Box>

      <Box w="full">
        <Text color="gray.500">
          <strong>Created:</strong>{' '}
          {created ? new Date(created).toLocaleString() : 'N/A'}
        </Text>
        <Text color="gray.500">
          <strong>Updated:</strong>{' '}
          {updated ? new Date(updated).toLocaleString() : 'N/A'}
        </Text>
      </Box>

      <Box w="full" display="flex" alignItems="center" gap={2} flexWrap="wrap">
        <Text color="gray.500" fontWeight="semibold">
          Labels:
        </Text>
        {renderLabels()}
      </Box>
    </VStack>
  );
};

export default ProjectHeader;
