import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import {
  Plus,
  Users,
  Building,
  Edit,
  Edit3,
  Trash2,
  Mail,
  UserPlus,
  UserCheck,
  UserX,
  Search,
  X,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../../ui/dialog";
import ClientAdminHeader from "./ClientAdminHeader";
import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  deleteUser,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { db, auth } from "../../../firebase";
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  doc,
  deleteDoc,
  setDoc,
  updateDoc,
  getDocs,
  where,
} from "firebase/firestore";
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

import { FIREBASE_CONFIG } from "../../../config/firebaseConfig";

// Create secondary Firebase app for user creation
const secondaryApp = initializeApp(FIREBASE_CONFIG, "secondary");

const secondaryAuth = getAuth(secondaryApp);

const CreateUsersAPI = ({ profile, onProfileEdit, onLogout }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editFormData, setEditFormData] = useState({
    full_name: "",
    email: "",
  });
  const [filterTab, setFilterTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Get client ID and superadmin ID dynamically
  const [clientId, setClientId] = useState(null);
  const [superadminId, setSuperadminId] = useState(null);

  // Function to get client ID using client email
  const getClientData = async (clientEmail) => {
    try {
      console.log("Searching for client with email:", clientEmail);
      const superadminId = "hdXje7ZvCbj7eOugVLiZ";
      const clientsRef = collection(db, "superadmin", superadminId, "clients");
      const q = query(clientsRef, where("email", "==", clientEmail));
      const clientsSnapshot = await getDocs(q);
      console.log("Found clients:", clientsSnapshot.docs.length);

      if (!clientsSnapshot.empty) {
        const clientDoc = clientsSnapshot.docs[0];
        console.log(
          "Match found! Client ID:",
          clientDoc.id,
          "Superadmin ID:",
          superadminId
        );
        return { clientId: clientDoc.id, superadminId: superadminId };
      }

      console.log("No matching client found");
      return { clientId: null, superadminId: null };
    } catch (error) {
      console.error("Error getting client data:", error);
      return { clientId: null, superadminId: null };
    }
  };

  useEffect(() => {
    const initializeClientData = async () => {
      try {
        // Wait for auth to be ready
        const currentUser = auth.currentUser;
        if (!currentUser?.email) {
          console.log("Auth not ready, retrying in 1 second...");
          setTimeout(initializeClientData, 1000);
          return;
        }

        console.log("Getting client data for user:", currentUser.email);
        const { clientId: id, superadminId: superAdminId } =
          await getClientData(currentUser.email);
        console.log("Retrieved client data:", {
          clientId: id,
          superadminId: superAdminId,
        });

        if (!id) {
          console.warn(
            "Unable to find client ID, but continuing with email-based queries"
          );
        }
        setClientId(id);
        setSuperadminId(superAdminId);
      } catch (err) {
        console.error("Failed to get client data:", err.message);
      }
    };

    initializeClientData();
  }, []);

  useEffect(() => {
    const setupUserListener = async () => {
      try {
        setInitializing(true);

        // Wait for auth to be ready
        const currentUser = auth.currentUser;
        if (!currentUser?.email) {
          // Wait a bit for auth to initialize
          setTimeout(setupUserListener, 1000);
          return;
        }

        console.log("Setting up user listener for:", currentUser.email);

        const usersRef = collection(db, "users");
        const q = query(usersRef, where("created_by", "==", currentUser.email));

        const unsubscribe = onSnapshot(
          q,
          (snapshot) => {
            console.log(
              "Users snapshot received, count:",
              snapshot.docs.length
            );
            const usersData = snapshot.docs
              .map((doc) => {
                const data = { id: doc.id, ...doc.data() };
                console.log("User data:", data);
                return data;
              })
              .sort((a, b) => new Date(b.created_at) - new Date(a.created_at)); // Sort in JavaScript
            setUsers(usersData);
            setInitializing(false);
          },
          (error) => {
            console.error("Error in users listener:", error);
            setError("Failed to load users: " + error.message);
            setInitializing(false);
          }
        );

        return unsubscribe;
      } catch (error) {
        console.error("Error setting up user listener:", error);
        setError("Failed to initialize user listener");
        setInitializing(false);
      }
    };

    let unsubscribe;
    setupUserListener().then((unsub) => {
      unsubscribe = unsub;
    });

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []); // Remove clientId dependency

  console.log("Using clientId:", clientId);
  console.log("Profile:", profile);
  console.log(
    "Database path will be: superadmin/hdXje7ZvCbj7eOugVLiZ/clients/" +
      clientId +
      "/users"
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (!formData.full_name.trim() || !formData.email.trim()) {
      setLoading(false);
      return;
    }

    try {
      // Get current user (client) email for created_by field
      const currentUser = auth.currentUser;
      if (!currentUser?.email) {
        throw new Error("User not authenticated. Please log in again.");
      }
      const clientEmail = currentUser.email;

      // First create Firebase user to get the UID
      console.log("Creating Firebase user for:", formData.email.trim());
      const tempPassword = `Temp${Date.now()}!`;
      const userCredential = await createUserWithEmailAndPassword(
        secondaryAuth,
        formData.email.trim(),
        tempPassword
      );
      const firebaseUID = userCredential.user.uid;
      console.log("Firebase user created with UID:", firebaseUID);

      // Send password reset email
      await sendPasswordResetEmail(secondaryAuth, formData.email.trim());
      console.log("Password reset email sent");

      // Get fresh client data at time of user creation
      console.log("Getting fresh client data for user creation...");
      const { clientId: currentClientId, superadminId: currentSuperadminId } =
        await getClientData(clientEmail);
      console.log("Fresh client data:", {
        clientId: currentClientId,
        superadminId: currentSuperadminId,
      });
      console.log("User data will include:", {
        client_id: currentClientId,
        superadmin_id: currentSuperadminId,
      });

      // Create user document with Firebase UID as document ID
      const userData = {
        city: "",
        created_at: new Date().toISOString(),
        created_by: clientEmail,
        education: "",
        email: formData.email.trim(),
        email_verified: true,
        full_name: formData.full_name.trim(),
        gender: "",
        id: firebaseUID,
        is_active: true,
        status: "pending",
        is_profile_complete: false,
        phone: "",
        profile_photo: "",
        updated_at: new Date().toISOString(),
        client_id: currentClientId,
        superadmin_id: currentSuperadminId,
      };

      console.log(
        "Creating user document with Firebase UID as document ID:",
        firebaseUID
      );
      const userDocRef = doc(db, "users", firebaseUID);
      await setDoc(userDocRef, userData);

      console.log(
        "✅ User successfully added to /users collection with Firebase UID as document ID"
      );

      setFormData({ full_name: "", email: "" });
      setMessage(
        `✅ User created successfully! Password setup email sent to ${formData.email.trim()}`
      );
      setError(null);
      setTimeout(() => setMessage(""), 8000);
    } catch (err) {
      const errorMsg = err.message.replace(/Firebase: Error \(auth\//gi, '').replace(/\)/g, '').replace(/Firebase:/gi, '').trim();
      setError(`❌ Failed to create user: ${errorMsg}`);
      setTimeout(() => setError(null), 8000);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (userId) => {
    try {
      setLoading(true);
      const user = users.find((u) => u.id === userId);

      let newIsActive, newStatus;
      if (user.status === "pending") {
        newIsActive = true;
        newStatus = "active";
      } else {
        newIsActive = !user.is_active;
        newStatus = newIsActive ? "active" : "inactive";
      }

      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, {
        is_active: newIsActive,
        status: newStatus,
        updated_at: new Date().toISOString(),
      });

      setMessage(
        `✅ User ${newIsActive ? "activated" : "deactivated"} successfully!`
      );
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      setMessage(`❌ Failed to update user status: ${err.message}`);
      setTimeout(() => setMessage(""), 5000);
    } finally {
      setLoading(false);
    }
  };

  const openDeleteModal = (user) => {
    setUserToDelete(user);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (userToDelete) {
      try {
        setLoading(true);

        // Store current user to protect it
        const currentUser = auth.currentUser;

        // Verify we're not deleting the current user
        if (currentUser && currentUser.uid === userToDelete.id) {
          setMessage("❌ Cannot delete currently logged-in user!");
          setTimeout(() => setMessage(""), 5000);
          return;
        }

        let authDeleted = false;
        let firestoreDeleted = false;

        // Try backend deletion first
        try {
          const response = await fetch(
            `${import.meta.env.VITE_API_BASE_URL}/api/delete-user/${userToDelete.id}`,
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
              authDeleted = true;
              console.log("User deleted from Firebase Auth via backend");
            }
          }
        } catch (backendError) {
          console.log("Backend deletion failed, trying client-side...");
        }

        // Delete from Firestore (always do this)
        try {
          // Verify the user ID matches before deletion
          if (userToDelete.id) {
            const userRef = doc(db, "users", userToDelete.id);
            await deleteDoc(userRef);
            firestoreDeleted = true;
            console.log(`User ${userToDelete.id} deleted from Firestore`);
          }
        } catch (firestoreError) {
          console.error("Firestore deletion failed:", firestoreError);
        }

        // Show appropriate message
        if (firestoreDeleted) {
          setMessage("✅ User deleted successfully!");
        } else {
          setMessage("❌ Failed to delete user.");
        }

        setTimeout(() => setMessage(""), 3000);
      } catch (err) {
        setMessage(`❌ Failed to delete user: ${err.message}`);
        setTimeout(() => setMessage(""), 5000);
      } finally {
        setLoading(false);
      }
    }
    setIsDeleteModalOpen(false);
    setUserToDelete(null);
  };

  const cancelDelete = () => {
    setIsDeleteModalOpen(false);
    setUserToDelete(null);
  };

  const openEditModal = (user) => {
    setEditingUser(user);
    setEditFormData({
      full_name: user.full_name,
      email: user.email,
    });
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      const userRef = doc(db, "users", editingUser.id);
      await updateDoc(userRef, {
        full_name: editFormData.full_name.trim(),
        updated_at: new Date().toISOString(),
      });

      setMessage("✅ User updated successfully!");
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      setMessage(`❌ Failed to update user: ${err.message}`);
      setTimeout(() => setMessage(""), 5000);
    } finally {
      setLoading(false);
      setIsEditModalOpen(false);
      setEditingUser(null);
    }
  };

  const clearError = () => {
    setError(null);
    setMessage("");
  };

  const createFirebaseUser = async (email) => {
    try {
      console.log("Creating user for:", email);
      const tempPassword = `Temp${Date.now()}!`;
      const userCredential = await createUserWithEmailAndPassword(
        secondaryAuth,
        email,
        tempPassword
      );
      console.log("Firebase user created:", userCredential.user.uid);

      await sendPasswordResetEmail(secondaryAuth, email);
      console.log("Password reset email sent");

      setMessage(
        `✅ User created and password setup email sent to ${email}`
      );
      setTimeout(() => setMessage(""), 8000);
    } catch (error) {
      console.error("Error creating user:", error);
      if (error.code === "email-already-in-use") {
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
      await sendPasswordResetEmail(secondaryAuth, email);
      console.log("Password reset email sent successfully");
      setMessage(`✅ Password setup email sent to ${email}`);
      setTimeout(() => setMessage(""), 5000);
    } catch (error) {
      console.error("Error sending password reset email:", error);
      if (error.code === "user-not-found") {
        setMessage(
          `❌ User ${email} not found. Please create the user first.`
        );
      } else if (error.code === "invalid-email") {
        setMessage(`❌ Invalid email address: ${email}`);
      } else {
        setMessage(`❌ Failed to send email: ${error.message}`);
      }
      setTimeout(() => setMessage(""), 8000);
    }
  };

  const getFilteredUsers = () => {
    let filtered = users;
    
    if (filterTab === "active") {
      filtered = users.filter(u => u.status === "active");
    } else if (filterTab === "pending") {
      filtered = users.filter(u => u.status === "pending");
    } else if (filterTab === "inactive") {
      filtered = users.filter(u => u.status === "inactive");
    }

    if (searchQuery) {
      filtered = filtered.filter(u => 
        u.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return filtered;
  };

  const filteredUsers = getFilteredUsers();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
            User Management
          </h1>
          <p className="text-slate-600 text-sm sm:text-base mt-1 sm:mt-2">
            Create and manage survey participants
          </p>
        </div>
        <Button
          onClick={() => setShowCreateForm(true)}
          className="bg-slate-900 hover:bg-slate-800 h-10 sm:h-11 px-4 sm:px-6 w-full sm:w-auto"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add New User
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
                {users.length}
              </p>
            </div>
            <div className="bg-blue-50 p-2 sm:p-3 rounded-lg">
              <Users className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
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
                {users.filter((u) => u.status === "active").length}
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
                {users.filter((u) => u.status === "pending").length}
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
                {users.filter((u) => u.status === "inactive").length}
              </p>
            </div>
            <div className="bg-red-50 p-2 sm:p-3 rounded-lg">
              <UserX className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {(message || error) && (
        <div
          className={`mb-6 p-4 rounded-lg border ${
            message && (message.includes("success") || message.includes("✅"))
              ? "bg-green-50 text-green-700 border-green-200"
              : "bg-red-50 text-red-700 border-red-200"
          }`}
        >
          {error || message}
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
                All ({users.length})
              </button>
              <button
                onClick={() => setFilterTab("active")}
                className={`hidden sm:block px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  filterTab === "active"
                    ? "border-green-600 text-green-600"
                    : "border-transparent text-slate-500 hover:text-slate-700"
                }`}
              >
                Active ({users.filter((u) => u.status === "active").length})
              </button>
              <button
                onClick={() => setFilterTab("pending")}
                className={`hidden sm:block px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  filterTab === "pending"
                    ? "border-amber-600 text-amber-600"
                    : "border-transparent text-slate-500 hover:text-slate-700"
                }`}
              >
                Pending ({users.filter((u) => u.status === "pending").length})
              </button>
              <button
                onClick={() => setFilterTab("inactive")}
                className={`hidden sm:block px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  filterTab === "inactive"
                    ? "border-red-600 text-red-600"
                    : "border-transparent text-slate-500 hover:text-slate-700"
                }`}
              >
                Inactive ({users.filter((u) => u.status === "inactive").length})
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
                  Name
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
              {(loading || initializing) ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-slate-600">
                    Loading...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-slate-500">
                    No users found
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-slate-400" />
                        <span className="font-medium text-slate-900">
                          {user.full_name}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {user.email}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex px-2.5 py-1 text-xs font-medium rounded-full ${
                          user.status === "active"
                            ? "bg-green-100 text-green-700"
                            : user.status === "pending"
                              ? "bg-amber-100 text-amber-700"
                              : "bg-red-100 text-red-700"
                        }`}
                      >
                        {user.status === "active"
                          ? "Active"
                          : user.status === "pending"
                            ? "Pending"
                            : "Inactive"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {user.created_at
                        ? new Date(user.created_at).toLocaleDateString()
                        : "N/A"}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => resendPasswordEmail(user.email)}
                          className="h-8 w-8 p-0"
                        >
                          <Mail className="w-4 h-4" />
                        </Button>
                        {user.status === "active" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleToggleStatus(user.id)}
                            className="h-8 w-8 p-0"
                          >
                            <UserX className="w-4 h-4" />
                          </Button>
                        )}
                        {(user.status === "inactive" || user.status === "pending") && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleToggleStatus(user.id)}
                            className="h-8 w-8 p-0"
                          >
                            <UserCheck className="w-4 h-4" />
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditModal(user)}
                          className="h-8 w-8 p-0"
                        >
                          <Edit3 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openDeleteModal(user)}
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

      {/* Create User Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full shadow-xl">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-bold text-slate-900">
                Add New User
              </h2>
              <button
                onClick={() => {
                  setShowCreateForm(false);
                  setFormData({ full_name: "", email: "" });
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={(e) => {
              handleSubmit(e);
              if (!loading) setShowCreateForm(false);
            }} className="p-6 space-y-4">
              <div>
                <Label htmlFor="full_name" className="text-slate-700 font-medium">
                  Full Name *
                </Label>
                <Input
                  id="full_name"
                  type="text"
                  value={formData.full_name}
                  onChange={(e) =>
                    setFormData({ ...formData, full_name: e.target.value })
                  }
                  required
                  className="mt-1.5"
                  placeholder="Enter full name"
                />
              </div>
              <div>
                <Label htmlFor="email" className="text-slate-700 font-medium">
                  Email Address *
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  required
                  className="mt-1.5"
                  placeholder="user@company.com"
                />
                <p className="text-xs text-slate-500 mt-1.5">
                  Password setup email will be sent automatically
                </p>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowCreateForm(false);
                    setFormData({ full_name: "", email: "" });
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
                  {loading ? "Creating..." : "Create User"}
                </Button>
              </div>
            </form>
          </div>
        </div>
    )}

    {/* Edit User Modal */}
    {isEditModalOpen && (
        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit User</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <Label htmlFor="edit_full_name">Full Name *</Label>
                <Input
                  id="edit_full_name"
                  type="text"
                  value={editFormData.full_name}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      full_name: e.target.value,
                    })
                  }
                  placeholder="Enter full name"
                  required
                />
              </div>

              <div>
                <Label htmlFor="edit_email">Email Address *</Label>
                <Input
                  id="edit_email"
                  type="email"
                  value={editFormData.email}
                  disabled
                  className="bg-gray-100"
                  placeholder="Enter email address"
                  required
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-blue-700 to-purple-700 hover:from-blue-600 hover:to-purple-700"
                  disabled={loading}
                >
                  {loading ? "Updating..." : "Update User"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditModalOpen(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
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
              <strong>{userToDelete?.full_name}</strong>?
            </p>
            <p className="text-sm text-gray-600">
              This action cannot be undone.
            </p>

            <div className="flex gap-2 pt-4">
              <Button
                onClick={confirmDelete}
                className="flex-1 bg-red-600 hover:bg-red-700"
                disabled={loading}
              >
                {loading ? "Deleting..." : "Delete User"}
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

export default CreateUsersAPI;
