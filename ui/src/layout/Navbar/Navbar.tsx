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

import { useLocation, useNavigate } from 'react-router-dom';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const isPathActive = (current: string, base: string) =>
    current === base || current.startsWith(base + '/');

  const navItems = [
    { label: 'Projects', path: '/projects' },
    { label: 'Chat', path: '/chat' },
  ];

  return (
    <div
      className="
        sticky top-0
        flex items-center justify-between
        h-[64px] bg-white z-10
        border-b border-[rgba(72,63,86,0.12)]
      "
      data-testid="topbar"
    >
      <div className="flex items-center pl-4 gap-2">
        {navItems.map(({ label, path }) => {
          const isActive = isPathActive(location.pathname, path);

          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              className={`
                px-3 py-2 rounded-md text-sm
                ${
                  isActive
                    ? 'font-bold bg-blue-500 text-white'
                    : 'font-normal hover:bg-gray-100'
                }
              `}
            >
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default Navbar;
