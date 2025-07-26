/**
 * Advanced Search Utilities for VisionWare
 * Implements efficient search algorithms for various data types
 */

export interface SearchOptions {
  caseSensitive?: boolean;
  fuzzy?: boolean;
  threshold?: number; // For fuzzy search (0-1)
  searchFields?: string[];
  sortBy?: 'relevance' | 'name' | 'date' | 'type';
  limit?: number;
}

export interface SearchResult<T> {
  item: T;
  score: number;
  matchedFields: string[];
  highlights: { field: string; value: string; positions: number[] }[];
}

/**
 * Efficient text search with multiple algorithms
 */
export class AdvancedSearch {
  private static readonly DEFAULT_OPTIONS: SearchOptions = {
    caseSensitive: false,
    fuzzy: false,
    threshold: 0.8,
    sortBy: 'relevance',
    limit: 100
  };

  /**
   * Main search function that combines multiple search strategies
   */
  static search<T>(
    items: T[],
    query: string,
    options: SearchOptions = {}
  ): SearchResult<T>[] {
    if (!query.trim()) return items.map(item => ({
      item,
      score: 1,
      matchedFields: [],
      highlights: []
    }));

    const opts = { ...this.DEFAULT_OPTIONS, ...options };
    const normalizedQuery = opts.caseSensitive ? query : query.toLowerCase();
    const results: SearchResult<T>[] = [];

    for (const item of items) {
      const result = this.searchItem(item, normalizedQuery, opts);
      if (result.score > 0) {
        results.push(result);
      }
    }

    // Sort by relevance score
    results.sort((a, b) => b.score - a.score);

    // Apply limit
    if (opts.limit) {
      results.splice(opts.limit);
    }

    return results;
  }

  /**
   * Search a single item using multiple strategies
   */
  private static searchItem<T>(
    item: T,
    query: string,
    options: SearchOptions
  ): SearchResult<T> {
    let totalScore = 0;
    const matchedFields: string[] = [];
    const highlights: { field: string; value: string; positions: number[] }[] = [];

    // Get searchable fields
    const searchFields = options.searchFields || this.getSearchableFields(item);

    for (const field of searchFields) {
      const fieldValue = this.getFieldValue(item, field);
      if (!fieldValue) continue;

      const fieldScore = this.calculateFieldScore(
        fieldValue,
        query,
        options,
        field
      );

      if (fieldScore.score > 0) {
        totalScore += fieldScore.score;
        matchedFields.push(field);
        highlights.push({
          field,
          value: fieldValue,
          positions: fieldScore.positions || []
        });
      }
    }

    return {
      item,
      score: totalScore,
      matchedFields,
      highlights
    };
  }

  /**
   * Calculate score for a specific field
   */
  private static calculateFieldScore(
    value: string,
    query: string,
    options: SearchOptions,
    field: string
  ): { score: number; positions?: number[] } {
    const normalizedValue = options.caseSensitive ? value : value.toLowerCase();
    const queryWords = query.split(/\s+/).filter(word => word.length > 0);

    let totalScore = 0;
    const positions: number[] = [];

    for (const word of queryWords) {
      // Exact match (highest priority)
      if (normalizedValue.includes(word)) {
        const wordScore = this.calculateWordScore(word, normalizedValue, field);
        totalScore += wordScore.score;
        positions.push(...wordScore.positions);
      }
      // Fuzzy match (if enabled)
      else if (options.fuzzy) {
        const fuzzyScore = this.fuzzyMatch(word, normalizedValue, options.threshold!);
        if (fuzzyScore > 0) {
          totalScore += fuzzyScore * 0.5; // Lower weight for fuzzy matches
        }
      }
    }

    return { score: totalScore, positions };
  }

