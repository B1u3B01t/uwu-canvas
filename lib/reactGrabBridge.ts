/**
 * Utilities for parsing react-grab clipboard captures.
 */

export interface ReactGrabCapture {
  html: string;
  componentName: string;
  filePath: string;
  lineNumber: number;
}

/**
 * Parse react-grab clipboard format.
 *
 * Actual format from react-grab:
 * ```
 * <h3 class="...">Text</h3>
 *   in SectionTitle (at /path/to/file.tsx:12:4)
 *   in ParentComponent (at /path/to/parent.tsx:28:24)
 *   ...
 * ```
 *
 * We extract the HTML and the FIRST component in the stack (the immediate component).
 */
export function parseReactGrabClipboard(text: string): ReactGrabCapture | null {
  // Match the first "in ComponentName (at path:line:col)" line
  // This gives us the immediate component that was captured
  const componentMatch = text.match(/\n\s*in (\w+) \(at ([^:]+):(\d+):\d+\)/);

  if (!componentMatch) {
    return null;
  }

  const [, componentName, filePath, lineNumber] = componentMatch;

  // Extract HTML by finding everything before the first "in " line
  const firstInIndex = text.indexOf('\n  in ');
  if (firstInIndex === -1) {
    return null;
  }

  const html = text.slice(0, firstInIndex);

  return {
    html: html.trim(),
    componentName,
    filePath,
    lineNumber: parseInt(lineNumber, 10),
  };
}
