/**
 * Hook to get the current theme (light/dark) from OpenAI globals
 */

import { useOpenAIGlobal } from "./use-openai-global";

/**
 * Get the current theme from OpenAI globals
 * @returns "light" | "dark" | null
 */
export function useTheme() {
  return useOpenAIGlobal("theme");
}
