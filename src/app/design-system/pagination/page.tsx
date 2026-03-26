'use client';
import { useState } from 'react';
import { Pagination } from '@/components/ui/Pagination';

export default function PaginationPage() {
  const [page1, setPage1] = useState(1);
  const [page2, setPage2] = useState(5);
  const [page3, setPage3] = useState(3);

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-bold text-white mb-2">Pagination</h1>
        <p className="text-noctvm-silver">Page navigation for large datasets.</p>
      </div>
      <div className="space-y-8">
        <div className="space-y-2">
          <p className="text-noctvm-caption text-noctvm-silver">Small (page {page1} of 10)</p>
          <Pagination page={page1} total={10} onChange={setPage1} size="sm" />
        </div>
        <div className="space-y-2">
          <p className="text-noctvm-caption text-noctvm-silver">Medium with ellipsis (page {page2} of 20)</p>
          <Pagination page={page2} total={20} onChange={setPage2} size="md" />
        </div>
        <div className="space-y-2">
          <p className="text-noctvm-caption text-noctvm-silver">Large (page {page3} of 5)</p>
          <Pagination page={page3} total={5} onChange={setPage3} size="lg" />
        </div>
      </div>
    </div>
  );
}
