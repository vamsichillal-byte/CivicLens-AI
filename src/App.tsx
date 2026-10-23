/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  CivicReport,
  User,
  AnalyticsSummary,
} from './types/index.js';
import {
  getStoredUser,
  setStoredUser,
  fetchReports,
  fetchHealth,
  fetchAnalytics,
  switchDemoRole,
} from './services/api.js';
import { Navbar } from './components/Navbar.js';
import { Sidebar, NavigationTab } from './components/Sidebar.js';
import { ReportDetailModal } from './components/ReportDetailModal.js';
import { AuthModal } from './components/AuthModal.js';
import { JudgeDemoBanner } from './components/JudgeDemoBanner.js';
import { LandingPage } from './pages/LandingPage.js';
import { OverviewPage } from './pages/OverviewPage.js';
import { ReportIssuePage } from './pages/ReportIssuePage.js';
import { AllReportsPage } from './pages/AllReportsPage.js';
import { AdministrationPage } from './pages/AdministrationPage.js';
import { AnalyticsPage } from './pages/AnalyticsPage.js';
import { AIInsightsPage } from './pages/AIInsightsPage.js';
import { SettingsPage } from './pages/SettingsPage.js';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(getStoredUser());
  const [currentTab, setCurrentTab] = useState<NavigationTab>('landing');
  const [reports, setReports] = useState<CivicReport[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [geminiConfigured, setGeminiConfigured] = useState(false);
  const [loading, setLoading] = useState(true);

  // Modals
  const [selectedReport, setSelectedReport] = useState<CivicReport | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Load initial health and data
  const loadData = async () => {
    try {
      setLoading(true);
      // Health check
      const health = await fetchHealth().catch(() => ({ geminiConfigured: false }));
      setGeminiConfigured(Boolean(health.geminiConfigured));

      // Fetch reports
      const reportsData = await fetchReports();
      setReports(reportsData.reports);

      // Fetch analytics
      const analyticsData = await fetchAnalytics();
      setAnalytics(analyticsData);
    } catch (err) {
      console.error('Failed to load initial data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentUser?.id, currentUser?.role]);

  const handleRoleSwitch = async (newRole: 'citizen' | 'admin') => {
    try {
      const updatedUser = await switchDemoRole(newRole);
      setCurrentUser(updatedUser);
      loadData();
    } catch (err) {
      console.error('Role switch failed:', err);
    }
  };

  const handleAuthSuccess = (user: User) => {
    setCurrentUser(user);
    loadData();
  };

  const handleSignOut = async () => {
    await signOut();
    setCurrentUser(null);
    setCurrentTab('landing');
    loadData();
  };

  const handleReportUpdated = (updated: CivicReport) => {
    setReports((prev) =>
      prev.map((r) => (r.id === updated.id ? updated : r))
    );
    setSelectedReport(updated);
    fetchAnalytics().then(setAnalytics).catch(() => {});
  };

  const handleOpenReportById = (reportId: string) => {
    const found = reports.find((r) => r.id === reportId);
    if (found) {
      setSelectedReport(found);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans antialiased selection:bg-blue-600 selection:text-white">
      {/* Top Navbar */}
      <Navbar
        currentUser={currentUser}
        onRoleSwitch={handleRoleSwitch}
        onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        geminiConfigured={geminiConfigured}
        onResetData={() => loadData()}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Persistent Responsive Sidebar */}
        <Sidebar
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
          currentUser={currentUser}
          onRoleSwitch={handleRoleSwitch}
          onSignOut={handleSignOut}
          onOpenAuthModal={() => setIsAuthModalOpen(true)}
          isOpenMobile={isMobileMenuOpen}
          onCloseMobile={() => setIsMobileMenuOpen(false)}
        />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {/* Hackathon Judge Guided Flow */}
          <JudgeDemoBanner
            currentRole={currentUser?.role || 'citizen'}
            onRoleSwitch={handleRoleSwitch}
            onNavigate={setCurrentTab}
            onOpenSampleModal={() => {
              const sample = reports.find((r) => r.id === 'CVL-2026-1038') || reports[0];
              if (sample) setSelectedReport(sample);
            }}
          />

          {loading && reports.length === 0 ? (
            <div className="flex items-center justify-center h-64 text-slate-400 text-xs">
              Initializing CivicLens AI platform...
            </div>
          ) : (
            <>
              {currentTab === 'landing' && (
                <LandingPage
                  onNavigate={setCurrentTab}
                  onRoleSwitch={handleRoleSwitch}
                  onOpenAuthModal={() => setIsAuthModalOpen(true)}
                  currentUser={currentUser}
                  reportsCount={reports.length}
                />
              )}

              {currentTab === 'overview' && (
                <OverviewPage
                  reports={reports}
                  currentUser={currentUser}
                  analytics={analytics}
                  onNavigate={setCurrentTab}
                  onOpenReportModal={setSelectedReport}
                  onRoleSwitch={handleRoleSwitch}
                />
              )}

              {currentTab === 'report' && (
                <ReportIssuePage
                  currentUser={currentUser}
                  onNavigate={setCurrentTab}
                  onOpenReportModal={setSelectedReport}
                  onOpenAuthModal={() => setIsAuthModalOpen(true)}
                />
              )}

              {currentTab === 'reports' && (
                <AllReportsPage
                  reports={reports}
                  currentUser={currentUser}
                  onOpenReportModal={setSelectedReport}
                  onNavigate={setCurrentTab}
                />
              )}

              {currentTab === 'insights' && (
                <AIInsightsPage
                  reports={reports}
                  onOpenReportModal={setSelectedReport}
                />
              )}

              {currentTab === 'analytics' && (
                <AnalyticsPage
                  analytics={analytics}
                  reports={reports}
                  onOpenReportModal={setSelectedReport}
                />
              )}

              {currentTab === 'admin' && (
                <AdministrationPage
                  reports={reports}
                  currentUser={currentUser}
                  onReportUpdated={handleReportUpdated}
                  onOpenReportModal={setSelectedReport}
                  onRoleSwitch={handleRoleSwitch}
                  onOpenAuthModal={() => setIsAuthModalOpen(true)}
                />
              )}

              {currentTab === 'settings' && (
                <SettingsPage
                  currentUser={currentUser}
                  geminiConfigured={geminiConfigured}
                  onRoleSwitch={handleRoleSwitch}
                  onRefreshData={() => loadData()}
                  reportsCount={reports.length}
                />
              )}
            </>
          )}
        </main>
      </div>

      {/* Report Details & AI Breakdown Modal */}
      {selectedReport && (
        <ReportDetailModal
          report={selectedReport}
          currentUser={currentUser}
          onClose={() => setSelectedReport(null)}
          onReportUpdated={handleReportUpdated}
          onOpenReport={handleOpenReportById}
        />
      )}

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
      />
    </div>
  );
}
