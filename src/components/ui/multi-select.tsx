
"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Check, X, ChevronDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"

const multiSelectVariants = cva(
  "m-1",
  {
    variants: {
      variant: {
        default:
          "border-foreground/10 text-foreground bg-foreground/10 hover:bg-foreground/20",
        secondary:
          "border-secondary-foreground/10 text-secondary-foreground bg-secondary/10 hover:bg-secondary/20",
        destructive:
          "border-destructive-foreground/10 text-destructive-foreground bg-destructive/10 hover:bg-destructive/20",
        inverted:
            "border-background/10 text-background bg-background/10 hover:bg-background/20",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

interface MultiSelectProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<multiSelectVariants> {
  options: {
    label: string
    value: string
    icon?: React.ComponentType<{ className?: string }>
  }[]
  onValueChange: (value: string[]) => void
  defaultValue: string[]
  placeholder?: string
  animation?: number
  maxCount?: number
  asChild?: boolean
  className?: string
}


const MultiSelect = React.forwardRef<HTMLButtonElement, MultiSelectProps>(
  (
    {
      options,
      onValueChange,
      variant,
      defaultValue = [],
      placeholder = "Select options",
      animation = 0,
      maxCount = 3,
      asChild = false,
      className,
      ...props
    },
    ref,
  ) => {
    const [selectedValues, setSelectedValues] = React.useState<string[]>(defaultValue)
    const [isPopoverOpen, setIsPopoverOpen] = React.useState(false)

    React.useEffect(() => {
      if (JSON.stringify(selectedValues) !== JSON.stringify(defaultValue)) {
        setSelectedValues(defaultValue)
      }
    }, [defaultValue, selectedValues])

    const handleInputKeyDown = (
      e: React.KeyboardEvent<HTMLInputElement>,
    ) => {
      if (e.key === "Enter") {
        setIsPopoverOpen(true)
      } else if (e.key === "Backspace" && !e.currentTarget.value) {
        const newSelectedValues = [...selectedValues]
        newSelectedValues.pop()
        setSelectedValues(newSelectedValues)
        onValueChange(newSelectedValues)
      }
    }

    const toggleOption = (value: string) => {
      const newSelectedValues = selectedValues.includes(value)
        ? selectedValues.filter((v) => v !== value)
        : [...selectedValues, value]
      setSelectedValues(newSelectedValues)
      onValueChange(newSelectedValues)
    }

    return (
      <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
        <PopoverTrigger asChild>
          <Button
            ref={ref}
            {...props}
            onClick={() => setIsPopoverOpen(!isPopoverOpen)}
            className="flex w-full p-1 rounded-md border min-h-10 h-auto items-center justify-between bg-inherit hover:bg-card"
          >
            {selectedValues.length > 0 ? (
              <div className="flex justify-between items-center w-full">
                <div className="flex flex-wrap items-center">
                  {selectedValues.slice(0, maxCount).map((value) => {
                    const option = options.find((o) => o.value === value)
                    return (
                      <Badge
                        key={value}
                        className={cn(multiSelectVariants({ variant, className }))}
                      >
                        {option?.label}
                        <X
                          className="ml-2 h-4 w-4 cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation()
                            toggleOption(value)
                          }}
                        />
                      </Badge>
                    )
                  })}
                  {selectedValues.length > maxCount && (
                    <Badge
                      className={cn(
                        "bg-transparent text-foreground border-foreground/10",
                        multiSelectVariants({ variant, className }),
                      )}
                    >
                      {`+ ${selectedValues.length - maxCount} more`}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <X
                    className="h-4 w-4 cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelectedValues([])
                      onValueChange([])
                    }}
                  />
                  <Separator
                    orientation="vertical"
                    className="flex min-h-6 h-full"
                  />
                  <ChevronDown className="h-4 w-4" />
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between w-full mx-auto">
                <span className="text-sm text-muted-foreground mx-3">
                  {placeholder}
                </span>
                <ChevronDown className="h-4 w-4 mx-2" />
              </div>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0">
          <Command>
            <CommandInput
              placeholder="Search..."
              onKeyDown={handleInputKeyDown}
            />
            <CommandList>
              <CommandEmpty>No results found.</CommandEmpty>
              <CommandGroup>
                {options.map((option) => {
                  const isSelected = selectedValues.includes(option.value)
                  return (
                    <CommandItem
                      key={option.value}
                      onSelect={() => toggleOption(option.value)}
                    >
                      <div
                        className={cn(
                          "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                          isSelected
                            ? "bg-primary text-primary-foreground"
                            : "opacity-50 [&_svg]:invisible",
                        )}
                      >
                        <Check className={cn("h-4 w-4")} />
                      </div>
                      {option.icon && (
                        <option.icon className="mr-2 h-4 w-4 text-muted-foreground" />
                      )}
                      <span>{option.label}</span>
                    </CommandItem>
                  )
                })}
              </CommandGroup>
              <CommandSeparator />
              <CommandGroup>
                <div className="flex items-center justify-between">
                  {selectedValues.length > 0 && (
                    <>
                      <CommandItem
                        onSelect={() => {
                          setSelectedValues([])
                          onValueChange([])
                        }}
                        className="flex-1 justify-center cursor-pointer"
                      >
                        Clear
                      </CommandItem>
                      <Separator
                        orientation="vertical"
                        className="flex min-h-6 h-full"
                      />
                    </>
                  )}
                  <CommandItem
                    onSelect={() => setIsPopoverOpen(false)}
                    className="flex-1 justify-center cursor-pointer"
                  >
                    Close
                  </CommandItem>
                </div>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    )
  },
)

MultiSelect.displayName = "MultiSelect"

export { MultiSelect }


type MultiSelectContextValue = {
  value: string[];
  onValueChange: (value: string) => void;
};

const MultiSelectContext = React.createContext<MultiSelectContextValue | null>(null);

const useMultiSelect = () => {
  const context = React.useContext(MultiSelectContext);
  if (!context) {
    throw new Error("useMultiSelect must be used within a MultiSelectProvider");
  }
  return context;
}

const MultiSelectProvider = ({
  children,
  value,
  onValueChange,
}: {
  children: React.ReactNode,
  value: string[],
  onValueChange: (value: string[]) => void,
}) => {

  const handleValueChange = (val: string) => {
    if (value.includes(val)) {
      onValueChange(value.filter((v) => v !== val));
    } else {
      onValueChange([...value, val]);
    }
  }

  return (
    <MultiSelectContext.Provider value={{ value, onValueChange: handleValueChange }}>
      {children}
    </MultiSelectContext.Provider>
  )
}

const MultiSelectTrigger = React.forwardRef<HTMLButtonElement, React.ComponentProps<typeof Button>>(
  ({ children, ...props }, ref) => {
  return (
    <Button ref={ref} {...props} variant="outline" className="h-10 w-full justify-between p-2">
      {children}
      <ChevronDown className="h-4 w-4 opacity-50" />
    </Button>
  );
});

MultiSelectTrigger.displayName = 'MultiSelectTrigger';


const MultiSelectValue = React.forwardRef<HTMLDivElement, React.ComponentProps<typeof Badge> & {
  placeholder?: string;
  maxDisplay?: number;
}>(({
  placeholder,
  maxDisplay = 2
}, ref) => {
  const { value } = useMultiSelect();
  const [first, second, ...rest] = value;
  
  if (value.length === 0) {
    return <span className="text-muted-foreground text-sm">{placeholder}</span>
  }

  return (
    <div ref={ref} className="flex gap-1 flex-wrap">
      <Badge variant="secondary">{first}</Badge>
      {second && <Badge variant="secondary">{second}</Badge>}
      {rest.length > 0 && <Badge variant="secondary">+{rest.length}</Badge>}
    </div>
  );
});

MultiSelectValue.displayName = 'MultiSelectValue';


const MultiSelectContent = React.forwardRef<HTMLDivElement, React.ComponentProps<typeof Command>>(
  ({ children, ...props }, ref) => {
    return (
      <Popover>
        <PopoverTrigger asChild>{props.children}</PopoverTrigger>
        <PopoverContent className="p-0 w-[--radix-popover-trigger-width]">
          <Command>
            <CommandInput placeholder="Search..." />
            <CommandList>
                <CommandEmpty>No results found.</CommandEmpty>
                <CommandGroup>
                  {children}
                </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    );
  }
);

MultiSelectContent.displayName = 'MultiSelectContent';


const MultiSelectItem = React.forwardRef<HTMLDivElement, React.ComponentProps<typeof CommandItem>>(
  ({ children, ...props }, ref) => {
  const { value: selectedValues, onValueChange } = useMultiSelect();
  const isSelected = selectedValues.includes(props.value || '');
  return (
    <CommandItem
      ref={ref}
      {...props}
      onSelect={() => onValueChange(props.value || '')}
      className="flex items-center justify-between"
    >
      {children}
      {isSelected && <Check className="h-4 w-4" />}
    </CommandItem>
  );
});

MultiSelectItem.displayName = 'MultiSelectItem';

const MultiSelectRoot = ({
  children,
  defaultValue,
  onValueChange,
}: {
  children: React.ReactNode,
  defaultValue: string[],
  onValueChange: (value: string[]) => void,
}) => {
  const [value, setValue] = React.useState(defaultValue);

  const handleValueChange = (newVal: string[]) => {
    setValue(newVal);
    onValueChange(newVal);
  }

  return (
    <Popover>
      <MultiSelectProvider value={value} onValueChange={handleValueChange}>
        {children}
      </MultiSelectProvider>
    </Popover>
  );
}

const NewMultiSelect = ({
  children,
  onValueChange,
  defaultValue = [],
}: {
  children: React.ReactNode,
  onValueChange: (value: string[]) => void,
  defaultValue?: string[],
}) => {
  const [value, setValue] = React.useState(defaultValue);

  const handleValueChange = (newVal: string[]) => {
    setValue(newVal);
    onValueChange(newVal);
  };
  return <MultiSelectProvider value={value} onValueChange={handleValueChange}>{children}</MultiSelectProvider>
}

const NewMultiSelectContent = ({children}: {children: React.ReactNode}) => {
  return (
    <PopoverContent className="p-0 w-[--radix-popover-trigger-width]">
      <Command>
        <CommandInput placeholder="Search..." />
        <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup>
              {children}
            </CommandGroup>
        </CommandList>
      </Command>
    </PopoverContent>
  );
}

export {
  NewMultiSelect as MultiSelect,
  MultiSelectTrigger,
  MultiSelectValue,
  NewMultiSelectContent as MultiSelectContent,
  MultiSelectItem
}
