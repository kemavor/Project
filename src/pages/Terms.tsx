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

const Terms = () => {
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
          <H1 className="text-gray-900 mb-4">VisionWare Terms of Service</H1>
          <LargeText className="text-gray-600">Last updated: {new Date().toLocaleDateString()}</LargeText>
        </div>

        <div className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">A. INTRODUCTION</h2>
          <div className="space-y-4 text-gray-700 leading-relaxed">
            <p>
              These terms and conditions create a contract between you and VisionWare (the "Agreement"). Please read the Agreement carefully.
            </p>
            <p>
              By accessing and using VisionWare ("the Platform"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
            </p>
            <p>
              VisionWare is an educational platform that provides live streaming, course management, and interactive learning features for students, teachers, and administrators.
            </p>
          </div>
        </div>

        <div className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">B. ACCOUNT</h2>
          <div className="space-y-6 text-gray-700 leading-relaxed">
            <p>
              Using our Services and accessing your Content may require a VisionWare Account. Your account is valuable, and you are responsible for maintaining its confidentiality and security. VisionWare is not responsible for any losses arising from the unauthorized use of your account.
            </p>
            <p>
              You must be age thirteen (13) (or equivalent minimum age in your jurisdiction) to create an account and use our Services. You must provide accurate, current, and complete information during registration.
            </p>
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">User Roles and Responsibilities</h3>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Students</h4>
                  <ul className="list-disc list-inside space-y-1 text-gray-700">
                    <li>Access enrolled courses and materials</li>
                    <li>Participate in live lectures and discussions</li>
                    <li>Submit assignments and take quizzes</li>
                    <li>Respect intellectual property rights</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Teachers</h4>
                  <ul className="list-disc list-inside space-y-1 text-gray-700">
                    <li>Create and manage courses</li>
                    <li>Conduct live streaming sessions</li>
                    <li>Upload educational content</li>
                    <li>Grade assignments and provide feedback</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Administrators</h4>
                  <ul className="list-disc list-inside space-y-1 text-gray-700">
                    <li>Manage platform users and content</li>
                    <li>Monitor system health and performance</li>
                    <li>Enforce platform policies</li>
                    <li>Access administrative tools</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">C. SERVICES AND CONTENT USAGE RULES</h2>
          <div className="space-y-6 text-gray-700 leading-relaxed">
            <p>
              Your use of the Services and Content must follow the rules set forth in this section ("Usage Rules"). Any other use of the Services and Content is a material breach of this Agreement. VisionWare may monitor your use of the Services and Content to ensure that you are following these Usage Rules.
            </p>
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Live Streaming Guidelines</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li>Live streams must be educational and appropriate for the platform</li>
                <li>Teachers are responsible for the content they stream</li>
                <li>Recording of live sessions may be subject to consent requirements</li>
                <li>Platform reserves the right to terminate inappropriate streams</li>
              </ul>
            </div>
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Content Upload and Management</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li>You retain ownership of content you upload</li>
                <li>You grant VisionWare license to host and display your content</li>
                <li>Content must not violate copyright or intellectual property rights</li>
                <li>Platform may remove content that violates these terms</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">D. COMMUNICATION</h2>
          <div className="space-y-6 text-gray-700 leading-relaxed">
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Chat and Messaging</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li>All communications must be respectful and professional</li>
                <li>No harassment, bullying, or inappropriate language</li>
                <li>Platform may monitor chat for policy violations</li>
                <li>Users can report inappropriate behavior</li>
              </ul>
            </div>
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Notifications</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li>You may receive notifications about courses, lectures, and platform updates</li>
                <li>You can manage notification preferences in your account settings</li>
                <li>Important administrative notices cannot be disabled</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">E. PRIVACY</h2>
          <div className="space-y-6 text-gray-700 leading-relaxed">
            <p>
              Your use of our Services is subject to VisionWare's Privacy Policy, which is available at <Link to="/privacy" className="text-blue-600 hover:underline">our Privacy Policy page</Link>.
            </p>
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Data Collection and Use</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li>We collect information necessary to provide our services</li>
                <li>Your data is used to improve platform functionality and user experience</li>
                <li>We do not sell your personal information to third parties</li>
                <li>Data retention follows our Privacy Policy</li>
              </ul>
            </div>
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Security</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li>We implement industry-standard security measures</li>
                <li>You are responsible for keeping your account secure</li>
                <li>Report any security concerns immediately</li>
                <li>Regular security audits are conducted</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">F. PROHIBITED ACTIVITIES</h2>
          <div className="space-y-6 text-gray-700 leading-relaxed">
            <p>
              You may not use the Services or Content in any manner that is illegal or harmful to others. The following activities are prohibited:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700">
              <li>Sharing account credentials with others</li>
              <li>Attempting to gain unauthorized access to the platform</li>
              <li>Uploading malicious content or software</li>
              <li>Using the platform for commercial purposes without permission</li>
              <li>Harassing or bullying other users</li>
              <li>Violating intellectual property rights</li>
              <li>Attempting to reverse engineer the platform</li>
            </ul>
          </div>
        </div>

        <div className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">G. INTELLECTUAL PROPERTY</h2>
          <div className="space-y-6 text-gray-700 leading-relaxed">
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Platform Content</h3>
              <p>
                VisionWare and its original content, features, and functionality are owned by VisionWare and are protected by international copyright, trademark, patent, trade secret, and other intellectual property laws.
              </p>
            </div>
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">User Content</h3>
              <p>
                You retain ownership of content you create and upload. By uploading content, you grant VisionWare a worldwide, non-exclusive license to use, host, and display your content for educational purposes.
              </p>
            </div>
          </div>
        </div>

        <div className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">H. TERMINATION AND SUSPENSION OF SERVICES</h2>
          <div className="space-y-6 text-gray-700 leading-relaxed">
            <p>
              VisionWare may terminate or suspend your access to the Services at any time, with or without notice, for conduct that VisionWare believes violates this Agreement or is harmful to other users, VisionWare, or third parties, or for any other reason.
            </p>
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Termination</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li>We may terminate accounts that violate these terms</li>
                <li>You may delete your account at any time through your profile settings</li>
                <li>Account deletion is permanent and cannot be undone</li>
                <li>Some data may be retained for legal or administrative purposes</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">I. LIMITATION OF LIABILITY</h2>
          <div className="space-y-6 text-gray-700 leading-relaxed">
            <p>
              VISIONWARE IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND. WE ARE NOT LIABLE FOR ANY DAMAGES ARISING FROM THE USE OF OUR PLATFORM, INCLUDING BUT NOT LIMITED TO DATA LOSS, SERVICE INTERRUPTIONS, OR CONTENT ACCURACY.
            </p>
            <p>
              IN NO CASE SHALL VISIONWARE, ITS DIRECTORS, OFFICERS, EMPLOYEES, AFFILIATES, AGENTS, CONTRACTORS, OR LICENSORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, PUNITIVE, SPECIAL, OR CONSEQUENTIAL DAMAGES ARISING FROM YOUR USE OF ANY OF THE SERVICES OR FOR ANY OTHER CLAIM RELATED IN ANY WAY TO YOUR USE OF THE SERVICES AND/OR CONTENT.
            </p>
          </div>
        </div>

        <div className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">J. CHANGES TO TERMS</h2>
          <div className="space-y-6 text-gray-700 leading-relaxed">
            <p>
              We reserve the right to modify these terms at any time. Changes will be effective immediately upon posting. Continued use of the platform constitutes acceptance of modified terms.
            </p>
          </div>
        </div>

        <div className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">K. CONTACT INFORMATION</h2>
          <div className="space-y-6 text-gray-700 leading-relaxed">
            <p>
              If you have questions about these Terms of Service, please contact us through the platform's support system or at support@visionware.com
            </p>
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

export default Terms 