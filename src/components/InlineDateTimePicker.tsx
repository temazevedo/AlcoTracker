import { FC } from 'react';
import { ViewProps } from 'react-native';
import RawDateTimePicker from '@react-native-community/datetimepicker';

type AndroidMode = 'date' | 'time';
type Display = 'spinner' | 'default' | 'clock' | 'calendar';
type MinuteInterval = 1 | 2 | 3 | 4 | 5 | 6 | 10 | 12 | 15 | 20 | 30;
type Design = 'default' | 'material';
type InputMode = 'default' | 'keyboard';
type DAY_OF_WEEK = 0 | 1 | 2 | 3 | 4 | 5 | 6;

type BaseOptions = {
  value: Date;
  onChange?: (event: any, date?: Date) => void;
  onValueChange?: (event: any, date: Date) => void;
  onDismiss?: () => void;
  onNeutralButtonPress?: () => void;
  maximumDate?: Date;
  minimumDate?: Date;
  is24Hour?: boolean;
  timeZoneName?: string;
};

type AndroidNativeProps = BaseOptions & {
  mode?: AndroidMode;
  display?: Display;
  minuteInterval?: MinuteInterval;
  positiveButton?: { label?: string; textColor?: string };
  neutralButton?: { label?: string; textColor?: string };
  negativeButton?: { label?: string; textColor?: string };
  firstDayOfWeek?: DAY_OF_WEEK;
  onError?: (error: Error) => void;
  initialInputMode?: InputMode;
  title?: string;
  fullscreen?: boolean;
  design?: Design;
  startOnYearSelection?: boolean;
} & Omit<ViewProps, 'children'>;

export const InlineDateTimePicker = RawDateTimePicker as FC<AndroidNativeProps>;