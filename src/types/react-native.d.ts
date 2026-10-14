import { NativeDateTimePickerProps } from '@/components/NativeDateTimePicker';

declare module 'react-native' {
  namespace JSX {
    interface IntrinsicElements {
      NativeDateTimePicker: NativeDateTimePickerProps;
    }
  }
}