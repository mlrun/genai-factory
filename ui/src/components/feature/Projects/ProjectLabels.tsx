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

interface ProjectLabelsProps {
  labels?: string | Record<string, string>;
}

const ProjectLabels = ({ labels }: ProjectLabelsProps) => {
  const parsed =
    typeof labels === 'object' && labels && Object.keys(labels).length > 0
      ? labels
      : null;

  if (!parsed) return <span>-</span>;

  return (
    <div className="flex flex-wrap gap-1.5">
      {Object.entries(parsed).map(([key, value]) => (
        <span
          key={key}
          className="text-sm font-medium px-3 py-1.5 rounded-full
            border border-project-label-border
            text-project-label-text
            bg-project-label-gradient"
        >
          {key}: {value}
        </span>
      ))}
    </div>
  );
};

export default ProjectLabels;
