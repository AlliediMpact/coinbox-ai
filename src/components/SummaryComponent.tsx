'use client';

import {summarizeText} from '@/ai/flows/summarize-text-flow';
import {Button} from '@/components/ui/button';
import {Textarea} from '@/components/ui/textarea';
import {useState} from 'react';
import { useToast } from "@/hooks/use-toast"; // Import the useToast hook

export default function SummaryComponent() {
  const [text, setText] = useState('');
  const [summary, setSummary] = useState('');
  const { toast } = useToast(); // Initialize the useToast hook

  const handleSummarize = async () => {
    try {
      const result = await summarizeText({text: text});
      setSummary(result.summary);
      toast({
        title: "Summary Generated",
        description: "Text summarized successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to summarize text.",
        variant: "destructive", // Use the "destructive" variant for error messages
      });
    }
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
