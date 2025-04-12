'use client';

import {summarizeText} from '@/ai/flows/summarize-text-flow';
import {Button} from '@/components/ui/button';
import {Textarea} from '@/components/ui/textarea';
import {useState} from 'react';

export default function SummaryComponent() {
  const [text, setText] = useState('');
  const [summary, setSummary] = useState('');

  const handleSummarize = async () => {
    const result = await summarizeText({text: text});
    setSummary(result.summary);
  };

  return (
    <div>
      <Textarea
        placeholder="Enter text to summarize"
        value={text}
        onChange={e => setText(e.target.value)}
        className="w-full mb-4"
      />
      <Button onClick={handleSummarize}>Summarize</Button>
      {summary && (
        <div className="mt-4">
          <strong>Summary:</strong>
          <p>{summary}</p>
        </div>
      )}
    </div>
  );
}
