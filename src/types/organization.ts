export type LatestAnimalDto = {
  id: string;
  name: string;
  photoUrl: string | null;
};

export type OrganizationProfileDto = {
  userId: string;
  email: string;
  name: string;
  role: string;

  phone: string | null;
  website: string | null;
  donationDetails: string | null;

  description: string | null;
  location: string | null;
  photoUrl: string | null;

  countTasks: number;
  constantNeeds: string[];

  latestComments: unknown[];
  latestPost: unknown | null;
  latestAnimals: LatestAnimalDto[];

  sumRating: number;
  countRating: number;
  averageRating: number;
  createdAt: string;
};