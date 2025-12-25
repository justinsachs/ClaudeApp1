import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Course APIs
export const courseAPI = {
  getAll: (status?: string) => apiClient.get('/courses', { params: { status } }),
  getById: (id: string) => apiClient.get(`/courses/${id}`),
  getFull: (id: string) => apiClient.get(`/courses/${id}/full`),
  create: (data: any) => apiClient.post('/courses', data),
  createPackage: (data: any) => apiClient.post('/courses/package', data),
  update: (id: string, data: any) => apiClient.patch(`/courses/${id}`, data),
  publish: (id: string) => apiClient.post(`/courses/${id}/publish`),
  delete: (id: string) => apiClient.delete(`/courses/${id}`),
  getOutcomes: (id: string) => apiClient.get(`/courses/${id}/outcomes`),
  getSections: (id: string) => apiClient.get(`/courses/${id}/sections`),
};

// Learner APIs
export const learnerAPI = {
  getAll: () => apiClient.get('/learners'),
  getById: (id: string) => apiClient.get(`/learners/${id}`),
  getProfile: (id: string) => apiClient.get(`/learners/${id}/profile`),
  create: (data: any) => apiClient.post('/learners', data),
  update: (id: string, data: any) => apiClient.patch(`/learners/${id}`, data),
  setPreferences: (id: string, data: any) => apiClient.post(`/learners/${id}/preferences`, data),
  getEnrollments: (id: string) => apiClient.get(`/learners/${id}/enrollments`),
};

// Enrollment APIs
export const enrollmentAPI = {
  create: (data: { learner_id: string; course_id: string }) =>
    apiClient.post('/enrollments', data),
  getById: (id: string) => apiClient.get(`/enrollments/${id}`),
  getProgress: (id: string) => apiClient.get(`/enrollments/${id}/progress`),
  startSection: (enrollmentId: string, sectionId: string) =>
    apiClient.post(`/enrollments/${enrollmentId}/sections/${sectionId}/start`),
  calibrate: (enrollmentId: string, sectionId: string, responses: any[]) =>
    apiClient.post(`/enrollments/${enrollmentId}/sections/${sectionId}/calibrate`, { responses }),
  getInstruction: (enrollmentId: string, sectionId: string, notebookId: string) =>
    apiClient.post(`/enrollments/${enrollmentId}/sections/${sectionId}/instruct`, { notebook_id: notebookId }),
  verify: (enrollmentId: string, sectionId: string, assessmentId: string, response: any) =>
    apiClient.post(`/enrollments/${enrollmentId}/sections/${sectionId}/verify`, {
      assessment_id: assessmentId,
      learner_response: response,
    }),
  remediate: (enrollmentId: string, sectionId: string, type: string) =>
    apiClient.post(`/enrollments/${enrollmentId}/sections/${sectionId}/remediate`, {
      remediation_type: type,
    }),
  completeSection: (enrollmentId: string, sectionId: string, score: number) =>
    apiClient.post(`/enrollments/${enrollmentId}/sections/${sectionId}/complete`, {
      final_score: score,
    }),
};

// Source APIs
export const sourceAPI = {
  getAll: () => apiClient.get('/sources'),
  getById: (id: string) => apiClient.get(`/sources/${id}`),
  create: (data: any) => apiClient.post('/sources', data),
  update: (id: string, data: any) => apiClient.patch(`/sources/${id}`, data),
  delete: (id: string) => apiClient.delete(`/sources/${id}`),
};

// Section APIs
export const sectionAPI = {
  getById: (id: string) => apiClient.get(`/sections/${id}`),
  getObjectives: (id: string) => apiClient.get(`/sections/${id}/objectives`),
  getSources: (id: string) => apiClient.get(`/sections/${id}/sources`),
  getAssessments: (id: string) => apiClient.get(`/sections/${id}/assessments`),
  getArtifacts: (id: string) => apiClient.get(`/sections/${id}/artifacts`),
};

// Assessment APIs
export const assessmentAPI = {
  getById: (id: string) => apiClient.get(`/assessments/${id}`),
  create: (data: any) => apiClient.post('/assessments', data),
  getVerifications: (sectionProgressId: string) =>
    apiClient.get(`/assessments/verifications/${sectionProgressId}`),
  getRemediations: (sectionProgressId: string) =>
    apiClient.get(`/assessments/remediations/${sectionProgressId}`),
};
