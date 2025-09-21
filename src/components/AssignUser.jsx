import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

const AssignUser = () => {
  const [selectedUser, setSelectedUser] = useState("");
  const [selectedSurveys, setSelectedSurveys] = useState([]);
  const [surveyDropdownValue, setSurveyDropdownValue] = useState("");
  const [userAssignments, setUserAssignments] = useState({});

  const users = [
    { id: "john.doe", name: "John Doe" },
    { id: "jane.smith", name: "Jane Smith" },
    { id: "mike.johnson", name: "Mike Johnson" },
    { id: "sarah.wilson", name: "Sarah Wilson" },
  ];

  const surveys = [
    { id: 1, name: "Customer Satisfaction Survey" },
    { id: 2, name: "Product Feedback Survey" },
    { id: 3, name: "Market Research Survey" },
    { id: 4, name: "Employee Engagement Survey" },
    { id: 5, name: "Brand Awareness Survey" },
  ];

  const handleSurveySelection = (e) => {
    const surveyId = parseInt(e.target.value);
    if (surveyId && !selectedSurveys.includes(surveyId)) {
      setSelectedSurveys([...selectedSurveys, surveyId]);
    }
    setSurveyDropdownValue("");
  };

  const removeSurveySelection = (surveyId) => {
    setSelectedSurveys(selectedSurveys.filter((id) => id !== surveyId));
  };

  const assignSurveys = () => {
    if (selectedUser && selectedSurveys.length > 0) {
      const newAssignments = selectedSurveys.map((surveyId) => ({
        ...surveys.find((s) => s.id === surveyId),
        active: true
      }));

      setUserAssignments((prev) => ({
        ...prev,
        [selectedUser]: [
          ...(prev[selectedUser] || []),
          ...newAssignments.filter(
            (survey) =>
              !(prev[selectedUser] || []).some(
                (existing) => existing.id === survey.id
              )
          ),
        ],
      }));

      setSelectedUser("");
      setSelectedSurveys([]);
      setSurveyDropdownValue("");
    }
  };

  const toggleSurveyStatus = (userId, surveyId) => {
    setUserAssignments((prev) => ({
      ...prev,
      [userId]: prev[userId].map((survey) =>
        survey.id === surveyId
          ? { ...survey, active: !survey.active }
          : survey
      ),
    }));
  };



  return (
    <div className="w-170 flex flex-col xl:flex-col mt-4 sm:mt-8 md:mt-12 lg:mt-16 px-2 sm:px-4 md:px-15">
      <div className="flex-1">
        <div className="flex flex-col mb-4 sm:mb-6 md:mb-8">
          <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-medium">
            Assign Surveys to Users
          </h1>
          <h1 className="text-sm sm:text-base md:text-lg lg:text-x text-gray-400 font-extralight p-2">
            Select a user and assign surveys to them
          </h1>
        </div>
      </div>

      <div className="flex justify-between items-center mb-4 mt-5">
        <h2 className="text-xl font-semibold">Assignment Panel</h2>
      </div>

      {/* Assignment Form */}
      <div className="space-y-4 mb-8">
        {/* User Dropdown */}
        <div>
          <label className="block text-xs sm:text-sm font-bold text-black mb-2">
            SELECT USER
          </label>
          <Select
            value={selectedUser}
            onChange={(e) => setSelectedUser(e.target.value)}
            className="w-full p-3 sm:p-4 md:p-2 border rounded-sm text-sm sm:text-base border-gray-400 focus:outline-none focus:ring-1 focus:ring-black"
          >
            <option value="">Choose a user...</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name}
              </option>
            ))}
          </Select>
        </div>

        {/* Survey Multi-Select */}
        <div>
          <label className="block text-xs sm:text-sm font-bold text-black mb-2">
            SELECT SURVEYS
          </label>
          <Select
            value={surveyDropdownValue}
            onChange={handleSurveySelection}
            className="w-full p-3 sm:p-4 md:p-2 border rounded-sm text-sm sm:text-base border-gray-400 focus:outline-none focus:ring-1 focus:ring-black mb-2"
          >
            <option value="">Add a survey...</option>
            {surveys.map((survey) => (
              <option key={survey.id} value={survey.id}>
                {survey.name}
              </option>
            ))}
          </Select>

          {/* Selected Surveys Display */}
          {selectedSurveys.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {selectedSurveys.map((surveyId) => {
                const survey = surveys.find((s) => s.id === surveyId);
                return (
                  <Badge
                    key={surveyId}
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    {survey?.name}
                    <button
                      onClick={() => removeSurveySelection(surveyId)}
                      className="ml-1 text-xs hover:text-red-500"
                    >
                      ×
                    </button>
                  </Badge>
                );
              })}
            </div>
          )}
        </div>

        {/* Assign Button */}
        <div className="bg-black w-full text-[15px] p-2 rounded-sm flex justify-center text-white">
          <button
            onClick={assignSurveys}
            disabled={!selectedUser || selectedSurveys.length === 0}
            className="disabled:opacity-50 w-full"
          >
            Assign Survey{selectedSurveys.length > 1 ? "s" : ""}
          </button>
        </div>
      </div>
      
      {/* Right Sidebar - Assigned Surveys Panel */}
      <div className="lg:w-96 lg:shadow-lg lg:h-screen lg:fixed lg:right-0 lg:top-0 lg:z-40 lg:bg-white lg:overflow-y-auto w-full bg-transparent">
        <div className="lg:p-6 lg:mt-20 p-4 space-y-4">
          <div className="lg:flex lg:items-center lg:justify-center hidden">
            <CardTitle className="text-xl text-black font-semibold flex justify-center">
              Assigned Surveys
            </CardTitle>
            <div className="w-10"></div>
          </div>
          <div className="lg:hidden mb-4">
            <CardTitle className="text-lg font-semibold text-gray-800">
              Assigned Surveys
            </CardTitle>
          </div>
          <CardContent className="p-0">
            <div className="space-y-3">
              {Object.entries(userAssignments).map(([userId, surveys]) => {
                const user = users.find((u) => u.id === userId);
                if (!user || surveys.length === 0) return null;
                
                return (
                  <div key={userId} className="p-5 border-1 border-black rounded-lg bg-white hover:bg-gray-100 transition-colors">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                      <h4 className="font-medium text-gray-800 text-sm sm:text-base break-words flex-1">
                        {user.name}
                      </h4>
                    </div>
                    <div className="space-y-2 mt-3">
                      {surveys.map((survey) => (
                        <div key={survey.id} className="flex items-center justify-between py-1">
                          <span
                            className={`text-xs sm:text-ss text-gray-600 break-words ${
                              survey.active ? "" : "line-through text-gray-400"
                            }`}
                          >
                            {survey.name}
                          </span>
                          <Button
                            variant={survey.active ? "destructive" : "default"}
                            size="sm"
                            onClick={() => toggleSurveyStatus(userId, survey.id)}
                            className="text-xs ml-2"
                          >
                            {survey.active ? "Deactivate" : "Activate"}
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
              {Object.keys(userAssignments).length === 0 && (
                <div className="p-5 border-1 border-black rounded-lg bg-white">
                  <p className="text-gray-500 text-sm">
                    No surveys have been assigned yet
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </div>
      </div>
    </div>
  );
};

export default AssignUser;
