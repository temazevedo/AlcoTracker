/**
 * i18n configuration and message loading
 * Uses FormatJS with expo-localization for locale detection
 */

import { IntlProvider, useIntl } from 'react-intl';
import * as Localization from 'expo-localization';
import * as React from 'react';
import { Platform } from 'react-native';
import type { MessageDescriptor } from 'react-intl';
import enMessages from './en.json';
import ptPTMessages from './pt-PT.json';

export type Locale = 'en' | 'pt-PT';

type IntlMessages = Record<string, string | MessageDescriptor>;

const messages: Record<Locale, IntlMessages> = {
  en: enMessages as IntlMessages,
  'pt-PT': ptPTMessages as IntlMessages,
} as const;

export const SUPPORTED_LOCALES: Locale[] = ['en', 'pt-PT'];
export const DEFAULT_LOCALE: Locale = 'en';

/**
 * Get the user's preferred locale from device settings
 * Falls back to English if unsupported
 */
export function getDeviceLocale(): Locale {
  try {
    const locales = Localization.getLocales();
    if (locales && locales.length > 0) {
      const locale = locales[0].languageTag || locales[0].languageCode;
      if (locale) {
        // Try exact match first
        if (SUPPORTED_LOCALES.includes(locale as Locale)) {
          return locale as Locale;
        }
        // Try base language match (e.g., 'pt' -> 'pt-PT')
        const baseLang = locale.split('-')[0];
        const matched = SUPPORTED_LOCALES.find(l => l.startsWith(baseLang));
        if (matched) return matched;
      }
    }
  } catch (e) {
    console.warn('Failed to get device locale:', e);
  }
  return DEFAULT_LOCALE;
}

/**
 * Get messages for a specific locale
 */
export function getMessages(locale: Locale) {
  return messages[locale] || messages[DEFAULT_LOCALE];
}

/**
 * i18n Provider component - wraps the app with FormatJS IntlProvider
 */
interface I18nProviderProps {
  children: React.ReactNode;
  locale?: Locale;
}

export function I18nProvider({ children, locale = getDeviceLocale() }: I18nProviderProps) {
  const messagesForLocale = getMessages(locale);
  
  // FormatJS IntlProvider needs locale and messages
  // On web, we might need to polyfill Intl
  if (Platform.OS === 'web' && typeof Intl === 'undefined') {
    console.warn('Intl not available on this platform');
  }
  
  return (
    <IntlProvider
      locale={locale}
      messages={messagesForLocale as any}
      defaultLocale={DEFAULT_LOCALE}
      defaultRichTextElements={{}}
    >
      {children}
    </IntlProvider>
  );
}

/**
 * Hook to get current locale and messages
 */
export function useLocale() {
  const [locale, setLocale] = React.useState<Locale>(getDeviceLocale());
  const locales = Localization.useLocales();
  
  React.useEffect(() => {
    // Update locale when device locale changes via hook
    if (locales && locales.length > 0) {
      const newLocale = getDeviceLocale();
      if (newLocale !== locale) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setLocale(newLocale);
      }
    }
  }, [locales]);
  
  return {
    locale,
    setLocale,
    messages: getMessages(locale),
  };
}