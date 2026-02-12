/**
 * Preprocesses raw generated code for react-live:
 * - Strips markdown code fences
 * - Removes all import statements (dependencies come from scope)
 * - Converts export default / named export into a render() call
 */

/** Extract code from markdown fences (```jsx, ```tsx, etc.) */
function extractFromFences(raw: string): string {
  const match = raw.match(/```(?:jsx|tsx|javascript|react)?\s*\n?([\s\S]*?)```/);
  return match ? match[1].trim() : raw.trim();
}

/** Remove all ESM import statements */
function stripImports(code: string): string {
  return code.replace(/import\s+[\s\S]*?from\s+(['"])([\s\S]*?)\1;?\s*/g, '').trim();
}

/**
 * Convert export to a render() call for react-live (noInline mode).
 * Returns code that ends with render(<Component />).
 */
function convertExportToRender(code: string): string {
  let result = code;

  // export default ComponentName;
  const defaultMatch = result.match(/export\s+default\s+(\w+)\s*;?\s*$/m);
  if (defaultMatch) {
    const name = defaultMatch[1];
    result = result.replace(/export\s+default\s+\w+\s*;?\s*$/m, '').trim();
    return `${result}\n\nrender(<${name} />);`;
  }

  // export default function Name(...) or export default function Name(...)
  const defaultFuncMatch = result.match(/export\s+default\s+function\s+(\w+)\s*\(/);
  if (defaultFuncMatch) {
    const name = defaultFuncMatch[1];
    result = result.replace(/export\s+default\s+/, '').trim();
    return `${result}\n\nrender(<${name} />);`;
  }

  // export function ComponentName(...) { ... }
  const namedFuncMatch = result.match(/export\s+function\s+(\w+)\s*\(/);
  if (namedFuncMatch) {
    const name = namedFuncMatch[1];
    result = result.replace(/export\s+function\s+/, 'function ').trim();
    return `${result}\n\nrender(<${name} />);`;
  }

  // export const ComponentName = ...
  const namedConstMatch = result.match(/export\s+const\s+(\w+)\s*=\s*(?:\(|function)/);
  if (namedConstMatch) {
    const name = namedConstMatch[1];
    result = result.replace(/export\s+const\s+/, 'const ').trim();
    return `${result}\n\nrender(<${name} />);`;
  }

  // export var ComponentName = ...
  const namedVarMatch = result.match(/export\s+var\s+(\w+)\s*=/);
  if (namedVarMatch) {
    const name = namedVarMatch[1];
    result = result.replace(/export\s+var\s+/, 'var ').trim();
    return `${result}\n\nrender(<${name} />);`;
  }

  return result;
}

/**
 * Full preprocessing pipeline for sandbox code.
 */
export function preprocessSandboxCode(rawCode: string): string {
  let code = extractFromFences(rawCode);
  code = stripImports(code);
  code = convertExportToRender(code);
  return code.trim();
}
