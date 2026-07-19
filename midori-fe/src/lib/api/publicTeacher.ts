import { api } from "./client";

export interface PublicTeacherCertificateResponse {
  id: string;
  title: string;
  issuer: string;
  imageUrl: string;
}

export interface PublicTeacherResponse {
  id: string;
  fullName: string;
  avatarUrl: string;
  professionalTitle: string;
  teachingLevels: string;
  specializations: string;
  yearsOfExperience: number;
  shortBiography: string;
  certificates: PublicTeacherCertificateResponse[];
}

export const publicTeacherApi = {
  getActiveTeachers: () => api.get<PublicTeacherResponse[]>("/api/public/teachers"),
  getTeacherDetail: (id: string) => api.get<PublicTeacherResponse>(`/api/public/teachers/${id}`),
};
