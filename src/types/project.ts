import { ProjectData, ValidationIssue } from "./minimax";
import { ExtendedReferenceItem } from "./reference";

export type { ExtendedReferenceItem };

export interface ProjectCompatibility {
  minAppVersion: string;
  exportedWith: string;
  migrationRequired: boolean;
}

export interface H3ProjectExport {
  schemaVersion: string;
  appName: string;
  appVersion: string;
  exportedAt: string;
  projectId: string;
  projectName: string;
  lastModifiedAt: string;
  compatibility: ProjectCompatibility;
  project: ProjectData;
  extendedReferences?: ExtendedReferenceItem[];
}

export interface MigrationSummary {
  fromVersion: string;
  toVersion: string;
  migrationApplied: boolean;
  notes: string[];
  unrecoverableFields?: string[];
}

export interface ImportAnalysisResult {
  isValidJson: boolean;
  isSchemaCompatible: boolean;
  schemaVersion: string;
  appVersion: string;
  projectId: string;
  projectName: string;
  exportedAt: string;
  migrationRequired: boolean;
  migrationSummary?: MigrationSummary;
  projectData?: ProjectData;
  extendedReferences?: ExtendedReferenceItem[];
  missingMediaCount: number;
  totalReferencesCount: number;
  validationIssues: ValidationIssue[];
  h3Score: number;
  blockingErrors: string[];
  warnings: string[];
}
