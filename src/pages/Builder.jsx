import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { getProject, createProject, updateProject } from '../lib/database'

function Builder() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, signOut } = useAuth()

  const [projectTitle, setProjectTitle] = useState('')
  const [businessName, setBusinessName] = useState('')
  const [businessType, setBusinessType] = useState('')
  const [tagline, setTagline] = useState('')
  const [description, setDescription] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState('modern')
  
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  useEffect(() => {
    if (id) {
      loadProject()
    }
  }, [id])

  const loadProject = async () => {
    try {
      setLoading(true)
      const project = await getProject(id)
      
      setProjectTitle(project.title)
      setBusinessName(project.content.businessName || '')
      setBusinessType(project.content.businessType || '')
      setTagline(project.content.tagline || '')
      setDescription(project.content.description || '')
      setSelectedTemplate(project.content.template || 'modern')
    } catch (err) {
      setError('Failed to load project')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!projectTitle.trim()) {
      setError('Please enter a project title')
      return
    }

    if (!businessName.trim()) {
      setError('Please enter a business name')
      return
    }

    try {
      setSaving(true)
      setError('')
      setSuccessMessage('')

      const content = {
        businessName,
        businessType,
        tagline,
        description,
        template: selectedTemplate,
      }

      if (id) {
        await updateProject(id, projectTitle, content)
        setSuccessMessage('Project updated successfully!')
      } else {
        const newProject = await createProject(projectTitle, content)
        setSuccessMessage('Project saved successfully!')
        
        setTimeout(() => {
          navigate(`/builder/${newProject.id}`)
        }, 1000)
      }
    } catch (err) {
      setError('Failed to save project')
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const handleSignOut = async () => {
    try {
      await signOut()
      navigate('/login')
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  const templates = [
    { id: 'modern', name: 'Modern', color: 'bg-blue-500' },
    { id: 'classic', name: 'Classic', color: 'bg-gray-700' },
    { id: 'vibrant', name: 'Vibrant', color: 'bg-purple-500' },
  ]

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div 
            className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"
            role="status"
            aria-label="Loading"
          />
          <p className="mt-4 text-gray-600">Loading project...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/projects')}
                className="text-gray-600 hover:text-gray-900 focus:outline-none focus:underline"
                aria-label="Back to projects"
              >
                ← Back to Projects
              </button>
              <h1 className="text-2xl font-bold text-gray-900">
                {id ? 'Edit Project' : 'New Project'}
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <p className="text-gray-600">{user?.email}</p>
              <button
                onClick={handleSignOut}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Website Details
            </h2>

            {error && (
              <div 
                className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-4"
                role="alert"
                aria-live="polite"
              >
                {error}
              </div>
            )}

            {successMessage && (
              <div 
                className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg mb-4"
                role="alert"
                aria-live="polite"
              >
                {successMessage}
              </div>
            )}

            <div className="space-y-6">
              <div>
                <label 
                  htmlFor="projectTitle"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Project Title *
                </label>
                <input
                  id="projectTitle"
                  type="text"
                  value={projectTitle}
                  onChange={(e) => setProjectTitle(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="My Awesome Website"
                  required
                  aria-required="true"
                />
              </div>

              <div>
                <label 
                  htmlFor="businessName"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Business Name *
                </label>
                <input
                  id="businessName"
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Acme Corporation"
                  required
                  aria-required="true"
                />
              </div>

              <div>
                <label 
                  htmlFor="businessType"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Business Type
                </label>
                <input
                  id="businessType"
                  type="text"
                  value={businessType}
                  onChange={(e) => setBusinessType(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="E-commerce, Restaurant, Portfolio, etc."
                />
              </div>

              <div>
                <label 
                  htmlFor="tagline"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Tagline
                </label>
                <input
                  id="tagline"
                  type="text"
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Your catchy tagline here"
                />
              </div>

              <div>
                <label 
                  htmlFor="description"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Description
                </label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  placeholder="Describe your business..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Choose Template
                </label>
                <div className="grid grid-cols-3 gap-4">
                  {templates.map((template) => (
                    <button
                      key={template.id}
                      type="button"
                      onClick={() => setSelectedTemplate(template.id)}
                      className={
                        selectedTemplate === template.id
                          ? 'p-4 rounded-lg border-2 border-blue-500 ring-2 ring-blue-200 transition-all'
                          : 'p-4 rounded-lg border-2 border-gray-200 hover:border-gray-300 transition-all'
                      }
                      aria-pressed={selectedTemplate === template.id}
                      aria-label={`Select ${template.name} template`}
                    >
                      <div className={`${template.color} h-20 rounded mb-2`} />
                      <p className="text-sm font-medium text-gray-900">
                        {template.name}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full bg-blue-600 text-white font-semibold py-3 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                aria-busy={saving}
              >
                {saving ? 'Saving...' : id ? 'Update Project' : 'Save Project'}
              </button>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Preview
            </h2>

            <div className="border-2 border-gray-200 rounded-lg p-8 min-h-[500px]">
              <div className={
                selectedTemplate === 'modern' 
                  ? 'bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg p-8'
                  : selectedTemplate === 'classic' 
                  ? 'bg-gray-50 rounded-lg p-8'
                  : 'bg-gradient-to-br from-purple-50 to-pink-100 rounded-lg p-8'
              }>
                <h1 className="text-4xl font-bold text-gray-900 mb-4">
                  {businessName || 'Your Business Name'}
                </h1>
                
                {tagline && (
                  <p className="text-xl text-gray-600 mb-6 italic">
                    {tagline}
                  </p>
                )}

                {businessType && (
                  <p className="text-sm font-medium text-gray-500 mb-4 uppercase tracking-wide">
                    {businessType}
                  </p>
                )}

                {description && (
                  <p className="text-gray-700 leading-relaxed">
                    {description}
                  </p>
                )}

                {!businessName && !tagline && !description && (
                  <p className="text-gray-400 italic">
                    Fill in the form to see your website preview...
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default Builder