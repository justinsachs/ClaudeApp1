import { useState } from 'react'
import { courseAPI, sourceAPI } from '../api/client'
import { useNavigate } from 'react-router-dom'

export default function CourseCreator() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    target_learner_profile: '',
    prerequisites: '',
    estimated_duration: '',
    status: 'draft'
  })

  const [outcomes, setOutcomes] = useState<any[]>([
    { outcome_text: '', performance_verb: '', assessment_criteria: '', order_index: 0 }
  ])

  const [sections, setSections] = useState<any[]>([
    {
      title: '',
      description: '',
      is_critical: false,
      criticality_reason: '',
      estimated_duration: '',
      order_index: 0,
      objectives: [{ objective_text: '', order_index: 0 }]
    }
  ])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const coursePackage = {
        course: {
          ...formData,
          estimated_duration: formData.estimated_duration ? parseInt(formData.estimated_duration) : undefined
        },
        outcomes: outcomes.map((o, idx) => ({ ...o, order_index: idx })),
        sections: sections.map((s, idx) => ({
          section: {
            title: s.title,
            description: s.description,
            is_critical: s.is_critical,
            criticality_reason: s.criticality_reason,
            estimated_duration: s.estimated_duration ? parseInt(s.estimated_duration) : undefined,
            order_index: idx
          },
          objectives: s.objectives.map((obj: any, objIdx: number) => ({
            objective_text: obj.objective_text,
            order_index: objIdx
          })),
          sources: [] // Add source selection UI if needed
        }))
      }

      const response = await courseAPI.createPackage(coursePackage)
      alert('Course created successfully!')
      navigate('/courses')
    } catch (error: any) {
      alert('Failed to create course: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const addOutcome = () => {
    setOutcomes([...outcomes, { outcome_text: '', performance_verb: '', assessment_criteria: '', order_index: outcomes.length }])
  }

  const addSection = () => {
    setSections([...sections, {
      title: '',
      description: '',
      is_critical: false,
      criticality_reason: '',
      estimated_duration: '',
      order_index: sections.length,
      objectives: [{ objective_text: '', order_index: 0 }]
    }])
  }

  const addObjective = (sectionIdx: number) => {
    const newSections = [...sections]
    newSections[sectionIdx].objectives.push({
      objective_text: '',
      order_index: newSections[sectionIdx].objectives.length
    })
    setSections(newSections)
  }

  return (
    <div className="px-4 py-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Create New Course</h1>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Information */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Basic Information</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Course Title *</label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Description *</label>
              <textarea
                required
                rows={4}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Target Learner Profile</label>
              <input
                type="text"
                value={formData.target_learner_profile}
                onChange={(e) => setFormData({ ...formData, target_learner_profile: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Prerequisites</label>
              <input
                type="text"
                value={formData.prerequisites}
                onChange={(e) => setFormData({ ...formData, prerequisites: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Estimated Duration (minutes)</label>
              <input
                type="number"
                value={formData.estimated_duration}
                onChange={(e) => setFormData({ ...formData, estimated_duration: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              />
            </div>
          </div>
        </div>

        {/* Learning Outcomes */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Learning Outcomes</h2>
            <button
              type="button"
              onClick={addOutcome}
              className="text-sm text-primary-600 hover:text-primary-700"
            >
              + Add Outcome
            </button>
          </div>

          {outcomes.map((outcome, idx) => (
            <div key={idx} className="mb-4 p-4 border border-gray-200 rounded-md">
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Outcome Text *</label>
                  <input
                    type="text"
                    required
                    value={outcome.outcome_text}
                    onChange={(e) => {
                      const newOutcomes = [...outcomes]
                      newOutcomes[idx].outcome_text = e.target.value
                      setOutcomes(newOutcomes)
                    }}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Performance Verb *</label>
                  <input
                    type="text"
                    required
                    value={outcome.performance_verb}
                    onChange={(e) => {
                      const newOutcomes = [...outcomes]
                      newOutcomes[idx].performance_verb = e.target.value
                      setOutcomes(newOutcomes)
                    }}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Sections */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Sections</h2>
            <button
              type="button"
              onClick={addSection}
              className="text-sm text-primary-600 hover:text-primary-700"
            >
              + Add Section
            </button>
          </div>

          {sections.map((section, sIdx) => (
            <div key={sIdx} className="mb-6 p-4 border-2 border-gray-300 rounded-lg">
              <h3 className="font-medium mb-3">Section {sIdx + 1}</h3>

              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Section Title *</label>
                  <input
                    type="text"
                    required
                    value={section.title}
                    onChange={(e) => {
                      const newSections = [...sections]
                      newSections[sIdx].title = e.target.value
                      setSections(newSections)
                    }}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <textarea
                    rows={2}
                    value={section.description}
                    onChange={(e) => {
                      const newSections = [...sections]
                      newSections[sIdx].description = e.target.value
                      setSections(newSections)
                    }}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={section.is_critical}
                    onChange={(e) => {
                      const newSections = [...sections]
                      newSections[sIdx].is_critical = e.target.checked
                      setSections(newSections)
                    }}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 block text-sm text-gray-900">
                    Critical Section (safety/compliance/legal)
                  </label>
                </div>

                {section.is_critical && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Criticality Reason</label>
                    <input
                      type="text"
                      value={section.criticality_reason}
                      onChange={(e) => {
                        const newSections = [...sections]
                        newSections[sIdx].criticality_reason = e.target.value
                        setSections(newSections)
                      }}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                    />
                  </div>
                )}

                {/* Section Objectives */}
                <div className="mt-4 p-3 bg-gray-50 rounded-md">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="text-sm font-medium text-gray-700">Objectives</h4>
                    <button
                      type="button"
                      onClick={() => addObjective(sIdx)}
                      className="text-xs text-primary-600 hover:text-primary-700"
                    >
                      + Add Objective
                    </button>
                  </div>

                  {section.objectives.map((obj: any, oIdx: number) => (
                    <div key={oIdx} className="mb-2">
                      <input
                        type="text"
                        required
                        placeholder={`Objective ${oIdx + 1}`}
                        value={obj.objective_text}
                        onChange={(e) => {
                          const newSections = [...sections]
                          newSections[sIdx].objectives[oIdx].objective_text = e.target.value
                          setSections(newSections)
                        }}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Submit */}
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => navigate('/courses')}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Course'}
          </button>
        </div>
      </form>
    </div>
  )
}
