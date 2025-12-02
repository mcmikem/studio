
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
import { omutoAIFlow } from '@/ai/flows/omuto-ai-flow'; // Direct import of the flow
import { Loader2, User, FileText, FolderKanban } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useDebounce } from 'use-debounce';
import type { SearchResultItem } from '@/lib/types';


async function performSearch(query: string): Promise<SearchResultItem[]> {
    // This is a placeholder. In a real scenario, you might have a dedicated search flow.
    // For now, we'll simulate by calling the omutoAIFlow and trying to parse a result.
    // This is not ideal but demonstrates the concept.
    console.warn("performSearch is using a simulated search via omutoAIFlow and is not a dedicated search endpoint.");
    return []; 
}


export function GlobalCommandBar() {
  const { open, setOpen } = useCommandState();
  const [query, setQuery] = React.useState('');
  const [debouncedQuery] = useDebounce(query, 300);
  const [results, setResults] = React.useState<any[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const router = useRouter();

  React.useEffect(() => {
    const runSearch = async () => {
      if (debouncedQuery.length < 2) {
        setResults([]);
        return;
      }
      setIsLoading(true);
      try {
        // Since we don't have a dedicated search tool anymore,
        // this part of the functionality will be limited.
        // We'll leave the structure here for future implementation.
        setResults([]);
      } catch (error) {
        console.error('Search failed:', error);
      } finally {
        setIsLoading(false);
      }
    };
    runSearch();
  }, [debouncedQuery]);

  const runCommand = React.useCallback((command: () => void) => {
    setOpen(false);
    command();
  }, [setOpen]);

  const resultIcons: { [key: string]: React.ElementType } = {
      'User': User,
      'Program': FolderKanban,
      'Expense': FileText,
  }

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput
        placeholder="Search for staff, programs, expenses..."
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        {isLoading && (
            <div className="p-4 flex items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
        )}
        {!isLoading && results.length === 0 && debouncedQuery.length > 1 && (
            <CommandEmpty>No results found for "{debouncedQuery}".</CommandEmpty>
        )}
        {results.length > 0 && (
          <CommandGroup heading="Search Results">
            {results.map((result) => {
              const Icon = resultIcons[result.type] || FileText;
              return (
                <CommandItem
                  key={result.id}
                  value={`${result.title}-${result.id}`}
                  onSelect={() => {
                    runCommand(() => router.push(result.url));
                  }}
                >
                  <Icon className="mr-2 h-4 w-4" />
                  <span>{result.title}</span>
                  <span className="ml-auto text-xs text-muted-foreground">{result.type}</span>
                </CommandItem>
              );
            })}
          </CommandGroup>
        )}
         <CommandSeparator />
        <CommandGroup heading="Quick Links">
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

    