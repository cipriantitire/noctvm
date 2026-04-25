import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { isArtifactRiddenText } from '../src/lib/scrapers/utils';

function loadEnv(): void {
  const localEnv = path.join(process.cwd(), '.env.local');
  const env = path.join(process.cwd(), '.env');
  if (fs.existsSync(localEnv)) dotenv.config({ path: localEnv, override: false });
  if (fs.existsSync(env)) dotenv.config({ path: env, override: false });
}

function timestampId(date = new Date()): string {
  const pad = (n: number): string => String(n).padStart(2, '0');
  return `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}-${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}`;
}

function ensureDir(filePath: string): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

loadEnv();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRole) {
  throw new Error('Missing Supabase credentials: NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY');
}

const supabase = createClient(supabaseUrl, serviceRole);
const SUSPICIOUS_PRICE_RE = /(^0\d{2,}$)|(\b\d{4,}\b)/i;
const TBA_VENUE_RE = /\b(tba|tbc|to be announced|venue tbc|venue tba)\b/i;

async function main() {
  const today = new Date().toISOString().split('T')[0];
  
  // Fetch all upcoming events
  const { data: events, error } = await supabase
    .from('events')
    .select('id, title, venue, date, time, source, city, price, description, image_url, genres, ticket_url, event_url')
    .gte('date', today);
  
  if (error) {
    console.error('Error fetching events:', error);
    process.exit(1);
  }
  
  if (!events) {
    console.log('No events found');
    return;
  }
  
  console.log(`Total upcoming events: ${events.length}`);
  
  // Initialize counters
  const missingPrice: string[] = [];
  const suspiciousPrice: string[] = [];
  const missingDescription: string[] = [];
  const artifactDescription: string[] = [];
  const tbaVenue: string[] = [];
  const sourceCityCounts: Record<string, number> = {};
  const qualityBySource: Record<string, {
    total: number;
    missingPrice: number;
    suspiciousPrice: number;
    missingDescription: number;
    artifactDescription: number;
    tbaVenue: number;
  }> = {};
  const duplicateGroups: Record<string, any[]> = {};
  
  // Helper to normalize for dedupe (same as in index.ts)
  function normalizeForDedupe(s: string): string {
    if (!s) return '';
    return s.toLowerCase()
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\b(?:bucuresti|bucharest|constanta|constanța|cluj\s*napoca|cluj)\b/g, ' ')
      .replace(/\b(?:concert\s+caritabil|music\s+for\s+autism|festival\s+de\s+paste|festival\s+de\s+pa[șs]te)\b/g, ' ')
      .replace(/\b(?:\d+\s+ani|anniversary|aniversare)\b/g, ' ')
      .replace(/^(pw|ctrl|control|extra|live|concert|party|alt jazz)\s*[-•x]*\s*/i, '')
      .replace(/[|:;,.@()[\]{}/\\_•*–—!?&+#~'-]/g, ' ')
      .replace(/\s+/g, '')
      .trim();
  }
  
  events.forEach(event => {
    const source = event.source || 'unknown';
    qualityBySource[source] ??= {
      total: 0,
      missingPrice: 0,
      suspiciousPrice: 0,
      missingDescription: 0,
      artifactDescription: 0,
      tbaVenue: 0,
    };
    qualityBySource[source].total += 1;

    // Source/city counts
    const sourceCityKey = `${event.source}::${event.city || 'Bucharest'}`;
    sourceCityCounts[sourceCityKey] = (sourceCityCounts[sourceCityKey] || 0) + 1;
    
    // Missing price
    if (!event.price || event.price.trim() === '') {
      missingPrice.push(event.id);
      qualityBySource[source].missingPrice += 1;
    } else {
      if (SUSPICIOUS_PRICE_RE.test(event.price.trim())) {
        suspiciousPrice.push(event.id);
        qualityBySource[source].suspiciousPrice += 1;
      }
    }
    
    // Missing description
    if (!event.description || event.description.trim() === '') {
      missingDescription.push(event.id);
      qualityBySource[source].missingDescription += 1;
    } else {
      if (isArtifactRiddenText(event.description)) {
        artifactDescription.push(event.id);
        qualityBySource[source].artifactDescription += 1;
      }
    }
    
    // TBA venue
    if (TBA_VENUE_RE.test(event.venue || '')) {
      tbaVenue.push(event.id);
      qualityBySource[source].tbaVenue += 1;
    }
    
    // For duplicate grouping
    const key = `${normalizeForDedupe(event.title)}|${normalizeForDedupe(event.venue)}|${event.date}`;
    if (!duplicateGroups[key]) {
      duplicateGroups[key] = [];
    }
    duplicateGroups[key].push(event);
  });
  
  // Count duplicate groups (groups with more than 1 event)
  const duplicateGroupEntries = Object.entries(duplicateGroups)
    .filter(([_, group]) => group.length > 1);
  
  console.log('\n=== QUALITY REPORT ===');
  console.log(`Total events: ${events.length}`);
  console.log(`\nBy source:`);
  const sourceCounts: Record<string, number> = {};
  events.forEach(e => {
    sourceCounts[e.source] = (sourceCounts[e.source] || 0) + 1;
  });
  Object.entries(sourceCounts).sort(([,a],[,b]) => b - a).forEach(([source, count]) => {
    console.log(`  ${source}: ${count}`);
  });
  
  console.log(`\nBy city:`);
  const cityCounts: Record<string, number> = {};
  events.forEach(e => {
    const city = e.city || 'Bucharest';
    cityCounts[city] = (cityCounts[city] || 0) + 1;
  });
  Object.entries(cityCounts).sort(([,a],[,b]) => b - a).forEach(([city, count]) => {
    console.log(`  ${city}: ${count}`);
  });
  
  console.log(`\nQuality issues:`);
  console.log(`  Missing price: ${missingPrice.length}`);
  console.log(`  Suspicious price: ${suspiciousPrice.length}`);
  console.log(`  Missing description: ${missingDescription.length}`);
  console.log(`  Artifact-ridden description: ${artifactDescription.length}`);
  console.log(`  TBA venue: ${tbaVenue.length}`);
  console.log(`  Duplicate groups: ${duplicateGroupEntries.length}`);

  console.log(`\nQuality by source:`);
  Object.entries(qualityBySource)
    .sort(([, a], [, b]) => b.total - a.total)
    .forEach(([source, counts]) => {
      console.log(`  ${source}: total=${counts.total}, missingPrice=${counts.missingPrice}, suspiciousPrice=${counts.suspiciousPrice}, missingDescription=${counts.missingDescription}, artifacts=${counts.artifactDescription}, tbaVenue=${counts.tbaVenue}`);
    });
  
  if (missingPrice.length > 0) {
    console.log(`\nMissing price event IDs (first 5):`);
    missingPrice.slice(0, 5).forEach(id => console.log(`  ${id}`));
  }
  
  if (suspiciousPrice.length > 0) {
    console.log(`\nSuspicious price event IDs (first 5):`);
    suspiciousPrice.slice(0, 5).forEach(id => console.log(`  ${id}`));
  }
  
  if (missingDescription.length > 0) {
    console.log(`\nMissing description event IDs (first 5):`);
    missingDescription.slice(0, 5).forEach(id => console.log(`  ${id}`));
  }
  
  if (artifactDescription.length > 0) {
    console.log(`\nArtifact-ridden description event IDs (first 5):`);
    artifactDescription.slice(0, 5).forEach(id => console.log(`  ${id}`));
  }
  
  if (tbaVenue.length > 0) {
    console.log(`\nTBA venue event IDs (first 5):`);
    tbaVenue.slice(0, 5).forEach(id => console.log(`  ${id}`));
  }
  
  if (duplicateGroupEntries.length > 0) {
    console.log(`\nDuplicate groups (first 3):`);
    duplicateGroupEntries.slice(0, 3).forEach(([key, group]) => {
      console.log(`  Key: ${key}`);
      console.log(`    Events: ${group.map(e => `${e.source}:${e.title}`).join(', ')}`);
    });
  }

  const report = {
    generatedAt: new Date().toISOString(),
    fromDate: today,
    totalEvents: events.length,
    bySource: sourceCounts,
    byCity: cityCounts,
    bySourceCity: sourceCityCounts,
    qualityBySource,
    quality: {
      missingPriceCount: missingPrice.length,
      suspiciousPriceCount: suspiciousPrice.length,
      missingDescriptionCount: missingDescription.length,
      artifactDescriptionCount: artifactDescription.length,
      tbaVenueCount: tbaVenue.length,
      duplicateGroupCount: duplicateGroupEntries.length,
    },
    samples: {
      missingPrice: missingPrice.slice(0, 25),
      suspiciousPrice: suspiciousPrice.slice(0, 25),
      missingDescription: missingDescription.slice(0, 25),
      artifactDescription: artifactDescription.slice(0, 25),
      tbaVenue: tbaVenue.slice(0, 25),
      duplicateGroups: duplicateGroupEntries.slice(0, 10).map(([key, group]) => ({
        key,
        events: group.map(event => ({
          id: event.id,
          title: event.title,
          source: event.source,
          city: event.city,
          date: event.date,
          venue: event.venue,
        })),
      })),
    },
  };

  const outPath = path.join(process.cwd(), 'tmp', 'scraper-audits', `${timestampId()}-quality-report.json`);
  ensureDir(outPath);
  fs.writeFileSync(outPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  console.log(`\nQuality report written: ${outPath}`);
}

main().catch(console.error);
