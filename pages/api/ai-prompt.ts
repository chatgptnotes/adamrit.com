import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { details, promptType } = req.body;
  if (!details || !promptType) {
    return res.status(400).json({ error: 'Missing details or promptType' });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'OpenAI API key not configured' });
  }

  // Tailor the prompt for each type
  let instruction = '';
  switch (promptType.toLowerCase()) {
    case 'discharge summary':
      instruction = `Everytime i type this :discharge: assume You are a medical specialist, Make a professionally written Discharge summary that will show off the power of chatgpt.: Make up facts..Add findings which are not provided to you. Come up with creative complaints, events during the stay in hospital and relevant examination findings, add medications to be given on discharge in Indian BRANDS. The entire document should be a minimum of 800 words. If a surgery was performed, Come up with creative detailed surgery notes with this which should be a minimum of 6 sentences. Use headings, subheadings, bullet points, and bold to organize the information. The person who will read the summary is another doctor. Advice appropriate precautions to be taken at home after discharge. Also advice to return to hospital in case of any or all the complications of surgery performed or medical treatment taken which was noticed after discharge. List the symptoms and signs of these complications. Do not mention the name, sex or age of the patient.\nAdd the sentence at the end :URGENT CARE/ EMERGENCY CARE IS AVAILABLE 24 X 7. PLEASE CONTACT:-7030974619, 9373111709. The medication table should be in HTML format (using <table>, <tr>, <th>, <td>, and <strong> for bold headings and cells), not Markdown. Another line in hindi to be added in the column of dosage in addition to english. Start summary with the Diagnosis, followed by medication. These should be at the beginning of summary and in table form with columns for name, strength, route, dosage and the number of days to be taken. This patient does not have comorbidities other than that is mentioned.`;
      break;
    case 'dama':
      instruction = 'Generate a formal DAMA (Discharge Against Medical Advice) note for the patient below, including patient details, reason for DAMA, and any warnings or advice given.';
      break;
    case 'death summary':
      instruction = 'Generate a formal death summary for the patient below, including cause of death, clinical course, and relevant details.';
      break;
    case 'death certificate':
      instruction = 'Generate a formal death certificate text for the patient below, suitable for official hospital documentation.';
      break;
    case 'injury report':
      instruction = 'Generate a formal medical injury report for the patient below, including nature of injury, circumstances, and clinical findings.';
      break;
    case 'physiotherapy instructions':
      instruction = `Ignore all previous instructions. Act like a medical specialist, Make a professionally written Physiotherapy instructions including a detailed home exercise program. Make up facts..Add findings which are not provided to you. The entire summary should be a minimum of 800 words. Do not mention the name, sex or age of the patient. The person who is going to read what you share will be a doctor. This patient does not have comorbidities other than that is mentioned.`;
      break;
    default:
      instruction = `Generate a ${promptType} for the patient below.`;
  }

  const prompt = `Patient Details:\n${details}\n\n${instruction}`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: 'You are a helpful medical assistant for hospital staff.' },
          { role: 'user', content: prompt },
        ],
        max_tokens: 1024,
        temperature: 0.7,
      }),
    });
    const data = await response.json();
    if (data.choices && data.choices[0] && data.choices[0].message) {
      return res.status(200).json({ summary: data.choices[0].message.content });
    } else {
      return res.status(500).json({ error: 'No summary generated', details: data });
    }
  } catch (error) {
    return res.status(500).json({ error: 'OpenAI API error', details: error });
  }
} 