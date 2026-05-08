export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { subject } = req.body;
  const groqApiKey = process.env.GROQ_API_KEY;

  if (!groqApiKey) {
    return res.status(500).json({ error: 'GROQ_API_KEY is not configured.' });
  }

  const prompt = `You are a strict AI Quiz Master for 12th-grade Science (Subject: ${subject}). 
Generate ONE multiple-choice question.
STRICT RULE 1: The question and all 4 options MUST be in 100% Pure Hindi (Devanagari script).
STRICT RULE 2: Respond ONLY with a valid JSON object. Do not include markdown code blocks, do not include explanations.
Format exactly like this:
{
  "question": "यहाँ हिंदी में प्रश्न...",
  "options":["विकल्प 1", "विकल्प 2", "विकल्प 3", "विकल्प 4"],
  "answerIndex": 0
}`;

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${groqApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages:[{ role: 'user', content: prompt }],
        temperature: 0.7
      })
    });

    const data = await response.json();
    let aiOutput = data.choices[0].message.content.trim();
    
    if (aiOutput.startsWith('```json')) {
      aiOutput = aiOutput.replace(/```json/g, '').replace(/```/g, '').trim();
    }

    const quizData = JSON.parse(aiOutput);
    res.status(200).json(quizData);
  } catch (error) {
    console.error('Groq AI Error:', error);
    res.status(500).json({ error: 'Failed to generate quiz.' });
  }
}
