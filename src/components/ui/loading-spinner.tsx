export default function LoadingSpinner() {
  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        <p className="mt-4 text-sm text-gray-500">Loading...</p>
      </div>
    </div>
  );
}
