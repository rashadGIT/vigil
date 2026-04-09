'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle2 } from 'lucide-react';
import { ServiceType } from '@vigil/shared-types';
import { publicApiClient } from '@/lib/api/public-client';
import { cn } from '@/lib/utils/cn';

// Step 1 schema
const step1Schema = z.object({
  deceasedFirstName: z.string().min(1, 'First name is required'),
  deceasedLastName: z.string().min(1, 'Last name is required'),
  dateOfBirth: z.string().optional(),
  dateOfDeath: z.string().optional(),
  serviceType: z.enum(['burial', 'cremation', 'graveside', 'memorial'], {
    errorMap: () => ({ message: 'Select a service type' }),
  }),
});

// Step 2 schema
const step2Schema = z.object({
  contactFirstName: z.string().min(1, 'First name is required'),
  contactLastName: z.string().min(1, 'Last name is required'),
  contactPhone: z.string().min(10, 'Enter a valid phone number'),
  contactEmail: z.string().email('Enter a valid email address'),
  contactRelationship: z.string().min(1, 'Relationship is required'),
});

// Step 3 schema
const step3Schema = z.object({
  notes: z.string().optional(),
  specialRequests: z.string().optional(),
});

type Step1Values = z.infer<typeof step1Schema>;
type Step2Values = z.infer<typeof step2Schema>;
type Step3Values = z.infer<typeof step3Schema>;

const serviceTypeLabel: Record<string, string> = {
  burial: 'Burial',
  cremation: 'Cremation',
  graveside: 'Graveside',
  memorial: 'Memorial',
};

const TOTAL_STEPS = 3;

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-2 mb-8">
      {Array.from({ length: total }, (_, i) => i + 1).map((step) => (
        <div key={step} className="flex items-center">
          <div className={cn(
            'flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium border-2 transition-colors',
            step < current
              ? 'bg-primary border-primary text-primary-foreground'
              : step === current
                ? 'border-primary text-primary'
                : 'border-muted text-muted-foreground',
          )}>
            {step < current ? <CheckCircle2 className="h-5 w-5" /> : step}
          </div>
          {step < total && <div className={cn('h-0.5 w-8', step < current ? 'bg-primary' : 'bg-muted')} />}
        </div>
      ))}
    </div>
  );
}

interface IntakeFormProps {
  tenantSlug: string;
}

