import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "./ui/dialog"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Textarea } from "./ui/textarea"
import { Label } from "./ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { createLecture } from "@/lib/api"
import { toast } from "react-hot-toast"
import { handleApiError } from "@/lib/utils"
import { useAuth } from "@/contexts/AuthContext"
import { Alert, AlertDescription } from "./ui/alert"
import { AlertCircle } from "lucide-react"
import { useCourses } from "@/hooks/useCourses"
import { BookOpen } from "lucide-react"
import { Badge } from "./ui/badge"
import { User } from "lucide-react"
import { fetchTeachers } from '@/lib/api';

interface CreateLectureModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (createdLecture?: any) => void
}

export function CreateLectureModal({ isOpen, onClose, onSuccess }: CreateLectureModalProps) {
  const { user, hasRole } = useAuth();
  const { courses, loading: isLoadingCourses, error: errorCourses } = useCourses();
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    instructor: "",
    duration: 60,
    date: new Date().toISOString().split('T')[0],
    status: "scheduled" as const,
    course_id: ""
  })
  const [teachers, setTeachers] = useState<any[]>([]);
  const [isLoadingTeachers, setIsLoadingTeachers] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsLoadingTeachers(true);
      fetchTeachers().then((response) => {
        if (response.data && Array.isArray(response.data)) {
          setTeachers(response.data);
        }
      }).finally(() => setIsLoadingTeachers(false));
    }
  }, [isOpen]);

  // Check if user can create lectures
  const canCreateLectures = hasRole('teacher') || hasRole('admin') || hasRole('super_admin') || hasRole('dept_head');

  // If user can't create lectures, show error and close modal
  if (isOpen && !canCreateLectures) {
    toast.error("You don't have permission to create lectures");
    onClose();
    return null;
  }

  // Filter courses for teachers
  const filteredCourses = user && user.role && typeof user.role === 'object' && user.role.role_type === 'teacher'
    ? (courses || []).filter((course: any) => course.teacher_id === user.id)
    : (courses || []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validation
    if (!formData.title.trim()) {
      toast.error("Please enter a lecture title")
      return
    }
    if (!formData.description.trim()) {
      toast.error("Please enter a lecture description")
      return
    }
    if (!formData.instructor.trim()) {
      toast.error("Please enter an instructor name")
      return
    }
    if (formData.duration < 1) {
      toast.error("Duration must be at least 1 minute")
      return
    }
    if (!formData.course_id) {
      toast.error("Please select a course")
      return
    }

    try {
      setIsSubmitting(true)
      const created = await createLecture({
        title: formData.title.trim(),
        description: formData.description.trim(),
        instructor: formData.instructor.trim(),
        duration: formData.duration,
        date: formData.date,
        status: formData.status,
        is_live: false,
        viewer_count: 0,
        course_id: parseInt(formData.course_id)
      })
      toast.success("Lecture created successfully!")
      onSuccess(created)
      onClose()
      // Reset form
      setFormData({
        title: "",
        description: "",
        instructor: "",
        duration: 60,
        date: new Date().toISOString().split('T')[0],
        status: "scheduled",
        course_id: ""
      })
    } catch (error: any) {
      // Handle specific permission errors
      if (error.response?.status === 403) {
        toast.error("You don't have permission to create lectures. Only teachers and administrators can create lectures.")
      } else {
        toast.error(handleApiError(error))
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Lecture</DialogTitle>
          {user && (
            <p className="text-sm text-gray-600">
              Creating lecture as: <span className="font-medium">{user.first_name} {user.last_name}</span>
            </p>
          )}
        </DialogHeader>
        
        {!canCreateLectures && (
          <Alert className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              You don't have permission to create lectures. Only teachers and administrators can create new lectures.
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Enter lecture title"
              required
              maxLength={255}
              disabled={!canCreateLectures}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="instructor">Instructor *</Label>
            <Select
              value={formData.instructor}
              onValueChange={value => setFormData(prev => ({ ...prev, instructor: value }))}
              disabled={isLoadingTeachers || !canCreateLectures}
            >
              <SelectTrigger>
                <SelectValue placeholder={isLoadingTeachers ? "Loading instructors..." : "Select an instructor"} />
              </SelectTrigger>
              <SelectContent>
                {teachers.map((teacher: any) => (
                  <SelectItem
                    key={teacher.id || teacher.user_id || teacher.email}
                    value={teacher.first_name + ' ' + teacher.last_name}
                  >
                    {teacher.first_name} {teacher.last_name} ({teacher.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Enter lecture description"
              required
              rows={4}
              disabled={!canCreateLectures}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="course">Course *</Label>
            <Select
              value={formData.course_id}
              onValueChange={value => setFormData(prev => ({ ...prev, course_id: value }))}
              disabled={isLoadingCourses || !canCreateLectures}
            >
              <SelectTrigger>
                <SelectValue placeholder={isLoadingCourses ? "Loading courses..." : "Select a course"} />
              </SelectTrigger>
              <SelectContent>
                {filteredCourses.map((course: any) => (
                  <SelectItem key={course.course_id} value={String(course.course_id)}>
                    {course.course_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {formData.course_id && (
            <div className="mt-2">
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 flex items-start gap-4 shadow-sm max-h-40 overflow-y-auto">
                <div className="flex-shrink-0 flex items-center justify-center h-10 w-10 rounded-full bg-blue-100">
                  <BookOpen className="h-6 w-6 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-blue-900 text-lg">
                      {(() => {
                        const course = filteredCourses.find((c: any) => String(c.id) === formData.course_id);
                        return course?.course_name || course?.title;
                      })()}
                    </span>
                    <Badge variant="outline" className="ml-2">ID: {formData.course_id}</Badge>
                  </div>
                  <div className="text-gray-700 mb-1">
                    {(() => {
                      const course = filteredCourses.find((c: any) => String(c.id) === formData.course_id);
                      const description = course?.course_description || course?.description;
                      return description || <span className="italic text-gray-400">No description</span>;
                    })()}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                    <User className="h-4 w-4" />
                    Teacher ID: {(() => {
                      const course = filteredCourses.find((c: any) => String(c.id) === formData.course_id);
                      return course?.teacher_id || course?.instructor_id;
                    })()}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Date *</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                required
                min={new Date().toISOString().split('T')[0]}
                disabled={!canCreateLectures}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="duration">Duration (minutes) *</Label>
              <Input
                id="duration"
                type="number"
                min="1"
                max="480"
                value={formData.duration}
                onChange={(e) => setFormData(prev => ({ ...prev, duration: parseInt(e.target.value) || 60 }))}
                required
                disabled={!canCreateLectures}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select value={formData.status} onValueChange={(value) => setFormData(prev => ({ ...prev, status: value as any }))}>
              <SelectTrigger disabled={!canCreateLectures}>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="live">Live</SelectItem>
                <SelectItem value="ended">Ended</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !canCreateLectures}>
              {isSubmitting ? "Creating..." : "Create Lecture"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}