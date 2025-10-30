import { User, Complaint, ComplaintStatus, Category } from '../types';

const KEY_USERS = 'mcp_users';
const KEY_COMPLAINTS = 'mcp_complaints';
const KEY_CATEGORIES = 'mcp_categories';
const KEY_DEPARTMENTS = 'mcp_departments';
const KEY_LOGGED_IN_USER = 'mcp_loggedInUser';

// --- Default Data ---
const DEFAULT_DEPARTMENTS = ['Public Works', 'Sanitation', 'Utilities', 'Parks & Rec', 'Sewerage', 'Drainage'];

const DEFAULT_CATEGORIES: Category[] = [
    { name: 'Potholes', department: 'Public Works' },
    { name: 'Street Lights', department: 'Public Works' },
    { name: 'Garbage Collection', department: 'Sanitation' },
    { name: 'Water Leakage', department: 'Utilities' },
    { name: 'Broken Pipe', department: 'Sewerage' },
    { name: 'Blocked Drain', department: 'Drainage' },
    { name: 'Public Parks', department: 'Parks & Rec' },
];

const DEFAULT_USERS: User[] = [
    // Residents
    { email: 'resident1@mcp.portal', password: 'password123', displayName: 'John Resident', phoneNumber: '555-0101', role: 'resident' },
    { email: 'resident2@mcp.portal', password: 'password123', displayName: 'Jane Citizen', phoneNumber: '555-0102', role: 'resident' },
    // Admin & Department Officers
    { email: 'admin@mcp.portal', password: 'admin', displayName: 'Administrator', phoneNumber: 'N/A', role: 'admin' },
    { email: 'works@mcp.portal', password: 'password', displayName: 'Pat Works', phoneNumber: '555-0201', role: 'department', department: 'Public Works' },
    { email: 'sanitation@mcp.portal', password: 'password', displayName: 'Sam Sanitation', phoneNumber: '555-0202', role: 'department', department: 'Sanitation' },
    { email: 'sewerage@mcp.portal', password: 'password', displayName: 'Sue Sewer', phoneNumber: '555-0203', role: 'department', department: 'Sewerage' },
];

// --- Utility Functions ---
const get = <T,>(key: string, defaultValue: T): T => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error(`Error getting item ${key} from localStorage`, error);
    return defaultValue;
  }
};

const set = <T,>(key: string, value: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error)
    {
    console.error(`Error setting item ${key} in localStorage`, error);
  }
};

// --- User Management ---
export const getUsers = (): User[] => {
    const item = localStorage.getItem(KEY_USERS);
    if (item === null) {
        set(KEY_USERS, DEFAULT_USERS);
        return DEFAULT_USERS;
    }
    return get<User[]>(KEY_USERS, []);
};
export const addUser = (user: User): boolean => {
  const users = getUsers();
  if (users.some(u => u.email === user.email)) {
    return false; // User already exists
  }
  set(KEY_USERS, [...users, user]);
  return true;
};
export const updateUser = (updatedUser: User) => {
    const users = getUsers();
    const newUsers = users.map(u => u.email === updatedUser.email ? updatedUser : u);
    set(KEY_USERS, newUsers);
};
export const deleteUser = (email: string): { success: boolean; message: string } => {
  const complaints = getComplaints();
  if (complaints.some(c => c.userId === email)) {
    return { success: false, message: 'Cannot delete user as they have existing complaints.' };
  }
  const users = getUsers();
  const newUsers = users.filter(u => u.email !== email);
  if (users.length === newUsers.length) {
      return { success: false, message: 'User not found.' };
  }
  set(KEY_USERS, newUsers);
  return { success: true, message: 'User deleted successfully.' };
};
export const getLoggedInUser = (): User | null => get<User | null>(KEY_LOGGED_IN_USER, null);
export const setLoggedInUser = (user: User | null) => set<User | null>(KEY_LOGGED_IN_USER, user);

// Backwards compatibility for old isAdmin key
const isAdminLegacy = localStorage.getItem('mcp_isAdmin');
if (isAdminLegacy) {
    localStorage.removeItem('mcp_isAdmin');
}

// --- Complaint Management ---
export const getComplaints = (): Complaint[] => get<Complaint[]>(KEY_COMPLAINTS, []);
export const addComplaint = (complaint: Omit<Complaint, 'id' | 'timestamp' | 'comments'>) => {
  const complaints = getComplaints();
  const newComplaint: Complaint = {
    ...complaint,
    id: Date.now(),
    timestamp: Date.now(),
    comments: [],
  };
  set(KEY_COMPLAINTS, [...complaints, newComplaint]);
};
export const updateComplaint = (updatedComplaint: Complaint) => {
  const complaints = getComplaints();
  const newComplaints = complaints.map(c => c.id === updatedComplaint.id ? updatedComplaint : c);
  set(KEY_COMPLAINTS, newComplaints);
};
export const deleteComplaint = (id: number) => {
  const complaints = getComplaints();
  set(KEY_COMPLAINTS, complaints.filter(c => c.id !== id));
};


