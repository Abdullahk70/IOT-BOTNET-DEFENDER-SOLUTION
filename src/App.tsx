import React, { useState, useEffect, lazy, Suspense } from "react";
import {
  motion,
  AnimatePresence,
  LazyMotion,
  domAnimation,
} from "framer-motion";
import "./App.css";
import Header from "./components/Header";
import Footer from "./components/Footer";
import LoadingSpinner from "./components/LoadingSpinner";
import AuthProvider, { useAuth } from "./contexts/AuthContext";
import AuthPage from "./components/Auth/AuthPage";

// Lazy loaded components with preloading hints
const HomePage = lazy(() => {
  // Add preload hint to improve perceived performance
  const link = document.createElement("link");
  link.rel = "prefetch";
  link.href = "/images/network-security.svg";
  document.head.appendChild(link);
  return import("./components/HomePage");
});

const UploadComponent = lazy(() => import("./components/UploadComponent"));
const ResultsComponent = lazy(() => import("./components/ResultsComponent"));

// FYP Project Components
const DataUpload = lazy(() => import("./components/FYP/DataUpload"));
const Normalization = lazy(() => import("./components/FYP/Normalization"));
const FeatureSelection = lazy(
  () => import("./components/FYP/FeatureSelection")
);
const Encoding = lazy(() => import("./components/FYP/Encoding"));
const OutlierDetection = lazy(
  () => import("./components/FYP/OutlierDetection")
);
const Visualization = lazy(() => import("./components/FYP/Visualization"));
const DataSplitting = lazy(() => import("./components/FYP/DataSplitting"));
const ExportData = lazy(() => import("./components/FYP/ExportData"));
const FeatureScaling = lazy(() => import("./components/FYP/FeatureScaling"));
const FAQ = lazy(() => import("./components/FYP/FAQ"));
const About = lazy(() => import("./components/About"));

enum View {
  HOME,
  UPLOAD,
  RESULTS,
  // FYP Views
  FYP_DATA_UPLOAD,
  FYP_NORMALIZATION,
  FYP_FEATURE_SELECTION,
  FYP_ENCODING,
  FYP_OUTLIER_DETECTION,
  FYP_VISUALIZATION,
  FYP_DATA_SPLITTING,
  FYP_EXPORT_DATA,
  FYP_FEATURE_SCALING,
  FYP_FAQ,
  ABOUT,
}