  /**
   * Calculate score for exact word matches
   */
  private static calculateWordScore(
    word: string,
    text: string,
    field: string
  ): { score: number; positions: number[] } {
    const positions: number[] = [];
    let score = 0;
    let index = 0;

    while ((index = text.indexOf(word, index)) !== -1) {
      positions.push(index);
      
      // Higher score for word boundaries
      const isWordBoundary = this.isWordBoundary(text, index, word.length);
      const fieldMultiplier = this.getFieldMultiplier(field);
      
      score += (isWordBoundary ? 2 : 1) * fieldMultiplier;
      index += word.length;
    }

    return { score, positions };
  }

  /**
   * Check if match is at word boundary
   */
  private static isWordBoundary(text: string, start: number, length: number): boolean {
    const before = start > 0 ? text[start - 1] : ' ';
    const after = start + length < text.length ? text[start + length] : ' ';
    return !/[a-zA-Z0-9]/.test(before) && !/[a-zA-Z0-9]/.test(after);
  }

  /**
   * Get field-specific score multiplier
   */
  private static getFieldMultiplier(field: string): number {
    const multipliers: Record<string, number> = {
      title: 3,
      name: 3,
      course_name: 3,
      description: 2,
      course_description: 2,
      instructor: 2,
      first_name: 2,
      last_name: 2,
      email: 1,
      type: 1,
      status: 1
    };
    return multipliers[field] || 1;
  }

  /**
   * Fuzzy string matching using Levenshtein distance
   */
  private static fuzzyMatch(query: string, text: string, threshold: number): number {
    const distance = this.levenshteinDistance(query, text);
    const maxLength = Math.max(query.length, text.length);
    const similarity = 1 - (distance / maxLength);
    return similarity >= threshold ? similarity : 0;
  }

  /**
   * Calculate Levenshtein distance between two strings
   */
  private static levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));

    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;

    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1, // deletion
          matrix[j - 1][i] + 1, // insertion
          matrix[j - 1][i - 1] + indicator // substitution
        );
      }
    }

    return matrix[str2.length][str1.length];
  }

  /**
   * Get searchable fields from an object
   */
  private static getSearchableFields(item: any): string[] {
    const fields: string[] = [];
    for (const key in item) {
      if (typeof item[key] === 'string' || typeof item[key] === 'number') {
        fields.push(key);
      }
    }
    return fields;
  }

  /**
   * Get field value safely
   */
  private static getFieldValue(item: any, field: string): string {
    const value = item[field];
    if (value === null || value === undefined) return '';
    return String(value);
  }
}

/**
 * Course-specific search utilities
 */
export class CourseSearch {
  /**
   * Search courses with course-specific logic
   */
  static searchCourses(courses: any[], query: string, options: SearchOptions = {}): any[] {
    const searchOptions: SearchOptions = {
      ...options,
      searchFields: [
        'title',
        'course_name',
        'description',
        'course_description',
        'instructor',
        'prerequisites'
      ],
      sortBy: 'relevance'
    };

    const results = AdvancedSearch.search(courses, query, searchOptions);
    return results.map(result => result.item);
  }

  /**
   * Filter courses by year
   */
  static filterByYear(courses: any[], year: number | null): any[] {
    if (year === null) return courses;
    return courses.filter(course => course.year === year);
  }

  /**
   * Filter courses by enrollment status
   */
  static filterByEnrollmentStatus(courses: any[], isOpen: boolean | null): any[] {
    if (isOpen === null) return courses;
    return courses.filter(course => course.is_enrollment_open === isOpen);
  }

  /**
   * Filter courses by instructor
   */
  static filterByInstructor(courses: any[], instructorId: number | null): any[] {
    if (instructorId === null) return courses;
    return courses.filter(course => course.instructor_id === instructorId);
  }
}

/**
 * Document-specific search utilities
 */
export class DocumentSearch {
  /**
   * Search documents with document-specific logic
   */
  static searchDocuments(documents: any[], query: string, options: SearchOptions = {}): any[] {
    const searchOptions: SearchOptions = {
      ...options,
      searchFields: [
        'title',
        'original_filename',
        'filename',
        'description',
        'file_type',
        'uploader'
      ],
      sortBy: 'relevance'
    };

    const results = AdvancedSearch.search(documents, query, searchOptions);
    return results.map(result => result.item);
  }

