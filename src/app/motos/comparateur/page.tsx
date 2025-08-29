'use client';

import CompareFilters from '@/components/comparator/CompareFilters';
import CompareSlots from '@/components/comparator/CompareSlots';
import SpecCheckboxes from '@/components/comparator/SpecCheckboxes';
import CompareTable from '@/components/comparator/CompareTable';

export default function Page() {
  return (
    <div className="flex flex-col md:flex-row gap-6 p-4">
      <aside className="md:w-1/4 border-r pr-4">
        <SpecCheckboxes />
      </aside>
      <main className="md:w-3/4 flex flex-col gap-4">
        <CompareFilters />
        <CompareSlots />
        <CompareTable />
      </main>
    </div>
  );
}