const AppContent: React.FC = () => {
  const { isAuthenticated, login, loading } = useAuth();
  const [currentView, setCurrentView] = useState<View>(View.HOME);
  const [processedFileName, setProcessedFileName] = useState<string | null>(
    null
  );
  const [isServerConnected, setIsServerConnected] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Simpler animation variants for better performance
  const pageVariants = {
    initial: { opacity: 0 },
    animate: {
      opacity: 1,
      transition: { duration: 0.3 },
    },
    exit: {
      opacity: 0,
      transition: { duration: 0.2 },
    },
  };

  // Loading screen animation
  const loadingVariants = {
    initial: { opacity: 0 },
    animate: {
      opacity: 1,
      transition: { duration: 0.3 },
    },
    exit: {
      opacity: 0,
      transition: { duration: 0.3 },
    },
  };

  // Server error banner animation
  const bannerVariants = {
    initial: { opacity: 0, y: -20 },
    animate: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.3 },
    },
    exit: {
      opacity: 0,
      y: -20,
      transition: { duration: 0.2 },
    },
  };

  useEffect(() => {
    // Faster initial load
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1200); // Reduced from 1800ms

    // Check server connection
    checkServerConnection();

    return () => clearTimeout(timer);
  }, []);

  const checkServerConnection = async () => {
    try {
      // Use Promise.race to set a timeout for the fetch request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);

      const response = await fetch("http://localhost:5000/api/health", {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      setIsServerConnected(response.ok);
    } catch (error) {
      try {
        // Try fallback URL with timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);

        const fallbackResponse = await fetch(
          "http://127.0.0.1:5000/api/health",
          {
            signal: controller.signal,
          }
        );
        clearTimeout(timeoutId);
        setIsServerConnected(fallbackResponse.ok);
      } catch (fallbackError) {
        setIsServerConnected(false);
        console.error("Server connection failed:", fallbackError);
      }
    }
  };

  const handleStartAnalysis = () => {
    setCurrentView(View.UPLOAD);
  };

  const handleFileProcessed = (fileName: string) => {
    setProcessedFileName(fileName);
    setCurrentView(View.RESULTS);
  };

  const handleReset = () => {
    setCurrentView(View.HOME);
    setProcessedFileName(null);
  };

  const handleFYPNavigation = (view: View) => {
    setCurrentView(view);
  };

  const handleAuthSuccess = (token: string, user: any) => {
    login(token, user);
  };

  if (loading || isLoading) {
    return (
      <motion.div
        className="loading-screen"
        key="loading"
        variants={loadingVariants}
        initial="initial"
        animate="animate"
        exit="exit"
      >
        <div className="loading-content">
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.4 }}
            className="loading-logo"
          >
            <div className="loading-icon-pulse">
              <div className="loading-icon-inner"></div>
            </div>
            <h1 className="loading-title">NetGuardian</h1>
          </motion.div>
          <LoadingSpinner size="lg" text="Loading application..." />
        </div>
      </motion.div>
    );
  }

  if (!isAuthenticated) {
    return <AuthPage onAuthSuccess={handleAuthSuccess} />;
  }

  return (
    // Use LazyMotion to improve initial load performance
    <LazyMotion features={domAnimation}>
      <AnimatePresence mode="wait">
        <div
          className="app-container"
          style={{
            backgroundColor: "var(--bg-main)",
            background: "var(--bg-main)",
            color: "var(--text-color)",
          }}
        >
          <Header
            onFYPNavigation={handleFYPNavigation}
            currentView={currentView}
            views={View}
          />

          <AnimatePresence>
            {!isServerConnected && (
              <motion.div
                className="server-error-banner"
                variants={bannerVariants}
                initial="initial"
                animate="animate"
                exit="exit"
              >
                <div className="container">
                  <div className="error-content">
                    <div className="error-icon">!</div>
                    <span>
                      Unable to connect to the server. Please make sure it's
                      running and try again.
                    </span>
                    <motion.button
                      className="retry-button"
                      onClick={checkServerConnection}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Retry
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <main className="main-content">
            <AnimatePresence mode="wait">
              {currentView === View.HOME && (
                <motion.div
                  key="home"
                  variants={pageVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                >
                  <Suspense
                    fallback={
                      <div className="page-loading">
                        <LoadingSpinner size="md" />
                      </div>
                    }
                  >
                    <HomePage onStartAnalysis={handleStartAnalysis} />
                  </Suspense>
                </motion.div>
              )}

              {currentView === View.UPLOAD && (
                <motion.div
                  key="upload"
                  variants={pageVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                >
                  <Suspense
                    fallback={
                      <div className="page-loading">
                        <LoadingSpinner size="md" />
                      </div>
                    }
                  >
                    <section className="page-section">
                      <div className="container">
                        <UploadComponent
                          onFileProcessed={handleFileProcessed}
                        />
                      </div>
                    </section>
                  </Suspense>
                </motion.div>
              )}

              {currentView === View.RESULTS && processedFileName && (
                <motion.div
                  key="results"
                  variants={pageVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                >
                  <Suspense
                    fallback={
                      <div className="page-loading">
                        <LoadingSpinner size="md" />
                      </div>
                    }
                  >
                    <section className="page-section">
                      <div className="container">
                        <ResultsComponent
                          filename={processedFileName}
                          onReset={handleReset}
                        />
                      </div>
                    </section>
                  </Suspense>
                </motion.div>
              )}

              {/* FYP Components */}
              {currentView === View.FYP_DATA_UPLOAD && (
                <motion.div
                  key="fyp-data-upload"
                  variants={pageVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                >
                  <Suspense
                    fallback={
                      <div className="page-loading">
                        <LoadingSpinner size="md" />
                      </div>
                    }
                  >
                    <section className="page-section">
                      <div className="container">
                        <DataUpload />
                      </div>
                    </section>
                  </Suspense>
                </motion.div>
              )}

              {currentView === View.FYP_NORMALIZATION && (
                <motion.div
                  key="fyp-normalization"
                  variants={pageVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                >
                  <Suspense
                    fallback={
                      <div className="page-loading">
                        <LoadingSpinner size="md" />
                      </div>
                    }
                  >
                    <section className="page-section">
                      <div className="container">
                        <Normalization />
                      </div>
                    </section>
                  </Suspense>
                </motion.div>
              )}

              {currentView === View.FYP_FEATURE_SELECTION && (
                <motion.div
                  key="fyp-feature-selection"
                  variants={pageVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                >
                  <Suspense
                    fallback={
                      <div className="page-loading">
                        <LoadingSpinner size="md" />
                      </div>
                    }
                  >
                    <section className="page-section">
                      <div className="container">
                        <FeatureSelection />
                      </div>
                    </section>
                  </Suspense>
                </motion.div>
              )}

              {currentView === View.FYP_ENCODING && (
                <motion.div
                  key="fyp-encoding"
                  variants={pageVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                >
                  <Suspense
                    fallback={
                      <div className="page-loading">
                        <LoadingSpinner size="md" />
                      </div>
                    }
                  >
                    <section className="page-section">
                      <div className="container">
                        <Encoding />
                      </div>
                    </section>
                  </Suspense>
                </motion.div>
              )}

              {currentView === View.FYP_OUTLIER_DETECTION && (
                <motion.div
                  key="fyp-outlier-detection"
                  variants={pageVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                >
                  <Suspense
                    fallback={
                      <div className="page-loading">
                        <LoadingSpinner size="md" />
                      </div>
                    }
                  >
                    <section className="page-section">
                      <div className="container">
                        <OutlierDetection />
                      </div>
                    </section>
                  </Suspense>
                </motion.div>
              )}

              {currentView === View.FYP_VISUALIZATION && (
                <motion.div
                  key="fyp-visualization"
                  variants={pageVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                >
                  <Suspense
                    fallback={
                      <div className="page-loading">
                        <LoadingSpinner size="md" />
                      </div>
                    }
                  >
                    <section className="page-section">
                      <div className="container">
                        <Visualization />
                      </div>
                    </section>
                  </Suspense>
                </motion.div>
              )}

              {currentView === View.FYP_DATA_SPLITTING && (
                <motion.div
                  key="fyp-data-splitting"
                  variants={pageVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                >
                  <Suspense
                    fallback={
                      <div className="page-loading">
                        <LoadingSpinner size="md" />
                      </div>
                    }
                  >
                    <section className="page-section">
                      <div className="container">
                        <DataSplitting />
                      </div>
                    </section>
                  </Suspense>
                </motion.div>
              )}

              {currentView === View.FYP_EXPORT_DATA && (
                <motion.div
                  key="fyp-export-data"
                  variants={pageVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                >
                  <Suspense
                    fallback={
                      <div className="page-loading">
                        <LoadingSpinner size="md" />
                      </div>
                    }
                  >
                    <section className="page-section">
                      <div className="container">
                        <ExportData />
                      </div>
                    </section>
                  </Suspense>
                </motion.div>
              )}

              {currentView === View.FYP_FEATURE_SCALING && (
                <motion.div
                  key="fyp-feature-scaling"
                  variants={pageVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                >
                  <Suspense
                    fallback={
                      <div className="page-loading">
                        <LoadingSpinner size="md" />
                      </div>
                    }
                  >
                    <section className="page-section">
                      <div className="container">
                        <FeatureScaling />
                      </div>
                    </section>
                  </Suspense>
                </motion.div>
              )}

              {currentView === View.FYP_FAQ && (
                <motion.div
                  key="fyp-faq"
                  variants={pageVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                >
                  <Suspense
                    fallback={
                      <div className="page-loading">
                        <LoadingSpinner size="md" />
                      </div>
                    }
                  >
                    <section className="page-section">
                      <div className="container">
                        <FAQ />
                      </div>
                    </section>
                  </Suspense>
                </motion.div>
              )}

              {currentView === View.ABOUT && (
                <motion.div
                  key="about"
                  variants={pageVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                >
                  <Suspense
                    fallback={
                      <div className="page-loading">
                        <LoadingSpinner size="md" />
                      </div>
                    }
                  >
                    <section className="page-section">
                      <div className="container">
                        <About />
                      </div>
                    </section>
                  </Suspense>
                </motion.div>
              )}
            </AnimatePresence>
          </main>

          <Footer />
        </div>
      </AnimatePresence>
    </LazyMotion>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
