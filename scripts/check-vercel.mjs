async function check() {
  const res = await fetch('https://chaizstore-web.vercel.app/');
  const html = await res.text();
  console.log('HTML from Vercel length:', html.length);
  const matches = [...html.matchAll(/src="([^"]+)"/g)].map(m => m[1]);
  console.log('Script tags on Vercel:', matches);
  
  const localScript = matches.find(s => s.startsWith('/assets/'));
  if (localScript) {
    const jsUrl = 'https://chaizstore-web.vercel.app' + localScript;
    const jsRes = await fetch(jsUrl);
    const jsText = await jsRes.text();
    console.log('Main bundle size on Vercel:', jsText.length);
    console.log('Contains firebasedatabase.app?:', jsText.includes('firebasedatabase.app'));
    console.log('Contains Firebase SDK?:', jsText.includes('firebase'));
  }
}
check().catch(console.error);
