'use client';

import React, { useState, ChangeEvent } from 'react';
import { Combobox } from '@headlessui/react';
import { CheckIcon, ChevronUpDownIcon } from '@heroicons/react/20/solid';

interface Option {
  id: string;
  name: string;
  [key: string]: any;
}

interface SearchSelectProps {
  options: Option[];
  value: Option | null;
  onChange: (value: Option | null) => void;
  placeholder?: string;
  isLoading?: boolean;
  className?: string;
  displayKey?: string;
}

export function SearchSelect({
  options,
  value,
  onChange,
  placeholder = 'Select an option...',
  isLoading = false,
  className = '',
  displayKey = 'name',
}: SearchSelectProps) {
  const [query, setQuery] = useState('');

  const filteredOptions =
    query === ''
      ? options
      : options.filter((option) =>
          option[displayKey]
            .toLowerCase()
            .replace(/\s+/g, '')
            .includes(query.toLowerCase().replace(/\s+/g, ''))
        );

  return (
    <Combobox as="div" value={value} onChange={onChange} nullable>
      <div className="relative">
        <Combobox.Input
          className={`w-[200px] rounded-md border border-gray-300 bg-white py-2 pl-3 pr-10 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm ${className}`}
          onChange={(event: ChangeEvent<HTMLInputElement>) => setQuery(event.target.value)}
          displayValue={(option: Option | null) => option?.[displayKey] ?? ''}
          placeholder={isLoading ? 'Loading...' : placeholder}
          disabled={isLoading}
        />
        <Combobox.Button className="absolute inset-y-0 right-0 flex items-center rounded-r-md px-2 focus:outline-none">
          <ChevronUpDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
        </Combobox.Button>

        {filteredOptions.length > 0 && (
          <Combobox.Options className="absolute z-10 mt-1 w-[300px] overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
            {filteredOptions.map((option) => (
              <Combobox.Option
                key={option.id}
                value={option}
                className={({ active }: { active: boolean }) =>
                  `relative cursor-default select-none py-2 pl-3 pr-9 ${
                    active ? 'bg-blue-600 text-white' : 'text-gray-900'
                  }`
                }
              >
                {({ active, selected }: { active: boolean; selected: boolean }) => (
                  <>
                    <span className={`block truncate ${selected ? 'font-semibold' : ''}`}>
                      {option[displayKey]}
                    </span>

                    {selected && (
                      <span
                        className={`absolute inset-y-0 right-0 flex items-center pr-4 ${
                          active ? 'text-white' : 'text-blue-600'
                        }`}
                      >
                        <CheckIcon className="h-5 w-5" aria-hidden="true" />
                      </span>
                    )}
                  </>
                )}
              </Combobox.Option>
            ))}
          </Combobox.Options>
        )}
      </div>
    </Combobox>
  );
} 