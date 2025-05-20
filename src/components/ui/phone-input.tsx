'use client';

import * as React from 'react';
import { Input } from './input';
import { cn } from '@/lib/utils';

interface PhoneInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  value: string;
  onChange: (value: string) => void;
  countryCodeValue?: string;
  onCountryCodeChange?: (value: string) => void;
}

const countryCodes = [
  { code: '+1', country: 'US/CA' },
  { code: '+44', country: 'UK' },
  { code: '+234', country: 'NG' },
  { code: '+233', country: 'GH' },
  { code: '+254', country: 'KE' },
  { code: '+27', country: 'ZA' },
  { code: '+91', country: 'IN' },
  // Add more country codes as needed
];

export function PhoneInput({
  className,
  value,
  onChange,
  countryCodeValue = '+1',
  onCountryCodeChange,
  ...props
}: PhoneInputProps) {
  const formatPhoneNumber = (value: string) => {
    // Remove non-numeric characters
    const numeric = value.replace(/[^0-9]/g, '');
    
    // Format based on length
    if (numeric.length <= 3) {
      return numeric;
    } else if (numeric.length <= 6) {
      return `${numeric.slice(0, 3)}-${numeric.slice(3)}`;
    } else {
      return `${numeric.slice(0, 3)}-${numeric.slice(3, 6)}-${numeric.slice(6, 10)}`;
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedValue = formatPhoneNumber(e.target.value);
    onChange(formattedValue);
  };

  return (
    <div className="flex">
      <select
        className={cn(
          "flex h-10 rounded-l-md border border-input bg-background px-3 py-2 text-sm",
          "focus:outline-none focus:ring-2 focus:ring-ring focus:border-input"
        )}
        value={countryCodeValue}
        onChange={(e) => onCountryCodeChange?.(e.target.value)}
      >
        {countryCodes.map((country) => (
          <option key={country.code} value={country.code}>
            {country.code} {country.country}
          </option>
        ))}
      </select>
      <Input
        className={cn("rounded-l-none", className)}
        value={value}
        onChange={handleInputChange}
        type="tel"
        placeholder="555-123-4567"
        {...props}
      />
    </div>
  );
}

export default PhoneInput;
