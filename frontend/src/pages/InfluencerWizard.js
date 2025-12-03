import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { influencerAPI, userAPI } from '../services/api';
import MultiSelect from '../components/MultiSelect';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import '../styles/influencerWizard.css';

const InfluencerWizard = () => {
  // Temporary feature flag to hide TikTok card
  const SHOW_TIKTOK_CONNECT = false;
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [validationResult, setValidationResult] = useState(null);
  const [youtubeInput, setYoutubeInput] = useState('');
  const [isLoadingYT, setIsLoadingYT] = useState(false);
  const [youtubeLinked, setYoutubeLinked] = useState(null);
  const [youtubeError, setYoutubeError] = useState('');
  
  // TikTok state
  const [tiktokUsername, setTiktokUsername] = useState('');
  const [isLoadingTT, setIsLoadingTT] = useState(false);
  const [tiktokLinked, setTiktokLinked] = useState(null);
  
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    // Basics
    fullName: '',
    phoneNumber: '',
    city: '',
    country: '',
    location: '', // derived City, Country for backward compatibility
    gender: '',
    dateOfBirth: '',
    // Preferences
    categories: [],
    contentTypes: [],
    languages: [],
    maritalStatus: '',
    children: '', // Yes/No
    // Pricing and deliverables
    pricingTier: '',
    priceRangeMin: '',
    priceRangeMax: '',
    deliverables: [],
    // Delivery times
    averageDeliveryTime: '',
    deliveryProductBased: '5-7 days after the product is received',
    deliveryNoProduct: '5-7 days after brief confirmation',
    deliveryOutdoorShoot: '5-7 days for editing after the shoot is done',
    deliveryRevisions: '3-4 days',
    // Social
    instagramUsername: '',
    bio: ''
  });

  const [errors, setErrors] = useState({});
  const [isValidating, setIsValidating] = useState(false);

  // Predefined options
  const categoryOptions = [
    'Beauty', 'Fashion', 'Skincare', 'Tech', 'Lifestyle', 'Food', 'Vegan Food',
    'Vegetarian Food', 'Cafes', 'Fitness', 'Haircare', 'Makeup', 'Home Decor',
    'Meal Prep', 'Self-care', 'Parenting & Family', 'Modest fashion', 'Student Life',
    'Jewelry', 'Travel', 'Health & Wellness', 'Pets', 'Cooking', 'Educational Content',
    'Comedy', 'Entertainment', 'Finance & Investment', 'Gaming & Esports', 'Sustainable Living',
    'Cars', 'Men\'s Grooming', 'Music', 'Books'
  ];

  const contentTypeOptions = [
    'Product Demo', 'Tutorial', 'ASMR', 'Review', 'How to use', 'DIY', 'Unboxing',
    'Taste Test', 'Day in my life (Vlog)', 'Comparison videos', 'Outfit styling',
    'Skits', 'POVs', 'Storytelling', 'Long Form Video', 'Podcast', 'Hauls', 'Challenges'
  ];

  const languageOptions = [
    'Urdu', 'Sindhi', 'Punjabi', 'Pashto', 'Balochi', 'Saraiki', 'English', 'Arabic', 'German'
  ];

  const countryOptions = [
    'Afghanistan', 'Albania', 'Algeria', 'Argentina', 'Australia', 'Austria', 'Bangladesh', 'Belgium', 'Brazil', 'Canada',
    'China', 'Denmark', 'Egypt', 'Finland', 'France', 'Germany', 'Greece', 'India', 'Indonesia', 'Iran',
    'Iraq', 'Ireland', 'Italy', 'Japan', 'Jordan', 'Kazakhstan', 'Kenya', 'Kuwait', 'Lebanon', 'Malaysia',
    'Mexico', 'Morocco', 'Netherlands', 'New Zealand', 'Nigeria', 'Norway', 'Pakistan', 'Philippines', 'Poland', 'Portugal',
    'Qatar', 'Russia', 'Saudi Arabia', 'Singapore', 'South Africa', 'South Korea', 'Spain', 'Sri Lanka', 'Sweden', 'Switzerland',
    'Thailand', 'Turkey', 'UAE', 'Ukraine', 'United Kingdom', 'United States', 'Vietnam', 'Yemen'
  ];

  const maritalOptions = [ 'Single', 'Married' ];
  const yesNoOptions = [ 'Yes', 'No' ];
  const pricingTierOptions = [ 'Nano', 'Micro', 'Macro', 'Mega' ];
  const deliverableOptions = [ 'Reel post', 'Story', 'Event attendance', 'Multiple Platforms' ];

  const genderOptions = [
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' }
  ];

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, user, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleMultiSelectChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    // Only validate fields that are actually displayed on this page
    const requiredFields = [
      { name: 'fullName', label: 'Full Name' },
      { name: 'phoneNumber', label: 'Phone Number' },
      { name: 'city', label: 'City' },
      { name: 'country', label: 'Country' },
      { name: 'gender', label: 'Gender' },
      { name: 'dateOfBirth', label: 'Date of Birth' },
      { name: 'maritalStatus', label: 'Marital Status' },
      { name: 'children', label: 'Children' }
    ];

    requiredFields.forEach(field => {
      const value = formData[field.name];
      if (!value || String(value).trim() === '') {
        newErrors[field.name] = `${field.label} is required`;
      }
    });

    // Instagram username is only required if YouTube and TikTok are not connected
    if (!youtubeLinked && !tiktokLinked && (!formData.instagramUsername || String(formData.instagramUsername).trim() === '')) {
      newErrors.instagramUsername = 'Instagram Username is required when YouTube and TikTok are not connected';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleValidateInstagram = async () => {
    if (!formData.instagramUsername?.trim()) {
      if (!youtubeLinked && !tiktokLinked) {
        setErrors(prev => ({ ...prev, instagramUsername: 'Instagram username is required when YouTube and TikTok are not connected' }));
      }
      return;
    }

    setIsValidating(true);
    setErrors(prev => ({ ...prev, instagramUsername: '' }));
    // Clear any previous validation result to force fresh data
    setValidationResult(null);

    try {
      console.log('Validating Instagram username with dual scrapers:', formData.instagramUsername);
      const response = await influencerAPI.validateApify(formData.instagramUsername.trim());
      
      if (response.data.success) {
        setValidationResult(response.data);
        console.log('Instagram validation successful with complete data:', {
          profile: response.data.data?.profile ? 'Available' : 'Not available',
          reels: response.data.data?.reels?.totalReels || 0,
          errors: response.data.data?.errors || []
        });
      } else {
        throw new Error(response.data.message || 'Validation failed');
      }
    } catch (error) {
      console.error('Instagram validation error:', error);
      
      // Handle specific error types
      let errorMessage = 'Failed to validate Instagram username';
      
      if (error.response?.data) {
        const errorData = error.response.data;
        
        // Handle authentication errors specifically
        if (error.response.status === 401) {
          errorMessage = 'Authentication required. Please log in again.';
          // Optionally redirect to login
          // navigate('/login');
        } else if (errorData.errorType === 'api_limit_exceeded') {
          errorMessage = 'Instagram API usage limit exceeded. Please try again later or contact support.';
        } else if (errorData.warning) {
          // Handle cached data warnings
          errorMessage = errorData.message + ' (Using cached data)';
          // Still set validation result if we got cached data
          if (errorData.success) {
            setValidationResult(errorData);
            setIsValidating(false);
            return;
          }
        } else {
          errorMessage = errorData.message || errorData.error || errorMessage;
        }
      } else if (error.code === 'NETWORK_ERROR') {
        errorMessage = 'Network error. Please check your connection and try again.';
      } else {
        errorMessage = error.message || errorMessage;
      }
      
      setErrors(prev => ({ 
        ...prev, 
        instagramUsername: errorMessage
      }));
      setValidationResult(null);
      
      // Fallback: save the Instagram username even if validation fails
      try {
        const trimmed = formData.instagramUsername.trim();
        if (trimmed) {
          await influencerAPI.updateProfile(user.uid, { instagramUsername: trimmed });
          setErrors(prev => ({ ...prev, instagramUsername: '' }));
          setSuccess('Instagram username saved. Analytics will be fetched when available.');
        }
      } catch (updateErr) {
        console.error('Fallback save of Instagram username failed:', updateErr);
      }
    } finally {
      setIsValidating(false);
    }
  };

  const handleConnectYouTube = async () => {
    if (!youtubeInput.trim()) {
      setYoutubeError('Please enter a YouTube channel URL, handle, or name');
      return;
    }

    setIsLoadingYT(true);
    setYoutubeError('');

    try {
      // Basic auth/state checks to avoid confusing failures
      if (!user?.uid) {
        setYoutubeError('User ID not found. Please log in again.');
        return;
      }
      const hasToken = !!localStorage.getItem('token');
      if (!hasToken) {
        setYoutubeError('Authentication required. Please log in again.');
        return;
      }

      let searchQuery = youtubeInput.trim();
      // Pass full URL or handle to backend for precise resolution.
      // Only normalize obvious whitespace; avoid stripping identifiers that help exact matching.
      if (/^@/.test(searchQuery)) {
        // Keep the handle with @ so backend can scrape the handle page reliably
        // e.g., @mychannel
      } else if (searchQuery.includes('youtube.com/')) {
        // Keep the full URL (channel, handle, custom /c/, or legacy /user/) for backend resolution
        // e.g., https://www.youtube.com/c/CustomName or https://www.youtube.com/@handle
      } else if (/^UC[A-Za-z0-9_-]+$/.test(searchQuery)) {
        // Raw channel ID is fine as-is
      } else {
        // Name query: leave as typed to allow backend API search
      }

      console.log('Connecting YouTube channel via backend:', searchQuery);
      console.log('User UID:', user?.uid);
      console.log('Auth token exists:', hasToken);
      
      // Use backend API to connect YouTube channel
      const response = await influencerAPI.connectYouTubeChannel(user.uid, searchQuery);
      const data = response?.data || response;

      // Accept success even if backend returns legacy payload without channelData
      if (data?.success) {
        const fallbackUrlFromId = (id) => {
          if (!id) return null;
          if (typeof id === 'string' && id.startsWith('http')) return id; // already a URL
          if (/^UC[A-Za-z0-9_-]+$/.test(id)) return `https://www.youtube.com/channel/${id}`;
          return null;
        };

        const channelData = data.channelData ? {
          channelId: data.channelData.channelId,
          channelTitle: data.channelData.channelTitle,
          channelUrl: data.channelData.channelUrl,
          subscriberCount: data.channelData.subscriberCount,
          videoCount: data.channelData.videoCount,
          viewCount: data.channelData.viewCount,
          description: data.channelData.description,
          publishedAt: data.channelData.publishedAt,
          country: data.channelData.country,
          thumbnails: data.channelData.thumbnails,
        } : {
          // Legacy backend response support
          channelId: data.channelId || null,
          channelTitle: data.channelTitle || null,
          channelUrl: data.channelUrl || fallbackUrlFromId(data.channelId),
          subscriberCount: data.subscriberCount || 0,
          videoCount: data.videoCount || 0,
          viewCount: data.viewCount || 0,
          description: data.description || '',
          publishedAt: data.publishedAt || null,
          country: data.country || null,
          thumbnails: data.thumbnails || {},
        };

        console.log('YouTube channel connected successfully:', channelData);
        // Normalize URL and numeric fields to ensure UI displays correct link and values
        const safeUrl = (url) => {
          if (!url) return url;
          let fixed = url.replace(/^https:\/\//, 'https://').replace(/^https:\//, 'https://')
                         .replace(/^http:\/\//, 'http://').replace(/^http:\//, 'http://');
          const badChannelPrefix = fixed.match(/\/channel\/(https?:\/\/.*)$/);
          if (badChannelPrefix) {
            fixed = badChannelPrefix[1];
          }
          if (/^@/.test(fixed)) {
            fixed = `https://www.youtube.com/${fixed}`;
          }
          return fixed;
        };
        const normalizedChannelData = {
          ...channelData,
          channelUrl: safeUrl(channelData.channelUrl),
          subscriberCount: Number(channelData.subscriberCount ?? 0),
          videoCount: Number(channelData.videoCount ?? 0),
          viewCount: Number(channelData.viewCount ?? 0)
        };
        // Show initial channel data with normalized counts
        setYoutubeLinked(normalizedChannelData);

        // Proactively refresh analytics then fetch detailed to ensure real counts
        try {
          await influencerAPI.refreshYouTubeAnalytics(user.uid);
        } catch (refreshErr) {
          console.warn('YouTube analytics refresh failed:', refreshErr?.message || refreshErr);
        }
        try {
          const detailedRes = await influencerAPI.getYouTubeAnalyticsDetailed(user.uid);
          const detailed = detailedRes?.data || detailedRes;
          const info = detailed?.channelInfo || {};
          if (info) {
            setYoutubeLinked(prev => ({
              ...(prev || {}),
              subscriberCount: Number(info.subscriberCount ?? prev?.subscriberCount ?? 0),
              videoCount: Number(info.videoCount ?? prev?.videoCount ?? 0),
              viewCount: Number(info.viewCount ?? prev?.viewCount ?? 0),
              channelTitle: info.channelTitle ?? prev?.channelTitle,
              description: info.description ?? prev?.description,
              channelUrl: safeUrl(info.channelUrl ?? prev?.channelUrl)
            }));
          }
        } catch (fetchErr) {
          console.warn('Failed to fetch detailed YouTube analytics after refresh:', fetchErr?.message || fetchErr);
        }
        // Fallback: backfill counts from saved influencer profile if any metric still appears zero/undefined
        try {
          const profileRes = await influencerAPI.getProfile();
          const profile = profileRes?.data || {};
          setYoutubeLinked(prev => ({
            ...(prev || {}),
            subscriberCount: Number((prev?.subscriberCount ?? 0) || profile.youtubeSubscribers || 0),
            videoCount: Number((prev?.videoCount ?? 0) || profile.youtubeVideos || 0),
            viewCount: Number((prev?.viewCount ?? 0) || profile.youtubeViews || 0)
          }));
        } catch (profileErr) {
          console.warn('Failed to backfill YouTube metrics from profile:', profileErr?.message || profileErr);
        }
        setYoutubeInput('');
      } else {
        setYoutubeError(data?.message || 'No YouTube channel found with that name or URL');
      }
    } catch (err) {
      console.error('YouTube connection error:', err);
      // Provide clearer error feedback
      const status = err?.response?.status;
      const msgFromServer = err?.response?.data?.message || err?.response?.data?.error;
      const reqUrl = `${err?.config?.baseURL || ''}${err?.config?.url || ''}`;
      console.log('Axios request URL:', reqUrl);
      if (err?.config) {
        console.log('Axios method:', err.config.method);
      }
      if (status === 401) {
        setYoutubeError('Authentication required. Please log in again.');
      } else if (!err.response) {
        setYoutubeError('Cannot reach server. Check backend status or API URL.');
      } else {
        setYoutubeError(
          msgFromServer || (status === 404 ? 'Request failed with status code 404' : err.message) ||
          'Failed to connect YouTube channel. Please try again.'
        );
      }
    } finally {
      setIsLoadingYT(false);
    }
  };

  const handleConnectTikTok = async () => {
    if (!tiktokUsername.trim()) {
      setError('Please enter a TikTok username');
      return;
    }

    setIsLoadingTT(true);
    setError('');

    try {
      // Clean the username (remove @ if present)
      const cleanUsername = tiktokUsername.trim().replace(/^@/, '');
      
      // Additional validation
      if (!cleanUsername) {
        setError('Please enter a valid TikTok username');
        setIsLoadingTT(false);
        return;
      }

      console.log('=== TIKTOK CONNECTION DEBUG ===');
      console.log('Original input:', tiktokUsername);
      console.log('Clean username:', cleanUsername);
      console.log('User role:', user?.role);
      console.log('User UID:', user?.uid);
      console.log('User object:', user);
      console.log('Auth token exists:', !!localStorage.getItem('token'));

      if (user?.role === 'influencer') {
        if (!user?.uid) {
          setError('User ID not found. Please try logging in again.');
          return;
        }
        
        console.log('Validating TikTok username first...');
        
        // First validate the TikTok username
        const validationResponse = await influencerAPI.validateTikTok(cleanUsername);
        console.log('TikTok validation response:', validationResponse?.data);
        
        if (validationResponse?.data?.success) {
          console.log('Validation successful, updating profile...');
          const payload = { tiktokUsername: cleanUsername };
          console.log('Payload being sent:', payload);
          
          const updateResponse = await influencerAPI.updateProfile(user.uid, payload);
          console.log('Profile update response:', updateResponse);
          
          // Fetch updated profile data to get TikTok follower count
          try {
            const profileResponse = await influencerAPI.getProfile(user.uid);
            const profileData = profileResponse.data;
            console.log('Updated profile data:', profileData);
            
            setTiktokLinked({ 
              username: cleanUsername,
              followers: profileData.tiktokFollowers || 0,
              following: profileData.tiktokFollowing || 0,
              videosCount: profileData.tiktokVideosCount || 0
            });
          } catch (profileError) {
            console.warn('Failed to fetch updated profile data:', profileError);
            setTiktokLinked({ username: cleanUsername });
          }
          
          setSuccess('TikTok username validated and linked to your influencer profile');
        } else {
          setError('TikTok username validation failed. Please check the username and try again.');
        }
      } else {
        setError('Only influencers can connect TikTok accounts in the wizard');
      }

      console.log('=== END TIKTOK CONNECTION DEBUG ===');
    } catch (err) {
      console.log('=== TIKTOK CONNECTION ERROR ===');
      console.error('Full error object:', err);
      console.error('Error response:', err?.response);
      console.error('Error response data:', err?.response?.data);
      console.error('Error response status:', err?.response?.status);
      console.error('Error message:', err?.message);
      console.log('=== END TIKTOK CONNECTION ERROR ===');
      
      const msg = err?.response?.data?.message || err?.message || 'Failed to connect TikTok';
      setError(msg);
    } finally {
      setIsLoadingTT(false);
    }
  };

  // Disconnect functions
  const handleDisconnectInstagram = () => {
    setValidationResult(null);
    setFormData(prev => ({ ...prev, instagramUsername: '' }));
    setError('');
    setSuccess('');
  };

  const handleDisconnectYouTube = () => {
    setYoutubeLinked(null);
    setYoutubeInput('');
    setYoutubeError('');
    setError('');
    setSuccess('');
  };

  const handleDisconnectTikTok = () => {
    setTiktokLinked(null);
    setTiktokUsername('');
    setError('');
    setSuccess('');
  };

const REDIRECT_DELAY_MS = 1500;

// Wait until backend reflects profile completion to avoid redirect flicker
const waitForProfileCompletion = async (timeoutMs = 4000, intervalMs = 300) => {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await userAPI.getProfileStatus();
      if (res?.data && res.data.requiresOnboarding === false) {
        return true;
      }
    } catch (e) {
      // Ignore transient errors; try again until timeout
    }
    await new Promise(r => setTimeout(r, intervalMs));
  }
  return false;
};

  const handleCreateProfile = async () => {
    console.log('=== FRONTEND PROFILE CREATION START ===');
    
    if (!validateForm()) {
      console.log('Form validation failed');
      setError('Please fill in all required fields correctly.');
      return;
    }

    if (!validationResult && !youtubeLinked && !tiktokLinked) {
      console.log('No social media accounts connected');
      setError('Please connect at least one social media account (Instagram, YouTube, or TikTok).');
      return;
    }

    console.log('Starting profile creation process...');
    setIsLoading(true);
    setError('');

    try {
      // Derive location for backward compatibility
      const location = `${formData.city || ''}${formData.city && formData.country ? ', ' : ''}${formData.country || ''}`;
      
      // Resolve Instagram username from validation payload (correct field) or form
      const igUsernameFromValidation = (() => {
        const d = validationResult?.data || {};
        const raw = d.username || d.profile?.username || '';
        return (raw || '').replace('@', '').trim();
      })();

      const profileData = {
        fullName: formData.fullName || '',
        instagramUsername: igUsernameFromValidation || (formData.instagramUsername || '').replace('@', '').trim() || '',
        bio: formData.bio || '', // Use form bio or default empty
        location,
        gender: formData.gender || 'prefer_not_to_say',
        categories: formData.categories?.length > 0 ? formData.categories : ['lifestyle'],
        contentTypes: formData.contentTypes?.length > 0 ? formData.contentTypes : ['posts'],
        priceRangeMin: parseFloat(formData.priceRangeMin) || 100,
        priceRangeMax: parseFloat(formData.priceRangeMax) || 1000,
        
        // YouTube data from connected channel
        ...(youtubeLinked && {
          youtubeChannelId: youtubeLinked.channelId,
          youtubeChannelTitle: youtubeLinked.channelTitle,
          youtubeChannelUrl: youtubeLinked.channelUrl
        }),
        
        // TikTok data from connected account
        ...(tiktokLinked && {
          tiktokUsername: tiktokLinked.username
        }),
        
        // Instagram data from validation or form input (already included above)
        
        // Additional fields expected by backend
        averageDeliveryTime: formData.averageDeliveryTime || null,
        phoneNumber: formData.phoneNumber || '',
        city: formData.city || '',
        country: formData.country || '',
        languages: formData.languages || [],
        maritalStatus: formData.maritalStatus || '',
        children: formData.children || '',
        pricingTier: formData.pricingTier || '',
        deliverables: formData.deliverables || [],
        deliveryProductBased: formData.deliveryProductBased || '',
        deliveryNoProduct: formData.deliveryNoProduct || '',
        deliveryOutdoorShoot: formData.deliveryOutdoorShoot || '',
        deliveryRevisions: formData.deliveryRevisions || ''
      };

      console.log('Profile data prepared:', profileData);
      console.log('About to call influencerAPI.createProfile...');
      
      const response = await influencerAPI.createProfile(profileData);
      
      console.log('API response received:', response);
      
      // Check if profile was created successfully (backend returns message and profile)
      if (response.data.message && response.data.message.includes('successfully')) {
        console.log('Profile creation successful! Backend has already updated user role.');
        setSuccess('Your profile has been created successfully! Redirecting to dashboard...');
        // Notify route guards and wait for profile-status to flip
        try {
          console.log('Dispatching profileCreated event...');
          window.dispatchEvent(new CustomEvent('profileCreated'));
        } catch (_) {}
        await waitForProfileCompletion();
        navigate('/influencer/dashboard', { replace: true });
      } else {
        console.error('Profile creation failed:', response);
        setError(response.data.message || 'Failed to create profile');
      }
    } catch (err) {
      console.error('=== FRONTEND PROFILE CREATION ERROR ===');
      console.error('Profile creation error:', err);
      console.error('Error details:', err.response?.data || err.message);
      console.error('Error status:', err.response?.status);
      console.error('Error config:', err.config);
      console.error('=== END FRONTEND ERROR ===');
      
      const errorMessage = err.response?.data?.message || err.message || 'Please try again.';
      
      // Handle specific case where profile already exists
      if (errorMessage.includes('already exists')) {
        console.log('Profile already exists, redirecting to dashboard...');
        setSuccess('Profile already exists. Redirecting to your dashboard...');
        // Notify route guards and ensure profile-status is fresh
        try {
          console.log('Dispatching profileCreated event (existing profile)...');
          window.dispatchEvent(new CustomEvent('profileCreated'));
        } catch (_) {}
        await waitForProfileCompletion();
        navigate('/influencer/dashboard', { replace: true });
      } else {
        setError(`Failed to create profile: ${errorMessage}`);
      }
    } finally {
      setIsLoading(false);
      console.log('=== FRONTEND PROFILE CREATION END ===');
    }
  };

  return (
    <Container className="py-4 iw-page">
      {/* Top Gradient Banner */}
      <div className="iw-banner mb-4">
        <div className="iw-banner-content">
          <i className="bi bi-person-circle iw-banner-icon me-2"></i>
          <span className="iw-banner-text">Complete Your Influencer Profile</span>
        </div>
      </div>

      <Row className="justify-content-center">
        <Col lg={9}>
          <Card className="shadow-sm iw-card">
            <Card.Body className="p-4 iw-form">
              {error && (
                <Alert variant="danger" className="mb-4">
                  <i className="bi bi-exclamation-triangle me-2"></i>
                  {error}
                </Alert>
              )}

              {success && (
                <Alert variant="success" className="mb-4">
                  <i className="bi bi-check-circle me-2"></i>
                  {success}
                </Alert>
              )}

              <Form>
                {/* Personal Information Section */}
                <div className="form-section">
                  <h5 className="iw-section-title mb-3">
                    <i className="bi bi-person-lines-fill me-2"></i>
                    Personal Information
                  </h5>

                  {/* Row 1: Full Name / Phone */}
                  <Row className="g-3">
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label>Full Name *</Form.Label>
                        <Form.Control
                          type="text"
                          name="fullName"
                          value={formData.fullName || ''}
                          onChange={handleChange}
                          placeholder="Enter your full name"
                          className={errors.fullName ? 'is-invalid' : ''}
                        />
                        {errors.fullName && (
                          <div className="invalid-feedback">
                            {errors.fullName}
                          </div>
                        )}
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label>Phone Number *</Form.Label>
                        <Form.Control
                          type="tel"
                          name="phoneNumber"
                          value={formData.phoneNumber || ''}
                          onChange={handleChange}
                          placeholder="Enter your phone number"
                          className={errors.phoneNumber ? 'is-invalid' : ''}
                        />
                        {errors.phoneNumber && (
                          <div className="invalid-feedback">
                            {errors.phoneNumber}
                          </div>
                        )}
                      </Form.Group>
                    </Col>
                  </Row>

                  {/* Row 2: City / Country */}
                  <Row className="g-3 mt-1">
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label>City *</Form.Label>
                        <Form.Control
                          type="text"
                          name="city"
                          value={formData.city || ''}
                          onChange={handleChange}
                          placeholder="Enter your city"
                          className={errors.city ? 'is-invalid' : ''}
                        />
                        {errors.city && (
                          <div className="invalid-feedback">
                            {errors.city}
                          </div>
                        )}
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label>Country *</Form.Label>
                        <div className="iw-select-wrapper">
                          <Form.Select
                            name="country"
                            value={formData.country || ''}
                            onChange={handleChange}
                            className={errors.country ? 'is-invalid' : ''}
                          >
                            <option value="">Select your country</option>
                            {countryOptions.map(country => (
                              <option key={country} value={country}>
                                {country}
                              </option>
                            ))}
                          </Form.Select>
                          <i className="bi bi-caret-down-fill iw-select-caret"></i>
                        </div>
                        {errors.country && (
                          <div className="invalid-feedback">
                            {errors.country}
                          </div>
                        )}
                      </Form.Group>
                    </Col>
                  </Row>

                  {/* Row 3: Date of Birth / Marital Status */}
                  <Row className="g-3 mt-1">
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label>Date of Birth *</Form.Label>
                        <div className="iw-input-icon-right">
                          <DatePicker
                            selected={formData.dateOfBirth ? new Date(formData.dateOfBirth) : null}
                            onChange={(date) => {
                              const event = {
                                target: {
                                  name: 'dateOfBirth',
                                  value: date ? date.toISOString().split('T')[0] : ''
                                }
                              };
                              handleChange(event);
                            }}
                            dateFormat="MM/dd/yyyy"
                            placeholderText="mm/dd/yyyy"
                            className={`form-control ${errors.dateOfBirth ? 'is-invalid' : ''}`}
                            showYearDropdown
                            showMonthDropdown
                            dropdownMode="select"
                            maxDate={new Date()}
                            yearDropdownItemNumber={100}
                            scrollableYearDropdown
                          />
                          <i className="bi bi-calendar iw-input-icon"></i>
                        </div>
                        {errors.dateOfBirth && (
                          <div className="invalid-feedback d-block">
                            {errors.dateOfBirth}
                          </div>
                        )}
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label>Marital Status *</Form.Label>
                        <div className="chip-toggle-group">
                          {maritalOptions.map(option => (
                            <div
                              key={option.toLowerCase()}
                              className={`chip-toggle ${
                                formData.maritalStatus === option.toLowerCase() ? 'selected' : ''
                              } ${errors.maritalStatus ? 'invalid' : ''}`}
                              onClick={() => {
                                const event = {
                                  target: {
                                    name: 'maritalStatus',
                                    value: option.toLowerCase()
                                  }
                                };
                                handleChange(event);
                              }}
                            >
                              {option}
                            </div>
                          ))}
                        </div>
                        {errors.maritalStatus && (
                          <div className="invalid-feedback d-block">
                            {errors.maritalStatus}
                          </div>
                        )}
                      </Form.Group>
                    </Col>
                  </Row>

                  {/* Row 4: Gender / Children */}
                  <Row className="g-3 mt-1">
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label>Gender *</Form.Label>
                        <div className="chip-toggle-group">
                          {genderOptions.map(option => (
                            <div
                              key={option.value}
                              className={`chip-toggle ${
                                formData.gender === option.value ? 'selected' : ''
                              } ${errors.gender ? 'invalid' : ''}`}
                              onClick={() => {
                                const event = {
                                  target: {
                                    name: 'gender',
                                    value: option.value
                                  }
                                };
                                handleChange(event);
                              }}
                            >
                              {option.label}
                            </div>
                          ))}
                        </div>
                        {errors.gender && (
                          <div className="invalid-feedback d-block">
                            {errors.gender}
                          </div>
                        )}
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label>Children *</Form.Label>
                        <div className="chip-toggle-group">
                          {yesNoOptions.map(option => (
                            <div
                              key={option.toLowerCase()}
                              className={`chip-toggle ${
                                formData.children === option.toLowerCase() ? 'selected' : ''
                              } ${errors.children ? 'invalid' : ''}`}
                              onClick={() => {
                                const event = {
                                  target: {
                                    name: 'children',
                                    value: option.toLowerCase()
                                  }
                                };
                                handleChange(event);
                              }}
                            >
                              {option}
                            </div>
                          ))}
                        </div>
                        {errors.children && (
                          <div className="invalid-feedback d-block">
                            {errors.children}
                          </div>
                        )}
                      </Form.Group>
                    </Col>
                  </Row>
                </div>

                {/* Content & Preferences Section - Hidden but kept in code */}
                <div className="form-section" style={{ display: 'none' }}>
                  <h5>
                    <i className="bi bi-palette"></i>
                    Content & Preferences
                  </h5>
                  
                  <Form.Group className="mb-3">
                    <Form.Label>Niche *</Form.Label>
                    <MultiSelect
                      label="Niche"
                      options={categoryOptions}
                      value={formData.categories}
                      onChange={(value) => handleMultiSelectChange('categories', value)}
                      isInvalid={!!errors.categories}
                    />
                    {errors.categories && (
                      <Form.Control.Feedback type="invalid" className="d-block">
                        {errors.categories}
                      </Form.Control.Feedback>
                    )}
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Content Style *</Form.Label>
                    <MultiSelect
                      label="Content Style"
                      options={contentTypeOptions}
                      value={formData.contentTypes}
                      onChange={(value) => handleMultiSelectChange('contentTypes', value)}
                      isInvalid={!!errors.contentTypes}
                    />
                    {errors.contentTypes && (
                      <Form.Control.Feedback type="invalid" className="d-block">
                        {errors.contentTypes}
                      </Form.Control.Feedback>
                    )}
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Languages *</Form.Label>
                    <MultiSelect
                      label="Languages"
                      options={languageOptions}
                      value={formData.languages}
                      onChange={(value) => handleMultiSelectChange('languages', value)}
                      isInvalid={!!errors.languages}
                    />
                    {errors.languages && (
                      <Form.Control.Feedback type="invalid" className="d-block">
                        {errors.languages}
                      </Form.Control.Feedback>
                    )}
                  </Form.Group>
                </div>

                {/* Pricing & Deliverables Section - Hidden but kept in code */}
                <div className="form-section" style={{ display: 'none' }}>
                  <h5>
                    <i className="bi bi-currency-dollar"></i>
                    Pricing & Deliverables
                  </h5>
                  
                  <Row>
                    <Col md={4}>
                      <Form.Group className="mb-3">
                        <Form.Label>Tier</Form.Label>
                        <Form.Select
                          name="pricingTier"
                          value={formData.pricingTier}
                          onChange={handleChange}
                        >
                          <option value="">Select tier...</option>
                          {pricingTierOptions.map(option => (
                            <option key={option.toLowerCase()} value={option.toLowerCase()}>
                              {option}
                            </option>
                          ))}
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col md={4}>
                      <Form.Group className="mb-3">
                        <Form.Label>Price Range Min (USD) *</Form.Label>
                        <Form.Control
                          type="number"
                          name="priceRangeMin"
                          value={formData.priceRangeMin}
                          onChange={handleChange}
                          min="0"
                          placeholder="Minimum price"
                          isInvalid={!!errors.priceRangeMin}
                        />
                        <Form.Control.Feedback type="invalid">
                          {errors.priceRangeMin}
                        </Form.Control.Feedback>
                      </Form.Group>
                    </Col>
                    <Col md={4}>
                      <Form.Group className="mb-3">
                        <Form.Label>Price Range Max (USD) *</Form.Label>
                        <Form.Control
                          type="number"
                          name="priceRangeMax"
                          value={formData.priceRangeMax}
                          onChange={handleChange}
                          min="0"
                          placeholder="Maximum price"
                          isInvalid={!!errors.priceRangeMax}
                        />
                        <Form.Control.Feedback type="invalid">
                          {errors.priceRangeMax}
                        </Form.Control.Feedback>
                      </Form.Group>
                    </Col>
                  </Row>

                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Deliverables</Form.Label>
                        <MultiSelect
                          label="Deliverables"
                          options={deliverableOptions}
                          value={formData.deliverables}
                          onChange={(value) => handleMultiSelectChange('deliverables', value)}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Average Delivery Time (days) *</Form.Label>
                        <Form.Control
                          type="number"
                          name="averageDeliveryTime"
                          value={formData.averageDeliveryTime}
                          onChange={handleChange}
                          min="0"
                          placeholder="e.g. 7"
                          isInvalid={!!errors.averageDeliveryTime}
                        />
                        <Form.Control.Feedback type="invalid">
                          {errors.averageDeliveryTime}
                        </Form.Control.Feedback>
                      </Form.Group>
                    </Col>
                  </Row>
                </div>

                {/* Social Media Section */}
                <div className="form-section">
                  <h5 className="iw-section-title mb-3">
                    <i className="bi bi-share me-2"></i>
                    Social Media Accounts
                  </h5>
                  
                  <Row>
                    <Col md={4} className="mb-4">
                      <Card className="iw-platform-card iw-instagram">
                        <Card.Body>
                          <div className="iw-platform-header mb-2">
                            <i className="bi bi-instagram me-2"></i>
                            <span>Instagram</span>
                          </div>
                          {!validationResult?.success ? (
                            <>
                              <Form.Group className="mb-3">
                                <Form.Label>
                                  Instagram Username {!youtubeLinked && !tiktokLinked ? '*' : ''}
                                </Form.Label>
                                <Form.Control
                                  type="text"
                                  name="instagramUsername"
                                  value={formData.instagramUsername}
                                  onChange={handleChange}
                                  isInvalid={!!errors.instagramUsername}
                                  placeholder="your_username"
                                />
                                <Form.Control.Feedback type="invalid">
                                  {errors.instagramUsername}
                                </Form.Control.Feedback>
                              </Form.Group>
                              <Button
                                className="iw-connect-btn"
                                onClick={handleValidateInstagram}
                                disabled={isValidating || isLoading}
                                size="sm"
                              >
                                {isValidating ? (
                                  <>
                                    <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />
                                    Validating...
                                  </>
                                ) : (
                                  <>
                                    <i className="bi bi-link-45deg me-2"></i>
                                    Connect Instagram
                                  </>
                                )}
                              </Button>
                            </>
                          ) : (
                            <Alert variant="success" className="mb-0 position-relative">
                              <Button
                                variant="outline-danger"
                                size="sm"
                                className="position-absolute top-0 end-0 m-2"
                                onClick={handleDisconnectInstagram}
                                style={{ padding: '2px 6px', fontSize: '12px' }}
                              >
                                <i className="bi bi-x-lg"></i>
                              </Button>
                              <i className="bi bi-check-circle me-2"></i>
                              <strong>@{formData.instagramUsername}</strong> validated!
                              <div className="mt-2">
                                <div className="row text-center">
                                  <div className="col-4">
                                    <div className="fw-bold text-primary">
                                      {(
                                        validationResult.data?.profile?.followers ??
                                        validationResult.data?.profile?.followersCount ??
                                        validationResult.profileData?.followers ??
                                        validationResult.profileData?.followersCount ??
                                        0
                                      ).toLocaleString()}
                                    </div>
                                    <small className="text-muted">Followers</small>
                                  </div>
                                  <div className="col-4">
                                    <div className="fw-bold text-info">
                                      {(
                                        validationResult.data?.profile?.following ??
                                        validationResult.data?.profile?.followingCount ??
                                        validationResult.profileData?.following ??
                                        validationResult.profileData?.followingCount ??
                                        0
                                      ).toLocaleString()}
                                    </div>
                                    <small className="text-muted">Following</small>
                                  </div>
                                  <div className="col-4">
                                    <div className="fw-bold text-success">
                                      {(
                                        validationResult.data?.profile?.postsCount ??
                                        validationResult.profileData?.postsCount ??
                                        0
                                      ).toLocaleString()}
                                    </div>
                                    <small className="text-muted">Posts</small>
                                  </div>
                                </div>
                                {validationResult.data?.profile?.bio && (
                                  <div className="mt-2">
                                    <small className="text-muted">
                                      <strong>Bio:</strong> {validationResult.data.profile.bio.substring(0, 100)}
                                      {validationResult.data.profile.bio.length > 100 ? '...' : ''}
                                    </small>
                                  </div>
                                )}
                                {validationResult.data?.profile?.isVerified && (
                                  <div className="mt-1">
                                    <span className="badge bg-primary">
                                      <i className="bi bi-patch-check me-1"></i>
                                      Verified Account
                                    </span>
                                  </div>
                                )}
                                {validationResult.data?.reels?.totalReels > 0 && (
                                  <div className="mt-2">
                                    <small className="text-success">
                                      <i className="bi bi-play-circle me-1"></i>
                                      {validationResult.data.reels.totalReels} reels found
                                    </small>
                                  </div>
                                )}
                              </div>
                            </Alert>
                          )}
                        </Card.Body>
                      </Card>
                    </Col>

                    <Col md={4} className="mb-4">
                      <Card className="iw-platform-card iw-youtube">
                        <Card.Body>
                          <div className="iw-platform-header mb-2">
                            <i className="bi bi-youtube me-2"></i>
                            <span>YouTube</span>
                          </div>
                          {!youtubeLinked ? (
                            <>
                              <Form.Group className="mb-3">
                                <Form.Label>Channel URL, handle (@name), or name</Form.Label>
                                <Form.Control
                                  type="text"
                                  placeholder="e.g. https://www.youtube.com/@creatorname"
                                  value={youtubeInput}
                                  onChange={(e) => setYoutubeInput(e.target.value)}
                                  isInvalid={!!youtubeError}
                                />
                                <Form.Control.Feedback type="invalid">
                                  {youtubeError}
                                </Form.Control.Feedback>
                              </Form.Group>
                              <Button 
                                className="iw-connect-btn" 
                                onClick={handleConnectYouTube} 
                                disabled={isLoadingYT}
                                size="sm"
                              >
                                {isLoadingYT ? (
                                  <>
                                    <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />
                                    Connecting...
                                  </>
                                ) : (
                                  <>
                                    <i className="bi bi-link-45deg me-2"></i>
                                    Connect YouTube
                                  </>
                                )}
                              </Button>
                            </>
                          ) : (
                            <Alert variant="success" className="mb-0 position-relative">
                              <Button
                                variant="outline-danger"
                                size="sm"
                                className="position-absolute top-0 end-0 m-2"
                                onClick={handleDisconnectYouTube}
                                style={{ padding: '2px 6px', fontSize: '12px' }}
                              >
                                <i className="bi bi-x-lg"></i>
                              </Button>
                              
                              {/* Channel Header with Thumbnail */}
                              <div className="d-flex align-items-center mb-3">
                                {youtubeLinked.thumbnails?.default?.url && (
                                  <img 
                                    src={youtubeLinked.thumbnails.default.url} 
                                    alt="Channel thumbnail"
                                    className="rounded-circle me-3"
                                    style={{ width: '48px', height: '48px' }}
                                  />
                                )}
                                <div>
                                  <div className="d-flex align-items-center">
                                    <i className="bi bi-check-circle me-2 text-success"></i>
                                    <strong>{youtubeLinked.channelTitle}</strong> linked!
                                  </div>
                                  {youtubeLinked.country && (
                                    <small className="text-muted">
                                      <i className="bi bi-geo-alt me-1"></i>
                                      {youtubeLinked.country}
                                    </small>
                                  )}
                                  {youtubeLinked.publishedAt && (
                                    <div>
                                      <small className="text-muted">
                                        <i className="bi bi-calendar me-1"></i>
                                        Created: {new Date(youtubeLinked.publishedAt).toLocaleDateString()}
                                      </small>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Statistics Grid */}
                              <div className="row text-center mb-3">
                                <div className="col-4">
                                  <div className="fw-bold text-danger fs-5">
                                    {youtubeLinked.subscriberCount?.toLocaleString() || '0'}
                                  </div>
                                  <small className="text-muted">Subscribers</small>
                                </div>
                                <div className="col-4">
                                  <div className="fw-bold text-info fs-5">
                                    {youtubeLinked.videoCount?.toLocaleString() || '0'}
                                  </div>
                                  <small className="text-muted">Videos</small>
                                </div>
                                <div className="col-4">
                                  <div className="fw-bold text-success fs-5">
                                    {youtubeLinked.viewCount?.toLocaleString() || '0'}
                                  </div>
                                  <small className="text-muted">Total Views</small>
                                </div>
                              </div>

                              {/* Channel Description */}
                              {youtubeLinked.description && (
                                <div className="mb-3 p-2 bg-light rounded">
                                  <small className="text-muted d-block mb-1">
                                    <strong><i className="bi bi-info-circle me-1"></i>Description:</strong>
                                  </small>
                                  <small className="text-dark">
                                    {youtubeLinked.description.length > 150 
                                      ? `${youtubeLinked.description.substring(0, 150)}...` 
                                      : youtubeLinked.description
                                    }
                                  </small>
                                </div>
                              )}

                              {/* Action Button */}
                              <div className="text-center">
                                <a href={youtubeLinked.channelUrl} target="_blank" rel="noreferrer" className="btn btn-outline-danger">
                                  <i className="bi bi-youtube me-2"></i>
                                  View Channel
                                </a>
                              </div>
                            </Alert>
                          )}
                        </Card.Body>
                      </Card>
                    </Col>

                    {SHOW_TIKTOK_CONNECT && (
                    <Col md={4} className="mb-4">
                      <Card className="iw-platform-card iw-tiktok">
                        <Card.Body>
                          <div className="iw-platform-header mb-2">
                            <i className="bi bi-tiktok me-2"></i>
                            <span>TikTok</span>
                          </div>
                          {!tiktokLinked ? (
                            <>
                              <Form.Group className="mb-3">
                                <Form.Label>TikTok Username</Form.Label>
                                <Form.Control
                                  type="text"
                                  placeholder="e.g. @username or username"
                                  value={tiktokUsername}
                                  onChange={(e) => setTiktokUsername(e.target.value)}
                                />
                              </Form.Group>
                              <Button 
                                className="iw-connect-btn"
                                onClick={handleConnectTikTok} 
                                disabled={isLoadingTT}
                                size="sm"
                              >
                                {isLoadingTT ? (
                                  <>
                                    <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />
                                    Connecting...
                                  </>
                                ) : (
                                  <>
                                    <i className="bi bi-link-45deg me-2"></i>
                                    Connect TikTok
                                  </>
                                )}
                              </Button>
                            </>
                          ) : (
                            <Alert variant="success" className="mb-0 position-relative">
                              <Button
                                variant="outline-danger"
                                size="sm"
                                className="position-absolute top-0 end-0 m-2"
                                onClick={handleDisconnectTikTok}
                                style={{ padding: '2px 6px', fontSize: '12px' }}
                              >
                                <i className="bi bi-x-lg"></i>
                              </Button>
                              <i className="bi bi-check-circle me-2"></i>
                              <strong>@{tiktokLinked.username}</strong> connected!
                              {tiktokLinked.followers !== undefined && (
                                <div className="mt-2">
                                  <div className="row text-center">
                                    <div className="col-4">
                                      <div className="fw-bold" style={{ color: '#ff0050' }}>
                                        {tiktokLinked.followers.toLocaleString()}
                                      </div>
                                      <small className="text-muted">Followers</small>
                                    </div>
                                    <div className="col-4">
                                      <div className="fw-bold text-info">
                                        {tiktokLinked.following?.toLocaleString() || '0'}
                                      </div>
                                      <small className="text-muted">Following</small>
                                    </div>
                                    <div className="col-4">
                                      <div className="fw-bold text-success">
                                        {tiktokLinked.videosCount?.toLocaleString() || '0'}
                                      </div>
                                      <small className="text-muted">Videos</small>
                                    </div>
                                  </div>
                                  {tiktokLinked.likes && (
                                    <div className="mt-2 text-center">
                                      <div className="fw-bold text-warning">
                                        <i className="bi bi-heart-fill me-1"></i>
                                        {tiktokLinked.likes.toLocaleString()} Total Likes
                                      </div>
                                    </div>
                                  )}
                                  {tiktokLinked.bio && (
                                    <div className="mt-2">
                                      <small className="text-muted">
                                        <strong>Bio:</strong> {tiktokLinked.bio.substring(0, 100)}
                                        {tiktokLinked.bio.length > 100 ? '...' : ''}
                                      </small>
                                    </div>
                                  )}
                                  {tiktokLinked.isVerified && (
                                    <div className="mt-1">
                                      <span className="badge" style={{ backgroundColor: '#ff0050', color: 'white' }}>
                                        <i className="bi bi-patch-check me-1"></i>
                                        Verified Account
                                      </span>
                                    </div>
                                  )}
                                </div>
                              )}
                            </Alert>
                          )}
                        </Card.Body>
                      </Card>
                    </Col>
                    )}
                  </Row>
                </div>

                {/* Submit Button */}
                <div className="text-center">
                  <Button
                    size="lg"
                    onClick={handleCreateProfile}
                    disabled={isLoading || (!validationResult && !youtubeLinked && !tiktokLinked)}
                    className="iw-create-btn"
                  >
                    {isLoading ? (
                      <>
                        <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />
                        Creating Profile...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-check-lg me-2"></i>
                        Create Profile
                      </>
                    )}
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default InfluencerWizard;
