export enum ComplaintStatus {
  PENDING = 'Pending',
  RESOLVED = 'Resolved',
}

export interface User {
  email: string;
  password?: string; // Not storing password in loggedInUser
  displayName: string;
  phoneNumber: string;
  role: 'resident' | 'admin' | 'department';
  department?: string;
}

export interface Comment {
  text: string;
  author: string; // user's display name
  timestamp: number;
}

export interface Complaint {
  id: number;
  userId: string; // user's email
  photo: string; // base64
  category: string;
  description: string;
  status: ComplaintStatus;
  comments: Comment[];
  timestamp: number;
  resolvedTimestamp?: number;
  area: string;
  department: string;
  address: string;
}

export interface Category {
  name: string;
  department: string;
}