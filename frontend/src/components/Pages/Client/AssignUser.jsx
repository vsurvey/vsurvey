import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Edit3, Trash2, Users, FileText, CheckCircle, XCircle, Search } from "lucide-react";
import { db, auth } from "../../../firebase";
import {
  collection,
  getDocs,
  query,
  where,
  addDoc,
  updateDoc,
  doc,
  deleteDoc,
} from "firebase/firestore";

const AssignUser = ({
  profile,
  onProfileEdit,
  onLogout,
  onNavigateToSurveys,
}) => {
  const [selectedUser, setSelectedUser] = useState([]);
  const [selectedSurveys, setSelectedSurveys] = useState([]);
  const [userAssignments, setUserAssignments] = useState({});
  const [userSearch, setUserSearch] = useState("");
  const [surveySearch, setSurveySearch] = useState("");
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showSurveyDropdown, setShowSurveyDropdown] = useState(false);
  const [confirmationMessage, setConfirmationMessage] = useState("");
  const [users, setUsers] = useState([]);
  const [surveys, setSurveys] = useState([]);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [modalSurveySearch, setModalSurveySearch] = useState("");
  const [showModalSurveyDropdown, setShowModalSurveyDropdown] = useState(false);
  const [selectedSurveysForUser, setSelectedSurveysForUser] = useState([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [assignmentDocs, setAssignmentDocs] = useState({});
  const [filterTab, setFilterTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      await loadUsers();
      await loadSurveys();
      await loadAssignments();
    };

    loadData();

    // Listen for user updates
    const handleUsersUpdated = () => {
      console.log("Users updated, reloading...");
      loadUsers();
    };

    window.addEventListener("usersUpdated", handleUsersUpdated);

    return () => {
      window.removeEventListener("usersUpdated", handleUsersUpdated);
    };
  }, [profile]);

  useEffect(() => {
    if (surveys.length > 0) {
      loadAssignments();
    }
  }, [surveys]);

  const loadUsers = async () => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser?.email) {
        console.error("No authenticated user found");
        return;
      }

      console.log("Loading users created by:", currentUser.email);
      const usersRef = collection(db, "users");
      const snapshot = await getDocs(usersRef);
      const usersList = [];
      snapshot.forEach((doc) => {
        const userData = doc.data();
        if (
          userData.created_by === currentUser.email &&
          userData.status === "active" &&
          userData.is_active === true
        ) {
          console.log("Found active user:", userData);
          usersList.push({
            id: doc.id,
            name:
              userData.full_name ||
              userData.fullName ||
              userData.name ||
              userData.email,
          });
        }
      });
      console.log("Loaded active users:", usersList);
      setUsers(usersList);
    } catch (error) {
      console.error("Error loading users:", error);
    }
  };

  const loadSurveys = async () => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser?.email) {
        console.error("No authenticated user found");
        return;
      }

      // For now, using the nested path for surveys - this may need updating based on your survey storage structure
      const clientsRef = collection(
        db,
        "superadmin",
        "hdXje7ZvCbj7eOugVLiZ",
        "clients"
      );
      const clientsSnapshot = await getDocs(clientsRef);

      let clientId = null;
      clientsSnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.email === currentUser.email) {
          clientId = doc.id;
        }
      });

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

  const loadAssignments = async () => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser?.email) {
        console.error("No authenticated user found");
        return;
      }

      // Get client ID
      const clientsRef = collection(
        db,
        "superadmin",
        "hdXje7ZvCbj7eOugVLiZ",
        "clients"
      );
      const clientsSnapshot = await getDocs(clientsRef);

      let clientId = null;
      clientsSnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.email === currentUser.email) {
          clientId = doc.id;
        }
      });

      if (!clientId) {
        console.error("No client ID found for current user");
        return;
      }

      // Load assignments from Firebase
      const assignmentsRef = collection(
        db,
        "superadmin",
        "hdXje7ZvCbj7eOugVLiZ",
        "clients",
        clientId,
        "survey_assignments"
      );
      const snapshot = await getDocs(assignmentsRef);

      const assignments = {};
      const docs = {};

      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const userId = data.user_id;
        const surveyId = data.survey_id;

        if (!assignments[userId]) {
          assignments[userId] = [];
        }

        assignments[userId].push({
          id: surveyId,
          name: surveyId, // Will be updated after surveys load
          active: data.is_active,
        });

        docs[`${userId}_${surveyId}`] = docSnap.id;
      });

      // Update survey names if surveys are loaded
      if (surveys.length > 0) {
        Object.keys(assignments).forEach((userId) => {
          assignments[userId] = assignments[userId].map((assignment) => {
            const survey = surveys.find((s) => s.id === assignment.id);
            return {
              ...assignment,
              name: survey?.name || assignment.name,
            };
          });
        });
      }

      setUserAssignments(assignments);
      setAssignmentDocs(docs);
    } catch (error) {
      console.error("Error loading assignments:", error);
    }
  };

  useEffect(() => {
    const saved = localStorage.getItem("userAssignments");
    if (saved) {
      setUserAssignments(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    if (Object.keys(userAssignments).length > 0) {
      localStorage.setItem("userAssignments", JSON.stringify(userAssignments));
    }
  }, [userAssignments]);

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(userSearch.toLowerCase()) &&
      !selectedUser.includes(user.id)
  );

  const filteredSurveys = surveys.filter(
    (survey) =>
      survey.name.toLowerCase().includes(surveySearch.toLowerCase()) &&
      !selectedSurveys.includes(survey.id)
  );

  const handleSurveySelection = (surveyId) => {
    if (!selectedSurveys.includes(surveyId)) {
      setSelectedSurveys([...selectedSurveys, surveyId]);
    }
    setSurveySearch("");
    setShowSurveyDropdown(false);
  };

  const handleUserSelection = (userId) => {
    if (!selectedUser.includes(userId)) {
      setSelectedUser([...selectedUser, userId]);
    }
    setUserSearch("");
    setShowUserDropdown(false);
  };

  const removeUserSelection = (userId) => {
    setSelectedUser(selectedUser.filter((id) => id !== userId));
  };

  const removeSurveySelection = (surveyId) => {
    setSelectedSurveys(selectedSurveys.filter((id) => id !== surveyId));
  };

  const assignSurveys = async () => {
    if (selectedUser.length > 0 && selectedSurveys.length > 0) {
      try {
        const currentUser = auth.currentUser;
        if (!currentUser?.email) {
          console.error("No authenticated user found");
          return;
        }

        // Get client ID
        const clientsRef = collection(
          db,
          "superadmin",
          "hdXje7ZvCbj7eOugVLiZ",
          "clients"
        );
        const clientsSnapshot = await getDocs(clientsRef);

        let clientId = null;
        clientsSnapshot.forEach((doc) => {
          const data = doc.data();
          if (data.email === currentUser.email) {
            clientId = doc.id;
          }
        });

        if (!clientId) {
          console.error("No client ID found for current user");
          return;
        }

        // Check for existing assignments to prevent duplicates
        const assignmentsRef = collection(
          db,
          "superadmin",
          "hdXje7ZvCbj7eOugVLiZ",
          "clients",
          clientId,
          "survey_assignments"
        );
        const existingAssignments = await getDocs(assignmentsRef);

        const existingPairs = new Set();
        existingAssignments.forEach((doc) => {
          const data = doc.data();
          existingPairs.add(`${data.user_id}_${data.survey_id}`);
        });

        let assignmentCount = 0;
        let skippedCount = 0;

        // Create assignments in Firebase, checking for duplicates
        for (const userId of selectedUser) {
          for (const surveyId of selectedSurveys) {
            const pairKey = `${userId}_${surveyId}`;

            if (existingPairs.has(pairKey)) {
              console.log(
                `Skipping duplicate assignment: User ${userId}, Survey ${surveyId}`
              );
              skippedCount++;
              continue;
            }

            const assignmentData = {
              assigned_by: currentUser.email,
              assigned_at: new Date().toISOString(),
              is_active: true,
              survey_id: surveyId,
              user_id: userId,
            };

            await addDoc(assignmentsRef, assignmentData);
            existingPairs.add(pairKey); // Prevent duplicates within this batch
            assignmentCount++;
          }
        }

        // Reload assignments to update UI
        await loadAssignments();

        const userNames = selectedUser
          .map((id) => users.find((u) => u.id === id)?.name)
          .join(", ");

        let message = "";
        if (assignmentCount > 0 && skippedCount > 0) {
          message = `Successfully assigned ${assignmentCount} survey${assignmentCount > 1 ? "s" : ""} to ${userNames}. ${skippedCount} duplicate${skippedCount > 1 ? "s" : ""} skipped.`;
        } else if (assignmentCount > 0) {
          message = `Successfully assigned ${assignmentCount} survey${assignmentCount > 1 ? "s" : ""} to ${userNames}`;
        } else {
          message = `All selected surveys are already assigned to the selected users.`;
        }

        setConfirmationMessage(message);
        setTimeout(() => setConfirmationMessage(""), 5000);

        setSelectedUser([]);
        setSelectedSurveys([]);
        setUserSearch("");
        setSurveySearch("");
      } catch (error) {
        console.error("Error assigning surveys:", error);
        setConfirmationMessage("Error assigning surveys. Please try again.");
        setTimeout(() => setConfirmationMessage(""), 3000);
      }
    }
  };

  const toggleSurveyStatus = async (userId, surveyId) => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser?.email) {
        console.error("No authenticated user found");
        return;
      }

      // Get client ID
      const clientsRef = collection(
        db,
        "superadmin",
        "hdXje7ZvCbj7eOugVLiZ",
        "clients"
      );
      const clientsSnapshot = await getDocs(clientsRef);

      let clientId = null;
      clientsSnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.email === currentUser.email) {
          clientId = doc.id;
        }
      });

      if (!clientId) {
        console.error("No client ID found for current user");
        return;
      }

      // Get current status and toggle it
      const currentAssignment = userAssignments[userId]?.find(
        (s) => s.id === surveyId
      );
      const newStatus = !currentAssignment?.active;

      // Find the assignment document by querying
      const assignmentsRef = collection(
        db,
        "superadmin",
        "hdXje7ZvCbj7eOugVLiZ",
        "clients",
        clientId,
        "survey_assignments"
      );
      const q = query(
        assignmentsRef,
        where("user_id", "==", userId),
        where("survey_id", "==", surveyId)
      );
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const assignmentDoc = querySnapshot.docs[0];
        const assignmentRef = doc(
          db,
          "superadmin",
          "hdXje7ZvCbj7eOugVLiZ",
          "clients",
          clientId,
          "survey_assignments",
          assignmentDoc.id
        );

        await updateDoc(assignmentRef, {
          is_active: newStatus,
          updated_at: new Date().toISOString(),
        });

        // Update local state
        setUserAssignments((prev) => ({
          ...prev,
          [userId]: prev[userId].map((survey) =>
            survey.id === surveyId ? { ...survey, active: newStatus } : survey
          ),
        }));

        console.log(
          `Survey ${surveyId} for user ${userId} ${newStatus ? "activated" : "deactivated"}`
        );
      } else {
        console.error("Assignment document not found");
      }
    } catch (error) {
      console.error("Error toggling survey status:", error);
    }
  };

  const openEditModal = (userId) => {
    const user = users.find((u) => u.id === userId);
    setEditingUser({ id: userId, name: user?.name });
    setSelectedSurveysForUser([]);
    setIsEditModalOpen(true);
  };

  const handleModalSurveySelection = (surveyId) => {
    if (!selectedSurveysForUser.includes(surveyId)) {
      setSelectedSurveysForUser([...selectedSurveysForUser, surveyId]);
    }
    setModalSurveySearch("");
    setShowModalSurveyDropdown(false);
  };

  const removeModalSurveySelection = (surveyId) => {
    setSelectedSurveysForUser(
      selectedSurveysForUser.filter((id) => id !== surveyId)
    );
  };

  const updateUserSurveys = async () => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser?.email) {
        console.error("No authenticated user found");
        return;
      }

      // Get client ID
      const clientsRef = collection(
        db,
        "superadmin",
        "hdXje7ZvCbj7eOugVLiZ",
        "clients"
      );
      const clientsSnapshot = await getDocs(clientsRef);

      let clientId = null;
      clientsSnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.email === currentUser.email) {
          clientId = doc.id;
        }
      });

      if (!clientId) {
        console.error("No client ID found for current user");
        return;
      }

      const assignmentsRef = collection(
        db,
        "superadmin",
        "hdXje7ZvCbj7eOugVLiZ",
        "clients",
        clientId,
        "survey_assignments"
      );

      // Update existing survey statuses
      const currentSurveys = userAssignments[editingUser.id] || [];
      for (const survey of currentSurveys) {
        const q = query(
          assignmentsRef,
          where("user_id", "==", editingUser.id),
          where("survey_id", "==", survey.id)
        );
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const assignmentDoc = querySnapshot.docs[0];
          const assignmentRef = doc(
            db,
            "superadmin",
            "hdXje7ZvCbj7eOugVLiZ",
            "clients",
            clientId,
            "survey_assignments",
            assignmentDoc.id
          );

          await updateDoc(assignmentRef, {
            is_active: survey.active,
            updated_at: new Date().toISOString(),
          });
        }
      }

      // Add new surveys
      if (selectedSurveysForUser.length > 0) {
        const existingAssignments = await getDocs(
          query(assignmentsRef, where("user_id", "==", editingUser.id))
        );

        const existingSurveyIds = new Set();
        existingAssignments.forEach((doc) => {
          const data = doc.data();
          existingSurveyIds.add(data.survey_id);
        });

        let assignmentCount = 0;
        let skippedCount = 0;

        for (const surveyId of selectedSurveysForUser) {
          if (existingSurveyIds.has(surveyId)) {
            console.log(
              `Skipping duplicate assignment: User ${editingUser.id}, Survey ${surveyId}`
            );
            skippedCount++;
            continue;
          }

          const assignmentData = {
            assigned_by: currentUser.email,
            assigned_at: new Date().toISOString(),
            is_active: true,
            survey_id: surveyId,
            user_id: editingUser.id,
          };

          await addDoc(assignmentsRef, assignmentData);
          assignmentCount++;
        }

        let message = "";
        if (assignmentCount > 0 && skippedCount > 0) {
          message = `Added ${assignmentCount} survey${assignmentCount > 1 ? "s" : ""}. ${skippedCount} duplicate${skippedCount > 1 ? "s" : ""} skipped.`;
        } else if (assignmentCount > 0) {
          message = `Successfully added ${assignmentCount} survey${assignmentCount > 1 ? "s" : ""}!`;
        } else if (selectedSurveysForUser.length > 0) {
          message = "All selected surveys are already assigned to this user.";
        } else {
          message = "Survey assignments updated successfully!";
        }

        setConfirmationMessage(message);
      } else {
        setConfirmationMessage("Survey assignments updated successfully!");
      }

      // Reload assignments to update UI
      await loadAssignments();

      setIsEditModalOpen(false);
      setEditingUser(null);
      setSelectedSurveysForUser([]);
      setTimeout(() => setConfirmationMessage(""), 5000);
    } catch (error) {
      console.error("Error updating user surveys:", error);
      setConfirmationMessage("Error updating surveys. Please try again.");
      setTimeout(() => setConfirmationMessage(""), 3000);
    }
  };

  const deleteUserAssignments = async (userId) => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser?.email) {
        console.error("No authenticated user found");
        return;
      }

      // Get client ID
      const clientsRef = collection(
        db,
        "superadmin",
        "hdXje7ZvCbj7eOugVLiZ",
        "clients"
      );
      const clientsSnapshot = await getDocs(clientsRef);

      let clientId = null;
      clientsSnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.email === currentUser.email) {
          clientId = doc.id;
        }
      });

      if (!clientId) {
        console.error("No client ID found for current user");
        return;
      }

      // Delete all assignments for this user from Firestore
      const assignmentsRef = collection(
        db,
        "superadmin",
        "hdXje7ZvCbj7eOugVLiZ",
        "clients",
        clientId,
        "survey_assignments"
      );
      const q = query(assignmentsRef, where("user_id", "==", userId));
      const querySnapshot = await getDocs(q);

      const deletePromises = [];
      querySnapshot.forEach((docSnap) => {
        const assignmentRef = doc(
          db,
          "superadmin",
          "hdXje7ZvCbj7eOugVLiZ",
          "clients",
          clientId,
          "survey_assignments",
          docSnap.id
        );
        deletePromises.push(deleteDoc(assignmentRef));
      });

      await Promise.all(deletePromises);

      // Update local state
      setUserAssignments((prev) => {
        const updated = { ...prev };
        delete updated[userId];
        return updated;
      });

      console.log(
        `Deleted ${deletePromises.length} assignments for user ${userId}`
      );
    } catch (error) {
      console.error("Error deleting user assignments:", error);
    }
  };

  const availableSurveys = surveys.filter(
    (survey) =>
      survey.name.toLowerCase().includes(modalSurveySearch.toLowerCase()) &&
      !(userAssignments[editingUser?.id] || []).some(
        (assigned) => assigned.id === survey.id
      ) &&
      !selectedSurveysForUser.includes(survey.id)
  );

  // Calculate stats
  const totalAssignments = Object.keys(userAssignments).length;
  const activeAssignments = Object.values(userAssignments).filter(surveys => 
    surveys.some(s => s.active !== false)
  ).length;
  const inactiveAssignments = totalAssignments - activeAssignments;
  const totalSurveysAssigned = Object.values(userAssignments).reduce(
    (sum, surveys) => sum + surveys.length, 0
  );

  // Filter assignments
  const filteredAssignments = Object.entries(userAssignments).filter(([userId, surveys]) => {
    const user = users.find(u => u.id === userId);
    if (!user) return false;

    // Search filter
    if (searchQuery && !user.name.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }

    // Tab filter
    if (filterTab === "active") {
      return surveys.some(s => s.active !== false);
    } else if (filterTab === "inactive") {
      return surveys.every(s => s.active === false);
    }
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
            Survey Assignments
          </h1>
          <p className="text-slate-600 text-sm sm:text-base mt-1 sm:mt-2">
            Manage user survey assignments
          </p>
        </div>
        <Button
          onClick={() => setShowCreateModal(true)}
          className="bg-slate-900 hover:bg-slate-800 h-10 sm:h-11 px-4 sm:px-6 w-full sm:w-auto"
        >
          <Users className="w-4 h-4 mr-2" />
          Assign Survey
        </Button>
      </div>

        {confirmationMessage && (
          <div className="p-4 rounded-lg bg-green-50 text-green-700 text-sm">
            {confirmationMessage}
          </div>
        )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
        <div className="bg-white p-3 sm:p-4 rounded-lg border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-slate-500">
                Total Users
              </p>
              <p className="text-lg sm:text-xl font-bold text-slate-900 mt-1">
                {totalAssignments}
              </p>
            </div>
            <div className="bg-blue-50 p-2 rounded-lg">
              <Users className="w-4 h-4 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-3 sm:p-4 rounded-lg border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-slate-500">
                Active
              </p>
              <p className="text-lg sm:text-xl font-bold text-green-600 mt-1">
                {activeAssignments}
              </p>
            </div>
            <div className="bg-green-50 p-2 rounded-lg">
              <CheckCircle className="w-4 h-4 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-3 sm:p-4 rounded-lg border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-slate-500">
                Inactive
              </p>
              <p className="text-lg sm:text-xl font-bold text-red-600 mt-1">
                {inactiveAssignments}
              </p>
            </div>
            <div className="bg-red-50 p-2 rounded-lg">
              <XCircle className="w-4 h-4 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-3 sm:p-4 rounded-lg border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-slate-500">
                Total Surveys
              </p>
              <p className="text-lg sm:text-xl font-bold text-purple-600 mt-1">
                {totalSurveysAssigned}
              </p>
            </div>
            <div className="bg-purple-50 p-2 rounded-lg">
              <FileText className="w-4 h-4 text-purple-600" />
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
                All ({totalAssignments})
              </button>
              <button
                onClick={() => setFilterTab("active")}
                className={`hidden sm:block px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  filterTab === "active"
                    ? "border-green-600 text-green-600"
                    : "border-transparent text-slate-500 hover:text-slate-700"
                }`}
              >
                Active ({activeAssignments})
              </button>
              <button
                onClick={() => setFilterTab("inactive")}
                className={`hidden sm:block px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  filterTab === "inactive"
                    ? "border-red-600 text-red-600"
                    : "border-transparent text-slate-500 hover:text-slate-700"
                }`}
              >
                Inactive ({inactiveAssignments})
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

        <div className="p-4 sm:p-6">
          <div className="space-y-3">
              {filteredAssignments.length > 0 ? (
                filteredAssignments.map(([userId, surveys]) => {
                  const user = users.find((u) => u.id === userId);
                  if (!user || surveys.length === 0) return null;
                  return (
                    <div key={userId} className="bg-white border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <h3 className="font-semibold text-slate-900">{user.name}</h3>
                              <p className="text-xs text-slate-500 mt-1">{surveys.length} survey{surveys.length > 1 ? 's' : ''} assigned</p>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => openEditModal(userId)}
                                className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => {
                                  setUserToDelete(userId);
                                  setShowDeleteConfirm(true);
                                }}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                          <div className="mt-3 flex flex-wrap gap-2">
                            {surveys.map((survey) => (
                              <span
                                key={survey.id}
                                className={`inline-flex px-2.5 py-1 text-xs font-medium rounded-full ${
                                  survey.active !== false
                                    ? "bg-slate-100 text-slate-700"
                                    : "bg-red-100 text-red-700 line-through"
                                }`}
                              >
                                {survey.name}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
            ) : (
              <p className="text-center py-12 text-slate-500">No assignments found</p>
            )}
          </div>
        </div>
      </div>
    </div>

      {/* Create Assignment Modal */}
      {showCreateModal && (
        <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Assignment</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {/* User Selection */}
              <div className="relative">
                <label className="block text-xs md:text-sm font-bold text-black mb-2">
                  SELECT USERS
                </label>
                <Input
                  type="text"
                  value={userSearch}
                  onChange={(e) => {
                    setUserSearch(e.target.value);
                    setShowUserDropdown(true);
                  }}
                  onFocus={() => setShowUserDropdown(true)}
                  onBlur={() =>
                    setTimeout(() => setShowUserDropdown(false), 200)
                  }
                  placeholder={
                    users.length === 0
                      ? "No users available. Create users first."
                      : "Search and select users..."
                  }
                  className="rounded-[5px] border-gray-400 p-3 text-sm w-full"
                  disabled={users.length === 0}
                />
                {showUserDropdown && filteredUsers.length > 0 && (
                  <div className="absolute z-10 w-full bg-white border border-gray-400 rounded-[5px] mt-1 max-h-40 overflow-y-auto">
                    {filteredUsers.map((user) => (
                      <div
                        key={user.id}
                        onClick={() => handleUserSelection(user.id)}
                        className="p-3 hover:bg-gray-100 cursor-pointer text-sm flex items-center"
                      >
                        <input
                          type="checkbox"
                          checked={selectedUser.includes(user.id)}
                          readOnly
                          className="mr-2"
                        />
                        {user.name}
                      </div>
                    ))}
                  </div>
                )}
                {selectedUser.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedUser.map((userId) => {
                      const user = users.find((u) => u.id === userId);
                      return (
                        <Badge
                          key={userId}
                          variant="secondary"
                          className="flex items-center gap-1"
                        >
                          {user?.name}
                          <button
                            onClick={() => removeUserSelection(userId)}
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

              {/* Survey Selection */}
              <div className="relative">
                <label className="block text-xs md:text-sm font-bold text-black mb-2">
                  SELECT SURVEYS
                </label>
                <Input
                  type="text"
                  value={surveySearch}
                  onChange={(e) => {
                    setSurveySearch(e.target.value);
                    setShowSurveyDropdown(true);
                  }}
                  onFocus={() => setShowSurveyDropdown(true)}
                  onBlur={() =>
                    setTimeout(() => setShowSurveyDropdown(false), 200)
                  }
                  placeholder={
                    surveys.length === 0
                      ? "No surveys available. Create surveys first."
                      : "Search and select surveys..."
                  }
                  className="rounded-[5px] border-gray-400 p-3 text-sm w-full"
                  disabled={surveys.length === 0}
                />
                {showSurveyDropdown && filteredSurveys.length > 0 && (
                  <div className="absolute z-10 w-full bg-white border border-gray-400 rounded-[5px] mt-1 max-h-40 overflow-y-auto">
                    {filteredSurveys.map((survey) => (
                      <div
                        key={survey.id}
                        onClick={() => handleSurveySelection(survey.id)}
                        className="p-3 hover:bg-gray-100 cursor-pointer text-sm flex items-center"
                      >
                        <input
                          type="checkbox"
                          checked={false}
                          readOnly
                          className="mr-2"
                        />
                        {survey.name}
                      </div>
                    ))}
                  </div>
                )}
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
              <Button
                onClick={() => {
                  assignSurveys();
                  setShowCreateModal(false);
                }}
                disabled={
                  selectedUser.length === 0 || selectedSurveys.length === 0
                }
                className="w-full bg-gradient-to-r from-blue-700 to-purple-700 hover:from-blue-600 hover:to-purple-700 p-4 text-sm"
              >
                Assign Survey{selectedSurveys.length > 1 ? "s" : ""} to User
                {selectedUser.length > 1 ? "s" : ""}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Edit User Modal */}
      {isEditModalOpen && editingUser && (
        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit User: {editingUser.name}</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              {/* Add Survey Section */}
              <div>
                <label className="block text-sm font-bold text-black mb-2">
                  ADD SURVEY
                </label>
                <div className="relative">
                  <Input
                    type="text"
                    value={modalSurveySearch}
                    onChange={(e) => {
                      setModalSurveySearch(e.target.value);
                      setShowModalSurveyDropdown(true);
                    }}
                    onFocus={() => setShowModalSurveyDropdown(true)}
                    onBlur={() =>
                      setTimeout(() => setShowModalSurveyDropdown(false), 200)
                    }
                    placeholder={
                      availableSurveys.length === 0
                        ? "No new surveys available"
                        : "Search and select surveys..."
                    }
                    className="text-sm rounded-[5px] border-gray-400"
                    disabled={availableSurveys.length === 0}
                  />
                  {showModalSurveyDropdown && availableSurveys.length > 0 && (
                    <div className="absolute z-10 w-full bg-white border border-gray-400 rounded-[5px] mt-1 max-h-40 overflow-y-auto">
                      {availableSurveys.map((survey) => (
                        <div
                          key={survey.id}
                          onClick={() => handleModalSurveySelection(survey.id)}
                          className="p-3 hover:bg-gray-100 cursor-pointer text-sm flex items-center"
                        >
                          <input
                            type="checkbox"
                            checked={false}
                            readOnly
                            className="mr-2"
                          />
                          {survey.name}
                        </div>
                      ))}
                    </div>
                  )}
                  {selectedSurveysForUser.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {selectedSurveysForUser.map((surveyId) => {
                        const survey = surveys.find((s) => s.id === surveyId);
                        return (
                          <Badge
                            key={surveyId}
                            variant="secondary"
                            className="flex items-center gap-1"
                          >
                            {survey?.name}
                            <button
                              onClick={() =>
                                setSelectedSurveysForUser((prev) =>
                                  prev.filter((id) => id !== surveyId)
                                )
                              }
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
              </div>

              {/* Current Surveys */}
              <div>
                <h4 className="text-sm font-bold text-black mb-2">
                  CURRENT SURVEYS
                </h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {(userAssignments[editingUser.id] || []).map((survey) => (
                    <div
                      key={survey.id}
                      className={`flex items-center justify-between p-2 border rounded ${
                        survey.active === false
                          ? "bg-red-50 border-red-200"
                          : "bg-white"
                      }`}
                    >
                      <span
                        className={`text-sm ${
                          survey.active === false
                            ? "text-red-400 line-through"
                            : "text-gray-700"
                        }`}
                      >
                        {survey.name}
                      </span>
                      <Button
                        variant={
                          survey.active === false ? "default" : "outline"
                        }
                        size="sm"
                        onClick={() => {
                          setUserAssignments((prev) => ({
                            ...prev,
                            [editingUser.id]: prev[editingUser.id].map((s) =>
                              s.id === survey.id
                                ? {
                                    ...s,
                                    active: s.active === false ? true : false,
                                  }
                                : s
                            ),
                          }));
                        }}
                        className={`text-xs px-2 py-1 w-20 ${survey.active !== false ? "bg-red-100 text-red-600 border-red-200 hover:bg-red-200" : "bg-green-100 text-green-600 border-green-200 hover:bg-green-200"}`}
                      >
                        {survey.active === false ? "Activate" : "Deactivate"}
                      </Button>
                    </div>
                  ))}
                  {!(userAssignments[editingUser.id] || []).length && (
                    <p className="text-gray-500 text-sm">
                      No surveys currently assigned
                    </p>
                  )}
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  onClick={updateUserSurveys}
                  className="flex-1 bg-gradient-to-r from-blue-700 to-purple-700 hover:from-blue-600 hover:to-purple-700"
                >
                  Update
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsEditModalOpen(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-sm shadow-xl">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <Trash2 className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Delete Survey Assignment
              </h3>
              <p className="text-sm text-gray-500 mb-6">
                Are you sure you want to delete this survey assignment for{" "}
                {users.find((u) => u.id === userToDelete)?.name}?
              </p>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={async () => {
                    await deleteUserAssignments(userToDelete);
                    setShowDeleteConfirm(false);
                    setUserToDelete(null);
                  }}
                  className="flex-1 bg-red-600 hover:bg-red-700"
                >
                  Delete
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssignUser;
