import React from 'react'
import { Link } from 'react-router-dom'
import { Button } from "@/components/ui/button"
import { ArrowLeft } from 'lucide-react'
import {
  H1, H2, H3, H4, H5, H6,
  LargeText, MediumText, NormalText, SmallText,
  Button as DSButton,
  Badge as DSBadge,
  Card as DSCard
} from '@/components/ui/design-system'

const Privacy = () => {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => window.history.back()}
            className="mb-6 text-gray-600 hover:text-gray-800"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <H1 className="text-gray-900 mb-4">VisionWare Privacy Policy</H1>
          <LargeText className="text-gray-600">Last updated: {new Date().toLocaleDateString()}</LargeText>
        </div>

        <div className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">A. INTRODUCTION</h2>
          <div className="space-y-4 text-gray-700 leading-relaxed">
            <p>
              VisionWare ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our educational platform.
            </p>
            <p>
              By using VisionWare, you consent to the data practices described in this policy. If you do not agree with our policies and practices, please do not use our platform.
            </p>
          </div>
        </div>

        <div className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">B. INFORMATION WE COLLECT</h2>
          <div className="space-y-6 text-gray-700 leading-relaxed">
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li>Name, email address, and username</li>
                <li>Role (student, teacher, administrator)</li>
                <li>Profile information and preferences</li>
                <li>Account credentials (securely encrypted)</li>
              </ul>
            </div>

            <div className="mt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Educational Data</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li>Course enrollments and progress</li>
                <li>Assignment submissions and grades</li>
                <li>Quiz results and performance data</li>
                <li>Live streaming participation records</li>
                <li>Chat messages and interactions</li>
              </ul>
            </div>

            <div className="mt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Technical Information</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li>IP address and device information</li>
                <li>Browser type and version</li>
                <li>Operating system and platform</li>
                <li>Usage patterns and analytics data</li>
                <li>Error logs and performance metrics</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">C. HOW WE USE YOUR INFORMATION</h2>
          <div className="space-y-6 text-gray-700 leading-relaxed">
            <p>
              We use the information we collect to provide, maintain, and improve our services. Your information helps us deliver educational content, manage user accounts, and ensure platform security.
            </p>
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Platform Functionality</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li>Provide educational services</li>
                <li>Manage user accounts and roles</li>
                <li>Enable live streaming features</li>
                <li>Process course enrollments</li>
              </ul>
            </div>
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Communication</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li>Send notifications and updates</li>
                <li>Provide customer support</li>
                <li>Share important announcements</li>
                <li>Respond to user inquiries</li>
              </ul>
            </div>
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Analytics & Improvement</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li>Analyze platform usage</li>
                <li>Improve user experience</li>
                <li>Develop new features</li>
                <li>Monitor system performance</li>
              </ul>
            </div>
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Security & Compliance</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li>Prevent fraud and abuse</li>
                <li>Ensure platform security</li>
                <li>Comply with legal obligations</li>
                <li>Protect user rights</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">D. INFORMATION SHARING</h2>
          <div className="space-y-6 text-gray-700 leading-relaxed">
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">We Do Not Sell Your Data</h3>
              <p>
                VisionWare does not sell, trade, or rent your personal information to third parties for marketing purposes.
              </p>
            </div>

            <div className="mt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Limited Sharing Scenarios</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li><strong>Service Providers:</strong> We may share data with trusted third-party services that help us operate our platform (hosting, analytics, etc.)</li>
                <li><strong>Legal Requirements:</strong> We may disclose information if required by law or to protect our rights and safety</li>
                <li><strong>Educational Institutions:</strong> With your consent, we may share data with your educational institution</li>
                <li><strong>Emergency Situations:</strong> We may share information to prevent harm or address emergencies</li>
              </ul>
            </div>

            <div className="mt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Data Processing Agreements</h3>
              <p>
                All third-party service providers are bound by strict data processing agreements that ensure your information is protected and used only for specified purposes.
              </p>
            </div>
          </div>
        </div>

        <div className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">E. DATA SECURITY</h2>
          <div className="space-y-6 text-gray-700 leading-relaxed">
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Security Measures</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li>Encryption of data in transit and at rest</li>
                <li>Regular security audits and vulnerability assessments</li>
                <li>Access controls and authentication systems</li>
                <li>Secure data centers with physical security</li>
                <li>Employee training on data protection</li>
              </ul>
            </div>

            <div className="mt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Security Responsibilities</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li>Keep your account credentials secure</li>
                <li>Use strong, unique passwords</li>
                <li>Enable two-factor authentication if available</li>
                <li>Log out of shared devices</li>
                <li>Report suspicious activity immediately</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">F. DATA RETENTION</h2>
          <div className="space-y-6 text-gray-700 leading-relaxed">
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Retention Periods</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li><strong>Account Data:</strong> Retained while your account is active, plus 30 days after deletion</li>
                <li><strong>Educational Content:</strong> Retained for 7 years for academic record purposes</li>
                <li><strong>Live Stream Data:</strong> Retained for 2 years unless deleted by the streamer</li>
                <li><strong>Chat Messages:</strong> Retained for 1 year for moderation purposes</li>
                <li><strong>Analytics Data:</strong> Retained for 3 years in anonymized form</li>
              </ul>
            </div>

            <div className="mt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Data Deletion</h3>
              <p>
                You can request deletion of your personal data at any time. Some data may be retained for legal, administrative, or academic record purposes as required by law.
              </p>
            </div>
          </div>
        </div>

        <div className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">G. YOUR RIGHTS AND CHOICES</h2>
          <div className="space-y-6 text-gray-700 leading-relaxed">
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Access & Control</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li>View your personal data</li>
                <li>Update account information</li>
                <li>Download your data</li>
                <li>Request data deletion</li>
              </ul>
            </div>
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Privacy Settings</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li>Manage notification preferences</li>
                <li>Control data sharing</li>
                <li>Adjust privacy levels</li>
                <li>Opt out of analytics</li>
              </ul>
            </div>
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">How to Exercise Your Rights</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li>Use the privacy settings in your account dashboard</li>
                <li>Contact our support team for data requests</li>
                <li>Email privacy@visionware.com for complex requests</li>
                <li>We will respond to requests within 30 days</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">H. COOKIES AND TRACKING</h2>
          <div className="space-y-6 text-gray-700 leading-relaxed">
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Types of Cookies We Use</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li><strong>Essential Cookies:</strong> Required for platform functionality</li>
                <li><strong>Performance Cookies:</strong> Help us understand how users interact with our platform</li>
                <li><strong>Functional Cookies:</strong> Remember your preferences and settings</li>
                <li><strong>Analytics Cookies:</strong> Provide insights into platform usage</li>
              </ul>
            </div>

            <div className="mt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Managing Cookies</h3>
              <p>
                You can control cookie settings through your browser preferences. Note that disabling certain cookies may affect platform functionality.
              </p>
            </div>
          </div>
        </div>

        <div className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">I. CHILDREN'S PRIVACY</h2>
          <div className="space-y-6 text-gray-700 leading-relaxed">
            <p>
              VisionWare is not intended for children under 13. We do not knowingly collect personal information from children under 13. If we become aware that we have collected such information, we will take steps to delete it promptly.
            </p>
            <p>
              For users aged 13-17, we require parental consent for certain features and data collection activities.
            </p>
          </div>
        </div>

        <div className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">J. INTERNATIONAL DATA TRANSFERS</h2>
          <div className="space-y-6 text-gray-700 leading-relaxed">
            <p>
              VisionWare may transfer your data to countries other than your own. We ensure that such transfers comply with applicable data protection laws and implement appropriate safeguards to protect your information.
            </p>
          </div>
        </div>

        <div className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">K. CHANGES TO THIS POLICY</h2>
          <div className="space-y-6 text-gray-700 leading-relaxed">
            <p>
              We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new policy on this page and updating the "Last updated" date. Your continued use of the platform after changes become effective constitutes acceptance of the updated policy.
            </p>
          </div>
        </div>

        <div className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">L. CONTACT US</h2>
          <div className="space-y-6 text-gray-700 leading-relaxed">
            <p>
              If you have questions about this Privacy Policy or our data practices, please contact us:
            </p>
            <div className="space-y-2 text-gray-700">
              <p><strong>Email:</strong> privacy@visionware.com</p>
              <p><strong>Support:</strong> support@visionware.com</p>
              <p><strong>Address:</strong> [Your Business Address]</p>
            </div>
          </div>
        </div>

        <div className="flex justify-center mt-8">
          <Button asChild>
            <Link to="/register">Back to Registration</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}

export default Privacy 