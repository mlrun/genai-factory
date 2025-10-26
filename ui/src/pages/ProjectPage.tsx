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

import { useParams } from 'react-router-dom';

import { Box, Divider, Text } from '@chakra-ui/react';
import Layout from '@components/feature/Layout';
import ProjectHeader from '@components/feature/Project/ProjectHeader';
import ProjectTabs from '@components/feature/Project/ProjectTabs';
import Loading from '@components/shared/Loading';
import { useProject } from '@queries';

export const ProjectPage = () => {
  const { name } = useParams();

  const {
    data: project,
    isLoading
  } = useProject(name);

  if (!project) {
    if (isLoading) return <Loading />;
    return (
      <Text px={6} py={4}>
        Project not found.
      </Text>
    );
  }

  return (
    <Layout>
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
    </Layout>
  );
};
