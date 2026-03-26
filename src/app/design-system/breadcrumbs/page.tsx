'use client';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export default function BreadcrumbsPage() {
  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-bold text-white mb-2">Breadcrumbs</h1>
        <p className="text-noctvm-silver">Navigation hierarchy trail.</p>
      </div>
      <div className="space-y-6">
        <Breadcrumbs items={[
          { label: 'Home', href: '/' },
          { label: 'Venues', href: '/venues' },
          { label: 'Prism Berlin' },
        ]} />
        <Breadcrumbs items={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Events', href: '/dashboard/events' },
          { label: 'Berghain NYE', href: '/dashboard/events/1' },
          { label: 'Analytics' },
        ]} />
        <Breadcrumbs
          items={[
            { label: 'Home', href: '/' },
            { label: 'Discover', href: '/discover' },
            { label: 'Techno', href: '/discover/techno' },
            { label: 'Berlin', href: '/discover/techno/berlin' },
            { label: 'This Weekend' },
          ]}
          maxItems={3}
        />
      </div>
    </div>
  );
}
