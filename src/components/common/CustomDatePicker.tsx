'use client';

import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { TextField, TextFieldProps } from '@mui/material';
import { styled } from '@mui/material/styles';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import React from 'react';

interface Props {
  label: string;
  value: Date | null;
  onChange: (date: Date | null) => void;
  disabledDates: Date[];
  disabled?: boolean;
  isEndDate?: boolean;
  startDate?: Date | null;
  minDate?: Date | null;
  allowPastDates?: boolean;
}

const RedYellowTextField = styled(TextField)(() => ({
  '& label.Mui-focused': {
    color: '#000000',
  },
  '& .MuiInput-underline:after': {
    borderBottomColor: '#EF4444',
  },
  '& .MuiOutlinedInput-root': {
    '& fieldset': {
      borderColor: '#F0A611',
    },
    '&:hover fieldset': {
      borderColor: '#EF4444',
    },
    '&.Mui-focused fieldset': {
      borderColor: '#EF4444',
    },
  },
}));

const CustomInput = React.forwardRef<HTMLInputElement, TextFieldProps>((props, ref) => {
  return <RedYellowTextField {...props} inputRef={ref} />;
});
CustomInput.displayName = 'CustomInput';

export default function CustomDatePicker({
  label,
  value,
  onChange,
  disabledDates = [],
  disabled = false,
  isEndDate = false,
  startDate = null,
  minDate = null,
  allowPastDates = false
}: Props) {

  const isDateDisabled = React. useCallback((date: Date | null) => {
    if (!date || isNaN(date.getTime())) {
      return true;
    }

    // Normalize date to midnight UTC for consistent comparison
    const normalize = (d: Date) => Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());

    const todayTime = normalize(new Date());
    const dateTime = normalize(date);

    // Only privileged booking flows should allow back-date booking.
    if (!allowPastDates && dateTime < todayTime) {
      return true;
    }

    // Create a Set of disabled date timestamps for efficient lookup
    const disabledTimes = new Set(disabledDates.map(d => normalize(d)));

    // --- LOGIC FOR START DATE PICKER ---
    if (!isEndDate) {
      // Simply disable the date if its timestamp is in the disabled set
      return disabledTimes.has(dateTime);
    }
    
    // --- LOGIC FOR END DATE PICKER ---
    if (isEndDate) {
        if (!startDate) return true; // Safety check

        const startTime = normalize(startDate);
        
        // Find the earliest disabled date that comes strictly AFTER the selected start date.
        const nextBookingTime = Math.min(
            ...[...disabledTimes].filter(time => time > startTime),
            Infinity
        );

        // A date is disabled if it is AFTER the next booking starts.
        // This allows selection up to and including the start of the next booking.
        return dateTime > nextBookingTime;
    }
    
    return false; // Default case
  }, [allowPastDates, disabledDates, isEndDate, startDate]);


  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <DatePicker
        label={label}
        value={value}
        onChange={onChange}
        format="dd/MM/yyyy"
        slots={{ textField: CustomInput }}
        slotProps={{
          textField: {
            fullWidth: true,
            variant: 'outlined',
          }
        }}
        shouldDisableDate={isDateDisabled}
        enableAccessibleFieldDOMStructure={false}
        disabled={disabled}
        {...(minDate ? { minDate } : {})}
      />
    </LocalizationProvider>
  );
}
