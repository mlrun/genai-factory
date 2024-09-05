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

import { Flex, useColorMode } from '@chakra-ui/react'
import { colors } from '@shared/theme'
import { ReactNode } from 'react'

type SidebarProps = {
  children: ReactNode
}

const Sidebar = ({ children }: SidebarProps) => {
  const { colorMode } = useColorMode()

  return (
    <Flex
      minWidth={72}
      bg={colorMode == 'dark' ? colors.sidebarDark : colors.sidebarLight}
      flexFlow={'column'}
      gap={4}
      padding={4}
      alignItems={'flex-start'}
    >
      {children}
    </Flex>
  )
}

export default Sidebar
