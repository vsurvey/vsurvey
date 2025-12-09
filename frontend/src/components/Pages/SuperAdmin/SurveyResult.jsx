import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  BarChart3,
  Users,
  ChevronDown,
  ChevronUp,
  Building,
  Search,
  FileText,
} from "lucide-react";
import { db } from "../../../firebase";
import { collection, getDocs, query, where } from "firebase/firestore";

const SurveyResults = () => {
  const [clients, setClients] = useState([]);
  const [expandedClient, setExpandedClient] = useState(null);
  const [clientSurveys, setClientSurveys] = useState({});
  const [loading, setLoading] = useState(false);
  const [totalSurveys, setTotalSurveys] = useState(0);
  const [totalResponses, setTotalResponses] = useState(0);
  const [filterTab, setFilterTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    try {
      setLoading(true);
      const clientsRef = collection(
        db,
        "superadmin",
        "hdXje7ZvCbj7eOugVLiZ",
        "clients"
      );
      const snapshot = await getDocs(clientsRef);
      const clientsList = [];
      let surveysCount = 0;
      let responsesCount = 0;

      for (const doc of snapshot.docs) {
        const clientData = doc.data();

        // Get surveys count for this client
        const surveysRef = collection(
          db,
          "superadmin",
          "hdXje7ZvCbj7eOugVLiZ",
          "clients",
          doc.id,
          "surveys"
        );
        const surveysSnapshot = await getDocs(surveysRef);
        const clientSurveysCount = surveysSnapshot.size;

        // Get actual responses count for this client by counting all survey responses
        let clientResponsesCount = 0;
        for (const surveyDoc of surveysSnapshot.docs) {
          const surveyResponsesRef = collection(
            db,
            "superadmin",
            "hdXje7ZvCbj7eOugVLiZ",
            "clients",
            doc.id,
            "surveys",
            surveyDoc.id,
            "responses"
          );
          const surveyResponsesSnapshot = await getDocs(surveyResponsesRef);
          clientResponsesCount += surveyResponsesSnapshot.size;
        }

        surveysCount += clientSurveysCount;
        responsesCount += clientResponsesCount;

        clientsList.push({
          id: doc.id,
          name: clientData.name || clientData.email,
          email: clientData.email,
          surveysCount: clientSurveysCount,
          responsesCount: clientResponsesCount,
        });
      }

      setClients(clientsList);
      setTotalSurveys(surveysCount);
      setTotalResponses(responsesCount);
    } catch (error) {
      console.error("Error loading clients:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleClientExpansion = async (clientId) => {
    if (expandedClient === clientId) {
      setExpandedClient(null);
    } else {
      setExpandedClient(clientId);

      // Load surveys for this client if not already loaded
      if (!clientSurveys[clientId]) {
        try {
          const surveysRef = collection(
            db,
            "superadmin",
            "hdXje7ZvCbj7eOugVLiZ",
            "clients",
            clientId,
            "surveys"
          );
          const surveysSnapshot = await getDocs(surveysRef);
          const surveys = [];

          for (const surveyDoc of surveysSnapshot.docs) {
            const surveyData = surveyDoc.data();

            // Get actual response count for this survey
            const surveyResponsesRef = collection(
              db,
              "superadmin",
              "hdXje7ZvCbj7eOugVLiZ",
              "clients",
              clientId,
              "surveys",
              surveyDoc.id,
              "responses"
            );
            const surveyResponsesSnapshot = await getDocs(surveyResponsesRef);
            const surveyResponseCount = surveyResponsesSnapshot.size;

            surveys.push({
              id: surveyDoc.id,
              name: surveyData.name,
              questionCount: surveyData.questionCount || 0,
              responses: surveyResponseCount,
              createdAt: surveyData.createdAt,
            });
          }

          setClientSurveys((prev) => ({
            ...prev,
            [clientId]: surveys,
          }));
        } catch (error) {
          console.error("Error loading client surveys:", error);
        }
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading survey results...</p>
        </div>
      </div>
    );
  }

  const clientsWithSurveys = clients.filter(c => c.surveysCount > 0);
  const clientsWithoutSurveys = clients.filter(c => c.surveysCount === 0);
  const clientsWithResponses = clients.filter(c => c.responsesCount > 0);

  const getFilteredClients = () => {
    let filtered = clients;
    
    if (filterTab === "with-surveys") {
      filtered = clientsWithSurveys;
    } else if (filterTab === "no-surveys") {
      filtered = clientsWithoutSurveys;
    } else if (filterTab === "with-responses") {
      filtered = clientsWithResponses;
    }

    if (searchQuery) {
      filtered = filtered.filter(c => 
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.email.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return filtered;
  };

  const filteredClients = getFilteredClients();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
            Survey Results
          </h1>
          <p className="text-slate-600 text-sm sm:text-base mt-1 sm:mt-2">
            View and analyze survey responses from all clients
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
        <div className="bg-white p-4 sm:p-6 rounded-lg border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-slate-500">
                Total Clients
              </p>
              <p className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
                {clients.length}
              </p>
            </div>
            <div className="bg-blue-50 p-2 sm:p-3 rounded-lg">
              <Building className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-lg border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-slate-500">
                Total Surveys
              </p>
              <p className="text-xl sm:text-2xl font-bold text-blue-600 mt-1">
                {totalSurveys}
              </p>
            </div>
            <div className="bg-blue-50 p-2 sm:p-3 rounded-lg">
              <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-lg border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-slate-500">
                Total Responses
              </p>
              <p className="text-xl sm:text-2xl font-bold text-green-600 mt-1">
                {totalResponses}
              </p>
            </div>
            <div className="bg-green-50 p-2 sm:p-3 rounded-lg">
              {/* <Users className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" /> */}
              <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-lg border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-slate-500">
                With Surveys
              </p>
              <p className="text-xl sm:text-2xl font-bold text-purple-600 mt-1">
                {clientsWithSurveys.length}
              </p>
            </div>
            <div className="bg-purple-50 p-2 sm:p-3 rounded-lg">
              <Users className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
              {/* <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" /> */}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg border border-slate-200">
        <div className="border-b border-slate-200">
          <div className="flex items-center justify-between px-4 sm:px-6 gap-4">
            <div className="flex gap-1 overflow-x-auto">
              <button
                onClick={() => setFilterTab("all")}
                className={`px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  filterTab === "all"
                    ? "border-slate-900 text-slate-900"
                    : "border-transparent text-slate-500 hover:text-slate-700"
                }`}
              >
                All ({clients.length})
              </button>
              <button
                onClick={() => setFilterTab("with-surveys")}
                className={`hidden sm:block px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  filterTab === "with-surveys"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-slate-500 hover:text-slate-700"
                }`}
              >
                With Surveys ({clientsWithSurveys.length})
              </button>
              <button
                onClick={() => setFilterTab("no-surveys")}
                className={`hidden sm:block px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  filterTab === "no-surveys"
                    ? "border-amber-600 text-amber-600"
                    : "border-transparent text-slate-500 hover:text-slate-700"
                }`}
              >
                No Surveys ({clientsWithoutSurveys.length})
              </button>
              <button
                onClick={() => setFilterTab("with-responses")}
                className={`hidden sm:block px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  filterTab === "with-responses"
                    ? "border-green-600 text-green-600"
                    : "border-transparent text-slate-500 hover:text-slate-700"
                }`}
              >
                With Responses ({clientsWithResponses.length})
              </button>
            </div>
            <div className="relative flex-shrink-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 w-48"
              />
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-6">
          <div className="space-y-3">
            {filteredClients.map((client) => {
              const isExpanded = expandedClient === client.id;
              const surveys = clientSurveys[client.id] || [];

              return (
                <div
                  key={client.id}
                  className="border border-slate-200 rounded-lg p-5 bg-white hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-center">
                    <div className="flex-1">
                      <h3 className="text-base font-semibold text-slate-900">
                        {client.name}
                      </h3>
                      <div className="flex items-center gap-4 mt-2 text-sm text-slate-600">
                        <span className="flex items-center gap-1">
                          <BarChart3 className="w-4 h-4" />
                          {client.surveysCount} Surveys
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {client.responsesCount} Responses
                        </span>
                      </div>
                    </div>
                    <Button
                      onClick={() => toggleClientExpansion(client.id)}
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-2"
                    >
                      {isExpanded ? "Hide" : "View"}
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </Button>
                  </div>

                  {/* Expanded Surveys */}
                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-slate-200">
                      <h4 className="font-semibold mb-3 text-slate-900 text-sm">
                        Surveys
                      </h4>
                      {surveys.length > 0 ? (
                        <div className="space-y-2">
                          {surveys.map((survey) => (
                            <div
                              key={survey.id}
                              className="bg-slate-50 p-4 rounded-lg border border-slate-200"
                            >
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <h5 className="font-medium text-slate-900 text-sm">
                                    {survey.name}
                                  </h5>
                                  <div className="flex items-center gap-3 mt-1 text-xs text-slate-600">
                                    <span>
                                      {survey.questionCount} Questions
                                    </span>
                                    <span>•</span>
                                    <span>
                                      {new Date(
                                        survey.createdAt
                                      ).toLocaleDateString()}
                                    </span>
                                  </div>
                                </div>
                                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  {survey.responses} responses
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-slate-500 text-sm">
                          No surveys found
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
            {filteredClients.length === 0 && (
              <div className="text-center py-12">
                <Building className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500">No clients found</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SurveyResults;
