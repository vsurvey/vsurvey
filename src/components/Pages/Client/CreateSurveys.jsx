import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Sidebar from "./AssignedSurveys"


const Surveys = () => {
  const [questions, setQuestions] = useState([
    {
      id: 1,
      text: "How satisfied are you with our product?",
      type: "Rating scale"
    },
    {
      id: 2, 
      text: "What features would you like to see improved?",
      type: "Text response"
    },
    {
      id: 3,
      text: "Would you recommend our product to others?",
      type: "Yes/No"
    },
    {
      id: 4,
      text: "How often do you use our product?",
      type: "Multiple choice",
      options: ["Daily", "Weekly", "Monthly", "Rarely"]
    },
    {
      id: 5,
      text: "When did you first start using our product?",
      type: "Date picker"
    },
    {
      id: 6,
      text: "What is your primary use case for our product?",
      type: "Text response"
    },
    {
      id: 7,
      text: "How would you rate our customer support?",
      type: "Rating scale"
    },
    {
      id: 8,
      text: "Which pricing plan are you currently on?",
      type: "Multiple choice",
      options: ["Free", "Basic", "Premium", "Enterprise"]
    },
    {
      id: 9,
      text: "Have you experienced any technical issues?",
      type: "Yes/No"
    },
    {
      id: 10,
      text: "What is your overall experience with our product?",
      type: "Text response"
    }
  ])
  const [selectedQuestions, setSelectedQuestions] = useState([])
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showSurveySelectModal, setShowSurveySelectModal] = useState(false)
  const [selectedSurveys, setSelectedSurveys] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [showPersonnelModal, setShowPersonnelModal] = useState(false)


  
  const [activeSurveys, setActiveSurveys] = useState([
    { id: 1, name: 'Customer Satisfaction Survey', date: '2024-01-15' },
    { id: 2, name: 'Product Feedback Survey', date: '2024-01-14' },
    { id: 3, name: 'Market Research Survey', date: '2024-01-13' },
    { id: 4, name: 'Employee Engagement Survey', date: '2024-01-12' },
    { id: 5, name: 'Brand Awareness Survey', date: '2024-01-11' }
  ])

  const toggleQuestionSelection = (questionId) => {
    setSelectedQuestions(prev => 
      prev.includes(questionId) 
        ? prev.filter(id => id !== questionId)
        : [...prev, questionId]
    )
  }

  const createSurvey = (name) => {
    if(selectedQuestions.length === 0) {
      alert("Please select questions to create a survey")
      return
    }

    const newSurvey = {
      id: activeSurveys.length + 1,
      name: name,
      date: new Date().toISOString().split('T')[0],
      questions: selectedQuestions
    }
    setActiveSurveys([...activeSurveys, newSurvey])
    setSelectedQuestions([])
    alert("Survey created successfully!")
  }

  return (
    <div className="flex flex-col lg:flex-row gap-4 md:gap-6 xl:px-10">
      <div className="flex-1 min-w-0">
        <div className="mb-4 md:mb-6">
          <h1 className="text-lg md:text-xl lg:text-2xl xl:text-3xl font-medium">Create New Survey</h1>
          <h1 className="text-sm md:text-base lg:text-lg text-gray-400 font-extralight mt-1">Select questions and create survey</h1>
        </div>
        
        <div className="mb-4 md:mb-6">
          <label className="block text-xs md:text-sm font-bold text-black mb-2">SURVEY NAME</label>
          <div className="flex flex-col md:flex-row gap-3 md:gap-4">
            <input
                type="text"
                placeholder="Type your survey name here"
                className="flex-1 bg-transparent text-sm md:text-base border-b-2 border-gray-300 outline-none placeholder-gray-400 focus:placeholder-transparent focus:border-black px-2 py-2"
            />
            <button 
              onClick={() => setShowCreateModal(true)}
              className="bg-black text-white px-4 py-2 rounded-[10px] text-sm whitespace-nowrap"
            >
              + Create Survey
            </button>
          </div>
        </div>
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3 md:gap-4 mb-4 md:mb-6">
          <h2 className="text-base md:text-lg lg:text-xl font-semibold">Available Questions</h2>
          <Button 
            onClick={() => setShowSurveySelectModal(true)}
            disabled={selectedQuestions.length === 0}
            className="bg-black text-white text-sm px-4 py-2"
          >
            Select Survey
          </Button>
        </div>

        <div className="space-y-3 md:space-y-4">
          {questions.map((question) => (
            <div key={question.id} className="bg-white shadow-md p-3 md:p-4 rounded">
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={selectedQuestions.includes(question.id)}
                  onChange={() => toggleQuestionSelection(question.id)}
                  className="mt-1 flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm break-words">{question.text}</p>
                  <p className="text-xs text-gray-500 mt-1">{question.type}</p>
                  {question.options && question.options.length > 0 && (
                    <div className="ml-4 mt-2">
                      {question.options.map((option, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <input type="checkbox" disabled className="flex-shrink-0" />
                          <span className="text-xs break-words">{option}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="w-full lg:w-80 lg:flex-shrink-0">
        <Sidebar />
      </div>

      {showSurveySelectModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-4 md:p-6 w-full max-w-sm md:max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm md:text-base lg:text-lg font-semibold">Select Surveys</h3>
              <button 
                onClick={() => setShowSurveySelectModal(false)}
                className="text-gray-500 hover:text-gray-700 text-lg"
              >
                ✕
              </button>
            </div>
            
            <Input
              type="text"
              placeholder="Search surveys..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="mb-4"
            />
            
            <div className="flex flex-col md:flex-row gap-2 mb-4">
              <Button 
                onClick={() => setSelectedSurveys(activeSurveys.map(s => s.id))}
                className="text-xs"
                variant="outline"
              >
                Select All
              </Button>
              <Button 
                onClick={() => setSelectedSurveys([])}
                variant="outline"
                className="text-xs"
              >
                Clear All
              </Button>
            </div>
            
            <div className="space-y-2 mb-4">
              {activeSurveys
                .filter(survey => survey.name.toLowerCase().includes(searchTerm.toLowerCase()))
                .map((survey) => (
                <div key={survey.id} className="flex items-start gap-2 p-2 md:p-3 border rounded">
                  <input
                    type="checkbox"
                    checked={selectedSurveys.includes(survey.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedSurveys([...selectedSurveys, survey.id])
                      } else {
                        setSelectedSurveys(selectedSurveys.filter(id => id !== survey.id))
                      }
                    }}
                    className="mt-1 flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-xs md:text-sm break-words">{survey.name}</p>
                    <p className="text-xs text-gray-500">{survey.date}</p>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="flex flex-col md:flex-row justify-end gap-2">
              <Button 
                onClick={() => setShowSurveySelectModal(false)}
                variant="outline"
                className="text-xs"
              >
                Cancel
              </Button>
              <Button 
                onClick={() => {
                  setShowSurveySelectModal(false)
                  setShowPersonnelModal(true)
                }}
                className="bg-black text-white text-xs"
                disabled={selectedSurveys.length === 0}
              >
                Assign ({selectedSurveys.length})
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Surveys

