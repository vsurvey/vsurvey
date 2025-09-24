import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { IoMdMenu } from "react-icons/io"

const Sidebar = () => {
    const [personnel, setPersonnel] = useState([
      { id: 1, name: 'John Smith', survey: 'Customer Satisfaction', date: '2024-01-15', status: 'Active' },
      { id: 2, name: 'Sarah Johnson', survey: 'Product Feedback', date: '2024-01-14', status: 'In Progress' },
      { id: 3, name: 'Mike Wilson', survey: 'Market Research', date: '2024-01-13', status: 'Completed' }
    ])

  return (
    <div className="lg:w-90 lg:shadow-lg lg:h-screen lg:fixed lg:right-0 lg:top-0 lg:z-40 lg:bg-white lg:overflow-y-auto w-full bg-transparent">
        <div className="lg:p-4 lg:mt-20 p-4 space-y-3">
          <div className="mb-3">
            <CardTitle className="text-base lg:text-lg font-semibold text-black lg:text-center mt-5">
              Assigned Surveys
            </CardTitle>
          </div>
          <CardContent className="p-0">
            <div className="space-y-2 lg:space-y-3">
              {personnel.map((person) => (
                <div key={person.id} className="p-3 lg:p-4 border border-black rounded-lg bg-white hover:bg-gray-50 transition-colors">
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-800 text-xs lg:text-sm break-words">
                        {person.name}
                      </h4>
                      <p className="text-xs text-gray-600 mt-1 break-words">
                        {person.survey}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Created: {person.date}
                      </p>
                    </div>
                    <button className="text-base text-gray-400 hover:text-gray-600 flex-shrink-0">
                      <IoMdMenu />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </div>
    </div>
  )
}

export default Sidebar
