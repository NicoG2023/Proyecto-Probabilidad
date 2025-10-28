export type KcUser = {
  id: string;
  username: string;
  email?: string;
  enabled: boolean;
  // El backend getUser() adjunta esto; en listUsers puede no venir.
  realmRoles?: string[];
};
