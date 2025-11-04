import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Zap, BarChart3, Lock, Infinity, User, LogOut } from 'lucide-react';
import achievrLogo from '../assets/achievr-logo.png';
import convocationHat from '../assets/convocation-hat (1).png';

export default function PremiumAchievRLanding({ user, setUser }) {
  const navigate = useNavigate();
  const [scrollY, setScrollY] = useState(0);
  const [hoveredFeature, setHoveredFeature] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setShowDropdown(false);
    navigate('/');
  };

  const handleDashboardClick = () => {
    if (user) {
      const route = user.role === 'student' ? '/dashboard' : `/${user.role}`;
      navigate(route);
    } else {
      navigate('/login');
    }
  };

  return (
    <div className="bg-white text-gray-900 overflow-hidden font-sans">

      {/* Navigation */}
      <nav className="fixed w-full z-50 backdrop-blur-md bg-white/80 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-8 py-0 flex justify-between items-center">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
            <img src={achievrLogo} alt="AchievR Logo" className="h-22 w-auto" />
          </div>
          <div className="flex gap-8 items-center">
            <button 
              className="text-sm text-gray-600 hover:text-gray-900 transition duration-300 rounded-b-full"
              onClick={handleDashboardClick}
            >
              Dashboard
            </button>
            
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-orange-600 to-orange-500 text-white rounded-none hover:from-orange-700 hover:to-orange-600 transition duration-300 text-sm font-medium shadow-lg shadow-orange-500/20 rounded-sm"
                >
                  <User size={16} />
                  <span>{user.name}</span>
                </button>
                
                {showDropdown && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-2xl border border-gray-200 py-2 z-50">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-sm font-semibold text-gray-900">{user.name}</p>
                      <p className="text-xs text-gray-600 mt-0.5">{user.email}</p>
                      <p className="text-xs text-orange-600 font-medium mt-1 capitalize">{user.role}</p>
                    </div>
                    <button
                      onClick={handleDashboardClick}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-orange-50 transition duration-200 flex items-center gap-2"
                    >
                      <User size={14} />
                      Dashboard
                    </button>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition duration-200 flex items-center gap-2"
                    >
                      <LogOut size={14} />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button 
                onClick={() => navigate('/login')}
                className="px-6 py-2 bg-gradient-to-r from-orange-600 to-orange-500 text-white rounded-none hover:from-orange-700 hover:to-orange-600 transition duration-300 text-sm font-medium shadow-lg shadow-orange-500/20 rounded-xl"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Hero - White Background */}
      <section className="pt-24 pb-24 px-8 relative overflow-hidden bg-white">
        <div
          className="absolute top-20 right-0 w-96 h-96 bg-gradient-to-br from-orange-100 to-transparent rounded-full blur-3xl opacity-40 animate-pulse"
          style={{
            transform: `translateY(${scrollY * 0.1}px)`,
            animation: 'float 6s ease-in-out infinite'
          }}
        />
        <div
          className="absolute top-40 left-20 w-72 h-72 bg-gradient-to-br from-orange-200/40 to-transparent rounded-full blur-3xl opacity-30"
          style={{
            transform: `translateY(${scrollY * 0.15}px)`,
            animation: 'float 8s ease-in-out infinite 1s'
          }}
        />

        <div className="max-w-full mx-auto relative z-10">
          {/* Grid Layout: 2/3 Text Left, 1/3 Hat Right */}
          <div className="grid grid-cols-3 gap-0 items-start mb-8">

            {/* Left - Text Content - 2/3 Width */}
            <div className="col-span-2 pr-0 mt-10">
              <h2 className="text-7xl font-normal leading-[1.1] mb-0 animate-fadeInUp text-left" style={{ animationDelay: '0.1s' }}>
                <span className="block">Transform Student </span>
                <span className="block">Achievement into</span>

                <span className="block font-normal bg-gradient-to-r from-orange-700 via-orange-600 to-orange-500 bg-clip-text text-transparent">Verified Professional Value</span>
              </h2>
            </div>

            {/* Right - Hat Logo - 1/3 Width */}
            <div className="col-span-1 flex justify-center items-start animate-fadeInUp" style={{ animationDelay: '0.15s' }}>
              <img
                src={convocationHat}
                alt="Convocation Hat"
                className="h-80 w-auto drop-shadow-2xl hover:scale-110 transition duration-500"
              />
            </div>
          </div>

          {/* Bottom Section: Description & Button */}
          <div className="flex flex-col gap-6 items-center mb-8 animate-fadeInUp" style={{ animationDelay: '0.3s' }}>
            
            <button 
              onClick={() => navigate(user ? (user.role === 'student' ? '/dashboard' : `/${user.role}`) : '/register')}
              className="group inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-orange-600 to-orange-500 text-white hover:from-orange-700 hover:to-orange-600 transition duration-300 shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 hover:scale-105"
            >
              <span className="font-medium text-sm">{user ? 'Go to Dashboard' : 'Try Now'}</span>
              <ArrowRight size={16} className="group-hover:translate-x-1 transition" />
            </button>
            <p className="text-lg text-gray-600 font-normal leading-relaxed">
              India's first AI-powered student portfolio platform. Detect fake certificates in 2 seconds. Build verified skill profiles.
              <span className="block">Get discovered by top recruiters. Blockchain-certified. Built for institutions that demand authenticity.</span>
            </p>
          </div>

        </div>
      </section>

      {/* Divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-orange-300 to-transparent" />

      {/* 4 Steps Section */}
      <section className="py-32 px-8 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-5xl font-light mb-4 text-gray-900">4 Simple Steps</h2>
            <p className="text-gray-600 font-light">Get your achievement verified in minutes</p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {[
              {
                num: '01',
                title: 'Submit Achievement',
                desc: 'Upload certificate, select skills, add context'
              },
              {
                num: '02',
                title: 'Faculty Approval',
                desc: 'One-click approval with comments workflow`'
              },
              {
                num: '03',
                title: 'Get Certified',
                desc: 'QR code, shareable proof, searchable profile'
              },
              {
                num: '04',
                title: 'Share Portfolio',
                desc: 'Showcase your verified skills and achievements'
              }
            ].map((step, idx) => (
              <div key={idx} className="relative group">
                <div className="bg-gradient-to-br from-orange-50 to-white p-8 rounded-xl border-2 border-gray-200 hover:border-orange-400 transition duration-300 hover:shadow-lg transform hover:scale-105">
                  <div className="text-5xl font-bold text-orange-200 mb-4 group-hover:text-orange-400 transition">{step.num}</div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3 group-hover:text-orange-600 transition">{step.title}</h3>
                  <p className="text-gray-600 font-light leading-relaxed">{step.desc}</p>
                </div>
                {idx < 3 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2 z-10">
                    <ArrowRight size={24} className="text-orange-300 group-hover:text-orange-400 transition" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-orange-300 to-transparent" />

      {/* Problem Section - Grey Background */}
      <section className="py-32 px-8 bg-gradient-to-br from-gray-100 via-gray-50 to-gray-100">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div className="animate-slideInLeft">
              <h2 className="text-5xl font-light mb-8 leading-tight text-gray-900">
                The Problem with
                <span className="block bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent font-normal"> Traditional Verification</span>
              </h2>
              <div className="space-y-6">
                <p className="text-gray-700 font-light leading-relaxed hover:text-gray-900 transition">
                  Educational institutions lose billions annually to credential fraud. Students spend weeks on manual verification. Employers have zero trust.
                </p>
                <p className="text-gray-700 font-light leading-relaxed hover:text-gray-900 transition">
                  AchievR eliminates this friction with cryptographic certainty. Every achievement is AI-scanned, faculty-verified, and blockchain-certified within minutes.
                </p>
              </div>
            </div>
            <div className="bg-white p-12 rounded-2xl border-2 border-orange-200 shadow-xl hover:shadow-2xl transition duration-300 hover:border-orange-400 animate-slideInRight transform hover:scale-105">
              <div className="space-y-8">
                <div className="flex gap-4 group">
                  <div className="flex-shrink-0 pt-1">
                    <CheckCircle2 size={20} className="text-orange-600 group-hover:text-orange-700 transition" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 mb-1 group-hover:text-orange-700 transition">Activity Record</p>
                    <p className="text-sm text-gray-600 font-light">All activities are recorded and timestamped</p>
                  </div>
                </div>
                <div className="flex gap-4 group">
                  <div className="flex-shrink-0 pt-1">
                    <Lock size={20} className="text-orange-600 group-hover:text-orange-700 transition" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 mb-1 group-hover:text-orange-700 transition">Get Certified</p>
                    <p className="text-sm text-gray-600 font-light">Verified certificates with QR-Codes</p>
                  </div>
                </div>
                <div className="flex gap-4 group">
                  <div className="flex-shrink-0 pt-1">
                    <Zap size={20} className="text-orange-600 group-hover:text-orange-700 transition" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 mb-1 group-hover:text-orange-700 transition">Instant Deployment</p>
                    <p className="text-sm text-gray-600 font-light">From submission to certification in minutes</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-orange-300 to-transparent" />

      {/* Testimonials - Grey Background */}
      <section className="py-32 px-8 bg-gradient-to-br from-gray-100 via-white to-gray-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-5xl font-light mb-16 text-gray-900">
            Trusted by
            <span className="block bg-gradient-to-r from-orange-700 to-orange-600 bg-clip-text text-transparent font-normal"> Leading Institutions</span>
          </h2>

          <div className="grid md:grid-cols-2 gap-12">
            <div className="bg-white p-8 border-2 border-gray-300 rounded-xl hover:border-orange-400 shadow-lg hover:shadow-xl transition duration-300 transform hover:scale-105 group relative" style={{ animation: `fadeInUp 0.6s ease-out 0.2s both` }}>
              <div className="absolute top-0 left-0 w-1 h-16 bg-gradient-to-b from-orange-600 to-orange-500 rounded-l-xl" />
              <p className="text-gray-700 font-light mb-6 italic leading-relaxed pl-4 group-hover:text-gray-900 transition">
                "AchievR eliminated credential fraud in our placement process. Our hiring time dropped by 60%."
              </p>
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium text-gray-900 group-hover:bg-gradient-to-r group-hover:from-orange-700 group-hover:to-orange-600 group-hover:bg-clip-text group-hover:text-transparent transition">Dr. Priya Sharma</p>
                  <p className="text-xs text-gray-600 font-light mt-1">Director, Admissions - IIT Bombay</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-semibold bg-gradient-to-r from-orange-600 to-orange-500 bg-clip-text text-transparent uppercase tracking-wider">
                    60% faster hiring
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-8 border-2 border-gray-300 rounded-xl hover:border-orange-400 shadow-lg hover:shadow-xl transition duration-300 transform hover:scale-105 group relative" style={{ animation: `fadeInUp 0.6s ease-out 0.3s both` }}>
              <div className="absolute top-0 left-0 w-1 h-16 bg-gradient-to-b from-orange-500 to-orange-400 rounded-l-xl" />
              <p className="text-gray-700 font-light mb-6 italic leading-relaxed pl-4 group-hover:text-gray-900 transition">
                "Students love the instant verification. We've eliminated manual documentation completely."
              </p>
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium text-gray-900 group-hover:bg-gradient-to-r group-hover:from-orange-700 group-hover:to-orange-600 group-hover:bg-clip-text group-hover:text-transparent transition">Rajesh Patel</p>
                  <p className="text-xs text-gray-600 font-light mt-1">Dean of Students - BITS Pilani</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-semibold bg-gradient-to-r from-orange-500 to-orange-400 bg-clip-text text-transparent uppercase tracking-wider">
                    100% automated
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA - Dark Grey Background */}
      <section className="py-32 px-8 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-orange-600 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-orange-500 rounded-full blur-3xl animate-pulse" />
        </div>

        <div className="max-w-4xl mx-auto relative z-10 text-center">
          <h2 className="text-5xl font-light mb-6 text-white animate-fadeInUp">Ready to Transform Student Activity Records</h2>
          <p className="text-lg text-gray-300 font-light mb-8 max-w-2xl mx-auto animate-fadeInUp" style={{ animationDelay: '0.1s' }}>
            Join institutions securing their future with military-grade credential verification.
          </p>
          <button 
            onClick={() => navigate(user ? (user.role === 'student' ? '/dashboard' : `/${user.role}`) : '/register')}
            className="inline-flex items-center gap-2 px-10 py-4 bg-gradient-to-r from-orange-600 to-orange-500 text-white hover:from-orange-700 hover:to-orange-600 transition duration-300 font-medium shadow-xl shadow-orange-500/50 hover:shadow-orange-500/70 hover:scale-105 animate-fadeInUp" 
            style={{ animationDelay: '0.2s' }}
          >
            {user ? 'Go to Dashboard' : 'Request Demo'}
            <ArrowRight size={16} />
          </button>
        </div>
      </section>

      {/* Footer - White Background */}
      <footer className="border-t-2 border-gray-300 py-16 px-8 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <img src={achievrLogo} alt="AchievR Logo" className="h-8 w-auto" />
                <p className="font-light text-gray-900">ACHIEVR</p>
              </div>
              <p className="text-xs text-gray-600 font-light">Credential Verification System</p>
              <div className="flex gap-2 mt-4">
                <div className="w-2 h-2 rounded-full bg-gradient-to-r from-orange-600 to-orange-500" />
                <div className="w-2 h-2 rounded-full bg-gradient-to-r from-orange-500 to-orange-400" />
                <div className="w-2 h-2 rounded-full bg-gradient-to-r from-orange-400 to-orange-500" />
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-4">Product</p>
              <ul className="space-y-2 text-sm text-gray-600 font-light">
                <li><a href="#" className="hover:text-orange-600 transition">Features</a></li>
                <li><a href="#" className="hover:text-orange-600 transition">Pricing</a></li>
                <li><a href="#" className="hover:text-orange-600 transition">API</a></li>
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-4">Company</p>
              <ul className="space-y-2 text-sm text-gray-600 font-light">
                <li><a href="#" className="hover:text-orange-600 transition">About</a></li>
                <li><a href="#" className="hover:text-orange-600 transition">Blog</a></li>
                <li><a href="#" className="hover:text-orange-600 transition">Contact</a></li>
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-4">Legal</p>
              <ul className="space-y-2 text-sm text-gray-600 font-light">
                <li><a href="#" className="hover:text-orange-600 transition">Privacy</a></li>
                <li><a href="#" className="hover:text-orange-600 transition">Terms</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-8 text-center">
            <p className="text-xs text-gray-600 font-light">
              © 2025 AchievR. All right reserved Developed by Hack Titans
            </p>
          </div>
        </div>
      </footer>

      {/* Animations */}
      <style>{`
        @keyframes fadeInDown {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideInLeft {
          from { opacity: 0; transform: translateX(-40px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(40px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        .animate-fadeInDown { animation: fadeInDown 0.6s ease-out; }
        .animate-fadeInUp { animation: fadeInUp 0.6s ease-out; }
        .animate-slideInLeft { animation: slideInLeft 0.6s ease-out; }
        .animate-slideInRight { animation: slideInRight 0.6s ease-out; }
      `}</style>
    </div>
  );
}
