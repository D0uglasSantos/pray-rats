"use client";

import { Input } from "@/components/ui/input";
import { toDatetimeLocalValue } from "@/lib/checkin-datetime";

interface CheckinDatetimeFieldsProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function CheckinDatetimeFields({
  value,
  onChange,
  disabled = false,
}: CheckinDatetimeFieldsProps) {
  return (
    <Input
      name="checked_in_at"
      type="datetime-local"
      label="Quando aconteceu"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      max={toDatetimeLocalValue(new Date())}
      required
      disabled={disabled}
    />
  );
}
