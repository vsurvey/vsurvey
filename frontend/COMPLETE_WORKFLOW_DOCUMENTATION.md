# V-Survey Platform - Complete Workflow Documentation

## Table of Contents
1. [System Overview](#system-overview)
2. [Authentication & Access Control](#authentication--access-control)
3. [Super Admin Workflow](#super-admin-workflow)
4. [Client Admin Workflow](#client-admin-workflow)
5. [Technical Architecture](#technical-architecture)
6. [Data Flow & Permissions](#data-flow--permissions)
7. [Email Automation](#email-automation)

---

## System Overview

The V-Survey Platform is a multi-tenant survey management system with a hierarchical structure:
- **Super Admin** → **Client Admin** → **Users**
- Built with React.js frontend and FastAPI backend
- Firebase Firestore for database and Firebase Auth for authentication
- Real-time updates and status monitoring
- Complete data isolation between clients

### Key Features
- Dual Firebase authentication setup (primary + secondary)
- Real-time client status monitoring with auto-logout
- Cascading user deactivation
- Email automation for password setup
- Complete CRUD operations for all entities
- Advanced survey results analytics with filtering and sorting

---

## Authentication & Access Control

### Firebase Authentication Structure
```
Primary Firebase Auth: Main authentication for login sessions
Secondary Firebase Auth: User creation without affecting main session
```

### User Types & Access Levels
1. **Super Admin**: Full system access, client management
2. **Client Admin**: Client-specific access, user and survey management
3. **Users**: Mobile app access only (survey participation)

### Login Flow Priority
**First Access Point**: Login Page

---

## Super Admin Workflow

### 1. Super Admin Login Process

#### Step 1: Access Login Page

- **URL**: Root path (`/`)
- **Credentials**: 
  - Email: `superadmin@vsurvey.com`
  - Password: `superadmin123`

#### Step 2: Authentication Flow
1. User enters hardcoded Super Admin credentials
2. System validates credentials locally (no Firebase auth for Super Admin)
3. Sets `localStorage.setItem('currentSuperAdmin', JSON.stringify({ email: email }))`
4. Redirects to Super Admin Dashboard

#### Step 3: Dashboard Access
- **Component**: `SuperAdminDashboardAPI.jsx`
- **Features**: Client management, statistics, real-time monitoring

---

### 2. Super Admin Dashboard Page

#### Overview Section
- **Total Clients**: Real-time count of all clients
- **Active Clients**: Clients with `status: "active"`
- **Pending Clients**: Clients with `status: "pending"`
- **Inactive Clients**: Clients with `status: "inactive"`

#### Client Management Interface

##### Create Client Admin Form
**Location**: Left panel of dashboard

**Required Fields**:
- **Company Name**: Client organization name
- **Admin Email**: Email for client admin account
- **Client ID**: Auto-generated if empty

**Step-by-Step Client Creation**:
1. Fill company name and admin email
2. Click "Create Client Admin"
3. System creates Firebase user with temporary password
4. Sends password reset email automatically
5. Creates client document in Firestore path: `/superadmin/hdXje7ZvCbj7eOugVLiZ/clients/{client_uid}`
6. Sets initial status as "pending"

##### Client List Management
**Location**: Right panel of dashboard

**For Each Client**:
- **View Details**: Click on client card to see users, surveys, questions
- **Edit Client**: Modify company name
- **Resend Email**: Send password setup email again
- **Toggle Status**: Activate/Deactivate client
- **Delete Client**: Complete removal with cascading deletion

---

### 3. Client Status Management

#### Activation Process
1. Client completes profile setup → Status changes to "active"
2. Real-time listener updates dashboard immediately
3. Client gains full access to platform features

#### Deactivation Process
1. Super Admin clicks deactivate button
2. Client status changes to "inactive"
3. **Cascading Effect**: All users created by this client are automatically deactivated
4. Client is immediately logged out via real-time monitoring
5. Client cannot log in until reactivated

#### Real-Time Monitoring
- Uses Firestore `onSnapshot` listeners
- Monitors client status changes in real-time
- Auto-logout mechanism for deactivated clients
- Status propagation to all associated users

---

### 4. Client Details Modal

#### Accessed By: Clicking on any client card

#### Information Displayed:
- **User Statistics**: Total users created by client
- **Survey Statistics**: Total surveys created
- **Question Statistics**: Total questions created
- **User List**: All users with status indicators
- **Survey List**: All surveys with question counts
- **Question List**: All questions with types and options

---

### 5. Email Flow Management

#### Password Setup Email Process:
1. **Automatic Send**: On client creation
2. **Manual Resend**: Via resend button
3. **Email Content**: Firebase password reset email
4. **Link Destination**: Client profile setup page

#### Email Tracking:
- Success/failure messages displayed
- Automatic retry mechanism
- Spam folder notification included

---

## Client Admin Workflow

### 1. Client Admin Login Process

#### Step 1: Initial Access

- **Method**: Firebase Authentication
- **First-Time Flow**: Email link → Profile Setup → Dashboard

#### Step 2: Profile Setup (Mandatory)
- **Component**: `ProfileSetup.jsx`
- **Trigger**: `is_first_time: false` (needs setup)
- **Required Fields**:
  - Profile Image (optional)
  - Name
  - Company Name
  - Company Size
  - Industry
  - Phone (with country code selector)
  - Address

#### Step 3: Profile Completion
1. Fill all required fields
2. Upload profile image (compressed automatically)
3. Click "Complete Setup"
4. Status changes from "pending" to "active"
5. Redirects to User Management page

---

### 2. User Management Page (Primary Landing)


#### Purpose: Create and manage survey participants

#### Dashboard Statistics:
- **Total Users**: All users created by this client
- **Active Users**: Users with `status: "active"`
- **Pending Users**: Users with `status: "pending"`
- **Inactive Users**: Users with `status: "inactive"`

#### User Creation Process:
1. **Fill Form**:
   - Full Name (required)
   - Email Address (required)
2. **Click "Create User"**
3. **System Actions**:
   - Creates Firebase user with temporary password
   - Sends password setup email
   - Creates user document in global `users` collection
   - Links user to client via `created_by` field

#### User Management Actions:
- **Resend Email**: Send password setup email again
- **Toggle Status**: Activate/Deactivate user
- **Edit User**: Modify user details
- **Delete User**: Remove user completely

#### Real-Time Updates:
- User list updates automatically via Firestore listeners
- Status changes reflect immediately
- Email notifications sent automatically

---

### 3. Question Management Page


#### Purpose: Create and manage survey questions

#### Question Types Supported:
1. **Multiple Choice**: With customizable options
2. **Text**: Open-ended text responses
3. **Rating**: Star rating with configurable scales (1-3, 1-5, 1-10)
4. **Yes/No**: Binary choice questions

#### Question Creation Process:
1. **Enter Question Text**
2. **Select Response Type**
3. **Configure Type-Specific Options**:
   - Multiple Choice: Add/remove options with preview
   - Rating: Select scale (1-3, 1-5, 1-10)
   - Yes/No: Automatic configuration
   - Text: No additional configuration
4. **Click "Create Question"**
5. **System Actions**:
   - Saves to client-specific questions collection
   - Also saves to backend API
   - Real-time update to questions list

#### Question Management:
- **Edit Questions**: Modify text, type, and options
- **Delete Questions**: Remove with automatic survey cleanup
- **Preview**: Live preview of question appearance
- **Sorting**: Questions sorted by creation date (newest first)

---

### 4. Survey Management Page


#### Purpose: Create surveys by combining questions

#### Survey Creation Process:
1. **Enter Survey Name**
2. **Select Questions**:
   - Search through available questions
   - Pagination for large question lists
   - Checkbox selection interface
   - Real-time question filtering
3. **Click "Create Survey"**
4. **System Actions**:
   - Creates survey document with selected question IDs
   - Stores question count for quick reference
   - Updates survey list immediately

#### Survey Management:
- **Edit Surveys**: Modify name and question selection
- **Delete Surveys**: Remove with complete cleanup:
  - Deletes all survey responses
  - Removes all user assignments
  - Cleans up assignment records
- **Question Management**: Add/remove questions from existing surveys
- **Pagination**: Handle large question lists efficiently

---

### 5. User Assignment Page


#### Purpose: Assign surveys to users

#### Assignment Process:
1. **Select Users**:
   - Search and select multiple users
   - Only shows active users
   - Multi-select with badge display
2. **Select Surveys**:
   - Search and select multiple surveys
   - Multi-select interface
   - Real-time filtering
3. **Click "Assign Surveys"**
4. **System Actions**:
   - Creates assignment records in Firestore
   - Prevents duplicate assignments
   - Sets assignments as active by default

#### Assignment Management:
- **View Assignments**: See all user-survey assignments
- **Toggle Status**: Activate/deactivate specific assignments
- **Edit Assignments**: Add more surveys to users
- **Delete Assignments**: Remove all assignments for a user
- **Real-Time Updates**: Assignment changes reflect immediately

#### Assignment Interface Features:
- **Bulk Assignment**: Assign multiple surveys to multiple users
- **Individual Management**: Edit assignments per user
- **Status Control**: Activate/deactivate assignments
- **Duplicate Prevention**: Automatic duplicate detection

---

### 6. Survey Results Page


#### Purpose: View and analyze survey responses

#### Results Dashboard:
- **Total Surveys**: Count of all surveys
- **Total Responses**: Aggregate response count across all surveys
- **Real-Time Updates**: Live response tracking

#### Survey Results Interface:
1. **Survey Cards**: Expandable cards for each survey
2. **Response Count**: Live count per survey
3. **Expand Details**: Click to view detailed responses

#### Advanced Analytics Features:

##### Filtering System:
- **Area Filter**: Filter by response area
- **Booth Number**: Filter by booth number
- **Constitution**: Filter by constitution
- **User Name**: Filter by responding user

##### Sorting Capabilities:
- **All Columns Sortable**: Click column headers to sort
- **Question Responses**: Sort by individual question answers
- **Metadata Sorting**: Sort by area, booth, constitution, location, time, user
- **Ascending/Descending**: Toggle sort direction

##### Response Data Display:
- **Serial Number**: Auto-generated row numbers
- **Question Answers**: All question responses in columns
- **Area Information**: Response area data
- **Booth Number**: Booth identification
- **Constitution**: Constitutional information
- **Location**: GPS coordinates converted to readable addresses
- **Submission Time**: Formatted timestamp
- **User Name**: Name of responding user

#### Location Services:
- **GPS Conversion**: Converts GPS coordinates to readable addresses
- **Caching**: Caches location lookups for performance
- **Fallback**: Shows coordinates if address lookup fails

#### Real-Time Features:
- **Live Response Updates**: New responses appear automatically
- **Response Counting**: Live count updates
- **Status Monitoring**: Real-time assignment status changes

---

### 7. Profile Management

#### Profile View/Edit:
- **Access**: Via header profile menu
- **Edit Mode**: Modify all profile fields
- **Image Management**: Upload, change, or remove profile photos
- **Country Code Selection**: Searchable country code dropdown
- **Validation**: Required field validation
- **Auto-Save**: Profile changes saved to Firestore

---

## Technical Architecture

### Database Structure (Firestore)
```
/superadmin/hdXje7ZvCbj7eOugVLiZ/
├── clients/{client_id}/
│   ├── questions/{question_id}
│   ├── surveys/{survey_id}/
│   │   └── responses/{response_id}
│   └── survey_assignments/{assignment_id}
└── users/ (global collection)
    └── {user_id} (with created_by field)
```

### Authentication Flow
1. **Primary Firebase Auth**: Main user sessions
2. **Secondary Firebase Auth**: User creation without logout
3. **Token Management**: Automatic token refresh
4. **Session Persistence**: localStorage for session management

### Real-Time Monitoring
- **Client Status**: Firestore listeners for auto-logout
- **User Updates**: Real-time user list updates
- **Response Tracking**: Live survey response monitoring
- **Assignment Changes**: Real-time assignment status updates

---

## Data Flow & Permissions

### Client Isolation
- Each client has dedicated Firestore subcollections
- Users linked via `created_by` field
- Complete data separation between clients
- No cross-client data access

### Permission Hierarchy
1. **Super Admin**: Full system access
2. **Client Admin**: Access only to own data
3. **Users**: Mobile app access only

### Data Relationships
- **Clients** → **Users** (via created_by)
- **Clients** → **Questions** (client-specific)
- **Clients** → **Surveys** (client-specific)
- **Surveys** → **Questions** (via question IDs)
- **Users** → **Surveys** (via assignments)

---

## Email Automation

### Password Setup Flow
1. **Trigger**: User/Client creation
2. **Method**: Firebase `sendPasswordResetEmail`
3. **Content**: Standard Firebase password reset email
4. **Destination**: Profile setup or login page
5. **Tracking**: Success/failure notifications

### Email Management
- **Automatic Sending**: On user/client creation
- **Manual Resend**: Via UI buttons
- **Error Handling**: Graceful failure management
- **Spam Notification**: User guidance for email delivery

### Email Integration Points
- **Client Creation**: Super Admin creates client
- **User Creation**: Client Admin creates user
- **Manual Resend**: Both Super Admin and Client Admin
- **Status Updates**: Email notifications for status changes

---

## Workflow Sequence Summary

### Super Admin Daily Workflow:
1. **Login** → Super Admin Dashboard
2. **Monitor** → Client statistics and status
3. **Create** → New client administrators
4. **Manage** → Client activation/deactivation
5. **Support** → Resend emails, view client details

### Client Admin Daily Workflow:
1. **Login** → Profile Setup (first time) → User Management
2. **Create Users** → Add survey participants
3. **Create Questions** → Design survey questions
4. **Create Surveys** → Combine questions into surveys
5. **Assign Surveys** → Assign surveys to users
6. **Monitor Results** → View and analyze responses

### Data Flow Sequence:
1. **Super Admin** creates **Client Admin**
2. **Client Admin** completes profile setup
3. **Client Admin** creates **Users**
4. **Client Admin** creates **Questions**
5. **Client Admin** creates **Surveys** from questions
6. **Client Admin** assigns surveys to users
7. **Users** complete surveys (mobile app)
8. **Client Admin** views results and analytics

---

This documentation provides a complete understanding of the V-Survey platform workflows, enabling developers, testers, and stakeholders to understand the system's functionality and user interactions.