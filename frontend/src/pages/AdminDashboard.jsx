import { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Shield, Award, CheckCircle, FileCheck, Loader, Send, Eye,
  Download, AlertCircle, TrendingUp, Mail, RefreshCw, Trash2, X,
  ChevronDown, Users, MailPlus
} from 'lucide-react';

export default function AdminDashboard({ user }) {
  // ========== STATES ==========
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [certifying, setCertifying] = useState(null);
  const [certificateData, setCertificateData] = useState(null);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    approved: 0,
    certified: 0,
    pending: 0,
    rate: 0
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('recent');
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [bulkSending, setBulkSending] = useState(false);

  // ========== LIFECYCLE ==========
  useEffect(() => {
    fetchApprovedActivities();
  }, []);

  // ========== FETCH APPROVED ACTIVITIES ==========
  const fetchApprovedActivities = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        'http://localhost:5000/api/activities/admin/approved',
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );

      const activitiesList = response.data.activities || [];
      console.log('Activities fetched:', activitiesList.length);

      setActivities(activitiesList);

      const certified = activitiesList.filter(a => a.certificateId).length;
      const pending = activitiesList.length - certified;
      const rate = activitiesList.length > 0 ? Math.round((certified / activitiesList.length) * 100) : 0;

      setStats({
        total: activitiesList.length,
        approved: activitiesList.length,
        certified,
        pending,
        rate
      });

    } catch (error) {
      console.error('Error fetching activities:', error);
      alert('❌ Error loading activities: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // ========== GENERATE CERTIFICATE ==========
  const handleGenerateCertificate = async (activity) => {
    if (!activity || !activity._id) {
      alert('❌ Invalid activity');
      return;
    }

    setCertifying(activity._id);
    try {
      console.log('📜 Generating certificate for:', activity._id);

      const response = await axios.post(
        `http://localhost:5000/api/certificates/generate/${activity._id}`,
        {},
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );

      console.log('✅ Certificate generated:', response.data);
      setCertificateData(response.data);
      setSelectedActivity(activity);

      const confirmSend = window.confirm(
        `✅ Certificate Generated!\n\n📧 Send to: ${response.data.studentEmail}?\n\nClick OK to send email now.`
      );

      if (confirmSend) {
        await handleSubmitAndSendEmail(activity._id, response.data);
      }

    } catch (error) {
      console.error('❌ Error:', error);
      alert('❌ Error: ' + (error.response?.data?.error || error.message));
    } finally {
      setCertifying(null);
    }
  };

  // ========== SUBMIT & SEND EMAIL ==========
  const handleSubmitAndSendEmail = async (activityId, certData) => {
    setCertifying(activityId);
    try {
      console.log('📧 Sending email...');

      const response = await axios.post(
        `http://localhost:5000/api/certificates/submit/${activityId}`,
        {
          certificateId: certData.certificateId,
          certificatePath: certData.certificatePath,
          studentName: certData.studentName,
          studentEmail: certData.studentEmail,
          studentId: certData.studentId,
          achievement: certData.achievement,
          organizingBody: certData.organizingBody,
          achievementLevel: certData.achievementLevel,
          eventDate: certData.eventDate
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('✅ Success:', response.data);
      alert(`✅ Certificate emailed to ${certData.studentEmail}`);

      setCertificateData(null);
      setSelectedActivity(null);
      fetchApprovedActivities();

    } catch (error) {
      console.error('❌ Error:', error);
      alert('❌ Error: ' + (error.response?.data?.error || error.message));
    } finally {
      setCertifying(null);
    }
  };

  // ========== BULK SEND ==========
  const handleBulkSend = async () => {
    if (selectedStudents.length === 0) {
      alert('Please select at least one student');
      return;
    }

    const confirm = window.confirm(
      `📧 Send certificates to ${selectedStudents.length} student${selectedStudents.length > 1 ? 's' : ''}?\n\nThis will email all pending certificates.`
    );
    if (!confirm) return;

    setBulkSending(true);
    try {
      console.log('📧 Bulk sending to', selectedStudents.length, 'students...');

      const response = await axios.post(
        'http://localhost:5000/api/certificates/bulk-send',
        { studentIds: selectedStudents },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );

      console.log('✅ Result:', response.data);
      alert(`✅ Successfully sent ${response.data.successCount} certificates!\n❌ Failed: ${response.data.failCount}`);

      setSelectedStudents([]);
      fetchApprovedActivities();

    } catch (error) {
      console.error('❌ Error:', error);
      alert('❌ Error: ' + (error.response?.data?.error || error.message));
    } finally {
      setBulkSending(false);
    }
  };

  // ========== TOGGLE SELECT ALL ==========
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      // ✅ FIX: NULL CHECK BEFORE ACCESSING _id
      const validStudentIds = filteredActivities
        .filter(a => a && a.student && a.student._id)
        .map(a => a.student._id);
      setSelectedStudents(validStudentIds);
    } else {
      setSelectedStudents([]);
    }
  };

  // ========== TOGGLE STUDENT SELECT ==========
  const handleToggleStudent = (studentId) => {
    if (!studentId) return; // Safety check

    if (selectedStudents.includes(studentId)) {
      setSelectedStudents(selectedStudents.filter(id => id !== studentId));
    } else {
      setSelectedStudents([...selectedStudents, studentId]);
    }
  };

  // ========== FILTER & SORT ==========
  const filteredActivities = activities
    .filter(activity => {
      // ✅ FIX: NULL CHECKS
      if (!activity) return false;

      const title = activity.title ? activity.title.toLowerCase() : '';
      const studentName = activity.student?.name ? activity.student.name.toLowerCase() : '';

      const matchSearch = title.includes(searchTerm.toLowerCase()) ||
        studentName.includes(searchTerm.toLowerCase());
      return matchSearch;
    })
    .sort((a, b) => {
      if (!a || !b) return 0;

      if (sortBy === 'recent') {
        const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0);
        const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0);
        return dateB - dateA;
      }

      if (sortBy === 'pending') {
        const aHasCert = !!a.certificateId;
        const bHasCert = !!b.certificateId;
        return aHasCert - bHasCert;
      }

      return 0;
    });

  // ========== LOADING ==========
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-gray-50 to-white">
        <div className="text-center">
          <Loader className="w-12 h-12 text-orange-600 animate-spin mx-auto mb-4" />
          <p className="text-lg text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // ========== RENDER ==========
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div className="max-w-7xl mx-auto px-8 py-12">

        {/* ========== HEADER ========== */}
        <div className="mb-12 flex items-center justify-between">
          <div>
            <h1 className="text-3xl md:text-5xl font-light text-gray-900 mb-3"> Admin Dashboard</h1>
            <p className="text-gray-600 font-light mt-2">Manage & certify approved activities</p>
          </div>
          <button
            onClick={fetchApprovedActivities}
            className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-gray-200 rounded-lg hover:border-orange-400 transition text-2xl font-light text-gray-900"
          >
            <RefreshCw className="w-4 h-4 " /> Refresh
          </button>
        </div>

        {/* ========== STATISTICS ========== */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <StatCard
            label="Total Activities"
            value={stats.total}
            icon={<FileCheck className="w-6 h-6" />}
            color="from-blue-500 to-blue-600"
          />
          <StatCard
            label="Pending"
            value={stats.pending}
            icon={<AlertCircle className="w-6 h-6" />}
            color="from-yellow-500 to-yellow-600"
          />
          <StatCard
            label="Certified"
            value={stats.certified}
            icon={<CheckCircle className="w-6 h-6" />}
            color="from-green-500 to-green-600"
          />
          <StatCard
            label="Rate"
            value={`${stats.rate}%`}
            icon={<TrendingUp className="w-6 h-6" />}
            color="from-purple-500 to-purple-600"
          />
        </div>

        {/* ========== CERTIFICATE PREVIEW ========== */}
        {certificateData && (
          <div className="mb-8 p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl shadow-lg">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-bold text-lg text-blue-900 mb-4">📜 Certificate Preview</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <InfoBlock label="Student" value={certificateData.studentName} />
                  <InfoBlock label="Email" value={certificateData.studentEmail} />
                  <InfoBlock label="Certificate ID" value={certificateData.certificateId} monospace />
                  <InfoBlock label="Achievement" value={certificateData.achievement} />
                </div>
              </div>
              <div className="flex gap-2 ml-4">
                <button
                  onClick={() => window.open(certificateData.certificatePath, '_blank')}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-bold text-sm"
                >
                  <Eye className="w-4 h-4" /> View PDF
                </button>
                <button
                  onClick={() => setCertificateData(null)}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition font-bold text-sm"
                >
                  <X className="w-4 h-4" /> Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========== BULK SEND PANEL ========== */}
        {selectedStudents.length > 0 && (
          <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-xl shadow-lg sticky top-4 z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-green-600" />
                <p className="font-bold text-green-900">
                  {selectedStudents.length} student{selectedStudents.length > 1 ? 's' : ''} selected
                </p>
              </div>
              <button
                onClick={handleBulkSend}
                disabled={bulkSending}
                className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 disabled:from-gray-400 disabled:to-gray-400 transition font-bold"
              >
                {bulkSending ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <MailPlus className="w-4 h-4" />
                    Send to All
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* ========== FILTERS & SEARCH ========== */}
        <div className="mb-6 bg-white p-4 rounded-xl border-2 border-gray-200 flex flex-wrap gap-4">
          <div className="flex-1 min-w-250">
            <input
              type="text"
              placeholder="🔍 Search by student or activity..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-orange-400 focus:outline-none font-medium"
            />
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-orange-400 focus:outline-none text-2xl font-light text-gray-900 cursor-pointer bg-white"
          >
            <option value="recent">Most Recent</option>
            <option value="pending">Pending First</option>
          </select>
        </div>

        {/* ========== ACTIVITIES TABLE ========== */}
        <div className="bg-white border-2 border-gray-200 rounded-xl shadow-xl overflow-hidden">
          <div className="p-6 border-b-2 border-gray-200 bg-gradient-to-r from-orange-50 to-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileCheck className="w-6 h-6 text-orange-600" />
                <h2 className="text-2xl font-light text-gray-900">Approved Activities</h2>
                <span className="px-3 py-1 bg-orange-100 text-orange-700 text-sm font-bold rounded-full">
                  {filteredActivities.length}
                </span>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b-2 border-gray-200">
                <tr>
                  <th className="p-4 text-left">
                    <input
                      type="checkbox"
                      onChange={handleSelectAll}
                      checked={filteredActivities.length > 0 && selectedStudents.length === filteredActivities.filter(a => a?.student?._id).length}
                      className="w-5 h-5 cursor-pointer"
                    />
                  </th>
                  <th className="p-4 text-left text-xs font-semibold text-gray-700 uppercase">Student</th>
                  <th className="p-4 text-left text-xs font-semibold text-gray-700 uppercase">Activity</th>
                  <th className="p-4 text-left text-xs font-semibold text-gray-700 uppercase">Category</th>
                  <th className="p-4 text-left text-xs font-semibold text-gray-700 uppercase">Level</th>
                  <th className="p-4 text-left text-xs font-semibold text-gray-700 uppercase">Status</th>
                  <th className="p-4 text-left text-xs font-semibold text-gray-700 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredActivities.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="p-12 text-center">
                      <div className="flex flex-col items-center">
                        <CheckCircle className="w-12 h-12 text-green-600 mb-4" />
                        <p className="text-lg text-gray-700 font-semibold">All activities certified! 🎉</p>
                        <p className="text-sm text-gray-600">No pending certifications</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredActivities.map((activity, index) => {
                    // FIX: NULL CHECKS BEFORE ACCESSING
                    if (!activity || !activity.student) {
                      return (
                        <tr key={index} className="border-b border-gray-200 bg-red-50">
                          <td colSpan="7" className="p-4 text-center text-red-600 font-bold">
                            Data Error - Student not found
                          </td>
                        </tr>
                      );
                    }

                    return (
                      <tr
                        key={activity._id || index}
                        className={`border-b border-gray-200 hover:bg-orange-50 transition ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                          }`}
                      >
                        <td className="p-4">
                          <input
                            type="checkbox"
                            checked={selectedStudents.includes(activity.student._id)}
                            onChange={() => handleToggleStudent(activity.student._id)}
                            className="w-5 h-5 cursor-pointer"
                          />
                        </td>
                        <td className="p-4">
                          <div className="font-semibold text-gray-900">{activity.student.name || 'N/A'}</div>
                          <div className="text-xs text-gray-600">{activity.student.email || 'N/A'}</div>
                        </td>
                        <td className="p-4">
                          <div className="font-medium text-gray-900 truncate max-w-xs">{activity.title || 'N/A'}</div>
                        </td>
                        <td className="p-4">
                          <span className="px-3 py-1 bg-orange-100 text-orange-700 text-xs font-bold rounded-full">
                            {activity.category || 'N/A'}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className="px-3 py-1 bg-indigo-100 text-indigo-700 text-xs font-bold rounded-full">
                            {activity.achievementLevel || 'N/A'}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className={`px-3 py-1 text-xs font-bold rounded-full ${activity.certificateId
                              ? 'bg-green-100 text-green-700'
                              : 'bg-yellow-100 text-yellow-700'
                            }`}>
                            {activity.certificateId ? 'Certified' : 'Pending'}
                          </span>
                        </td>
                        <td className="p-4">
                          <button
                            onClick={() => handleGenerateCertificate(activity)}
                            disabled={certifying === activity._id || activity.certificateId}
                            className="inline-flex items-center gap-1 px-3 py-2 bg-gradient-to-r from-orange-600 to-orange-500 text-white hover:from-orange-700 hover:to-orange-600 disabled:from-gray-400 disabled:to-gray-400 transition rounded-lg text-sm font-bold whitespace-nowrap"
                          >
                            {certifying === activity._id ? (
                              <>
                                <Loader className="w-3 h-3 animate-spin" />
                                Sending...
                              </>
                            ) : activity.certificateId ? (
                              <>
                                
                                Done
                              </>
                            ) : (
                              <>
                                
                                Generate
                              </>
                            )}
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

// ========== HELPER COMPONENTS ==========

function StatCard({ label, value, icon, color }) {
  return (
    <div className={`bg-gradient-to-br ${color} text-white rounded-xl p-6 shadow-lg hover:shadow-xl transition`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm opacity-90 font-light">{label}</p>
          <p className="text-4xl font-bold mt-2">{value}</p>
        </div>
        <div className="opacity-20 text-6xl">{icon}</div>
      </div>
    </div>
  );
}

function InfoBlock({ label, value, monospace }) {
  return (
    <div>
      <p className="text-xs font-bold text-blue-700 uppercase mb-1">{label}</p>
      <p className={`text-sm text-blue-900 font-medium ${monospace ? 'font-mono text-xs break-all' : 'truncate'}`}>
        {value || 'N/A'}
      </p>
    </div>
  );
}
