import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import CourseCreator from './pages/CourseCreator'
import CourseList from './pages/CourseList'
import LearnerJourney from './pages/LearnerJourney'
import LearnerList from './pages/LearnerList'
import SourceManager from './pages/SourceManager'
import SectionLearning from './pages/SectionLearning'

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        {/* Navigation */}
        <nav className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex">
                <div className="flex-shrink-0 flex items-center">
                  <h1 className="text-xl font-bold text-primary-600">AI Course Platform</h1>
                </div>
                <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                  <Link
                    to="/"
                    className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                  >
                    Dashboard
                  </Link>
                  <Link
                    to="/courses"
                    className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                  >
                    Courses
                  </Link>
                  <Link
                    to="/learners"
                    className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                  >
                    Learners
                  </Link>
                  <Link
                    to="/sources"
                    className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                  >
                    Sources
                  </Link>
                  <Link
                    to="/create-course"
                    className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                  >
                    Create Course
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/courses" element={<CourseList />} />
            <Route path="/learners" element={<LearnerList />} />
            <Route path="/sources" element={<SourceManager />} />
            <Route path="/create-course" element={<CourseCreator />} />
            <Route path="/learn/:enrollmentId" element={<LearnerJourney />} />
            <Route path="/learn/:enrollmentId/section/:sectionId" element={<SectionLearning />} />
          </Routes>
        </main>
      </div>
    </Router>
  )
}

export default App
