const geminiKey = process.env.GEMINI_API_KEY || 'AIzaSyC1wS_A3Cdu-gPLHniQ-W1VZ61ss6HalWQ';
const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`;
const prompt = "hello";

fetch(url, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    contents: [{ parts: [{ text: prompt }] }]
  })
}).then(res => res.text()).then(console.log).catch(console.error);
