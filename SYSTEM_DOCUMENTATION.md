# 🎓 College Student Management System - Complete Documentation

> **Version:** 1.0.0  
> **Last Updated:** January 2026  
> **For:** New Maintainers & Developers  
> **Tech Stack:** React (Frontend) + Node.js/Express/MongoDB (Backend)

---

## 📚 Table of Contents

1. [System Overview](#-system-overview)
2. [User Roles & Access](#-user-roles--access)
3. [Application Flow Diagram](#-application-flow-diagram)
4. [Module-wise Documentation](#-module-wise-documentation)
   - [Authentication Module](#1%EF%B8%8F⃣-authentication-module)
   - [Admin Dashboard Module](#2%EF%B8%8F⃣-admin-dashboard-module)
   - [Student Management Module](#3%EF%B8%8F⃣-student-management-module)
   - [Subject Management Module](#4%EF%B8%8F⃣-subject-management-module)
   - [Attendance Module](#5%EF%B8%8F⃣-attendance-module)
   - [Marks Entry Module](#6%EF%B8%8F⃣-marks-entry-module)
   - [Internal Marks Module](#7%EF%B8%8F⃣-internal-marks-module)
   - [Course Outcome Module](#8%EF%B8%8F⃣-course-outcome-module)
   - [Indirect Attainment Module](#9%EF%B8%8F⃣-indirect-attainment-entry-module)
   - [Reports Module](#🔟-reports-module)
5. [Page-by-Page API Reference](#-page-by-page-api-reference)
6. [Data Flow Diagrams](#-data-flow-diagrams)
7. [Business Rules & Calculations](#-business-rules--calculations)
8. [Frontend-Backend Mapping](#-frontend-backend-mapping)
9. [Environment Setup](#-environment-setup)

---

## 🌐 System Overview

This system is designed for **Lords Institute of Engineering & Technology** to manage:

| Feature | Purpose | Stakeholders |
|---------|---------|--------------|
| **Student Records** | Maintain student data across branches/sections | Admin, Faculty |
| **Attendance Tracking** | Bi-monthly (15th/30th) attendance recording | Faculty |
| **Marks Management** | CIE, Surprise Tests, Assignments, SEE marks | Faculty |
| **OBE Compliance** | CO-PO mapping for NBA/NAAC accreditation | Faculty, Admin |
| **Attainment Calculation** | Direct & Indirect CO/PO attainment | Faculty |
| **Report Generation** | Progress reports, verification reports | Faculty, Admin |

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          FRONTEND (React)                               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │   Login     │  │    Home     │  │   Reports   │  │   Admin     │     │
│  │   Pages     │  │  Dashboard  │  │   Module    │  │  Dashboard  │     │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘     │
└───────────────────────────────┬─────────────────────────────────────────┘
                                │ Axios HTTP Requests
                                ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        BACKEND API (Express.js)                         │
│  Base URL: ${REACT_APP_BACKEND_URI}/api                                 │
│                                                                         │
│  /users      /students      /subjects      /marks      /internalmarks   │
│  /co         /attainment    /feedbackattainment                         │
└───────────────────────────────┬─────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        MongoDB Atlas Database                           │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 👥 User Roles & Access

### Role Hierarchy

| Role | Access Level | Capabilities |
|------|--------------|--------------|
| **Admin** | Full Access | All faculty capabilities + User management, Student/Subject bulk upload |
| **Faculty** | Standard Access | Marks entry, Attendance, CO management, Report viewing |
| **Student** | No Access | Future scope (not implemented) |

### Route Protection

```
┌──────────────────────────────────────────────────────────────────────┐
│                         ROUTE ACCESS MATRIX                          │
├──────────────────────────────────────┬───────────┬───────────────────┤
│ Route                                │  Faculty  │       Admin       │
├──────────────────────────────────────┼───────────┼───────────────────┤
│ /login, /admin-login                 │    ✅     │        ✅         │
│ /home                                │    ✅     │        ✅         │
│ /attendance                          │    ✅     │        ✅         │
│ /marks                               │    ✅     │        ✅         │
│ /internalmarks                       │    ✅     │        ✅         │
│ /course-outcome                      │    ✅     │        ✅         │
│ /reports/*                           │    ✅     │        ✅         │
│ /attainment/*                        │    ✅     │        ✅         │
├──────────────────────────────────────┼───────────┼───────────────────┤
│ /admin-dashboard                     │    ❌     │        ✅         │
│ /add-faculty                         │    ❌     │        ✅         │
│ /manage-faculty                      │    ❌     │        ✅         │
│ /post-student                        │    ❌     │        ✅         │
│ /create-student                      │    ❌     │        ✅         │
│ /post-subject                        │    ❌     │        ✅         │
│ /create-subject                      │    ❌     │        ✅         │
└──────────────────────────────────────┴───────────┴───────────────────┘
```

---

## 🔄 Application Flow Diagram

```
                                    ┌─────────────┐
                                    │   START     │
                                    └──────┬──────┘
                                           │
                                           ▼
                              ┌────────────────────────┐
                              │   Branch Selection     │
                              │   (/ or /branch-       │
                              │    selection)          │
                              └───────────┬────────────┘
                                          │
                     ┌────────────────────┴────────────────────┐
                     │                                         │
                     ▼                                         ▼
            ┌────────────────┐                      ┌────────────────┐
            │  Faculty Login │                      │  Admin Login   │
            │   (/login)     │                      │ (/admin-login) │
            └───────┬────────┘                      └───────┬────────┘
                    │                                       │
                    ▼                                       ▼
            ┌────────────────┐                      ┌──────────────────┐
            │  Faculty Home  │                      │ Admin Dashboard. │
            │   (/home)      │                      │(/admin-dashboard)│
            └───────┬────────┘                      └───────┬──────────┘
                    │                                       │
        ┌───────────┼───────────┐               ┌───────────┼───────────┐
        │           │           │               │           │           │
        ▼           ▼           ▼               ▼           ▼           ▼
   ┌─────────┐ ┌──────────┐ ┌─────────┐   ┌─────────┐ ┌───────────┐ ┌───────────┐
   │  Marks  │ │Attendance│ │ Reports │   │Add User │ │Add Student│ │Add Subject│
   │  Entry  │ │  Entry   │ │  View   │   │         │ │  (Bulk)   │ │  (Bulk)   │
   └─────────┘ └──────────┘ └─────────┘   └─────────┘ └───────────┘ └───────────┘
```

---

## 📦 Module-wise Documentation

---

### 1️⃣ Authentication Module

#### Pages Involved
| Page | Route | File |
|------|-------|------|
| Branch Selection | `/` or `/branch-selection` | `BranchSelection.jsx` |
| Faculty Login | `/login` | `Login.jsx` |
| Admin Login | `/admin-login` | `AdminLogin.jsx` |

#### Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                       AUTHENTICATION FLOW                               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   1. USER LANDS ON APP                                                  │
│      │                                                                  │
│      ▼                                                                  │
│   ┌────────────────────┐                                                │
│   │ Check localStorage │                                                │
│   │ - selectedBranch   │                                                │
│   │ - isLoggedIn       │                                                │
│   └─────────┬──────────┘                                                │
│             │                                                           │
│    ┌────────┴────────┐                                                  │
│    │                 │                                                  │
│    ▼                 ▼                                                  │
│  No Branch        Has Branch                                            │
│    │                 │                                                  │
│    ▼                 ▼                                                  │
│  Show Branch    Check Login                                             │
│  Selection         │                                                    │
│    │       ┌───────┴───────┐                                            │
│    │       │               │                                            │
│    ▼       ▼               ▼                                            │ 
│  User    Not Logged     Logged In                                       │
│  Selects    │               │                                           │
│  Branch     ▼               ▼                                           │
│    │     Show Login     Redirect to                                     │
│    │     Page           /home                                           │
│    │                                                                    │
│    └──────────────────────────────────────────────────────────────────► │
│                                                                         │
│   2. LOGIN PROCESS                                                      │
│      │                                                                  │
│      ▼                                                                  │
│   POST /api/users/signin                                                │
│   Body: { email, password }                                             │
│      │                                                                  │
│      ▼                                                                  │
│   Response: { token: "JWT_TOKEN" }                                      │
│      │                                                                  │
│      ▼                                                                  │
│   Decode JWT → Extract role (faculty/admin)                             │
│      │                                                                  │
│      ▼                                                                  │
│   Store in localStorage + UserContext                                   │
│      │                                                                  │
│      ▼                                                                  │
│   Redirect to /home or /admin-dashboard                                 │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

#### APIs Used

| Action | Method | Endpoint | Request Body | Response |
|--------|--------|----------|--------------|----------|
| Faculty/Admin Login | `POST` | `/api/users/signin` | `{ email, password }` | `{ token: "JWT..." }` |

#### localStorage Keys Used
- `selectedBranch` - Stores selected department (CSE, ECE, etc.)
- `isLoggedIn` - Boolean flag for login state
- `userRole` - Stores user role (faculty/admin)
- `token` - JWT token for API authentication

---

### 2️⃣ Admin Dashboard Module

#### Pages Involved
| Page | Route | File |
|------|-------|------|
| Admin Dashboard | `/admin-dashboard` | `AdminDashboard.jsx` |
| Add Faculty | `/add-faculty` | `AddFaculty.jsx` |
| Manage Faculty | `/manage-faculty` | `ManageFaculty.jsx` |

#### Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      ADMIN DASHBOARD FLOW                               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   ┌─────────────────┐                                                   │
│   │ Admin Dashboard │                                                   │
│   │  (/admin-       │                                                   │
│   │   dashboard)    │                                                   │
│   └────────┬────────┘                                                   │
│            │                                                            │
│   ┌────────┼────────┬───────────────────┐                               │
│   │        │        │                   │                               │
│   ▼        ▼        ▼                   ▼                               │
│ ┌───────┐ ┌───────┐ ┌────────┐       ┌────────┐                         │
│ │ Add   │ │Manage │ │ Add    │       │ Add    │                         │
│ │Faculty│ │Faculty│ │Students│       │Subjects│                         │
│ └───────┘ └───────┘ └────────┘       └────────┘                         │
│    │         │        │                 │                               │
│    ▼         ▼        ▼                 ▼                               │
│ /add-   /manage-  /post-              /post-                            │
│ faculty  faculty  student             subject                           │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

#### Add Faculty Page APIs

| Action | Method | Endpoint | Auth Required | Request Body |
|--------|--------|----------|---------------|--------------|
| Create Faculty | `POST` | `/api/users/signup` | ✅ Admin Token | `{ firstName, lastName, email, password, role }` |

#### Manage Faculty Page APIs

| Action | Method | Endpoint | Auth Required | Response |
|--------|--------|----------|---------------|----------|
| Get All Users | `GET` | `/api/users/all` | ✅ Admin Token | Array of users |
| Delete User | `DELETE` | `/api/users/:userId` | ✅ Admin Token | Success message |

---

### 3️⃣ Student Management Module

#### Pages Involved
| Page | Route | File | Purpose |
|------|-------|------|---------|
| Bulk Add Students | `/post-student` | `PostStudent.jsx` | Excel upload for bulk student creation |
| Create Single Student | `/create-student` | `CreateStudent.jsx` | Form for single student entry |

#### Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     STUDENT MANAGEMENT FLOW                             │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   BULK UPLOAD (/post-student)                                           │
│   ─────────────────────────────                                         │
│                                                                         │
│   ┌─────────────────┐                                                   │
│   │ Upload Excel    │  Excel Format:                                    │
│   │ File            │  Roll No | Name | Father Name | Branch | Year |   │
│   └────────┬────────┘           Semester | Section                      │
│            │                                                            │
│            ▼                                                            │
│   ┌─────────────────┐                                                   │
│   │ Parse with XLSX │ Detect header row automatically                   │
│   │ Library         │ Map columns to fields                             │
│   └────────┬────────┘                                                   │
│            │                                                            │
│            ▼                                                            │
│   ┌─────────────────┐                                                   │
│   │ Validate Data   │ Check required fields                             │
│   │ Show Preview    │ Display validation errors/warnings                │
│   └────────┬────────┘                                                   │
│            │                                                            │
│            ▼                                                            │
│   ┌─────────────────┐                                                   │
│   │ POST /api/      │  Bulk insert with insertMany                      │
│   │ students        │                                                   │
│   └─────────────────┘                                                   │
│                                                                         │
│   SINGLE STUDENT (/create-student)                                      │
│   ────────────────────────────────                                      │
│                                                                         │
│   ┌─────────────────┐                                                   │
│   │ Fill Form       │  Fields: rollNo, name, fatherName,                │
│   │                 │  branch, currentYear, currentSemester, section    │
│   └────────┬────────┘                                                   │
│            │                                                            │
│            ▼                                                            │
│   POST /api/students                                                    │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

#### APIs Used

| Action | Method | Endpoint | Request Body |
|--------|--------|----------|--------------|
| Create Student(s) | `POST` | `/api/students` | `{ rollNo, name, branch, currentYear, currentSemester, section, fatherName }` or Array |
| Get All Students | `GET` | `/api/students` | - |
| Get Filtered Students | `GET` | `/api/students/filtered?branch=&year=&semester=&section=` | Query params |
| Get Student by Roll | `GET` | `/api/students/:rollNo` | - |
| Update Student | `PUT` | `/api/students/:rollNo` | Updated fields |
| Delete Student | `DELETE` | `/api/students/:rollNo` | - |

---

### 4️⃣ Subject Management Module

#### Pages Involved
| Page | Route | File | Purpose |
|------|-------|------|---------|
| Bulk Add Subjects | `/post-subject` | `PostSubjects.jsx` | Excel upload for bulk subject creation |
| Create Single Subject | `/create-subject` | `CreateSubject.jsx` | Form for single subject entry |

#### Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     SUBJECT MANAGEMENT FLOW                             │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   Subject Structure:                                                    │
│   ┌─────────────────────────────────────────────────────────────┐       │
│   │  name         - Subject name (e.g., "Database Systems")     │       │
│   │  branch       - Department (e.g., "CSE")                    │       │
│   │  year         - Academic year (1-4)                         │       │
│   │  semester     - Semester (1-2)                              │       │
│   │  regulation   - e.g., "LR21", "LR22", "LR23"                │       │
│   │  courseCode   - e.g., "CS501"                               │       │
│   └─────────────────────────────────────────────────────────────┘       │
│                                                                         │
│   ┌────────────────────────────────────────────────────────────────┐    │
│   │  Filtering Logic (Used across ALL pages):                      │    │
│   │                                                                │    │
│   │  1. Select Year → 2. Select Semester → 3. Select Regulation    │    │
│   │                          ↓                                     │    │
│   │  GET /api/subjects/branch/{branch}/year/{year}/                │    │
│   │      semester/{semester}/regulation/{regulation}               │    │
│   │                          ↓                                     │    │
│   │  Returns: Array of subjects for dropdown selection             │    │
│   └────────────────────────────────────────────────────────────────┘    │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

#### APIs Used

| Action | Method | Endpoint | Description |
|--------|--------|----------|-------------|
| Create Subject(s) | `POST` | `/api/subjects` | Accepts single object or array |
| Get All Subjects | `GET` | `/api/subjects` | All subjects |
| Get Filtered | `GET` | `/api/subjects/branch/:branch/year/:year/semester/:semester/regulation/:regulation` | With all filters |
| Get by ID | `GET` | `/api/subjects/:id` | Single subject |
| Update | `PUT` | `/api/subjects/:id` | Update subject |
| Delete | `DELETE` | `/api/subjects/:id` | Delete subject |

---

### 5️⃣ Attendance Module

#### Page: `/attendance`
#### File: `Attendance.jsx`

#### Complete Page Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        ATTENDANCE PAGE FLOW                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   STEP 1: Filter Selection                                              │
│   ─────────────────────────                                             │
│   ┌─────────────────────────────────────────────────────────────────┐   │
│   │  Year ──► Semester ──► Regulation ──► Subject ──► Section       │   │
│   │                                   ▼                             │   │
│   │                          GET subjects API                       │   │
│   │                                                                 │   │
│   │  Month ──► Period (15th/30th) ──► Total Classes                 │   │
│   └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│   STEP 2: Fetch Students                                                │
│   ──────────────────────                                                │
│   ┌─────────────────────────────────────────────────────────────────┐   │
│   │  GET /api/students/filtered                                     │   │
│   │  ?branch={selectedBranch}&year={year}&semester={semester}       │   │
│   │  &section={section}&subjectId={subject}&period={period}         │   │
│   └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│   STEP 3: Fetch Existing Attendance                                     │
│   ─────────────────────────────────                                     │
│   ┌─────────────────────────────────────────────────────────────────┐   │
│   │  GET /api/students/attendance/month/{month}/year/{year}/        │   │
│   │      period/{period}                                            │   │
│   └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│   STEP 4: Display Student Table                                         │
│   ─────────────────────────────                                         │
│   ┌─────────────────────────────────────────────────────────────────┐   │
│   │  | S.No | Roll No | Name | Classes Attended |                   │   │
│   │  |------|---------|------|------------------|                   │   │
│   │  |  1   | 21001   | John |  [Input Field]   |                   │   │
│   │  |  2   | 21002   | Jane |  [Input Field]   |                   │   │
│   └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│   STEP 5: Save Attendance                                               │
│   ───────────────────────                                               │
│   ┌─────────────────────────────────────────────────────────────────┐   │
│   │  For each student:                                              │   │
│   │    IF attendance._id exists:                                    │   │
│   │      PUT /api/students/attendance/{_id}  (Admin only)           │   │
│   │    ELSE:                                                        │   │
│   │      POST /api/students/attendance                              │   │
│   └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│   EXCEL IMPORT Feature:                                                 │
│   ─────────────────────                                                 │
│   Upload Excel with columns: Roll No, Classes Attended                  │
│   Auto-maps to student records                                          │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

#### APIs Used

| Action | Method | Endpoint | Auth | Description |
|--------|--------|----------|------|-------------|
| Get Subjects | `GET` | `/api/subjects/branch/:branch/year/:year/semester/:semester/regulation/:regulation` | ❌ | Populate subject dropdown |
| Get Students | `GET` | `/api/students/filtered` | ❌ | Get students for attendance |
| Get Attendance | `GET` | `/api/students/attendance/month/:month/year/:year/period/:period` | ❌ | Fetch existing attendance |
| Create Attendance | `POST` | `/api/students/attendance` | ❌ | New attendance record |
| Update Attendance | `PUT` | `/api/students/attendance/:id` | ✅ Admin | Modify existing record |

#### Key Business Rules
- **Period**: Either "15th" or "30th" of the month
- **Bi-monthly tracking**: Attendance is recorded twice per month
- **Admin-only updates**: Only admins can modify existing attendance records

---

### 6️⃣ Marks Entry Module

#### Page: `/marks`
#### File: `Marks.jsx`

#### Complete Page Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         MARKS ENTRY PAGE FLOW                           │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   EXAM TYPES SUPPORTED:                                                 │
│   ┌─────────────────────────────────────────────────────────────────┐   │
│   │  CIE-1, CIE-2         - 20 marks max (Continuous Internal Eval) │   │
│   │  SURPRISE TEST-1/2/3  - 10 marks max                            │   │
│   │  ASSIGNMENT-1/2/3     - 10 marks max                            │   │
│   └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│   STEP 1: Filter Selection                                              │
│   ─────────────────────────                                             │
│   Year ──► Semester ──► Regulation ──► Subject ──► Section ──► ExamType │
│                                                                         │
│   STEP 2: Fetch Students with Existing Marks                            │
│   ──────────────────────────────────────────                            │
│   ┌─────────────────────────────────────────────────────────────────┐   │
│   │  GET /api/students/filtered?branch={}&year={}&semester={}&      │   │
│   │      section={}&subjectId={}                                    │   │
│   │                                                                 │   │
│   │  GET /api/marks/{subject_id}/{examType}                         │   │
│   │                                                                 │   │
│   │  Merge: Students + Their existing marks                         │   │
│   └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│   STEP 3: Display & Edit Marks                                          │
│   ────────────────────────────                                          │
│   ┌─────────────────────────────────────────────────────────────────┐   │
│   │  | S.No | Roll No | Name    | Marks (Max: 20/10) |              │   │
│   │  |------|---------|---------|---------------------|             │   │
│   │  |  1   | 21001   | John    |  [Input: 18]        |             │   │
│   │  |  2   | 21002   | Jane    |  [Input: 15]        |             │   │
│   │  Validation: 0 ≤ marks ≤ maxMarks                               │   │
│   └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│   STEP 4: Save Marks                                                    │
│   ──────────────────                                                    │
│   ┌─────────────────────────────────────────────────────────────────┐   │
│   │  POST /api/marks                                                │   │
│   │  {                                                              │   │
│   │    student, subject, examType, marks, maxMarks,                 │   │
│   │    regulation, year, semester, section                          │   │
│   │  }                                                              │   │
│   │  * Creates new if not exists, updates if exists                 │   │
│   └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│   EXCEL IMPORT Feature:                                                 │
│   Upload Excel with: Roll No, Marks                                     │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

#### APIs Used

| Action | Method | Endpoint | Description |
|--------|--------|----------|-------------|
| Get Subjects | `GET` | `/api/subjects/branch/:branch/year/:year/semester/:semester/regulation/:regulation` | Subject dropdown |
| Get Students | `GET` | `/api/students/filtered` | Student list |
| Get Existing Marks | `GET` | `/api/marks/:subject_id/:examType` | Pre-fill marks |
| Save Marks | `POST` | `/api/marks` | Create/Update marks |
| Update Marks (Admin) | `PUT` | `/api/marks/:subject_id/:examType/:id` | Admin modification |

---

### 7️⃣ Internal Marks Module

#### Page: `/internalmarks`
#### File: `InternalMarks.jsx`

#### Purpose
Record **detailed CIE marks** with question-wise breakdown (Q1-Q4 with sub-parts).

#### Question Paper Structure

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    CIE PAPER STRUCTURE (20 Marks)                       │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   Q1: Short Answer Questions (SAQs)                                     │
│   ├── Part a: ___ marks                                                 │
│   ├── Part b: ___ marks                                                 │
│   └── Part c: ___ marks                                                 │
│                                                                         │
│   Q2: Long Answer Question 1                                            │
│   ├── Part a: ___ marks                                                 │
│   └── Part b: ___ marks                                                 │
│                                                                         │
│   Q3: Long Answer Question 2                                            │
│   ├── Part a: ___ marks                                                 │
│   └── Part b: ___ marks                                                 │
│                                                                         │
│   Q4: Long Answer Question 3                                            │
│   ├── Part a: ___ marks                                                 │
│   └── Part b: ___ marks                                                 │
│                                                                         │
│   Each question maps to a specific Course Outcome (CO)                  │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

#### Page Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     INTERNAL MARKS PAGE FLOW                            │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   STEP 1: Select Filters                                                │
│   Year ──► Semester ──► Regulation ──► Subject ──► Section ──►          │
│   Exam Type (CIE-1 / CIE-2)                                             │
│                                                                         │
│   STEP 2: Fetch Data                                                    │
│   ┌─────────────────────────────────────────────────────────────────┐   │
│   │  GET /api/students/filtered (Students)                          │   │
│   │  GET /api/internalmarks/{subject_id}/{examType} (Existing)      │   │
│   └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│   STEP 3: Display Question-wise Marks Table                             │
│   ┌─────────────────────────────────────────────────────────────────┐   │
│   │  | Roll | Name | Q1(a) | Q1(b) | Q1(c) | Q2(a) | Q2(b) | ... |  │   │
│   │  |------|------|-------|-------|-------|-------|-------|-----|  │   │
│   │  | 21001| John |   2   |   2   |   2   |   5   |   4   | ... |  │   │
│   └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│   STEP 4: Save Internal Marks                                           │
│   ┌─────────────────────────────────────────────────────────────────┐   │
│   │  POST /api/internalmarks                                        │   │
│   │  {                                                              │   │
│   │    student, subject, examType,                                  │   │
│   │    marks: {                                                     │   │
│   │      Q1: { a, b, c },                                           │   │
│   │      Q2: { a, b },                                              │   │
│   │      Q3: { a, b },                                              │   │
│   │      Q4: { a, b }                                               │   │
│   │    },                                                           │   │
│   │    year, semester, section                                      │   │
│   │  }                                                              │   │
│   └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

#### APIs Used

| Action | Method | Endpoint | Description |
|--------|--------|----------|-------------|
| Get Subjects | `GET` | `/api/subjects/branch/.../regulation/...` | Subject list |
| Get Students | `GET` | `/api/students/filtered` | Student list |
| Get Internal Marks | `GET` | `/api/internalmarks/:subject_id/:examType` | Existing marks |
| Save Internal Marks | `POST` | `/api/internalmarks` | Create new |
| Update (Admin) | `PUT` | `/api/internalmarks/:subject_id/:examType/:id` | Modify |
| Get Question Totals | `GET` | `/api/internalmarks/totals/:subject_id/:examType` | For reports |

---

### 8️⃣ Course Outcome Module

#### Page: `/course-outcome`
#### File: `CourseOutcomeForm.jsx`

#### Purpose
Define Course Outcomes (COs) and CO-PO Matrix for NBA/NAAC compliance.

#### Complete Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    COURSE OUTCOME PAGE FLOW                             │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   SECTION 1: Course Outcome Definition                                  │
│   ────────────────────────────────────                                  │
│   ┌─────────────────────────────────────────────────────────────────┐   │
│   │  CO No  │  Course Outcome Description          │ Knowledge Level│   │
│   ├─────────┼──────────────────────────────────────┼────────────────┤   │
│   │  CO1    │  Understand database concepts        │     K2         │   │
│   │  CO2    │  Apply normalization techniques      │     K3         │   │
│   │  CO3    │  Design ER diagrams                  │     K3         │   │
│   │  CO4    │  Implement SQL queries               │     K4         │   │
│   │  CO5    │  Analyze query performance           │     K4         │   │
│   ├─────────┴──────────────────────────────────────┴────────────────┤   │
│   │  [+ Add CO]  [- Remove Last CO]  [Save All]                     │   │
│   └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│   Knowledge Levels (Bloom's Taxonomy):                                  │
│   K1-Remember, K2-Understand, K3-Apply, K4-Analyze, K5-Evaluate, K6-Create
│                                                                         │
│   SECTION 2: CO-PO Matrix                                               │
│   ───────────────────────                                               │
│   ┌────────────────────────────────────────────────────────────────┐    │
│   │     │ PO1 │ PO2 │ PO3 │...│ PO12 │ PSO1 │ PSO2 │               │    │
│   ├─────┼─────┼─────┼─────┼───┼──────┼──────┼──────┤               │    │
│   │ CO1 │  3  │  2  │  1  │...│   0  │   2  │   1  │               │    │
│   │ CO2 │  2  │  3  │  2  │...│   1  │   3  │   2  │               │    │
│   │ CO3 │  1  │  2  │  3  │...│   2  │   2  │   3  │               │    │
│   ├─────┴─────┴─────┴─────┴───┴──────┴──────┴──────┘               │    │
│   │  Values: 0 = No correlation, 1 = Low, 2 = Medium, 3 = High     │    │
│   └────────────────────────────────────────────────────────────────┘    │
│                                                                         │
│   ACTIONS:                                                              │
│   - Save CO-PO Matrix                                                   │
│   - Calculate CO-PO Averages                                            │
│   - Download PDF                                                        │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

#### APIs Used

| Action | Method | Endpoint | Description |
|--------|--------|----------|-------------|
| Get Subjects | `GET` | `/api/subjects/branch/.../regulation/...` | Subject dropdown |
| Get COs | `GET` | `/api/co/course-outcomes/:subjectId` | Fetch existing COs |
| Create CO | `POST` | `/api/co/course-outcomes` | Add new CO |
| Update CO | `PATCH` | `/api/co/course-outcomes/:coId` | Modify CO |
| Delete CO | `DELETE` | `/api/co/course-outcome/:coId` | Remove CO |
| Delete All COs | `DELETE` | `/api/co/course-outcomes/:subjectId` | Remove all for subject |
| Get CO-PO Matrix | `GET` | `/api/co/copo-matrix/:subjectId` | Fetch matrix |
| Create/Update Matrix | `POST` | `/api/co/copo-matrix` | Save matrix entry |
| Update Matrix | `PATCH` | `/api/co/copo-matrix/:copoId` | Modify mapping |
| Delete Matrix | `DELETE` | `/api/co/copo-matrix/:copoId` | Remove mapping |
| Calculate Averages | `POST` | `/api/co/copo-average/:subjectId` | Compute PO averages |
| Get Averages | `GET` | `/api/co/copo-average/:subjectId` | Fetch computed averages |

---

### 9️⃣ Indirect Attainment Entry Module

#### Page: `/attainment/entry`
#### File: `IndirectAttainment.jsx`

#### Purpose
Collect student feedback on Course Outcome achievement for **indirect attainment** calculation.

#### Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                   INDIRECT ATTAINMENT ENTRY FLOW                        │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   PURPOSE: Students rate their learning against each CO (1-3 scale)     │
│                                                                         │
│   Rating Scale:                                                         │
│   ┌─────────────────────────────────────────────────────────────────┐   │
│   │  1 = Poor (Did not achieve the outcome)                         │   │
│   │  2 = Moderate (Partially achieved)                              │   │
│   │  3 = Good (Fully achieved)                                      │   │
│   └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│   STEP 1: Select Filters                                                │
│   Year ──► Semester ──► Regulation ──► Subject ──► Section              │
│                                                                         │
│   STEP 2: Fetch Students & Existing Feedback                            │
│   ┌─────────────────────────────────────────────────────────────────┐   │
│   │  GET /api/students/filtered                                     │   │
│   │  GET /api/feedbackattainment/ (Filter by subject)               │   │
│   └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│   STEP 3: Display Feedback Form                                         │
│   ┌─────────────────────────────────────────────────────────────────┐   │
│   │  | Roll | Name | CO1 | CO2 | CO3 | CO4 | CO5 |                  │   │
│   │  |------|------|-----|-----|-----|-----|-----|                  │   │
│   │  | 21001| John | [1] | [2] | [3] | [2] | [3] |  ← Dropdowns     │   │
│   │  | 21002| Jane | [2] | [3] | [2] | [3] | [2] |                  │   │
│   └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│   STEP 4: Save Feedback                                                 │
│   ┌─────────────────────────────────────────────────────────────────┐   │
│   │  For each student:                                              │   │
│   │    IF feedbackId exists:                                        │   │
│   │      PUT /api/feedbackattainment/{id}                           │   │
│   │    ELSE:                                                        │   │
│   │      POST /api/feedbackattainment                               │   │
│   │    { student, subject, CO1, CO2, CO3, CO4, CO5 }                │   │
│   └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

#### APIs Used

| Action | Method | Endpoint | Description |
|--------|--------|----------|-------------|
| Get All Feedback | `GET` | `/api/feedbackattainment/` | All feedback records |
| Get by Subject | `GET` | `/api/feedbackattainment/subject/:id` | Subject-specific |
| Create Feedback | `POST` | `/api/feedbackattainment` | New entry |
| Update Feedback | `PUT` | `/api/feedbackattainment/:id` | Modify |

---

### 🔟 Reports Module

#### Reports Dashboard: `/reports`
#### File: `ReportsPage.jsx`

#### Report Categories

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         REPORTS DASHBOARD                               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   ACADEMIC REPORTS                                                      │
│   ────────────────                                                      │
│   ┌─────────────────────────────────────────────────────────────────┐   │
│   │  📊 Attendance Report  (/reports/attendance)                    │   │
│   │     → View detailed attendance data for a period                │   │
│   │                                                                 │   │
│   │  📋 Marks Report  (/reports/marks)                              │   │
│   │     → Access comprehensive marks data for test types            │   │
│   │                                                                 │   │
│   │  📈 Progress Report  (/progressreport)                          │   │
│   │     → Generate detailed progress reports for CIE                │   │
│   │                                                                 │   │
│   │  ✅ Verification Report  (/verify)                              │   │
│   │     → Verify student marks throughout a semester                │   │
│   └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│   ATTAINMENT REPORTS                                                    │
│   ──────────────────                                                    │
│   ┌─────────────────────────────────────────────────────────────────┐   │
│   │  🎓 CO Attainment Report  (/attainment)                         │   │
│   │     → Verify CO attainments for descriptive tests (CIE-1, CIE-2)│   │
│   │                                                                 │   │
│   │  📄 SEE Attainment Report  (/attainment/see)                    │   │
│   │     → Verify CO attainments for Semester End Exam               │   │
│   │                                                                 │   │
│   │  📊 Direct Attainments  (/attainment/direct)                    │   │
│   │     → Direct CO attainments with Graph                          │   │
│   │                                                                 │   │
│   │  📉 Indirect Attainments  (/attainment/indirect)                │   │
│   │     → Indirect CO attainments with Graph                        │   │
│   └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│   OVERALL REPORTS                                                       │
│   ───────────────                                                       │
│   ┌─────────────────────────────────────────────────────────────────┐   │
│   │  📊 Overall Attainments  (/attainment/overall)                  │   │
│   │     → Overall CO attainments (80% Direct + 20% Indirect)        │   │
│   │                                                                 │   │
│   │  🎓 PO Attainments  (/attainment/po)                            │   │
│   │     → Overall PO attainments with Graph                         │   │
│   └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

#### Report: Progress Report (`/progressreport`)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        PROGRESS REPORT FLOW                             │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   INPUT:                                                                │
│   - Start Roll No (e.g., 21001)                                         │
│   - End Roll No (e.g., 21060)                                           │
│   - Start Date (date range start)                                       │
│   - End Date (date range end)                                           │
│                                                                         │
│   API CALL (for each roll number in range):                             │
│   GET /api/students/{rollNo}/data?startDate={}&endDate={}               │
│                                                                         │
│   RESPONSE:                                                             │
│   {                                                                     │
│     studentId, studentName, rollNo, year, semester, section,            │
│     marks: [{ subjectId, subjectName, examType, marks, maxMarks }],     │
│     attendance: [{ subjectId, subjectName, period, totalClasses,        │
│                    classesAttended, month, year }]                      │
│   }                                                                     │
│                                                                         │
│   OUTPUT: PDF report with student's marks + attendance summary          │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

#### Report: CO Attainment Report (`/attainment`)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     CO ATTAINMENT REPORT FLOW                           │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   STEP 1: Select Subject & Exam Type (CIE-1 or CIE-2)                   │
│                                                                         │
│   STEP 2: Fetch Marks Data                                              │
│   GET /api/marks/attainment/{subject_id}/{examType}                     │
│   Returns: Internal marks + ST/AT averages combined                     │
│                                                                         │
│   STEP 3: Fetch Existing Attainment                                     │
│   GET /api/attainment/subject/{subjectId}/examType/{examType}           │
│                                                                         │
│   STEP 4: Display Table with CO-wise Marks                              │
│   ┌─────────────────────────────────────────────────────────────────┐   │
│   │  | Roll | Name | SAQs | CO1 | CO2 | CO3 | ST Avg | AT Avg |     │   │
│   │  |------|------|------|-----|-----|-----|--------|--------|     │   │
│   │  | 21001| John |  6   | 10  |  9  |  9  |   9    |   8    |     │   │
│   └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│   STEP 5: Calculate & Save Attainment Levels                            │
│   POST /api/attainment                                                  │
│   {                                                                     │
│     subject, examType,                                                  │
│     attainmentType: 'direct',                                           │
│     attainmentData: [{ coNo: 'CO1', attainmentLevel: 2 }, ...]          │
│   }                                                                     │
│                                                                         │
│   ATTAINMENT LEVEL CALCULATION:                                         │
│   Level 3: ≥60% students achieved target                                │
│   Level 2: ≥50% students achieved target                                │
│   Level 1: ≥40% students achieved target                                │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

#### Report: Direct/Indirect/Overall Attainment

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    ATTAINMENT REPORTS FLOW                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   DIRECT ATTAINMENT (/attainment/direct)                                │
│   ──────────────────────────────────────                                │
│   GET /api/attainment/subject/{subjectId}/attainmentType/computedDirect │
│   Source: CIE-1 + CIE-2 + SEE marks                                     │
│   Display: Bar chart of CO-wise attainment levels                       │
│                                                                         │
│   INDIRECT ATTAINMENT (/attainment/indirect)                            │
│   ────────────────────────────────────────                              │
│   GET /api/attainment/subject/{subjectId}/attainmentType/computedIndirect
│   Source: Student feedback                                              │
│   Display: Bar chart of CO-wise attainment levels                       │
│                                                                         │
│   OVERALL ATTAINMENT (/attainment/overall)                              │
│   ────────────────────────────────────────                              │
│   GET /api/attainment/subject/{subjectId}/attainmentType/computedOverall│
│   Formula: (Direct × 0.8) + (Indirect × 0.2)                            │
│   Display: Combined bar chart                                           │
│                                                                         │
│   PO ATTAINMENT (/attainment/po)                                        │
│   ──────────────────────────────                                        │
│   GET /api/co/copo-average/{subjectId}                                  │
│   Display: PO1-PO12 and PSO1-PSO2 attainment levels                     │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 📋 Page-by-Page API Reference

### Quick Reference Table

| Page | Route | Primary APIs | Auth Required |
|------|-------|--------------|---------------|
| **Branch Selection** | `/` | None | ❌ |
| **Faculty Login** | `/login` | `POST /api/users/signin` | ❌ |
| **Admin Login** | `/admin-login` | `POST /api/users/signin` | ❌ |
| **Home Dashboard** | `/home` | None | ✅ Faculty |
| **Admin Dashboard** | `/admin-dashboard` | None | ✅ Admin |
| **Add Faculty** | `/add-faculty` | `POST /api/users/signup` | ✅ Admin |
| **Manage Faculty** | `/manage-faculty` | `GET /api/users/all`, `DELETE /api/users/:id` | ✅ Admin |
| **Post Students** | `/post-student` | `POST /api/students` | ✅ Admin |
| **Create Student** | `/create-student` | `POST /api/students` | ✅ Admin |
| **Post Subjects** | `/post-subject` | `POST /api/subjects` | ✅ Admin |
| **Create Subject** | `/create-subject` | `POST /api/subjects` | ✅ Admin |
| **Attendance** | `/attendance` | `GET /api/students/filtered`, `GET/POST/PUT /api/students/attendance/*` | ✅ Faculty |
| **Marks** | `/marks` | `GET /api/students/filtered`, `GET/POST /api/marks/*` | ✅ Faculty |
| **Internal Marks** | `/internalmarks` | `GET /api/students/filtered`, `GET/POST /api/internalmarks/*` | ✅ Faculty |
| **Course Outcome** | `/course-outcome` | `GET/POST/PATCH/DELETE /api/co/*` | ✅ Faculty |
| **Indirect Attainment** | `/attainment/entry` | `GET/POST/PUT /api/feedbackattainment/*` | ✅ Faculty |
| **CO Attainment** | `/attainment` | `GET /api/marks/attainment/*`, `GET/POST /api/attainment/*` | ✅ Faculty |
| **SEE Attainment** | `/attainment/see` | `GET /api/attainment/*` | ✅ Faculty |
| **Direct Attainment** | `/attainment/direct` | `GET /api/attainment/subject/:id/attainmentType/computedDirect` | ✅ Faculty |
| **Indirect Report** | `/attainment/indirect` | `GET /api/attainment/subject/:id/attainmentType/computedIndirect` | ✅ Faculty |
| **Overall Attainment** | `/attainment/overall` | `GET /api/attainment/subject/:id/attainmentType/computedOverall` | ✅ Faculty |
| **PO Attainment** | `/attainment/po` | `GET /api/co/copo-average/:subjectId` | ✅ Faculty |
| **Progress Report** | `/progressreport` | `GET /api/students/:rollNo/data` | ✅ Faculty |
| **Marks Report** | `/reports/marks` | `GET /api/marks/:subject_id/:examType` | ✅ Faculty |
| **Attendance Report** | `/reports/attendance` | `GET /api/students/attendance/*` | ✅ Faculty |
| **Verify Student** | `/verify` | `GET /api/students/getall/:rollNo` | ✅ Faculty |

---

## 📊 Data Flow Diagrams

### Complete Semester Workflow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    COMPLETE SEMESTER WORKFLOW                           │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ══════════════════════════════════════════════════════════════════════ │
│  PHASE 1: SETUP (Start of Semester)                                     │
│  ══════════════════════════════════════════════════════════════════════ │
│                                                                         │
│  [Admin]                                                                │
│     │                                                                   │
│     ├──► 1. Create Subjects (POST /api/subjects)                        │
│     │        - Name, Branch, Year, Semester, Regulation, Course Code    │
│     │                                                                   │
│     ├──► 2. Add Students (POST /api/students)                           │
│     │        - Roll No, Name, Father Name, Branch, Year, Sem, Section   │
│     │                                                                   │
│     └──► 3. Create Faculty Accounts (POST /api/users/signup)            │
│              - Email, Password, Role                                    │
│                                                                         │
│  [Faculty]                                                              │
│     │                                                                   │
│     ├──► 4. Define Course Outcomes (POST /api/co/course-outcomes)       │
│     │        - Subject, CO No, Description, Knowledge Level             │
│     │                                                                   │
│     └──► 5. Create CO-PO Matrix (POST /api/co/copo-matrix)              │
│              - Map each CO to PO1-PO12, PSO1-PSO2                       │
│                                                                         │
│  ══════════════════════════════════════════════════════════════════════ │
│  PHASE 2: MID-SEMESTER (Continuous Assessment)                          │
│  ══════════════════════════════════════════════════════════════════════ │
│                                                                         │
│  [Faculty - Bi-monthly]                                                 │
│     │                                                                   │
│     └──► 6. Record Attendance (POST /api/students/attendance)           │
│              - 15th of month: First attendance                          │
│              - 30th of month: Second attendance                         │
│                                                                         │
│  [Faculty - Per Test]                                                   │
│     │                                                                   │
│     ├──► 7. Record Surprise Tests (POST /api/marks)                     │
│     │        - ST-1, ST-2, ST-3 (10 marks each)                         │
│     │                                                                   │
│     ├──► 8. Record Assignments (POST /api/marks)                        │
│     │        - AT-1, AT-2, AT-3 (10 marks each)                         │
│     │                                                                   │
│     └──► 9. Record CIE-1 Internal Marks                                 │
│              - POST /api/internalmarks (Q1-Q4, 20 marks)                │
│              - View attainment: GET /api/marks/attainment/:id/CIE-1     │
│              - Save attainment: POST /api/attainment                    │
│                                                                         │
│  [Mid-Semester]                                                         │
│     │                                                                   │
│     └──► 10. Record CIE-2 Internal Marks                                │
│               - Same as CIE-1                                           │
│                                                                         │
│  ══════════════════════════════════════════════════════════════════════ │
│  PHASE 3: END OF SEMESTER                                               │
│  ══════════════════════════════════════════════════════════════════════ │
│                                                                         │
│  [Faculty]                                                              │
│     │                                                                   │
│     ├──► 11. Collect Student Feedback                                   │
│     │         POST /api/feedbackattainment                              │
│     │         - Students rate CO1-CO5 (1-3 scale)                       │
│     │                                                                   │
│     ├──► 12. Record SEE Marks (if applicable)                           │
│     │         POST /api/marks (examType: 'SEE')                         │
│     │                                                                   │
│     ├──► 13. Calculate Direct Attainment                                │
│     │         POST /api/attainment                                      │
│     │         - attainmentType: 'computedDirect'                        │
│     │         - Source: CIE-1 + CIE-2 + SEE                             │
│     │                                                                   │
│     ├──► 14. Calculate Indirect Attainment                              │
│     │         POST /api/attainment                                      │
│     │         - attainmentType: 'computedIndirect'                      │
│     │         - Source: Student Feedback                                │
│     │                                                                   │
│     ├──► 15. Calculate Overall Attainment                               │
│     │         POST /api/attainment                                      │
│     │         - attainmentType: 'computedOverall'                       │
│     │         - Formula: 80% Direct + 20% Indirect                      │
│     │                                                                   │
│     └──► 16. Calculate CO-PO Average                                    │
│               POST /api/co/copo-average/:subjectId                      │
│               - Final PO attainment levels                              │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 📐 Business Rules & Calculations

### Marks Calculation Logic

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      MARKS CALCULATION RULES                            │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  INTERNAL MARKS BREAKDOWN (CIE):                                        │
│  ───────────────────────────────                                        │
│                                                                         │
│  CIE Paper (20 marks total):                                            │
│  ├── Q1 (SAQs):    a + b + c = ~6 marks                                 │
│  ├── Q2 (Long):    a + b = ~10 marks                                    │
│  ├── Q3 (Long):    a + b = ~10 marks                                    │
│  └── Q4 (Long):    a + b = ~10 marks                                    │
│                                                                         │
│  Note: Q2, Q3, Q4 are choice-based (answer any 3 from 4)                │
│                                                                         │
│  ═══════════════════════════════════════════════════════════════════════│
│                                                                         │
│  BEST-OF-TWO CALCULATION (Surprise Tests & Assignments):                │
│  ───────────────────────────────────────────────────────                │
│                                                                         │
│  API: GET /api/marks/getAvgOfBestTwo/subject/:subject_id                │
│                                                                         │
│  Algorithm:                                                             │
│  1. Collect all 3 Surprise Tests marks                                  │
│  2. Sort in descending order                                            │
│  3. Take top 2 marks                                                    │
│  4. Calculate average: (ST_best1 + ST_best2) / 2                        │
│  5. Apply rounding:                                                     │
│     - If average ≥ 9.5 → Round UP to 10                                 │
│     - Otherwise → Floor (round down)                                    │
│                                                                         │
│  Same logic for Assignments                                             │
│                                                                         │
│  ═══════════════════════════════════════════════════════════════════════│
│                                                                         │
│  ATTAINMENT LEVEL CALCULATION:                                          │
│  ─────────────────────────────                                          │
│                                                                         │
│  For each CO, calculate % of students meeting target:                   │
│                                                                         │
│  Level 3: ≥60% students achieved ≥60% marks in that CO                  │
│  Level 2: ≥50% students achieved ≥60% marks in that CO                  │
│  Level 1: ≥40% students achieved ≥60% marks in that CO                  │
│  Level 0: <40% students achieved target                                 │
│                                                                         │
│  ═══════════════════════════════════════════════════════════════════════│
│                                                                         │
│  OVERALL ATTAINMENT FORMULA:                                            │
│  ───────────────────────────                                            │
│                                                                         │
│  Overall CO Attainment = (Direct × 0.8) + (Indirect × 0.2)              │
│                                                                         │
│  Where:                                                                 │
│  - Direct = Average of (CIE-1 + CIE-2 + SEE) attainments                │
│  - Indirect = Average of student feedback ratings                       │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 🔗 Frontend-Backend Mapping

### API Base Configuration

```javascript
// Environment Variable
REACT_APP_BACKEND_URI=http://localhost:3000  // or production URL

// Usage in components
const response = await axios.get(
  `${process.env.REACT_APP_BACKEND_URI}/api/students/filtered?...`
);
```

### Request Headers

```javascript
// For protected routes (Admin operations)
headers: {
  "Content-Type": "application/json",
  "Authorization": `Bearer ${user?.token}`
}
```

### State Management

```javascript
// UserContext.jsx provides:
const { user, login, logout, isAdmin } = useUser();

// user object contains:
{
  token: "JWT_TOKEN",
  userId: "...",
  email: "...",
  role: "admin" | "faculty",
  firstName: "...",
  lastName: "..."
}
```

---

## ⚙️ Environment Setup

### Frontend (.env)

```env
REACT_APP_BACKEND_URI=http://localhost:3000
```

### Backend (.env)

```env
ATLAS_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/<database>
PORT=3000
JWT_SECRET=your-secret-key  # Set in config/index.js
```

### Running the Application

```bash
# Frontend
cd Student-management-frontend
npm install
npm start  # Runs on http://localhost:3000 (or 3001 if backend is on 3000)

# Backend
cd Student-management-backend
npm install
npx nodemon server.js  # Runs on http://localhost:3000
```

---

## 📝 Maintenance Notes

### Adding New Pages

1. Create component in `/src/pages/`
2. Add route in `/src/components/App.jsx`
3. Use appropriate protection (`ProtectedRoute` or `AdminRoute`)
4. Follow existing patterns for API calls and state management

### Common Patterns

```javascript
// Filter dropdowns pattern
useEffect(() => {
  const fetchSubjects = async () => {
    if (!selectedYear || !selectedSemester || !selectedRegulation) return;
    const response = await axios.get(
      `${process.env.REACT_APP_BACKEND_URI}/api/subjects/branch/${selectedBranch}/year/${selectedYear}/semester/${selectedSemester}/regulation/${selectedRegulation}`
    );
    setSubjects(response.data);
  };
  fetchSubjects();
}, [selectedYear, selectedSemester, selectedRegulation]);
```

### Key localStorage Items

| Key | Purpose | Set By |
|-----|---------|--------|
| `selectedBranch` | Department filter | Branch Selection page |
| `isLoggedIn` | Login state flag | Login page |
| `userRole` | Role-based access | Login page |
| `token` | JWT for API auth | Login page |

---

## 📞 Support

For issues or questions:
1. Check the existing code patterns in similar pages
2. Review the backend.md for API documentation
3. Check browser console for API errors
4. Verify localStorage values for auth issues

---

*Documentation generated for Student Management System v1.0.0 - January 2026*
