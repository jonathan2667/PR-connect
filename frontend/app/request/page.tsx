"use client";

import { useState, useEffect } from 'react';
import { api, PressReleaseRequest, PressReleaseResponse, GeneratedPressRelease } from '../../lib/api';

export default function RequestPage() {
  const [outlets, setOutlets] = useState<Record<string, any>>({});
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PressReleaseResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<PressReleaseRequest>({
    title: '',
    body: '',
    company_name: '',
    target_outlets: [],
    category: '',
    contact_info: '',
    additional_notes: ''
  });

  // Load outlets and categories on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const [outletsData, categoriesData] = await Promise.all([
          api.getOutlets(),
          api.getCategories()
        ]);
        setOutlets(outletsData);
        setCategories(categoriesData);
      } catch (err) {
        setError('Failed to load configuration data');
        console.error('API Error:', err);
      }
    };

    loadData();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev: PressReleaseRequest) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleOutletChange = (outlet: string, checked: boolean) => {
    setFormData((prev: PressReleaseRequest) => ({
      ...prev,
      target_outlets: checked 
        ? [...prev.target_outlets, outlet]
        : prev.target_outlets.filter((o: string) => o !== outlet)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await api.generatePressRelease(formData);
      setResult(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate press release');
      console.error('Generation Error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (result) {
    return (
      <div className="bg-white rounded-xl shadow p-8 w-full max-w-4xl mt-12">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Generated Press Releases</h2>
          <button 
            onClick={() => setResult(null)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Create New Request
          </button>
        </div>
        
        <div className="space-y-6">
          {result.generated_releases.map((release: GeneratedPressRelease, index: number) => (
            <div key={index} className="border rounded-lg p-4">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg font-semibold text-blue-700">{release.outlet}</h3>
                <span className="text-sm text-gray-500">{release.word_count} words • {release.tone}</span>
              </div>
              <div className="prose max-w-none">
                <pre className="whitespace-pre-wrap text-sm bg-gray-50 p-4 rounded">{release.content}</pre>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow p-8 w-full max-w-2xl mt-12 flex flex-col gap-6">
      <h2 className="text-2xl font-bold mb-2 text-center">New Press Release Request</h2>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-semibold mb-1">Press Release Title *</label>
          <input 
            type="text" 
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" 
            placeholder="Enter compelling headline"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-semibold mb-1">Company Name *</label>
          <input 
            type="text" 
            name="company_name"
            value={formData.company_name}
            onChange={handleInputChange}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" 
            placeholder="Your company name"
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold mb-1">Press Release Body *</label>
        <textarea 
          name="body"
          value={formData.body}
          onChange={handleInputChange}
          rows={4} 
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" 
          placeholder="Describe your announcement in detail..."
          required
        ></textarea>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-semibold mb-1">Category *</label>
          <select 
            name="category"
            value={formData.category}
            onChange={handleInputChange}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            required
          >
            <option value="">Select category</option>
            {categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold mb-1">Contact Information</label>
          <input 
            type="text" 
            name="contact_info"
            value={formData.contact_info}
            onChange={handleInputChange}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" 
            placeholder="Media contact details"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold mb-3">Target Outlets *</label>
        <div className="grid grid-cols-2 gap-3">
          {Object.entries(outlets).map(([outlet, info]: [string, any]) => (
            <label key={outlet} className="flex items-start space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
              <input 
                type="checkbox" 
                checked={formData.target_outlets.includes(outlet)}
                onChange={(e) => handleOutletChange(outlet, e.target.checked)}
                className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <div>
                <div className="font-medium text-sm flex items-center gap-1">
                  <span>{info.icon}</span>
                  {outlet}
                </div>
                <div className="text-xs text-gray-600">{info.description}</div>
              </div>
            </label>
          ))}
        </div>
        {formData.target_outlets.length === 0 && (
          <p className="text-red-500 text-sm mt-1">Please select at least one outlet</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-semibold mb-1">Additional Notes</label>
        <textarea 
          name="additional_notes"
          value={formData.additional_notes}
          onChange={handleInputChange}
          rows={3} 
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" 
          placeholder="Any specific requirements or context..."
        ></textarea>
      </div>

      <button 
        type="submit" 
        disabled={loading || formData.target_outlets.length === 0}
        className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Generating Press Releases...' : 'Generate Press Releases'}
      </button>
    </form>
  );
} 