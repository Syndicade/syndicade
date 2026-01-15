// src/components/AIContentGenerator.jsx

import { useState } from 'react';
import { generateWebsiteContent } from '../lib/ai';

/**
 * AIContentGenerator Component
 * 
 * Provides an accessible interface for users to generate AI-powered website content.
 * This component is fully ADA compliant with proper ARIA labels, keyboard navigation,
 * and screen reader support.
 * 
 * @param {Function} onContentInsert - Callback when user inserts generated content
 */
export default function AIContentGenerator({ onContentInsert }) {
  // Component state
  const [description, setDescription] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState(null);
  const [error, setError] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);

  /**
   * Handle form submission to generate content
   */
  const handleGenerate = async (e) => {
    e.preventDefault();
    
    // Clear previous states
    setError(null);
    setGeneratedContent(null);
    setShowSuccess(false);

    // Validate input
    if (!description.trim()) {
      setError('Please enter a description of your website.');
      return;
    }

    if (description.trim().length < 10) {
      setError('Please provide a more detailed description (at least 10 characters).');
      return;
    }

    // Start generation
    setIsGenerating(true);

    try {
      const result = await generateWebsiteContent(description);
      
      if (result.success) {
        setGeneratedContent(result.content);
        // Announce success to screen readers
        setShowSuccess(true);
      } else {
        setError('Failed to generate content. Please try again.');
      }
    } catch (err) {
      setError(err.message || 'An error occurred while generating content.');
      console.error('Generation error:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  /**
   * Handle inserting generated content into the website
   */
  const handleInsert = () => {
    if (generatedContent && onContentInsert) {
      onContentInsert(generatedContent);
      
      // Show confirmation
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    }
  };

  /**
   * Handle regenerating content with the same description
   */
  const handleRegenerate = () => {
    handleGenerate({ preventDefault: () => {} });
  };

  /**
   * Clear all states and start fresh
   */
  const handleClear = () => {
    setDescription('');
    setGeneratedContent(null);
    setError(null);
    setShowSuccess(false);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h2 
          id="ai-generator-title"
          className="text-2xl font-bold text-gray-800 mb-2"
        >
          ✨ AI Content Generator
        </h2>
        <p className="text-gray-600">
          Describe your website and let AI create professional content for you.
        </p>
      </div>

      {/* Generation Form */}
      <form 
        onSubmit={handleGenerate}
        aria-labelledby="ai-generator-title"
        className="space-y-4"
      >
        {/* Description Input */}
        <div>
          <label 
            htmlFor="website-description"
            className="block text-sm font-semibold text-gray-700 mb-2"
          >
            Website Description
            <span className="text-red-500 ml-1" aria-label="required">*</span>
          </label>
          <textarea
            id="website-description"
            name="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Example: A modern bakery specializing in artisan sourdough bread and pastries, located in downtown Portland. We focus on organic ingredients and traditional baking methods."
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-vertical min-h-32"
            disabled={isGenerating}
            aria-required="true"
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={error ? 'description-error' : 'description-help'}
          />
          
          {/* Character count helper */}
          <div className="mt-2 text-sm text-gray-500" id="description-help">
            {description.length} characters
            {description.length < 10 && description.length > 0 && (
              <span className="text-orange-600 ml-2">
                (Minimum 10 characters for best results)
              </span>
            )}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div 
            id="description-error"
            role="alert"
            aria-live="assertive"
            className="bg-red-50 border-l-4 border-red-500 p-4 rounded"
          >
            <div className="flex items-start">
              <svg 
                className="w-5 h-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" 
                fill="currentColor" 
                viewBox="0 0 20 20"
                aria-hidden="true"
              >
                <path 
                  fillRule="evenodd" 
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" 
                  clipRule="evenodd" 
                />
              </svg>
              <p className="text-red-700 font-medium">{error}</p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={isGenerating || !description.trim()}
            className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            aria-label={isGenerating ? 'Generating content, please wait' : 'Generate website content'}
          >
            {isGenerating ? (
              <span className="flex items-center">
                <svg 
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" 
                  xmlns="http://www.w3.org/2000/svg" 
                  fill="none" 
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <circle 
                    className="opacity-25" 
                    cx="12" 
                    cy="12" 
                    r="10" 
                    stroke="currentColor" 
                    strokeWidth="4"
                  />
                  <path 
                    className="opacity-75" 
                    fill="currentColor" 
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Generating...
              </span>
            ) : (
              'Generate Content'
            )}
          </button>

          {description && !isGenerating && (
            <button
              type="button"
              onClick={handleClear}
              className="px-6 py-3 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
              aria-label="Clear description and start over"
            >
              Clear
            </button>
          )}
        </div>
      </form>

      {/* Generated Content Display */}
      {generatedContent && (
        <div 
          className="mt-8 border-t-2 border-gray-200 pt-6"
          role="region"
          aria-labelledby="generated-content-title"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 
              id="generated-content-title"
              className="text-xl font-bold text-gray-800"
            >
              Generated Content
            </h3>
            <div className="flex gap-2">
              <button
                onClick={handleRegenerate}
                disabled={isGenerating}
                className="px-4 py-2 text-sm bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 transition-colors"
                aria-label="Regenerate content with same description"
              >
                🔄 Regenerate
              </button>
              {onContentInsert && (
                <button
                  onClick={handleInsert}
                  className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors"
                  aria-label="Insert this content into your website"
                >
                  ✓ Insert Content
                </button>
              )}
            </div>
          </div>

          {/* Headline */}
          <div className="mb-4 p-4 bg-blue-50 rounded-lg">
            <label className="block text-xs font-semibold text-blue-800 uppercase tracking-wide mb-2">
              Headline
            </label>
            <p className="text-2xl font-bold text-gray-900">
              {generatedContent.headline}
            </p>
          </div>

          {/* Subheadline */}
          {generatedContent.subheadline && (
            <div className="mb-4 p-4 bg-purple-50 rounded-lg">
              <label className="block text-xs font-semibold text-purple-800 uppercase tracking-wide mb-2">
                Subheadline
              </label>
              <p className="text-lg text-gray-800">
                {generatedContent.subheadline}
              </p>
            </div>
          )}

          {/* Body Text */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <label className="block text-xs font-semibold text-gray-800 uppercase tracking-wide mb-2">
              Body Text
            </label>
            <div className="prose prose-gray max-w-none">
              {generatedContent.bodyText.split('\n\n').map((paragraph, index) => (
                <p key={index} className="text-gray-700 mb-3 leading-relaxed">
                  {paragraph}
                </p>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Success Message */}
      {showSuccess && (
        <div 
          role="status"
          aria-live="polite"
          className="mt-4 bg-green-50 border-l-4 border-green-500 p-4 rounded"
        >
          <div className="flex items-center">
            <svg 
              className="w-5 h-5 text-green-500 mr-3" 
              fill="currentColor" 
              viewBox="0 0 20 20"
              aria-hidden="true"
            >
              <path 
                fillRule="evenodd" 
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" 
                clipRule="evenodd" 
              />
            </svg>
            <p className="text-green-700 font-medium">
              Content inserted successfully!
            </p>
          </div>
        </div>
      )}

      {/* Tips Section */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h4 className="text-sm font-semibold text-blue-900 mb-2">
          💡 Tips for Better Results
        </h4>
        <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
          <li>Be specific about your business type and target audience</li>
          <li>Mention your unique selling points or special features</li>
          <li>Include your location if it's relevant to your business</li>
          <li>Describe the tone you want (professional, friendly, casual, etc.)</li>
        </ul>
      </div>
    </div>
  );
}