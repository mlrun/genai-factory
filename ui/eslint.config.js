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

import { defineConfig } from "eslint/config";
import pluginReact from "eslint-plugin-react";
import simpleImportSort from "eslint-plugin-simple-import-sort";
import sortDestructureKeys from "eslint-plugin-sort-destructure-keys";
import globals from "globals";
import tseslint from "typescript-eslint";

import js from "@eslint/js";

export default defineConfig([
  { files: ["**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
    plugins: {
      js,
      "simple-import-sort": simpleImportSort,
      "sort-destructure-keys": sortDestructureKeys,
    },
    extends: ["js/recommended"],
    languageOptions: { globals: globals.browser }
  },
  tseslint.configs.recommended,
  pluginReact.configs.flat.recommended,

  {
    rules: {
      "react/react-in-jsx-scope": 0,
      "sort-destructure-keys/sort-destructure-keys": ["error", { caseSensitive: false }],
      "simple-import-sort/imports": ["error", {
        groups: [
          ["^react$", "^next", "^[a-z]"],
          ["^@"],
          ["^~"],
          ["^\\./(?=.*/)(?!/?$)", "^\\.(?!/?$)", "^\\./?$"],
          ["^.+(utils|store|hooks|assets|routes|interfaces)"],
          ["^.+\\.(png|jpg|jpeg|gif|svg)$"],
          ["^.+constant"],
          ["^.+\\.s?css$"],
          ["^\\u0000"],
        ],
      }],
    }
  }
]);
