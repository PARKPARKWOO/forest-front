export default function OrganizationGroupForm({ group, parentOptions, errors, onChange }) {
  if (!group) {
    return (
      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm" aria-label="그룹 상세 편집">
        <p className="text-gray-600">왼쪽에서 편집할 그룹을 선택해 주세요.</p>
      </section>
    );
  }

  const errorFor = (field) => errors.find(({ path }) => path.endsWith(`.${field}`))?.message;
  const descriptionErrorId = `organization-group-description-error-${group.id}`;
  const parentErrorId = `organization-group-parent-error-${group.id}`;

  return (
    <section className="min-w-0 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6" aria-labelledby="organization-group-form-title">
      <h3 id="organization-group-form-title" className="text-xl font-bold text-gray-900">선택한 그룹 편집</h3>
      <div className="mt-5 space-y-5">
        <label className="block font-semibold text-gray-800">
          그룹 이름
          <input
            type="text"
            value={group.name}
            maxLength={100}
            aria-invalid={Boolean(errorFor('name'))}
            aria-describedby={errorFor('name') ? 'organization-group-name-error' : undefined}
            onChange={(event) => onChange('name', event.target.value)}
            className="mt-2 min-h-12 w-full rounded-lg border border-gray-300 px-4 py-2 font-normal focus:border-green-700 focus:outline-none focus:ring-2 focus:ring-green-700"
          />
        </label>
        {errorFor('name') && <p id="organization-group-name-error" className="text-sm font-semibold text-red-700">{errorFor('name')}</p>}

        <label className="block font-semibold text-gray-800">
          그룹 설명
          <textarea
            value={group.description}
            maxLength={300}
            rows={4}
            aria-invalid={Boolean(errorFor('description'))}
            aria-describedby={errorFor('description') ? descriptionErrorId : undefined}
            onChange={(event) => onChange('description', event.target.value)}
            className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 font-normal focus:border-green-700 focus:outline-none focus:ring-2 focus:ring-green-700"
          />
        </label>
        {errorFor('description') && <p id={descriptionErrorId} className="text-sm font-semibold text-red-700">{errorFor('description')}</p>}

        <label className="block font-semibold text-gray-800">
          상위 그룹
          <select
            value={group.parentGroupId ?? ''}
            aria-invalid={Boolean(errorFor('parentGroupId'))}
            aria-describedby={errorFor('parentGroupId') ? parentErrorId : undefined}
            onChange={(event) => onChange('parentGroupId', event.target.value || null)}
            className="mt-2 min-h-12 w-full rounded-lg border border-gray-300 bg-white px-4 py-2 font-normal focus:border-green-700 focus:outline-none focus:ring-2 focus:ring-green-700"
          >
            <option value="">최상위</option>
            {parentOptions.map((parent) => <option key={parent.id} value={parent.id}>{parent.name}</option>)}
          </select>
        </label>
        {errorFor('parentGroupId') && <p id={parentErrorId} className="text-sm font-semibold text-red-700">{errorFor('parentGroupId')}</p>}

        <label className="flex min-h-12 items-center gap-3 rounded-lg border border-gray-200 px-4 font-semibold text-gray-800">
          <input
            type="checkbox"
            checked={group.enabled}
            onChange={(event) => onChange('enabled', event.target.checked)}
            className="h-5 w-5 accent-green-700"
          />
          공개
        </label>
      </div>
    </section>
  );
}
