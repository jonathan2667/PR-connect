// API configuration and utilities for Press Release Backend
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

export interface PressReleaseRequest {
  company_name: string;
  title: string;
  body: string;
  category: string;
  target_outlets: string[];
  contact_info?: string;
  additional_notes?: string;
}

export interface GeneratedPressRelease {
  outlet: string;
  content: string;
  tone: string;
  word_count: number;
}

export interface PressReleaseResponse {
  request_id: string;
  company_name: string;
  category: string;
  generated_releases: GeneratedPressRelease[];
  timestamp: string;
  status: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message: string;
}

export interface OutletInfo {
  description: string;
  audience: string;
  icon: string;
}

export interface Outlets {
  [key: string]: OutletInfo;
}

// API Functions
export const api = {
  // Generate press releases
  async generatePressReleases(request: PressReleaseRequest): Promise<ApiResponse<PressReleaseResponse>> {
    try {
      const response = await fetch(`${API_BASE_URL}/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  },

  // Get available outlets
  async getOutlets(): Promise<Outlets> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/outlets`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching outlets:', error);
      return {};
    }
  },

  // Get available categories  
  async getCategories(): Promise<string[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/categories`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching categories:', error);
      return [];
    }
  },

  // Health check
  async healthCheck() {
    try {
      const response = await fetch(`${API_BASE_URL}/health`);
      return await response.json();
    } catch (error) {
      console.error('Health check failed:', error);
      return { status: 'error', message: 'Backend unreachable' };
    }
  }
}; 