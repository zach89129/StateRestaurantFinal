export interface ManufacturerDetails {
  specifications: string;
  care: string;
  warranty: string;
  certifications: string;
  materials: string;
  sources: string[];
}

export interface ManufacturerDetailsResponse {
  success: boolean;
  error?: string;
  details?: ManufacturerDetails;
  cached?: boolean;
}
