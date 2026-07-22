import ActionLink from '../primitives/ActionLink';

export default function SectionHeading({ id, title, description, actionLabel, actionTo }) {
  return (
    <div className="mb-forest-6 flex flex-col gap-forest-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h2 id={id} className="text-forest-heading-2 font-bold text-forest-text-primary">{title}</h2>
        {description && (
          <p className="mt-forest-2 max-w-3xl text-forest-body text-forest-text-muted">{description}</p>
        )}
      </div>
      {actionLabel && <ActionLink to={actionTo} variant="quiet">{actionLabel}</ActionLink>}
    </div>
  );
}
