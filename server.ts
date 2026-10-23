import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { dataStore } from './src/server/storage.js';
import { detectDuplicates } from './src/server/duplicateService.js';
import { analyzeCivicIssue } from './src/server/geminiService.js';
import {
  CivicReport,
  CivicIssueCategory,
  Department,
  IssueStatus,
  User,
  AuditLogEntry,
} from './src/types/index.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

async function startServer() {
  const app = express();

  app.use(express.json({ limit: '10mb' }));

  // Helper middleware to authenticate/resolve user from header or fallback
  // Helper middleware to authenticate/resolve user from Authorization Bearer header or session token
  const getUserFromRequest = (req: express.Request): User | null => {
    const authHeader = req.headers['authorization'] as string;
    let token: string | undefined;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7).trim();
    } else if (req.headers['x-session-token']) {
      token = req.headers['x-session-token'] as string;
    }

    if (token) {
      const user = dataStore.getUserByToken(token);
      if (user) return user;
    }

    return null;
  };

  // --- AUTH ENDPOINTS ---

  app.get('/api/auth/me', (req, res) => {
    const user = getUserFromRequest(req);
    res.json({ user });
  });

  app.post('/api/auth/signin', (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    const trimmedEmail = email.toLowerCase().trim();
    const result = dataStore.authenticateUser(trimmedEmail, password);

    if (!result) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    res.json({
      user: result.user,
      token: result.token,
      message: 'Signed in successfully',
    });
  });

  app.post('/api/auth/signup', (req, res) => {
    const { name, email, password, role } = req.body;
    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      res.status(400).json({ error: 'Full name is required (minimum 2 characters)' });
      return;
    }
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      res.status(400).json({ error: 'A valid email address is required' });
      return;
    }
    if (!password || typeof password !== 'string' || password.length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters' });
      return;
    }

    try {
      const result = dataStore.registerUser(
        name.trim(),
        email.trim(),
        password,
        role === 'admin' ? 'admin' : 'citizen'
      );
      res.status(201).json({
        user: result.user,
        token: result.token,
        message: 'Account registered successfully',
      });
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Registration failed' });
    }
  });

  app.post('/api/auth/signout', (req, res) => {
    const authHeader = req.headers['authorization'] as string;
    let token: string | undefined;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7).trim();
    } else if (req.headers['x-session-token']) {
      token = req.headers['x-session-token'] as string;
    }

    if (token) {
      dataStore.revokeSession(token);
    }
    res.json({ message: 'Signed out successfully' });
  });

  // Dedicated endpoint for judge evaluation & quick persona testing
  app.post('/api/auth/demo-login', (req, res) => {
    const { role } = req.body;
    const targetEmail = role === 'admin' ? 'admin@civiclens.gov' : 'citizen@civiclens.gov';
    const defaultPassword = role === 'admin' ? 'admin123' : 'demo123';

    const result = dataStore.authenticateUser(targetEmail, defaultPassword);
    if (!result) {
      res.status(500).json({ error: 'Judge demo account configuration error' });
      return;
    }

    res.json({
      user: result.user,
      token: result.token,
      isDemoAccount: true,
      message: `Signed in as Judge Demo ${role === 'admin' ? 'Administrator (Dir. Marcus Vance)' : 'Citizen (Elena Ramos)'}`,
    });
  });

  app.post('/api/auth/demo-switch', (req, res) => {
    const { role } = req.body;
    const targetEmail = role === 'admin' ? 'admin@civiclens.gov' : 'citizen@civiclens.gov';
    const defaultPassword = role === 'admin' ? 'admin123' : 'demo123';
    const result = dataStore.authenticateUser(targetEmail, defaultPassword);
    if (result) {
      res.json({
        user: result.user,
        token: result.token,
        message: `Switched session to ${result.user.name} (${result.user.role})`,
      });
    } else {
      res.status(500).json({ error: 'Demo account unavailable' });
    }
  });

  // --- HEALTH & CONFIG ---

  app.get('/api/health', (req, res) => {
    const hasGeminiKey = Boolean(
      process.env.GEMINI_API_KEY &&
      process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY' &&
      process.env.GEMINI_API_KEY.trim().length > 0
    );

    res.json({
      status: 'operational',
      environment: process.env.NODE_ENV || 'development',
      geminiConfigured: hasGeminiKey,
      geminiModel: 'gemini-3.8-flash',
      storageBackend: 'File-backed JSON Store with memory caching',
      currentReportsCount: dataStore.getAllReports().length,
    });
  });

  // --- PRE-SCREEN / AI TEST ENDPOINT ---

  app.post('/api/reports/pre-screen', async (req, res) => {
    try {
      const { title, description, category, location } = req.body;
      if (!title || !description) {
        res.status(400).json({ error: 'Title and description are required for pre-screening' });
        return;
      }

      const { analysis, isRealAI, errorNotice } = await analyzeCivicIssue(
        title,
        description,
        category || 'Other',
        location || 'City Limits'
      );

      // Check duplicates
      const duplicates = detectDuplicates(
        {
          title,
          description,
          category: category || 'Other',
          location: location || '',
        },
        dataStore.getAllReports()
      );

      res.json({
        analysis,
        isRealAI,
        errorNotice,
        suggestedDuplicates: duplicates,
      });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || 'Pre-screening failed' });
    }
  });

  // --- REPORTS API ---

  // GET /api/reports (Role-enforced)
  app.get('/api/reports', (req, res) => {
    const user = getUserFromRequest(req);
    const { category, status, search, minPriority, department, scope } = req.query;

    let reports: CivicReport[] = [];

    if (user?.role === 'admin') {
      reports = dataStore.getAllReports();
    } else if (user?.role === 'citizen') {
      if (scope === 'my') {
        reports = dataStore.getReportsForUser(user.id);
      } else {
        // Return directory reports with submitter email masked for other users
        reports = dataStore.getAllReports().map((r) => {
          if (r.submittedBy.id === user.id) return r;
          return {
            ...r,
            submittedBy: {
              id: r.submittedBy.id,
              name: r.submittedBy.name,
              email: '[Protected]',
            },
          };
        });
      }
    } else {
      // Unauthenticated visitor (guest)
      // Allow viewing public directory reports with sanitized submitter data
      reports = dataStore.getAllReports().map((r) => ({
        ...r,
        submittedBy: {
          id: r.submittedBy.id,
          name: r.submittedBy.name,
          email: '[Protected]',
        },
      }));
    }

    // Apply filters
    if (category && typeof category === 'string' && category !== 'All') {
      reports = reports.filter((r) => r.category === category);
    }

    if (status && typeof status === 'string' && status !== 'All') {
      reports = reports.filter((r) => r.status === status);
    }

    if (department && typeof department === 'string' && department !== 'All') {
      reports = reports.filter((r) => r.assignedDepartment === department);
    }

    if (minPriority && !isNaN(Number(minPriority))) {
      const min = Number(minPriority);
      reports = reports.filter((r) => r.priorityScore >= min);
    }

    if (search && typeof search === 'string' && search.trim()) {
      const q = search.toLowerCase().trim();
      reports = reports.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          r.description.toLowerCase().includes(q) ||
          r.location.toLowerCase().includes(q) ||
          r.id.toLowerCase().includes(q)
      );
    }

    res.json({
      reports,
      totalCount: reports.length,
      viewerRole: user ? user.role : 'guest',
    });
  });

  // GET /api/reports/:id
  app.get('/api/reports/:id', (req, res) => {
    const user = getUserFromRequest(req);
    const { id } = req.params;

    const report = dataStore.getReportById(id);
    if (!report) {
      res.status(404).json({ error: `Report ${id} not found` });
      return;
    }

    // Mask submitter email for non-owners/non-admins to protect privacy
    if (!user || (user.role === 'citizen' && report.submittedBy.id !== user.id)) {
      const sanitizedReport: CivicReport = {
        ...report,
        submittedBy: {
          id: report.submittedBy.id,
          name: report.submittedBy.name,
          email: '[Protected - Citizen Privacy]',
        },
      };
      res.json({ report: sanitizedReport });
      return;
    }

    res.json({ report });
  });

  // POST /api/reports (Submit report - requires authentication)
  app.post('/api/reports', async (req, res) => {
    try {
      const user = getUserFromRequest(req);
      if (!user) {
        res.status(401).json({
          error: 'Authentication required. Please sign in or register to submit a civic report.',
        });
        return;
      }

      const { title, description, category, location, coordinates, imageUrl } = req.body;

      // Validation
      const errors: string[] = [];
      if (!title || typeof title !== 'string' || title.trim().length < 5) {
        errors.push('Title is required and must be at least 5 characters');
      }
      if (!description || typeof description !== 'string' || description.trim().length < 10) {
        errors.push('Description is required and must be at least 10 characters');
      }
      if (!category) {
        errors.push('Category selection is required');
      }
      if (!location || typeof location !== 'string' || location.trim().length < 3) {
        errors.push('Location or address is required');
      }

      // Check oversized inputs
      if (title && title.length > 300) {
        errors.push('Title exceeds maximum allowed length of 300 characters');
      }
      if (description && description.length > 4000) {
        errors.push('Description exceeds maximum allowed length of 4000 characters');
      }
      if (location && location.length > 400) {
        errors.push('Location exceeds maximum allowed length of 400 characters');
      }
      if (imageUrl && typeof imageUrl === 'string' && imageUrl.length > 5 * 1024 * 1024) {
        errors.push('Attached image payload exceeds 5MB limit');
      }

      // Strict coordinate bounds validation
      let validatedCoordinates: { latitude: number; longitude: number } | undefined = undefined;
      if (coordinates !== undefined && coordinates !== null) {
        if (typeof coordinates !== 'object') {
          errors.push('Coordinates must be an object with numeric latitude and longitude');
        } else {
          const lat = Number(coordinates.latitude);
          const lng = Number(coordinates.longitude);
          if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
            errors.push('Invalid coordinates: latitude must be between -90 and 90, longitude between -180 and 180');
          } else {
            validatedCoordinates = { latitude: lat, longitude: lng };
          }
        }
      }

      if (errors.length > 0) {
        res.status(400).json({ error: 'Validation failed', details: errors });
        return;
      }

      // Sanitize inputs
      const cleanTitle = title.replace(/[<>]/g, '').trim().slice(0, 200);
      const cleanDescription = description.replace(/[<>]/g, '').trim().slice(0, 2000);
      const cleanLocation = location.replace(/[<>]/g, '').trim().slice(0, 300);

      // Generate unique ID
      const timestampYear = new Date().getFullYear();
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const reportId = `CVL-${timestampYear}-${randomSuffix}`;
      const nowIso = new Date().toISOString();

      // Check duplicates against all current non-rejected issues
      const duplicates = detectDuplicates(
        {
          id: reportId,
          title: cleanTitle,
          description: cleanDescription,
          category,
          location: cleanLocation,
          coordinates: validatedCoordinates,
        },
        dataStore.getAllReports()
      );

      // Run Gemini AI Analysis (multimodal if imageUrl is provided)
      const { analysis, isRealAI, errorNotice } = await analyzeCivicIssue(
        cleanTitle,
        cleanDescription,
        category as CivicIssueCategory,
        cleanLocation,
        imageUrl
      );

      const initialAuditHistory: AuditLogEntry[] = [
        {
          id: `aud_${Date.now()}_1`,
          timestamp: nowIso,
          actor: user.name,
          actorRole: user.role,
          action: 'Report Submitted',
          details: `Issue filed in category "${category}" at "${location.trim()}".`,
        },
        {
          id: `aud_${Date.now()}_2`,
          timestamp: nowIso,
          actor: isRealAI ? 'CivicLens Gemini 3.8 Flash' : 'CivicLens Rules Engine',
          actorRole: 'system',
          action: 'AI Triage Completed',
          details: `Computed Priority Score: ${analysis.priorityScore}/100 (${analysis.severity}). Recommended: ${analysis.recommendedDepartment}.`,
        },
      ];

      if (duplicates.length > 0) {
        initialAuditHistory.push({
          id: `aud_${Date.now()}_3`,
          timestamp: nowIso,
          actor: 'CivicLens Duplicate Engine',
          actorRole: 'system',
          action: 'Potential Duplicates Flagged',
          details: `Found ${duplicates.length} matching report(s). Primary match: ${duplicates[0].reportId} (${duplicates[0].similarityScore}% match).`,
        });
      }

      const newReport: CivicReport = {
        id: reportId,
        title: cleanTitle,
        description: cleanDescription,
        category: category as CivicIssueCategory,
        location: cleanLocation,
        coordinates: validatedCoordinates,
        imageUrl: imageUrl || undefined,
        status: 'Submitted',
        createdAt: nowIso,
        updatedAt: nowIso,
        submittedBy: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
        assignedDepartment: 'Unassigned',
        priorityScore: analysis.priorityScore,
        priorityOverridden: false,
        aiAnalysis: analysis,
        duplicateMatches: duplicates,
        auditHistory: initialAuditHistory,
      };

      dataStore.createReport(newReport);

      res.status(201).json({
        report: newReport,
        isRealAI,
        errorNotice,
        message: 'Report submitted and triaged successfully',
      });
    } catch (err: any) {
      console.error('Error creating report:', err);
      res.status(500).json({ error: err?.message || 'Failed to process report' });
    }
  });

  // PATCH /api/reports/:id (Admin only status/department/priority/resolution management)
  app.patch('/api/reports/:id', (req, res) => {
    const user = getUserFromRequest(req);
    if (!user || user.role !== 'admin') {
      res.status(403).json({ error: 'Unauthorized: Only authenticated administrators can update report status' });
      return;
    }

    const { id } = req.params;
    const existing = dataStore.getReportById(id);
    if (!existing) {
      res.status(404).json({ error: `Report ${id} not found` });
      return;
    }

    const {
      status,
      assignedDepartment,
      priorityScore,
      priorityOverrideReason,
      resolutionNotes,
      rejectionReason,
    } = req.body;

    const updates: Partial<CivicReport> = {};
    const auditEntries: AuditLogEntry[] = [];
    const nowIso = new Date().toISOString();

    // Status transition
    if (status && status !== existing.status) {
      updates.status = status as IssueStatus;
      if (status === 'Resolved') {
        updates.resolvedAt = nowIso;
        if (resolutionNotes) {
          updates.resolutionNotes = resolutionNotes;
        }
      } else if (status === 'Rejected') {
        if (rejectionReason) {
          updates.rejectionReason = rejectionReason;
        }
      }

      auditEntries.push({
        id: `aud_${Date.now()}_status`,
        timestamp: nowIso,
        actor: user.name,
        actorRole: 'admin',
        action: `Status Changed to ${status}`,
        details:
          status === 'Resolved'
            ? `Issue marked resolved. Notes: ${resolutionNotes || 'None'}`
            : status === 'Rejected'
            ? `Issue rejected. Reason: ${rejectionReason || 'Duplicate or invalid'}`
            : `Status transitioned from ${existing.status} to ${status}.`,
      });
    }

    // Department assignment
    if (assignedDepartment && assignedDepartment !== existing.assignedDepartment) {
      updates.assignedDepartment = assignedDepartment as Department;
      auditEntries.push({
        id: `aud_${Date.now()}_dept`,
        timestamp: nowIso,
        actor: user.name,
        actorRole: 'admin',
        action: 'Department Assigned',
        details: `Assigned to ${assignedDepartment}.`,
      });
    }

    // Priority override
    if (typeof priorityScore === 'number' && priorityScore !== existing.priorityScore) {
      if (!priorityOverrideReason || priorityOverrideReason.trim().length < 5) {
        res.status(400).json({
          error: 'An explanation is required when manually overriding AI priority score',
        });
        return;
      }
      updates.priorityScore = Math.min(100, Math.max(0, priorityScore));
      updates.priorityOverridden = true;
      updates.priorityOverrideReason = priorityOverrideReason.trim();

      auditEntries.push({
        id: `aud_${Date.now()}_prio`,
        timestamp: nowIso,
        actor: user.name,
        actorRole: 'admin',
        action: 'Priority Overridden',
        details: `Priority adjusted from ${existing.priorityScore} to ${updates.priorityScore}. Justification: "${priorityOverrideReason.trim()}".`,
      });
    }

    // Notes
    if (resolutionNotes && resolutionNotes !== existing.resolutionNotes) {
      updates.resolutionNotes = resolutionNotes;
    }
    if (rejectionReason && rejectionReason !== existing.rejectionReason) {
      updates.rejectionReason = rejectionReason;
    }

    if (auditEntries.length > 0) {
      updates.auditHistory = [...(existing.auditHistory || []), ...auditEntries];
    }

    const updated = dataStore.updateReport(id, updates);
    res.json({ report: updated, message: 'Report updated successfully' });
  });

  // POST /api/reports/:id/duplicates/:dupId (Confirm or dismiss duplicate)
  app.post('/api/reports/:id/duplicates/:dupId', (req, res) => {
    const user = getUserFromRequest(req);
    if (!user || user.role !== 'admin') {
      res.status(403).json({ error: 'Unauthorized: Only administrators can manage duplicates' });
      return;
    }

    const { id, dupId } = req.params;
    const { action } = req.body; // 'confirm' | 'dismiss'

    const report = dataStore.getReportById(id);
    if (!report) {
      res.status(404).json({ error: `Report ${id} not found` });
      return;
    }

    const nowIso = new Date().toISOString();
    const updatedMatches = (report.duplicateMatches || []).map((m) => {
      if (m.reportId === dupId) {
        return {
          ...m,
          status: (action === 'confirm' ? 'confirmed' : 'dismissed') as 'confirmed' | 'dismissed',
        };
      }
      return m;
    });

    const auditEntry: AuditLogEntry = {
      id: `aud_${Date.now()}_dup_action`,
      timestamp: nowIso,
      actor: user.name,
      actorRole: 'admin',
      action: action === 'confirm' ? 'Duplicate Confirmed' : 'Duplicate Dismissed',
      details: `Administrator ${action === 'confirm' ? 'confirmed' : 'dismissed'} duplicate link with report ${dupId}.`,
    };

    const updated = dataStore.updateReport(id, {
      duplicateMatches: updatedMatches,
      auditHistory: [...(report.auditHistory || []), auditEntry],
    });

    res.json({ report: updated, message: `Duplicate marked as ${action}ed` });
  });

  // GET /api/analytics
  app.get('/api/analytics', (req, res) => {
    const analytics = dataStore.computeAnalytics();
    res.json(analytics);
  });

  // GET /api/ai-insights
  app.get('/api/ai-insights', (req, res) => {
    const insights = dataStore.getAIInsights();
    res.json(insights);
  });

  // POST /api/reset-data
  app.post('/api/reset-data', (req, res) => {
    dataStore.resetToSeedData();
    res.json({
      message: 'Demo dataset reset to pristine initial state',
      reportsCount: dataStore.getAllReports().length,
    });
  });

  // --- VITE MIDDLEWARE / STATIC ASSETS ---

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`CivicLens AI Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal server startup error:', err);
  process.exit(1);
});
