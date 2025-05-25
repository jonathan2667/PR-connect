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
    return 'https://pr-connect-r40k.onrender.com';
  }
  
  // Server-side fallback
  console.log('🖥️ Using server-side fallback');
  return 'http://localhost:5001';
};

const API_BASE_URL = getApiBaseUrl();

// Helper function to get authentication headers
const getAuthHeaders = (): HeadersInit => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
};

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
      headers: getAuthHeaders(),
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
    const response = await fetch(`${API_BASE_URL}/api/requests`, {
      headers: getAuthHeaders(),
    });
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }

    const result = await response.json();
    return result.success ? result.data : [];
  },

  // Get specific request
  async getRequest(requestId: number): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/api/requests/${requestId}`, {
      headers: getAuthHeaders(),
    });
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }

    const result = await response.json();
    return result.success ? result.data : null;
  },

  // Delete specific request
  async deleteRequest(requestId: number): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${API_BASE_URL}/api/requests/${requestId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }

    return response.json();
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
  },

  // Save transcript
  async saveTranscript(text: string): Promise<{ success: boolean; data?: any; message: string }> {
    const response = await fetch(`${API_BASE_URL}/api/transcripts`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }

    return response.json();
  },

  // Get all transcripts
  async getTranscripts(): Promise<any[]> {
    const response = await fetch(`${API_BASE_URL}/api/transcripts`, {
      headers: getAuthHeaders(),
    });
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }

    const result = await response.json();
    return result.success ? result.data : [];
  },

  // Get specific transcript
  async getTranscript(transcriptId: number): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/api/transcripts/${transcriptId}`, {
      headers: getAuthHeaders(),
    });
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }

    const result = await response.json();
    return result.success ? result.data : null;
  },

  // Delete specific transcript
  async deleteTranscript(transcriptId: number): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${API_BASE_URL}/api/transcripts/${transcriptId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }

    return response.json();
  },

  // Get dashboard statistics
  async getDashboardStats(): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/api/dashboard/stats`, {
      headers: getAuthHeaders(),
    });
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }

    const result = await response.json();
    return result.success ? result.data : null;
  }
};

// Authentication API functions
export const authApi = {
  // User registration
  async register(userData: {
    fullName: string;
    email: string;
    companyName: string;
    password: string;
    confirmPassword: string;
  }): Promise<{ success: boolean; data?: any; message: string }> {
    const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || `Registration failed: ${response.statusText}`);
    }

    return response.json();
  },

  // User login
  async login(credentials: {
    email: string;
    password: string;
  }): Promise<{ success: boolean; data?: any; message: string }> {
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || `Login failed: ${response.statusText}`);
    }

    return response.json();
  },

  // Get user profile
  async getProfile(): Promise<any> {
    const token = localStorage.getItem('authToken');
    const response = await fetch(`${API_BASE_URL}/api/auth/profile`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch profile: ${response.statusText}`);
    }

    const result = await response.json();
    return result.success ? result.data : null;
  },

  // Update user profile
  async updateProfile(profileData: {
    fullName?: string;
    companyName?: string;
    phone?: string;
    location?: string;
  }): Promise<{ success: boolean; data?: any; message: string }> {
    const token = localStorage.getItem('authToken');
    const response = await fetch(`${API_BASE_URL}/api/auth/profile`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(profileData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || `Profile update failed: ${response.statusText}`);
    }

    return response.json();
  },

  // Verify authentication token
  async verifyToken(): Promise<{ success: boolean; data?: any; message: string }> {
    const token = localStorage.getItem('authToken');
    if (!token) {
      return { success: false, message: 'No token found' };
    }

    const response = await fetch(`${API_BASE_URL}/api/auth/verify`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      return { success: false, message: 'Token verification failed' };
    }

    return response.json();
  },

  // Logout (client-side)
  logout(): void {
    localStorage.removeItem('authToken');
    // Clear any other stored user data
    localStorage.removeItem('userData');
  }
}; 
