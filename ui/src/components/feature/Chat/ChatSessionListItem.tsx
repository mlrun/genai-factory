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

import * as React from 'react';
import { Edit, MoreHorizontal, Trash2 } from 'lucide-react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@components/shared/DropdownMenu';
import { Session } from '@shared/types/session';

interface ChatSessionListItemProps {
  session: Session;
  isActive?: boolean;
  isEditing?: boolean;
  description: string;
  onChangeDescription: (value: string) => void;
  onConfirmRename: () => void;
  onDelete: (sessionName: string) => void;
  onStartRename: (session: Session) => void;
  onSelect: (session: Session) => void;
}

const ChatSessionListItem = ({
  description,
  isActive,
  isEditing,
  onChangeDescription,
  onConfirmRename,
  onDelete,
  onSelect,
  onStartRename,
  session,
}: ChatSessionListItemProps) => {
  const [open, setOpen] = React.useState(false);

  return (
    <div
      className={`group flex items-center justify-between gap-2 rounded-md border px-3 py-2 transition-colors ${
        isActive
          ? 'bg-muted border-gray-300'
          : 'border-transparent hover:bg-muted'
      }`}
    >
      <button
        onClick={() => onSelect(session)}
        className="flex-1 text-left cursor-pointer"
      >
        {isEditing ? (
          <input
            autoFocus
            value={description}
            onChange={(e) => onChangeDescription(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onConfirmRename()}
            onClick={(e) => e.stopPropagation()}
            className="w-full bg-transparent text-sm outline-none"
          />
        ) : (
          <div className="flex flex-col gap-0.5 min-w-0">
            <div className="flex items-center gap-1 min-w-0">
              <div className="truncate text-sm font-medium">
                {session.description}
              </div>
              <div className="truncate text-[8px] text-muted-foreground">
                {session.name}
              </div>
            </div>
            {session.created && (
              <div className="text-xs text-muted-foreground flex items-center gap-1">
                <span>
                  {new Date(session.created).toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
              </div>
            )}
          </div>
        )}
      </button>

      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <button
            className={`
                      p-1 cursor-pointer text-muted-foreground hover:text-foreground
                      transition-opacity
                      ${open ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}
                    `}
          >
            <MoreHorizontal size={16} />
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="start" className="w-40">
          <DropdownMenuItem onClick={() => onStartRename(session)}>
            <Edit className="mr-2 h-4 w-4" />
            Rename
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onDelete(session.name)}>
            <Trash2 className="mr-2 h-4 w-4 text-red-500" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default ChatSessionListItem;
