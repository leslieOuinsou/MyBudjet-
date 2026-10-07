import axios from 'axios';

const MODEL = process.env.ANTHROPIC_MODEL || 'claude-haiku-4-5-20251001';

export const isClaudeConfigured = () => Boolean(process.env.ANTHROPIC_API_KEY);

/** Appel minimal à l'API Messages d'Anthropic. Renvoie le texte de la réponse. */
export const askClaude = async ({ system, content, maxTokens = 600 }) => {
  const { data } = await axios.post(
    'https://api.anthropic.com/v1/messages',
    { model: MODEL, max_tokens: maxTokens, system, messages: [{ role: 'user', content }] },
    {
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      timeout: 30000,
    }
  );
  return (data.content || []).filter((b) => b.type === 'text').map((b) => b.text).join('');
};

/** Extrait un objet JSON d'une réponse texte (tolère les balises ```json). */
export const parseJsonReply = (text) => {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('Réponse IA illisible');
  return JSON.parse(match[0]);
};
