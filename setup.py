# Copyright 2023 Iguazio
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#   http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

from setuptools import setup


def get_requirements():
    with open("genai_factory/requirements.txt") as f:
        return f.read().splitlines()


setup(
    name="genai-factory",
    version="0.1",
    packages=["genai_factory"],
    install_requires=get_requirements(),
    entry_points={"console_scripts": ["genai-factory=genai_factory.__main__:main"]},
)
