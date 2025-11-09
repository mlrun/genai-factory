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

import { useState } from 'react';

import { MoonIcon, SunIcon } from '@chakra-ui/icons';
import {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Box,
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  Flex,
  Menu,
  MenuItem,
  NumberDecrementStepper,
  NumberIncrementStepper,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  PinInput,
  PinInputField,
  Progress,
  RangeSlider,
  RangeSliderFilledTrack,
  RangeSliderThumb,
  RangeSliderTrack,
  Select,
  SkeletonCircle,
  SkeletonText,
  Slider,
  SliderFilledTrack,
  SliderMark,
  SliderThumb,
  SliderTrack,
  Stack,
  Switch,
  Text,
  Tooltip,
  useColorMode,
} from '@chakra-ui/react';

interface RightbarProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginChange: (value: boolean) => void;
}

const Rightbar = ({ isOpen, onClose, onLoginChange }: RightbarProps) => {
  const { colorMode, toggleColorMode } = useColorMode();
  const [sliderValue, setSliderValue] = useState(25);
  const [showTooltip, setShowTooltip] = useState(false);
  return (
    <Drawer isOpen={isOpen} placement="right" onClose={onClose}>
      <DrawerOverlay />
      <DrawerContent>
        <DrawerCloseButton />
        <DrawerHeader>Preferences</DrawerHeader>
        <DrawerBody>
          <Flex gap={8} width={'100%'} flexDirection={'column'}>
            <Flex alignItems={'center'} gap={2}>
              <SunIcon />
              <Switch
                defaultChecked={colorMode === 'dark'}
                onChange={toggleColorMode}
              />
              <MoonIcon />
            </Flex>
            <Menu>
              <MenuItem onClick={() => onLoginChange(false)}>Logout</MenuItem>
            </Menu>
            <Accordion>
              <AccordionItem>
                <h2>
                  <AccordionButton>
                    <Box as="span" flex="1" textAlign="left">
                      Section 1 title
                    </Box>
                    <AccordionIcon />
                  </AccordionButton>
                </h2>
                <AccordionPanel pb={4}>
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed
                  do eiusmod tempor incididunt ut labore et dolore magna aliqua.
                  Ut enim ad minim veniam, quis nostrud exercitation ullamco
                  laboris nisi ut aliquip ex ea commodo consequat.
                </AccordionPanel>
              </AccordionItem>
            </Accordion>
            <Flex flexDirection={'column'}>
              <Text>Slider</Text>
              <Slider
                id="slider"
                defaultValue={sliderValue}
                min={0}
                max={100}
                colorScheme="teal"
                onChange={(v) => setSliderValue(v)}
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
              >
                <SliderMark value={25} mt="1" ml="-2.5" fontSize="sm">
                  25%
                </SliderMark>
                <SliderMark value={50} mt="1" ml="-2.5" fontSize="sm">
                  50%
                </SliderMark>
                <SliderMark value={75} mt="1" ml="-2.5" fontSize="sm">
                  75%
                </SliderMark>
                <SliderTrack>
                  <SliderFilledTrack />
                </SliderTrack>
                <Tooltip
                  hasArrow
                  bg="teal.500"
                  color="white"
                  placement="top"
                  isOpen={showTooltip}
                  label={`${sliderValue}%`}
                >
                  <SliderThumb />
                </Tooltip>
              </Slider>
            </Flex>
            <Flex flexDirection={'column'}>
              <Text>Number input</Text>
              <NumberInput defaultValue={15} max={30} clampValueOnBlur={false}>
                <NumberInputField />
                <NumberInputStepper>
                  <NumberIncrementStepper />
                  <NumberDecrementStepper />
                </NumberInputStepper>
              </NumberInput>
            </Flex>
            <Flex flexDirection={'column'}>
              <Text>Pin input</Text>
              <Flex>
                <PinInput otp>
                  <PinInputField />
                  <PinInputField />
                  <PinInputField />
                  <PinInputField />
                </PinInput>
              </Flex>
            </Flex>
            <Flex flexDirection={'column'}>
              <Text>Range Slider</Text>
              <RangeSlider
                aria-label={['min', 'max']}
                colorScheme="pink"
                defaultValue={[10, 30]}
              >
                <RangeSliderTrack>
                  <RangeSliderFilledTrack />
                </RangeSliderTrack>
                <RangeSliderThumb index={0} />
                <RangeSliderThumb index={1} />
              </RangeSlider>
            </Flex>

            <Flex flexDirection={'column'}>
              <Text>Select</Text>

              <Stack spacing={3}>
                <Select placeholder="extra small size" size="xs">
                  <option value="option1">Option 1</option>
                  <option value="option2">Option 2</option>
                  <option value="option3">Option 3</option>
                </Select>
                <Select placeholder="small size" size="sm" />
                <Select placeholder="medium size" size="md" />
                <Select placeholder="large size" size="lg" />
              </Stack>
            </Flex>

            <Flex flexDirection={'column'}>
              <Text>Progress loader</Text>
              <Progress size="xs" isIndeterminate />
            </Flex>
          </Flex>

          <Flex flexDirection={'column'}>
            <Text>Skeleton</Text>
            <Box padding="6" boxShadow="lg" bg="white">
              <SkeletonCircle
                startColor="pink.500"
                endColor="orange.500"
                size="10"
              />
              <SkeletonText
                mt="4"
                noOfLines={4}
                spacing="4"
                skeletonHeight="2"
              />
            </Box>
          </Flex>
        </DrawerBody>

        <DrawerFooter>
          <Text fontSize={'xs'}>All rights reserved</Text>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

export default Rightbar;
