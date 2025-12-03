import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Minimal header-only homepage UI per spec
// White background, black text; logo left; nav links; search icon; two CTA buttons; top-right login
const Homepage = () => {
  const [signupOpen, setSignupOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };
  
  const getDashboardPath = (role) => {
    switch (role) {
      case 'brand':
        return '/brand/dashboard';
      case 'influencer':
        return '/influencer/dashboard';
      case 'ugc_creator':
        return '/ugc/dashboard';
      case 'admin':
        return '/admin-dashboard';
      case 'support':
        return '/support-dashboard';
      default:
        return '/brand/dashboard';
    }
  };
  return (
    <div style={{ background: '#fff', color: '#000', minHeight: '100vh' }}>
      {/* Top utility bar removed as requested */}

      {/* Main header */}
      <header style={{ background: '#fff', borderBottom: '1px solid #eee' }}>
        <div style={{
          maxWidth: '1200px', margin: '0 auto', padding: '12px 16px',
          display: 'flex', alignItems: 'center', gap: '16px', boxSizing: 'border-box'
        }}>
          {/* Left: Logo */}
          <a href="#" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
            <span style={{
              display: 'inline-flex', width: 28, height: 28, borderRadius: '50%',
              background: '#4cc3ff', color: '#fff', alignItems: 'center', justifyContent: 'center',
              fontWeight: 700, marginRight: 8
            }}>B</span>
            <span style={{ color: '#000', fontWeight: 700 }}>Buzzaz</span>
          </a>

          {/* Center: Nav links */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: '18px', marginLeft: '24px', flex: 1 }}>
            {['Our Platform', 'Solutions', 'Features', 'Resources', 'Pricing'].map((item) => (
              <a key={item} href={`#${item.toLowerCase().replace(/\s+/g, '-')}`}
                 style={{ color: '#000', textDecoration: 'none', fontWeight: 600 }}>
                {item}
              </a>
            ))}
          </nav>

          {/* Search icon removed as requested */}

          {/* Signup/Login with hover dropdowns */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginLeft: '12px' }}>
            {!isAuthenticated ? (
              <>
                {/* Signup dropdown */}
                <div
                  style={{ position: 'relative' }}
                  onMouseEnter={() => setSignupOpen(true)}
                  onMouseLeave={() => setSignupOpen(false)}
                >
                  <button type="button" className="cta-signup" aria-haspopup="true" aria-expanded={signupOpen} aria-label="Sign up">
                    Sign up <i className="bi bi-chevron-down" aria-hidden="true"></i>
                  </button>
                  <div style={{
                    position: 'absolute', top: '110%', right: 0,
                    background: '#fff', border: '1px solid #eee', boxShadow: '0 10px 24px rgba(0,0,0,0.08)',
                    borderRadius: 12, padding: 8, minWidth: 220, zIndex: 10,
                    display: signupOpen ? 'block' : 'none'
                  }}>
                    <Link to="/register-creator" style={{ display: 'block', padding: '8px 10px', color: '#0f172a', textDecoration: 'none', borderRadius: 8 }}>As a content creator</Link>
                    <Link to="/register-brand" style={{ display: 'block', padding: '8px 10px', color: '#0f172a', textDecoration: 'none', borderRadius: 8 }}>As a business</Link>
                  </div>
                </div>

                {/* Login button */}
                <Link to="/login" className="cta-login">
                  Login
                </Link>
              </>
            ) : (
              /* User dropdown for authenticated users */
              <div
                style={{ position: 'relative' }}
                onMouseEnter={() => setUserDropdownOpen(true)}
                onMouseLeave={() => setUserDropdownOpen(false)}
              >
                <button 
                  type="button" 
                  className="cta-login" 
                  aria-haspopup="true" 
                  aria-expanded={userDropdownOpen} 
                  aria-label="User menu"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <i className="bi bi-person-circle"></i>
                  {user?.email || 'User'}
                  <i className="bi bi-chevron-down" aria-hidden="true"></i>
                </button>
                <div style={{
                  position: 'absolute', top: '110%', right: 0,
                  background: '#fff', border: '1px solid #eee', boxShadow: '0 10px 24px rgba(0,0,0,0.08)',
                  borderRadius: 12, padding: 8, minWidth: 200, zIndex: 10,
                  display: userDropdownOpen ? 'block' : 'none'
                }}>
                  <Link to={getDashboardPath(user?.role)} style={{ display: 'block', padding: '8px 10px', color: '#0f172a', textDecoration: 'none', borderRadius: 8 }}>
                    <i className="bi bi-speedometer2 me-2"></i>Dashboard
                  </Link>
                  
                  <div style={{ borderTop: '1px solid #eee', margin: '8px 0' }}></div>
                  
                  <button 
                    onClick={handleLogout}
                    style={{ 
                      display: 'block', 
                      width: '100%', 
                      padding: '8px 10px', 
                      color: '#0f172a', 
                      textDecoration: 'none', 
                      borderRadius: 8,
                      background: 'none',
                      border: 'none',
                      textAlign: 'left',
                      cursor: 'pointer'
                    }}
                  >
                    <i className="bi bi-box-arrow-right me-2"></i>Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
  </header>
      {/* Hero section */}
      <section style={{ padding: '24px 16px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{
            background: 'linear-gradient(135deg, #4cc3ff 0%, #2da3f8 100%)',
            borderRadius: 24,
            padding: '3rem 68px',
            display: 'flex',
            alignItems: 'center',
            gap: '24px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)'
          }}>
            <div style={{ flex: 1, color: '#fff' }}>
              <h1 style={{
                fontWeight: 700,
                fontSize: '42px',
                lineHeight: 1.1,
                margin: '0 0 16px'
              }}>
                All Your Social Media in One Central Hub
              </h1>
              <p style={{
                fontSize: '16px',
                lineHeight: 1.6,
                color: 'rgba(255,255,255,0.92)',
                margin: '0 0 24px'
              }}>
                Streamline your workflow: Manage, monitor, and optimize your social media presence with our all-in-one solution
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <a href="#demo" style={{
                  padding: '10px 18px',
                  borderRadius: 999,
                  background: '#fff',
                  color: '#000',
                  textDecoration: 'none',
                  fontWeight: 600,
                  border: '1px solid rgba(255,255,255,0.7)',
                  boxShadow: '0 1px 0 rgba(0,0,0,0.08)'
                }}>Get Your Demo</a>
                <a href="#trial" style={{
                  color: '#fff',
                  textDecoration: 'none',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>Start Your Trial</a>
              </div>
            </div>

            <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {/* Stylized phone mock */}
              <div style={{ position: 'relative', transform: 'rotate(-2deg)', marginRight: '24px' }}>
                <div style={{
                  width: 260,
                  height: 470,
                  borderRadius: 36,
                  background: '#101216',
                  boxShadow: '0 18px 40px rgba(0,0,0,0.35)',
                  padding: '14px',
                  position: 'relative'
                }}>
                  {/* phone notch */}
                  <div style={{ position: 'absolute', top: 8, left: '50%', transform: 'translateX(-50%)', width: 94, height: 6, background: '#1e222b', borderRadius: 6 }} />
                  {/* phone screen */}
                  <div style={{
                    background: 'linear-gradient(180deg, #f7f9fc 0%, #eef3fb 100%)',
                    borderRadius: 24,
                    height: '100%',
                    overflow: 'hidden',
                    position: 'relative'
                  }}>
                    {/* header card */}
                    <div style={{ position: 'absolute', top: 18, left: 14, right: 14, background: '#ffffff', borderRadius: 12, boxShadow: '0 6px 18px rgba(0,0,0,0.08)', padding: 10 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ width: 26, height: 26, borderRadius: '50%', background: '#4cc3ff' }} />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 700, fontSize: 12, color: '#0f172a' }}>Diana Williams</div>
                          <div style={{ fontSize: 10, color: '#64748b' }}>HR @ Wayne Enterprises</div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                        {['London', 'BestService', '+ 3 tags'].map((t) => (
                          <span key={t} style={{ fontSize: 10, background: '#f1f5f9', color: '#0f172a', padding: '4px 7px', borderRadius: 999 }}>{t}</span>
                        ))}
                      </div>
                    </div>

                    {/* middle card */}
                    <div style={{ position: 'absolute', top: 128, left: 14, right: 14, background: '#ffffff', borderRadius: 12, boxShadow: '0 6px 18px rgba(0,0,0,0.08)', padding: 10 }}>
                      <div style={{ fontWeight: 700, fontSize: 12, color: '#0f172a', marginBottom: 6 }}>Looking for an Expert</div>
                      <div style={{ fontSize: 11, color: '#334155' }}>B2B SaaS BizDev Who's worked with Channel Partners</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, color: '#64748b', fontSize: 10 }}>
                        <span>Applied by Alex and 29 others</span>
                        <span style={{ width: 3, height: 3, borderRadius: '50%', background: '#cbd5e1' }} />
                        <span>349 views</span>
                      </div>
                    </div>

                    {/* chat footer bubble */}
                    <div style={{ position: 'absolute', bottom: 18, left: 14, right: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ width: 22, height: 22, borderRadius: '50%', background: '#93c5fd' }} />
                        <span style={{ fontSize: 11, color: '#0f172a', background: '#ffffff', borderRadius: 999, padding: '5px 9px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>Hey!</span>
                      </div>
                      <span style={{ fontSize: 10, color: '#64748b' }}>Nick is the CMO at Intech Inc.</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating overlays around phone */}
              <div style={{ position: 'absolute', right: -30, top: '18%', background: '#ffffff', borderRadius: 14, padding: '10px 12px', boxShadow: '0 10px 28px rgba(0,0,0,0.18)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 24, height: 24, borderRadius: '50%', background: '#4cc3ff' }} />
                <span style={{ fontWeight: 600, color: '#0f172a' }}>Hey!</span>
              </div>
              
            </div>
          </div>
        </div>
      </section>{/* Brands trust row */}
      <section style={{ padding: '40px 16px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', textAlign: 'center' }}>
          <div style={{ color: '#0f172a', fontWeight: 700, fontSize: '18px' }}>
            Trusted by Leading Brands in 70+ Countries
          </div>
          <div style={{
            marginTop: '25px',
            display: 'grid',
            gridTemplateColumns: 'repeat(6, 1fr)',
            gap: 24,
            alignItems: 'center'
          }}>
            {['OMG', 'SAMSUNG', 'Pernod Ricard', 'WPP', 'nota bene', 'Kellogg'].map((name) => (
              <div key={name} style={{
                color: '#b3bcc7',
                opacity: 0.7,
                fontWeight: 700,
                letterSpacing: '0.5px',
                fontSize: '20px'
              }}>{name}</div>
            ))}
          </div>
        </div>
      </section>

      {/* Toolkit headline + description */}
      <section style={{ padding: '36px 16px', marginTop: '10px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{
            fontSize: '32px',
            fontWeight: 700,
            color: '#0f172a',
            lineHeight: 1.25
          }}>
            The Ultimate Toolkit for Influencer Marketing & Social Media Engagement
          </h2>
          <p style={{
            marginTop: '25px',
            color: '#64748b',
            fontSize: '15px'
          }}>
            Discover top influencers, manage impactful campaigns, and gain actionable insights to elevate your brand's online presence
          </p>
        </div>
      </section>

      {/* Solutions cards section */}
      <section style={{ padding: '40px 16px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 24
          }}>
            {[{
              title: 'Influencer Marketing',
              desc: 'Discover influencers and manage end-to-end campaigns at scale.'
            }, {
              title: 'Social Media Management',
              desc: 'Engage with consumers across social platforms and grow your brand.'
            }, {
              title: 'Social Listening',
              desc: 'Understand your consumers, your brand, your market and your competitors.'
            }].map((card, idx) => (
              <div key={card.title} style={{
                background: '#ffffff',
                borderRadius: 24,
                padding: 55,
                boxShadow: '0 24px 40px rgba(0,0,0,0.06)',
                border: '1px solid #f1f5f9'
              }}>
                {/* Icon blob + placeholder icon */}
                <div style={{ position: 'relative', height: 40, marginBottom: 12 }}>
                  <span style={{
                    position: 'absolute', left: 0, top: 0,
                    width: 42, height: 28, borderRadius: 16,
                    background: 'rgba(76,195,255,0.25)'
                  }} />
                  <span style={{
                    position: 'absolute', left: 12, top: 6,
                    width: 26, height: 26, borderRadius: '50%',
                    background: '#4cc3ff'
                  }} />
                </div>
                <div style={{ fontWeight: 700, fontSize: '22px', color: '#0f172a' }}>{card.title}</div>
                <p style={{ marginTop: 10, color: '#334155', lineHeight: 1.7 }}>
                  {card.desc}
                </p>
                <a href="#" style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  marginTop: 18, color: '#2da3f8', textDecoration: 'none', fontWeight: 700
                }}>
                  Learn More
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Discover section (two-column layout) */}
      <section style={{ padding: '60px 16px' }}>
        <div style={{
          maxWidth: '1200px', margin: '0 auto',
          display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 40, alignItems: 'center'
        }}>
          <div style={{ position: 'relative' }}>
            <div style={{
              background: 'linear-gradient(90deg, rgba(76,195,255,0.20) 0%, rgba(45,163,248,0.18) 100%)',
              borderRadius: 24, padding: 18, boxShadow: '0 24px 40px rgba(0,0,0,0.06)',
              display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 16
            }}>
              <div style={{ background: '#ffffff', borderRadius: 16, padding: 14, boxShadow: '0 8px 20px rgba(0,0,0,0.08)' }}>
                <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: 12 }}>Filters</div>
                <div style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 12, color: '#64748b', marginBottom: 6 }}>Social Network</div>
                  <span style={{ fontSize: 11, background: '#f1f5f9', color: '#1f2937', padding: '6px 10px', borderRadius: 999 }}>instagram</span>
                </div>
                <div style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 12, color: '#64748b', marginBottom: 6 }}>Followers</div>
                  <span style={{ fontSize: 11, background: '#f1f5f9', color: '#1f2937', padding: '6px 10px', borderRadius: 999 }}>From 10k To 150k</span>
                </div>
                <div style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 12, color: '#64748b', marginBottom: 6 }}>Engagement</div>
                  <span style={{ fontSize: 11, background: '#f1f5f9', color: '#1f2937', padding: '6px 10px', borderRadius: 999 }}>High</span>
                </div>
                <div style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 12, color: '#64748b', marginBottom: 6 }}>Keywords on Post</div>
                  <span style={{ fontSize: 11, background: '#f1f5f9', color: '#1f2937', padding: '6px 10px', borderRadius: 999 }}>Beauty, Fashion</span>
                </div>
                <div style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 12, color: '#64748b', marginBottom: 6 }}>Brand Affinity</div>
                  <span style={{ fontSize: 11, background: '#f1f5f9', color: '#1f2937', padding: '6px 10px', borderRadius: 999 }}>Positive</span>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: '#64748b', marginBottom: 6 }}>More Filters</div>
                  <span style={{ fontSize: 11, background: '#f1f5f9', color: '#1f2937', padding: '6px 10px', borderRadius: 999 }}>Email Address</span>
                </div>
              </div>

              <div style={{ position: 'relative' }}>
                <div style={{ background: '#ffffff', borderRadius: 16, padding: 10, boxShadow: '0 8px 20px rgba(0,0,0,0.08)' }}>
                  {[
                    { name: 'Mira Calzoni', followers: '3.1k followers' },
                    { name: 'Alfredo Stanton', followers: '7.8k followers' },
                    { name: 'Cristofer Madsen', followers: '1.2M followers' },
                    { name: 'Erin Gouse', followers: '8.2k followers' },
                    { name: 'Jakob Bothman', followers: '3.1k followers' },
                  ].map((it) => (
                    <div key={it.name} style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#ffffff', borderRadius: 12, padding: '8px 10px', boxShadow: '0 6px 16px rgba(0,0,0,0.06)', marginBottom: 8 }}>
                      <span style={{ width: 26, height: 26, borderRadius: '50%', background: '#4cc3ff' }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: 13, color: '#0f172a' }}>{it.name}</div>
                        <div style={{ fontSize: 11, color: '#64748b' }}>{it.followers}</div>
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{
                  position: 'absolute', left: 10, top: 70,
                  right: 10, background: '#ffffff', borderRadius: 14,
                  boxShadow: '0 16px 28px rgba(0,0,0,0.12)', padding: '10px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ width: 26, height: 26, borderRadius: '50%', background: '#111', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 12 }}>IG</span>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 13, color: '#0f172a' }}>Jessica Taylor</div>
                      <div style={{ fontSize: 11, color: '#64748b' }}>9,57k followers</div>
                    </div>
                  </div>
                  <a href="#unlock" style={{
                    padding: '6px 12px', borderRadius: 999, background: '#6d63ff', color: '#fff', textDecoration: 'none', fontWeight: 700
                  }}>Unlock</a>
                </div>

                <span style={{
                  position: 'absolute', left: 18, bottom: -12,
                  background: '#4cc3ff', color: '#fff', fontWeight: 700,
                  padding: '8px 14px', borderRadius: 999, boxShadow: '0 10px 24px rgba(76,195,255,0.48)'
                }}>+700M profiles</span>
              </div>
            </div>
          </div>

          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#6b7280', letterSpacing: '1px' }}>INFLUENCER DISCOVER</div>
            <h3 style={{
              marginTop: 10, fontSize: '34px', fontWeight: 700,
              color: '#0f172a', lineHeight: 1.25
            }}>Discover the best influencers for you</h3>
            <p style={{ marginTop: 12, color: '#64748b', fontSize: '15px' }}>
              Our influencer discovery tool tracks 200M+ global creators, making it easy to pinpoint the right influencers for your brand campaign or agency roster.
            </p>
            <a href="#discover-features" style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              marginTop: 16, color: '#2da3f8', textDecoration: 'none', fontWeight: 700
            }}>Explore our Discover features</a>
          </div>
        </div>
      </section>

      
      {/* IRM section (two-column layout) */}
      <section style={{ padding: '60px 16px' }}>
        <div style={{
          maxWidth: '1200px', margin: '0 auto',
          display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 40, alignItems: 'center'
        }}>
          {/* Left: copy */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#6b7280', letterSpacing: '1px' }}>INFLUENCER RELATIONSHIP MANAGEMENT</div>
            <h3 style={{
              marginTop: 10, fontSize: '34px', fontWeight: 700,
              color: '#0f172a', lineHeight: 1.25
            }}>Manage your influencer relationships</h3>
            <p style={{ marginTop: 12, color: '#64748b', fontSize: '15px' }}>
              Create your influencer database and store the information you need, from contact details to firstparty data with custom fields. Record every influencer activity, analyze audiences and monitor communications via automated email tracking.
            </p>
            <a href="#irm-features" style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              marginTop: 16, color: '#2da3f8', textDecoration: 'none', fontWeight: 700
            }}>Explore our IRM features <span aria-hidden></span></a>
          </div>

          {/* Right: UI collage */}
          <div>
            <div style={{
              background: 'linear-gradient(90deg, rgba(76,195,255,0.18) 0%, rgba(45,163,248,0.16) 100%)',
              borderRadius: 24, padding: 16, boxShadow: '0 24px 40px rgba(0,0,0,0.06)'
            }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {/* Creator list card */}
                <div style={{ background: '#ffffff', borderRadius: 16, padding: 12, boxShadow: '0 8px 20px rgba(0,0,0,0.08)' }}>
                  {[ 'George Aminoff', 'Marilyn Donin', 'Mira Calzoni', 'Cristofer Madsen', 'Jakob Dias', 'Adison Carder' ].map((name) => (
                    <div key={name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ width: 24, height: 24, borderRadius: '50%', background: '#4cc3ff' }} />
                        <div style={{ fontWeight: 600, fontSize: 12, color: '#0f172a' }}>{name}</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#64748b' }}>
                        <i className="bi bi-instagram" />
                        <i className="bi bi-youtube" />
                        <i className="bi bi-twitter" />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Stats + email card */}
                <div style={{ position: 'relative', background: '#ffffff', borderRadius: 16, padding: 12, boxShadow: '0 8px 20px rgba(0,0,0,0.08)' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div style={{ background: '#f8fafc', borderRadius: 12, padding: 10 }}>
                      <div style={{ fontSize: 11, color: '#64748b', marginBottom: 6 }}>Audience Ages</div>
                      <div style={{ height: 90, background: 'linear-gradient(180deg, #e5f2ff 0%, #fff 100%)', borderRadius: 10 }} />
                    </div>
                    <div style={{ background: '#f8fafc', borderRadius: 12, padding: 10 }}>
                      <div style={{ fontSize: 11, color: '#64748b', marginBottom: 6 }}>Top Countries</div>
                      <div style={{ height: 90, background: 'linear-gradient(180deg, #f3e8ff 0%, #fff 100%)', borderRadius: 10 }} />
                    </div>
                  </div>
                  <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div style={{ background: '#f8fafc', borderRadius: 12, padding: 10 }}>
                      <div style={{ fontSize: 11, color: '#64748b', marginBottom: 6 }}>Average Activity Split</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        {[9576,3816,798].map((n, idx) => (
                          <div key={idx} style={{ background: '#fff', borderRadius: 999, padding: '8px 12px', boxShadow: '0 1px 0 rgba(0,0,0,0.06)', fontSize: 11, color: '#0f172a' }}>{n}</div>
                        ))}
                      </div>
                    </div>
                    <div style={{ background: '#f8fafc', borderRadius: 12, padding: 10 }}>
                      <div style={{ fontSize: 11, color: '#64748b', marginBottom: 6 }}>Influencer Information</div>
                      <div style={{ fontSize: 12, color: '#334155', lineHeight: 1.6, marginBottom: 20 }}>
                        <div>Phone: +12 345 678 900</div>
                        <div>Email: mrbeast@info.com</div>
                      </div>
                      <a href="#email" style={{
                        // position: 'absolute', right: 10, top: 10,
                        padding: '8px 8px', borderRadius: 999, background: 'rgb(44 159 242)', color: '#fff', textDecoration: 'none', fontWeight: 700
                      }}>Send email</a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>{/* Campaign section (two-column layout) */}
      <section style={{ padding: '60px 16px' }}>
        <div style={{
          maxWidth: '1200px', margin: '0 auto',
          display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 40, alignItems: 'center'
        }}>
          {/* Left: UI collage */}
          <div>
            <div style={{
              background: 'linear-gradient(90deg, rgba(76,195,255,0.18) 0%, rgba(45,163,248,0.16) 100%)',
              borderRadius: 24, padding: 16, boxShadow: '0 24px 40px rgba(0,0,0,0.06)'
            }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: 12, alignItems: 'stretch' }}>
                {/* Large tile */}
                <div style={{ background: 'linear-gradient(180deg, #f1f5f9 0%, #ffffff 100%)', borderRadius: 16, height: 160, overflow: 'hidden' }}>
                  <img
                    src="https://images.unsplash.com/photo-1517260739337-8fe8d36cfb36?auto=format&fit=crop&w=800&q=60"
                    alt="Woman taking selfie"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    referrerPolicy="no-referrer"
                    crossOrigin="anonymous"
                    onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1519345182560-3f2917c472ef?auto=format&fit=crop&w=800&q=60'; }}
                  />
                </div>

                {/* Chat bubble card */}
                <div style={{ background: '#ffffff', borderRadius: 16, padding: 12, boxShadow: '0 8px 20px rgba(0,0,0,0.08)', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ fontWeight: 700, fontSize: 12, color: '#334155' }}>Ann Levine <span style={{ color: '#94a3b8' }}>(annlevine@agentsus.com)</span></div>
                  <div style={{ fontSize: 12, color: '#64748b' }}>Hello â€” we'd love to have you on our campaign. You up to? Let's talk!</div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 11, color: '#64748b' }}>(Influencer.Name)</span>
                    <a href="#send-to-all" style={{ padding: '6px 12px', borderRadius: 999, background: '#4cc3ff', color: '#fff', textDecoration: 'none', fontWeight: 700 }}>Send to all</a>
                  </div>
                </div>

                {/* Medium tile with Pay influencer */}
                <div style={{ position: 'relative', background: 'linear-gradient(180deg, #f7f9fc 0%, #eef3fb 100%)', borderRadius: 16, height: 160 }}>
                  <img
                    src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=60"
                    alt="Woman using phone"
                    style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 16 }}
                  />
                  <a href="#pay-influencer" style={{ position: 'absolute', right: 10, bottom: 10, padding: '8px 12px', borderRadius: 999, background: '#6d63ff', color: '#fff', textDecoration: 'none', fontWeight: 700 }}>Pay influencer</a>
                </div>

                {/* Shoe tile with plane button */}
                <div style={{ position: 'relative', background: 'linear-gradient(180deg, #f7f7fb 0%, #ffffff 100%)', borderRadius: 16, height: 140 }}>
                  <img
                    src="https://images.unsplash.com/photo-1520813792240-56fc4a3765a7?auto=format&fit=crop&w=800&q=60"
                    alt="Woman holding smartphone"
                    style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 16 }}
                  />
                  <button style={{ position: 'absolute', right: 10, top: 10, width: 32, height: 32, border: 'none', borderRadius: 999, background: '#4cc3ff', color: '#fff', boxShadow: '0 10px 24px rgba(76,195,255,0.48)', cursor: 'pointer' }}>
                    <i className="bi bi-send-fill" />
                  </button>
                </div>

                {/* Coupon tile */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#eef3fb', color: '#6d63ff', borderRadius: 999, padding: '10px 14px', fontWeight: 700 }}>
                  <span style={{ display: 'inline-flex', width: 28, height: 28, borderRadius: '50%', background: '#4cc3ff', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                    <i className="bi bi-send" />
                  </span>
                  MADDIE20
                </div>

                {/* Small image tile */}
                <div style={{ background: 'linear-gradient(180deg, #f1f5f9 0%, #ffffff 100%)', borderRadius: 16, height: 140, overflow: 'hidden' }}>
                  <img
                    src="https://images.unsplash.com/photo-1519345182560-3f2917c472ef?auto=format&fit=crop&w=800&q=60"
                    alt="Woman with phone"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>
              </div>

              {/* Bottom payment card */}
              <div style={{ marginTop: 12, marginLeft: -140, width: 'calc(100% + 135px)', background: '#ffffff', borderRadius: 20, padding: 14, boxShadow: '0 16px 28px rgba(0,0,0,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ width: 32, height: 32, borderRadius: '50%', background: '#4cc3ff' }} />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13, color: '#0f172a' }}>Maddie Carter</div>
                    <div style={{ fontSize: 11, color: '#64748b' }}>2 stories Â· 1 reel</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ fontWeight: 700, color: '#334155' }}>$3,816</div>
                  <span style={{ fontSize: 12, background: '#eafff5', color: '#10b981', padding: '6px 10px', borderRadius: 999 }}>Accepted</span>
                  <span style={{ fontSize: 12, background: '#eef3fb', color: '#6d63ff', padding: '6px 10px', borderRadius: 999 }}>Ready to pay</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right: copy */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#6b7280', letterSpacing: '1px' }}>INFLUENCER CAMPAIGN MANAGEMENT</div>
            <h3 style={{
              marginTop: 10, fontSize: '34px', fontWeight: 700,
              color: '#0f172a', lineHeight: 1.25
            }}>Scale your campaign efforts</h3>
            <p style={{ marginTop: 12, color: '#64748b', fontSize: '15px' }}>
              Manage campaigns at scale optimizing manual processes like outreach or payments. Create influencer programs to send products to influencers, track coupon discounts and sales.
            </p>
            <a href="#campaign-features" style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              marginTop: 16, color: '#2da3f8', textDecoration: 'none', fontWeight: 700
            }}>Explore our Campaign features</a>
          </div>
        </div>
      </section>

      {/* Team-loving platform banner */}
      <section style={{ padding: '60px 16px', background: 'rgba(76,195,255,0.12)', marginBottom: '60px' }}>
        <div style={{
          maxWidth: '1200px', margin: '0 auto',
          display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 40, alignItems: 'center'
        }}>
          {/* Left: overlapped visual cards */}
          <div style={{ position: 'relative', height: 340 }}>
            {/* Map card */}
            <div style={{
              position: 'absolute', left: 0, top: 28,
              width: 430, height: 260,
              background: '#ffffff', borderRadius: 24,
              boxShadow: '0 24px 40px rgba(0,0,0,0.06)', padding: 16,
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <div style={{
                width: '100%', height: '100%', borderRadius: 16,
                background: '#ffffff',
                position: 'relative', overflow: 'hidden'
              }}>
                {/* Heart icon */}
                <span style={{
                  position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)',
                  width: 34, height: 34, borderRadius: '50%', background: '#4cc3ff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', fontSize: 16, boxShadow: '0 6px 16px rgba(0,0,0,0.08)'
                }}>â™¥</span>

                {/* World map (realistic silhouette with grid) */}
                <svg viewBox="0 0 430 260" preserveAspectRatio="xMidYMid meet" style={{ position: 'absolute', inset: 0 }}>
                  <defs>
                    <linearGradient id="ocean" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f7fbff" />
                      <stop offset="100%" stopColor="#eef6fc" />
                    </linearGradient>
                  </defs>
                  {/* Ocean background */}
                  <rect x="0" y="0" width="430" height="260" rx="16" fill="url(#ocean)" />
                  {/* Latitude/Longitude grid */}
                  {Array.from({ length: 10 }, (_, i) => (
                    <line key={`v-${i}`} x1={(i + 1) * 39} y1={0} x2={(i + 1) * 39} y2={260} stroke="#e8f1fb" strokeWidth={1} strokeDasharray="3 3" />
                  ))}
                  {Array.from({ length: 5 }, (_, i) => (
                    <line key={`h-${i}`} x1={0} y1={(i + 1) * 43} x2={430} y2={(i + 1) * 43} stroke="#e8f1fb" strokeWidth={1} strokeDasharray="3 3" />
                  ))}

                  {/* Continents (detailed silhouettes) */}
                  <g fill="#c7cfe0" stroke="#b2bfd3" strokeWidth="0.7" vectorEffect="non-scaling-stroke">
                    {/* North America */}
                    <path d="M40 90 C60 70 95 65 125 78 C145 86 160 98 168 112 C152 122 130 126 110 125 C92 123 76 115 62 104 C50 98 42 94 40 90 Z" />
                    {/* Greenland */}
                    <path d="M90 36 C105 32 120 34 132 42 C124 50 110 52 98 48 C92 46 90 42 90 36 Z" />
                    {/* Central & South America */}
                    <path d="M165 120 C174 128 182 140 188 152 C190 170 182 192 170 210 C158 226 144 238 136 240 C136 222 142 204 148 188 C152 176 152 162 146 148 C150 136 156 128 165 120 Z" />
                    {/* Europe */}
                    <path d="M208 82 C226 74 246 74 262 80 C276 88 286 98 292 108 C280 114 264 116 250 112 C236 108 224 98 214 90 C210 86 208 84 208 82 Z" />
                    {/* Africa */}
                    <path d="M238 106 C252 114 270 130 280 148 C280 166 270 184 258 194 C246 196 236 188 232 174 C234 160 236 142 238 126 C238 118 238 112 238 106 Z" />
                    {/* Middle East */}
                    <path d="M274 126 C288 132 300 140 304 148 C300 154 292 160 284 160 C276 158 270 150 270 142 C270 136 272 130 274 126 Z" />
                    {/* Asia */}
                    <path d="M292 90 C318 88 346 96 368 110 C384 120 396 134 398 144 C384 150 364 150 346 144 C330 138 316 128 304 116 C296 108 292 98 292 90 Z" />
                    {/* Southeast Asia & Indonesia */}
                    <path d="M348 150 C358 156 366 166 372 174 C366 178 356 178 348 172 C344 166 344 158 348 150 Z" />
                    {/* Japan */}
                    <path d="M378 114 C386 120 392 128 392 134 C386 136 378 132 374 126 C374 120 376 116 378 114 Z" />
                    {/* Australia */}
                    <path d="M360 190 C374 198 386 210 392 220 C382 226 366 224 356 214 C352 206 354 198 360 190 Z" />
                    {/* New Zealand */}
                    <path d="M404 210 C410 214 414 220 414 224 C408 224 402 220 400 216 C400 212 402 210 404 210 Z" />
                    {/* Madagascar */}
                    <path d="M286 180 C292 184 296 190 296 194 C290 196 284 192 282 188 C282 184 284 182 286 180 Z" />
                  </g>
                </svg>

                {/* Avatar markers */}
                <span style={{ position: 'absolute', left: 60, top: 80, width: 40, height: 40, borderRadius: '50%', background: '#e2f6ff', boxShadow: '0 6px 16px rgba(0,0,0,0.08)' }} />
                <span style={{ position: 'absolute', left: 175, top: 155, width: 42, height: 42, borderRadius: '50%', background: '#e2f6ff', boxShadow: '0 6px 16px rgba(0,0,0,0.08)' }} />
                <span style={{ position: 'absolute', left: 320, top: 105, width: 36, height: 36, borderRadius: '50%', background: '#e2f6ff', boxShadow: '0 6px 16px rgba(0,0,0,0.08)' }} />
                <span style={{ position: 'absolute', left: 365, top: 205, width: 36, height: 36, borderRadius: '50%', background: '#e2f6ff', boxShadow: '0 6px 16px rgba(0,0,0,0.08)' }} />
                <span style={{ position: 'absolute', left: 240, top: 120, width: 34, height: 34, borderRadius: '50%', background: '#e2f6ff', boxShadow: '0 6px 16px rgba(0,0,0,0.08)' }} />
              </div>
            </div>

            {/* Calendar card */}
            <div style={{
              position: 'absolute', left: 250, top: 0,
              width: 310, height: 320, borderRadius: 24,
              background: 'linear-gradient(135deg, #4cc3ff 0%, #2da3f8 100%)',
              boxShadow: '0 24px 40px rgba(0,0,0,0.12)', padding: 18,
              color: '#fff'
            }}>
              <div style={{ fontWeight: 700, marginBottom: 12 }}>Calendar</div>
              <div style={{
                background: 'rgba(255,255,255,0.12)', borderRadius: 16, padding: 12,
                height: '100%'
              }}>
                {(() => {
                  const now = new Date();
                  const year = now.getFullYear();
                  const month = now.getMonth();
                  const monthName = now.toLocaleString('default', { month: 'long' });
                  const firstDay = new Date(year, month, 1).getDay(); // 0-6 (Sun-Sat)
                  const daysInMonth = new Date(year, month + 1, 0).getDate();

                  const weekdayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                  let dayCounter = 1;
                  const weeks = [];

                  for (let w = 0; w < 6; w++) {
                    const cells = [];
                    for (let d = 0; d < 7; d++) {
                      const cellIndex = w * 7 + d;
                      const isActiveCell = cellIndex >= firstDay && dayCounter <= daysInMonth;
                      const isToday = isActiveCell && dayCounter === now.getDate();
                      cells.push(
                        <div
                          key={`cell-${w}-${d}`}
                          style={{
                            height: 32,
                            borderRadius: 10,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 13,
                            fontWeight: isToday ? 800 : 600,
                            color: isToday ? '#2da3f8' : 'rgba(255,255,255,0.92)',
                            background: isActiveCell ? (isToday ? '#ffffff' : 'rgba(255,255,255,0.18)') : 'transparent',
                            boxShadow: isToday ? '0 6px 12px rgba(0,0,0,0.18)' : 'none'
                          }}
                        >
                          {isActiveCell ? dayCounter : ''}
                        </div>
                      );
                      if (isActiveCell) dayCounter++;
                    }
                    weeks.push(
                      <div
                        key={`week-${w}`}
                        style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6, marginBottom: 6 }}
                      >
                        {cells}
                      </div>
                    );
                    if (dayCounter > daysInMonth) break;
                  }

                  return (
                    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                      <div style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        marginBottom: 8
                      }}>
                        <div style={{ fontWeight: 800 }}>{monthName} {year}</div>
                        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.85)' }}>{now.toLocaleDateString()}</div>
                      </div>
                      <div style={{
                        display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6, marginBottom: 6,
                        fontSize: 11, color: 'rgba(255,255,255,0.85)'
                      }}>
                        {weekdayLabels.map((w) => (
                          <div key={`wd-${w}`} style={{ textAlign: 'center', fontWeight: 700 }}>{w}</div>
                        ))}
                      </div>
                      <div style={{ flex: 1 }}>
                        {weeks}
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>

          {/* Right: copy and CTAs */}
          <div>
            <h3 style={{
              marginTop: 0, fontSize: '34px', fontWeight: 700,
              color: '#0f172a', lineHeight: 1.25
            }}>Looking for a Platform Your Team Will Love?</h3>
            <p style={{ marginTop: 12, color: '#64748b', fontSize: '15px' }}>
              Discover why professionals worldwide trust us as their top-rated solution.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 12 }}>
              <a href="#demo" style={{
                padding: '10px 18px', borderRadius: 999, background: '#2da3f8',
                color: '#fff', textDecoration: 'none', fontWeight: 700,
                boxShadow: '0 1px 0 rgba(0,0,0,0.08)'
              }}>Get Your Demo</a>
              <a href="#trial" style={{
                color: '#0f172a', textDecoration: 'none', fontWeight: 700,
                display: 'inline-flex', alignItems: 'center', gap: 6
              }}>Start Your Trial</a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ background: '#0d0e10', color: '#fff', padding: '60px 16px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr repeat(6, 1fr)', gap: 40 }}>
            {/* Brand */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: 18 }}>
                <span style={{ display: 'inline-flex', width: 30, height: 30, borderRadius: '50%', background: '#4cc3ff', color: '#fff', alignItems: 'center', justifyContent: 'center', fontWeight: 800, marginRight: 10 }}>B</span>
                <span style={{ fontWeight: 800, fontSize: 18 }}>Buzzaz</span>
              </div>
              <div style={{ color: '#cbd5e1', fontSize: 13, lineHeight: 1.7 }}>The toolkit for influencer marketing and social media engagement.</div>
            </div>

            {/* Solutions */}
            <div>
              <div style={{ fontSize: 12, fontWeight: 800, color: '#e5e7eb', letterSpacing: '1px', marginBottom: 12 }}>SOLUTIONS</div>
              {['Influencer Marketing', 'Social Media Management', 'Social Listening'].map((t) => (
                <a key={t} href="#" style={{ display: 'block', color: '#cbd5e1', textDecoration: 'none', marginBottom: 10 }}>{t}</a>
              ))}
            </div>

            {/* Our Platform */}
            <div>
              <div style={{ fontSize: 12, fontWeight: 800, color: '#e5e7eb', letterSpacing: '1px', marginBottom: 12 }}>OUR PLATFORM</div>
              {['Influencer Discover', 'Influencer Relationship', 'Campaign Manager', 'Campaign Reports', 'Social Hub', 'Monitoring'].map((t) => (
                <a key={t} href="#" style={{ display: 'block', color: '#cbd5e1', textDecoration: 'none', marginBottom: 10 }}>{t}</a>
              ))}
            </div>

            {/* Features */}
            <div>
              <div style={{ fontSize: 12, fontWeight: 800, color: '#e5e7eb', letterSpacing: '1px', marginBottom: 12 }}>FEATURES</div>
              {['Find Influencers', 'Analyze Influencers', 'Influencer Database', 'Recruitment', 'Outreach', 'Manage Campaigns', 'Seeding', 'Payments', 'Measure Results', 'Inbox'].map((t) => (
                <a key={t} href="#" style={{ display: 'block', color: '#cbd5e1', textDecoration: 'none', marginBottom: 10 }}>{t}</a>
              ))}
            </div>

            {/* Use Cases */}
            <div>
              <div style={{ fontSize: 12, fontWeight: 800, color: '#e5e7eb', letterSpacing: '1px', marginBottom: 12 }}>USE CASES</div>
              {['Brands', 'Agencies', 'Eâ€‘Commerce'].map((t) => (
                <a key={t} href="#" style={{ display: 'block', color: '#cbd5e1', textDecoration: 'none', marginBottom: 10 }}>{t}</a>
              ))}
            </div>

            {/* Resources */}
            <div>
              <div style={{ fontSize: 12, fontWeight: 800, color: '#e5e7eb', letterSpacing: '1px', marginBottom: 12 }}>RESOURCES</div>
              {['Influencer Marketing', 'Blog', 'Knowledge Base', 'Videos', 'Ebooks', 'Guides', 'Case Studies', 'Success Stories', 'Webinars'].map((t) => (
                <a key={t} href="#" style={{ display: 'block', color: '#cbd5e1', textDecoration: 'none', marginBottom: 10 }}>{t}</a>
              ))}
            </div>

            {/* Customers */}
            <div>
              <div style={{ fontSize: 12, fontWeight: 800, color: '#e5e7eb', letterSpacing: '1px', marginBottom: 12 }}>CUSTOMERS</div>
              {['Contact Us', 'Change log', 'Feature requests'].map((t) => (
                <a key={t} href="#" style={{ display: 'block', color: '#cbd5e1', textDecoration: 'none', marginBottom: 10 }}>{t}</a>
              ))}
            </div>


          </div>

          <div style={{ marginTop: 30, borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 16, color: '#9aa3b2', fontSize: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Â© {new Date().getFullYear()} Buzzaz. All rights reserved.</span>
            <div style={{ display: 'flex', gap: 16 }}>
              <a href="#" style={{ color: '#cbd5e1', textDecoration: 'none' }}>Privacy</a>
              <a href="#" style={{ color: '#cbd5e1', textDecoration: 'none' }}>Terms</a>
            </div>
          </div>
        </div>
      </footer>
      
    </div>
  );
};

export default Homepage;
