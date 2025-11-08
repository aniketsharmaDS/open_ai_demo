/**
 * Hook to get user agent information for device adaptation
 */

import { useOpenAIGlobal } from "./use-openai-global";

/**
 * Get user agent information including device type and capabilities
 * @returns UserAgent object with device and capabilities info or null
 */
export function useUserAgent() {
  return useOpenAIGlobal("userAgent");
}
