import { Alert, Platform } from 'react-native';

type ConfirmButton = {
  text: string;
  style?: 'default' | 'cancel' | 'destructive';
  onPress?: () => void | Promise<void>;
};

/**
 * Cross-platform confirm. `Alert.alert` is a no-op on react-native-web,
 * so web uses `window.confirm` and runs the non-cancel button's onPress.
 */
export function confirmAlert(
  title: string,
  message: string,
  buttons: ConfirmButton[],
): void {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    const ok = window.confirm([title, message].filter(Boolean).join('\n\n'));
    const action = ok
      ? buttons.find((b) => b.style !== 'cancel')
      : buttons.find((b) => b.style === 'cancel');
    void action?.onPress?.();
    return;
  }

  Alert.alert(title, message, buttons);
}

/** Awaitable confirm; resolves true if the user confirmed. */
export function confirmAsync(options: {
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
  destructive?: boolean;
}): Promise<boolean> {
  const { title, message, confirmText, cancelText, destructive } = options;

  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    return Promise.resolve(window.confirm([title, message].filter(Boolean).join('\n\n')));
  }

  return new Promise((resolve) => {
    Alert.alert(
      title,
      message,
      [
        { text: cancelText, style: 'cancel', onPress: () => resolve(false) },
        {
          text: confirmText,
          style: destructive ? 'destructive' : 'default',
          onPress: () => resolve(true),
        },
      ],
      { cancelable: true, onDismiss: () => resolve(false) },
    );
  });
}
