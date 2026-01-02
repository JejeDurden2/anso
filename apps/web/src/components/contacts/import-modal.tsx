import {
  Modal,
  ModalHeader,
  ModalContent,
  ModalFooter,
  Button,
  Card,
  Badge,
} from '@anso/ui';
import { Upload, FileText, AlertCircle, CheckCircle, X, Loader2 } from 'lucide-react';
import { useState, useRef } from 'react';

import { useImportContacts, type ImportResult } from '@/services/contacts';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspaceId: string;
}

type ImportStep = 'upload' | 'preview' | 'result';

interface PreviewData {
  headers: string[];
  rows: string[][];
  totalRows: number;
}

export function ImportModal({
  isOpen,
  onClose,
  workspaceId,
}: ImportModalProps): JSX.Element {
  const [step, setStep] = useState<ImportStep>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const importMutation = useImportContacts(workspaceId);

  const resetState = (): void => {
    setStep('upload');
    setFile(null);
    setPreview(null);
    setResult(null);
    setParseError(null);
    importMutation.reset();
  };

  const handleClose = (): void => {
    resetState();
    onClose();
  };

  const parseCSVPreview = (content: string): PreviewData | null => {
    const lines = content.split(/\r?\n/).filter((line) => line.trim());
    if (lines.length < 1) return null;

    const parseCSVLine = (line: string): string[] => {
      const result: string[] = [];
      let current = '';
      let inQuotes = false;

      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if ((char === ',' || char === ';') && !inQuotes) {
          result.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current.trim());
      return result;
    };

    const headers = parseCSVLine(lines[0]);
    const rows = lines.slice(1, 6).map((line) => parseCSVLine(line)); // Preview first 5 rows
    const totalRows = lines.length - 1;

    return { headers, rows, totalRows };
  };

  const handleFile = (selectedFile: File): void => {
    if (!selectedFile.name.toLowerCase().endsWith('.csv')) {
      setParseError('Seuls les fichiers CSV sont acceptés');
      return;
    }

    if (selectedFile.size > 5 * 1024 * 1024) {
      setParseError('Le fichier ne doit pas dépasser 5 Mo');
      return;
    }

    setFile(selectedFile);
    setParseError(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const previewData = parseCSVPreview(content);
      if (previewData) {
        setPreview(previewData);
        setStep('preview');
      } else {
        setParseError('Le fichier CSV est vide ou invalide');
      }
    };
    reader.onerror = () => {
      setParseError('Erreur lors de la lecture du fichier');
    };
    reader.readAsText(selectedFile);
  };

  const handleDrop = (e: React.DragEvent): void => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFile(droppedFile);
    }
  };

  const handleDragOver = (e: React.DragEvent): void => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent): void => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      handleFile(selectedFile);
    }
  };

  const handleImport = async (): Promise<void> => {
    if (!file) return;

    try {
      const importResult = await importMutation.mutateAsync(file);
      setResult(importResult);
      setStep('result');
    } catch {
      // Error handled by mutation
    }
  };

  const renderUploadStep = (): JSX.Element => (
    <ModalContent>
      <div
        className={`relative rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
          isDragging
            ? 'border-brand-500 bg-brand-50'
            : 'border-slate-300 hover:border-slate-400'
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleFileInput}
          className="hidden"
        />

        <div className="flex flex-col items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
            <Upload className="h-7 w-7 text-slate-500" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-900">
              Glissez-déposez votre fichier CSV ici
            </p>
            <p className="mt-1 text-sm text-slate-500">ou</p>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
          >
            Parcourir les fichiers
          </Button>
          <p className="text-xs text-slate-400">Maximum 5 Mo</p>
        </div>
      </div>

      {parseError && (
        <div className="mt-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          {parseError}
        </div>
      )}

      <div className="mt-6 rounded-lg bg-slate-50 p-4">
        <h4 className="text-sm font-medium text-slate-900">Format attendu</h4>
        <p className="mt-1 text-sm text-slate-600">
          Votre fichier CSV doit contenir une colonne &quot;nom&quot; ou &quot;name&quot;.
          Les colonnes optionnelles sont : email, téléphone, entreprise, notes, tags.
        </p>
        <div className="mt-3 overflow-x-auto">
          <code className="block whitespace-nowrap rounded bg-slate-200 px-2 py-1 text-xs">
            nom,email,telephone,entreprise,tags
            <br />
            Jean Dupont,jean@exemple.fr,0612345678,Acme,client
          </code>
        </div>
      </div>
    </ModalContent>
  );

  const renderPreviewStep = (): JSX.Element => (
    <ModalContent>
      {file && (
        <div className="mb-4 flex items-center justify-between rounded-lg bg-slate-50 p-3">
          <div className="flex items-center gap-3">
            <FileText className="h-5 w-5 text-slate-500" />
            <div>
              <p className="text-sm font-medium text-slate-900">{file.name}</p>
              <p className="text-xs text-slate-500">
                {preview?.totalRows} ligne{(preview?.totalRows ?? 0) > 1 ? 's' : ''} à importer
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={resetState}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {preview && (
        <div className="overflow-hidden rounded-lg border border-slate-200">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50">
                  {preview.headers.map((header, i) => (
                    <th
                      key={i}
                      className="whitespace-nowrap px-4 py-2 text-left font-medium text-slate-700"
                    >
                      {header || <span className="text-slate-400">(vide)</span>}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.rows.map((row, i) => (
                  <tr key={i} className="border-t border-slate-100">
                    {row.map((cell, j) => (
                      <td key={j} className="whitespace-nowrap px-4 py-2 text-slate-600">
                        {cell || <span className="text-slate-300">—</span>}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {preview.totalRows > 5 && (
            <div className="border-t border-slate-200 bg-slate-50 px-4 py-2 text-center text-xs text-slate-500">
              Et {preview.totalRows - 5} ligne{preview.totalRows - 5 > 1 ? 's' : ''} de plus...
            </div>
          )}
        </div>
      )}

      {importMutation.isError && (
        <div className="mt-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          {importMutation.error instanceof Error
            ? importMutation.error.message
            : "Une erreur est survenue lors de l'import"}
        </div>
      )}
    </ModalContent>
  );

  const renderResultStep = (): JSX.Element => (
    <ModalContent>
      {result && (
        <div className="space-y-4">
          {/* Summary */}
          <div className="grid gap-4 sm:grid-cols-2">
            <Card className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">
                  {result.imported.length}
                </p>
                <p className="text-sm text-slate-500">contacts importés</p>
              </div>
            </Card>

            {result.errors.length > 0 && (
              <Card className="flex items-center gap-3 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">
                    {result.errors.length}
                  </p>
                  <p className="text-sm text-slate-500">erreurs</p>
                </div>
              </Card>
            )}
          </div>

          {/* Success message */}
          {result.imported.length > 0 && result.errors.length === 0 && (
            <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
              <CheckCircle className="h-4 w-4 flex-shrink-0" />
              Tous les contacts ont été importés avec succès !
            </div>
          )}

          {/* Errors list */}
          {result.errors.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-slate-900">
                Lignes en erreur
              </h4>
              <div className="max-h-48 space-y-2 overflow-y-auto">
                {result.errors.slice(0, 10).map((error, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-2 rounded-lg border border-red-100 bg-red-50 p-2 text-sm"
                  >
                    <Badge variant="destructive" className="shrink-0">
                      Ligne {error.row}
                    </Badge>
                    <span className="text-red-700">{error.error}</span>
                  </div>
                ))}
                {result.errors.length > 10 && (
                  <p className="text-sm text-slate-500">
                    Et {result.errors.length - 10} erreur{result.errors.length - 10 > 1 ? 's' : ''} de plus...
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </ModalContent>
  );

  return (
    <Modal isOpen={isOpen} onClose={handleClose} className="sm:max-w-xl">
      <ModalHeader onClose={handleClose}>
        {step === 'upload' && 'Importer des contacts'}
        {step === 'preview' && 'Aperçu de l\'import'}
        {step === 'result' && 'Résultat de l\'import'}
      </ModalHeader>

      {step === 'upload' && renderUploadStep()}
      {step === 'preview' && renderPreviewStep()}
      {step === 'result' && renderResultStep()}

      <ModalFooter>
        {step === 'upload' && (
          <Button type="button" variant="outline" onClick={handleClose}>
            Annuler
          </Button>
        )}

        {step === 'preview' && (
          <>
            <Button type="button" variant="outline" onClick={resetState}>
              Changer de fichier
            </Button>
            <Button
              type="button"
              onClick={handleImport}
              disabled={importMutation.isPending}
            >
              {importMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Import en cours...
                </>
              ) : (
                <>Importer {preview?.totalRows} contact{(preview?.totalRows ?? 0) > 1 ? 's' : ''}</>
              )}
            </Button>
          </>
        )}

        {step === 'result' && (
          <>
            {result && result.errors.length > 0 && result.imported.length < result.total && (
              <Button type="button" variant="outline" onClick={resetState}>
                Réessayer
              </Button>
            )}
            <Button type="button" onClick={handleClose}>
              Terminer
            </Button>
          </>
        )}
      </ModalFooter>
    </Modal>
  );
}
