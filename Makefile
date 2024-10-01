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

CONTROLLER_NAME = "genai-factory-controller"

.PHONY: help
help: ## Display available commands
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'

.PHONY: all
all:
	$(error please pick a target)

.PHONY: up
up: ## Deploy GenAI factory controller and UI
	# Build the Docker image using the
	docker compose up -d --build
	@echo "GenAI Factory Controller and UI application are running in the background"
	@echo "UI application is available at http://localhost:3000"
	@echo "Controller API is available at http://localhost:8001"

.PHONY: down
down: ## Stop GenAI factory controller and UI
	# Build the Docker image using the
	docker compose down

.PHONY: controller
controller:
	# Build controller's image:
	docker build -f controller/Dockerfile -t $(CONTROLLER_NAME):latest .

	# Run controller locally in a container:
	docker run -d -p 8001:8001 --name $(CONTROLLER_NAME) $(CONTROLLER_NAME):latest

	# Announce the server is running:
	@echo "GenAI Factory Controller is running in the background"

.PHONY: fmt
fmt: ## Format the code using Ruff
	@echo "Running ruff checks and fixes..."
	python -m ruff check --fix-only
	python -m ruff format

.PHONY: lint
lint: fmt-check lint-imports ## Run lint on the code

lint-imports: ## Validates import dependencies
	@echo "Running import linter"
	lint-imports

.PHONY: fmt-check
fmt-check: ## Check the code (using ruff)
	@echo "Running ruff checks..."
	python -m ruff check --exit-non-zero-on-fix
	python -m ruff format --check
