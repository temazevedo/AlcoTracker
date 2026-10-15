/**
 * useTranslation hook for FormatJS i18n
 * Provides t() function for translating messages
 */

import { useIntl } from 'react-intl';
import { useCallback, useMemo } from 'react';
import type { FormatNumberOptions } from 'react-intl';

/**
 * Hook for translating messages with FormatJS
 * Returns a t function that can be used like: t('key.subkey')
 */
export function useTranslation() {
  const intl = useIntl();
  
  const t = useCallback(
    (key: string, values?: Record<string, string | number>): string => {
      try {
        return intl.formatMessage({ id: key }, values);
      } catch (e) {
        // Fallback to key if translation not found
        console.warn(`Translation missing for key: ${key}`);
        return key;
      }
    },
    [intl]
  );
  
  const formatNumber = useCallback(
    (value: number, options?: FormatNumberOptions): string => {
      return intl.formatNumber(value, options);
    },
    [intl]
  );
  
  const formatDate = useCallback(
    (value: Date | number | string, options?: Intl.DateTimeFormatOptions): string => {
      return intl.formatDate(value, options);
    },
    [intl]
  );
  
  const formatRelativeTime = useCallback(
    (value: number, unit: Intl.RelativeTimeFormatUnit): string => {
      return intl.formatRelativeTime(value, unit);
    },
    [intl]
  );
  
  const locale = intl.locale;
  
  return useMemo(
    () => ({
      t,
      formatNumber,
      formatDate,
      formatRelativeTime,
      locale,
    }),
    [t, formatNumber, formatDate, formatRelativeTime, locale]
  );
}

/**
 * Hook for getting current locale info
 */
export function useLocaleInfo() {
  const { locale } = useIntl();
  
  return useMemo(
    () => ({
      locale,
      isRTL: locale.startsWith('ar') || locale.startsWith('he') || locale.startsWith('fa'),
    }),
    [locale]
  );
}

/**
 * Helper to translate with namespace support
 * Usage: t('settings.title') or t.nested('settings', 'title')
 */
export function useNamespacedTranslation() {
  const { t, ...rest } = useTranslation();
  
  const ns = useCallback(
    (namespace: string) => {
      return (key: string, values?: Record<string, string | number>) => 
        t(`${namespace}.${key}`, values);
    },
    [t]
  );
  
  return {
    ...rest,
    t,
    ns,
  };
}