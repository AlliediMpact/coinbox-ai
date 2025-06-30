'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import PageLoading from '@/components/PageLoading';
import { InlineLoading } from '@/components/PageLoading';
import SkeletonLoader, { SkeletonGroup, CardSkeleton, TableRowSkeleton } from '@/components/SkeletonLoader';
import ContentPlaceholder from '@/components/ContentPlaceholder';

/**
 * LoadingExamples Page Component
 * 
 * This page demonstrates the various loading states and components
 * available in the Allied iMpact Coin Box application.
 */
export default function LoadingExamples() {
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [isContentLoading, setIsContentLoading] = useState(true);
  const [selectedExample, setSelectedExample] = useState('pageLoading');
  const [progress, setProgress] = useState(0);
  
  // Simulate page loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsPageLoading(false);
    }, 3000); // Show page loading for 3 seconds
    
    return () => clearTimeout(timer);
  }, []);
  
  // Simulate content loading
  useEffect(() => {
    if (!isPageLoading) {
      const timer = setTimeout(() => {
        setIsContentLoading(false);
      }, 2000); // Show content loading for 2 seconds after page is loaded
      
      return () => clearTimeout(timer);
    }
  }, [isPageLoading]);
  
  // Simulate progress updates
  useEffect(() => {
    if (selectedExample === &apos;progressIndicator&apos;) {
      const interval = setInterval(() => {
        setProgress(prev => {
          const next = prev + 5;
          if (next >= 100) {
            clearInterval(interval);
            return 100;
          }
          return next;
        });
      }, 300);
      
      return () => clearInterval(interval);
    } else {
      setProgress(0);
    }
  }, [selectedExample]);
  
  // Show full page loading state if the page is loading
  if (isPageLoading) {
    return <PageLoading message="Loading examples gallery" showTips={true} />;
  }

  // Example selector buttons
  const ExampleButton = ({ id, label }: { id: string, label: string }) => (
    <button
      onClick={() => setSelectedExample(id)}
      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
        ${selectedExample === id 
          ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md'
          : &apos;bg-gray-100 text-gray-700 hover:bg-gray-200&apos;
        }`}
    >
      {label}
    </button>
  );
  
  // Reset button
  const handleReset = () => {
    setIsContentLoading(true);
    setTimeout(() => setIsContentLoading(false), 2000);
    
    if (selectedExample === &apos;progressIndicator&apos;) {
      setProgress(0);
    }
  };
  
  // Content to display based on selected example
  const renderExample = () => {
    if (isContentLoading) {
      return (
        <div className="p-8 border border-gray-200 rounded-lg">
          <ContentPlaceholder 
            type={
              selectedExample === 'skeletonLoaders' ? 'table' :
              selectedExample === 'contentPlaceholders' ? 'dashboard' :
              'card'
            }
            count={3}
          />
        </div>
      );
    }
    
    switch (selectedExample) {
      case &apos;pageLoading&apos;:
        return (
          <div className="space-y-8">
            <section className="p-6 border border-gray-200 rounded-lg">
              <h3 className="text-lg font-medium text-gray-900 mb-4">PageLoading Component</h3>
              <p className="text-gray-600 mb-6">
                The PageLoading component is used to display a full-page loading state. 
                It&apos;s typically used when navigating between pages or when a page requires significant initial data loading.
              </p>
              <div className="flex flex-col items-center p-10 border border-gray-100 rounded-lg bg-gray-50">
                <PageLoading showAfterDelay={false} />
              </div>
            </section>
            
            <section className="p-6 border border-gray-200 rounded-lg">
              <h3 className="text-lg font-medium text-gray-900 mb-4">InlineLoading Component</h3>
              <p className="text-gray-600 mb-6">
                The InlineLoading component is a smaller loading indicator used for inline loading states,
                such as when loading specific sections or performing actions within a page.
              </p>
              <div className="flex flex-wrap gap-6 p-6 border border-gray-100 rounded-lg bg-gray-50">
                <div className="flex items-center p-4 border border-gray-200 rounded-lg bg-white">
                  <InlineLoading message="Loading data" />
                </div>
                <div className="flex items-center p-4 border border-gray-200 rounded-lg bg-white">
                  <InlineLoading message="Processing payment" />
                </div>
                <div className="flex items-center p-4 border border-gray-200 rounded-lg bg-white">
                  <InlineLoading message="Updating balance" />
                </div>
              </div>
            </section>
          </div>
        );
        
      case &apos;skeletonLoaders&apos;:
        return (
          <div className="space-y-8">
            <section className="p-6 border border-gray-200 rounded-lg">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Skeleton Loaders</h3>
              <p className="text-gray-600 mb-6">
                Skeleton loaders provide visual placeholders for content that is still loading.
                They match the shape and size of the content to reduce layout shifts.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 border border-gray-100 rounded-lg bg-gray-50">
                <div className="space-y-3 p-4 border border-gray-200 rounded-lg bg-white">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Text Content</h4>
                  <SkeletonGroup>
                    <SkeletonLoader width="60%" height="1.5rem" className="mb-4" />
                    <SkeletonLoader width="100%" height="0.875rem" className="mb-2" />
                    <SkeletonLoader width="90%" height="0.875rem" className="mb-2" />
                    <SkeletonLoader width="80%" height="0.875rem" className="mb-2" />
                  </SkeletonGroup>
                </div>
                <div className="space-y-3 p-4 border border-gray-200 rounded-lg bg-white">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Table Rows</h4>
                  <SkeletonGroup>
                    <TableRowSkeleton />
                    <TableRowSkeleton />
                    <TableRowSkeleton />
                  </SkeletonGroup>
                </div>
              </div>
            </section>
            
            <section className="p-6 border border-gray-200 rounded-lg">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Complex Skeleton Components</h3>
              <p className="text-gray-600 mb-6">
                Pre-built complex skeleton components for common UI patterns provide
                consistent loading experiences throughout the application.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 border border-gray-100 rounded-lg bg-gray-50">
                <CardSkeleton className="bg-white" />
                <CardSkeleton className="bg-white" />
              </div>
            </section>
          </div>
        );
        
      case &apos;contentPlaceholders&apos;:
        return (
          <div className="space-y-8">
            <section className="p-6 border border-gray-200 rounded-lg">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Content Placeholder Components</h3>
              <p className="text-gray-600 mb-6">
                Content placeholders provide more sophisticated loading states for different types of content
                with staggered animations designed to match the app&apos;s visual style.
              </p>
              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Card Placeholders</h4>
                  <ContentPlaceholder type="card" count={2} />
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">List Placeholders</h4>
                  <ContentPlaceholder type="list" count={3} />
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Table Placeholder</h4>
                  <ContentPlaceholder type="table" count={3} />
                </div>
              </div>
            </section>
          </div>
        );
        
      case &apos;progressIndicator&apos;:
        return (
          <div className="space-y-8">
            <section className="p-6 border border-gray-200 rounded-lg">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Progress Indicators</h3>
              <p className="text-gray-600 mb-6">
                Progress indicators show the completion percentage of a task or process.
                They provide feedback to the user about how much of a task has been completed.
              </p>
              <div className="p-6 border border-gray-100 rounded-lg bg-gray-50">
                <div className="mb-8">
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-gray-600">Loading data...</span>
                    <span className="text-sm font-medium text-gray-700">{progress}%</span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full bg-gradient-to-r from-blue-500 to-purple-600"
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ ease: "easeOut" }}
                    />
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-gray-600">Processing files...</span>
                    <span className="text-sm font-medium text-gray-700">{Math.round(progress * 0.7)}%</span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div className="relative h-full">
                      <motion.div 
                        className="h-full bg-gradient-to-r from-blue-400 to-purple-500"
                        initial={{ width: 0 }}
                        animate={{ width: `${progress * 0.7}%` }}
                        transition={{ ease: "easeOut" }}
                      />
                      <motion.div
                        className="absolute top-0 left-0 h-full w-10 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                        animate={{
                          left: ['0%', '100%'],
                          transition: {
                            repeat: Infinity,
                            duration: 1.5,
                            ease: "easeInOut"
                          }
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        );
        
      default:
        return <div>Select an example to view</div>;
    }
  };
  
  return (
    <div className="container max-w-6xl mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Loading Components</h1>
          <p className="text-gray-600">
            A showcase of the various loading components and patterns used throughout the Allied iMpact Coin Box platform.
          </p>
        </header>
        
        <div className="mb-8">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <ExampleButton id="pageLoading" label="Page & Inline Loaders" />
            <ExampleButton id="skeletonLoaders" label="Skeleton Loaders" />
            <ExampleButton id="contentPlaceholders" label="Content Placeholders" />
            <ExampleButton id="progressIndicator" label="Progress Indicators" />
            
            <div className="ml-auto">
              <button
                onClick={handleReset}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors duration-200"
              >
                Reset Example
              </button>
            </div>
          </div>
        </div>
        
        {renderExample()}
      </motion.div>
    </div>
  );
}
