import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactPlayer from 'react-player';
import {
  PlayCircleIcon,
  CheckCircleIcon,
  BookOpenIcon,
  MicrophoneIcon,
  VideoCameraIcon,
  ChevronRightIcon,
  ChevronLeftIcon
} from '@heroicons/react/24/outline';

interface SectionData {
  id: string;
  title: string;
  description: string;
  order_index: number;
  is_critical: boolean;
}

type LearningPhase = 'welcome' | 'calibration' | 'instruction' | 'assessment' | 'remediation' | 'wrapup' | 'complete';

export default function SectionLearning() {
  const { enrollmentId, sectionId } = useParams<{ enrollmentId: string; sectionId: string }>();
  const navigate = useNavigate();

  const [phase, setPhase] = useState<LearningPhase>('welcome');
  const [section, setSection] = useState<SectionData | null>(null);
  const [welcomeVideo, setWelcomeVideo] = useState<string | null>(null);
  const [wrapupVideo, setWrapupVideo] = useState<string | null>(null);
  const [instructionTab, setInstructionTab] = useState<'video' | 'podcast' | 'summary'>('video');
  const [assessmentAnswers, setAssessmentAnswers] = useState<Record<string, string>>({});
  const [showFeedback, setShowFeedback] = useState(false);
  const [passed, setPassed] = useState(false);

  // Mock data - replace with actual API calls
  const mockInstruction = {
    videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', // Replace with actual video
    podcastUrl: 'https://example.com/podcast.mp3',
    summary: `# Introduction to Property Valuation

## Key Concepts

Property valuation is the process of determining the economic value of real estate. Understanding valuation is essential for making informed decisions in real estate transactions.

### Core Valuation Methods

1. **Comparative Market Analysis (CMA)**
   - Compare similar properties
   - Adjust for differences
   - Determine fair market value

2. **Income Approach**
   - Calculate potential income
   - Apply capitalization rate
   - Determine investment value

3. **Cost Approach**
   - Estimate land value
   - Calculate replacement cost
   - Account for depreciation

### Important Considerations

- Market conditions affect all valuations
- Location is paramount
- Condition and improvements matter
- Timing of the valuation is crucial

### Practical Applications

You'll use these valuation methods to:
- List properties competitively
- Advise buyers on offers
- Negotiate effectively
- Understand market trends`
  };

  const mockAssessment = {
    question: "What is the primary advantage of using the Comparative Market Analysis (CMA) method for property valuation?",
    options: [
      "It's the most accurate method for unique properties",
      "It uses recent, real market data from similar properties",
      "It requires the least amount of information",
      "It works best for commercial properties"
    ],
    correctIndex: 1
  };

  useEffect(() => {
    // Load section data
    // In production, fetch from API
    setSection({
      id: sectionId || '1',
      title: 'Introduction to Property Valuation',
      description: 'Learn the fundamental methods of valuing real estate',
      order_index: 0,
      is_critical: false
    });
  }, [sectionId]);

  const handleStartSection = async () => {
    // In production, call API to start section and generate welcome video
    setPhase('calibration');
  };

  const handleSubmitCalibration = () => {
    setPhase('instruction');
  };

  const handleCompleteInstruction = () => {
    setPhase('assessment');
  };

  const handleSubmitAssessment = () => {
    // Check answer
    const userAnswer = assessmentAnswers['q1'];
    const correct = userAnswer === mockAssessment.options[mockAssessment.correctIndex];

    setPassed(correct);
    setShowFeedback(true);

    if (correct) {
      setTimeout(() => {
        setPhase('wrapup');
      }, 2000);
    } else {
      setTimeout(() => {
        setPhase('remediation');
      }, 2000);
    }
  };

  const handleCompleteRemediation = () => {
    setPhase('assessment');
    setShowFeedback(false);
    setAssessmentAnswers({});
  };

  const handleCompleteSection = () => {
    setPhase('complete');
  };

  const getPhaseProgress = () => {
    const phases: LearningPhase[] = ['welcome', 'calibration', 'instruction', 'assessment', 'wrapup', 'complete'];
    const currentIndex = phases.indexOf(phase);
    return ((currentIndex + 1) / phases.length) * 100;
  };

  if (!section) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Header with Progress */}
      <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{section.title}</h1>
              <p className="text-sm text-gray-500 mt-1">{section.description}</p>
            </div>
            {section.is_critical && (
              <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">
                Critical Section
              </span>
            )}
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-primary-500 to-purple-500 h-3 rounded-full transition-all duration-500"
              style={{ width: `${getPhaseProgress()}%` }}
            />
          </div>

          <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
            <span className="capitalize font-medium">{phase.replace('_', ' ')}</span>
            <span>{Math.round(getPhaseProgress())}% Complete</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Phase */}
        {phase === 'welcome' && (
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-primary-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <PlayCircleIcon className="h-12 w-12 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Welcome to {section.title}!</h2>
            <p className="text-lg text-gray-600 mb-8">
              Get ready to learn about property valuation methods and how to apply them in real-world situations.
            </p>

            {/* Mock welcome video would go here */}
            <div className="bg-gray-900 rounded-xl aspect-video mb-6 flex items-center justify-center">
              <PlayCircleIcon className="h-24 w-24 text-white opacity-50" />
            </div>

            <button
              onClick={handleStartSection}
              className="px-8 py-4 bg-gradient-to-r from-primary-600 to-purple-600 text-white rounded-xl hover:from-primary-700 hover:to-purple-700 transition-all font-semibold text-lg shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              Start Learning
            </button>
          </div>
        )}

        {/* Calibration Phase */}
        {phase === 'calibration' && (
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Quick Check-In</h2>
            <p className="text-gray-600 mb-8">
              Let's understand your current knowledge to personalize your learning experience.
            </p>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Have you worked with property valuations before?
                </label>
                <select className="w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500">
                  <option>No experience</option>
                  <option>Some experience</option>
                  <option>Extensive experience</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  What's your main goal for this section?
                </label>
                <textarea
                  rows={3}
                  className="w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  placeholder="e.g., I want to understand how to price properties correctly..."
                />
              </div>

              <button
                onClick={handleSubmitCalibration}
                className="w-full py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Instruction Phase */}
        {phase === 'instruction' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
              {/* Tabs */}
              <div className="border-b border-gray-200 bg-gray-50">
                <div className="flex space-x-8 px-8">
                  <button
                    onClick={() => setInstructionTab('video')}
                    className={`py-4 border-b-2 font-medium text-sm transition-colors ${
                      instructionTab === 'video'
                        ? 'border-primary-500 text-primary-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <VideoCameraIcon className="h-5 w-5 inline mr-2" />
                    Video Explanation
                  </button>
                  <button
                    onClick={() => setInstructionTab('podcast')}
                    className={`py-4 border-b-2 font-medium text-sm transition-colors ${
                      instructionTab === 'podcast'
                        ? 'border-primary-500 text-primary-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <MicrophoneIcon className="h-5 w-5 inline mr-2" />
                    Podcast
                  </button>
                  <button
                    onClick={() => setInstructionTab('summary')}
                    className={`py-4 border-b-2 font-medium text-sm transition-colors ${
                      instructionTab === 'summary'
                        ? 'border-primary-500 text-primary-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <BookOpenIcon className="h-5 w-5 inline mr-2" />
                    Written Summary
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-8">
                {instructionTab === 'video' && (
                  <div>
                    <div className="aspect-video bg-gray-900 rounded-xl overflow-hidden mb-4">
                      <ReactPlayer
                        url={mockInstruction.videoUrl}
                        width="100%"
                        height="100%"
                        controls
                      />
                    </div>
                    <p className="text-sm text-gray-500">
                      Watch this comprehensive video explanation from NotebookLM
                    </p>
                  </div>
                )}

                {instructionTab === 'podcast' && (
                  <div>
                    <div className="bg-gradient-to-br from-purple-500 to-indigo-500 rounded-xl p-12 text-center text-white mb-4">
                      <MicrophoneIcon className="h-16 w-16 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold mb-2">Audio Walkthrough</h3>
                      <p className="text-purple-100 mb-6">
                        Listen to a podcast-style explanation
                      </p>
                      <audio controls className="w-full">
                        <source src={mockInstruction.podcastUrl} type="audio/mpeg" />
                      </audio>
                    </div>
                    <p className="text-sm text-gray-500">
                      Listen on the go or while taking notes
                    </p>
                  </div>
                )}

                {instructionTab === 'summary' && (
                  <div className="prose max-w-none">
                    <div
                      className="markdown-content"
                      dangerouslySetInnerHTML={{
                        __html: mockInstruction.summary.replace(/\n/g, '<br/>')
                      }}
                    />
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={handleCompleteInstruction}
              className="w-full py-4 bg-gradient-to-r from-primary-600 to-purple-600 text-white rounded-xl hover:from-primary-700 hover:to-purple-700 transition-all font-semibold text-lg shadow-lg"
            >
              I'm Ready for Assessment
              <ChevronRightIcon className="h-5 w-5 inline ml-2" />
            </button>
          </div>
        )}

        {/* Assessment Phase */}
        {phase === 'assessment' && (
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Knowledge Check</h2>
            <p className="text-gray-600 mb-8">
              Let's verify your understanding of the material
            </p>

            <div className="space-y-6">
              <div>
                <p className="font-medium text-gray-900 mb-4">{mockAssessment.question}</p>

                <div className="space-y-3">
                  {mockAssessment.options.map((option, index) => (
                    <label
                      key={index}
                      className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        assessmentAnswers['q1'] === option
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="q1"
                        value={option}
                        checked={assessmentAnswers['q1'] === option}
                        onChange={(e) => setAssessmentAnswers({ ...assessmentAnswers, q1: e.target.value })}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500"
                      />
                      <span className="ml-3 text-gray-900">{option}</span>
                    </label>
                  ))}
                </div>
              </div>

              {showFeedback && (
                <div className={`p-4 rounded-lg ${passed ? 'bg-green-50 border-2 border-green-200' : 'bg-red-50 border-2 border-red-200'}`}>
                  <div className="flex items-start">
                    {passed ? (
                      <CheckCircleIcon className="h-6 w-6 text-green-600 mr-3 flex-shrink-0" />
                    ) : (
                      <svg className="h-6 w-6 text-red-600 mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    )}
                    <div>
                      <p className={`font-medium ${passed ? 'text-green-800' : 'text-red-800'}`}>
                        {passed ? 'Correct!' : 'Not quite right'}
                      </p>
                      <p className={`text-sm mt-1 ${passed ? 'text-green-700' : 'text-red-700'}`}>
                        {passed
                          ? 'You\'ve demonstrated excellent understanding of the Comparative Market Analysis method.'
                          : 'The CMA method\'s strength is that it uses recent, real market data. Let\'s review this concept.'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <button
                onClick={handleSubmitAssessment}
                disabled={!assessmentAnswers['q1'] || showFeedback}
                className="w-full py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
              >
                Submit Answer
              </button>
            </div>
          </div>
        )}

        {/* Remediation Phase */}
        {phase === 'remediation' && (
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Let's Review</h2>

            <div className="bg-blue-50 border-l-4 border-blue-500 p-6 mb-6">
              <h3 className="font-semibold text-blue-900 mb-2">Step-by-Step Explanation</h3>
              <p className="text-blue-800 mb-4">
                The Comparative Market Analysis (CMA) is powerful because it uses real, recent data from similar properties that have actually sold. This makes it more reliable than theoretical calculations.
              </p>

              <div className="space-y-3 text-blue-900">
                <div className="flex items-start">
                  <span className="font-bold mr-2">1.</span>
                  <span>Find similar properties that recently sold</span>
                </div>
                <div className="flex items-start">
                  <span className="font-bold mr-2">2.</span>
                  <span>Adjust for differences (size, condition, location)</span>
                </div>
                <div className="flex items-start">
                  <span className="font-bold mr-2">3.</span>
                  <span>Determine a fair price range based on actual market activity</span>
                </div>
              </div>
            </div>

            <button
              onClick={handleCompleteRemediation}
              className="w-full py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
            >
              Try Assessment Again
            </button>
          </div>
        )}

        {/* Wrap-up Phase */}
        {phase === 'wrapup' && (
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <CheckCircleIcon className="h-20 w-20 text-green-500 mx-auto mb-6" />
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Excellent Work!</h2>

            {/* Mock wrap-up video */}
            <div className="bg-gray-900 rounded-xl aspect-video mb-6 flex items-center justify-center">
              <PlayCircleIcon className="h-24 w-24 text-white opacity-50" />
            </div>

            <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-6 mb-6">
              <h3 className="font-semibold text-gray-900 mb-3">Key Takeaways</h3>
              <ul className="text-left space-y-2 text-gray-700">
                <li className="flex items-start">
                  <CheckCircleIcon className="h-5 w-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                  <span>You now understand the three main valuation methods</span>
                </li>
                <li className="flex items-start">
                  <CheckCircleIcon className="h-5 w-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                  <span>You can identify when to use each method</span>
                </li>
                <li className="flex items-start">
                  <CheckCircleIcon className="h-5 w-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                  <span>You're ready to apply these concepts in practice</span>
                </li>
              </ul>
            </div>

            <button
              onClick={handleCompleteSection}
              className="px-8 py-4 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-xl hover:from-green-700 hover:to-blue-700 transition-all font-semibold text-lg shadow-lg"
            >
              Complete Section
            </button>
          </div>
        )}

        {/* Complete Phase */}
        {phase === 'complete' && (
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircleIcon className="h-16 w-16 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Section Complete!</h2>
            <p className="text-lg text-gray-600 mb-8">
              You've successfully mastered {section.title}
            </p>

            <div className="flex gap-4 justify-center">
              <button
                onClick={() => navigate(`/learn/${enrollmentId}`)}
                className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
              >
                Back to Course
              </button>
              <button
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                Next Section
                <ChevronRightIcon className="h-5 w-5 inline ml-2" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
