// pages/FacultyDashboard.jsx
import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  FileCheck, User, Calendar, Award, CheckCircle, XCircle, Loader, FileText, 
  AlertCircle, ExternalLink, Download, Eye, QrCode, Printer 
} from 'lucide-react';

export default function FacultyDashboard() {
  const [activities, setActivities] = useState([]);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [generatingCert, setGeneratingCert] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPendingActivities();
  }, []);

  const fetchPendingActivities = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      if (!token) {
        setError('No authentication token found. Please login.');
        return;
      }

      console.log('Fetching pending activities...');
      
      const response = await axios.get('http://localhost:5000/api/activities/faculty/pending', {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log(' Activities fetched:', response.data.activities.length);
      setActivities(response.data.activities || []);
    } catch (error) {
      console.error(' Error fetching activities:', error.message);
      setError(error.response?.data?.error || 'Failed to load activities');
    } finally {
      setLoading(false);
    }
  };

  // ========== APPROVE ACTIVITY ==========
  const handleApprove = async (activityId) => {
    console.log(' DEBUG: Activity ID:', activityId);
    console.log(' DEBUG: Type:', typeof activityId);
    
    if (!activityId) {
      alert(' Activity ID is missing');
      return;
    }

    if (!comment.trim()) {
      alert(' Please add a comment before approving');
      return;
    }

    setActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert(' Authentication token missing. Please login again.');
        return;
      }

      console.log(' Approving activity:', activityId);
      
      // CORRECT ENDPOINT
      const response = await axios.put(
        `http://localhost:5000/api/activities/${activityId}/approve`,
        { comment },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log(' Activity approved:', response.data);
      alert(' Activity approved successfully!');
      setSelectedActivity(null);
      setComment('');
      await fetchPendingActivities();
    } catch (error) {
      console.error(' Error approving activity:', error.response?.data || error.message);
      alert(` Error: ${error.response?.data?.error || error.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  // ========== REJECT ACTIVITY ==========
  const handleReject = async (activityId, reason) => {
    console.log('🔍 DEBUG: Reject Activity ID:', activityId);
    
    if (!activityId) {
      alert(' Activity ID is missing');
      return;
    }

    if (!reason.trim()) {
      alert(' Please add a rejection reason');
      return;
    }

    setActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert(' Authentication token missing. Please login again.');
        return;
      }

      console.log(' Rejecting activity:', activityId);
      
      //  CORRECT ENDPOINT
      const response = await axios.put(
        `http://localhost:5000/api/activities/${activityId}/reject`,
        { reason },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log(' Activity rejected:', response.data);
      alert(' Activity rejected!');
      setSelectedActivity(null);
      await fetchPendingActivities();
    } catch (error) {
      console.error(' Error rejecting activity:', error.response?.data || error.message);
      alert(` Error: ${error.response?.data?.error || error.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  // ========== GENERATE CERTIFICATE ==========
  const handleGenerateCertificate = async (activityId) => {
    if (!activityId) {
      alert(' Activity ID is missing');
      return;
    }

    setGeneratingCert(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert(' Authentication token missing. Please login again.');
        return;
      }

      console.log(' Generating certificate with QR code...');
      
      const response = await axios.post(
        `http://localhost:5000/api/certificates/generate/${activityId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log(' Certificate generated:', response.data);
      alert(' Certificate with QR code generated successfully!');
      
      setSelectedActivity(prev => ({
        ...prev,
        certificateId: response.data.certificateId,
        certificatePath: response.data.certificatePath
      }));

      await fetchPendingActivities();
    } catch (error) {
      console.error('❌ Error generating certificate:', error.response?.data || error.message);
      alert(`❌ Error: ${error.response?.data?.error || error.message}`);
    } finally {
      setGeneratingCert(false);
    }
  };

  // ========== DOWNLOAD CERTIFICATE ==========
  const handleDownloadCertificate = (certificateId) => {
    window.location.href = `http://localhost:5000/api/certificates/download/${certificateId}`;
  };

  // ========== VIEW CERTIFICATE ==========
  const handleViewCertificate = (certificateId) => {
    window.open(`http://localhost:5000/api/certificates/view/${certificateId}`, '_blank');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-white">
        <div className="text-center">
          <Loader className="w-12 h-12 text-orange-600 animate-spin mx-auto mb-4" />
          <p className="text-lg text-gray-600 font-light">Loading activities...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 font-sans">
      <div className="max-w-7xl mx-auto px-8 py-12">
        {/* Header Section */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <div>
              <h1 className="text-5xl font-light text-gray-900">Faculty Dashboard</h1>
              <p className="text-gray-600 font-light mt-1">Review, approve & generate certificates</p>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-8 bg-red-50 border-2 border-red-200 rounded-xl p-4 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <p className="text-red-700 font-light">{error}</p>
            <button
              onClick={fetchPendingActivities}
              className="ml-auto px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-100 rounded-lg transition"
            >
              Retry
            </button>
          </div>
        )}

        {/* Stats Card */}
        <div className="mb-8">
          <div className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:border-orange-400 transition duration-300 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-orange-50 rounded-xl">
                  <FileText className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 font-light mb-1">Activities Pending Review</p>
                  <p className="text-4xl font-light text-gray-900">{activities.length}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-600 font-light uppercase tracking-wider">Awaiting Action</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Activities List */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center gap-3 mb-4">
              <FileText className="w-6 h-6 text-orange-600" />
              <h2 className="text-2xl font-light text-gray-900">Pending Activities</h2>
            </div>

            {activities.length === 0 ? (
              <div className="bg-white border-2 border-gray-200 rounded-xl p-12 text-center">
                <div className="p-4 bg-green-50 rounded-full mb-4 w-fit mx-auto">
                  <CheckCircle className="w-12 h-12 text-green-600" />
                </div>
                <p className="text-lg text-gray-700 font-light">All caught up!</p>
                <p className="text-sm text-gray-600 font-light mt-2">No pending activities to review.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {activities.map((activity) => (
                  <div
                    key={activity._id} 
                    onClick={() => {
                      setSelectedActivity(activity);
                      setComment('');
                    }}
                    className={`bg-white p-6 border-2 rounded-xl cursor-pointer transition duration-300 hover:shadow-lg ${
                      selectedActivity?._id === activity._id  // ✅ USE _id NOT id
                        ? 'border-orange-400 bg-orange-50 shadow-lg'
                        : 'border-gray-200 hover:border-orange-300'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <h3 className="font-medium text-lg text-gray-900 mb-2">{activity.title}</h3>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <User className="w-4 h-4 text-orange-600" />
                            <span className="font-light">
                              {activity.student?.name || 'Unknown'} 
                              <span className="text-gray-500"> ({activity.student?.rollNumber || 'N/A'})</span>
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Calendar className="w-4 h-4 text-orange-600" />
                            <span className="font-light">
                              {activity.eventDate ? new Date(activity.eventDate).toLocaleDateString() : 'N/A'}
                            </span>
                          </div>
                        </div>
                      </div>
                      {selectedActivity?._id === activity._id && (  // ✅ USE _id NOT id
                        <span className="px-3 py-1 bg-gradient-to-r from-orange-600 to-orange-500 text-white text-xs font-medium rounded-full">
                          Selected
                        </span>
                      )}
                    </div>
                    
                    <div className="flex gap-2 mt-4">
                      <span className="inline-block px-3 py-1 bg-orange-100 text-orange-700 text-xs font-medium rounded-full">
                        {activity.category}
                      </span>
                      {activity.achievementLevel && (
                        <span className="inline-block px-3 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-full">
                          {activity.achievementLevel}
                        </span>
                      )}
                      {activity.certificateId && (
                        <span className="inline-block px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                          ✅ Certified
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Review Panel */}
          <div className="space-y-6">
            {selectedActivity ? (
              <>
                <div className="flex items-center gap-3 mb-4">
                  <Award className="w-6 h-6 text-orange-600" />
                  <h2 className="text-2xl font-light text-gray-900">Review Activity</h2>
                </div>

                <div className="space-y-4">
                  {/* Activity Details Cards */}
                  <div className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:border-orange-400 transition duration-300">
                    <div className="space-y-4">
                      <div>
                        <p className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">Title</p>
                        <p className="text-gray-900 font-light">{selectedActivity.title}</p>
                      </div>

                      <div>
                        <p className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">Student</p>
                        <p className="text-gray-900 font-light">{selectedActivity.student?.name || 'Unknown'}</p>
                        <p className="text-sm text-gray-600 font-light">{selectedActivity.student?.rollNumber || 'N/A'}</p>
                        <p className="text-sm text-gray-600 font-light">{selectedActivity.student?.email || 'N/A'}</p>
                      </div>

                      <div>
                        <p className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">Description</p>
                        <p className="text-sm text-gray-700 font-light leading-relaxed max-h-32 overflow-y-auto">
                          {selectedActivity.description}
                        </p>
                      </div>

                      {selectedActivity.organizingBody && (
                        <div>
                          <p className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">Organizing Body</p>
                          <p className="text-gray-900 font-light">{selectedActivity.organizingBody}</p>
                        </div>
                      )}

                      <div>
                        <p className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">Event Date</p>
                        <p className="text-gray-900 font-light">
                          {selectedActivity.eventDate
                            ? new Date(selectedActivity.eventDate).toLocaleDateString()
                            : 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Skills Section */}
                  {(selectedActivity.selectedTechnicalSkills?.length > 0 || 
                    selectedActivity.selectedSoftSkills?.length > 0 || 
                    selectedActivity.selectedTools?.length > 0) && (
                    <div className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:border-orange-400 transition duration-300">
                      <div className="space-y-3">
                        {selectedActivity.selectedTechnicalSkills?.length > 0 && (
                          <div>
                            <p className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">Technical Skills</p>
                            <div className="flex flex-wrap gap-2">
                              {selectedActivity.selectedTechnicalSkills.map((skill) => (
                                <span
                                  key={`tech-${skill}`}
                                  className="bg-orange-100 text-orange-700 text-xs px-3 py-1 rounded-full font-medium"
                                >
                                  {skill}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {selectedActivity.selectedSoftSkills?.length > 0 && (
                          <div>
                            <p className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">Soft Skills</p>
                            <div className="flex flex-wrap gap-2">
                              {selectedActivity.selectedSoftSkills.map((skill) => (
                                <span
                                  key={`soft-${skill}`}
                                  className="bg-gray-100 text-gray-700 text-xs px-3 py-1 rounded-full font-medium"
                                >
                                  {skill}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {selectedActivity.selectedTools?.length > 0 && (
                          <div>
                            <p className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">Tools & Technologies</p>
                            <div className="flex flex-wrap gap-2">
                              {selectedActivity.selectedTools.map((tool) => (
                                <span
                                  key={`tool-${tool}`}
                                  className="bg-orange-50 text-orange-600 text-xs px-3 py-1 rounded-full font-medium"
                                >
                                  {tool}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Certificate Section */}
                  {selectedActivity.status === 'approved' ? (
                    <div className="bg-white border-2 border-green-200 rounded-xl p-6 hover:border-green-400 transition duration-300 bg-green-50">
                      <div className="space-y-3">
                        <div>
                          <p className="text-xs font-semibold text-green-700 uppercase tracking-wider mb-2">✅ Status</p>
                          <p className="text-sm text-green-700 font-medium">Approved & Ready</p>
                        </div>

                        {selectedActivity.certificateId ? (
                          <>
                            <div className="border-t border-green-200 pt-3">
                              <p className="text-xs font-semibold text-green-700 uppercase tracking-wider mb-2">📜 Certificate Generated</p>
                              <div className="space-y-2">
                                <button
                                  onClick={() => handleViewCertificate(selectedActivity.certificateId)}
                                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium"
                                >
                                  <Eye size={16} />
                                  View Certificate
                                </button>
                                <button
                                  onClick={() => handleDownloadCertificate(selectedActivity.certificateId)}
                                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm font-medium"
                                >
                                  <Download size={16} />
                                  Download PDF
                                </button>
                              </div>
                            </div>
                          </>
                        ) : (
                          <button
                            onClick={() => handleGenerateCertificate(selectedActivity._id)}  // ✅ USE _id NOT id
                            disabled={generatingCert}
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-600 to-purple-500 text-white rounded-lg hover:from-purple-700 hover:to-purple-600 disabled:from-gray-400 disabled:to-gray-400 transition text-sm font-medium"
                          >
                            {generatingCert ? (
                              <>
                                <Loader size={16} className="animate-spin" />
                                Generating...
                              </>
                            ) : (
                              <>
                                <Printer size={16} />
                                🎓 Generate Certificate with QR
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Review Comment */}
                      <div className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:border-orange-400 transition duration-300">
                        <p className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-3">Review Comment *</p>
                        <textarea
                          value={comment}
                          onChange={(e) => setComment(e.target.value)}
                          placeholder="Add your review comment..."
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl font-light text-gray-900 placeholder-gray-400 focus:outline-none focus:border-orange-500 transition duration-300 h-24 resize-none"
                        />
                      </div>

                      {/* Action Buttons */}
                      <div className="space-y-3">
                        <button
                          onClick={() => handleApprove(selectedActivity._id)}  // ✅ USE _id NOT id
                          disabled={actionLoading || !comment.trim()}
                          className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-600 to-orange-500 text-white hover:from-orange-700 hover:to-orange-600 disabled:from-gray-400 disabled:to-gray-400 transition duration-300 font-medium text-sm shadow-lg shadow-orange-500/20 hover:shadow-orange-500/30 disabled:shadow-none rounded-xl"
                        >
                          {actionLoading ? (
                            <>
                              <Loader className="w-4 h-4 animate-spin" />
                              Processing...
                            </>
                          ) : (
                            <>
                              <CheckCircle className="w-4 h-4" />
                              ✅ Approve Activity
                            </>
                          )}
                        </button>

                        <button
                          onClick={() => {
                            const reason = prompt('Enter rejection reason:');
                            if (reason) handleReject(selectedActivity._id, reason);  // ✅ USE _id NOT id
                          }}
                          disabled={actionLoading}
                          className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 border-2 border-gray-300 text-gray-700 hover:border-red-500 hover:text-red-600 hover:bg-red-50 disabled:border-gray-300 disabled:text-gray-400 disabled:bg-gray-100 transition duration-300 font-medium text-sm rounded-xl"
                        >
                          {actionLoading ? (
                            <>
                              <Loader className="w-4 h-4 animate-spin" />
                              Processing...
                            </>
                          ) : (
                            <>
                              <XCircle className="w-4 h-4" />
                              ❌ Reject Activity
                            </>
                          )}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-3 mb-4">
                  <Award className="w-6 h-6 text-orange-600" />
                  <h2 className="text-2xl font-light text-gray-900">Review Activity</h2>
                </div>
                <div className="bg-white border-2 border-gray-200 rounded-xl p-12 text-center">
                  <div className="p-4 bg-orange-50 rounded-full mb-4 w-fit mx-auto">
                    <AlertCircle className="w-12 h-12 text-orange-600" />
                  </div>
                  <p className="text-lg text-gray-700 font-light mb-2">No Activity Selected</p>
                  <p className="text-sm text-gray-600 font-light">
                    Select an activity from the list to review and approve
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}