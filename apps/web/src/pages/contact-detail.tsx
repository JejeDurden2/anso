import { Button, Card, CardContent, CardHeader, Avatar, Badge } from '@anso/ui';
import { ArrowLeft, Mail, Phone, Building, Edit, Trash2, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';


import { ContactModal } from '@/components/contacts/contact-modal';
import { useCurrentWorkspace } from '@/hooks/use-workspace';
import { useContact, useDeleteContact } from '@/services/contacts';

export function ContactDetailPage(): JSX.Element {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { workspaceId, isLoading: isWorkspaceLoading } = useCurrentWorkspace();

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const { data: contact, isLoading: isContactLoading } = useContact(
    workspaceId,
    id || ''
  );
  const deleteMutation = useDeleteContact(workspaceId);

  const isLoading = isWorkspaceLoading || isContactLoading;

  const handleDelete = async (): Promise<void> => {
    if (!id || !window.confirm('Êtes-vous sûr de vouloir supprimer ce contact ?')) {
      return;
    }

    setIsDeleting(true);
    try {
      await deleteMutation.mutateAsync(id);
      navigate('/app/contacts');
    } catch {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
      </div>
    );
  }

  if (!contact) {
    return (
      <div className="p-8">
        <Link
          to="/app/contacts"
          className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour aux contacts
        </Link>
        <Card className="mt-6 p-12 text-center">
          <h2 className="text-lg font-medium text-slate-900">Contact introuvable</h2>
          <p className="mt-2 text-slate-600">
            Ce contact n&apos;existe pas ou a été supprimé.
          </p>
          <Button className="mt-4" onClick={() => navigate('/app/contacts')}>
            Retour à la liste
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Back link */}
      <Link
        to="/app/contacts"
        className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour aux contacts
      </Link>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Main info */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex items-center gap-4">
                <Avatar name={contact.name} size="xl" />
                <div>
                  <h1 className="text-xl font-bold text-slate-900">{contact.name}</h1>
                  {contact.company && (
                    <p className="text-slate-600">{contact.company}</p>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditModalOpen(true)}
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Modifier
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDelete}
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4 text-red-500" />
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {contact.email && (
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-slate-400" />
                    <a
                      href={`mailto:${contact.email}`}
                      className="text-brand-600 hover:underline"
                    >
                      {contact.email}
                    </a>
                  </div>
                )}
                {contact.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="h-5 w-5 text-slate-400" />
                    <a
                      href={`tel:${contact.phone}`}
                      className="text-brand-600 hover:underline"
                    >
                      {contact.phone}
                    </a>
                  </div>
                )}
                {contact.company && (
                  <div className="flex items-center gap-3">
                    <Building className="h-5 w-5 text-slate-400" />
                    <span className="text-slate-900">{contact.company}</span>
                  </div>
                )}
              </div>

              {contact.tags.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-sm font-medium text-slate-700">Tags</h3>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {contact.tags.map((tag) => (
                      <Badge key={tag}>{tag}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {contact.notes && (
                <div className="mt-6">
                  <h3 className="text-sm font-medium text-slate-700">Notes</h3>
                  <p className="mt-2 whitespace-pre-wrap text-slate-600">{contact.notes}</p>
                </div>
              )}

              <div className="mt-6 border-t border-slate-200 pt-4">
                <p className="text-xs text-slate-400">
                  Créé le{' '}
                  {new Date(contact.createdAt).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - Deals */}
        <div>
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold text-slate-900">Opportunités</h2>
            </CardHeader>
            <CardContent>
              <p className="text-center text-slate-500">Aucune opportunité</p>
              <Button variant="outline" className="mt-4 w-full">
                Créer une opportunité
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Modal */}
      <ContactModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        workspaceId={workspaceId}
        contact={contact}
      />
    </div>
  );
}
