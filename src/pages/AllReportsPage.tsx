import React, { useState } from 'react';
import {
  CivicReport,
  User,
  CivicIssueCategory,
  IssueStatus,
  Department,
} from '../types/index.js';
import {
  Search,
  Filter,
  MapPin,
  Clock,
  Sparkles,
  LayoutGrid,
  List,
  Flame,
  AlertTriangle,
  Copy,
  ChevronRight,
  CheckCircle2,
  Building2,
  ExternalLink,
} from 'lucide-react';
import { NavigationTab } from '../components/Sidebar.js';

interface AllReportsPageProps {
  reports: CivicReport[];
  currentUser: User | null;
  onOpenReportModal: (report: CivicReport) => void;
  onNavigate: (tab: NavigationTab) => void;
}

export const AllReportsPage: React.FC<AllReportsPageProps> = ({
  reports,
  currentUser,
  onOpenReportModal,
  onNavigate,
}) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('All');
  const [minPriority, setMinPriority] = useState<number>(0);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  const isAdmin = currentUser?.role === 'admin';

  // Filter reports
  const filteredReports = reports.filter((r) => {
    if (selectedCategory !== 'All' && r.category !== selectedCategory) return false;
    if (selectedStatus !== 'All' && r.status !== selectedStatus) return false;
    if (selectedDepartment !== 'All' && r.assignedDepartment !== selectedDepartment) return false;
    if (r.priorityScore < minPriority) return false;

    if (search.trim()) {
      const q = search.toLowerCase().trim();
      const match =
        r.title.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q) ||
        r.location.toLowerCase().includes(q) ||
        r.id.toLowerCase().includes(q);
      if (!match) return false;
    }

    return true;
  });

  const getPriorityBadge = (score: number) => {
    if (score >= 85) {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-800 border border-red-200">
          <Flame className="w-3 h-3 text-red-600" />
          {score} Critical
        </span>
      );
    }
    if (score >= 66) {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
          <Flame className="w-3 h-3 text-amber-600" />
          {score} High
        </span>
      );
    }
    if (score >= 36) {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
          {score} Medium
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
        {score} Low
      </span>
    );
  };

  const getStatusBadge = (status: IssueStatus) => {
    switch (status) {
      case 'Submitted':
        return <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-blue-100 text-blue-800">Submitted</span>;
      case 'Under Review':
        return <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-purple-100 text-purple-800">Under Review</span>;
      case 'Assigned':
        return <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-amber-100 text-amber-800">Assigned</span>;
      case 'In Progress':
        return <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-indigo-100 text-indigo-800">In Progress</span>;
      case 'Resolved':
        return <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">Resolved</span>;
      case 'Rejected':
        return <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-rose-100 text-rose-800">Rejected</span>;
    }
  };

  return (
    <div className="space-y-6 pb-12 max-w-6xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {isAdmin ? 'Municipal Issue Directory' : 'My Reported Complaints'}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {isAdmin
              ? `Displaying all ${filteredReports.length} complaints submitted across the city.`
              : `Displaying your ${filteredReports.length} personal submitted reports.`}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View mode toggle */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded transition-colors ${
                viewMode === 'grid' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded transition-colors ${
                viewMode === 'table' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
              }`}
              title="Table View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => onNavigate('report')}
            className="px-3.5 py-1.5 rounded-lg bg-blue-900 hover:bg-blue-800 text-white font-semibold text-xs shadow-xs transition-colors"
          >
            + Report New Issue
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search query */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search keyword, location, or ID..."
              className="w-full text-xs pl-9 pr-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full text-xs p-2 rounded-lg border border-slate-300 bg-white"
            >
              <option value="All">All Categories</option>
              <option value="Pothole / Damaged Road">Pothole / Damaged Road</option>
              <option value="Garbage / Waste">Garbage / Waste</option>
              <option value="Water Leakage">Water Leakage</option>
              <option value="Broken Streetlight">Broken Streetlight</option>
              <option value="Drainage / Flooding">Drainage / Flooding</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full text-xs p-2 rounded-lg border border-slate-300 bg-white"
            >
              <option value="All">All Statuses</option>
              <option value="Submitted">Submitted</option>
              <option value="Under Review">Under Review</option>
              <option value="Assigned">Assigned</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>

          {/* Priority Slider */}
          <div className="flex flex-col justify-center px-1">
            <div className="flex items-center justify-between text-[11px] text-slate-600 font-medium">
              <span>Min Priority:</span>
              <span className="font-bold text-blue-900">{minPriority} / 100</span>
            </div>
            <input
              type="range"
              min="0"
              max="90"
              step="10"
              value={minPriority}
              onChange={(e) => setMinPriority(Number(e.target.value))}
              className="w-full accent-blue-600 mt-1"
            />
          </div>
        </div>

        {/* Reset filter button */}
        {(search || selectedCategory !== 'All' || selectedStatus !== 'All' || minPriority > 0) && (
          <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100 text-slate-500">
            <span>Filtering {filteredReports.length} of {reports.length} total reports</span>
            <button
              onClick={() => {
                setSearch('');
                setSelectedCategory('All');
                setSelectedStatus('All');
                setSelectedDepartment('All');
                setMinPriority(0);
              }}
              className="text-blue-600 hover:underline font-semibold"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>

      {/* Empty State */}
      {filteredReports.length === 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
          <Filter className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">No matching reports found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Try adjusting your search query, clearing filters, or submit a new report.
          </p>
        </div>
      )}

      {/* GRID VIEW */}
      {viewMode === 'grid' && filteredReports.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredReports.map((report) => (
            <div
              key={report.id}
              onClick={() => onOpenReportModal(report)}
              className="bg-white rounded-xl border border-slate-200 shadow-xs hover:shadow-md hover:border-slate-300 transition-all p-4 flex flex-col justify-between cursor-pointer space-y-3 group"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-1">
                  <span className="font-mono text-[11px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                    {report.id}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {getPriorityBadge(report.priorityScore)}
                  </div>
                </div>

                <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2">
                  {report.title}
                </h3>

                <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                  {report.description}
                </p>

                {report.imageUrl && (
                  <div className="w-full h-28 rounded-lg overflow-hidden bg-slate-100 border border-slate-200">
                    <img
                      src={report.imageUrl}
                      alt={report.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  </div>
                )}
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-500 truncate max-w-[150px]">
                    {report.assignedDepartment}
                  </span>
                  {getStatusBadge(report.status)}
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span className="truncate max-w-[160px] flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                    {report.location}
                  </span>
                  <span className="shrink-0">
                    {new Date(report.createdAt).toLocaleDateString()}
                  </span>
                </div>

                {report.duplicateMatches && report.duplicateMatches.length > 0 && (
                  <div className="flex items-center gap-1 text-[10px] font-semibold text-purple-700 bg-purple-50 px-2 py-1 rounded">
                    <Copy className="w-3 h-3" />
                    <span>{report.duplicateMatches.length} Potential duplicate(s) linked</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TABLE VIEW */}
      {viewMode === 'table' && filteredReports.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-3">ID</th>
                  <th className="p-3">Issue Title</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Location</th>
                  <th className="p-3">Priority</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Department</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredReports.map((report) => (
                  <tr
                    key={report.id}
                    onClick={() => onOpenReportModal(report)}
                    className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                  >
                    <td className="p-3 font-mono font-bold text-slate-900">{report.id}</td>
                    <td className="p-3 max-w-xs">
                      <div className="font-semibold text-slate-900 truncate">{report.title}</div>
                      {report.duplicateMatches && report.duplicateMatches.length > 0 && (
                        <span className="text-[10px] text-purple-700 bg-purple-50 px-1.5 py-0.2 rounded font-medium inline-block mt-0.5">
                          {report.duplicateMatches.length} duplicate link
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-slate-600">{report.category}</td>
                    <td className="p-3 text-slate-500 truncate max-w-[150px]">{report.location}</td>
                    <td className="p-3">{getPriorityBadge(report.priorityScore)}</td>
                    <td className="p-3">{getStatusBadge(report.status)}</td>
                    <td className="p-3 text-slate-600">{report.assignedDepartment}</td>
                    <td className="p-3 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenReportModal(report);
                        }}
                        className="text-blue-600 hover:text-blue-800 font-semibold inline-flex items-center gap-1"
                      >
                        Inspect <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
