// Enums
export enum Role {
  OWNER = 'OWNER',
  MEMBER = 'MEMBER',
}

export enum Plan {
  FREE = 'FREE',
  SOLO = 'SOLO',
  TEAM = 'TEAM',
}

// Base interfaces
export interface User {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  googleId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Workspace {
  id: string;
  name: string;
  plan: Plan;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkspaceMember {
  id: string;
  workspaceId: string;
  userId: string;
  role: Role;
  user?: User;
  workspace?: Workspace;
}

export interface Contact {
  id: string;
  workspaceId: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  notes: string | null;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Stage {
  id: string;
  workspaceId: string;
  name: string;
  color: string;
  position: number;
}

export interface Deal {
  id: string;
  workspaceId: string;
  contactId: string | null;
  stageId: string;
  title: string;
  value: number | null;
  createdAt: Date;
  updatedAt: Date;
  contact?: Contact;
  stage?: Stage;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Auth types
export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
}

// Create/Update DTOs
export interface CreateContactInput {
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  notes?: string;
  tags?: string[];
}

export interface UpdateContactInput {
  name?: string;
  email?: string;
  phone?: string;
  company?: string;
  notes?: string;
  tags?: string[];
}

export interface CreateDealInput {
  title: string;
  contactId?: string;
  stageId: string;
  value?: number;
}

export interface UpdateDealInput {
  title?: string;
  contactId?: string;
  stageId?: string;
  value?: number;
}

export interface CreateStageInput {
  name: string;
  color?: string;
  position: number;
}

export interface UpdateStageInput {
  name?: string;
  color?: string;
  position?: number;
}

export interface CreateWorkspaceInput {
  name: string;
}

export interface UpdateWorkspaceInput {
  name?: string;
}

// Stage reorder
export interface ReorderStagesInput {
  stages: { id: string; position: number }[];
}
