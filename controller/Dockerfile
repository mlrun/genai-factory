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

ARG PYTHON_VERSION=3.11.6
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

# Install requirements:
COPY /controller/requirements.txt /controller/
RUN pip install -r /controller/requirements.txt

# Copy controller source code
COPY /controller/src /controller/src

# Make the data directory:
RUN mkdir -p ../data

# Set python path environment variable:
ENV PYTHONPATH="/controller/src"
ENV CTRL_DATA_PATH="/data"

# Expose the controller's API port:
EXPOSE 8001

# Initiate database:
RUN python -m controller initdb

# Run the controller's API server:
CMD ["uvicorn", "controller.api:app","--host", "0.0.0.0", "--port", "8001", "--reload"]
