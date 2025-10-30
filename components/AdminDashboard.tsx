import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../App';
import * as storage from '../services/storageService';
import { Complaint, ComplaintStatus, User, Category } from '../types';
import { Modal } from './common/Modal';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, TooltipProps } from 'recharts';
import { useStorageListener } from '../hooks/useStorageListener';

type AdminView = 'overview' | 'complaints' | 'analytics' | 'categories' | 'departments' | 'users' | 'system';

const ALL_TABS: { id: AdminView, label: string, icon: React.ReactNode, roles: User['role'][] }[] = [
    { id: 'overview', label: 'Overview', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z" /><path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.022 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" /></svg>, roles: ['admin', 'department'] },
    { id: 'complaints', label: 'Complaints', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" /><path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" /></svg>, roles: ['admin', 'department'] },
    { id: 'analytics', label: 'Analytics', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" /></svg>, roles: ['admin', 'department'] },
    { id: 'categories', label: 'Categories', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M17.707 9.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-7-7A.997.997 0 012 10V5a3 3 0 013-3h5l2 2h3a2 2 0 012 2v2a1 1 0 01-.293.707zM5 6a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" /></svg>, roles: ['admin'] },
    { id: 'departments', label: 'Departments', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 11-2 0V4H6a1 1 0 11-2 0V4zm4 2a1 1 0 011 1v2a1 1 0 11-2 0V7a1 1 0 011-1zm0 4a1 1 0 011 1v2a1 1 0 11-2 0v-2a1 1 0 011-1zm-3 2a1 1 0 00-1 1v2a1 1 0 102 0v-2a1 1 0 00-1-1zm6-4a1 1 0 011 1v2a1 1 0 11-2 0V9a1 1 0 011-1zm-3-2a1 1 0 00-1 1v2a1 1 0 102 0V7a1 1 0 00-1-1zm6 6a1 1 0 011 1v2a1 1 0 11-2 0v-2a1 1 0 011-1z" clipRule="evenodd" /></svg>, roles: ['admin'] },
    { id: 'users', label: 'Users', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" /></svg>, roles: ['admin'] },
    { id: 'system', label: 'System', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01-.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" /></svg>, roles: ['admin'] },
];

const Card: React.FC<{ children: React.ReactNode, className?: string, title?: string }> = ({ children, className = '', title }) => (
    <div className={`bg-white dark:bg-slate-800 shadow-lg rounded-xl p-4 sm:p-6 ${className}`}>
        {title && <h3 className="text-lg font-semibold text-primary dark:text-primary-light mb-4">{title}</h3>}
        {children}
    </div>
);

// --- Sub-components for each tab ---

const DashboardOverview: React.FC<{ complaints: Complaint[], users: User[] }> = ({ complaints, users }) => {
    const stats = useMemo(() => {
        return {
            total: complaints.length,
            pending: complaints.filter(c => c.status === ComplaintStatus.PENDING).length,
            resolved: complaints.filter(c => c.status === ComplaintStatus.RESOLVED).length,
            users: users.length,
        };
    }, [complaints, users]);

    const StatCard: React.FC<{ title: string, value: number, icon: React.ReactNode }> = ({ title, value, icon }) => (
        <Card>
            <div className="flex items-center">
                <div className="p-3 rounded-full bg-primary/10 dark:bg-primary-light/20 text-primary dark:text-primary-light mr-4">{icon}</div>
                <div>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
                    <p className="text-3xl font-bold text-slate-900 dark:text-slate-100">{value}</p>
                </div>
            </div>
        </Card>
    );

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard title="Total Complaints" value={stats.total} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>} />
            <StatCard title="Pending" value={stats.pending} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} />
            <StatCard title="Resolved" value={stats.resolved} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} />
            <StatCard title="Total Residents" value={stats.users} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>} />
        </div>
    );
};