export function IntakeForm({ tenantSlug }: IntakeFormProps) {
  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Accumulate data across steps
  const [step1Data, setStep1Data] = useState<Step1Values | null>(null);
  const [step2Data, setStep2Data] = useState<Step2Values | null>(null);

  const step1Form = useForm<Step1Values>({
    resolver: zodResolver(step1Schema),
    defaultValues: step1Data ?? { serviceType: 'burial' },
  });

  const step2Form = useForm<Step2Values>({
    resolver: zodResolver(step2Schema),
    defaultValues: step2Data ?? {},
  });

  const step3Form = useForm<Step3Values>({
    resolver: zodResolver(step3Schema),
  });

  async function handleStep1Submit(values: Step1Values) {
    setStep1Data(values);
    setStep(2);
  }

  async function handleStep2Submit(values: Step2Values) {
    setStep2Data(values);
    setStep(3);
  }

  async function handleStep3Submit(values: Step3Values) {
    if (!step1Data || !step2Data) return;

    setIsSubmitting(true);
    try {
      await publicApiClient.post(`/intake/${tenantSlug}`, {
        // Deceased info
        deceasedFirstName: step1Data.deceasedFirstName,
        deceasedLastName: step1Data.deceasedLastName,
        dateOfBirth: step1Data.dateOfBirth || null,
        dateOfDeath: step1Data.dateOfDeath || null,
        serviceType: step1Data.serviceType,
        // Family contact
        contactFirstName: step2Data.contactFirstName,
        contactLastName: step2Data.contactLastName,
        contactPhone: step2Data.contactPhone,
        contactEmail: step2Data.contactEmail,
        contactRelationship: step2Data.contactRelationship,
        // Notes
        notes: values.notes || null,
        specialRequests: values.specialRequests || null,
      });
      setSubmitted(true);
    } catch {
      toast.error('Submission failed. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="text-center py-12 space-y-4">
        <div className="flex justify-center">
          <CheckCircle2 className="h-16 w-16 text-green-600" />
        </div>
        <h2 className="text-xl font-semibold">Thank you</h2>
        <p className="text-muted-foreground max-w-sm mx-auto">
          Your information has been received. Our team will be in touch shortly.
        </p>
      </div>
    );
  }

  return (
    <div>
      <StepIndicator current={step} total={TOTAL_STEPS} />

      {/* Step 1: Deceased Info */}
      {step === 1 && (
        <form onSubmit={step1Form.handleSubmit(handleStep1Submit)} className="space-y-5">
          <h2 className="text-lg font-semibold">About the Deceased</h2>

          <div className="space-y-1">
            <Label htmlFor="firstName" className="font-medium">First Name <span className="text-destructive">*</span></Label>
            <Input id="firstName" {...step1Form.register('deceasedFirstName')} className="w-full text-base h-12" />
            {step1Form.formState.errors.deceasedFirstName && (
              <p className="text-sm text-destructive">{step1Form.formState.errors.deceasedFirstName.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor="lastName" className="font-medium">Last Name <span className="text-destructive">*</span></Label>
            <Input id="lastName" {...step1Form.register('deceasedLastName')} className="w-full text-base h-12" />
            {step1Form.formState.errors.deceasedLastName && (
              <p className="text-sm text-destructive">{step1Form.formState.errors.deceasedLastName.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="dob" className="font-medium">Date of Birth</Label>
              <Input id="dob" type="date" {...step1Form.register('dateOfBirth')} className="w-full h-12" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="dod" className="font-medium">Date of Death</Label>
              <Input id="dod" type="date" {...step1Form.register('dateOfDeath')} className="w-full h-12" />
            </div>
          </div>

          <div className="space-y-1">
            <Label className="font-medium">Service Type <span className="text-destructive">*</span></Label>
            <Select
              value={step1Form.watch('serviceType')}
              onValueChange={(v) => step1Form.setValue('serviceType', v as 'burial' | 'cremation' | 'graveside' | 'memorial', { shouldValidate: true })}
            >
              <SelectTrigger className="w-full h-12 text-base">
                <SelectValue placeholder="Select a service type" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(serviceTypeLabel).map(([value, label]) => (
                  <SelectItem key={value} value={value} className="text-base py-3">{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {step1Form.formState.errors.serviceType && (
              <p className="text-sm text-destructive">{step1Form.formState.errors.serviceType.message}</p>
            )}
          </div>

          <Button type="submit" className="w-full h-12 text-base mt-2">
            Continue
          </Button>
        </form>
      )}

      {/* Step 2: Family Contact */}
      {step === 2 && (
        <form onSubmit={step2Form.handleSubmit(handleStep2Submit)} className="space-y-5">
          <h2 className="text-lg font-semibold">Primary Contact</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="font-medium">First Name <span className="text-destructive">*</span></Label>
              <Input {...step2Form.register('contactFirstName')} className="w-full text-base h-12" />
              {step2Form.formState.errors.contactFirstName && (
                <p className="text-sm text-destructive">{step2Form.formState.errors.contactFirstName.message}</p>
              )}
            </div>
            <div className="space-y-1">
              <Label className="font-medium">Last Name <span className="text-destructive">*</span></Label>
              <Input {...step2Form.register('contactLastName')} className="w-full text-base h-12" />
              {step2Form.formState.errors.contactLastName && (
                <p className="text-sm text-destructive">{step2Form.formState.errors.contactLastName.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-1">
            <Label className="font-medium">Phone Number <span className="text-destructive">*</span></Label>
            <Input type="tel" {...step2Form.register('contactPhone')} className="w-full text-base h-12" placeholder="(555) 000-0000" />
            {step2Form.formState.errors.contactPhone && (
              <p className="text-sm text-destructive">{step2Form.formState.errors.contactPhone.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <Label className="font-medium">Email Address <span className="text-destructive">*</span></Label>
            <Input type="email" {...step2Form.register('contactEmail')} className="w-full text-base h-12" placeholder="your@email.com" />
            {step2Form.formState.errors.contactEmail && (
              <p className="text-sm text-destructive">{step2Form.formState.errors.contactEmail.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <Label className="font-medium">Relationship to Deceased <span className="text-destructive">*</span></Label>
            <Input {...step2Form.register('contactRelationship')} className="w-full text-base h-12" placeholder="e.g. Spouse, Child, Sibling" />
            {step2Form.formState.errors.contactRelationship && (
              <p className="text-sm text-destructive">{step2Form.formState.errors.contactRelationship.message}</p>
            )}
          </div>

          <div className="flex gap-3 mt-2">
            <Button type="button" variant="outline" className="flex-1 h-12" onClick={() => setStep(1)}>
              Back
            </Button>
            <Button type="submit" className="flex-1 h-12 text-base">
              Continue
            </Button>
          </div>
        </form>
      )}

      {/* Step 3: Service Preferences */}
      {step === 3 && (
        <form onSubmit={step3Form.handleSubmit(handleStep3Submit)} className="space-y-5">
          <h2 className="text-lg font-semibold">Service Preferences</h2>

          <div className="space-y-1">
            <Label className="font-medium">Special Requests</Label>
            <Textarea
              {...step3Form.register('specialRequests')}
              rows={4}
              className="w-full text-base resize-none"
              placeholder="Any specific requests for the service..."
            />
          </div>

          <div className="space-y-1">
            <Label className="font-medium">Additional Notes</Label>
            <Textarea
              {...step3Form.register('notes')}
              rows={3}
              className="w-full text-base resize-none"
              placeholder="Anything else you'd like our team to know..."
            />
          </div>

          <div className="flex gap-3 mt-2">
            <Button type="button" variant="outline" className="flex-1 h-12" onClick={() => setStep(2)}>
              Back
            </Button>
            <Button type="submit" className="flex-1 h-12 text-base" disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : 'Submit'}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
