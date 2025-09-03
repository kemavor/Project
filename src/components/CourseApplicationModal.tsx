import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Course } from '../lib/api';
import { toast } from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { User, GraduationCap, BookOpen, Star, Send } from 'lucide-react';

interface CourseApplicationModalProps {
  course: Course | null;
  onClose: () => void;
  onSubmit: (courseId: number, applicationData: {
    student_year: number;
    gpa: number;
    motivation_statement: string;
  }) => Promise<void>;
  applying: boolean;
}

export const CourseApplicationModal: React.FC<CourseApplicationModalProps> = ({
  course,
  onClose,
  onSubmit,
  applying
}) => {
  const { user } = useAuth();
  
  const [formData, setFormData] = useState({
    student_year: 1,
    gpa: 3.0,
    motivation_statement: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!course) return;
    
    if (!formData.motivation_statement.trim()) {
      toast.error('Please provide a motivation statement');
      return;
    }
    
    try {
      await onSubmit(course.id, formData);
      // Don't show toast here, let the parent component handle it
      onClose();
      // Reset form
      setFormData({
        student_year: 1,
        gpa: 3.0,
        motivation_statement: ''
      });
    } catch (error) {
      console.error('Application error:', error);
      // Don't show toast here, let the parent component handle it
    }
  };

  if (!course) return null;

  return (
    <Dialog open={!!course} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Apply for {course.title}</DialogTitle>
          <DialogDescription>
            Please fill out the application form below. Your application will be reviewed by the course instructor.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Student Information Preview */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
              <User className="w-5 h-5" />
              Student Information
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-blue-700 font-medium">Name:</span>
                <p className="text-blue-900">{user?.first_name} {user?.last_name}</p>
              </div>
              <div>
                <span className="text-blue-700 font-medium">Email:</span>
                <p className="text-blue-900">{user?.email}</p>
              </div>
              <div>
                <span className="text-blue-700 font-medium">Username:</span>
                <p className="text-blue-900">{user?.username}</p>
              </div>
              <div>
                <span className="text-blue-700 font-medium">Role:</span>
                <p className="text-blue-900 capitalize">{user?.role}</p>
              </div>
            </div>
            <p className="text-xs text-blue-600 mt-2">
              This information will be sent to the instructor along with your application
            </p>
          </div>

          {/* Course Information */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-green-600" />
              Course Details
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Title:</span>
                <p className="font-medium text-gray-900">{course.title}</p>
              </div>
              <div>
                <span className="text-gray-600">Credits:</span>
                <p className="font-medium text-gray-900">{course.credits}</p>
              </div>
              <div className="col-span-2">
                <span className="text-gray-600">Description:</span>
                <p className="font-medium text-gray-900">{course.description}</p>
              </div>
            </div>
          </div>

          {/* Application Form */}
          <div className="space-y-4 bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-purple-600" />
              Academic Information
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="student_year" className="text-gray-700 font-medium">Current Academic Year *</Label>
                <Input
                  id="student_year"
                  type="number"
                  min="1"
                  max="10"
                  value={formData.student_year}
                  onChange={(e) => setFormData({ ...formData, student_year: parseInt(e.target.value) })}
                  className="border-gray-300 focus:border-purple-500"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Your current year of study</p>
              </div>
              <div>
                <Label htmlFor="gpa" className="text-gray-700 font-medium">Current GPA *</Label>
                <Input
                  id="gpa"
                  type="number"
                  min="0.0"
                  max="4.0"
                  step="0.1"
                  value={formData.gpa}
                  onChange={(e) => setFormData({ ...formData, gpa: parseFloat(e.target.value) })}
                  className="border-gray-300 focus:border-purple-500"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Scale: 0.0 - 4.0</p>
              </div>
            </div>
            
            <div>
              <Label htmlFor="motivation_statement" className="text-gray-700 font-medium">
                Statement of Purpose *
              </Label>
              <Textarea
                id="motivation_statement"
                value={formData.motivation_statement}
                onChange={(e) => setFormData({ ...formData, motivation_statement: e.target.value })}
                placeholder="Please explain:
• Why you are interested in this course
• How it fits into your academic and career goals
• Any relevant background experience
• What you hope to achieve by taking this course..."
                rows={6}
                className="border-gray-300 focus:border-purple-500"
                required
              />
              <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                <Star className="w-3 h-3 text-yellow-500" />
                This statement is crucial for the instructor's decision. Be specific and thoughtful.
              </p>
            </div>
          </div>

          <DialogFooter className="gap-3">
            <Button type="button" variant="outline" onClick={onClose} disabled={applying} className="px-6">
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={applying || !formData.motivation_statement.trim()}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 disabled:opacity-50"
            >
              {applying ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Submitting Application...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Submit Application
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}; 