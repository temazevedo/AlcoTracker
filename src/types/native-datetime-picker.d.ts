import { NativeDateTimePickerProps } from '@/components/NativeDateTimePicker';

declare global {
  namespace ReactNative {
    interface IntrinsicElements {
      NativeDateTimePicker: NativeDateTimePickerProps;
    }
  }
}