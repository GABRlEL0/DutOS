// Roles del sistema
export type UserRole = 'admin' | 'manager' | 'creative' | 'production' | 'client';

// Estados de contenido
export type PostStatus =
  | 'draft'
  | 'pending_approval'
  | 'rejected'
  | 'approved'
  | 'finished'
  | 'published';

// Tipos de tarea
export type PostType = 'flow' | 'pinned';

// Interfaz de Usuario
export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  status: 'active' | 'inactive';
  assigned_client_id?: string; // Para rol 'client'
  createdAt: Date;
  updatedAt: Date;
}

// Links de Google Drive
export interface DriveLinks {
  root: string;
  strategy_00: string;
  branding_01: string;
  raw_02: string;
  raw_03: string;
  final_04: string;
  material_05: string;
}

// Redes Sociales del Cliente
export interface SocialLinks {
  instagram?: string;
  facebook?: string;
  tiktok?: string;
  youtube?: string;
  linkedin?: string;
}

// Interfaz de Cliente
export interface Client {
  id: string;
  name: string;
  logo?: string;
  status: 'active' | 'inactive';
  weekly_capacity: number;
  drive_links: DriveLinks;
  strategy_pillars: string[];
  createdAt: Date;
  updatedAt: Date;
  brand_kit?: BrandKit;
  // Nuevos campos
  contact_name?: string;
  contact_whatsapp?: string;
  address?: string;
  website?: string;
  social_links?: SocialLinks;
  observations?: string;
}

// Brand Kit
export interface BrandKit {
  colors: BrandColor[];
  typography: BrandTypography[];
  assets: BrandAsset[]; // Logos, icons, patterns
  voice_tone: string; // Tono de voz de la marca
}

export interface BrandColor {
  id: string;
  name: string; // Primary, Secondary, Accent
  hex: string;
}

export interface BrandTypography {
  id: string;
  family: string;
  usage: 'header' | 'body' | 'accent'; // Header, Body, etc
  url?: string; // Google Fonts URL
}

export interface BrandAsset {
  id: string;
  name: string;
  url: string;
  type: 'logo' | 'icon' | 'pattern' | 'image';
}

// Feedback
export interface FeedbackEntry {
  user: string;
  comment: string;
  timestamp: Date;
}

// Post/Contenido
export interface Post {
  id: string;
  client_id: string;
  type: PostType;
  pinned_date: Date | null;
  priority_index: number;
  status: PostStatus;
  pillar: string;
  content: {
    script: string;
    caption: string;
    asset_link: string;
  };
  feedback_history: FeedbackEntry[];
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

// Utilidad para cálculo de fechas visuales
export interface SlotResult {
  date: Date;
  isOverloaded: boolean;
}

// Estados de solicitudes de contenido
export type ContentRequestStatus = 'pending' | 'approved' | 'in_progress' | 'converted' | 'rejected';
export type ContentRequestPriority = 'low' | 'normal' | 'urgent';

// Solicitud de contenido fuera de agenda
export interface ContentRequest {
  id: string;
  client_id: string;
  requested_by: string; // user id
  requested_by_name: string; // user name for display/traceability
  title: string;
  description: string;
  priority: ContentRequestPriority;
  preferred_date?: Date | null;
  attachments: string[]; // Drive links
  status: ContentRequestStatus;
  converted_post_id?: string; // Si se convirtió en post
  response?: string; // Respuesta del manager
  responded_by?: string; // User id que respondió
  respondedAt?: Date; // Fecha de respuesta (para medir tiempos)
  createdAt: Date;
  updatedAt: Date;
}

// Estadísticas de solicitudes (calculadas)
export interface ContentRequestStats {
  total: number;
  pending: number;
  approved: number;
  inProgress: number;
  converted: number;
  rejected: number;
  avgResponseTimeHours: number | null;
  fulfillmentRate: number; // % de solicitudes convertidas a post
}

// Comentarios en posts
export interface PostComment {
  id: string;
  post_id: string;
  user_id: string;
  user_name: string;
  user_role: UserRole;
  message: string;
  mentions?: string[]; // User IDs mencionados con @
  createdAt: Date;
}

// Templates de contenido reutilizables
export interface ContentTemplate {
  id: string;
  client_id?: string; // null = template global
  name: string;
  description: string;
  pillar_suggestion?: string;
  script_template: string;
  caption_template: string;
  tags: string[];
  usage_count: number;
  created_by: string;
  createdAt: Date;
  updatedAt: Date;
}

// Activity log for client user actions (traceability)
export type ClientActivityType =
  | 'content_request_created'
  | 'post_approved'
  | 'post_rejected'
  | 'comment_added';

export interface ClientActivityLog {
  id: string;
  client_id: string;
  user_id: string;
  user_name: string;
  action: ClientActivityType;
  description: string;
  metadata?: Record<string, string>; // e.g. { post_id, request_id }
  createdAt: Date;
}
