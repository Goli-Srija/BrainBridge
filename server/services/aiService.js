// OPTIONAL AI feedback. Only active when ANTHROPIC_API_KEY is set in .env.
// The app never pretends AI is connected: every response is labelled with evaluator = 'ai' or 'rule-based'.
// Scores always come from the deterministic rubric; AI only adds extra written feedback / a follow-up question.

const isEnabled = () => Boolean(process.env.ANTHROPIC_API_KEY);
const MODEL = () => process.env.AI_MODEL || 'claude-sonnet-5-5';

async function aiFeedback({ question, answer, modelAnswer, track }) {
  if (!isEnabled()) return null;
  const prompt = `You are an interviewer for a ${track || 'software'} role giving feedback to an engineering student.
Question: ${question}
Reference points: ${modelAnswer}
Student's answer: ${answer}

Reply in JSON only: {"feedback": "<3-4 sentences of specific, encouraging feedback>", "follow_up": "<one follow-up question an interviewer would ask next>"}`;
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: MODEL(), max_tokens: 400, messages: [{ role: 'user', content: prompt }] }),
      signal: AbortSignal.timeout(20000),
    });
    if (!res.ok) {
      console.warn('[ai] request failed', res.status, await res.text());
      return null;
    }
    const data = await res.json();
    const text = (data.content || []).map((c) => c.text || '').join('');
    const json = JSON.parse(text.slice(text.indexOf('{'), text.lastIndexOf('}') + 1));
    return { feedback: String(json.feedback || ''), followUp: String(json.follow_up || '') };
  } catch (err) {
    console.warn('[ai] error:', err.message);
    return null; // caller falls back to rule-based feedback only
  }
}

module.exports = { isEnabled, aiFeedback };
