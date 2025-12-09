import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Plus,
  Users,
  Building,
  Trash2,
  Edit3,
  UserCheck,
  UserX,
  Mail,
  UserPlus,
  X,
  FileText,
  HelpCircle,
  Search,
} from "lucide-react";
import TopBar from "../TapBar/TopBar";
import SuperAdminSidebar from "../SideBar/SuperAdminSidebar";
import SurveyResult from "./SurveyResult";
import { db, auth } from "../../../firebase";
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
  onSnapshot,
  setDoc,
} from "firebase/firestore";
import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  deleteUser,
} from "firebase/auth";
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { setSuperAdminUpdateCallback } from "../../../services/superAdminNotification";

import { FIREBASE_CONFIG } from "../../../config/firebaseConfig";

// Create separate Firebase app for user creation (doesn't affect main auth state)
const secondaryApp = initializeApp(FIREBASE_CONFIG, "secondary");

const secondaryAuth = getAuth(secondaryApp);

const SuperAdminDashboardAPI = () => {
  const [activeTab, setActiveTab] = useState("clients");
  const [clientFilterTab, setClientFilterTab] = useState("all");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [clientAdmins, setClientAdmins] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isCreatingUser, setIsCreatingUser] = useState(false); // Add this flag
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    clientId: "",
  });
  const [message, setMessage] = useState("");
  const [selectedClient, setSelectedClient] = useState(null);
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [clientDetails, setClientDetails] = useState({
    users: [],
    surveys: [],
    questions: [],
  });
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [editFormData, setEditFormData] = useState({ name: "" });
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Load clients from Firebase with real-time listener for status changes only
  useEffect(() => {
    const superadminId = "hdXje7ZvCbj7eOugVLiZ";
    const clientsRef = collection(db, "superadmin", superadminId, "clients");

    // Set up real-time listener only for status field changes
    const unsubscribe = onSnapshot(clientsRef, (snapshot) => {
      const clients = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        clients.push({
          id: doc.id,
          name: data.name || `Client ${doc.id.substring(0, 8)}`,
          email: data.email || "No email provided",
          clientId: data.clientId || doc.id,
          createdAt: data.createdAt || new Date().toISOString(),
          status: data.status || "pending",
          isActive: data.isActive !== undefined ? data.isActive : false,
          ...data,
        });
      });

      // Only update if there are actual changes
      setClientAdmins((prevClients) => {
        const hasChanges =
          JSON.stringify(prevClients) !== JSON.stringify(clients);
        if (hasChanges) {
          console.log(
            "Client status updated:",
            clients.filter((c) => c.status === "active").map((c) => c.email)
          );
          return clients;
        }
        return prevClients;
      });
    });

    return () => unsubscribe();
  }, []);

  const loadClients = async () => {
    try {
      setLoading(true);
      // Get clients from Firebase structure: superadmin/hdXje7ZvCbj7eOugVLiZ/clients
      const superadminId = "hdXje7ZvCbj7eOugVLiZ";
      const clientsRef = collection(db, "superadmin", superadminId, "clients");
      const snapshot = await getDocs(clientsRef);

      const clients = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        clients.push({
          id: doc.id,
          name: data.name || `Client ${doc.id.substring(0, 8)}`, // Default name if missing
          email: data.email || "No email provided",
          clientId: data.clientId || doc.id,
          createdAt: data.createdAt || new Date().toISOString(),
          status: data.status || "pending",
          isActive: data.isActive !== undefined ? data.isActive : false,
          ...data,
        });
      });

      console.log("Loaded clients:", clients); // Debug log
      setClientAdmins(clients);

      // Check if any client status changed from pending to active
      const activeClients = clients.filter((c) => c.status === "active");
      if (activeClients.length > 0) {
        console.log(
          "Active clients detected:",
          activeClients.map((c) => c.email)
        );
      }
    } catch (error) {
      console.error("Error loading clients:", error);
      setMessage("Failed to load clients");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.email.trim()) {
      setMessage("Please fill in all required fields");
      return;
    }

    try {
      setLoading(true);
      setIsCreatingUser(true); // Set flag to prevent navigation
      window.isCreatingUser = true; // Set global flag

      console.log("Creating Firebase user for:", formData.email.trim());

      // Create Firebase user with temporary password using secondary auth
      const tempPassword = `Temp${Date.now()}!`; // Temporary password
      const userCredential = await createUserWithEmailAndPassword(
        secondaryAuth,
        formData.email.trim(),
        tempPassword
      );
      console.log(
        "Firebase user created successfully:",
        userCredential.user.uid
      );

      // Send password reset email immediately using secondary auth
      console.log("Sending password reset email...");
      await sendPasswordResetEmail(secondaryAuth, formData.email.trim());
      console.log("Password reset email sent successfully");

      // Create client document using Firebase UID as document ID
      const superadminId = "hdXje7ZvCbj7eOugVLiZ";
      const clientDocRef = doc(
        db,
        "superadmin",
        superadminId,
        "clients",
        userCredential.user.uid
      );

      const newClient = {
        activatedAt: "",
        clientId: formData.clientId.trim() || `client_${Date.now()}`,
        createdAt: new Date().toISOString(),
        email: formData.email.trim(),
        firebaseUid: userCredential.user.uid,
        isActive: false,
        status: "pending",
        address: "",
        company_name: formData.name.trim(),
        company_size: "",
        emailVerified: true,
        industry: "",
        is_first_time: false,
        name: "",
        phone: "",
        updated_at: new Date().toISOString(),
        tempPassword: tempPassword, // Store for deletion purposes
      };

      await setDoc(clientDocRef, newClient);
      console.log("Client document created successfully");

      setFormData({ name: "", email: "", clientId: "" });
      setShowCreateForm(false);
      setMessage(
        `✅ Client created successfully! Password setup email sent to ${formData.email} (Check spam folder if not received)`
      );
      setTimeout(() => setMessage(""), 10000);

      // Reload clients
      loadClients();
    } catch (error) {
      console.error("Detailed error creating client:", error);
      console.error("Error code:", error.code);
      console.error("Error message:", error.message);

      if (error.code === "auth/email-already-in-use") {
        setMessage("❌ Email already exists");
      } else if (error.code === "auth/weak-password") {
        setMessage("❌ Password is too weak");
      } else if (error.code === "auth/invalid-email") {
        setMessage("❌ Invalid email address");
      } else {
        setMessage("❌ Failed to create client: " + error.message);
      }
      setTimeout(() => setMessage(""), 8000);
    } finally {
      setLoading(false);
      setIsCreatingUser(false); // Clear flag
      window.isCreatingUser = false; // Clear global flag
    }
  };

  const openEditModal = (e, client) => {
    e.stopPropagation();
    setEditingClient(client);
    setEditFormData({ name: client.company_name || client.name });
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setEditingClient(null);
    setEditFormData({ name: "" });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const superadminId = "hdXje7ZvCbj7eOugVLiZ";
      await updateDoc(
        doc(db, "superadmin", superadminId, "clients", editingClient.id),
        { company_name: editFormData.name.trim() }
      );
      setMessage("Client updated successfully!");
      setTimeout(() => setMessage(""), 3000);
      closeEditModal();
      loadClients();
    } catch (error) {
      console.error("Error updating client:", error);
      setMessage("Failed to update client");
    }
  };

  const openDeleteModal = (e, client) => {
    e.stopPropagation();
    setClientToDelete(client);
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setClientToDelete(null);
  };

  const confirmDelete = async () => {
    try {
      console.log("=== STARTING CLIENT DELETION ===");
      console.log("Client ID:", clientToDelete.id);
      console.log("Firebase UID:", clientToDelete.firebaseUid);

      // Try to delete from Firebase Auth using backend
      const superadminId = "hdXje7ZvCbj7eOugVLiZ";
      let authDeleted = false;

      try {
        console.log("Attempting to delete Firebase Auth user via backend...");
        const response = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/api/delete-user/${clientToDelete.firebaseUid || clientToDelete.id}`,
          {
            method: "DELETE",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            console.log("✅ Firebase Auth user deleted via backend");
            authDeleted = true;
          }
        }
      } catch (backendError) {
        console.log("Backend not available, trying client-side deletion...");

        // Fallback: Try client-side deletion with temp password
        if (clientToDelete.tempPassword) {
          try {
            // Store current user before deletion
            const currentUser = auth.currentUser;

            const clientCredential = await signInWithEmailAndPassword(
              secondaryAuth,
              clientToDelete.email,
              clientToDelete.tempPassword
            );

            // Verify we're deleting the correct user
            if (
              clientCredential.user.uid ===
              (clientToDelete.firebaseUid || clientToDelete.id)
            ) {
              await deleteUser(clientCredential.user);
              console.log("✅ Firebase Auth user deleted client-side");
              authDeleted = true;
            } else {
              console.error("UID mismatch - deletion aborted for safety");
            }

            // Re-authenticate as SuperAdmin only if we're not already
            if (
              !currentUser ||
              currentUser.email !== "superadmin@vsurvey.com"
            ) {
              await signInWithEmailAndPassword(
                auth,
                "superadmin@vsurvey.com",
                "superadmin123"
              );
            }
          } catch (authError) {
            console.error("Client-side deletion failed:", authError);
          }
        }
      }

      if (!authDeleted) {
        console.log(
          "⚠️ Firebase Auth user will remain (all deletion methods failed)"
        );
      }

      // Delete all users created by this client
      const globalUsersRef = collection(db, "users");
      const globalUsersSnapshot = await getDocs(globalUsersRef);
      const userDeletePromises = [];

      globalUsersSnapshot.forEach((userDoc) => {
        const userData = userDoc.data();
        if (userData.created_by === clientToDelete.email) {
          userDeletePromises.push(deleteDoc(doc(db, "users", userDoc.id)));
        }
      });

      await Promise.all(userDeletePromises);
      console.log(`✅ Deleted ${userDeletePromises.length} users`);

      // Delete all surveys for this client
      const surveysRef = collection(
        db,
        "superadmin",
        superadminId,
        "clients",
        clientToDelete.id,
        "surveys"
      );
      const surveysSnapshot = await getDocs(surveysRef);
      const surveyDeletePromises = [];

      surveysSnapshot.forEach((surveyDoc) => {
        surveyDeletePromises.push(deleteDoc(surveyDoc.ref));
      });

      await Promise.all(surveyDeletePromises);
      console.log(`✅ Deleted ${surveyDeletePromises.length} surveys`);

      // Delete all questions for this client
      const questionsRef = collection(
        db,
        "superadmin",
        superadminId,
        "clients",
        clientToDelete.id,
        "questions"
      );
      const questionsSnapshot = await getDocs(questionsRef);
      const questionDeletePromises = [];

      questionsSnapshot.forEach((questionDoc) => {
        questionDeletePromises.push(deleteDoc(questionDoc.ref));
      });

      await Promise.all(questionDeletePromises);
      console.log(`✅ Deleted ${questionDeletePromises.length} questions`);

      // Delete all survey assignments for this client
      const assignmentsRef = collection(
        db,
        "superadmin",
        superadminId,
        "clients",
        clientToDelete.id,
        "survey_assignments"
      );
      const assignmentsSnapshot = await getDocs(assignmentsRef);
      const assignmentDeletePromises = [];

      assignmentsSnapshot.forEach((assignmentDoc) => {
        assignmentDeletePromises.push(deleteDoc(assignmentDoc.ref));
      });

      await Promise.all(assignmentDeletePromises);
      console.log(
        `✅ Deleted ${assignmentDeletePromises.length} survey assignments`
      );

      // Delete client document
      const clientDocRef = doc(
        db,
        "superadmin",
        superadminId,
        "clients",
        clientToDelete.id
      );
      await deleteDoc(clientDocRef);
      console.log("✅ Client document deleted from Firestore");

      const authMessage = authDeleted
        // ? "and Firebase Auth"
        // : "(Firebase Auth user remains)";
      setMessage(
        `✅ Client deleted successfully from ${authMessage}!`
      );

      setTimeout(() => setMessage(""), 5000);
      closeDeleteModal();
      loadClients();
    } catch (error) {
      console.error("Error deleting client:", error);
      setMessage("❌ Failed to delete client: " + error.message);
      setTimeout(() => setMessage(""), 5000);
    }
  };

  const createFirebaseUser = async (email) => {
    try {
      console.log("Creating Firebase user for:", email);
      // Create user with temporary password
      const tempPassword = `Temp${Date.now()}!`;
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        tempPassword
      );
      console.log("Firebase user created:", userCredential.user.uid);

      // Re-authenticate as SuperAdmin to maintain session
      await signInWithEmailAndPassword(
        auth,
        "superadmin@vsurvey.com",
        "superadmin123"
      );
      console.log("Re-authenticated as SuperAdmin");

      // Send password reset email immediately
      await sendPasswordResetEmail(auth, email);
      console.log("Password reset email sent");

      setMessage(
        `✅ user created and password setup email sent to ${email}`
      );
      setTimeout(() => setMessage(""), 8000);
    } catch (error) {
      console.error("Error creating Firebase user:", error);
      if (error.code === "auth/email-already-in-use") {
        // User exists, just send reset email
        await resendPasswordEmail(email);
      } else {
        setMessage(`❌ Failed to create user: ${error.message}`);
        setTimeout(() => setMessage(""), 8000);
      }
    }
  };

  const resendPasswordEmail = async (email) => {
    try {
      console.log("Attempting to send password reset email to:", email);
      await sendPasswordResetEmail(auth, email);
      console.log("Password reset email sent successfully");
      setMessage(`✅ Password setup email sent to ${email}`);
      setTimeout(() => setMessage(""), 5000);
    } catch (error) {
      console.error("Error sending password reset email:", error);
      console.error("Error code:", error.code);
      console.error("Error message:", error.message);

      if (error.code === "auth/user-not-found") {
        setMessage(
          `❌ User ${email} not found . Please create the user first.`
        );
      } else if (error.code === "auth/invalid-email") {
        setMessage(`❌ Invalid email address: ${email}`);
      } else {
        setMessage(`❌ Failed to send email: ${error.message}`);
      }
      setTimeout(() => setMessage(""), 8000);
    }
  };

  const toggleClientStatus = async (clientId, currentIsActive) => {
    try {
      const superadminId = "hdXje7ZvCbj7eOugVLiZ";
      const newIsActive = !currentIsActive;
      const newStatus = newIsActive ? "active" : "inactive";

      // Update client status
      await updateDoc(
        doc(db, "superadmin", superadminId, "clients", clientId),
        {
          isActive: newIsActive,
          status: newStatus,
        }
      );

      // If deactivating client, also deactivate all users under this client
      if (!newIsActive) {
        const client = clientAdmins.find((c) => c.id === clientId);
        if (client) {
          const globalUsersRef = collection(db, "users");
          const globalUsersSnapshot = await getDocs(globalUsersRef);

          const updatePromises = [];
          globalUsersSnapshot.forEach((userDoc) => {
            const userData = userDoc.data();
            if (userData.created_by === client.email) {
              updatePromises.push(
                updateDoc(doc(db, "users", userDoc.id), {
                  status: "inactive",
                  is_active: false,
                })
              );
            }
          });

          await Promise.all(updatePromises);
          console.log(
            `Deactivated ${updatePromises.length} users under client ${client.email}`
          );
        }
      }

      setMessage(
        `Client ${newIsActive ? "activated" : "deactivated"} successfully!`
      );
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      console.error("Error updating client status:", error);
      setMessage("Failed to update client status");
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out:", error);
    }
    localStorage.removeItem("currentSuperAdmin");
    localStorage.removeItem("currentClientAdmin");
    localStorage.removeItem("currentUser");
    window.location.replace("/");
  };

  const fetchClientDetails = async (clientId, client = selectedClient) => {
    try {
      setLoadingDetails(true);
      const superadminId = "hdXje7ZvCbj7eOugVLiZ";

      // Fetch users from global users collection filtered by created_by
      let users = [];
      try {
        const globalUsersRef = collection(db, "users");
        const globalUsersSnapshot = await getDocs(globalUsersRef);

        globalUsersSnapshot.forEach((doc) => {
          const userData = doc.data();
          if (userData.created_by === client?.email) {
            users.push({ id: doc.id, ...userData });
          }
        });
      } catch (error) {
        console.error("Error fetching from global users collection:", error);
      }

      // Fetch surveys
      const surveysRef = collection(
        db,
        "superadmin",
        superadminId,
        "clients",
        clientId,
        "surveys"
      );
      const surveysSnapshot = await getDocs(surveysRef);
      const surveys = [];
      surveysSnapshot.forEach((doc) => {
        surveys.push({ id: doc.id, ...doc.data() });
      });

      // Fetch questions
      const questionsRef = collection(
        db,
        "superadmin",
        superadminId,
        "clients",
        clientId,
        "questions"
      );
      const questionsSnapshot = await getDocs(questionsRef);
      const questions = [];
      questionsSnapshot.forEach((doc) => {
        questions.push({ id: doc.id, ...doc.data() });
      });

      console.log("Final client details:", {
        users: users.length,
        surveys: surveys.length,
        questions: questions.length,
      });
      setClientDetails({ users, surveys, questions });
    } catch (error) {
      console.error("Error fetching client details:", error);
    } finally {
      setLoadingDetails(false);
    }
  };

  const openClientModal = async (client) => {
    setSelectedClient(client);
    setIsClientModalOpen(true);
    await fetchClientDetails(client.id, client);
  };

  const closeClientModal = () => {
    setIsClientModalOpen(false);
    setSelectedClient(null);
    setClientDetails({ users: [], surveys: [], questions: [] });
  };

  const renderContent = () => {
    switch (activeTab) {
      case "clients":
        return (
          <>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
                    Client Management
                  </h1>
                  <p className="text-slate-600 text-sm sm:text-base mt-1 sm:mt-2">
                    Manage your client administrators
                  </p>
                </div>
                <Button
                  onClick={() => setShowCreateForm(true)}
                  className="bg-slate-900 hover:bg-slate-800 h-10 sm:h-11 px-4 sm:px-6 w-full sm:w-auto"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add New Client
                </Button>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
                <div className="bg-white p-4 sm:p-6 rounded-lg border border-slate-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs sm:text-sm font-medium text-slate-500">
                        Total
                      </p>
                      <p className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
                        {clientAdmins.length}
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
                        Active
                      </p>
                      <p className="text-xl sm:text-2xl font-bold text-green-600 mt-1">
                        {clientAdmins.filter((c) => c.status === "active").length}
                      </p>
                    </div>
                    <div className="bg-green-50 p-2 sm:p-3 rounded-lg">
                      <UserCheck className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-white p-4 sm:p-6 rounded-lg border border-slate-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs sm:text-sm font-medium text-slate-500">
                        Pending
                      </p>
                      <p className="text-xl sm:text-2xl font-bold text-amber-600 mt-1">
                        {clientAdmins.filter((c) => c.status === "pending").length}
                      </p>
                    </div>
                    <div className="bg-amber-50 p-2 sm:p-3 rounded-lg">
                      <Mail className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-white p-4 sm:p-6 rounded-lg border border-slate-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs sm:text-sm font-medium text-slate-500">
                        Inactive
                      </p>
                      <p className="text-xl sm:text-2xl font-bold text-red-600 mt-1">
                        {clientAdmins.filter((c) => c.status === "inactive").length}
                      </p>
                    </div>
                    <div className="bg-red-50 p-2 sm:p-3 rounded-lg">
                      <UserX className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" />
                    </div>
                  </div>
                </div>
              </div>

              {message && (
                <div
                  className={`mb-6 p-4 rounded-lg border ${
                    message.includes("success") || message.includes("✅")
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
                  <div className="flex sm:flex-row flex-col items-center justify-between px-4 sm:px-6 gap-4">
                    <div className="flex gap-1 overflow-x-auto">
                    <button
                      onClick={() => setClientFilterTab("all")}
                      className={`px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                        clientFilterTab === "all"
                          ? "border-slate-900 text-slate-900"
                          : "border-transparent text-slate-500 hover:text-slate-700"
                      }`}
                    >
                      All ({clientAdmins.length})
                    </button>
                    <button
                      onClick={() => setClientFilterTab("active")}
                      className={`px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                        clientFilterTab === "active"
                          ? "border-green-600 text-green-600"
                          : "border-transparent text-slate-500 hover:text-slate-700"
                      }`}
                    >
                      Active ({clientAdmins.filter((c) => c.status === "active").length})
                    </button>
                    <button
                      onClick={() => setClientFilterTab("pending")}
                      className={`px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                        clientFilterTab === "pending"
                          ? "border-amber-600 text-amber-600"
                          : "border-transparent text-slate-500 hover:text-slate-700"
                      }`}
                    >
                      Pending ({clientAdmins.filter((c) => c.status === "pending").length})
                    </button>
                    <button
                      onClick={() => setClientFilterTab("inactive")}
                      className={`px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                        clientFilterTab === "inactive"
                          ? "border-red-600 text-red-600"
                          : "border-transparent text-slate-500 hover:text-slate-700"
                      }`}
                    >
                      Inactive ({clientAdmins.filter((c) => c.status === "inactive").length})
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

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase">
                          Company
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase">
                          Email
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase">
                          Status
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase">
                          Created
                        </th>
                        <th className="px-6 py-4 text-right text-xs font-semibold text-slate-600 uppercase">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {loading ? (
                        <tr>
                          <td
                            colSpan="5"
                            className="px-6 py-12 text-center text-slate-600"
                          >
                            Loading...
                          </td>
                        </tr>
                      ) : clientAdmins.filter(
                          (c) =>
                            (clientFilterTab === "all" ||
                            c.status === clientFilterTab) &&
                            (searchQuery === "" ||
                              (c.company_name || c.name).toLowerCase().includes(searchQuery.toLowerCase()) ||
                              c.email.toLowerCase().includes(searchQuery.toLowerCase()))
                        ).length === 0 ? (
                        <tr>
                          <td
                            colSpan="5"
                            className="px-6 py-12 text-center text-slate-500"
                          >
                            No clients found
                          </td>
                        </tr>
                      ) : (
                        clientAdmins
                          .filter(
                            (c) =>
                              (clientFilterTab === "all" ||
                              c.status === clientFilterTab) &&
                              (searchQuery === "" ||
                                (c.company_name || c.name).toLowerCase().includes(searchQuery.toLowerCase()) ||
                                c.email.toLowerCase().includes(searchQuery.toLowerCase()))
                          )
                          .map((admin) => (
                            <tr
                              key={admin.id}
                              className="hover:bg-slate-50 cursor-pointer"
                              onClick={() => openClientModal(admin)}
                            >
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-2">
                                  <Building className="w-4 h-4 text-slate-400" />
                                  <span className="font-medium text-slate-900">
                                    {admin.company_name || admin.name}
                                  </span>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-sm text-slate-600">
                                {admin.email}
                              </td>
                              <td className="px-6 py-4">
                                <span
                                  className={`inline-flex px-2.5 py-1 text-xs font-medium rounded-full ${
                                    admin.status === "active"
                                      ? "bg-green-100 text-green-700"
                                      : admin.status === "pending"
                                        ? "bg-amber-100 text-amber-700"
                                        : "bg-red-100 text-red-700"
                                  }`}
                                >
                                  {admin.status === "active"
                                    ? "Active"
                                    : admin.status === "pending"
                                      ? "Pending"
                                      : "Inactive"}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-sm text-slate-600">
                                {new Date(admin.createdAt).toLocaleDateString()}
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex items-center justify-end gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      resendPasswordEmail(admin.email);
                                    }}
                                    className="h-8 w-8 p-0"
                                  >
                                    <Mail className="w-4 h-4" />
                                  </Button>
                                  {admin.status === "active" && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        toggleClientStatus(
                                          admin.id,
                                          admin.isActive
                                        );
                                      }}
                                      className="h-8 w-8 p-0"
                                    >
                                      <UserX className="w-4 h-4" />
                                    </Button>
                                  )}
                                  {admin.status === "inactive" && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        toggleClientStatus(
                                          admin.id,
                                          admin.isActive
                                        );
                                      }}
                                      className="h-8 w-8 p-0"
                                    >
                                      <UserCheck className="w-4 h-4" />
                                    </Button>
                                  )}
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setEditingClient(admin);
                                      setEditFormData({
                                        name: admin.company_name || admin.name,
                                      });
                                      setIsEditModalOpen(true);
                                    }}
                                    className="h-8 w-8 p-0"
                                  >
                                    <Edit3 className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={(e) => openDeleteModal(e, admin)}
                                    className="h-8 w-8 p-0"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </>
        );
      case "results":
        return <SurveyResult />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <TopBar
        setActiveTab={setActiveTab}
        onLogout={handleLogout}
        isSuperAdmin={true}
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
      />
      <SuperAdminSidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onSidebarToggle={(isOpen) => {
          setSidebarOpen(isOpen);
          setIsSidebarOpen(isOpen);
        }}
      />

      <main
        className={`transition-all duration-300 pt-20 bg-gray-50 min-h-screen ${
          isSidebarOpen ? "lg:ml-64" : "lg:ml-16"
        }`}
      >
        {renderContent()}
      </main>

      {/* Client Details Modal */}
      {isClientModalOpen && selectedClient && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {selectedClient.company_name || selectedClient.name}
                </h2>
                <p className="text-gray-600">{selectedClient.email}</p>
              </div>
              <button
                onClick={closeClientModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              {loadingDetails ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-gray-500">Loading client details...</div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Stats Overview */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Users className="w-5 h-5 text-blue-600" />
                        <span className="font-semibold text-blue-900">
                          Users
                        </span>
                      </div>
                      <p className="text-2xl font-bold text-blue-600 mt-1">
                        {clientDetails.users.length}
                      </p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <div className="flex items-center gap-2">
                        <FileText className="w-5 h-5 text-green-600" />
                        <span className="font-semibold text-green-900">
                          Surveys
                        </span>
                      </div>
                      <p className="text-2xl font-bold text-green-600 mt-1">
                        {clientDetails.surveys.length}
                      </p>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <div className="flex items-center gap-2">
                        <HelpCircle className="w-5 h-5 text-purple-600" />
                        <span className="font-semibold text-purple-900">
                          Questions
                        </span>
                      </div>
                      <p className="text-2xl font-bold text-purple-600 mt-1">
                        {clientDetails.questions.length}
                      </p>
                    </div>
                  </div>

                  {/* Users Section */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <Users className="w-5 h-5" />
                      Users ({clientDetails.users.length})
                    </h3>
                    {clientDetails.users.length > 0 ? (
                      <div className="bg-gray-50 rounded-lg p-4 max-h-48 overflow-y-auto">
                        <div className="space-y-2">
                          {clientDetails.users.map((user) => (
                            <div
                              key={user.id}
                              className="flex items-center justify-between bg-white p-3 rounded border"
                            >
                              <div>
                                <p className="font-medium">
                                  {user.full_name || user.name}
                                </p>
                                <p className="text-sm text-gray-600">
                                  {user.email}
                                </p>
                              </div>
                              <span
                                className={`px-2 py-1 text-xs rounded-full ${
                                  user.status === "active"
                                    ? "bg-green-100 text-green-800"
                                    : user.status === "inactive"
                                      ? "bg-red-100 text-red-800"
                                      : "bg-yellow-100 text-yellow-800"
                                }`}
                              >
                                {user.status || "pending"}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <p className="text-gray-500 text-center py-4 bg-gray-50 rounded-lg">
                        No users created yet
                      </p>
                    )}
                  </div>

                  {/* Surveys Section */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      Surveys ({clientDetails.surveys.length})
                    </h3>
                    {clientDetails.surveys.length > 0 ? (
                      <div className="bg-gray-50 rounded-lg p-4 max-h-48 overflow-y-auto">
                        <div className="space-y-2">
                          {clientDetails.surveys.map((survey) => (
                            <div
                              key={survey.id}
                              className="bg-white p-3 rounded border"
                            >
                              <p className="font-medium">{survey.name}</p>
                              <p className="text-sm text-gray-600">
                                Questions:{" "}
                                {survey.questionCount ||
                                  survey.questions?.length ||
                                  0}
                              </p>
                              <p className="text-sm text-gray-500">
                                Created:{" "}
                                {survey.createdAt
                                  ? new Date(
                                      survey.createdAt
                                    ).toLocaleDateString()
                                  : "N/A"}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <p className="text-gray-500 text-center py-4 bg-gray-50 rounded-lg">
                        No surveys created yet
                      </p>
                    )}
                  </div>

                  {/* Questions Section */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <HelpCircle className="w-5 h-5" />
                      Questions ({clientDetails.questions.length})
                    </h3>
                    {clientDetails.questions.length > 0 ? (
                      <div className="bg-gray-50 rounded-lg p-4 max-h-48 overflow-y-auto">
                        <div className="space-y-2">
                          {clientDetails.questions.map((question) => (
                            <div
                              key={question.id}
                              className="bg-white p-3 rounded border"
                            >
                              <p className="font-medium">{question.text}</p>
                              <div className="flex items-center gap-4 mt-1">
                                <span className="text-sm text-gray-600">
                                  Type: {question.type}
                                </span>
                                {question.options &&
                                  question.options.length > 0 && (
                                    <span className="text-sm text-gray-600">
                                      Options: {question.options.length}
                                    </span>
                                  )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <p className="text-gray-500 text-center py-4 bg-gray-50 rounded-lg">
                        No questions created yet
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end p-6 border-t bg-gray-50">
              <Button onClick={closeClientModal} variant="outline">
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Client Modal */}
      {(isEditModalOpen || showCreateForm) && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full shadow-xl">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-bold text-slate-900">
                {editingClient ? "Edit Client" : "Add New Client"}
              </h2>
              <button
                onClick={() => {
                  setIsEditModalOpen(false);
                  setShowCreateForm(false);
                  setEditingClient(null);
                  setEditFormData({ name: "" });
                  setFormData({ name: "", email: "", clientId: "" });
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <form
              onSubmit={editingClient ? handleEditSubmit : handleSubmit}
              className="p-6 space-y-4"
            >
              <div>
                <Label
                  htmlFor="modalName"
                  className="text-slate-700 font-medium"
                >
                  Company Name *
                </Label>
                <Input
                  id="modalName"
                  type="text"
                  value={editingClient ? editFormData.name : formData.name}
                  onChange={(e) =>
                    editingClient
                      ? setEditFormData({ name: e.target.value })
                      : setFormData({ ...formData, name: e.target.value })
                  }
                  required
                  className="mt-1.5"
                  placeholder="Enter company name"
                />
              </div>
              <div>
                <Label
                  htmlFor="modalEmail"
                  className="text-slate-700 font-medium"
                >
                  Admin Email {editingClient ? "" : "*"}
                </Label>
                <Input
                  id="modalEmail"
                  type="email"
                  value={editingClient ? editingClient.email : formData.email}
                  onChange={(e) =>
                    !editingClient &&
                    setFormData({ ...formData, email: e.target.value })
                  }
                  disabled={!!editingClient}
                  required={!editingClient}
                  className={`mt-1.5 ${editingClient ? "bg-slate-50" : ""}`}
                  placeholder="admin@company.com"
                />
                {!editingClient && (
                  <p className="text-xs text-slate-500 mt-1.5">
                    Password setup email will be sent automatically
                  </p>
                )}
              </div>
              {editingClient ? (
                <>
                  <div>
                    <Label
                      htmlFor="modalClientId"
                      className="text-slate-700 font-medium"
                    >
                      Client ID
                    </Label>
                    <Input
                      id="modalClientId"
                      type="text"
                      value={editingClient.clientId || editingClient.id}
                      disabled
                      className="bg-slate-50 mt-1.5"
                    />
                  </div>
                  <div>
                    <Label
                      htmlFor="modalCreated"
                      className="text-slate-700 font-medium"
                    >
                      Created
                    </Label>
                    <Input
                      id="modalCreated"
                      type="text"
                      value={new Date(
                        editingClient.createdAt
                      ).toLocaleDateString()}
                      disabled
                      className="bg-slate-50 mt-1.5"
                    />
                  </div>
                </>
              ) : (
                <div>
                  <Label
                    htmlFor="modalClientId"
                    className="text-slate-700 font-medium"
                  >
                    Client ID (Optional)
                  </Label>
                  <Input
                    id="modalClientId"
                    type="text"
                    value={formData.clientId}
                    onChange={(e) =>
                      setFormData({ ...formData, clientId: e.target.value })
                    }
                    className="mt-1.5"
                    placeholder="Auto-generated if empty"
                  />
                </div>
              )}
              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setShowCreateForm(false);
                    setEditingClient(null);
                    setEditFormData({ name: "" });
                    setFormData({ name: "", email: "", clientId: "" });
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
                  {editingClient ? (
                    <>
                      <Edit3 className="w-4 h-4 mr-2" />
                      Update Client
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      {loading ? "Creating..." : "Create Client"}
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && clientToDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-bold text-gray-900">
                Confirm Delete
              </h2>
              <button
                onClick={closeDeleteModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6">
              <p className="text-gray-600 mb-4">
                Are you sure you want to delete{" "}
                <strong>{clientToDelete.name}</strong>? This action cannot be
                undone.
              </p>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={closeDeleteModal}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={confirmDelete}
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

export default SuperAdminDashboardAPI;
