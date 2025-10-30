
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../App';
import * as storage from '../services/storageService';
import { Complaint, ComplaintStatus, Category } from '../types';
import { useStorageListener } from '../hooks/useStorageListener';

// --- Reusable Card Component ---
const Card: React.FC<{ children: React.ReactNode, className?: string }> = ({ children, className = '' }) => (
    <div className={`bg-white dark:bg-slate-800 shadow-md rounded-lg p-6 ${className}`}>
        {children}
    </div>
);

// --- Complaint Form Component ---
const ComplaintForm: React.FC<{ onComplaintSubmitted: () => void }> = ({ onComplaintSubmitted }) => {
    const { user, updateUserContext } = useAuth();
    const [category, setCategory] = useState('');
    const [description, setDescription] = useState('');
    const [photo, setPhoto] = useState<string | null>(null);
    const [categories, setCategories] = useState<Category[]>([]);
    const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || '');
    const [address, setAddress] = useState('');
    const [refreshKey, setRefreshKey] = useState(0);

    const refreshCategories = useCallback(() => {
        setRefreshKey(prev => prev + 1);
    }, []);

    const handleStorageChange = useCallback((event: StorageEvent) => {
        if (event.key === 'mcp_categories') {
            refreshCategories();
        }
    }, [refreshCategories]);
    useStorageListener(handleStorageChange);

    useEffect(() => {
        const fetchedCategories = storage.getCategories();
        setCategories(fetchedCategories);

        const currentCategoryIsValid = fetchedCategories.some(c => c.name === category);

        if (fetchedCategories.length > 0) {
            if (!currentCategoryIsValid) {
                setCategory(fetchedCategories[0].name);
            }
        } else {
            setCategory('');
        }
    }, [refreshKey, category]);


    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const reader = new FileReader();
            reader.onloadend = () => setPhoto(reader.result as string);
            reader.readAsDataURL(e.target.files[0]);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const selectedCategory = categories.find(c => c.name === category);

        if (!user || !category || !description || !address || !selectedCategory) {
            alert('Please fill all required fields: Address, Category, and Description.');
            return;
        }

        // Update user's phone number if it has changed
        if (user && phoneNumber !== user.phoneNumber) {
            const updatedUser = { ...user, phoneNumber };
            storage.updateUser(updatedUser);
            storage.setLoggedInUser(updatedUser); // Update the persisted logged-in user
            updateUserContext(updatedUser); // Update context for immediate UI feedback
        }

        storage.addComplaint({
            userId: user.email,
            category,
            department: selectedCategory.department,
            area: 'Mozang',
            address,
            description,
            photo: photo || '',
            status: ComplaintStatus.PENDING,
        });
        onComplaintSubmitted();
        // Reset form for better UX
        setCategory(categories[0]?.name || '');
        setAddress('');
        setDescription('');
        setPhoto(null);
    };

    return (
        <Card>
            <h2 className="text-2xl font-bold text-primary dark:text-primary-light mb-4">File a New Complaint</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="displayName" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Your Name</label>
                        <input id="displayName" type="text" value={user?.displayName || ''} disabled className="mt-1 block w-full shadow-sm sm:text-sm border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-slate-700/50 rounded-md cursor-not-allowed" />
                    </div>
                    <div>
                        <label htmlFor="phoneNumber" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Phone Number</label>
                        <input id="phoneNumber" type="tel" value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} required className="mt-1 block w-full shadow-sm sm:text-sm border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-md focus:ring-primary focus:border-primary" />
                    </div>
                </div>
                
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div>
                        <label htmlFor="area" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Area</label>
                        <input id="area" type="text" value="Mozang" disabled className="mt-1 block w-full shadow-sm sm:text-sm border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-slate-700/50 rounded-md cursor-not-allowed" />
                    </div>
                    <div>
                        <label htmlFor="category" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Category</label>
                        <select id="category" value={category} onChange={(e) => setCategory(e.target.value)} required className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md">
                            {categories.map(cat => <option key={cat.name} value={cat.name}>{cat.name}</option>)}
                        </select>
                    </div>
                </div>
                 <div>
                    <label htmlFor="address" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Full Address</label>
                    <textarea id="address" value={address} onChange={(e) => setAddress(e.target.value)} rows={3} required className="mt-1 block w-full shadow-sm sm:text-sm border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-md focus:ring-primary focus:border-primary" placeholder="e.g. House #123, Street 4, near Main Market"></textarea>
                </div>
                 <div>
                    <label htmlFor="description" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Description</label>
                    <textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={4} required className="mt-1 block w-full shadow-sm sm:text-sm border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-md focus:ring-primary focus:border-primary"></textarea>
                </div>
                 <div>
                    <label htmlFor="photo" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Photo (Optional)</label>
                    <div className="mt-1 flex items-center space-x-4">
                        <input type="file" id="photo" accept="image/*" onChange={handleFileChange} className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 dark:file:bg-primary-light/20 dark:file:text-primary-light"/>
                    </div>
                     {photo && <img src={photo} alt="Preview" className="mt-4 rounded-lg max-h-40" />}
                </div>
                <button type="submit" className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors">
                    Submit Complaint
                </button>
            </form>
        </Card>
    );
};

