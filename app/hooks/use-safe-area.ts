/**
 * Hook to get safe area information for mobile compatibility
 */

import { useOpenAIGlobal } from "./use-openai-global";

/**
 * Get safe area insets for proper mobile layout
 * @returns SafeArea object with insets or null
 */
export function useSafeArea() {
  return useOpenAIGlobal("safeArea");
}
