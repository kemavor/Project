import React, { useState, useEffect, useMemo } from 'react';
import { useCourses, Course } from '../hooks/useCourses';
import { EnhancedCourseCard } from '../components/EnhancedCourseCard';
import { CourseCardSkeleton } from '../components/EnhancedSkeleton';
import { SecureDocumentViewer } from '../components/SecureDocumentViewer';
import { CourseApplicationModal } from '../components/CourseApplicationModal';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, Filter, BookOpen, GraduationCap, Shield, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Layout } from '../components/Layout';
import { apiClient } from '../lib/api';
import { toast } from 'react-hot-toast';
import { CourseSearch, SearchUtils } from '../lib/searchUtils';

const CourseSelection: React.FC = () => {
  const { user } = useAuth();
  const {
    courses,
    loading,
    error,
    coursesByYear,
    fetchCoursesByYear,
  } = useCourses();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [showSecureViewer, setShowSecureViewer] = useState(false);
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const [applying, setApplying] = useState(false);
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    fetchCoursesByYear();
  }, []);

  // Debounced search suggestions
  const debouncedSearchSuggestions = useMemo(
    () => SearchUtils.debounce((query: string) => {
      if (query.length >= 2) {
        const suggestions = SearchUtils.getSuggestions(courses, query, 5);
        setSearchSuggestions(suggestions);
        setShowSuggestions(true);
      } else {
        setSearchSuggestions([]);
        setShowSuggestions(false);
      }
    }, 300),
    [courses]
  );

  // Update suggestions when search term changes
  useEffect(() => {
    debouncedSearchSuggestions(searchTerm);
  }, [searchTerm, debouncedSearchSuggestions]);

  // Efficient filtered courses using memoization
  const filteredCourses = useMemo(() => {
    let filtered = courses;

    // Apply search filter
    if (searchTerm.trim()) {
      filtered = CourseSearch.searchCourses(filtered, searchTerm, {
        fuzzy: true,
        threshold: 0.7,
        sortBy: 'relevance'
      });
    }

    // Apply year filter
    if (selectedYear !== null) {
      filtered = CourseSearch.filterByYear(filtered, selectedYear);
    }

    return filtered;
  }, [courses, searchTerm, selectedYear]);

  // Efficient filtered courses by year
  const filteredCoursesByYear = useMemo(() => {
    const result: Record<number, Course[]> = {};
    
    for (const [year, yearCourses] of Object.entries(coursesByYear)) {
      const yearNum = parseInt(year);
      let filtered = yearCourses as Course[];

      // Apply search filter
      if (searchTerm.trim()) {
        filtered = CourseSearch.searchCourses(filtered, searchTerm, {
          fuzzy: true,
          threshold: 0.7,
          sortBy: 'relevance'
        });
      }

      // Apply year filter
      if (selectedYear !== null && yearNum !== selectedYear) {
        continue;
      }

      if (filtered.length > 0) {
        result[yearNum] = filtered;
      }
    }

    return result;
  }, [coursesByYear, searchTerm, selectedYear]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Search is now handled by the filtered courses
    setShowSuggestions(false);
  };

  const handleYearFilter = (year: number | null) => {
    setSelectedYear(year);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setSearchTerm(suggestion);
    setShowSuggestions(false);
  };

  const clearSearch = () => {
    setSearchTerm('');
    setSelectedYear(null);
    setShowSuggestions(false);
  };

  const handleCourseSelect = (course: Course) => {
    setSelectedCourse(course);
    setShowApplicationModal(true);
  };

  const handleApplyForCourse = async (courseId: number, applicationData: {
    student_year: number;
    gpa: number;
    motivation_statement: string;
  }) => {
    try {
      setApplying(true);
      const response = await apiClient.applyForCourse(courseId, applicationData);
      
      if (response.error) {
        toast.error(response.error);
      } else {
        toast.success('Application submitted successfully!');
        setShowApplicationModal(false);
        setSelectedCourse(null);
      }
    } catch (error) {
      console.error('Application error:', error);
      toast.error('Failed to submit application');
    } finally {
      setApplying(false);
    }
  };

  const handleViewDocument = (course: Course) => {
    // Check if course has secure access
    if (course.cloudfront_signed_url) {
      setSelectedCourse(course);
      setShowSecureViewer(true);
    } else if (course.display_url) {
      // Fallback to regular URL
      window.open(course.display_url, '_blank');
    }
  };

  const years = [1, 2, 3, 4];

  if (loading) {
    return (
      <Layout>
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-blue-500 rounded-2xl">
                <BookOpen className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground mb-1">Course Selection</h1>
                <p className="text-muted-foreground text-lg">
                  Browse and apply for available courses
                </p>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <CourseCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="p-6 space-y-6">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={fetchCoursesByYear}>Try Again</Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-blue-500 rounded-2xl">
              <BookOpen className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-1">Course Selection</h1>
              <p className="text-muted-foreground text-lg">
                Browse and apply for available courses
              </p>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Search & Filter
            </CardTitle>
            <CardDescription>Find courses that match your interests and requirements</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Search Bar */}
            <form onSubmit={handleSearch} className="relative">
              <div className="flex gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Search courses by name, description, or instructor..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-10"
                    onFocus={() => setShowSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  />
                  {searchTerm && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                      onClick={clearSearch}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <Button type="submit">
                  Search
                </Button>
              </div>

              {/* Search Suggestions */}
              {showSuggestions && searchSuggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-50">
                  {searchSuggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      type="button"
                      className="w-full px-4 py-2 text-left hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                      onClick={() => handleSuggestionClick(suggestion)}
                    >
                      <Search className="inline h-3 w-3 mr-2 text-gray-400" />
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}
            </form>

            {/* Year Filters */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Filter className="h-4 w-4" />
                Filter by Year:
              </div>
              <div className="flex gap-2">
                <Button
                  variant={selectedYear === null ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleYearFilter(null)}
                >
                  All Years
                </Button>
                {years.map((year) => (
                  <Button
                    key={year}
                    variant={selectedYear === year ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleYearFilter(year)}
                  >
                    Year {year}
                  </Button>
                ))}
              </div>
            </div>

            {/* Active Filters Display */}
            {(searchTerm || selectedYear !== null) && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm text-muted-foreground">Active filters:</span>
                {searchTerm && (
                  <Badge variant="secondary" className="gap-1">
                    Search: "{searchTerm}"
                    <button
                      onClick={() => setSearchTerm('')}
                      className="ml-1 hover:text-red-500"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                {selectedYear !== null && (
                  <Badge variant="secondary" className="gap-1">
                    Year: {selectedYear}
                    <button
                      onClick={() => setSelectedYear(null)}
                      className="ml-1 hover:text-red-500"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearSearch}
                  className="text-xs"
                >
                  Clear All
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Course Display Section */}
        {searchTerm ? (
          // Search Results
          <Card>
            <CardHeader>
              <CardTitle>Search Results for "{searchTerm}"</CardTitle>
              <CardDescription>
                Found {filteredCourses.length} course{filteredCourses.length !== 1 ? 's' : ''} matching your search
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredCourses.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                  {filteredCourses.map((course) => (
                    <EnhancedCourseCard
                      key={course.id}
                      course={course}
                      onApply={async (course) => await handleCourseSelect(course)}
                      applying={null}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No courses found</h3>
                  <p className="text-muted-foreground mb-4">
                    Try adjusting your search terms or browse all courses below.
                  </p>
                  <Button onClick={clearSearch} variant="outline">
                    Clear Search
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          // Courses by Year
          <Card>
            <CardHeader>
              <CardTitle>Available Courses</CardTitle>
              <CardDescription>Browse courses by academic year</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="all" className="w-full">
                <TabsList className="grid w-full grid-cols-5">
                  <TabsTrigger value="all">All Years</TabsTrigger>
                  {years.map((year) => (
                    <TabsTrigger key={year} value={`year-${year}`}>
                      Year {year}
                    </TabsTrigger>
                  ))}
                </TabsList>

                <TabsContent value="all" className="mt-6">
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold mb-2">All Available Courses</h3>
                    <p className="text-muted-foreground">Browse all courses across different academic years</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    {Object.entries(filteredCoursesByYear).map(([year, yearCourses]) =>
                      (yearCourses as Course[]).map((course: Course) => (
                        <EnhancedCourseCard
                          key={course.id}
                          course={course}
                          onApply={async (course) => await handleCourseSelect(course)}
                          applying={null}
                        />
                      ))
                    )}
                  </div>
                  {Object.keys(filteredCoursesByYear).length === 0 && (
                    <div className="text-center py-12">
                      <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No courses available</h3>
                      <p className="text-muted-foreground">Courses will appear here once they are added to the system.</p>
                    </div>
                  )}
                </TabsContent>

                {years.map((year) => (
                  <TabsContent key={year} value={`year-${year}`} className="mt-6">
                    <div className="mb-4">
                      <h3 className="text-lg font-semibold mb-2">Year {year} Courses</h3>
                      <p className="text-muted-foreground">Courses available for Year {year} students</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                      {(filteredCoursesByYear[year] as Course[] || []).map((course: Course) => (
                        <EnhancedCourseCard
                          key={course.id}
                          course={course}
                          onApply={async (course) => await handleCourseSelect(course)}
                          applying={null}
                        />
                      ))}
                    </div>
                    {(!filteredCoursesByYear[year] || (filteredCoursesByYear[year] as Course[]).length === 0) && (
                      <div className="text-center py-12">
                        <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No Year {year} courses available</h3>
                        <p className="text-muted-foreground">Check back later for new courses.</p>
                      </div>
                    )}
                  </TabsContent>
                ))}
              </Tabs>
            </CardContent>
          </Card>
        )}

        {/* Modals */}
        {showApplicationModal && selectedCourse && (
          <CourseApplicationModal
            course={selectedCourse}
            onClose={() => {
              setShowApplicationModal(false);
              setSelectedCourse(null);
            }}
            onSubmit={handleApplyForCourse}
            applying={applying}
          />
        )}

        {showSecureViewer && selectedCourse && (
          <SecureDocumentViewer
            course={selectedCourse}
            onClose={() => {
              setShowSecureViewer(false);
              setSelectedCourse(null);
            }}
          />
        )}
      </div>
    </Layout>
  );
};

export default CourseSelection; 