const ComplaintsTable: React.FC<{ complaints: Complaint[], onRefresh: () => void, currentUser: User }> = ({ complaints, onRefresh, currentUser }) => {
    const [filter, setFilter] = useState<'All' | 'Pending' | 'Resolved'>('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
    const [newAdminComment, setNewAdminComment] = useState('');
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'ascending' | 'descending' }>({ key: 'id', direction: 'descending' });

    const usersMap = useMemo(() => {
        const users = storage.getUsers();
        return new Map(users.map(u => [u.email, u]));
    }, [complaints]);

    const filteredAndSortedComplaints = useMemo(() => {
        let filteredComplaints = [...complaints];

        // Status filter
        if (filter !== 'All') {
            filteredComplaints = filteredComplaints.filter(c => c.status === filter);
        }
        
        // Search filter
        const lowercasedQuery = searchQuery.toLowerCase().trim();
        if (lowercasedQuery) {
            filteredComplaints = filteredComplaints.filter(c => {
                const complainant = usersMap.get(c.userId);
                return (
                    c.userId.toLowerCase().includes(lowercasedQuery) ||
                    c.category.toLowerCase().includes(lowercasedQuery) ||
                    c.description.toLowerCase().includes(lowercasedQuery) ||
                    c.area.toLowerCase().includes(lowercasedQuery) ||
                    c.address.toLowerCase().includes(lowercasedQuery) ||
                    (currentUser.role === 'admin' && c.department.toLowerCase().includes(lowercasedQuery)) ||
                    complainant?.displayName.toLowerCase().includes(lowercasedQuery) ||
                    complainant?.phoneNumber.toLowerCase().includes(lowercasedQuery)
                );
            });
        }

        // Sorting
        const sortableItems = [...filteredComplaints];
        if (sortConfig.key) {
            sortableItems.sort((a, b) => {
                let aValue: any;
                let bValue: any;

                if (sortConfig.key === 'displayName') {
                    aValue = usersMap.get(a.userId)?.displayName || '';
                    bValue = usersMap.get(b.userId)?.displayName || '';
                } else {
                    aValue = a[sortConfig.key as keyof Complaint];
                    bValue = b[sortConfig.key as keyof Complaint];
                }

                const direction = sortConfig.direction === 'ascending' ? 1 : -1;

                if (aValue === bValue) return 0;
                if (aValue == null) return -1 * direction;
                if (bValue == null) return 1 * direction;

                if (typeof aValue === 'number' && typeof bValue === 'number') {
                    return (aValue - bValue) * direction;
                }
                
                return String(aValue).localeCompare(String(bValue)) * direction;
            });
        }
        return sortableItems;
    }, [complaints, filter, searchQuery, sortConfig, usersMap, currentUser.role]);


    const requestSort = (key: string) => {
        let direction: 'ascending' | 'descending' = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const handleView = (complaint: Complaint) => {
        setSelectedComplaint(complaint);
        setNewAdminComment('');
    };

    const handleUpdateComplaint = (newStatus: ComplaintStatus) => {
        if (!selectedComplaint) return;
        
        const currentComments = selectedComplaint.comments || [];
        const updatedComments = [...currentComments];
    
        if (newAdminComment.trim()) {
            updatedComments.push({
                text: newAdminComment.trim(),
                author: currentUser.displayName,
                timestamp: Date.now(),
            });
        }

        const updatedComplaint: Complaint = { 
            ...selectedComplaint, 
            comments: updatedComments,
            status: newStatus,
        };

        if (newStatus === ComplaintStatus.RESOLVED && !selectedComplaint.resolvedTimestamp) {
            updatedComplaint.resolvedTimestamp = Date.now();
        } else if (newStatus === ComplaintStatus.PENDING) {
            delete updatedComplaint.resolvedTimestamp;
        }

        storage.updateComplaint(updatedComplaint);
        setSelectedComplaint(null);
        setNewAdminComment('');
        onRefresh();
    };

    const handleDeleteComplaint = () => {
        if (!selectedComplaint) return;
        if (window.confirm(`Are you sure you want to permanently delete complaint #${selectedComplaint.id}? This cannot be undone.`)) {
            storage.deleteComplaint(selectedComplaint.id);
            setSelectedComplaint(null);
            onRefresh();
        }
    };

    return (
        <Card title="Complaints Management">
            <div className="flex flex-col sm:flex-row gap-4 mb-4">
                <select value={filter} onChange={e => setFilter(e.target.value as any)} className="rounded-md border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50">
                    <option>All</option>
                    <option>Pending</option>
                    <option>Resolved</option>
                </select>
                <input
                    type="text"
                    placeholder="Search complaints..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="flex-grow rounded-md border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50"
                />
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                    <thead className="bg-slate-50 dark:bg-slate-700">
                        <tr>
                            {(
                                [
                                    { key: 'id', title: 'ID' },
                                    { key: 'displayName', title: 'User' },
                                    { key: 'category', title: 'Category' },
                                    ...(currentUser.role === 'admin' ? [{ key: 'department', title: 'Department' }] : []),
                                    { key: 'area', title: 'Area' },
                                    { key: 'address', title: 'Address' },
                                    { key: 'timestamp', title: 'Date' },
                                    { key: 'status', title: 'Status' },
                                ] as { key: string; title: string }[]
                            ).map(({ key, title }) => (
                                <th
                                    key={key}
                                    scope="col"
                                    className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider cursor-pointer select-none"
                                    onClick={() => requestSort(key)}
                                >
                                    <div className="flex items-center">
                                        {title}
                                        {sortConfig.key === key && (
                                            <span className="ml-2">{sortConfig.direction === 'ascending' ? '▲' : '▼'}</span>
                                        )}
                                    </div>
                                </th>
                            ))}
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                        {filteredAndSortedComplaints.map(c => {
                            const complainant = usersMap.get(c.userId);
                            return (
                                <tr key={c.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{c.id}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-slate-100">
                                        <div>{complainant?.displayName || c.userId}</div>
                                        <div className="text-xs text-slate-500">{complainant?.phoneNumber}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{c.category}</td>
                                    {currentUser.role === 'admin' && <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{c.department}</td>}
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{c.area}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 max-w-xs truncate" title={c.address}>{c.address}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{new Date(c.timestamp).toLocaleString()}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${c.status === 'Resolved' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'}`}>{c.status}</span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button onClick={() => handleView(c)} className="text-primary hover:text-primary-dark">View</button>
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>

            <Modal isOpen={!!selectedComplaint} onClose={() => setSelectedComplaint(null)} title="Complaint Details">
                {selectedComplaint && (
                    <div className="space-y-4">
                        {(() => {
                            const complainant = usersMap.get(selectedComplaint.userId);
                            return (
                                <>
                                    {selectedComplaint.photo && <img src={selectedComplaint.photo} alt="Complaint" className="rounded-lg max-h-64 w-full object-contain bg-slate-100 dark:bg-slate-700" />}
                                    <p><strong>User:</strong> {complainant?.displayName || selectedComplaint.userId}</p>
                                    <p><strong>Email:</strong> {selectedComplaint.userId}</p>
                                    <p><strong>Phone:</strong> {complainant?.phoneNumber || 'N/A'}</p>
                                    <hr className="border-slate-200 dark:border-slate-700"/>
                                    <p><strong>Category:</strong> {selectedComplaint.category}</p>
                                    <p><strong>Department:</strong> {selectedComplaint.department}</p>
                                    <p><strong>Area:</strong> {selectedComplaint.area}</p>
                                    <p><strong>Address:</strong> {selectedComplaint.address}</p>
                                    <p><strong>Date:</strong> {new Date(selectedComplaint.timestamp).toLocaleString()}</p>
                                    <p><strong>Description:</strong> {selectedComplaint.description}</p>
                                </>
                            );
                        })()}
                        
                        <div>
                            <h4 className="text-md font-semibold mb-2 text-slate-700 dark:text-slate-300">Conversation</h4>
                            <div className="space-y-3 max-h-60 overflow-y-auto pr-2 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-md">
                                {(selectedComplaint.comments || []).length === 0 ? (
                                    <p className="text-sm text-slate-500 italic">No comments yet.</p>
                                ) : (
                                    (selectedComplaint.comments || []).map((comment, index) => (
                                        <div key={index} className={`flex flex-col ${comment.author === currentUser.displayName ? 'items-end' : 'items-start'}`}>
                                            <div className={`p-3 rounded-lg max-w-[80%] ${comment.author === currentUser.displayName ? 'bg-primary/10 dark:bg-primary-dark/30 rounded-br-none' : 'bg-slate-200 dark:bg-slate-700 rounded-bl-none'}`}>
                                                <p className="text-sm text-slate-800 dark:text-slate-200">{comment.text}</p>
                                            </div>
                                            <p className="text-xs text-slate-400 mt-1">{new Date(comment.timestamp).toLocaleTimeString()} - {comment.author}</p>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        <div>
                            <label htmlFor="adminComment" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Add Comment</label>
                            <textarea id="adminComment" value={newAdminComment} onChange={e => setNewAdminComment(e.target.value)} rows={3} className="mt-1 block w-full shadow-sm sm:text-sm border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-md"></textarea>
                        </div>
                        <div className="flex justify-between items-center pt-4">
                             <button onClick={handleDeleteComplaint} className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-100 dark:hover:text-red-900 bg-red-50 dark:bg-red-900/50 border border-red-200 dark:border-red-800/50 rounded-md">Delete</button>
                            <div className="flex space-x-2">
                                <button onClick={() => handleUpdateComplaint(selectedComplaint.status)} className="px-4 py-2 text-sm font-medium rounded-md border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700">Save Comment</button>
                                {selectedComplaint.status === ComplaintStatus.PENDING ? (
                                    <button onClick={() => handleUpdateComplaint(ComplaintStatus.RESOLVED)} className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md">Save & Resolve</button>
                                ) : (
                                    <button onClick={() => handleUpdateComplaint(ComplaintStatus.PENDING)} className="px-4 py-2 text-sm font-medium text-white bg-yellow-500 hover:bg-yellow-600 rounded-md">Reopen Complaint</button>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </Modal>
        </Card>
    );
};

const AnalyticsView: React.FC<{ complaints: Complaint[] }> = ({ complaints }) => {
    const {
        pieData,
        trendData,
        totalComplaints,
        departmentData,
        dayOfWeekData,
        overallAvgResolutionTime, // in hours
        resolutionTimeByDeptData // in hours
    } = useMemo(() => {
        const categoryCounts = complaints.reduce((acc: Record<string, number>, c) => {
            acc[c.category] = (acc[c.category] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const pieData = Object.entries(categoryCounts).map(([name, value]) => ({ name, value }));
        const totalComplaints = complaints.length;

        const trendData = [...complaints]
            .sort((a, b) => a.timestamp - b.timestamp)
            .reduce((acc, c) => {
                const date = new Date(c.timestamp).toLocaleDateString();
                const entry = acc.find(item => item.date === date);
                if (entry) {
                    entry.count++;
                } else {
                    acc.push({ date, count: 1 });
                }
                return acc;
            }, [] as { date: string; count: number }[]);

        const departmentCounts = complaints.reduce((acc: Record<string, number>, c) => {
            acc[c.department] = (acc[c.department] || 0) + 1;
            return acc;
        }, {});
        const departmentData = Object.entries(departmentCounts)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);

        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const dayOfWeekCounts = complaints.reduce((acc: Record<string, number>, c) => {
            const dayName = days[new Date(c.timestamp).getDay()];
            acc[dayName] = (acc[dayName] || 0) + 1;
            return acc;
        }, {});
        const dayOfWeekData = days.map(day => ({ name: day, value: dayOfWeekCounts[day] || 0, }));
        
        const resolvedComplaints = complaints.filter(c => c.status === ComplaintStatus.RESOLVED && c.resolvedTimestamp);
        let overallAvgResolutionTime = 0;
        let resolutionTimeByDeptData: { name: string, value: number }[] = [];

        if (resolvedComplaints.length > 0) {
            const totalResolutionTimeMs = resolvedComplaints.reduce((sum, c) => {
                // FIX: Add non-null assertion operator `!` to `c.resolvedTimestamp`. The preceding filter
                // ensures `resolvedTimestamp` is a number, but TypeScript can't infer that here.
                return sum + (c.resolvedTimestamp! - c.timestamp);
            }, 0);
            
            const totalResolutionTimeHours = totalResolutionTimeMs / (1000 * 60 * 60);
            overallAvgResolutionTime = totalResolutionTimeHours / resolvedComplaints.length;
            
            const timeByDept: Record<string, { totalHours: number, count: number }> = {};
            resolvedComplaints.forEach(c => {
                if (!timeByDept[c.department]) {
                    timeByDept[c.department] = { totalHours: 0, count: 0 };
                }
                // FIX: Add non-null assertion operator `!` to `c.resolvedTimestamp`. The preceding filter
                // ensures `resolvedTimestamp` is a number, but TypeScript can't infer that here.
                const durationHours = (c.resolvedTimestamp! - c.timestamp) / (1000 * 60 * 60);
                timeByDept[c.department].totalHours += durationHours;
                timeByDept[c.department].count += 1;
            });
            
            resolutionTimeByDeptData = Object.entries(timeByDept)
                .map(([name, data]) => ({
                    name,
                    value: data.totalHours / data.count,
                }))
                .sort((a, b) => b.value - a.value);
        }

        return { pieData, trendData, totalComplaints, departmentData, dayOfWeekData, overallAvgResolutionTime, resolutionTimeByDeptData };
    }, [complaints]);

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF', '#FF6363'];

    const CustomPieTooltip = ({ active, payload }: TooltipProps<number, string>) => {
        if (active && payload && payload.length) {
            const data = payload[0];
            const percentage = totalComplaints > 0 && data.value ? ((data.value / totalComplaints) * 100).toFixed(1) : 0;
            return (
                <div className="p-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md shadow-lg text-sm">
                    <p className="font-bold text-slate-700 dark:text-slate-200">{`${data.name}`}</p>
                    <p className="text-slate-600 dark:text-slate-300">{`Count: ${data.value}`}</p>
                    <p className="text-slate-600 dark:text-slate-300">{`Percentage: ${percentage}%`}</p>
                </div>
            );
        }
        return null;
    };

    const CustomLineTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
        if (active && payload && payload.length) {
            return (
                <div className="p-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md shadow-lg text-sm">
                    <p className="font-bold text-slate-700 dark:text-slate-200">{`Date: ${label}`}</p>
                    <p className="text-slate-600 dark:text-slate-300">{`Complaints: ${payload[0].value}`}</p>
                </div>
            );
        }
        return null;
    };
    
    const StatCard: React.FC<{ title: string, value: string, icon: React.ReactNode }> = ({ title, value, icon }) => (
        <Card>
            <div className="flex items-center">
                <div className="p-3 rounded-full bg-primary/10 dark:bg-primary-light/20 text-primary dark:text-primary-light mr-4">{icon}</div>
                <div>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
                    <p className="text-3xl font-bold text-slate-900 dark:text-slate-100">{value}</p>
                </div>
            </div>
        </Card>
    );

    return (
        <div className="space-y-6">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <StatCard 
                    title="Total Complaints" 
                    value={totalComplaints.toString()} 
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>} 
                />
                <StatCard 
                    title="Avg. Resolution Time" 
                    value={`${overallAvgResolutionTime > 0 ? overallAvgResolutionTime.toFixed(1) : 'N/A'} hrs`} 
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                />
             </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card title="Category-wise Complaint Breakdown">
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} fill="#8884d8" label>
                                {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                            </Pie>
                            <Tooltip content={<CustomPieTooltip />} />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </Card>
                <Card title="Complaints by Department">
                     <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={departmentData} layout="vertical" margin={{ top: 5, right: 20, left: 30, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis type="number" allowDecimals={false} />
                            <YAxis type="category" dataKey="name" width={100} />
                            <Tooltip formatter={(value: number) => [value, 'Complaints']} />
                            <Bar dataKey="value" fill="#8884d8" name="Complaints">
                                {departmentData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </Card>
                <Card title="Complaint Trends" className="lg:col-span-2">
                     <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={trendData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" />
                            <YAxis allowDecimals={false} />
                            <Tooltip content={<CustomLineTooltip />} />
                            <Legend />
                            <Line type="monotone" dataKey="count" stroke="#ff7300" name="Complaints" />
                        </LineChart>
                    </ResponsiveContainer>
                </Card>
                <Card title="Average Resolution Time by Department (Hours)">
                     <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={resolutionTimeByDeptData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip formatter={(value: number) => [`${value.toFixed(1)} hrs`, 'Avg Time']} />
                            <Legend payload={[{ value: 'Avg Time (hrs)', type: 'square', color: '#82ca9d'}]} />
                            <Bar dataKey="value" fill="#82ca9d" name="Avg Time">
                                {resolutionTimeByDeptData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </Card>
                 <Card title="Complaints by Day of the Week">
                     <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={dayOfWeekData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis allowDecimals={false} />
                            <Tooltip />
                            <Bar dataKey="value" fill="#8884d8" name="Complaints">
                                {dayOfWeekData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </Card>
            </div>
        </div>
    );
};

const CategoryManager: React.FC<{ refreshTrigger: number, onRefresh: () => void }> = ({ refreshTrigger, onRefresh }) => {
    const [categories, setCategories] = useState<Category[]>([]);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [newCategoryDept, setNewCategoryDept] = useState('');
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [editedName, setEditedName] = useState('');
    const [editedDept, setEditedDept] = useState('');
    const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
    const [departments, setDepartments] = useState<string[]>([]);

    useEffect(() => {
        setCategories(storage.getCategories());
        const availableDepts = storage.getDepartments();
        setDepartments(availableDepts);
        if (availableDepts.length > 0) {
            setNewCategoryDept(availableDepts[0]);
        }
    }, [refreshTrigger]);

    const handleAdd = (e: React.FormEvent) => {
        e.preventDefault();
        const trimmedName = newCategoryName.trim();
        const trimmedDept = newCategoryDept.trim();
        if (trimmedName && trimmedDept) {
            const success = storage.addCategory({ name: trimmedName, department: trimmedDept });
            if (success) {
                setMessage({ text: `Category "${trimmedName}" added successfully.`, type: 'success' });
                setNewCategoryName('');
                onRefresh();
            } else {
                setMessage({ text: `Category "${trimmedName}" already exists.`, type: 'error' });
            }
            setTimeout(() => setMessage(null), 4000);
        }
    };

    const handleEditStart = (category: Category) => {
        setEditingCategory(category);
        setEditedName(category.name);
        setEditedDept(category.department);
    };

    const handleEditCancel = () => {
        setEditingCategory(null);
        setEditedName('');
        setEditedDept('');
    };

    const handleEditSave = () => {
        if (!editingCategory) return;
        
        const result = storage.updateCategory(editingCategory.name, { name: editedName, department: editedDept });
        setMessage({ text: result.message, type: result.success ? 'success' : 'error' });
        
        if (result.success) {
            onRefresh();
        }
        
        handleEditCancel();
        setTimeout(() => setMessage(null), 5000);
    };

    const handleDelete = (categoryName: string) => {
        if (window.confirm(`Are you sure you want to delete the category "${categoryName}"? This cannot be undone.`)) {
            const success = storage.deleteCategory(categoryName);
            if (success) {
                setMessage({ text: `Category "${categoryName}" has been deleted.`, type: 'success' });
                onRefresh();
            } else {
                setMessage({ text: `Cannot delete "${categoryName}" because it is currently in use by at least one complaint.`, type: 'error' });
            }
            setTimeout(() => setMessage(null), 5000);
        }
    };

    return (
        <Card title="Category Management">
            <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-4">
                <input type="text" value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} placeholder="New category name" className="md:col-span-1 rounded-md border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 shadow-sm focus:border-primary focus:ring-primary" />
                 <select value={newCategoryDept} onChange={e => setNewCategoryDept(e.target.value)} className="md:col-span-1 rounded-md border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 shadow-sm focus:border-primary focus:ring-primary">
                    {departments.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
                <button type="submit" className="md:col-span-1 px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary-dark rounded-md">Add Category</button>
            </form>

            {message && (
                <div className={`my-4 p-3 rounded-md text-sm transition-opacity duration-300 ${message.type === 'success' ? 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200' : 'bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-200'}`}>
                    {message.text}
                </div>
            )}
            <ul className="space-y-2">
                {categories.map(cat => (
                    <li key={cat.name} className="flex justify-between items-center bg-slate-50 dark:bg-slate-700/50 p-3 rounded-md">
                        {editingCategory?.name === cat.name ? (
                            <div className="flex-grow flex items-center gap-2">
                                <input type="text" value={editedName} onChange={e => setEditedName(e.target.value)} className="flex-grow rounded-md border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700" />
                                <select value={editedDept} onChange={e => setEditedDept(e.target.value)} className="flex-grow rounded-md border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700">
                                    {departments.map(d => <option key={d} value={d}>{d}</option>)}
                                </select>
                                <button onClick={handleEditSave} className="px-3 py-1 text-sm text-white bg-green-600 hover:bg-green-700 rounded-md">Save</button>
                                <button onClick={handleEditCancel} className="px-3 py-1 text-sm rounded-md border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700">Cancel</button>
                            </div>
                        ) : (
                            <>
                                <div>
                                    <span className="text-slate-800 dark:text-slate-200">{cat.name}</span>
                                    <span className="ml-2 text-xs bg-slate-200 dark:bg-slate-600 px-2 py-1 rounded-full">{cat.department}</span>
                                </div>
                                <div className="space-x-2">
                                    <button onClick={() => handleEditStart(cat)} className="text-secondary hover:text-secondary-dark dark:hover:text-secondary-light text-sm font-medium">Edit</button>
                                    <button onClick={() => handleDelete(cat.name)} className="text-red-500 hover:text-red-700 dark:hover:text-red-400 text-sm font-medium">Delete</button>
                                </div>
                            </>
                        )}
                    </li>
                ))}
            </ul>
        </Card>
    );
};

const DepartmentManager: React.FC<{ refreshTrigger: number, onRefresh: () => void }> = ({ refreshTrigger, onRefresh }) => {
    const [departments, setDepartments] = useState<string[]>([]);
    const [newDeptName, setNewDeptName] = useState('');
    const [editingDept, setEditingDept] = useState<string | null>(null);
    const [editedName, setEditedName] = useState('');
    const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

    useEffect(() => {
        setDepartments(storage.getDepartments());
    }, [refreshTrigger]);

    const handleAdd = (e: React.FormEvent) => {
        e.preventDefault();
        const result = storage.addDepartment(newDeptName);
        setMessage(result);
        if (result.success) {
            setNewDeptName('');
            onRefresh();
        }
        setTimeout(() => setMessage(null), 4000);
    };

    const handleEditStart = (deptName: string) => {
        setEditingDept(deptName);
        setEditedName(deptName);
    };

    const handleEditCancel = () => {
        setEditingDept(null);
        setEditedName('');
    };

    const handleEditSave = () => {
        if (!editingDept) return;
        const result = storage.updateDepartment(editingDept, editedName);
        setMessage(result);
        if (result.success) {
            onRefresh();
        }
        handleEditCancel();
        setTimeout(() => setMessage(null), 5000);
    };

    const handleDelete = (deptName: string) => {
        if (window.confirm(`Are you sure you want to delete the department "${deptName}"? This will also update any associated categories, users, and complaints.`)) {
            const result = storage.deleteDepartment(deptName);
            setMessage(result);
            if (result.success) {
                onRefresh();
            }
            setTimeout(() => setMessage(null), 5000);
        }
    };

    return (
        <Card title="Department Management">
            <form onSubmit={handleAdd} className="flex gap-2 mb-4">
                <input
                    type="text"
                    value={newDeptName}
                    onChange={e => setNewDeptName(e.target.value)}
                    placeholder="New department name"
                    className="flex-grow rounded-md border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 shadow-sm focus:border-primary focus:ring-primary"
                />
                <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary-dark rounded-md">Add Department</button>
            </form>

            {message && (
                <div className={`my-4 p-3 rounded-md text-sm transition-opacity duration-300 ${message.type === 'success' ? 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200' : 'bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-200'}`}>
                    {message.text}
                </div>
            )}

            <ul className="space-y-2">
                {departments.map(dept => (
                    <li key={dept} className="flex justify-between items-center bg-slate-50 dark:bg-slate-700/50 p-3 rounded-md">
                        {editingDept === dept ? (
                            <div className="flex-grow flex items-center gap-2">
                                <input
                                    type="text"
                                    value={editedName}
                                    onChange={e => setEditedName(e.target.value)}
                                    className="flex-grow rounded-md border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700"
                                />
                                <button onClick={handleEditSave} className="px-3 py-1 text-sm text-white bg-green-600 hover:bg-green-700 rounded-md">Save</button>
                                <button onClick={handleEditCancel} className="px-3 py-1 text-sm rounded-md border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700">Cancel</button>
                            </div>
                        ) : (
                            <>
                                <span className="text-slate-800 dark:text-slate-200">{dept}</span>
                                <div className="space-x-2">
                                    <button onClick={() => handleEditStart(dept)} className="text-secondary hover:text-secondary-dark dark:hover:text-secondary-light text-sm font-medium">Edit</button>
                                    <button onClick={() => handleDelete(dept)} className="text-red-500 hover:text-red-700 dark:hover:text-red-400 text-sm font-medium">Delete</button>
                                </div>
                            </>
                        )}
                    </li>
                ))}
            </ul>
        </Card>
    );
};


const UserManager: React.FC<{ refreshTrigger: number, onRefresh: () => void }> = ({ refreshTrigger, onRefresh }) => {
    const [users, setUsers] = useState<User[]>([]);
    const [sortConfig, setSortConfig] = useState<{ key: keyof User; direction: 'ascending' | 'descending' }>({ key: 'displayName', direction: 'ascending' });
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [formData, setFormData] = useState<Partial<User>>({});
    const [departments, setDepartments] = useState<string[]>([]);
    const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

    useEffect(() => {
        setUsers(storage.getUsers());
        setDepartments(storage.getDepartments());
    }, [refreshTrigger]);

    const requestSort = (key: keyof User) => {
        let direction: 'ascending' | 'descending' = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const sortedUsers = useMemo(() => {
        let sortableItems = [...users];
        if (sortConfig.key) {
            sortableItems.sort((a, b) => {
                const aValue = a[sortConfig.key] || '';
                const bValue = b[sortConfig.key] || '';
                if (aValue < bValue) {
                    return sortConfig.direction === 'ascending' ? -1 : 1;
                }
                if (aValue > bValue) {
                    return sortConfig.direction === 'ascending' ? 1 : -1;
                }
                return 0;
            });
        }
        return sortableItems;
    }, [users, sortConfig]);
    
    const handleOpenAddModal = () => {
        setEditingUser(null);
        setFormData({ role: 'resident', displayName: '', email: '', password: '', phoneNumber: '', department: departments[0] || '' });
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (user: User) => {
        setEditingUser(user);
        setFormData(user);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingUser(null);
        setFormData({});
    };

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);
        if (!formData.email || !formData.displayName || !formData.password || !formData.role) {
            setMessage({ text: 'Please fill all required fields: Name, Email, Password, and Role.', type: 'error' });
            return;
        }

        let success = false;
        let resultMessage = '';

        if (editingUser) {
            storage.updateUser(formData as User);
            success = true;
            resultMessage = `User "${formData.displayName}" updated successfully.`;
        } else {
            success = storage.addUser(formData as User);
            resultMessage = success ? `User "${formData.displayName}" added successfully.` : 'A user with this email already exists.';
        }

        setMessage({ text: resultMessage, type: success ? 'success' : 'error' });

        if (success) {
            onRefresh();
            handleCloseModal();
        }
        setTimeout(() => setMessage(null), 4000);
    };

    const handleDelete = (user: User) => {
        if (user.email === 'admin@mcp.portal') {
             setMessage({ text: 'The primary administrator account cannot be deleted.', type: 'error' });
             setTimeout(() => setMessage(null), 4000);
            return;
        }
        if (window.confirm(`Are you sure you want to delete user "${user.displayName}"? This action cannot be undone.`)) {
            const result = storage.deleteUser(user.email);
            setMessage({ text: result.message, type: result.success ? 'success' : 'error' });
            if (result.success) {
                onRefresh();
            }
             setTimeout(() => setMessage(null), 4000);
        }
    };

    return (
        <Card title="User Management">
            <div className="flex justify-end mb-4">
                <button onClick={handleOpenAddModal} className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary-dark rounded-md shadow-sm">Add New User</button>
            </div>
            {message && (
                <div className={`my-4 p-3 rounded-md text-sm transition-opacity duration-300 ${message.type === 'success' ? 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200' : 'bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-200'}`}>
                    {message.text}
                </div>
            )}
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                    <thead className="bg-slate-50 dark:bg-slate-700">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider cursor-pointer select-none" onClick={() => requestSort('displayName')}>Display Name</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider cursor-pointer select-none" onClick={() => requestSort('email')}>Email</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider cursor-pointer select-none" onClick={() => requestSort('password')}>Password</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider cursor-pointer select-none" onClick={() => requestSort('phoneNumber')}>Phone Number</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider cursor-pointer select-none" onClick={() => requestSort('role')}>Role</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider cursor-pointer select-none" onClick={() => requestSort('department')}>Department</th>
                             <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                        {sortedUsers.map(user => (
                            <tr key={user.email}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-slate-100">{user.displayName}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{user.email}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{user.password}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{user.phoneNumber}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 capitalize">{user.role}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{user.department || 'N/A'}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-4">
                                    <button onClick={() => handleOpenEditModal(user)} className="text-secondary hover:text-secondary-dark">Edit</button>
                                    <button onClick={() => handleDelete(user)} className="text-red-600 hover:text-red-800">Delete</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingUser ? 'Edit User' : 'Add New User'}>
                <form onSubmit={handleSubmit} className="space-y-4">
                     <div>
                        <label className="block text-sm font-medium">Display Name</label>
                        <input type="text" name="displayName" value={formData.displayName || ''} onChange={handleFormChange} required className="mt-1 w-full rounded-md border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 shadow-sm" />
                    </div>
                     <div>
                        <label className="block text-sm font-medium">Email</label>
                        <input type="email" name="email" value={formData.email || ''} onChange={handleFormChange} required disabled={!!editingUser} className="mt-1 w-full rounded-md border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 shadow-sm disabled:bg-slate-100 disabled:dark:bg-slate-700/50" />
                    </div>
                     <div>
                        <label className="block text-sm font-medium">Password</label>
                        <input type="text" name="password" value={formData.password || ''} onChange={handleFormChange} required className="mt-1 w-full rounded-md border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 shadow-sm" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Phone Number</label>
                        <input type="tel" name="phoneNumber" value={formData.phoneNumber || ''} onChange={handleFormChange} className="mt-1 w-full rounded-md border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 shadow-sm" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Role</label>
                        <select name="role" value={formData.role || 'resident'} onChange={handleFormChange} required className="mt-1 w-full rounded-md border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 shadow-sm">
                            <option value="resident">Resident</option>
                            <option value="department">Department Officer</option>
                            <option value="admin">Admin</option>
                        </select>
                    </div>
                    {formData.role === 'department' && (
                         <div>
                            <label className="block text-sm font-medium">Department</label>
                            <select name="department" value={formData.department || ''} onChange={handleFormChange} required className="mt-1 w-full rounded-md border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 shadow-sm">
                                <option value="" disabled>Select a department</option>
                                {departments.map(d => <option key={d} value={d}>{d}</option>)}
                            </select>
                        </div>
                    )}
                    <div className="flex justify-end gap-2 pt-4">
                        <button type="button" onClick={handleCloseModal} className="px-4 py-2 text-sm font-medium rounded-md border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700">Cancel</button>
                        <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary-dark rounded-md shadow-sm">{editingUser ? 'Save Changes' : 'Create User'}</button>
                    </div>
                </form>
            </Modal>
        </Card>
    );
};

const SystemSettings: React.FC = () => {
    const handleClearData = () => {
        if (window.confirm('ARE YOU ABSOLUTELY SURE?\n\nThis will permanently delete all users, complaints, and categories. This action cannot be undone.')) {
            storage.clearAllData();
            alert('All data has been cleared. The application will now reload.');
            window.location.reload();
        }
    };

    return (
        <Card title="System Settings">
            <div className="bg-red-50 dark:bg-red-900/30 border-l-4 border-red-400 p-4 rounded-r-lg">
                <h4 className="font-bold text-red-800 dark:text-red-200">Danger Zone</h4>
                <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                    This action is irreversible. Please be certain before proceeding.
                </p>
                <button
                    onClick={handleClearData}
                    className="mt-4 px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md shadow-sm"
                >
                    Clear All Application Data
                </button>
            </div>
        </Card>
    );
};


// --- Main Admin Dashboard Component ---
const AdminDashboard: React.FC = () => {
    const { user, logout } = useAuth();
    const [view, setView] = useState<AdminView>('overview');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const TABS = useMemo(() => {
        if (!user) return [];
        return ALL_TABS.filter(tab => tab.roles.includes(user.role));
    }, [user]);

    const refreshData = useCallback(() => {
        setRefreshTrigger(prev => prev + 1);
    }, []);

    const handleStorageChange = useCallback((event: StorageEvent) => {
        const relevantKeys = ['mcp_complaints', 'mcp_users', 'mcp_categories', 'mcp_departments'];
        if (event.key && relevantKeys.includes(event.key)) {
            refreshData();
        }
    }, [refreshData]);
    useStorageListener(handleStorageChange);

    const filteredComplaints = useMemo(() => {
        const allComplaints = storage.getComplaints();
        if (user?.role === 'department') {
            return allComplaints.filter(c => c.department === user.department);
        }
        return allComplaints;
    }, [user, refreshTrigger]);
    
    const residentUsers = useMemo(() => storage.getUsers().filter(u => u.role === 'resident'), [refreshTrigger]);

    useEffect(() => {
        // If the current view is no longer available to the user, switch to the first available one.
        if (TABS.length > 0 && !TABS.find(t => t.id === view)) {
            setView(TABS[0].id);
        }
    }, [TABS, view]);

    if (!user) {
        return null; // or a loading spinner
    }

    const renderContent = () => {
        switch (view) {
            case 'overview':
                return <DashboardOverview complaints={filteredComplaints} users={residentUsers} />;
            case 'complaints':
                return <ComplaintsTable complaints={filteredComplaints} onRefresh={refreshData} currentUser={user} />;
            case 'analytics':
                return <AnalyticsView complaints={filteredComplaints} />;
            case 'categories':
                return user.role === 'admin' ? <CategoryManager refreshTrigger={refreshTrigger} onRefresh={refreshData} /> : null;
            case 'departments':
                return user.role === 'admin' ? <DepartmentManager refreshTrigger={refreshTrigger} onRefresh={refreshData} /> : null;
            case 'users':
                return user.role === 'admin' ? <UserManager refreshTrigger={refreshTrigger} onRefresh={refreshData} /> : null;
            case 'system':
                return user.role === 'admin' ? <SystemSettings /> : null;
            default:
                return null;
        }
    };
    
    const SidebarContent = () => (
         <nav className="flex flex-col space-y-1 h-full">
            {TABS.map(tab => (
                <button
                    key={tab.id}
                    onClick={() => {
                        setView(tab.id);
                        if (window.innerWidth < 1024) { // Close sidebar on mobile after selection
                            setIsSidebarOpen(false);
                        }
                    }}
                    className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${view === tab.id ? 'bg-primary/10 text-primary dark:bg-primary-dark/30 dark:text-primary-light' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
                >
                    {tab.icon}
                    {tab.label}
                </button>
            ))}
            <div className="flex-grow"></div>
            <button
                onClick={logout}
                className="flex items-center px-3 py-2 mt-4 text-sm font-medium rounded-md text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" /></svg>
                Logout
            </button>
        </nav>
    );

    return (
        <div className="flex min-h-screen bg-slate-100 dark:bg-slate-900">
            {/* Desktop Sidebar */}
            <aside className="hidden lg:flex w-64 bg-white dark:bg-slate-800 p-4 flex-col shadow-lg">
                <div className="px-2 mb-6">
                    <h2 className="text-2xl font-bold text-primary dark:text-primary-light">Admin Panel</h2>
                    <p className="text-sm text-slate-500">{user.role === 'department' ? user.department : 'System-wide View'}</p>
                </div>
                <SidebarContent />
            </aside>

            {/* Mobile Sidebar */}
            <div className={`fixed inset-0 z-30 bg-black bg-opacity-50 transition-opacity lg:hidden ${isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={() => setIsSidebarOpen(false)}></div>
            <aside className={`fixed top-0 left-0 z-40 w-64 h-full bg-white dark:bg-slate-800 p-4 shadow-xl transform transition-transform lg:hidden ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                 <div className="px-2 mb-6">
                    <h2 className="text-2xl font-bold text-primary dark:text-primary-light">Admin Panel</h2>
                    <p className="text-sm text-slate-500">{user.role === 'department' ? user.department : 'System-wide View'}</p>
                 </div>
                 <SidebarContent />
            </aside>

            <div className="flex-1 flex flex-col">
                <header className="flex items-center justify-between lg:justify-center p-4 bg-white/80 dark:bg-slate-800/80 shadow-md lg:shadow-none lg:bg-transparent lg:dark:bg-transparent sticky top-0 z-20 backdrop-blur-sm">
                    <button className="lg:hidden p-2 text-slate-500 absolute left-4" onClick={() => setIsSidebarOpen(true)}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                    </button>
                    <h1 className="text-xl font-semibold text-slate-800 dark:text-slate-200">
                        {TABS.find(t => t.id === view)?.label}
                    </h1>
                </header>
                <main className="flex-1 p-4 sm:p-6 space-y-6">
                    {renderContent()}
                </main>
            </div>
        </div>
    );
};

export default AdminDashboard;