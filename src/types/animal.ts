export type Animal = {
  id: string;
  ownerUserId: string;

  // В MVP храним картинку как dataURL (base64) или null
  photoUrl: string | null;

  name: string;
  species: string; // required
  breed: string;
  age: string;

  history: string;
  health: string;
  character: string;
  needs: string;

  createdAt: string;
  updatedAt: string;
};