export type ProfileDto = {
  userId: string;
  email: string;
  name: string;

  phone?: string | null;
  website?: string | null;
  donationDetails?: string | null;
  constantNeeds?: string[];
  latestPost?: unknown | null;

  // по факту приходит строкой: "Организация" | "Волонтёр"
  // но на всякий случай оставим number/string, т.к. в JWT встречается "2"
  role: string | number;

  age: number | null;
  description: string | null;
  location: string | null;
  photoUrl: string | null;

  countTasks: number;

  competencies: string[];
  preferences: string[];
  availabilities: string[];

  latestComments: unknown[]; // пока не типизируем, позже по try it out
  latestAnimals: unknown[];  // пока не типизируем, позже по try it out

  sumRating: number;
  countRating: number;
  averageRating: number;

  createdAt: string;
};