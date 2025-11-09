import { Center, Spinner, Text, VStack } from '@chakra-ui/react';

interface LoadingProps {
  message?: string;
  fullPage?: boolean;
}

export default function Loading({
  fullPage = true,
  message = 'Loading...',
}: LoadingProps) {
  const content = (
    <VStack spacing={3}>
      <Spinner size="xl" thickness="4px" speed="0.65s" color="blue.500" />
      <Text color="gray.500">{message}</Text>
    </VStack>
  );

  return fullPage ? (
    <Center h="100vh" w="100vw">
      {content}
    </Center>
  ) : (
    <Center>{content}</Center>
  );
}
