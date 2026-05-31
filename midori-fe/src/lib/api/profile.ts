import { api } from "./client";

export interface ProfileResponse {
  id: string;
  userId: string;
  displayName: string;
  avatarUrl?: string;
  bio?: string;
  phone?: string;
  location?: string;
  dateOfBirth?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface UpdateProfileRequest {
  displayName?: string;
  avatarUrl?: string;
  bio?: string;
  phone?: string;
  location?: string;
  dateOfBirth?: string;
}

export const profileApi = {
  getMyProfile: () =>
    api.get<ProfileResponse>("/profiles/me"),

  updateMyProfile: (data: UpdateProfileRequest) =>
    api.put<ProfileResponse>("/profiles/me", data),
};