// --- Complaint Item Component (for list view) ---
const ComplaintItem: React.FC<{ complaint: Complaint; onUpdate: () => void }> = ({ complaint, onUpdate }) => {
    const { user } = useAuth();
    const [newComment, setNewComment] = useState('');

    const handleCommentSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim() || !user) return;

        const updatedComplaint: Complaint = {
            ...complaint,
            comments: [
                ...complaint.comments,
                {
                    text: newComment.trim(),
                    author: user.displayName,
                    timestamp: Date.now(),
                }
            ]
        };
        storage.updateComplaint(updatedComplaint);
        setNewComment('');
        onUpdate();
    };

    const getStatusColor = (status: ComplaintStatus) => {
        return status === ComplaintStatus.RESOLVED
            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
            : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
    };

    return (
        <Card>
            <div className="flex justify-between items-start">
                <div>
                    <p className="font-semibold text-lg">{complaint.category}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{new Date(complaint.timestamp).toLocaleString()}</p>
                </div>
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(complaint.status)}`}>
                    {complaint.status}
                </span>
            </div>
            <p className="mt-2 text-slate-600 dark:text-slate-300 whitespace-pre-wrap">{complaint.description}</p>
            {complaint.photo && <img src={complaint.photo} alt="Complaint evidence" className="mt-2 rounded-lg max-h-48" />}

            <div className="mt-4 border-t border-slate-200 dark:border-slate-700 pt-4">
                <h4 className="text-md font-semibold mb-2 text-slate-700 dark:text-slate-300">Conversation</h4>
                <div className="space-y-3 max-h-60 overflow-y-auto pr-2 mb-4 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-md">
                    {complaint.comments.length === 0 ? (
                        <p className="text-sm text-slate-500 italic">No comments yet.</p>
                    ) : (
                        complaint.comments.map((comment, index) => (
                            <div key={index} className={`flex flex-col ${comment.author === user?.displayName ? 'items-end' : 'items-start'}`}>
                                <div className={`p-3 rounded-lg max-w-[80%] ${comment.author === user?.displayName ? 'bg-primary/10 dark:bg-primary-dark/30 rounded-br-none' : 'bg-slate-200 dark:bg-slate-700 rounded-bl-none'}`}>
                                    <p className="text-sm text-slate-800 dark:text-slate-200">{comment.text}</p>
                                </div>
                                <p className="text-xs text-slate-400 mt-1">{new Date(comment.timestamp).toLocaleTimeString()}</p>
                            </div>
                        ))
                    )}
                </div>
                <form onSubmit={handleCommentSubmit} className="flex gap-2">
                    <input
                        type="text"
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Type your reply..."
                        className="flex-grow block w-full shadow-sm sm:text-sm border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-md focus:ring-primary focus:border-primary"
                    />
                    <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary-dark rounded-md shadow-sm transition-colors">
                        Send
                    </button>
                </form>
            </div>
        </Card>
    );
}

// --- Complaint List Component ---
const ComplaintList: React.FC = () => {
    const { user } = useAuth();
    const [complaints, setComplaints] = useState<Complaint[]>([]);
    const [refreshKey, setRefreshKey] = useState(0);

    const refreshComplaints = useCallback(() => {
        setRefreshKey(prev => prev + 1);
    }, []);

    const handleStorageChange = useCallback((event: StorageEvent) => {
        if (event.key === 'mcp_complaints') {
            refreshComplaints();
        }
    }, [refreshComplaints]);
    useStorageListener(handleStorageChange);


    useEffect(() => {
        if(user) {
            setComplaints(storage.getComplaints().filter(c => c.userId === user.email).reverse());
        }
    }, [user, refreshKey]);

    if (complaints.length === 0) {
        return <Card><p>You have not filed any complaints yet.</p></Card>;
    }
    
    return (
        <div className="space-y-4">
            <h2 className="text-2xl font-bold text-primary dark:text-primary-light">My Complaints</h2>
            {complaints.map(complaint => (
                <ComplaintItem key={complaint.id} complaint={complaint} onUpdate={refreshComplaints} />
            ))}
        </div>
    );
};


// --- Main Resident Dashboard ---
const ResidentDashboard: React.FC = () => {
    const { user, logout } = useAuth();
    const [view, setView] = useState<'list' | 'form'>('list');

    const handleComplaintSubmitted = () => {
        setView('list');
    };
    
    return (
        <div className="min-h-screen bg-slate-100 dark:bg-slate-900 p-4 sm:p-6 lg:p-8">
            <header className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-primary dark:text-primary-light">Resident Portal</h1>
                    <p className="text-slate-500 dark:text-slate-400">Welcome, {user?.displayName}</p>
                </div>
                <button onClick={logout} className="px-4 py-2 text-sm font-medium text-white bg-secondary hover:bg-secondary-dark rounded-md shadow-sm transition-colors">
                    Logout
                </button>
            </header>
            
            <nav className="mb-6 flex space-x-2 border-b-2 border-slate-200 dark:border-slate-700">
                <button onClick={() => setView('list')} className={`px-4 py-2 text-sm font-medium transition-colors ${view === 'list' ? 'border-b-2 border-primary text-primary' : 'text-slate-500 hover:text-slate-700'}`}>My Complaints</button>
                <button onClick={() => setView('form')} className={`px-4 py-2 text-sm font-medium transition-colors ${view === 'form' ? 'border-b-2 border-primary text-primary' : 'text-slate-500 hover:text-slate-700'}`}>New Complaint</button>
            </nav>

            <main className="max-w-4xl mx-auto">
                {view === 'list' ? <ComplaintList /> : <ComplaintForm onComplaintSubmitted={handleComplaintSubmitted} />}
            </main>
        </div>
    );
};

export default ResidentDashboard;