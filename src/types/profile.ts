export type ProfileDto = {
  userId: string;
  email: string;
  name: string;
  role: number; // 1 volunteer, 2 org
  age: number | null;
  description: string | null;
  sumRating: number;
  countRating: number;
  photoUrl: string | null;
};