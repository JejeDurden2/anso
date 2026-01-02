import { Button, Input, Card, Badge, Avatar } from '@anso/ui';
import { Plus, Search, Upload, X, Loader2 } from 'lucide-react';
import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';


import { ContactModal } from '@/components/contacts/contact-modal';
import { ImportModal } from '@/components/contacts/import-modal';
import { useCurrentWorkspace } from '@/hooks/use-workspace';
import { useContacts, useContactTags, type ContactFilters } from '@/services/contacts';

export function ContactsPage(): JSX.Element {
  const { workspaceId, isLoading: isWorkspaceLoading } = useCurrentWorkspace();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  const filters: ContactFilters = useMemo(
    () => ({
      search: searchQuery || undefined,
      tags: selectedTags.length > 0 ? selectedTags : undefined,
    }),
    [searchQuery, selectedTags]
  );

  const { data: contactsData, isLoading: isContactsLoading } = useContacts(workspaceId, filters);
  const { data: allTags = [] } = useContactTags(workspaceId);

  const contacts = contactsData?.data || [];
  const pagination = contactsData?.pagination;
  const isLoading = isWorkspaceLoading || isContactsLoading;

  const handleTagClick = (tag: string): void => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const clearFilters = (): void => {
    setSearchQuery('');
    setSelectedTags([]);
  };

  const hasActiveFilters = searchQuery || selectedTags.length > 0;

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">Contacts</h1>
          <p className="mt-1 text-sm text-slate-600 sm:text-base">
            {pagination?.total ?? 0} contact{(pagination?.total ?? 0) !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex gap-2 sm:gap-3">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 sm:flex-none sm:size-default"
            onClick={() => setIsImportModalOpen(true)}
          >
            <Upload className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Importer</span>
            <span className="sm:hidden">Import</span>
          </Button>
          <Button size="sm" className="flex-1 sm:flex-none sm:size-default" onClick={() => setIsModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Nouveau contact</span>
            <span className="sm:hidden">Nouveau</span>
          </Button>
        </div>
      </div>

      {/* Search and filters */}
      <div className="mt-6 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            type="search"
            placeholder="Rechercher par nom, email ou entreprise..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Tags filter */}
        {allTags.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-slate-700">Filtrer par tags :</span>
            {allTags.map((tag) => (
              <Badge
                key={tag}
                variant={selectedTags.includes(tag) ? 'default' : 'secondary'}
                className="cursor-pointer"
                onClick={() => handleTagClick(tag)}
              >
                {tag}
                {selectedTags.includes(tag) && <X className="ml-1 h-3 w-3" />}
              </Badge>
            ))}
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                Effacer les filtres
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Contacts list */}
      <div className="mt-6">
        {isLoading ? (
          <Card className="flex items-center justify-center p-12">
            <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
          </Card>
        ) : contacts.length === 0 ? (
          <Card className="p-12 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
              <Search className="h-6 w-6 text-slate-400" />
            </div>
            <h3 className="mt-4 text-lg font-medium text-slate-900">Aucun contact</h3>
            <p className="mt-2 text-slate-600">
              {hasActiveFilters
                ? 'Aucun contact ne correspond à vos filtres.'
                : 'Commencez par ajouter votre premier contact.'}
            </p>
            {hasActiveFilters ? (
              <Button variant="outline" className="mt-4" onClick={clearFilters}>
                Effacer les filtres
              </Button>
            ) : (
              <Button className="mt-4" onClick={() => setIsModalOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Ajouter un contact
              </Button>
            )}
          </Card>
        ) : (
          <>
            {/* Desktop table view */}
            <Card className="hidden sm:block">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500 lg:px-6">
                        Nom
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500 lg:px-6">
                        Email
                      </th>
                      <th className="hidden px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500 md:table-cell lg:px-6">
                        Entreprise
                      </th>
                      <th className="hidden px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500 lg:table-cell lg:px-6">
                        Tags
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {contacts.map((contact) => (
                      <tr key={contact.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-4 lg:px-6">
                          <Link
                            to={`/app/contacts/${contact.id}`}
                            className="flex items-center gap-3"
                          >
                            <Avatar name={contact.name} size="sm" />
                            <span className="font-medium text-slate-900">{contact.name}</span>
                          </Link>
                        </td>
                        <td className="px-4 py-4 text-slate-600 lg:px-6">{contact.email || '—'}</td>
                        <td className="hidden px-4 py-4 text-slate-600 md:table-cell lg:px-6">{contact.company || '—'}</td>
                        <td className="hidden px-4 py-4 lg:table-cell lg:px-6">
                          <div className="flex flex-wrap gap-1">
                            {contact.tags.slice(0, 3).map((tag) => (
                              <Badge
                                key={tag}
                                variant="secondary"
                                className="cursor-pointer"
                                onClick={(e) => {
                                  e.preventDefault();
                                  handleTagClick(tag);
                                }}
                              >
                                {tag}
                              </Badge>
                            ))}
                            {contact.tags.length > 3 && (
                              <Badge variant="secondary">+{contact.tags.length - 3}</Badge>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination && pagination.totalPages > 1 && (
                <div className="border-t border-slate-200 px-4 py-4 lg:px-6">
                  <div className="flex items-center justify-between text-sm text-slate-600">
                    <span>
                      Page {pagination.page} sur {pagination.totalPages} ({pagination.total} contacts)
                    </span>
                  </div>
                </div>
              )}
            </Card>

            {/* Mobile card view */}
            <div className="space-y-3 sm:hidden">
              {contacts.map((contact) => (
                <Link key={contact.id} to={`/app/contacts/${contact.id}`}>
                  <Card className="p-4 transition-all hover:shadow-md active:scale-[0.98]">
                    <div className="flex items-center gap-3">
                      <Avatar name={contact.name} size="md" />
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-slate-900 truncate">{contact.name}</p>
                        {contact.email && (
                          <p className="text-sm text-slate-500 truncate">{contact.email}</p>
                        )}
                        {contact.company && (
                          <p className="text-sm text-slate-400 truncate">{contact.company}</p>
                        )}
                      </div>
                    </div>
                    {contact.tags.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1">
                        {contact.tags.slice(0, 2).map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {contact.tags.length > 2 && (
                          <Badge variant="secondary" className="text-xs">+{contact.tags.length - 2}</Badge>
                        )}
                      </div>
                    )}
                  </Card>
                </Link>
              ))}

              {/* Mobile Pagination */}
              {pagination && pagination.totalPages > 1 && (
                <div className="pt-2 text-center text-sm text-slate-600">
                  Page {pagination.page} sur {pagination.totalPages}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Create/Edit Modal */}
      <ContactModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        workspaceId={workspaceId}
      />

      {/* Import Modal */}
      <ImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        workspaceId={workspaceId}
      />
    </div>
  );
}
