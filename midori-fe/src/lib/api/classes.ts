import { api } from "./client";

export interface ClassResponse {
  id: string;
  name: string;
  level: string;
  maxStudents: number;
  description: string;
  status: "ACTIVE" | "ARCHIVED";
  teacherId: string;
  teacherName?: string;
  studentCount?: number;
  homeworkCount?: number;
  upcomingExamCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface StudentClassResponse {
  studentId: string;
  fullName: string | null;
  email: string;
  avatar: string | null;
  status: string;
}

export interface CreateClassRequest {
  name: string;
  level: string;
  maxStudents: number;
  description?: string;
}

export interface UpdateClassRequest {
  name: string;
  level: string;
  maxStudents: number;
  description?: string;
}

export const classesApi = {
  // Public/Shared Class APIs
  getAllClasses(status?: string): Promise<ClassResponse[]> {
    const url = status ? `/classes?status=${status}` : "/classes";
    return api.get<ClassResponse[]>(url);
  },

  getClassById(id: string): Promise<ClassResponse> {
    return api.get<ClassResponse>(`/classes/${id}`);
  },

  // Student Class APIs
  getJoinedClasses(status?: string): Promise<ClassResponse[]> {
    const url = status ? `/student/classes?status=${status}` : "/student/classes";
    return api.get<ClassResponse[]>(url);
  },

  getStudentClassDetail(classId: string): Promise<ClassResponse> {
    return api.get<ClassResponse>(`/student/classes/${classId}`);
  },

  getClassHomework(classId: string): Promise<any[]> {
    return api.get<any[]>(`/student/classes/${classId}/homework`);
  },

  getClassExams(classId: string): Promise<any[]> {
    return api.get<any[]>(`/student/classes/${classId}/exams`);
  },

  getClassLessons(classId: string): Promise<any[]> {
    return api.get<any[]>(`/student/classes/${classId}/lessons`);
  },

  // Teacher Class APIs
  createClass(data: CreateClassRequest): Promise<ClassResponse> {
    return api.post<ClassResponse>("/teacher/classes", data);
  },

  updateClass(id: string, data: UpdateClassRequest): Promise<ClassResponse> {
    return api.put<ClassResponse>(`/teacher/classes/${id}`, data);
  },

  archiveClass(id: string): Promise<ClassResponse> {
    return api.put<ClassResponse>(`/teacher/classes/${id}/archive`);
  },

  restoreClass(id: string): Promise<ClassResponse> {
    return api.put<ClassResponse>(`/teacher/classes/${id}/restore`);
  },

  getClassStudents(id: string): Promise<StudentClassResponse[]> {
    return api.get<StudentClassResponse[]>(`/teacher/classes/${id}/students`);
  },

  getExamsByClass(classId: string): Promise<any[]> {
    return api.get<any[]>(`/exams/class/${classId}`);
  },

  getSelectableClasses(): Promise<ClassResponse[]> {
    return api.get<ClassResponse[]>("/teacher/classes/selectable");
  },

  removeStudentFromClass(id: string, studentId: string): Promise<void> {
    return api.delete<void>(`/teacher/classes/${id}/students/${studentId}`);
  },

  inviteStudent(id: string, email: string): Promise<StudentClassResponse> {
    return api.post<StudentClassResponse>(`/teacher/classes/${id}/students?email=${encodeURIComponent(email)}`);
  },
};
