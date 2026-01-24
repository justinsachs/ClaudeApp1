import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { enrollmentAPI } from '../api/client'

export default function LearnerJourney() {
  const { enrollmentId } = useParams<{ enrollmentId: string }>()
  const [enrollment, setEnrollment] = useState<any>(null)
  const [progress, setProgress] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (enrollmentId) {
      loadEnrollmentData()
    }
  }, [enrollmentId])

  const loadEnrollmentData = async () => {
    try {
      setLoading(true)
      const [enrollmentRes, progressRes] = await Promise.all([
        enrollmentAPI.getById(enrollmentId!),
        enrollmentAPI.getProgress(enrollmentId!)
      ])

      setEnrollment(enrollmentRes.data.enrollment)
      setProgress(progressRes.data.progress)
    } catch (error) {
      console.error('Failed to load enrollment data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleStartSection = async (sectionId: string) => {
    try {
      const response = await enrollmentAPI.startSection(enrollmentId!, sectionId)
      alert('Section started! Welcome video: ' + response.data.welcome_video.videoAssetId)
      loadEnrollmentData()
    } catch (error: any) {
      alert('Failed to start section: ' + error.message)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'in_progress':
        return 'bg-blue-100 text-blue-800'
      case 'failed':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!enrollment) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Enrollment not found</p>
      </div>
    )
  }

  return (
    <div className="px-4 py-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Learning Journey</h1>
      <p className="text-gray-600 mb-8">Track your progress through the course</p>

      {/* Progress Overview */}
      <div className="bg-white shadow rounded-lg p-6 mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Course Progress</h2>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            enrollment.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
          }`}>
            {enrollment.status}
          </span>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>Progress</span>
            <span>
              {progress.filter((p) => p.status === 'completed').length} / {progress.length} sections
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className="bg-primary-600 h-2.5 rounded-full"
              style={{
                width: `${(progress.filter((p) => p.status === 'completed').length / progress.length) * 100}%`
              }}
            ></div>
          </div>
        </div>
      </div>

      {/* Section List */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold">Sections</h2>
        </div>

        <ul className="divide-y divide-gray-200">
          {progress.map((sectionProgress, idx) => (
            <li key={sectionProgress.id} className="px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center">
                    <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-gray-200 text-sm font-medium text-gray-600">
                      {idx + 1}
                    </span>
                    <div className="ml-4">
                      <h3 className="text-lg font-medium text-gray-900">
                        Section {idx + 1}
                      </h3>
                      <div className="mt-1 flex items-center space-x-3">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(sectionProgress.status)}`}>
                          {sectionProgress.status.replace('_', ' ')}
                        </span>
                        {sectionProgress.mastery_score !== null && (
                          <span className="text-sm text-gray-500">
                            Score: {(sectionProgress.mastery_score * 100).toFixed(0)}%
                          </span>
                        )}
                        {sectionProgress.attempts > 0 && (
                          <span className="text-sm text-gray-500">
                            Attempts: {sectionProgress.attempts}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  {sectionProgress.status === 'not_started' && (
                    <button
                      onClick={() => handleStartSection(sectionProgress.section_id)}
                      className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 text-sm font-medium"
                    >
                      Start Section
                    </button>
                  )}
                  {sectionProgress.status === 'in_progress' && (
                    <button
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
                    >
                      Continue
                    </button>
                  )}
                  {sectionProgress.status === 'completed' && (
                    <svg className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Info Box */}
      <div className="mt-8 bg-blue-50 border-l-4 border-blue-400 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-blue-700">
              Each section includes a welcome video, instructional content from NotebookLM,
              assessments to verify your understanding, and a wrap-up video. Take your time
              and complete each section before moving to the next.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
