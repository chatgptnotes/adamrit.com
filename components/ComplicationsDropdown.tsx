'use client';

import React from 'react';
import { useComplications } from '@/hooks/useComplications';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ComplicationsDropdownProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
}

export function ComplicationsDropdown({ 
  value, 
  onChange, 
  placeholder = "Select a complication" 
}: ComplicationsDropdownProps) {
  const { complications, loading, error } = useComplications();

  if (error) {
    return <div className="text-red-500">Error loading complications</div>;
  }

  if (loading) {
    return <div>Loading complications...</div>;
  }

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {complications.map((complication) => (
          <SelectItem key={complication.id} value={complication.id}>
            {complication.name} ({complication.risk_level} risk)
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
} 