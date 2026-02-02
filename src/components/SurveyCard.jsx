import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

function SurveyCard({ survey, onDelete, isAdmin, showOrganization = false }) {
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [showForm, setShowForm] = useState(false);
  const [hasResponded, setHasResponded] = useState(false);
  const [responseCount, setResponseCount] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState(null);

  useEffect(() => {
    if (survey) {
      loadQuestions();
      checkUserResponse();
      loadResponseCount();
    }
  }, [survey]);

  const loadQuestions = async () => {
    try {
      const { data, error } = await supabase
        .from('survey_questions')
        .select('*')
        .eq('survey_id', survey.id)
        .order('order_number');

      if (error) throw error;
      setQuestions(data || []);

      // Initialize answers object
      const initialAnswers = {};
      data.forEach(q => {
        if (q.question_type === 'multiple_choice') {
          initialAnswers[q.id] = [];
        } else {
          initialAnswers[q.id] = '';
        }
      });
      setAnswers(initialAnswers);
    } catch (err) {
      console.error('Error loading questions:', err);
    }
  };

  const checkUserResponse = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('survey_responses')
        .select('id')
        .eq('survey_id', survey.id)
        .eq('member_id', user.id)
        .maybeSingle();

      if (error) throw error;
      setHasResponded(!!data);
    } catch (err) {
      console.error('Error checking response:', err);
    }
  };

  const loadResponseCount = async () => {
    try {
      const { count, error } = await supabase
        .from('survey_responses')
        .select('*', { count: 'exact', head: true })
        .eq('survey_id', survey.id);

      if (error) throw error;
      setResponseCount(count || 0);
    } catch (err) {
      console.error('Error loading response count:', err);
    }
  };

  const loadResults = async () => {
    try {
      setLoading(true);

      // Get all responses
      const { data: responses, error: responsesError } = await supabase
        .from('survey_responses')
        .select('id')
        .eq('survey_id', survey.id);

      if (responsesError) throw responsesError;

      if (!responses || responses.length === 0) {
        setResults({ questions: [], totalResponses: 0 });
        setLoading(false);
        return;
      }

      // Get all answers
      const { data: allAnswers, error: answersError } = await supabase
        .from('survey_answers')
        .select('*')
        .in('response_id', responses.map(r => r.id));

      if (answersError) throw answersError;

      // Process results by question
      const questionResults = questions.map(question => {
        const questionAnswers = allAnswers.filter(a => a.question_id === question.id);

        if (['single_choice', 'multiple_choice'].includes(question.question_type)) {
          // Count option frequencies
          const optionCounts = {};
          question.options.forEach(opt => {
            optionCounts[opt] = 0;
          });

          questionAnswers.forEach(answer => {
            if (question.question_type === 'multiple_choice') {
              const selected = answer.answer_text ? JSON.parse(answer.answer_text) : [];
              selected.forEach(opt => {
                if (optionCounts.hasOwnProperty(opt)) {
                  optionCounts[opt]++;
                }
              });
            } else {
              if (optionCounts.hasOwnProperty(answer.answer_text)) {
                optionCounts[answer.answer_text]++;
              }
            }
          });

          return {
            question: question.question_text,
            type: question.question_type,
            options: question.options.map(opt => ({
              option: opt,
              count: optionCounts[opt],
              percentage: responses.length > 0 
                ? Math.round((optionCounts[opt] / responses.length) * 100) 
                : 0
            }))
          };
        } else if (question.question_type === 'rating') {
          // Calculate average rating
          const ratings = questionAnswers
            .map(a => parseInt(a.answer_text))
            .filter(r => !isNaN(r));
          
          const average = ratings.length > 0
            ? (ratings.reduce((sum, r) => sum + r, 0) / ratings.length).toFixed(1)
            : 0;

          // Count each rating
          const ratingCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
          ratings.forEach(r => {
            if (ratingCounts.hasOwnProperty(r)) {
              ratingCounts[r]++;
            }
          });

          return {
            question: question.question_text,
            type: 'rating',
            average,
            totalRatings: ratings.length,
            distribution: Object.entries(ratingCounts).map(([rating, count]) => ({
              rating: parseInt(rating),
              count,
              percentage: ratings.length > 0 
                ? Math.round((count / ratings.length) * 100) 
                : 0
            }))
          };
        } else {
          // Text responses
          return {
            question: question.question_text,
            type: question.question_type,
            responses: questionAnswers.map(a => a.answer_text).filter(Boolean)
          };
        }
      });

      setResults({
        questions: questionResults,
        totalResponses: responses.length
      });
      setLoading(false);
    } catch (err) {
      console.error('Error loading results:', err);
      setLoading(false);
    }
  };

