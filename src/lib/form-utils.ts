import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';

export function useFormWithValidation<T extends z.ZodType>(
  schema: T,
  onSubmit: (values: z.infer<T>) => Promise<void>,
  options?: {
    defaultValues?: Partial<z.infer<T>>;
    successMessage?: string;
  }
) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: options?.defaultValues
  });

  const handleSubmit = form.handleSubmit(async (values) => {
    try {
      setLoading(true);
      await onSubmit(values);
      if (options?.successMessage) {
        toast({
          title: "Success",
          description: options.successMessage
        });
      }
      form.reset();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  });

  return { form, handleSubmit, loading };
}
