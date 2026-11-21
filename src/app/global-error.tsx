'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body className="bg-background text-foreground flex items-center justify-center min-h-screen p-6 font-sans">
        <div className="max-w-md w-full border border-border rounded-xl p-8 text-center space-y-4">
          <h2 className="text-2xl font-bold">Application Error</h2>
          <p className="text-sm text-muted-foreground">
            {error?.message || "A critical error occurred."}
          </p>
          <button
            onClick={() => reset()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition"
          >
            Reload Page
          </button>
        </div>
      </body>
    </html>
  );
}