const handleAnswerChange = useCallback((questionId, value, questionType) => {
  console.log('=== handleAnswerChange called ===');
  console.log('questionId:', questionId);
  console.log('value:', value);
  console.log('questionType:', questionType);
  
  if (questionType === 'multiple_choice') {
    setAnswers(prevAnswers => {
      const current = Array.isArray(prevAnswers[questionId]) ? prevAnswers[questionId] : [];
      console.log('current array:', current);
      console.log('includes value?', current.includes(value));
      
      if (current.includes(value)) {
        const newArray = current.filter(v => v !== value);
        console.log('Removing - new array:', newArray);
        return {
          ...prevAnswers,
          [questionId]: newArray
        };
      } else {
        const newArray = [...current, value];
        console.log('Adding - new array:', newArray);
        return {
          ...prevAnswers,
          [questionId]: newArray
        };
      }
    });
  } else {
    setAnswers(prevAnswers => ({
      ...prevAnswers,
      [questionId]: value
    }));
  }
}, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate required questions
      for (const question of questions) {
        if (question.required) {
          const answer = answers[question.id];
          if (!answer || (Array.isArray(answer) && answer.length === 0)) {
            throw new Error(`Please answer: ${question.question_text}`);
          }
        }
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('You must be logged in');

      // Check if already responded (unless multiple responses allowed)
      if (!survey.allow_multiple_responses && hasResponded) {
        throw new Error('You have already responded to this survey');
      }

      // Create response record
      const { data: response, error: responseError } = await supabase
        .from('survey_responses')
        .insert({
          survey_id: survey.id,
          member_id: survey.anonymous_responses ? null : user.id
        })
        .select()
        .single();

      if (responseError) throw responseError;

      // Create answer records
      const answerInserts = questions.map(question => {
        let answerText = answers[question.id];
        
        if (question.question_type === 'multiple_choice') {
          answerText = JSON.stringify(answerText || []);
        } else if (question.question_type === 'date' && answerText) {
          answerText = new Date(answerText).toISOString();
        }

        return {
          response_id: response.id,
          question_id: question.id,
          answer_text: answerText || null
        };
      });

      const { error: answersError } = await supabase
        .from('survey_answers')
        .insert(answerInserts);

      if (answersError) throw answersError;

      alert('✅ Survey submitted successfully!');
      setShowForm(false);
      setHasResponded(true);
      loadResponseCount();

      // Show results if enabled
      if (survey.show_results_after_submission) {
        setShowResults(true);
        loadResults();
      }

    } catch (err) {
      console.error('Error submitting survey:', err);
      alert(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('⚠️ Delete this survey? This will delete all questions and responses. This action cannot be undone.')) {
      return;
    }

    try {
      setLoading(true);

      const { error } = await supabase
        .from('surveys')
        .delete()
        .eq('id', survey.id);

      if (error) throw error;

      alert('✅ Survey deleted successfully!');
      if (onDelete) onDelete();
    } catch (err) {
      console.error('Error deleting survey:', err);
      alert(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const isExpired = survey.closing_date && new Date(survey.closing_date) < new Date();
  const isClosed = survey.status === 'closed' || isExpired;
  const canTakeSurvey = !isClosed && (!hasResponded || survey.allow_multiple_responses);

  return (
    <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <h3 className="text-xl font-bold text-gray-900">{survey.title}</h3>
          {survey.description && (
            <p className="text-gray-600 mt-2">{survey.description}</p>
          )}
        </div>
        {isAdmin && (
          <button
            onClick={handleDelete}
            disabled={loading}
            className="ml-4 text-red-600 hover:text-red-700 disabled:opacity-50"
            aria-label="Delete survey"
          >
            🗑️
          </button>
        )}
      </div>

      {/* Badges */}
      <div className="flex flex-wrap gap-2">
        {isClosed ? (
          <span className="px-3 py-1 bg-gray-100 text-gray-700 text-sm font-medium rounded-full">
            🔒 Closed
          </span>
        ) : (
          <span className="px-3 py-1 bg-green-100 text-green-700 text-sm font-medium rounded-full">
            ✅ Active
          </span>
        )}
        
        {hasResponded && (
          <span className="px-3 py-1 bg-purple-100 text-purple-700 text-sm font-medium rounded-full">
            ✓ Responded
          </span>
        )}

        {survey.anonymous_responses && (
          <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm font-medium rounded-full">
            👤 Anonymous
          </span>
        )}

        <span className="px-3 py-1 bg-gray-100 text-gray-700 text-sm font-medium rounded-full">
          📊 {responseCount} {responseCount === 1 ? 'Response' : 'Responses'}
        </span>

        {questions.length > 0 && (
          <span className="px-3 py-1 bg-gray-100 text-gray-700 text-sm font-medium rounded-full">
            ❓ {questions.length} {questions.length === 1 ? 'Question' : 'Questions'}
          </span>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-2">
        {canTakeSurvey && !showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Take Survey
          </button>
        )}

        {(hasResponded || isClosed || isAdmin) && !showResults && (
          <button
            onClick={() => {
              setShowResults(true);
              loadResults();
            }}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            View Results
          </button>
        )}

        {showResults && (
          <button
            onClick={() => setShowResults(false)}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
          >
            Hide Results
          </button>
        )}
      </div>

      {/* Survey Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="border-t pt-4 space-y-6">
          {questions.map((question, index) => (
            <div key={question.id} className="space-y-2">
              <label className="block text-sm font-medium text-gray-900">
                {index + 1}. {question.question_text}
                {question.required && <span className="text-red-600 ml-1">*</span>}
              </label>

              {question.question_type === 'text' && (
                <input
                  type="text"
                  value={answers[question.id] || ''}
                  onChange={(e) => handleAnswerChange(question.id, e.target.value, 'text')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required={question.required}
                />
              )}

              {question.question_type === 'textarea' && (
                <textarea
                  value={answers[question.id] || ''}
                  onChange={(e) => handleAnswerChange(question.id, e.target.value, 'textarea')}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required={question.required}
                />
              )}

              {question.question_type === 'single_choice' && (
                <div className="space-y-2">
                  {question.options.map((option, optIndex) => (
                    <label key={optIndex} className="flex items-center">
                      <input
                        type="radio"
                        name={`question_${question.id}`}
                        value={option}
                        checked={answers[question.id] === option}
                        onChange={(e) => handleAnswerChange(question.id, e.target.value, 'single_choice')}
                        className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                        required={question.required}
                      />
                      <span className="text-sm text-gray-700">{option}</span>
                    </label>
                  ))}
                </div>
              )}

             {question.question_type === 'multiple_choice' && (
  <div className="space-y-2">
    {question.options.map((option, optIndex) => {
      const isChecked = Array.isArray(answers[question.id]) && answers[question.id].includes(option);
      const checkboxId = `q${question.id}-opt${optIndex}`;
      
      return (
        <div key={checkboxId} className="flex items-center">
          <input
            id={checkboxId}
            type="checkbox"
            checked={isChecked}
            onChange={(e) => {
              e.stopPropagation();
              const currentAnswers = Array.isArray(answers[question.id]) ? [...answers[question.id]] : [];
              let newAnswers;
              
              if (currentAnswers.includes(option)) {
                newAnswers = currentAnswers.filter(v => v !== option);
              } else {
                newAnswers = [...currentAnswers, option];
              }
              
              setAnswers(prev => ({
                ...prev,
                [question.id]: newAnswers
              }));
            }}
            className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor={checkboxId} className="text-sm text-gray-700 cursor-pointer">
            {option}
          </label>
        </div>
      );
    })}
  </div>
)}

              {question.question_type === 'rating' && (
                <div className="flex gap-4">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <label key={rating} className="flex flex-col items-center cursor-pointer">
                      <input
                        type="radio"
                        name={`question_${question.id}`}
                        value={rating}
                        checked={answers[question.id] == rating}
                        onChange={(e) => handleAnswerChange(question.id, e.target.value, 'rating')}
                        className="sr-only"
                        required={question.required}
                      />
                      <span 
                        className={`text-3xl ${
                          answers[question.id] >= rating ? 'text-yellow-400' : 'text-gray-300'
                        }`}
                      >
                        ★
                      </span>
                      <span className="text-xs text-gray-600 mt-1">{rating}</span>
                    </label>
                  ))}
                </div>
              )}

              {question.question_type === 'date' && (
                <input
                  type="date"
                  value={answers[question.id] || ''}
                  onChange={(e) => handleAnswerChange(question.id, e.target.value, 'date')}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required={question.required}
                />
              )}
            </div>
          ))}

          <div className="flex gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {loading ? 'Submitting...' : 'Submit Survey'}
            </button>
          </div>
        </form>
      )}

      {/* Results Display */}
      {showResults && (
        <div className="border-t pt-4 space-y-6">
          <h4 className="font-semibold text-gray-900">
            Survey Results ({results?.totalResponses || 0} {results?.totalResponses === 1 ? 'Response' : 'Responses'})
          </h4>

          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading results...</div>
          ) : !results || results.totalResponses === 0 ? (
            <div className="text-center py-8 text-gray-500">No responses yet</div>
          ) : (
            <div className="space-y-6">
              {results.questions.map((result, index) => (
                <div key={index} className="space-y-3">
                  <h5 className="font-medium text-gray-900">
                    {index + 1}. {result.question}
                  </h5>

                  {result.type === 'rating' && (
                    <div className="space-y-2">
                      <div className="text-2xl font-bold text-yellow-600">
                        ★ {result.average} / 5
                      </div>
                      <div className="text-sm text-gray-600">
                        Based on {result.totalRatings} rating{result.totalRatings !== 1 ? 's' : ''}
                      </div>
                      <div className="space-y-1">
                        {result.distribution.map((dist) => (
                          <div key={dist.rating} className="flex items-center gap-2">
                            <span className="w-8 text-sm text-gray-600">{dist.rating}★</span>
                            <div className="flex-1 bg-gray-200 rounded-full h-4">
                              <div
                                className="bg-yellow-400 h-4 rounded-full transition-all"
                                style={{ width: `${dist.percentage}%` }}
                              />
                            </div>
                            <span className="w-16 text-sm text-gray-600 text-right">
                              {dist.count} ({dist.percentage}%)
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {['single_choice', 'multiple_choice'].includes(result.type) && (
                    <div className="space-y-2">
                      {result.options.map((opt, optIndex) => (
                        <div key={optIndex} className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-700">{opt.option}</span>
                            <span className="text-gray-600">
                              {opt.count} ({opt.percentage}%)
                            </span>
                          </div>
                          <div className="bg-gray-200 rounded-full h-3">
                            <div
                              className="bg-blue-600 h-3 rounded-full transition-all"
                              style={{ width: `${opt.percentage}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {['text', 'textarea', 'date'].includes(result.type) && (
                    <div className="space-y-2">
                      {result.responses.length === 0 ? (
                        <p className="text-sm text-gray-500 italic">No responses</p>
                      ) : (
                        result.responses.map((response, respIndex) => (
                          <div key={respIndex} className="text-sm text-gray-700 bg-gray-50 p-3 rounded">
                            {response}
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default SurveyCard;