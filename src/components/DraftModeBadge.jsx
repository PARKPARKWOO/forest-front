export default function DraftModeBadge() {
  if (import.meta.env.VITE_DRAFT_MODE !== 'true') return null;

  return (
    <div className="fixed bottom-4 left-4 z-[90] rounded-full bg-amber-700 px-4 py-2 text-lg font-bold leading-[1.7] text-white shadow-lg" role="status">
      로컬 초안
    </div>
  );
}
