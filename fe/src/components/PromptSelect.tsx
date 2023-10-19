import { useState, useEffect, useCallback } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./shadcn/ui/Select";
import { api } from "@/lib/axios";

interface Prompt {
  id: string;
  title: string;
  template: string;
}

interface PromptSelectProps {
  onPromptSelected: (template: string) => void;
}

export default function PromptSelect({ onPromptSelected }: PromptSelectProps) {
  const [prompts, setPrompts] = useState<Prompt[] | null>(null);

  const loadPrompts = useCallback(async () => {
    const { data } = await api.get('/prompts');

    setPrompts(data);
  }, [])

  useEffect(() => {
    loadPrompts();
  }, [loadPrompts]);

  function handlePromptSelected(promptId: string) {
    const selectedPrompt = prompts?.find(prompt => prompt.id === promptId);

    if (!selectedPrompt) {
      return;
    }

    onPromptSelected(selectedPrompt.template);
  }

  return (
    <Select onValueChange={handlePromptSelected}>
      <SelectTrigger>
        <SelectValue placeholder="Selecione um prompt..." />
      </SelectTrigger>
      <SelectContent>

        {prompts?.map((prompt) => (
          <SelectItem key={prompt.id} value={prompt.id}>{prompt.title}</SelectItem>
        ))}

      </SelectContent>
    </Select>
  );
}
