import React, { useState, useEffect } from 'react';
    import emailjs from '@emailjs/browser';
    import { Send, Loader2, AlertCircle, CheckCircle2, Mail, FileText } from 'lucide-react';
    import { supabase } from '../../lib/supabase';
    import { EmailTemplateSelectionModal } from './modals/EmailTemplateSelectionModal';
    import { GenerateEmailModal } from './modals/GenerateEmailModal'; // Import the new Generate modal
    import { useAuth } from '../../context/AuthContext'; // Import useAuth

    interface EmailFormProps {
      leadName: string;
      leadEmail: string;
    }

    interface Template {
      id: string;
      name: string;
      type: string;
      prompt: string;
      created_by: string | null;
      created_at: string;
      updated_at: string;
    }

    export const EmailForm: React.FC<EmailFormProps> = ({ leadName, leadEmail }) => {
      const { state: authState } = useAuth(); // Get auth state
      const { user } = authState; // Destructure user
      const [subject, setSubject] = useState('');
      const [message, setMessage] = useState('');
      const [isSending, setIsSending] = useState(false);
      const [error, setError] = useState<string | null>(null);
      const [success, setSuccess] = useState<string | null>(null);
      const [showTemplateSelectionModal, setShowTemplateSelectionModal] = useState(false); // Renamed state
      const [showGenerateEmailModal, setShowGenerateEmailModal] = useState(false); // State for generate modal
      const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null); // State for selected template
      const [emailTemplates, setEmailTemplates] = useState<Template[]>([]);
      const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);

      const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;
      const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
      const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;

      const fetchEmailTemplates = async () => {
        setIsLoadingTemplates(true);
        setError(null);
        try {
          const { data, error: fetchError } = await supabase
            .from('templates')
            .select('*')
            .eq('type', 'email')
            .order('name', { ascending: true });

          if (fetchError) throw fetchError;
          setEmailTemplates(data || []);
        } catch (err) {
          console.error('Error fetching email templates:', err);
          setError('Failed to load email templates.');
        } finally {
          setIsLoadingTemplates(false);
        }
      };

      const handleOpenTemplateSelectionModal = () => {
        fetchEmailTemplates();
        setShowTemplateSelectionModal(true);
      };

      // Updated handler: Opens the GenerateEmailModal instead of populating fields
      const handleTemplateSelect = (template: Template) => {
        setSelectedTemplate(template); // Store selected template
        setShowTemplateSelectionModal(false); // Close selection modal
        setShowGenerateEmailModal(true); // Open generate modal
      };

      // Callback function to receive generated email content
      const handleEmailGenerated = (generatedSubject: string, generatedBody: string) => {
        setSubject(generatedSubject);
        setMessage(generatedBody);
        // Optionally show a success message specific to generation
        setSuccess('Email content generated successfully!');
      };


      const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);

        if (!publicKey || !serviceId || !templateId) {
          setError('EmailJS configuration is missing. Please check environment variables.');
          return;
        }

        if (!subject.trim() || !message.trim()) {
          setError('Subject and message cannot be empty.');
          return;
        }

        setIsSending(true);

        const templateParams = {
          to_name: leadName,
          to_email: leadEmail,
          subject: subject,
          message: message,
        };

        try {
          await emailjs.send(serviceId, templateId, templateParams, publicKey);
          setSuccess('Email sent successfully!');
          setSubject('');
          setMessage('');
        } catch (err) {
          console.error('EmailJS Error:', err);
          setError('Failed to send email. Please try again.');
        } finally {
          setIsSending(false);
        }
      };

      const recipientDisplay = `${leadName} <${leadEmail}>`;

      return (
        <>
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0 p-2 bg-indigo-50 rounded-lg">
                  <Mail className="h-6 w-6 text-indigo-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Send Email</h2>
                  <p className="text-sm text-gray-500">Compose and send an email directly to the lead.</p>
                </div>
              </div>
            </div>

            <div className="p-6">
              {error && (
                <div className="mb-4 bg-red-50 text-red-700 p-3 rounded-lg flex items-center">
                  <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
                  <span className="flex-1">{error}</span>
                  <button
                    onClick={() => setError(null)}
                    className="ml-3 text-red-500 hover:text-red-700 transition-colors"
                    aria-label="Dismiss error"
                  >
                    &times;
                  </button>
                </div>
              )}

              {success && (
                <div className="mb-4 bg-green-50 text-green-700 p-3 rounded-lg flex items-center">
                  <CheckCircle2 className="h-5 w-5 mr-2 flex-shrink-0" />
                  <span className="flex-1">{success}</span>
                  <button
                    onClick={() => setSuccess(null)}
                    className="ml-3 text-green-500 hover:text-green-700 transition-colors"
                    aria-label="Dismiss success"
                  >
                    &times;
                  </button>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label htmlFor="email-to" className="block text-sm font-medium text-gray-700 mb-1">
                    To
                  </label>
                  <input
                    id="email-to"
                    type="text"
                    value={recipientDisplay}
                    readOnly
                    className="block w-full rounded-lg border-gray-300 bg-gray-100 shadow-sm sm:text-sm cursor-not-allowed py-2 px-3"
                  />
                </div>
                <div>
                  <label htmlFor="email-subject" className="block text-sm font-medium text-gray-700 mb-1">
                    Subject
                  </label>
                  <input
                    id="email-subject"
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    required
                    className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 px-3"
                    placeholder="Enter email subject"
                  />
                </div>
                <div>
                  <label htmlFor="email-message" className="block text-sm font-medium text-gray-700 mb-1">
                    Message
                  </label>
                  <textarea
                    id="email-message"
                    rows={8}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    required
                    className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 px-3"
                    placeholder="Compose your email..."
                  />
                </div>
                <div className="pt-3 flex justify-between items-center border-t border-gray-200">
                  <button
                    type="button"
                    onClick={handleOpenTemplateSelectionModal} // Changed handler name
                    className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Use Template
                  </button>
                  <button
                    type="submit"
                    disabled={isSending || !subject.trim() || !message.trim()}
                    className="inline-flex items-center justify-center px-5 py-2.5 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-150"
                  >
                    {isSending ? (
                      <Loader2 className="animate-spin h-5 w-5 mr-2" />
                    ) : (
                      <Send className="h-5 w-5 mr-2" />
                    )}
                    {isSending ? 'Sending...' : 'Send Email'}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Template Selection Modal */}
          {showTemplateSelectionModal && (
            <EmailTemplateSelectionModal
              templates={emailTemplates}
              onClose={() => setShowTemplateSelectionModal(false)}
              onSelect={handleTemplateSelect} // Updated handler
              isLoading={isLoadingTemplates}
            />
          )}

          {/* Generate Email Modal */}
          {showGenerateEmailModal && selectedTemplate && user && (
            <GenerateEmailModal
              leadName={leadName}
              userName={user.name || user.email}
              template={selectedTemplate}
              onClose={() => {
                setShowGenerateEmailModal(false);
                setSelectedTemplate(null); // Clear selected template
              }}
              onEmailGenerated={handleEmailGenerated} // Pass the callback
            />
          )}
        </>
      );
    };
