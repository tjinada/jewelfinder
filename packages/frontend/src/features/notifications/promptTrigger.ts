/**
 * Tiny pub/sub that lets high-intent flows (sending a loan request, accepting
 * one) summon the push-notification prompt without importing the component.
 * One listener is enough: the prompt is mounted exactly once, app-wide.
 */
export type PushPromptContext = 'request-sent' | 'request-accepted';

type Listener = (context: PushPromptContext) => void;

let listener: Listener | null = null;

/** Registered by PushNotificationPrompt on mount. Returns an unsubscribe fn. */
export function onPushPromptRequest(fn: Listener): () => void {
  listener = fn;
  return () => {
    if (listener === fn) listener = null;
  };
}

/** Ask the app-wide prompt to show itself for a high-intent moment. */
export function requestPushPrompt(context: PushPromptContext): void {
  listener?.(context);
}
