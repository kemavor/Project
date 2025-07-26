import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Course } from '../lib/api';
import { toast } from 'react-hot-toast';
import { SuccessNotification, ErrorNotification } from './NotificationCard';

interface CourseApplicationModalProps {
  course: Course | null;
  isOpen: boolean;
  onClose: () => void;
  onApply: (courseId: number, applicationData: {
    student_year: number;
    gpa: number;
    motivation_statement: string;
  }) => Promise<void>;
  applying: boolean;
}

export const CourseApplicationModal: React.FC<CourseApplicationModalProps> = ({
  course,
  isOpen,
  onClose,
  onApply,
  applying
}) => {
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
      await onApply(course.id, formData);
      toast.success('Application submitted successfully!');
      onClose();
      // Reset form
      setFormData({
        student_year: 1,
        gpa: 3.0,
        motivation_statement: ''
      });
    } catch (error) {
      console.error('Application error:', error);
      toast.error('Failed to submit application');
    }
  };

  if (!course) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Apply for {course.title}</DialogTitle>
          <DialogDescription>
            Please fill out the application form below. Your application will be reviewed by the course instructor.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Course Information */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Course Details</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600 dark:text-gray-400">Title:</span>
                <p className="font-medium text-gray-900 dark:text-white">{course.title}</p>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">Credits:</span>
                <p className="font-medium text-gray-900 dark:text-white">{course.credits}</p>
              </div>
              <div className="col-span-2">
                <span className="text-gray-600 dark:text-gray-400">Description:</span>
                <p className="font-medium text-gray-900 dark:text-white">{course.description}</p>
              </div>
            </div>
          </div>

          {/* Application Form */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="student_year">Current Year *</Label>
                <Input
                  id="student_year"
                  type="number"
                  min="1"
                  max="10"
                  value={formData.student_year}
                  onChange={(e) => setFormData({ ...formData, student_year: parseInt(e.target.value) })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="gpa">GPA *</Label>
                <Input
                  id="gpa"
                  type="number"
                  min="0.0"
                  max="4.0"
                  step="0.1"
                  value={formData.gpa}
                  onChange={(e) => setFormData({ ...formData, gpa: parseFloat(e.target.value) })}
                  required
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="motivation_statement">Motivation Statement *</Label>
              <Textarea
                id="motivation_statement"
                value={formData.motivation_statement}
                onChange={(e) => setFormData({ ...formData, motivation_statement: e.target.value })}
                placeholder="Please explain why you want to take this course and how it fits into your academic goals..."
                rows={6}
                required
              />
              <p className="text-sm text-gray-500 mt-1">
                This statement will help the instructor understand your interest in the course.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={applying}>
              Cancel
            </Button>
            <Button type="submit" disabled={applying}>
              {applying ? 'Submitting...' : 'Submit Application'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}; 