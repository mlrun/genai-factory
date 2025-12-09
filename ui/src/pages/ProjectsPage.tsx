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

import { AddIcon } from '@chakra-ui/icons';
import {
  Button,
  Container,
  Flex,
  Heading,
  SimpleGrid,
  useDisclosure,
  useToast,
  VStack,
} from '@chakra-ui/react';
import AddEditProjectModal from '@components/feature/Projects/AddEditProjectModal';
import ProjectCard from '@components/feature/Projects/ProjectCard';
import Loading from '@components/shared/Loading';
import { useProjectActions, useProjects } from '@queries';
import { Project } from '@shared/types/project';

const ProjectsPage = () => {
  const navigate = useNavigate();
  const { createProject, updateProject } = useProjectActions();

  const toast = useToast();

  const { data: projects, isLoading } = useProjects();

  const {
    isOpen: isModalOpen,
    onClose: onModalClose,
    onOpen: onModalOpen,
  } = useDisclosure();

  const handleSave = async (project: Project) => {
    try {
      if (project.uid) {
        await updateProject.mutateAsync(project);
        toast({ title: 'Project updated.', status: 'success' });
      } else {
        await createProject.mutateAsync(project);
        toast({ title: 'Project added successfully.', status: 'success' });
      }
    } catch (error) {
      console.log(error);
      toast({ title: 'Error saving project.', status: 'error' });
    }
  };

  const handleOpenPlayground = () => {
    navigate('/chat');
  };

  if (isLoading) return <Loading />;

  return (
    <Container maxW="container.lg" py={8}>
      <VStack spacing={6} align="start">
        <Flex width="100%" justifyContent={'space-between'}>
          <Heading as="h2" size="lg">
            Projects
          </Heading>
          <Flex gap={4}>
            <Button
              leftIcon={<AddIcon />}
              onClick={() => {
                onModalOpen();
              }}
            >
              New
            </Button>
            <Button
              colorScheme="blue"
              alignSelf="end"
              onClick={handleOpenPlayground}
            >
              Open Playground
            </Button>
          </Flex>
        </Flex>

        <SimpleGrid columns={[1, null, 2]} spacing={6} w="100%">
          {projects ? (
            projects.map((project) => (
              <ProjectCard
                key={project.uid ?? project.name}
                project={project}
              />
            ))
          ) : (
            <div>No projects</div>
          )}
        </SimpleGrid>
      </VStack>
      <AddEditProjectModal
        isOpen={isModalOpen}
        onClose={onModalClose}
        onSave={handleSave}
      />
    </Container>
  );
};

export default ProjectsPage;
