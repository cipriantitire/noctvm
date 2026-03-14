import { guessGenres } from '../src/lib/scrapers/utils';

const titles = [
  'Scufița Roșie – teatru Qfeel @ Sala Luceafărul',
  'Tom Degețel - teatru interactiv pentru copii @ Restaurant Hanu’ lui Manuc',
  'Cenusăreasa by teatru Qfeel @ Sala Luceafărul',
  'Techno Party in Berlin',
  'Jazz Night',
  'Workshop de gatit'
];

titles.forEach(t => {
  console.log(`Title: "${t}" -> Genres:`, guessGenres(t, ''));
});
