export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    // Call the free Pollinations API from the server (bypasses CORS)
    const response = await fetch('https://text.pollinations.ai/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: req.body.messages,
        model: 'openai'
      })
    });

    if (!response.ok) throw new Error('AI Provider is down.');
    
    // Pollinations returns raw text
    const botReply = await response.text(); 
    res.status(200).json({ reply: botReply });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
