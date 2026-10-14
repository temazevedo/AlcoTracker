import { NativeDateTimePickerProps } from '@/components/NativeDateTimePicker';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      NativeDateTimePicker: NativeDateTimePickerProps;
    }
  }
}