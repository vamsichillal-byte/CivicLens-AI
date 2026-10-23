import React, { useState } from 'react';
import {
  CivicIssueCategory,
  User,
  AIAnalysis,
  DuplicateMatch,
  CivicReport,
} from '../types/index.js';
import {
  Sparkles,
  MapPin,
  Upload,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ShieldAlert,
  ArrowRight,
  RefreshCw,
  Building2,
  Flame,
  Camera,
  X,
  Copy,
} from 'lucide-react';
import { submitReport, preScreenReport } from '../services/api.js';
import { NavigationTab } from '../components/Sidebar.js';

interface ReportIssuePageProps {
  currentUser: User | null;
  onNavigate: (tab: NavigationTab) => void;
  onOpenReportModal: (report: CivicReport) => void;
  onOpenAuthModal?: () => void;
}

export const ReportIssuePage: React.FC<ReportIssuePageProps> = ({
  currentUser,
  onNavigate,
  onOpenReportModal,
  onOpenAuthModal,
}) => {
  // Form fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<CivicIssueCategory>('Pothole / Damaged Road');
  const [location, setLocation] = useState('');
  const [latitude, setLatitude] = useState<string>('37.7749');
  const [longitude, setLongitude] = useState<string>('-122.4194');
  const [imageUrl, setImageUrl] = useState<string>('');

  // UI state
  const [submitting, setSubmitting] = useState(false);
  const [submissionStep, setSubmissionStep] = useState<string>('');
  const [preScreening, setPreScreening] = useState(false);
  const [preScreenResult, setPreScreenResult] = useState<{
    analysis: AIAnalysis;
    isRealAI: boolean;
    errorNotice?: string;
    suggestedDuplicates: DuplicateMatch[];
  } | null>(null);

  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [submittedReport, setSubmittedReport] = useState<CivicReport | null>(null);

  const categories: Array<{ id: CivicIssueCategory; label: string; icon: string }> = [
    { id: 'Pothole / Damaged Road', label: 'Pothole / Damaged Road', icon: '🚧' },
    { id: 'Garbage / Waste', label: 'Garbage / Waste Dump', icon: '🗑️' },
    { id: 'Water Leakage', label: 'Water Leakage / Pipe Burst', icon: '💧' },
    { id: 'Broken Streetlight', label: 'Broken Streetlight / Dark Zone', icon: '💡' },
    { id: 'Drainage / Flooding', label: 'Drainage / Flooding', icon: '🌊' },
    { id: 'Other', label: 'Other Civic Infrastructure', icon: '🏛️' },
  ];

  // Quick fill samples for judges
  const samplePresets = [
    {
      label: 'Dangerous Pothole near School',
      title: 'Deep crater pothole in front of Lincoln High crosswalk',
      desc: 'Vehicle tires hitting rim. Pedestrian kids crossing street have to dodge cars swerving into incoming traffic.',
      cat: 'Pothole / Damaged Road' as CivicIssueCategory,
      loc: '750 Lincoln Blvd, High School Crossing',
      lat: '37.7710',
      lng: '-122.4250',
      img: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80',
    },
    {
      label: 'Burst Water Main on 5th Ave',
      title: 'Water bubbling up through sidewalk pavement on 5th Ave',
      desc: 'Water pouring down sidewalk near Maple Bakery. Foot traffic blocked and water entering basement crawlspace.',
      cat: 'Water Leakage' as CivicIssueCategory,
      loc: '1285 5th Avenue, near Maple Bakery',
      lat: '37.7758',
      lng: '-122.4182',
      img: 'https://images.unsplash.com/photo-1584824486509-112e4181ff6b?auto=format&fit=crop&w=800&q=80',
    },
    {
      label: 'Fallen Power Line & Streetlight Out',
      title: 'Flickering and dangling electrical wire on metal streetlight pole',
      desc: 'High wind detached streetlight luminaire head. Sparking wires touching chain-link fence in alley.',
      cat: 'Broken Streetlight' as CivicIssueCategory,
      loc: 'Corner of 8th & Harrison Street',
      lat: '37.7780',
      lng: '-122.4105',
      img: '',
    },
  ];

  const applyPreset = (preset: typeof samplePresets[0]) => {
    setTitle(preset.title);
    setDescription(preset.desc);
    setCategory(preset.cat);
    setLocation(preset.loc);
    setLatitude(preset.lat);
    setLongitude(preset.lng);
    setImageUrl(preset.img);
    setPreScreenResult(null);
    setValidationErrors([]);
  };

  const handleImageFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('Photo must be smaller than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setImageUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handlePreScreen = async () => {
    const errors: string[] = [];
    if (!title.trim() || title.trim().length < 5) {
      errors.push('Title must be at least 5 characters for AI pre-screening');
    }
    if (!description.trim() || description.trim().length < 10) {
      errors.push('Description must be at least 10 characters for AI pre-screening');
    }
    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }

    setValidationErrors([]);
    setPreScreening(true);
    try {
      const res = await preScreenReport({
        title: title.trim(),
        description: description.trim(),
        category,
        location: location.trim() || 'Civic Center District',
      });
      setPreScreenResult(res);
    } catch (err: any) {
      alert(err.message || 'Pre-screen request failed');
    } finally {
      setPreScreening(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentUser) {
      setValidationErrors([
        'Authentication required: Please sign in or register an account to submit an official civic report.',
      ]);
      onOpenAuthModal?.();
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const errors: string[] = [];
    if (!title.trim() || title.trim().length < 5) {
      errors.push('Issue title is required (minimum 5 characters)');
    }
    if (!description.trim() || description.trim().length < 10) {
      errors.push('Detailed description is required (minimum 10 characters)');
    }
    if (!category) {
      errors.push('Please select a civic category');
    }
    if (!location.trim() || location.trim().length < 3) {
      errors.push('Location or street address is required');
    }

    if (errors.length > 0) {
      setValidationErrors(errors);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setValidationErrors([]);
    setSubmitting(true);
    setSubmissionStep('Validating complaint data...');

    try {
      setTimeout(() => setSubmissionStep('Calling Google Gemini 3.8 Flash model...'), 300);
      setTimeout(() => setSubmissionStep('Executing geospatial duplicate detection...'), 800);
      setTimeout(() => setSubmissionStep('Generating verifiable report ID & audit log...'), 1200);

      const latNum = parseFloat(latitude);
      const lngNum = parseFloat(longitude);
      const coords = !isNaN(latNum) && !isNaN(lngNum) ? { latitude: latNum, longitude: lngNum } : undefined;

      const res = await submitReport({
        title: title.trim(),
        description: description.trim(),
        category,
        location: location.trim(),
        coordinates: coords,
        imageUrl: imageUrl.trim() || undefined,
      });

      setSubmittedReport(res.report);
    } catch (err: any) {
      alert(err.message || 'Failed to submit report');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Report a Civic Issue</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Submit a neighborhood problem for automated AI triage, duplicate checks, and dispatch.
          </p>
        </div>

        {/* Quick fill presets for judges */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-400 font-semibold uppercase">Demo Presets:</span>
          <div className="flex flex-wrap gap-1.5">
            {samplePresets.map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => applyPreset(preset)}
                className="text-[11px] px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors border border-slate-200"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Validation Errors Box */}
      {validationErrors.length > 0 && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl space-y-1.5 text-xs text-rose-800">
          <div className="font-bold flex items-center gap-1.5 text-rose-900">
            <AlertTriangle className="w-4 h-4 text-rose-600" />
            Please address the following requirements:
          </div>
          <ul className="list-disc list-inside space-y-0.5 pl-1">
            {validationErrors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 sm:p-7 space-y-5">
          {/* Issue Title */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-800 flex items-center justify-between">
              <span>Issue Title *</span>
              <span className="text-[11px] font-normal text-slate-400">
                Clear summary (e.g., &ldquo;Deep pothole in crosswalk&rdquo;)
              </span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Broken water pipe leaking continuously near 5th Ave and Maple"
              className="w-full text-xs sm:text-sm p-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          {/* Category Selector */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-800">Select Category *</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategory(cat.id)}
                  className={`p-3 rounded-lg border text-left flex items-center gap-2.5 transition-all ${
                    category === cat.id
                      ? 'border-blue-600 bg-blue-50/70 text-blue-950 font-bold shadow-xs'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span className="text-lg">{cat.icon}</span>
                  <span className="text-xs">{cat.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Detailed Description */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800">Detailed Description *</label>
              <button
                type="button"
                onClick={handlePreScreen}
                disabled={preScreening || !title || !description}
                className="text-xs font-semibold text-blue-700 hover:text-blue-900 flex items-center gap-1.5 px-2.5 py-1 rounded bg-blue-50 border border-blue-200 disabled:opacity-40 transition-colors"
                title="Evaluate with Gemini AI and check for duplicate reports before saving"
              >
                <Sparkles
                  className={`w-3.5 h-3.5 ${preScreening ? 'animate-spin' : 'text-blue-600'}`}
                />
                <span>{preScreening ? 'AI Pre-screening...' : 'AI Pre-Check & Duplicates'}</span>
              </button>
            </div>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what is broken, visible hazards, traffic or pedestrian impact, and how long it has been occurring..."
              rows={4}
              className="w-full text-xs sm:text-sm p-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* AI Pre-Screen Results Banner */}
          {preScreenResult && (
            <div className="p-4 bg-gradient-to-r from-blue-50/80 to-indigo-50/80 border border-blue-200 rounded-xl space-y-3 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-blue-900">
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  <span>
                    Gemini AI Pre-Assessment Preview ({preScreenResult.analysis.severity} Severity)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setPreScreenResult(null)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-blue-950 leading-relaxed">
                {preScreenResult.analysis.summary}
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                <div className="bg-white/80 p-2 rounded border border-blue-100">
                  <span className="text-[10px] text-slate-500 block">Est. Priority Score</span>
                  <span className="font-bold text-slate-900">
                    {preScreenResult.analysis.priorityScore} / 100
                  </span>
                </div>
                <div className="bg-white/80 p-2 rounded border border-blue-100">
                  <span className="text-[10px] text-slate-500 block">Recommended Dept</span>
                  <span className="font-bold text-slate-900 truncate block">
                    {preScreenResult.analysis.recommendedDepartment}
                  </span>
                </div>
                <div className="bg-white/80 p-2 rounded border border-blue-100 col-span-2 sm:col-span-1">
                  <span className="text-[10px] text-slate-500 block">Safety Risks</span>
                  <span className="font-bold text-slate-900">
                    {preScreenResult.analysis.safetyRisks.length} flagged
                  </span>
                </div>
              </div>

              {/* Duplicate alert if found */}
              {preScreenResult.suggestedDuplicates.length > 0 && (
                <div className="p-2.5 bg-amber-100/80 border border-amber-300 rounded-lg text-xs text-amber-900 flex items-start gap-2">
                  <Copy className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Notice: Similar report already on file: </span>
                    {preScreenResult.suggestedDuplicates[0].reportId} (
                    {preScreenResult.suggestedDuplicates[0].similarityScore}% match). Your submission
                    will be linked to give authorities stronger evidence without losing your report.
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Location & GPS */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-slate-500" />
                Location or Street Address *
              </label>
              <button
                type="button"
                onClick={() => {
                  setLocation('Market St & 4th Street, Downtown Transit Corridor');
                  setLatitude('37.7858');
                  setLongitude('-122.4065');
                }}
                className="text-[11px] text-blue-600 hover:text-blue-800 font-medium"
              >
                Use Downtown Coordinates
              </button>
            </div>

            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. 420 Elm Street, outside Oakridge Elementary crosswalk"
              className="w-full text-xs sm:text-sm p-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500"
              required
            />

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-500">Latitude</label>
                <input
                  type="text"
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                  placeholder="37.7749"
                  className="w-full text-xs p-2 rounded-lg border border-slate-300 font-mono"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-500">Longitude</label>
                <input
                  type="text"
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                  placeholder="-122.4194"
                  className="w-full text-xs p-2 rounded-lg border border-slate-300 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Optional Image Upload */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <label className="text-xs font-bold text-slate-800 flex items-center justify-between">
              <span>Photo Attachment (Optional)</span>
              <span className="text-[11px] font-normal text-slate-400">JPG, PNG up to 5MB</span>
            </label>

            {imageUrl ? (
              <div className="relative rounded-lg border border-slate-200 overflow-hidden bg-slate-100 p-2 flex items-center gap-4">
                <img
                  src={imageUrl}
                  alt="Attachment preview"
                  className="w-20 h-20 object-cover rounded-md border border-slate-300"
                />
                <div className="flex-1 min-w-0 text-xs">
                  <div className="font-semibold text-slate-800">Photo attached successfully</div>
                  <div className="text-[11px] text-slate-400">
                    Will be inspected by multimodal civic pipeline
                  </div>
                  <button
                    type="button"
                    onClick={() => setImageUrl('')}
                    className="text-xs text-rose-600 hover:text-rose-800 font-medium mt-1 flex items-center gap-1"
                  >
                    <X className="w-3.5 h-3.5" /> Remove photo
                  </button>
                </div>
              </div>
            ) : (
              <div className="border-2 border-dashed border-slate-200 hover:border-slate-300 rounded-xl p-5 text-center space-y-2 bg-slate-50/50">
                <Camera className="w-8 h-8 text-slate-400 mx-auto" />
                <div className="text-xs text-slate-600">
                  <label className="font-semibold text-blue-600 hover:underline cursor-pointer">
                    Click to select photo
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageFile}
                      className="hidden"
                    />
                  </label>{' '}
                  or paste URL
                </div>
                <input
                  type="text"
                  placeholder="Or paste an image URL (https://...)"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="w-full max-w-sm text-xs p-1.5 rounded border border-slate-300 mx-auto text-center"
                />
              </div>
            )}
          </div>
        </div>

        {/* Submit Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500">
            Submitting as <strong>{currentUser.name}</strong> ({currentUser.email})
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => onNavigate('overview')}
              className="flex-1 sm:flex-initial px-4 py-2.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 sm:flex-initial px-6 py-2.5 rounded-lg bg-blue-900 hover:bg-blue-800 text-white text-xs sm:text-sm font-bold shadow-md shadow-blue-900/20 disabled:opacity-50 flex items-center justify-center gap-2 transition-all"
            >
              {submitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>{submissionStep || 'Triage in Progress...'}</span>
                </>
              ) : (
                <>
                  <span>Submit & Run AI Triage</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Post-Submission Success Dialog */}
      {submittedReport && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-7 h-7" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-lg font-bold text-slate-900">
                Civic Report Triaged Successfully!
              </h3>
              <p className="text-xs text-slate-500">
                Your report has been received, analyzed by Gemini AI, and logged in the municipal
                audit trail.
              </p>
              <div className="pt-2">
                <span className="font-mono text-xs font-bold px-3 py-1 bg-slate-100 border border-slate-200 text-slate-800 rounded-md">
                  Report ID: {submittedReport.id}
                </span>
              </div>
            </div>

            {/* AI Summary Card */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-700">Calculated Priority:</span>
                <span className="font-bold text-blue-900">
                  {submittedReport.priorityScore}/100 ({submittedReport.aiAnalysis.severity})
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-700">Assigned Department:</span>
                <span className="font-bold text-slate-800">
                  {submittedReport.aiAnalysis.recommendedDepartment}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-700">Estimated SLA:</span>
                <span className="text-slate-600">
                  {submittedReport.aiAnalysis.estimatedResponseTimeframe}
                </span>
              </div>
              <p className="pt-1 text-slate-600 italic">
                &ldquo;{submittedReport.aiAnalysis.summary}&rdquo;
              </p>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  const rep = submittedReport;
                  setSubmittedReport(null);
                  onOpenReportModal(rep);
                }}
                className="flex-1 py-2.5 px-4 rounded-lg bg-blue-900 hover:bg-blue-800 text-white font-semibold text-xs shadow-xs transition-colors"
              >
                Inspect AI Breakdown
              </button>
              <button
                type="button"
                onClick={() => {
                  setSubmittedReport(null);
                  onNavigate('reports');
                }}
                className="flex-1 py-2.5 px-4 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-colors"
              >
                Go to All Reports
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
