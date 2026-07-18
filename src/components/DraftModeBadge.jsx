export default function DraftModeBadge() {
  if (import.meta.env.VITE_DRAFT_MODE !== 'true') return null;

  return (
    <div className="relative top-[72px] z-40 w-full bg-amber-700 px-4 py-2 text-center text-lg font-bold leading-[1.7] text-white shadow-sm lg:top-[120px]" role="status">
      로컬 초안
    </div>
  );
}
