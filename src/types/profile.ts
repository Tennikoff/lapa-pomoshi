export type ProfileDto = {
  userId: string;
  email: string;
  name: string;
  role: string | number;
  age: number | null;
  description: string | null;
  sumRating: number;
  countRating: number;
  photoUrl: string | null;
};