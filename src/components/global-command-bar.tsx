
'use client';

import * as React from 'react';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { useCommandState } from '@/hooks/use-command-state';
import { Loader2, User, FileText, FolderKanban } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function GlobalCommandBar() {
  const { open, setOpen } = useCommandState();
  const [query, setQuery] = React.useState('');

  const router = useRouter();

  const runCommand = React.useCallback((command: () => void) => {
    setOpen(false);
    command();
  }, [setOpen]);

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput
        placeholder="Type a command or search..."
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Suggestions">
          <CommandItem onSelect={() => runCommand(() => router.push('/profile'))}>
            <User className="mr-2 h-4 w-4" />
            <span>Profile</span>
          </CommandItem>
           <CommandItem onSelect={() => runCommand(() => router.push('/management/programs'))}>
            <FolderKanban className="mr-2 h-4 w-4" />
            <span>Manage Programs</span>
          </CommandItem>
           <CommandItem onSelect={() => runCommand(() => router.push('/forms/expense'))}>
            <FileText className="mr-2 h-4 w-4" />
            <span>New Expense Report</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
