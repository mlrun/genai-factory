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

import { Box, Divider, Text } from '@chakra-ui/react';
import ProjectHeader from '@components/feature/Project/ProjectHeader';
import ProjectTabs from '@components/feature/Project/ProjectTabs';
import Loading from '@components/shared/Loading';
import { useProject } from '@queries';

export const ProjectPage = () => {
  const { data: project, isLoading } = useProject();

  if (!project) {
    if (isLoading) return <Loading />;
    return (
      <Text px={6} py={4}>
        Project not found.
      </Text>
    );
  }

  return (
    <Box p={10} width="100%" mx="auto">
      <ProjectHeader
        name={project.name}
        description={project.description}
        uid={project.uid}
        created={project.created}
        updated={project.updated}
        labels={project.labels}
      />

      <Divider my={10} />

      <ProjectTabs />
    </Box>
  );
};
