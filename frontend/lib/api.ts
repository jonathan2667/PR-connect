// Environment-aware API configuration
const getApiBaseUrl = () => {
  // Destructure environment variable with fallback
  const { NEXT_PUBLIC_API_URL } = process.env;
  
  // Direct check with console logging for debugging
  if (NEXT_PUBLIC_API_URL) {
    console.log('✅ Found NEXT_PUBLIC_API_URL:', NEXT_PUBLIC_API_URL);
    return NEXT_PUBLIC_API_URL;
  }
  
  console.log('❌ NEXT_PUBLIC_API_URL not found, using fallback logic');

  // Fallback logic
  if (typeof window !== 'undefined') {
    const { hostname } = window.location;
    
    // Local development
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      console.log('🏠 Using localhost for development');
      return 'http://localhost:5001';
    }
    
    // Production fallback
    console.log('🌐 Using production fallback');
    return 'https://pr-connect-backend.onrender.com';
  }
  
  // Server-side fallback
  console.log('🖥️ Using server-side fallback');
  return 'http://localhost:5001';
};

const API_BASE_URL = getApiBaseUrl();

export interface PressReleaseRequest {
  title: string;
  body: string;
  company_name: string;
  target_outlets: string[];
  category: string;
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

export const api = {
  // Generate press release
  async generatePressRelease(request: PressReleaseRequest): Promise<PressReleaseResponse> {
    const response = await fetch(`${API_BASE_URL}/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }

    const result: ApiResponse<PressReleaseResponse> = await response.json();
    
    if (!result.success || !result.data) {
      throw new Error(result.message || 'Failed to generate press release');
    }

    return result.data;
  },

  // Get available outlets
  async getOutlets(): Promise<Record<string, any>> {
    const response = await fetch(`${API_BASE_URL}/api/outlets`);
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }

    return response.json();
  },

  // Get available categories
  async getCategories(): Promise<string[]> {
    const response = await fetch(`${API_BASE_URL}/api/categories`);
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }

    return response.json();
  },

  // Get request history
  async getRequests(): Promise<any[]> {
    const response = await fetch(`${API_BASE_URL}/api/requests`);
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }

    const result = await response.json();
    return result.success ? result.data : [];
  },

  // Get specific request
  async getRequest(requestId: number): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/api/requests/${requestId}`);
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }

    const result = await response.json();
    return result.success ? result.data : null;
  },

  // Initialize database (for setup)
  async initDatabase(): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${API_BASE_URL}/api/init-db`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }

    return response.json();
  },

  // Health check
  async healthCheck(): Promise<{ status: string }> {
    const response = await fetch(`${API_BASE_URL}/health`);
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }

    return response.json();
  }
}; 