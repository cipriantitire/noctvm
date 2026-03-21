const url = 'https://www.control-club.ro/events/';
fetch(url).then(r=>r.text()).then(h => {
  const re = /href=["'](\/?event\/\?slug=([^"'&]+))["'][^>]*>([^<]+)</gi;
  const arr = [...h.matchAll(re)];
  console.log('Matches:', arr.length);
  if (arr.length > 0) {
    console.log('First match URL:', arr[0][1]);
    console.log('First match Slug:', arr[0][2]);
    console.log('First match Text:', arr[0][3]);
  }
});
