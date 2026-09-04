import { apiGet } from './api';
import type { ForecastResponse, LifecycleForecastResponse, PeerResponse, ProjectListResponse, ProjectRecord } from '../types/api';

export type ProjectSort = 'name' | 'code' | 'sector' | 'cost' | 'time' | 'score';
export interface ProjectQuery { page: number; pageSize: number; search?: string; sector?: string; ministry?: string; riskLevel?: string; sort: ProjectSort; direction: 'asc' | 'desc' }

export function getProjects(query: ProjectQuery, signal?: AbortSignal) {
  const params = new URLSearchParams({ page: String(query.page), page_size: String(query.pageSize), sort: query.sort, direction: query.direction });
  if (query.search) params.set('search', query.search);
  if (query.sector) params.set('sector', query.sector);
  if (query.ministry) params.set('ministry', query.ministry);
  if (query.riskLevel) params.set('risk_level', query.riskLevel);
  return apiGet<ProjectListResponse>(`/api/projects?${params}`, signal);
}

export const getProject = (code: string, signal?: AbortSignal) => apiGet<ProjectRecord>(`/api/projects/${encodeURIComponent(code)}`, signal);
export const getProjectForecast = (code: string, signal?: AbortSignal) => apiGet<ForecastResponse>(`/api/projects/${encodeURIComponent(code)}/forecast`, signal);
export const getProjectPeers = (code: string, signal?: AbortSignal) => apiGet<PeerResponse>(`/api/projects/${encodeURIComponent(code)}/peers`, signal);
export const getLifecycleForecast = (code: string, signal?: AbortSignal) => apiGet<LifecycleForecastResponse>(`/api/projects/${encodeURIComponent(code)}/lifecycle-forecast`, signal);
