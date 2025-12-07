
'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { useUser } from '@/firebase';
import { createAlert as createAlertFlow, type AlertInput } from '@/ai/flows/create-alert-flow';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Send } from 'lucide-react';

const alertSchema = z.object({
  message: z.string().min(10, 'Message must be at least 10 characters long.'),
  type: z.enum(["Urgent", "Reminder", "Info"]),
  priority: z.enum(["High", "Medium", "Low"]),
  action: z.string().min(1, 'Action Link is required (e.g., /dashboard).'),
});

type AlertFormData = z.infer<typeof alertSchema>;

export function CreateAlertForm() {
  const { toast } = useToast();
  const { user } = useUser();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<AlertFormData>({
    resolver: zodResolver(alertSchema),
    defaultValues: {
      type: 'Info',
      priority: 'Medium',
      action: '/',
    },
  });

  const onSubmit = async (data: AlertFormData) => {
    if (!user) {
      toast({
        variant: 'destructive',
        title: 'Authentication Error',
        description: 'You must be logged in to create an alert.',
      });
      return;
    }

    const alertInput: AlertInput = {
      ...data,
      creatorId: user.uid,
      targetUserIds: [], // Broadcasting to everyone
    };

    try {
      await createAlertFlow(alertInput);
      toast({
        title: 'Alert Sent!',
        description: 'Your announcement has been broadcast to the team.',
      });
      reset();
    } catch (e: any) {
      console.error(e);
      toast({
        variant: 'destructive',
        title: 'Failed to Send Alert',
        description: e.message || 'There was an error sending the alert. Please try again.',
      });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="message">Announcement Message</Label>
        <Textarea
          id="message"
          placeholder="e.g., 'Team meeting is rescheduled to 11 AM tomorrow.'"
          {...register('message')}
          className="min-h-[100px]"
        />
        {errors.message && <p className="text-sm text-destructive">{errors.message.message}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="type">Alert Type</Label>
          <Controller
            name="type"
            control={control}
            render={({ field }) => (
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <SelectTrigger id="type">
                  <SelectValue placeholder="Select type..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Info">Info (General Information)</SelectItem>
                  <SelectItem value="Reminder">Reminder (Action Required)</SelectItem>
                  <SelectItem value="Urgent">Urgent (Immediate Attention)</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="priority">Priority Level</Label>
           <Controller
            name="priority"
            control={control}
            render={({ field }) => (
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <SelectTrigger id="priority">
                  <SelectValue placeholder="Select priority..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Low">Low</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="High">High</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="action">Action Link</Label>
        <Input
          id="action"
          placeholder="e.g., /management/expenses"
          {...register('action')}
        />
         {errors.action && <p className="text-sm text-destructive">{`${errors.action.message}`}</p>}
        <p className="text-xs text-muted-foreground">The page users will be sent to when they click 'View'.</p>
      </div>

      <Button className="w-full" type="submit" disabled={isSubmitting} size="lg">
        {isSubmitting ? (
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        ) : (
          <Send className="mr-2 h-5 w-5" />
        )}
        Send Announcement
      </Button>
    </form>
  );
}
