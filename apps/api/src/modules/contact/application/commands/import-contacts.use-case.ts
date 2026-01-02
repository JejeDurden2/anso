import { Injectable } from '@nestjs/common';
import * as Papa from 'papaparse';

import { PlanLimitsService } from '@/modules/billing/application/services/plan-limits.service';
import { Result } from '@/shared/domain';
import { PrismaService } from '@/shared/infrastructure/prisma/prisma.service';
import { TracingService } from '@/shared/infrastructure/tracing/tracing.service';

interface ImportContactsCommand {
  workspaceId: string;
  csvContent: string;
}

interface ImportedContact {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  notes: string | null;
  tags: string[];
}

interface ImportError {
  row: number;
  data: Record<string, string>;
  error: string;
}

interface ImportContactsResult {
  imported: ImportedContact[];
  errors: ImportError[];
  total: number;
}

// Map common CSV header variations to our fields
const HEADER_MAPPINGS: Record<string, string> = {
  // Name variations
  nom: 'name',
  name: 'name',
  prenom: 'name',
  prénom: 'name',
  firstname: 'name',
  first_name: 'name',
  lastname: 'name',
  last_name: 'name',
  fullname: 'name',
  full_name: 'name',
  'nom complet': 'name',
  contact: 'name',

  // Email variations
  email: 'email',
  mail: 'email',
  courriel: 'email',
  'e-mail': 'email',
  'adresse email': 'email',
  'email address': 'email',

  // Phone variations
  phone: 'phone',
  telephone: 'phone',
  téléphone: 'phone',
  tel: 'phone',
  tél: 'phone',
  mobile: 'phone',
  portable: 'phone',
  'phone number': 'phone',
  'numéro de téléphone': 'phone',

  // Company variations
  company: 'company',
  entreprise: 'company',
  société: 'company',
  societe: 'company',
  organization: 'company',
  organisation: 'company',
  firm: 'company',

  // Notes variations
  notes: 'notes',
  note: 'notes',
  commentaire: 'notes',
  commentaires: 'notes',
  comment: 'notes',
  comments: 'notes',
  description: 'notes',

  // Tags variations
  tags: 'tags',
  tag: 'tags',
  labels: 'tags',
  label: 'tags',
  categories: 'tags',
  categorie: 'tags',
  catégorie: 'tags',
  catégories: 'tags',
};

@Injectable()
export class ImportContactsUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly planLimitsService: PlanLimitsService,
    private readonly tracing: TracingService
  ) {}

  async execute(command: ImportContactsCommand): Promise<Result<ImportContactsResult>> {
    return this.tracing.withSpan(
      'ImportContactsUseCase.execute',
      async (span) => {
        span.setAttributes({
          'import.workspace_id': command.workspaceId,
          'import.csv_length': command.csvContent.length,
        });

        // Parse CSV
        const parseResult = Papa.parse<Record<string, string>>(command.csvContent, {
          header: true,
          skipEmptyLines: true,
          transformHeader: (header) => header.trim().toLowerCase(),
        });

        if (parseResult.errors.length > 0 && parseResult.data.length === 0) {
          span.setAttributes({ 'import.parse_error': true });
          return Result.fail('Le fichier CSV est invalide ou vide');
        }

        const rows = parseResult.data;
        span.setAttributes({ 'import.total_rows': rows.length });

        if (rows.length === 0) {
          return Result.fail('Le fichier CSV ne contient aucune donnée');
        }

        // Check plan limits
        const limitCheck = await this.planLimitsService.canAddContact(command.workspaceId);
        const remainingSlots = limitCheck.limit
          ? limitCheck.limit - limitCheck.currentCount
          : Infinity;

        span.setAttributes({
          'plan.remaining_slots': remainingSlots === Infinity ? -1 : remainingSlots,
          'plan.current_count': limitCheck.currentCount,
        });

        if (remainingSlots === 0) {
          return Result.fail(
            `Vous avez atteint la limite de ${limitCheck.limit} contacts pour votre plan. Passez à un plan supérieur pour importer des contacts.`
          );
        }

        // Detect column mappings from first row headers
        const headers = Object.keys(rows[0] || {});
        const columnMappings = this.detectColumnMappings(headers);

        span.setAttributes({
          'import.detected_columns': JSON.stringify(columnMappings),
        });

        if (!columnMappings.name) {
          return Result.fail(
            'Impossible de détecter la colonne "Nom". Assurez-vous que votre fichier contient une colonne "nom", "name" ou similaire.'
          );
        }

        // Process rows
        const imported: ImportedContact[] = [];
        const errors: ImportError[] = [];

        for (let i = 0; i < rows.length; i++) {
          const row = rows[i];
          const rowNumber = i + 2; // +2 because of header row and 0-based index

          // Skip if we've reached the limit
          if (imported.length >= remainingSlots) {
            errors.push({
              row: rowNumber,
              data: row,
              error: `Limite du plan atteinte (${limitCheck.limit} contacts)`,
            });
            continue;
          }

          // Extract and validate data
          const name = this.extractValue(row, columnMappings.name);
          const email = this.extractValue(row, columnMappings.email);
          const phone = this.extractValue(row, columnMappings.phone);
          const company = this.extractValue(row, columnMappings.company);
          const notes = this.extractValue(row, columnMappings.notes);
          const tagsRaw = this.extractValue(row, columnMappings.tags);

          // Validate name
          if (!name || name.trim().length === 0) {
            errors.push({
              row: rowNumber,
              data: row,
              error: 'Le nom est requis',
            });
            continue;
          }

          // Validate email format if provided
          if (email && !this.isValidEmail(email)) {
            errors.push({
              row: rowNumber,
              data: row,
              error: `Email invalide: ${email}`,
            });
            continue;
          }

          // Parse tags (comma or semicolon separated)
          const tags = tagsRaw
            ? tagsRaw
                .split(/[,;]/)
                .map((t) => t.trim())
                .filter((t) => t.length > 0)
            : [];

          try {
            const contact = await this.prisma.contact.create({
              data: {
                workspaceId: command.workspaceId,
                name: name.trim(),
                email: email?.trim() || null,
                phone: phone?.trim() || null,
                company: company?.trim() || null,
                notes: notes?.trim() || null,
                tags,
              },
            });

            imported.push({
              id: contact.id,
              name: contact.name,
              email: contact.email,
              phone: contact.phone,
              company: contact.company,
              notes: contact.notes,
              tags: contact.tags,
            });
          } catch (error) {
            errors.push({
              row: rowNumber,
              data: row,
              error: error instanceof Error ? error.message : 'Erreur lors de la création',
            });
          }
        }

        span.setAttributes({
          'import.imported_count': imported.length,
          'import.error_count': errors.length,
        });

        return Result.ok({
          imported,
          errors,
          total: rows.length,
        });
      },
      { use_case: 'import_contacts' }
    );
  }

  private detectColumnMappings(
    headers: string[]
  ): Record<string, string | undefined> {
    const mappings: Record<string, string | undefined> = {};

    for (const header of headers) {
      const normalizedHeader = header.toLowerCase().trim();
      const mappedField = HEADER_MAPPINGS[normalizedHeader];

      if (mappedField && !mappings[mappedField]) {
        mappings[mappedField] = header;
      }
    }

    return mappings;
  }

  private extractValue(
    row: Record<string, string>,
    columnName: string | undefined
  ): string | undefined {
    if (!columnName) return undefined;
    return row[columnName];
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}
