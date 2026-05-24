export type ProfileDto = {
  userId: string;
  email: string;
  name: string;

  phone?: string | null;
  website?: string | null;
  donationDetails?: string | null;
  constantNeeds?: string[];
  latestPost?: unknown | null;

  role: string | number;

  age: number | null;
  description: string | null;
  location: string | null;
  photoUrl: string | null;

  countTasks: number;

  competencies: string[];
  preferences: string[];
  availabilities: string[];

  latestComments: unknown[];
  latestAnimals: unknown[];

  sumRating: number;
  countRating: number;
  averageRating: number;

  createdAt: string;
};