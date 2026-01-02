import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Trash2, User, Tag } from 'lucide-react';

import {
  Modal,
  ModalHeader,
  ModalContent,
  ModalFooter,
  Button,
  Input,
  Label,
} from '@anso/ui';
import type { Stage, Contact } from '@anso/types';

import { useCreateDeal, useUpdateDeal, useDeleteDeal, type DealWithRelations } from '@/services/deals';
import { useContacts } from '@/services/contacts';

const dealSchema = z.object({
  title: z
    .string()
    .min(1, 'Le titre est requis')
    .max(100, 'Le titre ne peut pas dépasser 100 caractères'),
  value: z.string().optional(),
  stageId: z.string().min(1, 'L\'étape est requise'),
  contactId: z.string().optional(),
});

type DealFormData = z.infer<typeof dealSchema>;

interface DealModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspaceId: string;
  stages: Stage[];
  deal?: DealWithRelations;
  defaultStageId?: string;
}

export function DealModal({
  isOpen,
  onClose,
  workspaceId,
  stages,
  deal,
  defaultStageId,
}: DealModalProps): JSX.Element {
  const isEditing = !!deal;

  const createMutation = useCreateDeal(workspaceId);
  const updateMutation = useUpdateDeal(workspaceId);
  const deleteMutation = useDeleteDeal(workspaceId);

  const { data: contactsData } = useContacts(workspaceId);
  const contactsList = contactsData?.data || [];

  const {
    register,
    handleSubmit,
    reset,
    control,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<DealFormData>({
    resolver: zodResolver(dealSchema),
    defaultValues: {
      title: '',
      value: '',
      stageId: defaultStageId || stages[0]?.id || '',
      contactId: '',
    },
  });

  const selectedContactId = watch('contactId');
  const selectedContact = contactsList.find((c: Contact) => c.id === selectedContactId);

  useEffect(() => {
    if (isOpen) {
      if (deal) {
        reset({
          title: deal.title,
          value: deal.value?.toString() || '',
          stageId: deal.stageId,
          contactId: deal.contactId || '',
        });
      } else {
        reset({
          title: '',
          value: '',
          stageId: defaultStageId || stages[0]?.id || '',
          contactId: '',
        });
      }
    }
  }, [isOpen, deal, defaultStageId, stages, reset]);

  const onSubmit = async (data: DealFormData): Promise<void> => {
    const parsedValue = data.value ? parseFloat(data.value) : undefined;
    const payload = {
      title: data.title,
      stageId: data.stageId,
      value: parsedValue && !isNaN(parsedValue) ? parsedValue : undefined,
      contactId: data.contactId || undefined,
    };

    try {
      if (isEditing) {
        await updateMutation.mutateAsync({
          dealId: deal.id,
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

  const handleDelete = async (): Promise<void> => {
    if (!deal || !window.confirm('Êtes-vous sûr de vouloir supprimer cette opportunité ?')) {
      return;
    }

    try {
      await deleteMutation.mutateAsync(deal.id);
      onClose();
    } catch {
      // Error is handled by the mutation
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending || deleteMutation.isPending;
  const error = createMutation.error || updateMutation.error || deleteMutation.error;

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <ModalHeader onClose={onClose}>
          {isEditing ? 'Modifier l\'opportunité' : 'Nouvelle opportunité'}
        </ModalHeader>

        <ModalContent className="space-y-4">
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
              {error instanceof Error ? error.message : 'Une erreur est survenue'}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="title">
              Titre <span className="text-red-500">*</span>
            </Label>
            <Input
              id="title"
              placeholder="Ex: Contrat maintenance annuel"
              {...register('title')}
              aria-invalid={!!errors.title}
            />
            {errors.title && (
              <p className="text-sm text-red-500">{errors.title.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="value">Montant (€)</Label>
            <Input
              id="value"
              type="number"
              min="0"
              step="0.01"
              placeholder="10000"
              {...register('value')}
              aria-invalid={!!errors.value}
            />
            {errors.value && (
              <p className="text-sm text-red-500">{errors.value.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="stageId">
              Étape <span className="text-red-500">*</span>
            </Label>
            <Controller
              name="stageId"
              control={control}
              render={({ field }) => (
                <div className="flex flex-wrap gap-2">
                  {stages.map((stage) => (
                    <button
                      key={stage.id}
                      type="button"
                      onClick={() => field.onChange(stage.id)}
                      className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-colors ${
                        field.value === stage.id
                          ? 'border-transparent bg-brand-100 text-brand-700'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      <div
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: stage.color }}
                      />
                      {stage.name}
                    </button>
                  ))}
                </div>
              )}
            />
            {errors.stageId && (
              <p className="text-sm text-red-500">{errors.stageId.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="contactId">Contact associé</Label>
            {selectedContact ? (
              <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-brand-600">
                  <User className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-slate-900">{selectedContact.name}</p>
                  {selectedContact.company && (
                    <p className="truncate text-sm text-slate-500">{selectedContact.company}</p>
                  )}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setValue('contactId', '')}
                >
                  Retirer
                </Button>
              </div>
            ) : (
              <select
                id="contactId"
                className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                {...register('contactId')}
              >
                <option value="">Aucun contact</option>
                {contactsList.map((contact: Contact) => (
                  <option key={contact.id} value={contact.id}>
                    {contact.name}
                    {contact.company ? ` (${contact.company})` : ''}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Show deal's associated contact tags if editing */}
          {isEditing && deal?.contact && (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Tag className="h-4 w-4" />
                <span>Contact :</span>
                <span className="font-medium text-slate-900">{deal.contact.name}</span>
              </div>
            </div>
          )}
        </ModalContent>

        <ModalFooter>
          {isEditing && (
            <Button
              type="button"
              variant="ghost"
              onClick={handleDelete}
              disabled={isPending}
              className="mr-auto text-red-500 hover:bg-red-50 hover:text-red-600"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Supprimer
            </Button>
          )}
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
