/**
 * Hook to get locale information
 */

import { useOpenAIGlobal } from "./use-openai-global";

/**
 * Get the current locale setting
 * @returns locale string or null
 */
export function useLocale() {
  return useOpenAIGlobal("locale");
}
