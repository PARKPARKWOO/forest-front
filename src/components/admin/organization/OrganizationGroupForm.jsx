import FormField from '../../../design-system/primitives/FormField';
import Surface from '../../../design-system/patterns/Surface';

export default function OrganizationGroupForm({ group, parentOptions, errors, onChange }) {
  if (!group) {
    return (
      <Surface aria-label="그룹 상세 편집">
        <p className="text-forest-text-muted">왼쪽에서 편집할 그룹을 선택해 주세요.</p>
      </Surface>
    );
  }

  const errorFor = (field) => errors.find(({ path }) => path.endsWith(`.${field}`))?.message;
  const nameId = `organization-group-name-${group.id}`;
  const descriptionId = `organization-group-description-${group.id}`;
  const parentId = `organization-group-parent-${group.id}`;

  return (
    <Surface aria-labelledby="organization-group-form-title">
      <h3 id="organization-group-form-title" className="text-forest-heading-3 font-bold text-forest-text-primary">
        선택한 그룹 편집
      </h3>
      <div className="mt-forest-6 space-y-forest-6">
        <FormField id={nameId} label="그룹 이름" error={errorFor('name')} required>
          {(controlProps) => (
            <input
              {...controlProps}
              type="text"
              value={group.name}
              maxLength={100}
              onChange={(event) => onChange('name', event.target.value)}
            />
          )}
        </FormField>

        <FormField id={descriptionId} label="그룹 설명" error={errorFor('description')}>
          {(controlProps) => (
            <textarea
              {...controlProps}
              value={group.description}
              maxLength={300}
              rows={4}
              onChange={(event) => onChange('description', event.target.value)}
            />
          )}
        </FormField>

        <FormField id={parentId} label="상위 그룹" error={errorFor('parentGroupId')}>
          {(controlProps) => (
            <select
              {...controlProps}
              value={group.parentGroupId ?? ''}
              onChange={(event) => onChange('parentGroupId', event.target.value || null)}
            >
              <option value="">최상위</option>
              {parentOptions.map((parent) => <option key={parent.id} value={parent.id}>{parent.name}</option>)}
            </select>
          )}
        </FormField>

        <label className="flex min-h-forest-control items-center gap-3 rounded-forest-control border border-forest-border-subtle px-forest-4 font-semibold text-forest-text-primary">
          <input
            type="checkbox"
            checked={group.enabled}
            onChange={(event) => onChange('enabled', event.target.checked)}
            className="h-5 w-5 accent-forest-primary"
          />
          공개
        </label>
      </div>
    </Surface>
  );
}