// --- Category Management ---
export const getCategories = (): Category[] => {
    const item = localStorage.getItem(KEY_CATEGORIES);
    if (item === null) {
        set(KEY_CATEGORIES, DEFAULT_CATEGORIES);
        return DEFAULT_CATEGORIES;
    }
    return get<Category[]>(KEY_CATEGORIES, []);
};
export const addCategory = (category: Category): boolean => {
  const categories = getCategories();
  if (categories.some(c => c.name.toLowerCase() === category.name.toLowerCase())) {
    return false;
  }
  set(KEY_CATEGORIES, [...categories, category]);
  return true;
};
export const updateCategory = (oldName: string, newCategory: Category): { success: boolean; message: string } => {
  const categories = getCategories();
  const trimmedNewName = newCategory.name.trim();

  if (!trimmedNewName || !newCategory.department.trim()) {
    return { success: false, message: 'Category name and department cannot be empty.' };
  }

  // Check if the new name already exists (and it's not the same category)
  if (oldName.toLowerCase() !== trimmedNewName.toLowerCase() && categories.some(c => c.name.toLowerCase() === trimmedNewName.toLowerCase())) {
    return { success: false, message: `Category "${trimmedNewName}" already exists.` };
  }

  // Update categories list
  const updatedCategories = categories.map(c => (c.name === oldName ? { name: trimmedNewName, department: newCategory.department.trim() } : c));
  set(KEY_CATEGORIES, updatedCategories);

  // Update complaints that use this category
  const complaints = getComplaints();
  const updatedComplaints = complaints.map(c => {
    if (c.category === oldName) {
      return { ...c, category: trimmedNewName, department: newCategory.department.trim() };
    }
    return c;
  });
  set(KEY_COMPLAINTS, updatedComplaints);

  return { success: true, message: 'Category updated successfully.' };
};
export const deleteCategory = (categoryToDelete: string): boolean => {
  const complaints = getComplaints();
  if (complaints.some(c => c.category === categoryToDelete)) {
      return false; // Category is in use
  }
  const categories = getCategories();
  set(KEY_CATEGORIES, categories.filter(c => c.name !== categoryToDelete));
  return true;
};

// --- Department Management ---
export const getDepartments = (): string[] => {
    const item = localStorage.getItem(KEY_DEPARTMENTS);
    if (item === null) {
        set(KEY_DEPARTMENTS, DEFAULT_DEPARTMENTS);
        return DEFAULT_DEPARTMENTS.sort();
    }
    const depts = get<string[]>(KEY_DEPARTMENTS, []);
    return depts.sort();
};
export const addDepartment = (deptName: string): { success: boolean; message: string } => {
  const depts = getDepartments();
  const trimmedName = deptName.trim();
  if (!trimmedName) {
    return { success: false, message: "Department name cannot be empty." };
  }
  if (depts.some(d => d.toLowerCase() === trimmedName.toLowerCase())) {
    return { success: false, message: `Department "${trimmedName}" already exists.` };
  }
  set(KEY_DEPARTMENTS, [...depts, trimmedName]);
  return { success: true, message: `Department "${trimmedName}" added successfully.` };
};
export const deleteDepartment = (deptName: string): { success: boolean; message: string } => {
  const categories = getCategories();
  if (categories.some(c => c.department === deptName)) {
    return { success: false, message: `Cannot delete department "${deptName}" as it is assigned to one or more categories.` };
  }
  const users = getUsers();
  if (users.some(u => u.department === deptName)) {
    return { success: false, message: `Cannot delete department "${deptName}" as it is assigned to one or more users.` };
  }
  const depts = getDepartments();
  set(KEY_DEPARTMENTS, depts.filter(d => d !== deptName));
  return { success: true, message: `Department "${deptName}" deleted successfully.` };
};
export const updateDepartment = (oldName: string, newName: string): { success: boolean; message: string } => {
  const depts = getDepartments();
  const trimmedNewName = newName.trim();

  if (!trimmedNewName) {
    return { success: false, message: 'Department name cannot be empty.' };
  }
  
  if (oldName.toLowerCase() !== trimmedNewName.toLowerCase() && depts.some(d => d.toLowerCase() === trimmedNewName.toLowerCase())) {
    return { success: false, message: `Department "${trimmedNewName}" already exists.` };
  }

  const updatedDepts = depts.map(d => d === oldName ? trimmedNewName : d);
  set(KEY_DEPARTMENTS, updatedDepts);

  const categories = getCategories();
  const updatedCategories = categories.map(c => c.department === oldName ? { ...c, department: trimmedNewName } : c);
  set(KEY_CATEGORIES, updatedCategories);
  
  const users = getUsers();
  const updatedUsers = users.map(u => u.department === oldName ? { ...u, department: trimmedNewName } : u);
  set(KEY_USERS, updatedUsers);
  
  const complaints = getComplaints();
  const updatedComplaints = complaints.map(c => c.department === oldName ? { ...c, department: trimmedNewName } : c);
  set(KEY_COMPLAINTS, updatedComplaints);

  return { success: true, message: 'Department updated successfully across the system.' };
};

// --- System ---
export const clearAllData = () => {
    localStorage.removeItem(KEY_USERS);
    localStorage.removeItem(KEY_COMPLAINTS);
    localStorage.removeItem(KEY_CATEGORIES);
    localStorage.removeItem(KEY_DEPARTMENTS);
    localStorage.removeItem(KEY_LOGGED_IN_USER);
};