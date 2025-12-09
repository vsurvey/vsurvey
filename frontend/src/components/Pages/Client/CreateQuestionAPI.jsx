import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Edit3, X, Trash2, Plus, HelpCircle, Search } from "lucide-react";
import { useQuestions } from "../../../hooks/useApi";
import authService from "../../../services/authService";
import { db, auth } from "../../../firebase";
import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";

const CreateQuestionAPI = ({
  profile,
  onProfileEdit,
  onLogout,
  onNavigateToSurveys,
}) => {
  const {
    questions,
    loading,
    error,
    setError,
    fetchQuestions,
    createQuestion,
    updateQuestion,
    deleteQuestion,
  } = useQuestions();

  const [questionText, setQuestionText] = useState("");
  const [responseType, setResponseType] = useState("");
  const [ratingScale, setRatingScale] = useState("1-5");
  const [options, setOptions] = useState([""]);
  const [message, setMessage] = useState("");
  const [firebaseQuestions, setFirebaseQuestions] = useState([]);

  // Edit modal states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [editFormData, setEditFormData] = useState({
    text: "",
    type: "",
    options: [],
    ratingScale: "1-5",
  });

  // Delete modal states
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [questionToDelete, setQuestionToDelete] = useState(null);
  const [filterTab, setFilterTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Load questions on component mount
  useEffect(() => {
    const loadQuestionsWhenReady = async () => {
      let attempts = 0;
      const maxAttempts = 10;

      while (!authService.isAuthenticated() && attempts < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, 500));
        attempts++;
      }

      if (authService.isAuthenticated()) {
        loadQuestions();
      }
    }

    loadQuestionsWhenReady();
  }, []);

  const loadQuestions = async () => {
    try {
      await fetchQuestions();
      await loadFirebaseQuestions();
    } catch (err) {
      console.error("Failed to load questions:", err);
    }
  };

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

  const loadFirebaseQuestions = async () => {
    try {
      const clientId = await getClientId();
      if (!clientId) {
        console.error("No client ID found for current user");
        return;
      }

      console.log("Loading questions for clientId:", clientId);
      const questionsRef = collection(
        db,
        "superadmin",
        "hdXje7ZvCbj7eOugVLiZ",
        "clients",
        clientId,
        "questions"
      );
      const snapshot = await getDocs(questionsRef);
      const fbQuestions = [];
      snapshot.forEach((doc) => {
        fbQuestions.push({
          id: doc.id,
          ...doc.data(),
        });
      });
      setFirebaseQuestions(fbQuestions);
    } catch (error) {
      console.error("Error loading Firebase questions:", error);
    }
  };

  const handleAddOption = () => {
    setOptions([...options, ""]);
  };

  const handleRemoveOption = (index) => {
    if (options.length > 1) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const handleOptionChange = (index, value) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!questionText.trim() || !responseType) {
      setMessage("Please fill in all required fields");
      return;
    }

    try {
      const questionData = {
        text: questionText.trim(),
        type: responseType,
        options:
          responseType === "multiple_choice"
            ? options
                .filter((opt) => opt.trim())
                .map((opt, index) => ({
                  id: `opt_${Date.now()}_${index}`,
                  text: opt.trim(),
                  order: index,
                }))
            : [],
        is_required: true,
        order: 0,
        created_by: profile?.email || "admin@example.com",
        createdAt: new Date().toISOString(),
      };

      if (responseType === "rating") {
        questionData.ratingScale = ratingScale;
      }

      // Save to Firebase in client-specific collection
      const clientId = await getClientId();
      if (!clientId) {
        throw new Error("No client ID found for current user");
      }

      console.log("Saving question for clientId:", clientId);
      const questionsRef = collection(
        db,
        "superadmin",
        "hdXje7ZvCbj7eOugVLiZ",
        "clients",
        clientId,
        "questions"
      );
      await addDoc(questionsRef, questionData);
      console.log(
        "Question saved to Firebase successfully for client:",
        clientId
      );

      // Also save to backend API
      await createQuestion(questionData);

      // Reset form
      setQuestionText("");
      setResponseType("");
      setRatingScale("1-5");
      setOptions([""]);
      setMessage("Question created successfully!");
      setTimeout(() => setMessage(""), 3000);

      // Refresh Firebase questions list
      await loadFirebaseQuestions();
    } catch (err) {
      console.error("Create question error:", err);
      setMessage(err.message || "Failed to create question");
      setTimeout(() => setMessage(""), 5000);
    }
  };

  const handleEdit = (question) => {
    setEditingQuestion(question);
    setEditFormData({
      text: question.text,
      type: question.type,
      options: question.options || [],
      ratingScale: question.ratingScale || "1-5",
    });
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();

    try {
      // Update in Firebase
      const clientId = await getClientId();
      if (!clientId) {
        throw new Error("No client ID found for current user");
      }

      const questionRef = doc(
        db,
        "superadmin",
        "hdXje7ZvCbj7eOugVLiZ",
        "clients",
        clientId,
        "questions",
        editingQuestion.id
      );
      const updateData = {
        text: editFormData.text,
        type: editFormData.type,
        options:
          editFormData.type === "multiple_choice"
            ? (editFormData.options || [])
                .filter((opt) => {
                  const text = typeof opt === "string" ? opt : opt?.text || "";
                  return text && text.trim();
                })
                .map((opt, index) => ({
                  id: `opt_${Date.now()}_${index}`,
                  text:
                    typeof opt === "string"
                      ? opt.trim()
                      : opt?.text?.trim() || "",
                  order: index,
                }))
            : [],
        updatedAt: new Date().toISOString(),
      };

      // Handle rating scale - add if rating type, remove if not
      if (editFormData.type === "rating") {
        updateData.ratingScale = editFormData.ratingScale || "1-5";
      } else if (editingQuestion.ratingScale) {
        // Use Firebase's deleteField() to completely remove the field
        const { deleteField } = await import("firebase/firestore");
        updateData.ratingScale = deleteField();
      }
      await updateDoc(questionRef, updateData);

      // Also update backend API
      await updateQuestion(editingQuestion.id, editFormData);

      setIsEditModalOpen(false);
      setEditingQuestion(null);
      setMessage("Question updated successfully!");
      setTimeout(() => setMessage(""), 3000);

      // Refresh Firebase questions list
      await loadFirebaseQuestions();
    } catch (err) {
      setMessage(err.message || "Failed to update question");
      setTimeout(() => setMessage(""), 5000);
    }
  };

  const openDeleteModal = (question) => {
    setQuestionToDelete(question);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (questionToDelete) {
      try {
        const clientId = await getClientId();
        if (!clientId) {
          throw new Error("No client ID found for current user");
        }

        // Remove question from all surveys first
        const surveysRef = collection(
          db,
          "superadmin",
          "hdXje7ZvCbj7eOugVLiZ",
          "clients",
          clientId,
          "surveys"
        );
        const surveysSnapshot = await getDocs(surveysRef);

        const updatePromises = [];
        surveysSnapshot.forEach((surveyDoc) => {
          const surveyData = surveyDoc.data();
          if (
            surveyData.questions &&
            surveyData.questions.includes(questionToDelete.id)
          ) {
            const updatedQuestions = surveyData.questions.filter(
              (qId) => qId !== questionToDelete.id
            );
            const surveyRef = doc(
              db,
              "superadmin",
              "hdXje7ZvCbj7eOugVLiZ",
              "clients",
              clientId,
              "surveys",
              surveyDoc.id
            );
            updatePromises.push(
              updateDoc(surveyRef, {
                questions: updatedQuestions,
                questionCount: updatedQuestions.length,
                updatedAt: new Date().toISOString(),
              })
            );
          }
        });

        // Wait for all survey updates to complete
        await Promise.all(updatePromises);

        // Delete from Firebase
        const questionRef = doc(
          db,
          "superadmin",
          "hdXje7ZvCbj7eOugVLiZ",
          "clients",
          clientId,
          "questions",
          questionToDelete.id
        );
        await deleteDoc(questionRef);

        // Also delete from backend API
        await deleteQuestion(questionToDelete.id);

        setMessage(
          `Question deleted successfully! Removed from ${updatePromises.length} survey(s).`
        );
        setTimeout(() => setMessage(""), 3000);

        // Refresh Firebase questions list
        await loadFirebaseQuestions();
      } catch (err) {
        setMessage(err.message || "Failed to delete question");
        setTimeout(() => setMessage(""), 5000);
      }
    }
    setIsDeleteModalOpen(false);
    setQuestionToDelete(null);
  };

  const cancelDelete = () => {
    setIsDeleteModalOpen(false);
    setQuestionToDelete(null);
  };

  const getFilteredQuestions = () => {
    let filtered = firebaseQuestions;
    
    if (filterTab !== "all") {
      filtered = firebaseQuestions.filter(q => q.type === filterTab);
    }

    if (searchQuery) {
      filtered = filtered.filter(q => 
        q.text.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return filtered.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  };

  const filteredQuestions = getFilteredQuestions();
  const totalPages = Math.ceil(filteredQuestions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedQuestions = filteredQuestions.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
            Question Management
          </h1>
          <p className="text-slate-600 text-sm sm:text-base mt-1 sm:mt-2">
            Create and manage survey questions
          </p>
        </div>
        <Button
          onClick={() => setShowCreateForm(true)}
          className="bg-slate-900 hover:bg-slate-800 h-10 sm:h-11 px-4 sm:px-6 w-full sm:w-auto"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add New Question
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4 mb-6 sm:mb-8">
        <div className="bg-white p-3 sm:p-4 rounded-lg border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">
                Total
              </p>
              <p className="text-lg sm:text-xl font-bold text-slate-900 mt-1">
                {firebaseQuestions.length}
              </p>
            </div>
            <div className="bg-blue-50 p-2 rounded-lg">
              <HelpCircle className="w-4 h-4 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-3 sm:p-4 rounded-lg border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">
                Multiple Choice
              </p>
              <p className="text-lg sm:text-xl font-bold text-green-600 mt-1">
                {firebaseQuestions.filter((q) => q.type === "multiple_choice").length}
              </p>
            </div>
            <div className="bg-green-50 p-2 rounded-lg">
              <HelpCircle className="w-4 h-4 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-3 sm:p-4 rounded-lg border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">
                Text
              </p>
              <p className="text-lg sm:text-xl font-bold text-purple-600 mt-1">
                {firebaseQuestions.filter((q) => q.type === "text").length}
              </p>
            </div>
            <div className="bg-purple-50 p-2 rounded-lg">
              <HelpCircle className="w-4 h-4 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-3 sm:p-4 rounded-lg border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">
                Rating
              </p>
              <p className="text-lg sm:text-xl font-bold text-amber-600 mt-1">
                {firebaseQuestions.filter((q) => q.type === "rating").length}
              </p>
            </div>
            <div className="bg-amber-50 p-2 rounded-lg">
              <HelpCircle className="w-4 h-4 text-amber-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-3 sm:p-4 rounded-lg border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">
                Yes/No
              </p>
              <p className="text-lg sm:text-xl font-bold text-red-600 mt-1">
                {firebaseQuestions.filter((q) => q.type === "yes_no").length}
              </p>
            </div>
            <div className="bg-red-50 p-2 rounded-lg">
              <HelpCircle className="w-4 h-4 text-red-600" />
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
                onClick={() => {
                  setFilterTab("all");
                  setCurrentPage(1);
                }}
                className={`px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  filterTab === "all"
                    ? "border-slate-900 text-slate-900"
                    : "border-transparent text-slate-500 hover:text-slate-700"
                }`}
              >
                All ({firebaseQuestions.length})
              </button>
              <button
                onClick={() => {
                  setFilterTab("multiple_choice");
                  setCurrentPage(1);
                }}
                className={`hidden sm:block px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  filterTab === "multiple_choice"
                    ? "border-green-600 text-green-600"
                    : "border-transparent text-slate-500 hover:text-slate-700"
                }`}
              >
                Multiple Choice ({firebaseQuestions.filter((q) => q.type === "multiple_choice").length})
              </button>
              <button
                onClick={() => {
                  setFilterTab("text");
                  setCurrentPage(1);
                }}
                className={`hidden sm:block px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  filterTab === "text"
                    ? "border-purple-600 text-purple-600"
                    : "border-transparent text-slate-500 hover:text-slate-700"
                }`}
              >
                Text ({firebaseQuestions.filter((q) => q.type === "text").length})
              </button>
              <button
                onClick={() => {
                  setFilterTab("rating");
                  setCurrentPage(1);
                }}
                className={`hidden sm:block px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  filterTab === "rating"
                    ? "border-amber-600 text-amber-600"
                    : "border-transparent text-slate-500 hover:text-slate-700"
                }`}
              >
                Rating ({firebaseQuestions.filter((q) => q.type === "rating").length})
              </button>
              <button
                onClick={() => {
                  setFilterTab("yes_no");
                  setCurrentPage(1);
                }}
                className={`hidden sm:block px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  filterTab === "yes_no"
                    ? "border-red-600 text-red-600"
                    : "border-transparent text-slate-500 hover:text-slate-700"
                }`}
              >
                Yes/No ({firebaseQuestions.filter((q) => q.type === "yes_no").length})
              </button>
            </div>
            <div className="relative flex-shrink-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-9 h-9 w-48"
              />
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-6">
          <div className="space-y-3">
            {loading && <p className="text-center py-12 text-slate-600">Loading questions...</p>}
            {error && <p className="text-center py-12 text-red-600">Error: {error}</p>}
            {!loading && !error && filteredQuestions.length === 0 && (
              <p className="text-center py-12 text-slate-500">No questions found</p>
            )}
            {!loading && !error && paginatedQuestions.map((question) => (
              <div key={question.id} className="border border-slate-200 rounded-lg p-5 bg-white hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="font-semibold text-slate-900">{question.text}</p>
                    <div className="flex items-center gap-4 mt-2">
                      <span className="text-sm text-slate-600">
                        Type: <span className="font-medium">{question.type.replace("_", " ")}</span>
                      </span>
                      {question.options && question.options.length > 0 && (
                        <span className="text-sm text-slate-600">
                          Options: <span className="font-medium">{question.options.length}</span>
                        </span>
                      )}
                    </div>
                    {question.options && question.options.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {question.options.slice(0, 3).map((option, idx) => (
                          <span key={idx} className="inline-flex px-2.5 py-1 text-xs font-medium rounded-full bg-slate-100 text-slate-700">
                            {typeof option === "string" ? option : option.text}
                          </span>
                        ))}
                        {question.options.length > 3 && (
                          <span className="inline-flex px-2.5 py-1 text-xs font-medium rounded-full bg-slate-100 text-slate-700">
                            +{question.options.length - 3} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(question)}
                      className="h-8 w-8 p-0"
                    >
                      <Edit3 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openDeleteModal(question)}
                      className="h-8 w-8 p-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-t border-slate-200">
              <p className="text-sm text-slate-600">
                Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredQuestions.length)} of {filteredQuestions.length} questions
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="h-8 px-3"
                >
                  Previous
                </Button>
                <div className="flex gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <Button
                      key={page}
                      variant={currentPage === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(page)}
                      className={`h-8 w-8 p-0 ${currentPage === page ? "bg-slate-900 text-white" : ""}`}
                    >
                      {page}
                    </Button>
                  ))}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="h-8 px-3"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Question</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div>
              <Label htmlFor="editQuestionText">Question Text</Label>
              <Input
                id="editQuestionText"
                value={editFormData.text}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, text: e.target.value })
                }
                required
              />
            </div>

            <div>
              <Label htmlFor="editResponseType">Response Type</Label>
              <select
                id="editResponseType"
                className="w-full p-3 border text-sm rounded-[5px] border-gray-400 focus:outline-none focus:ring-1 focus:ring-black"
                value={editFormData.type}
                onChange={(e) =>
                  setEditFormData({
                    ...editFormData,
                    type: e.target.value,
                    options:
                      e.target.value === "multiple_choice"
                        ? editFormData.options
                        : [],
                  })
                }
                required
              >
                <option value="">Select response type</option>
                <option value="multiple_choice">Multiple Choice</option>
                <option value="text">Text</option>
                <option value="rating">Rating</option>
                <option value="yes_no">Yes/No</option>
              </select>
            </div>

            {editFormData.type === "multiple_choice" && (
              <div>
                <Label>Options</Label>
                {(editFormData.options || [""]).map((option, index) => (
                  <div key={index} className="flex gap-2 mt-2">
                    <Input
                      value={
                        typeof option === "string" ? option : option.text || ""
                      }
                      onChange={(e) => {
                        const newOptions = [...(editFormData.options || [""])];
                        newOptions[index] = e.target.value;
                        setEditFormData({
                          ...editFormData,
                          options: newOptions,
                        });
                      }}
                      placeholder={`Option ${index + 1}`}
                    />
                    {(editFormData.options || [""]).length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const newOptions = (
                            editFormData.options || [""]
                          ).filter((_, i) => i !== index);
                          setEditFormData({
                            ...editFormData,
                            options: newOptions,
                          });
                        }}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const newOptions = [...(editFormData.options || [""]), ""];
                    setEditFormData({ ...editFormData, options: newOptions });
                  }}
                  className="mt-2"
                >
                  Add Option
                </Button>

                {/* Preview */}
                <div className="mt-4 p-3 bg-gray-50 rounded border">
                  <Label className="text-sm font-medium">Preview:</Label>
                  <div className="mt-2 space-y-2">
                    {(editFormData.options || [])
                      .filter((opt) => {
                        const text =
                          typeof opt === "string" ? opt : opt.text || "";
                        return text.trim();
                      })
                      .map((option, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <input type="checkbox" className="w-4 h-4" disabled />
                          <span className="text-sm">
                            {typeof option === "string" ? option : option.text}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            )}

                  {editFormData.type === "rating" && (
                    <div>
                      <Label>Rating Scale</Label>
                      <select
                        className="w-full p-3 border text-sm rounded-[5px] border-gray-400 focus:outline-none focus:ring-1 focus:ring-black mt-2"
                        value={editFormData.ratingScale || "1-5"}
                        onChange={(e) =>
                          setEditFormData({
                            ...editFormData,
                            ratingScale: e.target.value,
                          })
                        }
                      >
                        <option value="1-3">1-3 Scale</option>
                        <option value="1-5">1-5 Scale</option>
                        <option value="1-10">1-10 Scale</option>
                      </select>
      
                      {/* Preview */}
                      <div className="mt-4 p-3 bg-gray-50 rounded border">
                        <Label className="text-sm font-medium">Preview:</Label>
                        <div className="mt-2 flex gap-1">
                          {Array.from(
                            {
                              length: parseInt(
                                (editFormData.ratingScale || "1-5").split("-")[1]
                              ),
                            },
                            (_, i) => (
                              <span key={i} className="text-yellow-400 text-xl">
                                ★
                              </span>
                            )
                          )}
                        </div>
                      </div>
                    </div>
                  )}
      
                  {editFormData.type === "yes_no" && (
                    <div className="mt-4 p-3 bg-gray-50 rounded border">
                      <Label className="text-sm font-medium">Preview:</Label>
                      <div className="mt-2 space-y-2">
                        <div className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="editPreview"
                            className="w-4 h-4"
                            disabled
                          />
                          <span className="text-sm">Yes</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="editPreview"
                            className="w-4 h-4"
                            disabled
                          />
                          <span className="text-sm">No</span>
                        </div>
                      </div>
                    </div>
                  )}
      
                  <div className="flex gap-2">
                    <Button
                      type="submit"
                      disabled={loading}
                      className="bg-gradient-to-r from-blue-700 to-purple-700 hover:from-blue-600 hover:to-purple-700"
                    >
                      {loading ? "Updating..." : "Update Question"}
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

      {/* Create Question Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white">
              <h2 className="text-xl font-bold text-slate-900">
                Create New Question
              </h2>
              <button
                onClick={() => {
                  setShowCreateForm(false);
                  setQuestionText("");
                  setResponseType("");
                  setRatingScale("1-5");
                  setOptions([""]);
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6">
            <form onSubmit={(e) => {
              handleSubmit(e);
              if (!loading) setShowCreateForm(false);
            }} className="space-y-4">
              <div>
                <Label htmlFor="questionText">Question Text *</Label>
                <Input
                  id="questionText"
                  type="text"
                  value={questionText}
                  onChange={(e) => setQuestionText(e.target.value)}
                  placeholder="Enter your question"
                  required
                />
              </div>

              <div>
                <Label htmlFor="responseType">Response Type *</Label>
                <select
                  id="responseType"
                  className="w-full p-3 border text-sm rounded-[5px] border-gray-400 focus:outline-none focus:ring-1 focus:ring-black"
                  value={responseType}
                  onChange={(e) => setResponseType(e.target.value)}
                  required
                >
                  <option value="">Select response type</option>
                  <option value="multiple_choice">Multiple Choice</option>
                  <option value="text">Text</option>
                  <option value="rating">Rating</option>
                  <option value="yes_no">Yes/No</option>
                </select>
              </div>

              {responseType === "multiple_choice" && (
                <div>
                  <Label>Options</Label>
                  {options.map((option, index) => (
                    <div key={index} className="flex gap-2 mt-2">
                      <Input
                        value={option}
                        onChange={(e) =>
                          handleOptionChange(index, e.target.value)
                        }
                        placeholder={`Option ${index + 1}`}
                      />
                      {options.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleRemoveOption(index)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddOption}
                    className="mt-2"
                  >
                    Add Option
                  </Button>

                  {/* Preview */}
                  <div className="mt-4 p-3 bg-gray-50 rounded border">
                    <Label className="text-sm font-medium">Preview:</Label>
                    <div className="mt-2 space-y-2">
                      {options
                        .filter((opt) => opt.trim())
                        .map((option, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              className="w-4 h-4"
                              disabled
                            />
                            <span className="text-sm">{option}</span>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              )}

              {responseType === "rating" && (
                <div>
                  <Label>Rating Scale</Label>
                  <select
                    className="w-full p-3 border text-sm rounded-[5px] border-gray-400 focus:outline-none focus:ring-1 focus:ring-black mt-2"
                    value={ratingScale}
                    onChange={(e) => setRatingScale(e.target.value)}
                  >
                    <option value="1-3">1-3 Scale</option>
                    <option value="1-5">1-5 Scale</option>
                    <option value="1-10">1-10 Scale</option>
                  </select>

                  {/* Preview */}
                  <div className="mt-4 p-3 bg-gray-50 rounded border">
                    <Label className="text-sm font-medium">Preview:</Label>
                    <div className="mt-2 flex gap-1">
                      {Array.from(
                        { length: parseInt(ratingScale.split("-")[1]) },
                        (_, i) => (
                          <span key={i} className="text-yellow-400 text-xl">
                            ★
                          </span>
                        )
                      )}
                    </div>
                  </div>
                </div>
              )}

              {responseType === "yes_no" && (
                <div className="mt-4 p-3 bg-gray-50 rounded border">
                  <Label className="text-sm font-medium">Preview:</Label>
                  <div className="mt-2 space-y-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="preview"
                        className="w-4 h-4"
                        disabled
                      />
                      <span className="text-sm">Yes</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="preview"
                        className="w-4 h-4"
                        disabled
                      />
                      <span className="text-sm">No</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowCreateForm(false);
                    setQuestionText("");
                    setResponseType("");
                    setRatingScale("1-5");
                    setOptions([""]);
                  }}
                  className="px-6"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="bg-slate-900 hover:bg-slate-800 px-6"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {loading ? "Creating..." : "Create Question"}
                </Button>
              </div>
            </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>
              Are you sure you want to delete{" "}
              <strong>{questionToDelete?.text}</strong>?
            </p>
            <p className="text-sm text-gray-600">
              This action cannot be undone.
            </p>

            <div className="flex gap-2 pt-4">
              <Button
                onClick={confirmDelete}
                className="flex-1 bg-gradient-to-r from-blue-700 to-purple-700 hover:from-blue-600 hover:to-purple-700"
              >
                Delete Question
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

export default CreateQuestionAPI;
