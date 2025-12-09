import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Edit3, Trash2, Plus, FileText, Search, X } from "lucide-react";
import { db, auth } from "../../../firebase";
import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";

const CreateSurveysAPI = ({ profile, onProfileEdit, onLogout }) => {
  const [surveyName, setSurveyName] = useState("");
  const [questions, setQuestions] = useState([]);
  const [surveys, setSurveys] = useState([]);
  const [selectedQuestions, setSelectedQuestions] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [surveySearchQuery, setSurveySearchQuery] = useState("");
  const [filterTab, setFilterTab] = useState("all");
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Edit modal states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingSurvey, setEditingSurvey] = useState(null);
  const [editFormData, setEditFormData] = useState({
    name: "",
    questions: [],
  });

  // Delete modal states
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [surveyToDelete, setSurveyToDelete] = useState(null);

  useEffect(() => {
    loadQuestions();
    loadSurveys();
  }, []);

  const getClientId = async () => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return null;

      const clientsRef = collection(
        db,
        "superadmin",
        "hdXje7ZvCbj7eOugVLiZ",
        "clients"
      );
      const snapshot = await getDocs(clientsRef);

      let clientDocId = null;
      snapshot.forEach((doc) => {
        const data = doc.data();
        if (data.email === currentUser.email) {
          clientDocId = doc.id;
        }
      });

      return clientDocId;
    } catch (error) {
      console.error("Error getting client ID:", error);
      return null;
    }
  };

  const loadQuestions = async () => {
    try {
      const clientId = await getClientId();
      if (!clientId) {
        console.error("No client ID found for current user");
        return;
      }

      const questionsRef = collection(
        db,
        "superadmin",
        "hdXje7ZvCbj7eOugVLiZ",
        "clients",
        clientId,
        "questions"
      );
      const snapshot = await getDocs(questionsRef);
      const questionsList = [];
      snapshot.forEach((doc) => {
        questionsList.push({
          id: doc.id,
          ...doc.data(),
        });
      });
      setQuestions(questionsList);
    } catch (error) {
      console.error("Error loading questions:", error);
    }
  };

  const loadSurveys = async () => {
    try {
      const clientId = await getClientId();
      if (!clientId) {
        console.error("No client ID found for current user");
        return;
      }

      const surveysRef = collection(
        db,
        "superadmin",
        "hdXje7ZvCbj7eOugVLiZ",
        "clients",
        clientId,
        "surveys"
      );
      const snapshot = await getDocs(surveysRef);
      const surveysList = [];
      snapshot.forEach((doc) => {
        surveysList.push({
          id: doc.id,
          ...doc.data(),
        });
      });
      setSurveys(surveysList);
    } catch (error) {
      console.error("Error loading surveys:", error);
    }
  };

  const handleCreateSurvey = async (e) => {
    e.preventDefault();

    if (!surveyName.trim() || selectedQuestions.length === 0) {
      setMessage("Please enter survey name and select at least one question");
      return;
    }

    try {
      setLoading(true);
      const clientId = await getClientId();
      if (!clientId) {
        throw new Error("No client ID found for current user");
      }

      const surveysRef = collection(
        db,
        "superadmin",
        "hdXje7ZvCbj7eOugVLiZ",
        "clients",
        clientId,
        "surveys"
      );

      const surveyData = {
        name: surveyName.trim(),
        questions: selectedQuestions,
        questionCount: selectedQuestions.length,
        createdAt: new Date().toISOString(),
        createdBy: profile?.email || "admin@example.com",
      };

      await addDoc(surveysRef, surveyData);

      setSurveyName("");
      setSelectedQuestions([]);
      setShowCreateForm(false);
      setMessage("Survey created successfully!");
      setTimeout(() => setMessage(""), 3000);

      await loadSurveys();
    } catch (error) {
      console.error("Error creating survey:", error);
      setMessage("Failed to create survey");
      setTimeout(() => setMessage(""), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (survey) => {
    setEditingSurvey(survey);
    setEditFormData({
      name: survey.name,
      questions: survey.questions || [],
    });
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      const clientId = await getClientId();
      if (!clientId) {
        throw new Error("No client ID found for current user");
      }

      const surveyRef = doc(
        db,
        "superadmin",
        "hdXje7ZvCbj7eOugVLiZ",
        "clients",
        clientId,
        "surveys",
        editingSurvey.id
      );

      await updateDoc(surveyRef, {
        name: editFormData.name,
        questions: editFormData.questions,
        questionCount: editFormData.questions.length,
        updatedAt: new Date().toISOString(),
      });

      setIsEditModalOpen(false);
      setEditingSurvey(null);
      setMessage("Survey updated successfully!");
      setTimeout(() => setMessage(""), 3000);

      await loadSurveys();
    } catch (error) {
      console.error("Error updating survey:", error);
      setMessage("Failed to update survey");
      setTimeout(() => setMessage(""), 3000);
    } finally {
      setLoading(false);
    }
  };

  const openDeleteModal = (survey) => {
    setSurveyToDelete(survey);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (surveyToDelete) {
      try {
        const clientId = await getClientId();
        if (!clientId) {
          throw new Error("No client ID found for current user");
        }

        const surveyRef = doc(
          db,
          "superadmin",
          "hdXje7ZvCbj7eOugVLiZ",
          "clients",
          clientId,
          "surveys",
          surveyToDelete.id
        );
        await deleteDoc(surveyRef);

        setMessage("Survey deleted successfully!");
        setTimeout(() => setMessage(""), 3000);

        await loadSurveys();
      } catch (error) {
        console.error("Error deleting survey:", error);
        setMessage("Failed to delete survey");
        setTimeout(() => setMessage(""), 3000);
      }
    }
    setIsDeleteModalOpen(false);
    setSurveyToDelete(null);
  };

  const cancelDelete = () => {
    setIsDeleteModalOpen(false);
    setSurveyToDelete(null);
  };

  const toggleQuestionSelection = (questionId) => {
    setSelectedQuestions((prev) =>
      prev.includes(questionId)
        ? prev.filter((id) => id !== questionId)
        : [...prev, questionId]
    );
  };

  const toggleEditQuestionSelection = (questionId) => {
    setEditFormData((prev) => ({
      ...prev,
      questions: prev.questions.includes(questionId)
        ? prev.questions.filter((id) => id !== questionId)
        : [...prev.questions, questionId],
    }));
  };

  const getFilteredSurveys = () => {
    let filtered = surveys;

    if (surveySearchQuery) {
      filtered = filtered.filter(s =>
        s.name.toLowerCase().includes(surveySearchQuery.toLowerCase())
      );
    }

    return filtered.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  };

  const filteredSurveys = getFilteredSurveys();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
            Survey Management
          </h1>
          <p className="text-slate-600 text-sm sm:text-base mt-1 sm:mt-2">
            Create and manage surveys
          </p>
        </div>
        <Button
          onClick={() => setShowCreateForm(true)}
          className="bg-slate-900 hover:bg-slate-800 h-10 sm:h-11 px-4 sm:px-6 w-full sm:w-auto"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create New Survey
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-6 sm:mb-8">
        <div className="bg-white p-3 sm:p-4 rounded-lg border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">
                Total Surveys
              </p>
              <p className="text-lg sm:text-xl font-bold text-slate-900 mt-1">
                {surveys.length}
              </p>
            </div>
            <div className="bg-blue-50 p-2 rounded-lg">
              <FileText className="w-4 h-4 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-3 sm:p-4 rounded-lg border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">
                Total Questions
              </p>
              <p className="text-lg sm:text-xl font-bold text-green-600 mt-1">
                {questions.length}
              </p>
            </div>
            <div className="bg-green-50 p-2 rounded-lg">
              <FileText className="w-4 h-4 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {message && (
        <div
          className={`mb-6 p-4 rounded-lg border ${
            message.includes("success")
              ? "bg-green-50 text-green-700 border-green-200"
              : "bg-red-50 text-red-700 border-red-200"
          }`}
        >
          {message}
        </div>
      )}

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
                All Surveys ({surveys.length})
              </button>
            </div>
            <div className="relative flex-shrink-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                type="text"
                placeholder="Search..."
                value={surveySearchQuery}
                onChange={(e) => setSurveySearchQuery(e.target.value)}
                className="pl-9 h-9 w-48"
              />
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-6">
          <div className="space-y-3">
            {loading && <p className="text-center py-12 text-slate-600">Loading surveys...</p>}
            {!loading && filteredSurveys.length === 0 && (
              <p className="text-center py-12 text-slate-500">No surveys found</p>
            )}
            {!loading && filteredSurveys.map((survey) => (
              <div key={survey.id} className="border border-slate-200 rounded-lg p-5 bg-white hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="font-semibold text-slate-900">{survey.name}</p>
                    <div className="flex items-center gap-4 mt-2">
                      <span className="text-sm text-slate-600">
                        Questions: <span className="font-medium">{survey.questionCount || 0}</span>
                      </span>
                      <span className="text-sm text-slate-600">
                        Created: <span className="font-medium">{new Date(survey.createdAt).toLocaleDateString()}</span>
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(survey)}
                      className="h-8 w-8 p-0"
                    >
                      <Edit3 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openDeleteModal(survey)}
                      className="h-8 w-8 p-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Create Survey Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white">
              <h2 className="text-xl font-bold text-slate-900">
                Create New Survey
              </h2>
              <button
                onClick={() => {
                  setShowCreateForm(false);
                  setSurveyName("");
                  setSelectedQuestions([]);
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6">
              <form onSubmit={handleCreateSurvey} className="space-y-4">
                <div>
                  <Label htmlFor="surveyName" className="text-slate-700 font-medium">
                    Survey Name *
                  </Label>
                  <Input
                    id="surveyName"
                    type="text"
                    value={surveyName}
                    onChange={(e) => setSurveyName(e.target.value)}
                    required
                    className="mt-1.5"
                    placeholder="Enter survey name"
                  />
                </div>

                <div>
                  <Label className="text-slate-700 font-medium">
                    Select Questions * ({selectedQuestions.length} selected)
                  </Label>
                  <Input
                    type="text"
                    placeholder="Search questions..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="mt-1.5 mb-3"
                  />
                  <div className="border rounded-lg p-3 max-h-60 overflow-y-auto space-y-2">
                    {questions.filter(q => q.text.toLowerCase().includes(searchQuery.toLowerCase())).map((question) => (
                      <div key={question.id} className="flex items-start gap-3 p-2 hover:bg-slate-50 rounded">
                        <input
                          type="checkbox"
                          checked={selectedQuestions.includes(question.id)}
                          onChange={() => toggleQuestionSelection(question.id)}
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <p className="text-sm font-medium">{question.text}</p>
                          <p className="text-xs text-slate-500">{question.type}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowCreateForm(false);
                      setSurveyName("");
                      setSelectedQuestions([]);
                    }}
                    className="px-6"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading || selectedQuestions.length === 0}
                    className="bg-slate-900 hover:bg-slate-800 px-6"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    {loading ? "Creating..." : "Create Survey"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Survey</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div>
              <Label htmlFor="editSurveyName">Survey Name</Label>
              <Input
                id="editSurveyName"
                value={editFormData.name}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, name: e.target.value })
                }
                required
              />
            </div>

            <div>
              <Label>Select Questions ({editFormData.questions.length} selected)</Label>
              <div className="space-y-2 max-h-60 overflow-y-auto border rounded p-3 mt-2">
                {questions.map((question) => (
                  <div key={question.id} className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={editFormData.questions.includes(question.id)}
                      onChange={() => toggleEditQuestionSelection(question.id)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{question.text}</p>
                      <p className="text-xs text-gray-500">{question.type}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                type="submit"
                disabled={loading}
                className="bg-slate-900 hover:bg-slate-800"
              >
                {loading ? "Updating..." : "Update Survey"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditModalOpen(false)}
              >
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>
              Are you sure you want to delete{" "}
              <strong>{surveyToDelete?.name}</strong>?
            </p>
            <p className="text-sm text-gray-600">
              This action cannot be undone.
            </p>

            <div className="flex gap-2 pt-4">
              <Button
                onClick={confirmDelete}
                className="flex-1 bg-red-600 hover:bg-red-700"
              >
                Delete Survey
              </Button>
              <Button
                variant="outline"
                onClick={cancelDelete}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CreateSurveysAPI;
