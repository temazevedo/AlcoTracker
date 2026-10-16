import { createContext, useContext, useCallback, useEffect, useState, ReactNode } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { getProfile, acceptDisclaimer } from "@/db/repository";
import { styles as layoutStyles } from "@/app/_layout.styles";

interface DisclaimerModalProps {
  visible: boolean;
  onAccept: () => void;
  onClose?: () => void;
}

export function DisclaimerModal({ visible, onAccept, onClose }: DisclaimerModalProps) {
  if (!visible) return null;

  const t = (key: string) => {
    const translations: Record<string, string> = {
      'disclaimer.title': 'Important Disclaimer',
      'disclaimer.text': 'This app provides approximate Blood Alcohol Content (BAC) estimates based on the Widmark formula. These estimates are approximations and should never be used to determine fitness to drive or operate machinery. Never drink and drive. Consult a healthcare professional for medical advice. The developers are not responsible for any decisions made based on this app\'s estimates.',
      'disclaimer.accept': 'I Understand & Accept',
      'disclaimer.close': 'Close',
    };
    return translations[key] || key;
  };

  return (
    <View style={layoutStyles.disclaimerOverlay}>
      <View style={layoutStyles.disclaimerModal}>
        <Text style={layoutStyles.disclaimerTitle}>{t('disclaimer.title')}</Text>
        <View style={layoutStyles.disclaimerScroll}>
          <Text style={layoutStyles.disclaimerText}>{t('disclaimer.text')}</Text>
        </View>
        <TouchableOpacity
          onPress={onAccept}
          style={layoutStyles.disclaimerAcceptButton}
          activeOpacity={0.8}
        >
          <Text style={layoutStyles.disclaimerAcceptButtonText}>{t('disclaimer.accept')}</Text>
        </TouchableOpacity>
        {onClose && (
          <TouchableOpacity
            onPress={onClose}
            style={layoutStyles.disclaimerCloseButton}
            activeOpacity={0.8}
          >
            <Text style={layoutStyles.disclaimerCloseButtonText}>{t('disclaimer.close')}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

interface DisclaimerContextValue {
  /** Opens the disclaimer in read-only mode (with a Close button). */
  showDisclaimer: () => void;
}

const DisclaimerContext = createContext<DisclaimerContextValue>({ showDisclaimer: () => {} });

export function useDisclaimer(): DisclaimerContextValue {
  return useContext(DisclaimerContext);
}

/**
 * Shows the disclaimer on first launch (must accept to continue) and on
 * demand from the settings screen. Renders the modal on top of everything.
 */
export function DisclaimerProvider({ children }: { children: ReactNode }) {
  const [visible, setVisible] = useState(false);
  const [isFirstLaunch, setIsFirstLaunch] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function checkDisclaimer() {
      try {
        const result = await getProfile();
        if (mounted && result.success && result.data && !result.data.disclaimer_accepted_at) {
          setVisible(true);
        }
      } catch (error) {
        console.warn('Failed to check disclaimer:', error);
      }
    }

    checkDisclaimer();
    return () => { mounted = false; };
  }, []);

  const showDisclaimer = useCallback(() => {
    setIsFirstLaunch(false);
    setVisible(true);
  }, []);

  const handleAccept = useCallback(async () => {
    try {
      await acceptDisclaimer();
    } catch (error) {
      console.error('Failed to accept disclaimer:', error);
    }
    setVisible(false);
  }, []);

  const handleClose = useCallback(() => {
    setVisible(false);
  }, []);

  return (
    <DisclaimerContext.Provider value={{ showDisclaimer }}>
      {children}
      <DisclaimerModal
        visible={visible}
        onAccept={handleAccept}
        onClose={isFirstLaunch ? undefined : handleClose}
      />
    </DisclaimerContext.Provider>
  );
}
