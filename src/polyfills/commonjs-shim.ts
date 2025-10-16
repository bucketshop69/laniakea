// CommonJS compatibility shim for browser builds
// This provides exports and module globals that some CommonJS modules expect

if (typeof window !== 'undefined') {
  (window as any).exports = (window as any).exports || {};
  (window as any).module = (window as any).module || { exports: (window as any).exports };
}

// Re-export for module imports
export const exports = typeof window !== 'undefined' ? (window as any).exports : {};
export const module = typeof window !== 'undefined' ? (window as any).module : { exports };
