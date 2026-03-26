'use client';
import { useState } from 'react';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';

const events = [
  {
    name: 'Panorama Bar',
    venue: 'Berghain',
    genre: 'Techno',
    date: 'Fri 23 Mar',
    tickets: 'Sold out',
  },
  {
    name: 'Fabric Live 103',
    venue: 'Fabric',
    genre: 'Drum & Bass',
    date: 'Sat 24 Mar',
    tickets: 'Available',
  },
  {
    name: 'Tresor NYE',
    venue: 'Tresor',
    genre: 'Industrial',
    date: 'Sun 25 Mar',
    tickets: 'Limited',
  },
  {
    name: 'Wake Up',
    venue: 'Robert Johnson',
    genre: 'House',
    date: 'Mon 26 Mar',
    tickets: 'Available',
  },
];

type SortDir = 'asc' | 'desc' | null;

export default function TablePage() {
  const [sort, setSort] = useState<{ col: string; dir: SortDir }>({
    col: '',
    dir: null,
  });

  const toggleSort = (col: string) =>
    setSort(s => ({
      col,
      dir: s.col === col ? (s.dir === 'asc' ? 'desc' : 'asc') : 'asc',
    }));

  const sorted = [...events].sort((a, b) => {
    if (!sort.col || !sort.dir) return 0;
    const key = sort.col as keyof typeof a;
    const cmp = a[key].localeCompare(b[key]);
    return sort.dir === 'asc' ? cmp : -cmp;
  });

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-bold text-white mb-2">Table</h1>
        <p className="text-noctvm-silver">Data table with sortable headers.</p>
      </div>

      {/* Striped + sortable */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-noctvm-silver uppercase tracking-widest">
          Striped + Sortable
        </h2>
        <Table isStriped>
          <TableHeader>
            <TableRow>
              <TableHead
                isSortable
                sortDirection={sort.col === 'name' ? sort.dir : null}
                onSort={() => toggleSort('name')}
              >
                Event
              </TableHead>
              <TableHead
                isSortable
                sortDirection={sort.col === 'venue' ? sort.dir : null}
                onSort={() => toggleSort('venue')}
              >
                Venue
              </TableHead>
              <TableHead>Genre</TableHead>
              <TableHead
                isSortable
                sortDirection={sort.col === 'date' ? sort.dir : null}
                onSort={() => toggleSort('date')}
              >
                Date
              </TableHead>
              <TableHead>Tickets</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody data-striped="true">
            {sorted.map(e => (
              <TableRow key={e.name}>
                <TableCell className="font-medium">{e.name}</TableCell>
                <TableCell className="text-noctvm-silver">{e.venue}</TableCell>
                <TableCell>
                  <Badge variant="genre">{e.genre}</Badge>
                </TableCell>
                <TableCell className="text-noctvm-silver">{e.date}</TableCell>
                <TableCell>
                  <span
                    className={
                      e.tickets === 'Sold out'
                        ? 'text-red-400'
                        : e.tickets === 'Limited'
                        ? 'text-noctvm-gold'
                        : 'text-noctvm-emerald'
                    }
                  >
                    {e.tickets}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Compact */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-noctvm-silver uppercase tracking-widest">
          Compact
        </h2>
        <Table isCompact>
          <TableHeader>
            <TableRow>
              <TableHead>Event</TableHead>
              <TableHead>Venue</TableHead>
              <TableHead>Genre</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Tickets</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {events.map(e => (
              <TableRow key={e.name}>
                <TableCell className="py-1 font-medium">{e.name}</TableCell>
                <TableCell className="py-1 text-noctvm-silver">{e.venue}</TableCell>
                <TableCell className="py-1">
                  <Badge variant="genre">{e.genre}</Badge>
                </TableCell>
                <TableCell className="py-1 text-noctvm-silver">{e.date}</TableCell>
                <TableCell className="py-1">
                  <span
                    className={
                      e.tickets === 'Sold out'
                        ? 'text-red-400'
                        : e.tickets === 'Limited'
                        ? 'text-noctvm-gold'
                        : 'text-noctvm-emerald'
                    }
                  >
                    {e.tickets}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
