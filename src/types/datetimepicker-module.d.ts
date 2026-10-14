declare module '@react-native-community/datetimepicker' {
  // Test: this file should be loaded
  export const TEST_MARKER = true;
  import { FC } from 'react';
  import { ViewProps } from 'react-native';

  type IOSMode = 'date' | 'time' | 'datetime' | 'countdown';
  type AndroidMode = 'date' | 'time';
  type Display = 'spinner' | 'default' | 'clock' | 'calendar';
  type IOSDisplay = 'default' | 'compact' | 'inline' | 'spinner';
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

  type IOSNativeProps = BaseOptions & {
    locale?: string;
    minuteInterval?: MinuteInterval;
    mode?: IOSMode;
    timeZoneOffsetInMinutes?: number;
    textColor?: string;
    accentColor?: string;
    themeVariant?: 'dark' | 'light';
    display?: IOSDisplay;
    disabled?: boolean;
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

  type WindowsNativeProps = BaseOptions & {
    display?: Display;
    placeholderText?: string;
    dateFormat?: 'day month year' | 'dayofweek day month' | 'longdate' | 'shortdate';
    dayOfWeekFormat?: string;
    firstDayOfWeek?: DAY_OF_WEEK;
    timeZoneOffsetInSeconds?: number;
    is24Hour?: boolean;
    minuteInterval?: number;
    accessibilityLabel?: string;
  } & Omit<ViewProps, 'children'>;

  const RNDateTimePicker: FC<IOSNativeProps | AndroidNativeProps | WindowsNativeProps>;

  export default RNDateTimePicker;
  export const DateTimePickerAndroid: {
    open: (args: AndroidNativeProps) => void;
    dismiss: (mode: AndroidNativeProps['mode'], design?: AndroidNativeProps['design']) => Promise<boolean>;
  };
}