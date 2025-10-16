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

import React, { useEffect } from 'react';
import { useAtom } from 'jotai';
import { useNavigate } from 'react-router-dom';

import {
  projectsAtom,
  projectsLoadingAtom,
  projectsWithFetchAtom,
} from '@atoms/projects';
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
import Layout from '@components/feature/Layout';
import AddEditProjectModal from '@components/feature/Projects/AddEditProjectModal';
import ProjectCard from '@components/feature/Projects/ProjectCard';
import Loading from '@components/shared/Loading';
import Client from '@services/Api';
import { Project } from '@shared/types/project';

export const ProjectsPage = () => {
  const navigate = useNavigate();
  const toast = useToast();

  const [projects] = useAtom(projectsAtom);
  const [loading] = useAtom(projectsLoadingAtom);

  const [, fetchProjects] = useAtom(projectsWithFetchAtom);

  const {
    isOpen: isModalOpen,
    onClose: onModalClose,
    onOpen: onModalOpen,
  } = useDisclosure();

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleSave = async (project: Project) => {
    try {
      if (project.uid) {
        await Client.updateProject(project);
        toast({
          title: 'Project updated.',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } else {
        await Client.createProject(project);
        toast({
          title: 'Project added successfully.',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      }
      await fetchProjects();
    } catch (error) {
      console.log(`Error: ${error}`);
      console.error('Error saving project:', error);
      toast({
        title: 'Error saving project.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleOpenPlayground = () => {
    navigate('/chat');
  };

  if (loading) return <Loading />;

  return (
    <Layout>
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
            {projects.map((project) => (
              <ProjectCard
                key={project.uid ?? project.name}
                project={project}
              />
            ))}
          </SimpleGrid>
        </VStack>
      </Container>
      <AddEditProjectModal
        isOpen={isModalOpen}
        onClose={onModalClose}
        onSave={handleSave}
      />
    </Layout>
  );
};
