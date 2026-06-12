import { api } from "./client";

export interface TeacherCertificate {
  id: number | string;
  title: string;
  issuer: string;
  issuedDate?: string | null;
  certificateUrl?: string | null;
  imageUrl?: string | null;
  description?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateCertificateRequest {
  title: string;
  issuer: string;
  certificateUrl?: string | null;
  imageUrl?: string | null;
  description?: string | null;
}

export interface UpdateCertificateRequest {
  title?: string;
  issuer?: string;
  certificateUrl?: string | null;
  imageUrl?: string | null;
  description?: string | null;
}

export const teacherCertificatesApi = {
  listCertificates: () =>
    api.get<TeacherCertificate[]>("/teacher/certificates"),

  getCertificate: (id: number | string) =>
    api.get<TeacherCertificate>(`/teacher/certificates/${id}`),

  createCertificate: (data: CreateCertificateRequest) =>
    api.post<TeacherCertificate>("/teacher/certificates", data),

  updateCertificate: (id: number | string, data: UpdateCertificateRequest) =>
    api.put<TeacherCertificate>(`/teacher/certificates/${id}`, data),

  deleteCertificate: (id: number | string) =>
    api.delete<void>(`/teacher/certificates/${id}`),
};
