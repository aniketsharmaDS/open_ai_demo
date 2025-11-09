"use client";

import { useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  useWidgetProps,
  useMaxHeight,
  useDisplayMode,
  useRequestDisplayMode,
  useIsChatGptApp,
  useTheme,
  useSafeArea,
  useUserAgent,
} from "./hooks";

export default function Home() {
  const toolOutput = useWidgetProps<{
    name?: string;
    result?: { structuredContent?: { name?: string } };
  }>();
  const maxHeight = useMaxHeight() ?? undefined;
  const displayMode = useDisplayMode();
  const requestDisplayMode = useRequestDisplayMode();
  const isChatGptApp = useIsChatGptApp();
  const theme = useTheme();
  const safeArea = useSafeArea();
  const userAgent = useUserAgent();

  // Adaptive design calculations
  const isDark = theme === "dark";
  const isFullscreen = displayMode === "fullscreen";
  const isInline = displayMode === "inline";
  const isPip = displayMode === "pip";

  // Device capability detection
  const supportsHover = userAgent?.capabilities?.hover ?? true;
  const supportsTouch = userAgent?.capabilities?.touch ?? false;
  const deviceType = userAgent?.device?.type ?? "desktop";

  // Safe area support
  const safeAreaStyle = useMemo(() => {
    if (!safeArea?.insets) return {};
    return {
      paddingTop: safeArea.insets.top,
      paddingBottom: safeArea.insets.bottom,
      paddingLeft: safeArea.insets.left,
      paddingRight: safeArea.insets.right,
    };
  }, [safeArea]);

  // Container sizing based on display mode
  const containerStyle = useMemo(() => {
    const baseStyle = {
      height: isFullscreen ? (maxHeight ? maxHeight - 40 : "100vh") : 480,
      maxHeight: isFullscreen ? maxHeight : "31rem",
      maxWidth: isFullscreen ? "100%" : "28rem",
      minHeight: isPip ? "200px" : "480px",
      ...safeAreaStyle,
    };
    return baseStyle;
  }, [isFullscreen, maxHeight, isPip, safeAreaStyle]);

  const name = toolOutput?.result?.structuredContent?.name || toolOutput?.name;

  return (
    <div
      className={`
        w-full antialiased transition-standard
        ${
          isFullscreen
            ? "rounded-none border-0"
            : "border border-black/10 dark:border-white/10 rounded-2xl sm:rounded-3xl"
        }
        ${
          isDark
            ? "bg-gray-900 text-white theme-dark"
            : "bg-white text-black theme-light"
        }
        ${isPip ? "p-3" : "p-5"}
      `}
      style={containerStyle}
    >
      {/* Fullscreen toggle - Hidden in PiP mode */}
      {!isFullscreen && !isPip && (
        <button
          aria-label="Enter fullscreen"
          className={`
            fixed top-4 right-4 z-50 rounded-full transition-quick focus-visible
            ${
              isDark
                ? "bg-slate-800 text-slate-300 ring-white/10 hover:bg-slate-700"
                : "bg-white text-slate-700 ring-slate-900/10 hover:bg-slate-50"
            }
            shadow-lg ring-1 p-2.5 cursor-pointer touch-target
            ${supportsHover ? "hover:scale-105" : ""}
          `}
          onClick={() => requestDisplayMode("fullscreen")}
          {...(supportsTouch && {
            onTouchStart: () => {},
          })}
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15"
            />
          </svg>
        </button>
      )}

      <div className={`${isPip ? "space-y-3" : "space-y-8"} h-full`}>
        {/* ChatGPT detection notice - Hidden in PiP */}
        {!isChatGptApp && !isPip && (
          <div
            className={`
              border rounded-lg px-4 py-3 w-full transition-standard
              ${
                isDark
                  ? "bg-blue-950 border-blue-800"
                  : "bg-blue-50 border-blue-200"
              }
            `}
          >
            <div className="flex items-center gap-3">
              <svg
                className={`
                  w-5 h-5 flex-shrink-0
                  ${isDark ? "text-blue-400" : "text-blue-600"}
                `}
                fill="currentColor"
                viewBox="0 0 20 20"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z"
                  clipRule="evenodd"
                />
              </svg>
              <div className="flex-1 min-w-0">
                <p
                  className={`
                    text-sm font-medium
                    ${isDark ? "text-blue-100" : "text-blue-900"}
                  `}
                >
                  This app relies on data from a ChatGPT session.
                </p>
                <p
                  className={`
                    text-sm font-medium
                    ${isDark ? "text-blue-100" : "text-blue-900"}
                  `}
                >
                  No{" "}
                  <a
                    href="https://developers.openai.com/apps-sdk/reference"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`
                      underline hover:no-underline font-mono px-1 py-0.5 rounded transition-quick
                      ${
                        isDark
                          ? "bg-blue-900 hover:bg-blue-800"
                          : "bg-blue-100 hover:bg-blue-200"
                      }
                    `}
                  >
                    window.openai
                  </a>{" "}
                  property detected
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Main content area */}
        <main
          className={`
            flex flex-col items-center sm:items-start
            ${isPip ? "gap-2" : "gap-8"}
          `}
        >
          {/* Logo */}
          <div className="flex items-center justify-center">
            <Image
              className={`${isDark ? "invert" : ""} transition-standard`}
              src="/next.svg"
              alt="Next.js logo"
              width={isPip ? 120 : 180}
              height={isPip ? 25 : 38}
              priority
            />
          </div>

          {/* Content sections - Adaptive for display mode */}
          {isPip ? (
            // PiP mode: Minimal content
            <div className="text-center space-y-2">
              <h1 className="text-lg font-semibold">ChatGPT Apps SDK</h1>
              <p className="text-sm text-secondary">
                {name ? `Hello, ${name}!` : "Widget ready"}
              </p>
              <button
                onClick={() => requestDisplayMode("inline")}
                className={`
                  text-xs px-3 py-1 rounded-full transition-quick touch-target
                  ${
                    isDark
                      ? "bg-white/10 hover:bg-white/20 text-white"
                      : "bg-black/10 hover:bg-black/20 text-black"
                  }
                `}
              >
                Expand
              </button>
            </div>
          ) : (
            // Inline/Fullscreen mode: Full content
            <>
              <div
                className={`
                  text-center sm:text-left space-y-3
                  ${deviceType === "mobile" ? "mobile-text-lg" : ""}
                `}
              >
                <h1 className="header-primary">
                  Welcome to the ChatGPT Apps SDK{" "}
                  {isFullscreen && <span className="text-blue-500">Demo</span>}
                </h1>
                <ol className="font-mono list-inside list-decimal text-small space-y-2">
                  <li className="tracking-[-.01em]">
                    ChatGPT Apps SDK Next.js Integration 118
                  </li>
                  <li className="tracking-[-.01em]">
                    Tool result: {name ?? "Waiting for data..."}
                  </li>
                  <li className="tracking-[-.01em]">
                    Display mode:{" "}
                    <span className="font-semibold capitalize">
                      {displayMode}
                    </span>
                  </li>
                  <li className="tracking-[-.01em]">
                    Theme:{" "}
                    <span className="font-semibold capitalize">
                      {theme || "auto"}
                    </span>
                  </li>
                  <li className="tracking-[-.01em]">
                    Device: {deviceType} •{" "}
                    {supportsTouch ? "Touch" : "No Touch"} •{" "}
                    {supportsHover ? "Hover" : "No Hover"}
                  </li>
                </ol>
              </div>

              {/* Action buttons */}
              <div
                className={`
                  flex items-center flex-col sm:flex-row
                  ${isFullscreen ? "gap-6" : "gap-4"}
                `}
              >
                <Link
                  className={`
                    rounded-full border border-solid border-transparent transition-quick
                    flex items-center justify-center gap-2 font-medium touch-target
                    ${
                      isDark
                        ? "bg-white text-black hover:bg-gray-200"
                        : "bg-black text-white hover:bg-gray-800"
                    }
                    ${
                      isFullscreen
                        ? "text-base h-12 px-6"
                        : "text-sm h-10 px-4 sm:px-5"
                    }
                    ${
                      supportsHover
                        ? "hover:scale-105 hover:shadow-lg"
                        : "active:scale-95"
                    }
                    focus-visible
                  `}
                  prefetch={false}
                  href="/custom-page"
                  {...(supportsTouch && {
                    onTouchStart: () => {},
                  })}
                >
                  <span>🚀</span>
                  {isFullscreen ? "Explore Demo Features" : "Visit Demo"}
                </Link>

                <Link
                  href="/shopping-results"
                  className={`
                    rounded-full border transition-quick font-medium touch-target
                    flex items-center justify-center gap-2
                    ${
                      isDark
                        ? "border-white/20 text-white hover:bg-white/10"
                        : "border-black/20 text-black hover:bg-black/10"
                    }
                    ${
                      isFullscreen
                        ? "text-base h-12 px-6"
                        : "text-sm h-10 px-4 sm:px-5"
                    }
                    ${
                      supportsHover
                        ? "hover:scale-105 hover:shadow-lg"
                        : "active:scale-95"
                    }
                    focus-visible
                  `}
                >
                  <span>🛒</span>
                  Shopping Demo
                </Link>

                <a
                  href="https://vercel.com/templates/ai/chatgpt-app-with-next-js"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`
                    underline transition-quick text-small
                    ${
                      isDark
                        ? "text-gray-300 hover:text-white"
                        : "text-gray-600 hover:text-black"
                    }
                    ${supportsHover ? "hover:no-underline" : ""}
                    focus-visible
                  `}
                >
                  Deploy on Vercel
                </a>
              </div>

              {/* Display mode controls - Only in fullscreen */}
              {isFullscreen && (
                <div className="space-y-4 pt-4 border-t border-black/10 dark:border-white/10">
                  <h2 className="header-secondary">Display Mode Controls</h2>
                  <div className="flex gap-3">
                    {(["pip", "inline", "fullscreen"] as const).map((mode) => (
                      <button
                        key={mode}
                        onClick={() => requestDisplayMode(mode)}
                        className={`
                          px-4 py-2 rounded-lg text-sm font-medium transition-quick touch-target
                          ${
                            displayMode === mode
                              ? isDark
                                ? "bg-blue-600 text-white"
                                : "bg-blue-500 text-white"
                              : isDark
                              ? "bg-white/10 text-white hover:bg-white/20"
                              : "bg-black/10 text-black hover:bg-black/20"
                          }
                          ${
                            supportsHover && displayMode !== mode
                              ? "hover:scale-105"
                              : ""
                          }
                          focus-visible
                        `}
                        disabled={displayMode === mode}
                      >
                        {mode === "pip" && "📱"}
                        {mode === "inline" && "📄"}
                        {mode === "fullscreen" && "🖥️"}
                        <span className="ml-1 capitalize">{mode}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Debug info - Only in fullscreen */}
              {isFullscreen && (
                <div
                  className={`
                    space-y-3 pt-4 border-t border-black/10 dark:border-white/10
                    text-xs
                    ${isDark ? "text-gray-400" : "text-gray-500"}
                  `}
                >
                  <h3 className="font-semibold">Debug Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <div>Max Height: {maxHeight}px</div>
                    <div>
                      Safe Area: {JSON.stringify(safeArea?.insets || "none")}
                    </div>
                    <div>User Agent: {JSON.stringify(userAgent || "none")}</div>
                    <div>
                      Widget Props: {JSON.stringify(toolOutput || "none")}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
