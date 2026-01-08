/*
Copyright 2024 Iguazio Systems Ltd.

Licensed under the Apache License, Version 2.0 (the "License") with
an addition restriction as set forth herein. You may not use this
file except in compliance with the License. You may obtain a copy of
the License at http://www.apache.org/licenses/LICENSE-2.0.

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or
implied. See the License for the specific language governing
permissions and limitations under the License.

In addition, you may not use the software for any purposes that are
illegal under applicable law, and the grant of the foregoing license
under the Apache 2.0 license is conditioned upon your compliance with
such restriction.
*/

import { useNavigate } from 'react-router-dom';

import { Badge, Box, Heading, Text, VStack } from '@chakra-ui/react';
import { Project } from '@shared/types/project';

export default function ProjectCard({
  created,
  description,
  labels,
  name,
  uid,
}: Readonly<Project>) {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/projects/${name}`);
  };

  const getLabelText = () => {
    if (typeof labels === 'string') {
      return labels;
    }

    if (labels) {
      return Object.entries(labels)
        .map(([k, v]) => `${k}: ${v}`)
        .join(', ');
    }

    return 'No labels';
  };

  const labelText = getLabelText();

  return (
    <Box
      p={6}
      shadow="md"
      borderWidth="1px"
      borderRadius="lg"
      bg="white"
      cursor="pointer"
      _hover={{ shadow: 'lg', bg: 'gray.50' }}
      onClick={handleClick}
    >
      <VStack align="start" spacing={2}>
        <Heading fontSize="lg">{name}</Heading>
        <Text>{description ?? 'No description'}</Text>
        {uid && (
          <Badge maxW="100%" isTruncated>
            {uid}
          </Badge>
        )}
        <Text fontSize="sm" color="gray.500">
          Created: {created ? new Date(created).toLocaleString() : 'N/A'}
        </Text>
        <Text fontSize="sm" color="gray.500">
          Labels: {labelText}
        </Text>
      </VStack>
    </Box>
  );
}