  /**
   * Filter documents by file type
   */
  static filterByFileType(documents: any[], fileType: string | null): any[] {
    if (!fileType) return documents;
    return documents.filter(doc => doc.file_type === fileType);
  }

  /**
   * Filter documents by uploader
   */
  static filterByUploader(documents: any[], uploaderId: number | null): any[] {
    if (uploaderId === null) return documents;
    return documents.filter(doc => doc.uploader_id === uploaderId);
  }
}

/**
 * Stream-specific search utilities
 */
export class StreamSearch {
  /**
   * Search streams with stream-specific logic
   */
  static searchStreams(streams: any[], query: string, options: SearchOptions = {}): any[] {
    const searchOptions: SearchOptions = {
      ...options,
      searchFields: [
        'title',
        'description',
        'instructor.first_name',
        'instructor.last_name',
        'instructor.email',
        'status'
      ],
      sortBy: 'relevance'
    };

    const results = AdvancedSearch.search(streams, query, searchOptions);
    return results.map(result => result.item);
  }

  /**
   * Filter streams by status
   */
  static filterByStatus(streams: any[], status: string | null): any[] {
    if (!status) return streams;
    return streams.filter(stream => stream.status === status);
  }

  /**
   * Filter streams by instructor
   */
  static filterByInstructor(streams: any[], instructorId: number | null): any[] {
    if (instructorId === null) return streams;
    return streams.filter(stream => stream.instructor_id === instructorId);
  }
}

/**
 * Application-specific search utilities
 */
export class ApplicationSearch {
  /**
   * Search applications with application-specific logic
   */
  static searchApplications(applications: any[], query: string, options: SearchOptions = {}): any[] {
    const searchOptions: SearchOptions = {
      ...options,
      searchFields: [
        'student.first_name',
        'student.last_name',
        'student.email',
        'course.title',
        'course.description',
        'status',
        'motivation_statement'
      ],
      sortBy: 'relevance'
    };

    const results = AdvancedSearch.search(applications, query, searchOptions);
    return results.map(result => result.item);
  }

  /**
   * Filter applications by status
   */
  static filterByStatus(applications: any[], status: string | null): any[] {
    if (!status) return applications;
    return applications.filter(app => app.status === status);
  }

  /**
   * Filter applications by course
   */
  static filterByCourse(applications: any[], courseId: number | null): any[] {
    if (courseId === null) return applications;
    return applications.filter(app => app.course_id === courseId);
  }
}

/**
 * Utility functions for common search operations
 */
export const SearchUtils = {
  /**
   * Debounce search input to improve performance
   */
  debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  },

  /**
   * Highlight search terms in text
   */
  highlightText(text: string, query: string, className: string = 'bg-yellow-200'): string {
    if (!query.trim()) return text;
    
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return text.replace(regex, `<mark class="${className}">$1</mark>`);
  },

  /**
   * Get search suggestions based on common terms
   */
  getSuggestions(items: any[], query: string, maxSuggestions: number = 5): string[] {
    if (!query.trim()) return [];
    
    const suggestions = new Set<string>();
    const normalizedQuery = query.toLowerCase();
    
    for (const item of items) {
      for (const field of ['title', 'name', 'description']) {
        const value = item[field];
        if (typeof value === 'string' && value.toLowerCase().includes(normalizedQuery)) {
          const words = value.split(/\s+/);
          for (const word of words) {
            if (word.toLowerCase().includes(normalizedQuery) && word.length > 2) {
              suggestions.add(word);
              if (suggestions.size >= maxSuggestions) break;
            }
          }
        }
      }
      if (suggestions.size >= maxSuggestions) break;
    }
    
    return Array.from(suggestions);
  }
}; 