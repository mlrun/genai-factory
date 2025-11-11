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

import { useNavigate } from 'react-router-dom';

import { Badge, Box, Heading, Text, VStack } from '@chakra-ui/react';
import { Project } from '@shared/types/project';

interface ProjectCardProps {
  project: Project;
}

export default function ProjectCard({ project }: ProjectCardProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/projects/${project.name}`);
  };

  const labelText =
    typeof project.labels === 'string'
      ? project.labels
      : project.labels
        ? Object.entries(project.labels)
            .map(([k, v]) => `${k}: ${v}`)
            .join(', ')
        : 'No labels';

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
        <Heading fontSize="lg">{project.name}</Heading>
        <Text>{project.description ?? 'No description'}</Text>
        {project.uid && <Badge>UID: {project.uid}</Badge>}
        <Text fontSize="sm" color="gray.500">
          Created:{' '}
          {project.created ? new Date(project.created).toLocaleString() : 'N/A'}
        </Text>
        <Text fontSize="sm" color="gray.500">
          Labels: {labelText}
        </Text>
      </VStack>
    </Box>
  );
}
