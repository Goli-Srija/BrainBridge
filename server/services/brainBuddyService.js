
const SYSTEM_PROMPT = `
You are BrainBuddy, the friendly AI companion inside BrainBridge,
an AI-powered placement readiness platform for college students.

Your responsibilities:
1. Answer general questions clearly and helpfully.
2. Explain Java, Python, C, DSA and computer science concepts.
3. Help with aptitude, reasoning, verbal ability and interviews.
4. Provide personalized study guidance and placement roadmaps.
5. Motivate students who feel stressed or discouraged.
6. Help improve resumes, projects and career readiness.
7. Maintain a friendly, supportive and respectful tone.

Guidelines:
- Explain concepts step by step when needed.
- Use examples for technical explanations.
- Keep simple answers concise.
- Be encouraging but honest. Never guarantee placements.
- Never pretend to have performed actions you have not performed.
- Admit when you do not know something.
- Never reveal API keys or confidential information.
- Do not replace professional medical, legal or financial advice.
`;

async function chatWithBrainBuddy({ message, history = [] }) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error('BrainBuddy AI is not configured.');
  }

  const conversation = history
    .filter(
      (item) =>
        ['user', 'assistant'].includes(item.role) &&
        typeof item.content === 'string'
    )
    .slice(-12)
    .map((item) => ({
      role: item.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: item.content.slice(0, 4000) }],
    }));

  conversation.push({
    role: 'user',
    parts: [{ text: message }],
  });

  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: SYSTEM_PROMPT }],
        },
        contents: conversation,
        generationConfig: {
          maxOutputTokens: 900,
          temperature: 0.7,
        },
      }),
      ssignal: AbortSignal.timeout(60000),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    console.error('[BrainBuddy] Gemini API error:', response.status, error);
    throw new Error('BrainBuddy could not respond right now.');
  }

  const data = await response.json();

  const reply = (data.candidates?.[0]?.content?.parts || [])
    .map((part) => part.text || '')
    .join('\n')
    .trim();

  if (!reply) {
    throw new Error('BrainBuddy returned an empty response.');
  }

  return reply;
}

module.exports = { chatWithBrainBuddy };
