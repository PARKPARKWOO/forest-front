import ActionLink from './ActionLink';

export default function SectionHeading({ id, title, description, actionLabel, actionTo }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h2 id={id} className="text-3xl font-bold leading-tight text-gray-950">{title}</h2>
        {description && <p className="mt-2 max-w-3xl text-lg leading-[1.7] text-gray-700">{description}</p>}
      </div>
      {actionLabel && <ActionLink to={actionTo} variant="quiet">{actionLabel}</ActionLink>}
    </div>
  );
}
