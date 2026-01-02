import type { Contact } from '@anso/types';
import {
  Modal,
  ModalHeader,
  ModalContent,
  ModalFooter,
  Button,
  Input,
  Label,
  Badge,
} from '@anso/ui';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, X } from 'lucide-react';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { useCreateContact, useUpdateContact } from '@/services/contacts';

const contactSchema = z.object({
  name: z
    .string()
    .min(1, 'Le nom est requis')
    .max(100, 'Le nom ne peut pas dépasser 100 caractères'),
  email: z
    .string()
    .email('Email invalide')
    .max(255, 'Email trop long')
    .optional()
    .or(z.literal('')),
  phone: z
    .string()
    .max(20, 'Numéro trop long')
    .optional()
    .or(z.literal('')),
  company: z
    .string()
    .max(100, 'Nom d\'entreprise trop long')
    .optional()
    .or(z.literal('')),
  notes: z
    .string()
    .max(1000, 'Notes trop longues')
    .optional()
    .or(z.literal('')),
  tagsInput: z.string().optional(),
});

type ContactFormData = z.infer<typeof contactSchema>;

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspaceId: string;
  contact?: Contact;
}

export function ContactModal({
  isOpen,
  onClose,
  workspaceId,
  contact,
}: ContactModalProps): JSX.Element {
  const isEditing = !!contact;

  const createMutation = useCreateContact(workspaceId);
  const updateMutation = useUpdateContact(workspaceId);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      company: '',
      notes: '',
      tagsInput: '',
    },
  });

  const tagsInput = watch('tagsInput');
  const currentTags = tagsInput
    ? tagsInput
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean)
    : [];

  useEffect(() => {
    if (isOpen) {
      if (contact) {
        reset({
          name: contact.name,
          email: contact.email || '',
          phone: contact.phone || '',
          company: contact.company || '',
          notes: contact.notes || '',
          tagsInput: contact.tags.join(', '),
        });
      } else {
        reset({
          name: '',
          email: '',
          phone: '',
          company: '',
          notes: '',
          tagsInput: '',
        });
      }
    }
  }, [isOpen, contact, reset]);

  const onSubmit = async (data: ContactFormData): Promise<void> => {
    const tags = data.tagsInput
      ? data.tagsInput
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean)
      : [];

    const payload = {
      name: data.name,
      email: data.email || undefined,
      phone: data.phone || undefined,
      company: data.company || undefined,
      notes: data.notes || undefined,
      tags,
    };

    try {
      if (isEditing) {
        await updateMutation.mutateAsync({
          contactId: contact.id,
          input: payload,
        });
      } else {
        await createMutation.mutateAsync(payload);
      }
      onClose();
    } catch {
      // Error is handled by the mutation
    }
  };

  const removeTag = (tagToRemove: string): void => {
    const newTags = currentTags.filter((t) => t !== tagToRemove);
    setValue('tagsInput', newTags.join(', '));
  };

  const isPending = createMutation.isPending || updateMutation.isPending;
  const error = createMutation.error || updateMutation.error;

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <ModalHeader onClose={onClose}>
          {isEditing ? 'Modifier le contact' : 'Nouveau contact'}
        </ModalHeader>

        <ModalContent className="space-y-4">
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
              {error instanceof Error ? error.message : 'Une erreur est survenue'}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">
              Nom <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              placeholder="Jean Dupont"
              {...register('name')}
              aria-invalid={!!errors.name}
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="jean@exemple.fr"
              {...register('email')}
              aria-invalid={!!errors.email}
            />
            {errors.email && (
              <p className="text-sm text-red-500">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Téléphone</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="+33 6 12 34 56 78"
              {...register('phone')}
              aria-invalid={!!errors.phone}
            />
            {errors.phone && (
              <p className="text-sm text-red-500">{errors.phone.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="company">Entreprise</Label>
            <Input
              id="company"
              placeholder="Acme Inc"
              {...register('company')}
              aria-invalid={!!errors.company}
            />
            {errors.company && (
              <p className="text-sm text-red-500">{errors.company.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="tagsInput">Tags</Label>
            <Input
              id="tagsInput"
              placeholder="client, vip, prospect (séparés par des virgules)"
              {...register('tagsInput')}
            />
            {currentTags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {currentTags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="gap-1">
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="ml-1 hover:text-red-500"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
            <p className="text-xs text-slate-500">
              Séparez les tags par des virgules
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <textarea
              id="notes"
              rows={3}
              placeholder="Notes additionnelles..."
              className="flex w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 disabled:cursor-not-allowed disabled:opacity-50"
              {...register('notes')}
            />
            {errors.notes && (
              <p className="text-sm text-red-500">{errors.notes.message}</p>
            )}
          </div>
        </ModalContent>

        <ModalFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
            Annuler
          </Button>
          <Button type="submit" disabled={isPending || isSubmitting}>
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isEditing ? 'Modification...' : 'Création...'}
              </>
            ) : isEditing ? (
              'Modifier'
            ) : (
              'Créer'
            )}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
