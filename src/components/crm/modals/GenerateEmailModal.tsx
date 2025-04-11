import React, { useState } from 'react';
    import { X, Wand2, Loader2, AlertCircle } from 'lucide-react';

    interface Template {
      id: string;
      name: string;
      type: string;
      prompt: string;
    }

    interface GeneratedEmail {
        subject: string;
        body: string;
    }

    interface GenerateEmailModalProps {
      leadName: string;
      userName: string;
      template: Template;
      onClose: () => void;
      onEmailGenerated: (subject: string, body: string) => void; // Callback for generated email
    }

    interface FormData {
      client_name: string;
      client_market_segment_intro: string;
      product_service: string;
      your_company_name: string;
      your_name: string;
      task_prompt: string;
    }

    export const GenerateEmailModal: React.FC<GenerateEmailModalProps> = ({
      leadName,
      userName,
      template,
      onClose,
      onEmailGenerated, // Receive the callback
    }) => {
      const [formData, setFormData] = useState<FormData>({
        client_name: leadName,
        client_market_segment_intro: '', // Editable
        product_service: '', // Editable
        your_company_name: '', // Editable
        your_name: userName,
        task_prompt: template.prompt,
      });
      const [isGenerating, setIsGenerating] = useState(false);
      const [modalError, setModalError] = useState('');

      const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (value.trim()) setModalError(''); // Clear error on input
      };

      const handleGenerate = async (e: React.FormEvent) => {
        e.preventDefault();
        setModalError('');
        // Basic validation for editable fields
        if (!formData.client_market_segment_intro.trim() || !formData.product_service.trim() || !formData.your_company_name.trim()) {
            setModalError('Please fill in all editable fields: Market Segment, Product/Service, and Your Company Name.');
            return;
        }

        const apiUrl = import.meta.env.VITE_EMAIL_GENERATION_API_URL;
        if (!apiUrl) {
            setModalError('Email generation API URL is not configured in .env file.');
            return;
        }

        setIsGenerating(true);
        console.log("Calling AI API with data:", formData);

        try {
          const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json', // Explicitly accept JSON
            },
            body: JSON.stringify(formData),
          });

          // Check if response is ok (status in the range 200-299)
          if (!response.ok) {
            let errorMsg = `API Error: ${response.status} ${response.statusText}`;
            try {
                // Try to parse error details from the response body
                const errorBody = await response.json();
                errorMsg = errorBody.detail || errorBody.message || errorMsg;
            } catch (parseError) {
                // Ignore if the error body isn't JSON
            }
            throw new Error(errorMsg);
          }

          // Parse the successful JSON response
          const result: GeneratedEmail = await response.json();

          // Validate the structure of the response
          if (!result || typeof result.subject !== 'string' || typeof result.body !== 'string') {
              throw new Error('Invalid response format received from AI API.');
          }

          // Pass the generated content back to the EmailForm
          onEmailGenerated(result.subject, result.body);
          onClose(); // Close modal on success

        } catch (err) {
          console.error("AI Generation Error:", err);
          setModalError(err instanceof Error ? err.message : 'AI Generation failed.');
        } finally {
          setIsGenerating(false);
        }
      };

      return (
        <div className="fixed inset-0 z-50 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 transition-opacity duration-300">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6 transform transition-all duration-300 scale-100 opacity-100 max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-200 flex-shrink-0">
              <h3 className="text-lg font-semibold text-gray-900">Generate Email Content</h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors rounded-full p-1 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                aria-label="Close modal"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {modalError && (
              <div className="mb-4 bg-red-50 text-red-700 p-3 rounded-lg flex items-center text-sm flex-shrink-0">
                <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            {/* Make the form scrollable */}
            <div className="flex-1 overflow-y-auto pr-2 -mr-2 mb-4">
                <form id="generate-email-form" onSubmit={handleGenerate} className="space-y-4">
                    {/* Read-only fields */}
                    <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Client Name</label>
                    <input
                        type="text"
                        readOnly
                        value={formData.client_name}
                        className="block w-full rounded-lg border-gray-300 bg-gray-100 shadow-sm sm:text-sm cursor-not-allowed py-2 px-3"
                    />
                    </div>
                    <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Your Name</label>
                    <input
                        type="text"
                        readOnly
                        value={formData.your_name}
                        className="block w-full rounded-lg border-gray-300 bg-gray-100 shadow-sm sm:text-sm cursor-not-allowed py-2 px-3"
                    />
                    </div>
                    <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Template Prompt (Task)</label>
                    <textarea
                        readOnly
                        value={formData.task_prompt}
                        rows={4}
                        className="block w-full rounded-lg border-gray-300 bg-gray-100 shadow-sm sm:text-sm cursor-not-allowed py-2 px-3 whitespace-pre-wrap"
                    />
                    </div>

                    {/* Editable fields */}
                    <div>
                    <label htmlFor="client_market_segment_intro" className="block text-sm font-medium text-gray-700 mb-1">
                        Client Market Segment Intro *
                    </label>
                    <textarea
                        id="client_market_segment_intro"
                        name="client_market_segment_intro"
                        required
                        value={formData.client_market_segment_intro}
                        onChange={handleInputChange}
                        rows={3}
                        className={`mt-1 block w-full rounded-lg border shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 px-3 ${modalError && !formData.client_market_segment_intro.trim() ? 'border-red-500' : 'border-gray-300'}`}
                        placeholder="Describe the client's market segment..."
                    />
                    </div>
                    <div>
                    <label htmlFor="product_service" className="block text-sm font-medium text-gray-700 mb-1">
                        Product/Service Description *
                    </label>
                    <textarea
                        id="product_service"
                        name="product_service"
                        required
                        value={formData.product_service}
                        onChange={handleInputChange}
                        rows={3}
                        className={`mt-1 block w-full rounded-lg border shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 px-3 ${modalError && !formData.product_service.trim() ? 'border-red-500' : 'border-gray-300'}`}
                        placeholder="Describe the product or service being offered..."
                    />
                    </div>
                    <div>
                    <label htmlFor="your_company_name" className="block text-sm font-medium text-gray-700 mb-1">
                        Your Company Name *
                    </label>
                    <input
                        id="your_company_name"
                        name="your_company_name"
                        type="text"
                        required
                        value={formData.your_company_name}
                        onChange={handleInputChange}
                        className={`mt-1 block w-full rounded-lg border shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 px-3 ${modalError && !formData.your_company_name.trim() ? 'border-red-500' : 'border-gray-300'}`}
                        placeholder="Enter your company name"
                    />
                    </div>
                </form>
            </div>


            <div className="pt-4 border-t border-gray-200 flex justify-end space-x-3 flex-shrink-0">
              <button
                type="button"
                onClick={onClose}
                disabled={isGenerating}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit" // Changed back to submit to trigger form validation
                form="generate-email-form" // Link button to the form
                disabled={isGenerating || !formData.client_market_segment_intro.trim() || !formData.product_service.trim() || !formData.your_company_name.trim()}
                className="inline-flex justify-center rounded-lg border border-transparent bg-purple-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGenerating ? (
                  <Loader2 className="animate-spin h-5 w-5 mr-2" />
                ) : (
                  <Wand2 className="h-5 w-5 mr-2" />
                )}
                {isGenerating ? 'Generating...' : 'Generate Email using AI'}
              </button>
            </div>
          </div>
        </div>
      );
    };
