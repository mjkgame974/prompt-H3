export type CanonicalReferenceRole =
  | "product"
  | "character"
  | "mood"
  | "environment"
  | "location"
  | "logo"
  | "costume"
  | "art_direction"
  | "other"
  | "ambiance"
  | "personnage"
  | "produit"
  | "decor"
  | "style"
  | "autre";

export interface ExtendedReferenceItem {
  id: string;
  role: CanonicalReferenceRole;
  label: string;
  sourceType: "image" | "video" | "audio" | "3d_model" | "text";
  fileName?: string;
  mediaAvailable: boolean;
  mediaHash?: string;
  preserve: string[];
  notes?: string;
  url?: string;
  previewUrl?: string;
  definesText?: string;
  preserveText?: string;
}

export function mapRoleToFrenchLabel(role: CanonicalReferenceRole): string {
  switch (role) {
    case "product":
    case "produit":
      return "Produit";
    case "character":
    case "personnage":
      return "Personnage";
    case "mood":
    case "ambiance":
    case "style":
      return "Ambiance / Mood";
    case "environment":
    case "decor":
      return "Décor";
    case "location":
      return "Lieu / Emplacement";
    case "logo":
      return "Logo / Marque";
    case "costume":
      return "Costume / Tenue";
    case "art_direction":
      return "Direction Artistique";
    case "other":
    case "autre":
    default:
      return "Autre";
  }
}
