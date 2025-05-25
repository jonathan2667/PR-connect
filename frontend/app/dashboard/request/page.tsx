"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { api, PressReleaseRequest, PressReleaseResponse, GeneratedPressRelease } from '../../../lib/api';

export default function NewRequestPage() {
    const router = useRouter();
    const [outlets, setOutlets] = useState<Record<string, any>>({});
    const [categories, setCategories] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<PressReleaseResponse | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Speech recognition states
    const [inputMode, setInputMode] = useState<'manual' | 'voice'>('voice');
    const [isListening, setIsListening] = useState(false);
    const [speechText, setSpeechText] = useState('');
    const [speechSupported, setSpeechSupported] = useState(false);
    const [accumulatedSpeech, setAccumulatedSpeech] = useState('');
    const recognitionRef = useRef<any>(null);

    const [formData, setFormData] = useState<PressReleaseRequest>({
        title: '',
        body: '',
        company_name: '',
        target_outlets: [],
        category: '',
        contact_info: '',
        additional_notes: ''
    });

    // Check speech recognition support
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
            setSpeechSupported(!!SpeechRecognition);

            if (SpeechRecognition) {
                const recognition = new SpeechRecognition();
                recognition.continuous = true;
                recognition.interimResults = true;
                recognition.lang = 'en-US';

                recognition.onresult = (event: any) => {
                    let newFinalTranscript = '';
                    let interimTranscript = '';

                    // Process only NEW results starting from resultIndex
                    for (let i = event.resultIndex; i < event.results.length; i++) {
                        const transcript = event.results[i][0].transcript;
                        if (event.results[i].isFinal) {
                            newFinalTranscript += transcript;
                        } else {
                            interimTranscript += transcript;
                        }
                    }

                    // Add only NEW final results to accumulated speech
                    if (newFinalTranscript) {
                        setAccumulatedSpeech(prev => prev + newFinalTranscript);
                    }

                    // Update display: accumulated speech + current interim results
                    setSpeechText(prev => {
                        // Get current accumulated speech (without interim indicators)
                        const currentAccumulated = prev.includes('...') ? prev.split('...')[0] : prev;
                        const updatedAccumulated = newFinalTranscript ? currentAccumulated + newFinalTranscript : currentAccumulated;
                        return updatedAccumulated + (interimTranscript ? '...' + interimTranscript : '');
                    });
                };

                recognition.onerror = (event: any) => {
                    console.error('Speech recognition error:', event.error);
                    setError('Speech recognition error: ' + event.error);
                    setIsListening(false);
                };

                recognition.onend = () => {
                    setIsListening(false);
                };

                recognitionRef.current = recognition;
            }
        }
    }, []);

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

    // Parse speech text to extract form data
    const parseSpeechToFormData = (text: string): Partial<PressReleaseRequest> => {
        const lowerText = text.toLowerCase();

        // Extract company name
        let company_name = '';
        const companyPatterns = [
            /(?:company|organization|firm|business|startup|corporation) (?:is |called |named )?([^.!?]+?)(?:\.|,|!|\?|announces|announced|today|recently|$)/i,
            /(?:we are|i am from|i work for|i represent|my company is) ([^.!?]+?)(?:\.|,|!|\?|announces|announced|today|recently|$)/i,
            /([A-Z][a-zA-Z\s]+(?:Inc|LLC|Corp|Ltd|Co|Company))/,
        ];

        for (const pattern of companyPatterns) {
            const match = text.match(pattern);
            if (match && match[1]) {
                company_name = match[1].trim();
                break;
            }
        }

        // Extract title/headline
        let title = '';
        const titlePatterns = [
            /(?:title|headline|announcement|press release) (?:is |should be )?["\']?([^"'\n.!?]+)["\']?/i,
            /(?:announcing|announce) ([^.!?]+?)(?:\.|!|\?|,|$)/i,
            /(?:launching|launch) ([^.!?]+?)(?:\.|!|\?|,|$)/i,
        ];

        for (const pattern of titlePatterns) {
            const match = text.match(pattern);
            if (match && match[1]) {
                title = match[1].trim();
                break;
            }
        }

        // Extract category
        let category = '';
        const categoryKeywords = {
            'Product Launch': ['product', 'launch', 'launching', 'new product', 'product release'],
            'Funding Round': ['funding', 'investment', 'raised', 'series', 'round', 'investors'],
            'Acquisition': ['acquire', 'acquisition', 'bought', 'purchase', 'merger'],
            'Partnership': ['partner', 'partnership', 'collaboration', 'alliance'],
            'Executive Appointment': ['hire', 'hired', 'appointment', 'new ceo', 'new cto', 'executive', 'joins'],
            'Company Milestone': ['milestone', 'achievement', 'reached', 'celebration'],
            'Event Announcement': ['event', 'conference', 'webinar', 'summit', 'meetup'],
            'Research & Development': ['research', 'development', 'innovation', 'breakthrough'],
            'Awards & Recognition': ['award', 'recognition', 'winner', 'honored', 'achievement'],
        };

        for (const [cat, keywords] of Object.entries(categoryKeywords)) {
            if (keywords.some(keyword => lowerText.includes(keyword))) {
                category = cat;
                break;
            }
        }

        // Extract contact info
        let contact_info = '';
        const emailPattern = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/;
        const phonePattern = /(\+?1?[-.\s]?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4})/;

        const emailMatch = text.match(emailPattern);
        const phoneMatch = text.match(phonePattern);

        if (emailMatch) contact_info = emailMatch[1];
        else if (phoneMatch) contact_info = phoneMatch[1];

        // Generate smart defaults based on content
        const defaultTitle = title || (
            lowerText.includes('announce') || lowerText.includes('announcing') ?
                `${company_name || 'Company'} Makes Important Announcement` :
                'Breaking News Announcement'
        );

        const defaultCompany = company_name || 'Your Company';
        const defaultCategory = category || 'Company Milestone';
        const defaultContact = contact_info || 'press@yourcompany.com';

        return {
            title: defaultTitle,
            company_name: defaultCompany,
            category: defaultCategory,
            contact_info: defaultContact,
            additional_notes: `Generated from voice input on ${new Date().toLocaleDateString()}`
        };
    };

    const startListening = () => {
        if (recognitionRef.current && speechSupported) {
            setIsListening(true);
            setError(null);
            setSpeechText('');
            setAccumulatedSpeech('');
            recognitionRef.current.start();
        }
    };

    const stopListening = () => {
        if (recognitionRef.current && isListening) {
            recognitionRef.current.stop();
            setIsListening(false);

            // Process accumulated speech when stopping
            if (accumulatedSpeech.trim()) {
                const parsedData = parseSpeechToFormData(accumulatedSpeech);
                setFormData(prev => ({
                    ...prev,
                    ...parsedData,
                    body: accumulatedSpeech
                }));
            }
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleOutletChange = (outlet: string, checked: boolean) => {
        setFormData(prev => ({
            ...prev,
            target_outlets: checked
                ? [...prev.target_outlets, outlet]
                : prev.target_outlets.filter(o => o !== outlet)
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.target_outlets.length === 0) {
            setError('Please select at least one media outlet');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const response = await api.generatePressRelease(formData);
            setResult(response);
        } catch (err) {
            setError('Failed to generate press release. Please try again.');
            console.error('API Error:', err);
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({
            title: '',
            body: '',
            company_name: '',
            target_outlets: [],
            category: '',
            contact_info: '',
            additional_notes: ''
        });
        setSpeechText('');
        setAccumulatedSpeech('');
        setError(null);
    };

    if (result) {
        return (
            <div className="w-full bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-8 px-6">
                <div className="max-w-6xl mx-auto">
                    <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20 p-8 animate-in slide-in-from-bottom-5 duration-700">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                            <div>
                                <h2 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
                                    Generated Press Releases
                                </h2>
                                <p className="text-gray-600">Your press releases are ready for {result.generated_releases.length} outlets</p>
                            </div>
                            <button
                                onClick={() => setResult(null)}
                                className="group relative inline-flex items-center px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 hover:scale-105"
                            >
                                Create New Request
                            </button>
                        </div>

                        <div className="grid gap-6">
                            {result.generated_releases.map((release: GeneratedPressRelease, index: number) => (
                                <div
                                    key={index}
                                    className="group bg-white rounded-xl border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden"
                                    style={{ animationDelay: `${index * 150}ms` }}
                                >
                                    <div className="p-6">
                                        <div className="flex justify-between items-center mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">
                                                    {release.outlet.charAt(0)}
                                                </div>
                                                <div>
                                                    <h3 className="text-xl font-bold text-gray-900">{release.outlet}</h3>
                                                    <p className="text-sm text-gray-500">{release.tone}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-full">
                                                <span className="text-sm font-medium text-gray-700">{release.word_count} words</span>
                                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                            </div>
                                        </div>
                                        <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
                                            <pre className="whitespace-pre-wrap text-sm text-gray-800 leading-relaxed font-mono">
                                                {release.content}
                                            </pre>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-8 px-6">
            <div className="max-w-4xl mx-auto">
                {/* Header Section */}
                <div className="text-center mb-8 animate-in slide-in-from-top duration-700">
                    <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
                        Create Press Release
                    </h1>
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
                        Generate professional press releases using voice input or manual text entry
                    </p>
                </div>

                {/* Input Mode Toggle */}
                <div className="mb-6 flex justify-center animate-in slide-in-from-top duration-500">
                    <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-lg border border-white/20 p-2 flex">
                        <button
                            onClick={() => setInputMode('manual')}
                            className={`flex items-center gap-2 px-4 sm:px-6 py-3 rounded-xl font-semibold transition-all duration-200 text-sm sm:text-base ${inputMode === 'manual'
                                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                                : 'text-gray-600 hover:text-gray-800 hover:bg-white/50'
                                }`}
                        >
                            Manual Input
                        </button>
                        <button
                            onClick={() => setInputMode('voice')}
                            disabled={!speechSupported}
                            className={`flex items-center gap-2 px-4 sm:px-6 py-3 rounded-xl font-semibold transition-all duration-200 text-sm sm:text-base ${inputMode === 'voice'
                                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                                : 'text-gray-600 hover:text-gray-800 hover:bg-white/50'
                                } ${!speechSupported ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            Voice Input
                        </button>
                    </div>
                </div>

                {!speechSupported && (
                    <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <div className="flex items-center">
                            <span className="text-yellow-600 mr-2">⚠️</span>
                            <p className="text-yellow-800">Speech recognition is not supported in your browser. Please use manual input.</p>
                        </div>
                    </div>
                )}

                {/* Main Form */}
                <form
                    onSubmit={handleSubmit}
                    className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20 p-6 sm:p-8 space-y-8 animate-in slide-in-from-bottom duration-700"
                >
                    {error && (
                        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg animate-in slide-in-from-left duration-300">
                            <div className="flex items-center">
                                <span className="text-red-500 mr-2">⚠️</span>
                                <p className="text-red-700 font-medium">{error}</p>
                            </div>
                        </div>
                    )}

                    {/* Voice Input Section */}
                    {inputMode === 'voice' && (
                        <div className="space-y-6">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg flex items-center justify-center text-white font-bold">
                                    🎤
                                </div>
                                <h3 className="text-xl font-semibold text-gray-900">Voice Input</h3>
                            </div>

                            <div className="text-center space-y-4">
                                <div className="bg-gray-50 rounded-xl p-6 sm:p-8">
                                    <div className="mb-4">
                                        <button
                                            type="button"
                                            onClick={isListening ? stopListening : startListening}
                                            className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center text-2xl sm:text-3xl font-bold transition-all duration-200 transform hover:scale-105 ${isListening
                                                ? 'bg-red-500 text-white animate-pulse'
                                                : 'bg-gradient-to-r from-purple-500 to-pink-600 text-white hover:shadow-lg'
                                                }`}
                                        >
                                            {isListening ? '⏹️' : '🎤'}
                                        </button>
                                    </div>
                                    <p className="text-lg font-semibold text-gray-700 mb-2">
                                        {isListening ? 'Listening... Click to stop' : 'Click to start speaking'}
                                    </p>
                                    <p className="text-sm text-gray-600">
                                        Describe your press release including company name, announcement details, and category
                                    </p>
                                </div>

                                {speechText && (
                                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                                        <h4 className="font-semibold text-gray-700 mb-2">Transcription:</h4>
                                        <p className="text-gray-800 text-sm">{speechText}</p>
                                    </div>
                                )}

                                <div className="flex justify-center">
                                    <button
                                        type="button"
                                        onClick={resetForm}
                                        className="px-6 py-2 bg-gray-500 text-white rounded-lg font-semibold hover:bg-gray-600 transition-all duration-200"
                                    >
                                        Reset
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Basic Information Section - Only show in manual mode */}
                    {inputMode === 'manual' && (
                        <div className="space-y-6">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold">
                                    1
                                </div>
                                <h3 className="text-xl font-semibold text-gray-900">
                                    Basic Information
                                </h3>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Press Release Title *
                                    </label>
                                    <input
                                        type="text"
                                        name="title"
                                        value={formData.title}
                                        onChange={handleInputChange}
                                        className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 bg-white/70 backdrop-blur hover:bg-white/90 placeholder-gray-400 text-gray-900"
                                        placeholder="Enter a compelling headline that grabs attention..."
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Company Name *
                                    </label>
                                    <input
                                        type="text"
                                        name="company_name"
                                        value={formData.company_name}
                                        onChange={handleInputChange}
                                        className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 bg-white/70 backdrop-blur hover:bg-white/90 placeholder-gray-400 text-gray-900"
                                        placeholder="Your company or organization name"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Press Release Content *
                                </label>
                                <textarea
                                    name="body"
                                    value={formData.body}
                                    onChange={handleInputChange}
                                    rows={6}
                                    className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 bg-white/70 backdrop-blur hover:bg-white/90 placeholder-gray-400 resize-none text-gray-900"
                                    placeholder="Describe your announcement in detail. Include key facts, benefits, and any important context that should be highlighted in the press release..."
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Category *
                                    </label>
                                    <div className="relative">
                                        <select
                                            name="category"
                                            value={formData.category}
                                            onChange={handleInputChange}
                                            className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 bg-white/70 backdrop-blur hover:bg-white/90 appearance-none cursor-pointer text-gray-900"
                                            required
                                        >
                                            <option value="">Choose announcement category...</option>
                                            {categories.map(category => (
                                                <option key={category} value={category}>{category}</option>
                                            ))}
                                        </select>
                                        <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Contact Information
                                    </label>
                                    <input
                                        type="text"
                                        name="contact_info"
                                        value={formData.contact_info}
                                        onChange={handleInputChange}
                                        className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 bg-white/70 backdrop-blur hover:bg-white/90 placeholder-gray-400 text-gray-900"
                                        placeholder="Media contact details (email, phone, etc.)"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Target Outlets Section - Always Manual */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg flex items-center justify-center text-white font-bold">
                                2
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900">Target Media Outlets</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {Object.entries(outlets).map(([outlet, info]: [string, any]) => (
                                <label
                                    key={outlet}
                                    className={`group relative flex items-start p-4 sm:p-6 border-2 rounded-xl cursor-pointer transition-all duration-200 hover:scale-105 transform ${formData.target_outlets.includes(outlet)
                                        ? 'border-indigo-500 bg-indigo-50 shadow-lg'
                                        : 'border-gray-200 bg-white/50 hover:border-indigo-300 hover:bg-white/80'
                                        }`}
                                >
                                    <input
                                        type="checkbox"
                                        checked={formData.target_outlets.includes(outlet)}
                                        onChange={(e) => handleOutletChange(outlet, e.target.checked)}
                                        className="sr-only"
                                    />
                                    <div className="flex items-start space-x-4 w-full">
                                        <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center text-xl sm:text-2xl transition-colors ${formData.target_outlets.includes(outlet)
                                            ? 'bg-indigo-500 text-white'
                                            : 'bg-gray-100 group-hover:bg-indigo-100'
                                            }`}>
                                            {info.icon}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between mb-1">
                                                <h4 className="font-bold text-gray-900 text-sm sm:text-base">{outlet}</h4>
                                                {formData.target_outlets.includes(outlet) && (
                                                    <div className="w-6 h-6 bg-indigo-500 rounded-full flex items-center justify-center">
                                                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                        </svg>
                                                    </div>
                                                )}
                                            </div>
                                            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">{info.description}</p>
                                            <p className="text-xs text-gray-500 mt-1">Audience: {info.audience}</p>
                                        </div>
                                    </div>
                                </label>
                            ))}
                        </div>

                        {formData.target_outlets.length === 0 && (
                            <div className="flex items-center gap-2 text-red-500 bg-red-50 p-3 rounded-lg">
                                <span>⚠️</span>
                                <p className="text-sm font-medium">Please select at least one media outlet</p>
                            </div>
                        )}
                    </div>

                    {/* Additional Notes Section */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-8 h-8 bg-gradient-to-r from-pink-500 to-red-600 rounded-lg flex items-center justify-center text-white font-bold">
                                3
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900">Additional Details</h3>
                        </div>

                        <div className="space-y-2">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Additional Notes & Requirements
                            </label>
                            <textarea
                                name="additional_notes"
                                value={formData.additional_notes}
                                onChange={handleInputChange}
                                rows={4}
                                className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 bg-white/70 backdrop-blur hover:bg-white/90 placeholder-gray-400 resize-none text-gray-900"
                                placeholder="Any specific requirements, context, or special instructions for the press release generation..."
                            />
                        </div>
                    </div>

                    {/* Submit Button */}
                    <div className="pt-6">
                        <button
                            type="submit"
                            disabled={loading || formData.target_outlets.length === 0}
                            className="group relative w-full bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white py-4 px-8 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none hover:scale-105 disabled:hover:scale-100"
                        >
                            <div className="flex items-center justify-center gap-3">
                                {loading ? (
                                    <>
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                        <span>Generating Your Press Releases...</span>
                                    </>
                                ) : (
                                    <span>Generate Press Releases</span>
                                )}
                            </div>
                            {!loading && (
                                <div className="absolute inset-0 bg-gradient-to-r from-indigo-700 via-purple-700 to-pink-700 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 -z-10"></div>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
} 