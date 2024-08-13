# Copyright 2023 Iguazio
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

ARG PYTHON_VERSION=3.9.19
FROM python:${PYTHON_VERSION}

# Update OS packages:
RUN apt-get update && \
    DEBIAN_FRONTEND=noninteractive apt-get -y upgrade && \
    rm -rf /var/lib/apt/lists/*

RUN apt update -qqq \
    && apt -y upgrade \
    && apt install -y \
    build-essential \
    cmake \
    gcc \
    && rm -rf /var/lib/apt/lists/* \

WORKDIR /controller
COPY /controller/src /controller/src
COPY /controller/requirements.txt /controller/

# Make the data directory:
RUN mkdir -p ../data

# Install requirements:
RUN pip install -r /controller/requirements.txt

# Initiate database:
RUN python -m controller.src.main initdb

# Run the controller's API server:
CMD ["uvicorn", "controller.src.api.api:app", "--port", "8001"]
