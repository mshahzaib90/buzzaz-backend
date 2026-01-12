import React, { useState, useEffect, useCallback } from 'react';
import { Container, Row, Col, Card, Tab, Button, Alert, Spinner, Badge, Form, Modal, Carousel } from 'react-bootstrap';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ugcCreatorAPI } from '../api/ugcAPI';
import api from '../services/api';
import { ResponsiveContainer, ComposedChart, Area, Line, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts';
import { SiTiktok } from 'react-icons/si';
import '../styles/dashboard.css';
import UGCLeftNav from '../components/UGCLeftNav';
import ChatInterface from '../components/Chat/ChatInterface';
import EditProfileForm from '../components/EditProfileForm';
import MultiSelect from '../components/MultiSelect';

const UGCDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  // Utility function to format numbers (e.g., 1234 -> 1.2K, 1234567 -> 1.2M)
  const formatNumber = (num) => {
    if (!num || num === 0) return '0';
    
    const number = parseInt(num);
    
    if (number >= 1000000) {
      return (number / 1000000).toFixed(1) + 'M';
    } else if (number >= 1000) {
      return (number / 1000).toFixed(1) + 'K';
    }
    
    return number.toLocaleString();
  };

  const [activeTab, setActiveTab] = useState('dashboard');
  const [profile, setProfile] = useState(null);
  const [youtubeChannelUrl, setYoutubeChannelUrl] = useState('');
  const [connectingYoutube, setConnectingYoutube] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [selectedVideoId, setSelectedVideoId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showEditProfile, setShowEditProfile] = useState(false);
  // Analytics controls
  const [analyticsRange] = useState('7'); // '7' or '30'
  
  // YouTube insights state
  const [youtubeStats, setYoutubeStats] = useState(null);
  const [detailedYoutubeData, setDetailedYoutubeData] = useState(null);
  const [isLoadingYT, setIsLoadingYT] = useState(false);
  const [youtubeDetailedLoading, setYoutubeDetailedLoading] = useState(false);
  const [youtubeError, setYoutubeError] = useState('');
  const [youtubeDetailedError, setYoutubeDetailedError] = useState('');
  // Instagram connection state
  const [instagramUsernameInput, setInstagramUsernameInput] = useState('');
  const [savingInstagram, setSavingInstagram] = useState(false);
  const [detailedInstagramData, setDetailedInstagramData] = useState(null);
  const [detailedLoadingIG, setDetailedLoadingIG] = useState(false);
  const [detailedErrorIG, setDetailedErrorIG] = useState('');
  const [tiktokUsernameInput, setTiktokUsernameInput] = useState('');
  const [savingTikTok, setSavingTikTok] = useState(false);
  
  const { user } = useAuth();

  // Define fetchDetailedYoutubeData early and memoize to avoid use-before-init
  const fetchDetailedYoutubeData = useCallback(async () => {
    if (!profile?.youtubeChannelId || !user?.uid) return;
    
    setYoutubeDetailedLoading(true);
    setYoutubeDetailedError('');
    
    try {
      const response = await ugcCreatorAPI.getYouTubeAnalytics(user.uid);
      setDetailedYoutubeData(response.data);
    } catch (error) {
      console.error('Error fetching detailed YouTube data:', error);
      if (error.response?.data?.shouldRefresh) {
        setYoutubeDetailedError('No analytics data found. Please refresh your YouTube data first.');
      } else {
        setYoutubeDetailedError('Failed to load detailed YouTube analytics');
      }
    } finally {
      setYoutubeDetailedLoading(false);
    }
  }, [profile?.youtubeChannelId, user?.uid]);

  const normalizeReels = (reels) => {
    return (Array.isArray(reels) ? reels : []).map(r => ({
      ...r,
      thumbnailUrl: r.thumbnailUrl || r.displayUrl || (Array.isArray(r.images) ? r.images[0] : ''),
      reelUrl: r.reelUrl || r.url || (r.shortCode || r.shortcode ? `https://www.instagram.com/p/${r.shortCode || r.shortcode}/` : ''),
      viewsCount: r.viewsCount || r.playCount || r.videoPlayCount || 0,
      engagementRate: r.engagementRate ?? (
        r.likesCount && (r.viewsCount || r.playCount)
          ? Math.round(((r.likesCount + (r.commentsCount || 0)) / (r.viewsCount || r.playCount)) * 100)
          : 0
      )
    }));
  };

  const fetchDetailedInstagramData = useCallback(async () => {
    if (!profile?.instagramUsername || !user?.uid) return;
    setDetailedLoadingIG(true);
    setDetailedErrorIG('');
    try {
      const res = await api.get(`/ugc/${user.uid}/instagram/detailed`);
      const payload = res.data || {};
      const normalizedReels = normalizeReels(payload.reels || payload.posts?.reels || []);
      setDetailedInstagramData({ ...payload, reels: normalizedReels });
    } catch (error) {
      let msg = 'Failed to load Instagram data';
      if (error.response?.status === 404) msg = 'No Instagram data found. Please refresh first.';
      else if (error.response?.data?.message) msg = error.response.data.message;
      setDetailedErrorIG(msg);
    } finally {
      setDetailedLoadingIG(false);
    }
  }, [profile?.instagramUsername, user?.uid]);

  const handleSyncInstagram = async () => {
    if (!profile?.instagramUsername) {
      setError('No Instagram username found to sync');
      return;
    }
    setIsUpdating(true);
    setError('');
    setSuccess('');
    try {
      const refreshRes = await api.post(`/ugc/${user.uid}/instagram/refresh`);
      const reelsCount = refreshRes?.data?.stats?.reelsCount;
      let fetched = null;
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          const res = await api.get(`/ugc/${user.uid}/instagram/detailed`);
          const reels = res.data?.reels || res.data?.posts?.reels || [];
          if (Array.isArray(reels) && reels.length > 0) {
            fetched = { ...res.data, reels: normalizeReels(reels) };
            break;
          }
        } catch {}
        await new Promise(r => setTimeout(r, 1000 + attempt * 1000));
      }
      if (fetched) {
        setDetailedInstagramData(fetched);
        setSuccess(`Instagram reels refreshed${typeof reelsCount === 'number' ? ` (${reelsCount} saved)` : ''}!`);
      } else {
        await fetchDetailedInstagramData();
        setSuccess(`Instagram data refreshed${typeof reelsCount === 'number' ? ` (${reelsCount} saved)` : ''}, but no reels found yet.`);
      }
      await fetchProfile();
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to refresh Instagram data');
    } finally {
      setIsUpdating(false);
    }
  };

  // Initialize Instagram input when profile loads
  useEffect(() => {
    setInstagramUsernameInput(profile?.instagramUsername || '');
  }, [profile?.instagramUsername]);
  // Initialize TikTok input when profile loads
  useEffect(() => {
    setTiktokUsernameInput(profile?.tiktokUsername || '');
  }, [profile?.tiktokUsername]);

  const handleSaveInstagram = async () => {
    const trimmed = (instagramUsernameInput || '').replace('@', '').trim();
    if (!trimmed) {
      setError('Please enter a valid Instagram username');
      return;
    }
    setSavingInstagram(true);
    setError('');
    try {
      await ugcCreatorAPI.updateProfile(user.uid, { instagramUsername: trimmed });
      setProfile(prev => ({ ...(prev || {}), instagramUsername: trimmed }));
      setSuccess('Instagram username saved');
    } catch (e) {
      console.error('Failed to save Instagram username:', e);
      setError(e?.response?.data?.message || 'Failed to save Instagram username');
    } finally {
      setSavingInstagram(false);
    }
  };

  const handleDisconnectInstagram = async () => {
    setSavingInstagram(true);
    setError('');
    try {
      await ugcCreatorAPI.updateProfile(user.uid, { instagramUsername: '' });
      setProfile(prev => ({ ...(prev || {}), instagramUsername: '' }));
      setInstagramUsernameInput('');
      setSuccess('Instagram disconnected');
    } catch (e) {
      console.error('Failed to disconnect Instagram:', e);
      setError(e?.response?.data?.message || 'Failed to disconnect Instagram');
    } finally {
      setSavingInstagram(false);
    }
  };
  const handleSaveTikTok = async () => {
    const trimmed = (tiktokUsernameInput || '').replace('@', '').trim();
    if (!trimmed) {
      setError('Please enter a valid TikTok username');
      return;
    }
    setSavingTikTok(true);
    setError('');
    try {
      await ugcCreatorAPI.updateProfile(user.uid, { tiktokUsername: trimmed });
      setProfile(prev => ({ ...(prev || {}), tiktokUsername: trimmed }));
      setSuccess('TikTok username saved');
    } catch (e) {
      console.error('Failed to save TikTok username:', e);
      setError(e?.response?.data?.message || 'Failed to save TikTok username');
    } finally {
      setSavingTikTok(false);
    }
  };
  const handleDisconnectTikTok = async () => {
    setSavingTikTok(true);
    setError('');
    try {
      await ugcCreatorAPI.updateProfile(user.uid, { tiktokUsername: '' });
      setProfile(prev => ({ ...(prev || {}), tiktokUsername: '' }));
      setTiktokUsernameInput('');
      setSuccess('TikTok disconnected');
    } catch (e) {
      console.error('Failed to disconnect TikTok:', e);
      setError(e?.response?.data?.message || 'Failed to disconnect TikTok');
    } finally {
      setSavingTikTok(false);
    }
  };

  // Define fetchers before effects to satisfy lint rules
  // removed duplicate commented fetchProfile block

  // removed duplicate commented fetchYouTubeStats block

  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState({
    fullName: '',
    bio: '',
    location: '',
    categories: [],
    contentTypes: [],
    languages: [],
    // New detailed pricing structure
    reelPostPrice: '',
    staticPostPrice: '',
    reelStaticComboPrice: '',
    storyVideoPrice: '',
    storyShoutoutPrice: '',
    storyUnboxingPrice: '',
    eventAttendancePrice: '',
    outdoorShootPrice: '',
    expressDeliveryCharge: '',
    // Delivery times
    productBasedDelivery: '7-10 days',
    noProductDelivery: '5-7 days',
    expressDelivery: '48-72 hours',
    outdoorEventDelivery: '4-5 days',
    revisionsDelivery: '3-4 days'
  });

  // Profile completion validation
  const checkProfileCompletion = (profileData) => {
    const requiredFields = [
      'fullName',
      'bio', 
      'location',
      'reelPostPrice',
      'staticPostPrice'
    ];
    
    const missingFields = [];
    
    // Check basic required fields
    requiredFields.forEach(field => {
      if (!profileData[field] || profileData[field].toString().trim() === '') {
        missingFields.push(field);
      }
    });
    
    // Check niche/categories
    if (!profileData.niche || profileData.niche.length === 0) {
      missingFields.push('niche');
    }
    
    // Check contentStyle/contentTypes
    if (!profileData.contentStyle || profileData.contentStyle.length === 0) {
      missingFields.push('contentStyle');
    }
    
    return {
      isComplete: missingFields.length === 0,
      missingFields
    };
  };

  // Calculate profile completion percentage
  const calculateCompletionPercentage = (profileData) => {
    if (!profileData) {
      console.log('No profile data provided');
      return 0;
    }
    
    const allRequiredFields = [
      'fullName',
      'bio', 
      'location',
      'reelPostPrice',
      'staticPostPrice',
      'niche',
      'contentStyle'
    ];
    
    let completedFields = 0;
    const fieldStatus = {};
    
    // Check basic required fields
    allRequiredFields.forEach(field => {
      if (field === 'niche') {
        const isComplete = profileData.niche && profileData.niche.length > 0;
        fieldStatus[field] = { value: profileData.niche, isComplete };
        if (isComplete) completedFields++;
      } else if (field === 'contentStyle') {
        const isComplete = profileData.contentStyle && profileData.contentStyle.length > 0;
        fieldStatus[field] = { value: profileData.contentStyle, isComplete };
        if (isComplete) completedFields++;
      } else {
        const isComplete = profileData[field] && profileData[field].toString().trim() !== '';
        fieldStatus[field] = { value: profileData[field], isComplete };
        if (isComplete) completedFields++;
      }
    });
    
    const percentage = Math.round((completedFields / allRequiredFields.length) * 100);
    
    console.log('Profile completion calculation:', {
      profileData: profileData,
      fieldStatus: fieldStatus,
      completedFields: completedFields,
      totalFields: allRequiredFields.length,
      percentage: percentage
    });
    
    return percentage;
  };

  const categoryOptions = [
    'Fashion', 'Beauty', 'Lifestyle', 'Travel', 'Food', 'Fitness', 'Technology',
    'Gaming', 'Music', 'Art', 'Photography', 'Business', 'Education', 'Health',
    'Parenting', 'Home & Garden', 'Sports', 'Entertainment', 'DIY', 'Pets'
  ];

  const contentTypeOptions = [
    'UGC Videos', 'Product Reviews', 'Unboxing', 'Tutorials', 'Testimonials',
    'Behind the Scenes', 'Lifestyle Content', 'Brand Storytelling', 'Social Media Posts'
  ];

  const languageOptions = [
    'English', 'Urdu', 'Hindi', 'Arabic', 'Spanish', 'French'
  ];

  const fetchProfile = useCallback(async () => {
    try {
      const response = await ugcCreatorAPI.getProfile(user.uid);
      const profileData = {
        ...response.profile,
        latestStats: response.latestStats
      };
      
      // Check if sampleContent is an object and fix it
      if (typeof profileData.sampleContent === 'object' && profileData.sampleContent !== null && !Array.isArray(profileData.sampleContent)) {
        // Try to extract a meaningful value from the object
        let extractedValue = profileData.sampleContent.filename || 
                              profileData.sampleContent.name || 
                              profileData.sampleContent.url || 
                              profileData.sampleContent.value ||
                              Object.values(profileData.sampleContent)[0] ||
                              'unknown-file';
        
        // If we still have an object, convert to string
        if (typeof extractedValue === 'object') {
          extractedValue = JSON.stringify(extractedValue);
        }
        
        profileData.sampleContent = extractedValue;
      }
      
      setProfile(profileData);
      
      // Set edit data
      setEditData({
        fullName: profileData.fullName || '',
        phoneNumber: profileData.phoneNumber || '',
        city: profileData.city || '',
        country: profileData.country || '',
        dateOfBirth: profileData.dateOfBirth || '',
        gender: profileData.gender || '',
        maritalStatus: profileData.maritalStatus || '',
        children: profileData.children || '',
        bio: profileData.bio || '',
        location: profileData.location || '',
        faceOrFaceless: profileData.faceOrFaceless || '',
        categories: profileData.niche || [],  // Map niche to categories
        contentTypes: profileData.contentStyle || [],  // Map contentStyle to contentTypes
        languages: profileData.languages || [],
        // New detailed pricing structure
        reelPostPrice: profileData.reelPostPrice || '',
        staticPostPrice: profileData.staticPostPrice || '',
        reelStaticComboPrice: profileData.reelStaticComboPrice || '',
        storyVideoPrice: profileData.storyVideoPrice || '',
        storyShoutoutPrice: profileData.storyShoutoutPrice || '',
        storyUnboxingPrice: profileData.storyUnboxingPrice || '',
        eventAttendancePrice: profileData.eventAttendancePrice || '',
        outdoorShootPrice: profileData.outdoorShootPrice || '',
        expressDeliveryCharge: profileData.expressDeliveryCharge || '',
        // Delivery times
        productBasedDelivery: profileData.productBasedDelivery || '7-10 days',
        noProductDelivery: profileData.noProductDelivery || '5-7 days',
        expressDelivery: profileData.expressDelivery || '48-72 hours',
        outdoorEventDelivery: profileData.outdoorEventDelivery || '4-5 days',
        revisionsDelivery: profileData.revisionsDelivery || '3-4 days',
        sampleContentType: profileData.sampleContentType || 'link',
        sampleContent: profileData.sampleContentType === 'link' && Array.isArray(profileData.sampleContent) 
          ? '' 
          : profileData.sampleContent || '',
        sampleLinks: profileData.sampleContentType === 'link' && Array.isArray(profileData.sampleContent)
          ? profileData.sampleContent
          : profileData.sampleContentType === 'link' && profileData.sampleContent
          ? [profileData.sampleContent]
          : ['']
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
      setError('Failed to load profile data');
    } finally {
      setIsLoading(false);
    }
  }, [user?.uid]);

  const fetchYouTubeStats = useCallback(async () => {
    if (!profile?.youtubeChannelId) return;
    
    setIsLoadingYT(true);
    setYoutubeError('');
    
    try {
      // Fetch live YouTube analytics from backend (avoid using possibly stale profile fields)
      const response = await ugcCreatorAPI.getYouTubeAnalytics(user.uid);
      const channelInfo = response?.data?.channelInfo;

      if (channelInfo) {
        const stats = {
          subscribers: Number(channelInfo.subscriberCount || 0),
          views: Number(channelInfo.viewCount || 0),
          videos: Number(channelInfo.videoCount || 0),
          title: channelInfo.channelTitle || profile.youtubeChannelTitle,
          url: channelInfo.channelUrl || profile.youtubeChannelUrl || `https://www.youtube.com/channel/${profile.youtubeChannelId}`,
        };
        setYoutubeStats(stats);
      } else {
        // Fallback to profile fields if backend has no channelInfo yet
        const stats = {
          subscribers: profile.youtubeSubscribers || 0,
          views: profile.youtubeViews || 0,
          videos: profile.youtubeVideos || 0,
          title: profile.youtubeChannelTitle,
          url: profile.youtubeChannelUrl || `https://www.youtube.com/channel/${profile.youtubeChannelId}`,
        };
        setYoutubeStats(stats);
      }
    } catch (error) {
      console.error('Error fetching YouTube stats:', error);
      const msg = error?.response?.data?.message || 'Failed to load YouTube statistics';
      setYoutubeError(msg);
    } finally {
      setIsLoadingYT(false);
    }
  }, [profile?.youtubeChannelId, profile?.youtubeChannelTitle, profile?.youtubeChannelUrl, profile?.youtubeSubscribers, profile?.youtubeViews, profile?.youtubeVideos, user?.uid]);

  useEffect(() => {
    // Force refresh profile data
    setProfile(null);
    fetchProfile();
  }, [fetchProfile]);

  // Fetch YouTube stats when profile has a connected channel and YouTube data is available
  useEffect(() => {
    if (profile?.youtubeChannelId && profile?.youtubeSubscribers !== undefined) {
      fetchYouTubeStats();
    }
  }, [profile?.youtubeChannelId, profile?.youtubeSubscribers, profile?.youtubeViews, profile?.youtubeVideos, fetchYouTubeStats]);

  // Fetch detailed YouTube data when profile has a connected channel
  useEffect(() => {
    if (profile?.youtubeChannelId) {
      fetchDetailedYoutubeData();
    }
  }, [profile?.youtubeChannelId, fetchDetailedYoutubeData]);


  // Fetch detailed YouTube data when insights tab is active (only if not already loaded)
  useEffect(() => {
    if (activeTab === 'insights' && profile?.youtubeChannelId && !detailedYoutubeData && !youtubeDetailedLoading) {
      fetchDetailedYoutubeData();
    }
  }, [activeTab, profile?.youtubeChannelId, user?.uid, detailedYoutubeData, youtubeDetailedLoading, fetchDetailedYoutubeData]);

  useEffect(() => {
    const qs = new URLSearchParams(location.search);
    const tab = qs.get('tab');
    const allowed = ['dashboard','insights','connect-socials','instagram','collaborations','messages'];
    if (tab && allowed.includes(tab)) {
      setActiveTab(tab);
    }
  }, [location.search]);

  useEffect(() => {
    if (profile?.instagramUsername && !detailedInstagramData && !detailedLoadingIG) {
      fetchDetailedInstagramData();
    }
  }, [profile?.instagramUsername, detailedInstagramData, detailedLoadingIG, fetchDetailedInstagramData]);


  const handleEdit = () => {
    // Populate edit data with current profile data when entering edit mode
    setEditData({
      fullName: profile?.fullName || '',
      phoneNumber: profile?.phoneNumber || '',
      city: profile?.city || '',
      country: profile?.country || '',
      dateOfBirth: profile?.dateOfBirth || '',
      gender: profile?.gender || '',
      maritalStatus: profile?.maritalStatus || '',
      children: profile?.children || '',
      bio: profile?.bio || '',
      location: profile?.location || '',
      faceOrFaceless: profile?.faceOrFaceless || '',
      categories: profile?.niche || [],
      contentTypes: profile?.contentStyle || [],
      // New detailed pricing structure
      reelPostPrice: profile?.reelPostPrice || '',
      staticPostPrice: profile?.staticPostPrice || '',
      reelStaticComboPrice: profile?.reelStaticComboPrice || '',
      storyVideoPrice: profile?.storyVideoPrice || '',
      storyShoutoutPrice: profile?.storyShoutoutPrice || '',
      storyUnboxingPrice: profile?.storyUnboxingPrice || '',
      eventAttendancePrice: profile?.eventAttendancePrice || '',
      outdoorShootPrice: profile?.outdoorShootPrice || '',
      expressDeliveryCharge: profile?.expressDeliveryCharge || '',
      // Delivery times
      productBasedDelivery: profile?.productBasedDelivery || '7-10 days',
      noProductDelivery: profile?.noProductDelivery || '5-7 days',
      expressDelivery: profile?.expressDelivery || '48-72 hours',
      outdoorEventDelivery: profile?.outdoorEventDelivery || '4-5 days',
      revisionsDelivery: profile?.revisionsDelivery || '3-4 days',
      sampleContentType: profile?.sampleContentType || 'link',
      sampleContent: profile?.sampleContentType === 'link' && Array.isArray(profile?.sampleContent) 
        ? '' 
        : profile?.sampleContent || '',
      sampleLinks: profile?.sampleContentType === 'link' && Array.isArray(profile?.sampleContent)
        ? profile.sampleContent 
        : [],
      languages: profile?.languages || []
    });
    setEditMode(true);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleMultiSelectChange = (name, selectedOptions) => {
    console.log('handleMultiSelectChange called with:', name, selectedOptions);
    console.log('current editData before update:', editData);
    setEditData(prev => ({
      ...prev,
      [name]: selectedOptions
    }));
  };

  const validatePriceRange = () => {
    const errors = {};
    
    // Validate new pricing structure - at least one pricing field should be filled
    const pricingFields = [
      { key: 'reelPostPrice', name: 'Reel Post' },
      { key: 'staticPostPrice', name: 'Static Post' },
      { key: 'reelStaticComboPrice', name: 'Reel + Static Combo' },
      { key: 'storyVideoPrice', name: 'Story Video' },
      { key: 'storyShoutoutPrice', name: 'Story Shoutout' },
      { key: 'storyUnboxingPrice', name: 'Story Unboxing' },
      { key: 'eventAttendancePrice', name: 'Event Attendance' },
      { key: 'outdoorShootPrice', name: 'Outdoor Shoot' },
      { key: 'expressDeliveryCharge', name: 'Express Delivery Charge' }
    ];

    let hasPricing = false;
    pricingFields.forEach(field => {
      const value = editData[field.key];
      if (value && parseFloat(value) > 0) {
        hasPricing = true;
      } else if (value && parseFloat(value) <= 0) {
        errors[field.key] = `${field.name} price must be greater than 0`;
      }
    });

    if (!hasPricing) {
      errors.pricing = 'At least one pricing field must be filled';
    }
    
    return errors;
  };

  // Sample Content / Portfolio handlers - unused functions removed
  
  const handleSaveProfile = async () => {
    setIsUpdating(true);
    setError('');
    setSuccess('');

    console.log('handleSaveProfile - editData being sent:', editData);

    // Validate price range
    const priceErrors = validatePriceRange();
    if (Object.keys(priceErrors).length > 0) {
      setError(Object.values(priceErrors).join(', '));
      setIsUpdating(false);
      return;
    }

    try {
      // Prepare data for API submission
      const dataToSend = { ...editData };
      
      // Handle sample content formatting
      if (dataToSend.sampleContentType === 'link' && dataToSend.sampleLinks) {
        // Filter out empty links and set as sampleContent
        const validLinks = dataToSend.sampleLinks.filter(link => link.trim() !== '');
        dataToSend.sampleContent = validLinks.length > 0 ? validLinks : '';
        delete dataToSend.sampleLinks; // Remove temporary field
      } else if (dataToSend.sampleContentType === 'upload') {
        // Handle multiple files or existing content
        if (Array.isArray(dataToSend.sampleContent)) {
          // New files uploaded - keep the array of file objects
          // The API will handle multiple file uploads appropriately
        } else {
          // Keep existing filename or single file
          // The API will handle this appropriately
        }
      }

      // Remove empty string fields to satisfy backend optional validators
      Object.keys(dataToSend).forEach((key) => {
        const val = dataToSend[key];
        if (typeof val === 'string' && val.trim() === '') {
          delete dataToSend[key];
        }
      });

      // Drop empty arrays for categories/contentTypes
      if (Array.isArray(dataToSend.categories) && dataToSend.categories.length === 0) {
        delete dataToSend.categories;
      }
      if (Array.isArray(dataToSend.contentTypes) && dataToSend.contentTypes.length === 0) {
        delete dataToSend.contentTypes;
      }

      // Explicitly remove empty pricing fields
      ['reelPostPrice','staticPostPrice','reelStaticComboPrice','storyVideoPrice','storyShoutoutPrice','storyUnboxingPrice','eventAttendancePrice','outdoorShootPrice','expressDeliveryCharge']
        .forEach((f) => {
          const v = dataToSend[f];
          if (v === '' || v === null || v === undefined) {
            delete dataToSend[f];
          }
        });

      console.log('Calling updateProfile API with:', dataToSend);
      await ugcCreatorAPI.updateProfile(user.uid, dataToSend);
      setSuccess('Profile updated successfully!');
      setEditMode(false);
      await fetchProfile(); // Refresh profile data
    } catch (error) {
      console.error('Error updating profile:', error);
      setError(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleConnectYouTube = async () => {
    if (!youtubeChannelUrl.trim()) {
      setError('Please enter a YouTube channel URL');
      return;
    }

    setConnectingYoutube(true);
    setError('');
    setSuccess('');
    
    try {
      // Extract channel ID or name from URL
      let channelQuery = youtubeChannelUrl.trim();
      
      // Handle different YouTube URL formats
      if (channelQuery.includes('youtube.com/channel/')) {
        channelQuery = channelQuery.split('youtube.com/channel/')[1].split('/')[0];
      } else if (channelQuery.includes('youtube.com/c/')) {
        channelQuery = channelQuery.split('youtube.com/c/')[1].split('/')[0];
      } else if (channelQuery.includes('youtube.com/@')) {
        channelQuery = channelQuery.split('youtube.com/@')[1].split('/')[0];
      } else if (channelQuery.includes('youtube.com/user/')) {
        channelQuery = channelQuery.split('youtube.com/user/')[1].split('/')[0];
      }

      const response = await ugcCreatorAPI.connectYouTube(user.uid, { channelQuery });
      
      if (response.success) {
        // Update profile state immediately for UI refresh
        setProfile(prev => ({
          ...prev,
          youtubeChannelId: response.data.youtubeChannelId,
          youtubeChannelTitle: response.data.youtubeChannelTitle,
          youtubeChannelUrl: response.data.youtubeChannelUrl,
          subscriberCount: response.data.subscriberCount,
          viewCount: response.data.viewCount,
          videoCount: response.data.videoCount
        }));
        
        setYoutubeChannelUrl('');
        setSuccess(`YouTube channel "${response.data.youtubeChannelTitle}" connected successfully!`);
        
        // Auto-dismiss success message after 5 seconds
        setTimeout(() => setSuccess(''), 5000);
        
        // Fetch fresh profile data and YouTube analytics after successful connection
        try {
          await fetchProfile();
          // Only fetch detailed data if we have a channel ID
          if (response.data.youtubeChannelId) {
            await fetchDetailedYoutubeData();
          }
        } catch (fetchError) {
          console.error('Error fetching updated data after YouTube connection:', fetchError);
          // Don't show error to user as the connection was successful
        }
      } else {
        setError(response.message || 'Failed to connect YouTube channel');
      }
    } catch (error) {
      console.error('Error connecting YouTube:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      
      let errorMessage = 'Failed to connect YouTube channel. Please check the URL and try again.';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.status === 401) {
        errorMessage = 'Authentication failed. Please log in again.';
      } else if (error.response?.status === 403) {
        errorMessage = 'You do not have permission to perform this action.';
      }
      
      setError(errorMessage);
    } finally {
      setConnectingYoutube(false);
    }
  };

  const handleDisconnectYouTube = async () => {
    if (!window.confirm('Are you sure you want to disconnect your YouTube channel?')) {
      return;
    }

    setError('');
    setSuccess('');

    try {
      const response = await ugcCreatorAPI.updateProfile(user.uid, {
        youtubeChannelId: '',
        youtubeChannelTitle: '',
        youtubeChannelUrl: '',
        subscriberCount: 0,
        viewCount: 0,
        videoCount: 0
      });

      if (response.success) {
        // Update profile state immediately for UI refresh
        setProfile(prev => ({
          ...prev,
          youtubeChannelId: '',
          youtubeChannelTitle: '',
          youtubeChannelUrl: '',
          subscriberCount: 0,
          viewCount: 0,
          videoCount: 0
        }));
        
        // Clear detailed YouTube data
        setDetailedYoutubeData(null);
        
        setSuccess('YouTube channel disconnected successfully!');
        
        // Auto-dismiss success message after 5 seconds
        setTimeout(() => setSuccess(''), 5000);
        
        // Fetch fresh profile data after disconnection
        try {
          await fetchProfile();
        } catch (fetchError) {
          console.error('Error fetching updated data after YouTube disconnection:', fetchError);
          // Don't show error to user as the disconnection was successful
        }
      } else {
        setError('Failed to disconnect YouTube channel');
      }
    } catch (error) {
      console.error('Error disconnecting YouTube:', error);
      setError('Failed to disconnect YouTube channel');
    }
  };

  // Video modal functions
  const handleVideoPlay = (video) => {
    setSelectedVideo(video);
    setShowVideoModal(true);
  };

  const handleCloseVideoModal = () => {
    setShowVideoModal(false);
    setSelectedVideo(null);
  };

  const handleYtVideoClick = (video) => {
    if (!video) return;
    setSelectedVideoId(video.videoId);
    setSelectedVideo(video);
    setShowVideoModal(true);
  };


  // YouTube insights functions
  // fetchDetailedYoutubeData is now defined earlier with useCallback

  const refreshYoutubeData = async () => {
    if (!profile?.youtubeChannelId || !user?.uid) return;
    
    setYoutubeDetailedLoading(true);
    setYoutubeDetailedError('');
    
    try {
      await ugcCreatorAPI.refreshYouTubeData(user.uid);
      // Refresh the detailed data after successful refresh
      await fetchDetailedYoutubeData();
      // Also refresh basic stats
      await fetchProfile();
    } catch (error) {
      console.error('Error refreshing YouTube data:', error);
      setYoutubeDetailedError('Failed to refresh YouTube data');
    } finally {
      setYoutubeDetailedLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setEditMode(false);
    setError('');
    setSuccess('');
    // Reset edit data to current profile data
    setEditData({
      fullName: profile?.fullName || '',
      phoneNumber: profile?.phoneNumber || '',
      city: profile?.city || '',
      country: profile?.country || '',
      dateOfBirth: profile?.dateOfBirth || '',
      gender: profile?.gender || '',
      maritalStatus: profile?.maritalStatus || '',
      children: profile?.children || '',
      bio: profile?.bio || '',
      location: profile?.location || '',
      faceOrFaceless: profile?.faceOrFaceless || '',
      categories: profile?.niche || [],  // Map niche to categories
      contentTypes: profile?.contentStyle || [],  // Map contentStyle to contentTypes
      priceRangeMin: profile?.priceRangeMin || '',
      priceRangeMax: profile?.priceRangeMax || '',
      sampleContentType: profile?.sampleContentType || 'link',
      sampleContent: profile?.sampleContentType === 'link' && Array.isArray(profile?.sampleContent) 
        ? '' 
        : profile?.sampleContent || '',
      sampleLinks: profile?.sampleContentType === 'link' && Array.isArray(profile?.sampleContent)
        ? profile.sampleContent
        : profile?.sampleContentType === 'link' && profile?.sampleContent
        ? [profile.sampleContent]
        : ['']
    });
  };

  if (isLoading) {
    return (
      <Container className="mt-4 ugc-dashboard">
        <div className="text-center">
          <Spinner animation="border" role="status" variant="primary">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
        </div>
      </Container>
    );
  }

  return (
    <Container className="mt-4 ugc-dashboard">
      
      <Row className="g-3 align-items-stretch">
        <Col xs={12} md="auto" className="mb-3 ugc-left-nav-sticky" style={{ flex: '0 0 20%', maxWidth: '20%' }}>
          <UGCLeftNav activeKey={activeTab} onSelect={setActiveTab} user={user} profile={profile} />
        </Col>
        <Col xs={12} style={{ flex: '0 0 80%', maxWidth: '80%' }}>
          {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}
          {success && <Alert variant="success" dismissible onClose={() => setSuccess('')}>{success}</Alert>}
          <Card className="border-0 shadow-sm mb-3" style={{ borderRadius: '16px', background: '#ffffff' }}>
            <Card.Body className="d-flex align-items-center justify-content-between">
              <div className="d-flex align-items-center gap-3">
                <h3 className="mb-0">Your Profile</h3>
                <Badge bg="danger" className="rounded-pill">{`${calculateCompletionPercentage(profile)}% COMPLETE`}</Badge>
              </div>
              <Button variant="outline-secondary">Preview</Button>
            </Card.Body>
            <Card.Body className="pt-0">
              <div className="d-flex align-items-center gap-4 text-muted" style={{ fontWeight: 500 }}>
                <span style={{ cursor: 'pointer' }} onClick={() => navigate('/ugc/my-profile?tab=account')}>Account Settings</span>
                <span style={{ cursor: 'pointer' }} onClick={() => navigate('/ugc/my-profile?tab=match')}>Match Profile</span>
                <span style={{ cursor: 'pointer' }} onClick={() => navigate('/ugc/my-profile?tab=social')}>Social Profiles</span>
                <span>Reviews</span>
                <span>Portfolio</span>
              </div>
            </Card.Body>
          </Card>

          <Tab.Container activeKey={activeTab} onSelect={setActiveTab}>
            <Tab.Content>
              <Tab.Pane eventKey="dashboard">
                <Card className="border-0 shadow-none bg-transparent">
                  <Card.Body className="p-0">
                  {/* New dashboard layout: analytics + sidebar */}
                    <Row className="g-4">
                      
                      <Col md={8}>
                        <Row className="g-4 mb-4">
                              <Col md={6}>
                                <Card className="border-0 shadow-sm h-100" style={{ borderRadius: '16px' }}>
                                  <Card.Body>
                                    <div className="d-flex justify-content-between align-items-start">
                                      <div className="d-flex align-items-center">
                                        <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'linear-gradient(45deg, #405DE6, #5B51D8, #833AB4, #C13584, #E1306C, #FD1D1D, #F56040, #F77737, #FCAF45, #FFDC80)' }} className="d-flex align-items-center justify-content-center text-white">
                                          <i className="bi bi-instagram fs-4"></i>
                                        </div>
                                        <div className="ms-3">
                                          <h6 className="mb-0">Instagram</h6>
                                          <p className="mb-0 fs-5 fw-bold">{formatNumber(detailedInstagramData?.profile?.followers ?? profile?.latestStats?.followers ?? 0)} <span className="fs-6 fw-normal">Follower</span></p>
                                        </div>
                                      </div>
                                      <i className="bi bi-chevron-right text-muted fs-5"></i>
                                    </div>
                                    <div className="d-flex align-items-center mt-2">
                                      <span className="badge rounded-pill bg-success me-2">↑20%</span>
                                      <span className="text-muted">Increased after 1 month</span>
                                    </div>
                                  </Card.Body>
                                </Card>
                              </Col>
                              <Col md={6}>
                                <Card className="border-0 shadow-sm h-100" style={{ borderRadius: '16px' }}>
                                  <Card.Body>
                                    <div className="d-flex justify-content-between align-items-start">
                                      <div className="d-flex align-items-center">
                                        <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#000000' }} className="d-flex align-items-center justify-content-center text-white">
                                          <SiTiktok size={24} color="#ffffff" />
                                        </div>
                                        <div className="ms-3">
                                          <h6 className="mb-0">TikTok</h6>
                                          <p className="mb-0 fs-5 fw-bold">43.751 <span className="fs-6 fw-normal">Follower</span></p>
                                        </div>
                                      </div>
                                      <i className="bi bi-chevron-right text-muted fs-5"></i>
                                    </div>
                                    <div className="d-flex align-items-center mt-2">
                                      <span className="badge rounded-pill bg-danger me-2">↓8%</span>
                                      <span className="text-muted">Increased after 1 month</span>
                                    </div>
                                  </Card.Body>
                                </Card>
                              </Col>
                              <Col md={6}>
                                <Card className="border-0 shadow-sm h-100" style={{ borderRadius: '16px' }}>
                                  <Card.Body>
                                    <div className="d-flex justify-content-between align-items-start">
                                      <div className="d-flex align-items-center">
                                        <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#FF0000' }} className="d-flex align-items-center justify-content-center text-white">
                                          <i className="bi bi-youtube fs-4"></i>
                                        </div>
                                        <div className="ms-3">
                                          <h6 className="mb-0">YouTube</h6>
                                          <p className="mb-0 fs-5 fw-bold">{formatNumber(youtubeStats?.subscribers ?? profile?.youtubeSubscribers ?? 0)} <span className="fs-6 fw-normal">Subscribe</span></p>
                                        </div>
                                      </div>
                                      <i className="bi bi-chevron-right text-muted fs-5"></i>
                                    </div>
                                    <div className="d-flex align-items-center mt-2">
                                      <span className="badge rounded-pill bg-success me-2">↑18%</span>
                                      <span className="text-muted">Increased after 1 month</span>
                                    </div>
                                  </Card.Body>
                                </Card>
                              </Col>
                        </Row>
                        {(() => {
                          const videos = detailedYoutubeData?.recentVideos || [];
                          const items = (videos && videos.length ? videos.slice(0, 4) : Array.from({ length: 4 }, () => ({})));
                          return (
                            <Card className="mb-4 border-0 shadow-sm" style={{ borderRadius: '24px', background: '#ffffff' }}>
                              <Card.Header className="d-flex align-items-center justify-content-between">
                                <h5 className="mb-0">Recent Videos</h5>
                                <small className="text-muted">Latest {Math.min(4, videos.length || 0)} items</small>
                              </Card.Header>
                              <Card.Body>
                                <Row className="g-4">
                                  {items.map((video, idx) => {
                                    const thumbs = video?.thumbnails || {};
                                    const apiThumb = (thumbs.high && thumbs.high.url) || (thumbs.medium && thumbs.medium.url) || (thumbs.default && thumbs.default.url) || null;
                                    const computedThumb = (!apiThumb && !video?.thumbnailUrl && !video?.thumbnail && video?.videoId) ? `https://i.ytimg.com/vi/${video.videoId}/hqdefault.jpg` : null;
                                    const thumbUrl = apiThumb || video?.thumbnail || video?.thumbnailUrl || computedThumb || '';
                                    const views = Number(video?.viewCount || 0);
                                    const likes = Number(video?.likeCount || 0);
                                    const comments = Number(video?.commentCount || 0);
                                    const engagement = views > 0 ? ((likes + comments) / views) * 100 : 0;
                                    return (
                                      <Col md={3} sm={6} key={`yt-analytics-${video?.videoId || idx}`}>
                                        <Card className="border-0 shadow-sm h-100" style={{ borderRadius: '24px', background: '#ffffff' }}>
                                          <div style={{ width: '100%', height: 160, overflow: 'hidden', borderTopLeftRadius: '24px', borderTopRightRadius: '24px', background: '#f8f9fa' }}>
                                            {thumbUrl ? (
                                              <img src={thumbUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            ) : null}
                                          </div>
                                          <Card.Body className="p-3">
                                            <div className="d-flex justify-content-between align-items-start">
                                              <div className="fw-bold" style={{ fontSize: '1rem' }}>{engagement.toFixed(1)}%</div>
                                              <div className="text-muted" style={{ fontSize: '0.95rem' }}>{formatNumber(views)}</div>
                                            </div>
                                            <div className="d-flex justify-content-between text-muted" style={{ fontSize: '0.85rem' }}>
                                              <span>Engagement Rate</span>
                                              <span>Views</span>
                                            </div>
                                          </Card.Body>
                                        </Card>
                                      </Col>
                                    );
                                  })}
                                </Row>
                              </Card.Body>
                            </Card>
                          );
                        })()}
                        
                        {/* Top Recent Videos section, placed after UGC Analytics */}
                        {detailedYoutubeData?.recentVideos?.length ? (
                          <Card className="mb-4 border-0 shadow-sm">
                            <Card.Header className="d-flex align-items-center justify-content-between">
                              <h5 className="mb-0">Top Recent Videos</h5>
                              <small className="text-muted">Latest {Math.min(6, detailedYoutubeData.recentVideos.length)} items</small>
                            </Card.Header>
                            <Card.Body>
                              <Row className="g-3">
                                {detailedYoutubeData.recentVideos.slice(0, 6).map((video, index) => {
                                  const views = Number(video.viewCount || 0);
                                  const likes = Number(video.likeCount || 0);
                                  const comments = Number(video.commentCount || 0);
                                  const engagement = views > 0 ? ((likes + comments) / views) * 100 : 0;
                                  const statusLabel = engagement >= 5 ? 'Positive' : engagement >= 3 ? 'Neutral' : 'Pending';
                                  const statusVariant = engagement >= 5 ? 'success' : engagement >= 3 ? 'secondary' : 'warning';
                                  return (
                                    <Col md={4} sm={6} key={index}>
                                      <Card className="h-100 border-0 shadow-sm">
                                        <div className="position-relative">
                                          {video.thumbnail ? (
                                            <Card.Img 
                                              variant="top" 
                                              src={video.thumbnail} 
                                              style={{ height: '120px', objectFit: 'cover' }} 
                                              onClick={() => handleVideoPlay(video)} 
                                            />
                                          ) : (
                                            <div style={{ height: '120px', background: '#f8f9fa' }} />
                                          )}
                                          <Badge bg={statusVariant} className="position-absolute top-0 start-0 m-2">{statusLabel}</Badge>
                                        </div>
                                        <Card.Body className="p-3">
                                          <div className="d-flex justify-content-between align-items-start mb-1">
                                            <div className="fw-bold" style={{ fontSize: '1rem' }}>
                                              {engagement.toFixed(1)}%
                                            </div>
                                            <div className="text-muted" style={{ fontSize: '0.85rem' }}>
                                              {formatNumber(views)}
                                            </div>
                                          </div>
                                          <div className="text-muted" style={{ fontSize: '0.85rem' }}>Engagement Rate</div>
                                          <div className="d-flex justify-content-between mt-1" style={{ fontSize: '0.85rem' }}>
                                            <span><i className="bi bi-hand-thumbs-up me-1"></i>{formatNumber(likes)}</span>
                                            <span><i className="bi bi-chat-dots me-1"></i>{formatNumber(comments)}</span>
                                          </div>
                                          <div className="mt-2">
                                            <Badge bg={statusVariant}>{statusLabel}</Badge>
                                          </div>
                                        </Card.Body>
                                      </Card>
                                    </Col>
                                  );
                                })}
                              </Row>
                            </Card.Body>
                          </Card>
                        ) : null}
                        
                      </Col>
                      <Col md={4}>
                        <Card>
                          <Card.Header className="d-flex justify-content-between align-items-center">
                            <h5 className="mb-0">UGC Profile</h5>
                            {!editMode ? (
                              <Button variant="outline-primary" onClick={handleEdit}>Edit Profile</Button>
                            ) : (
                              <div>
                                <Button variant="success" onClick={handleSaveProfile} disabled={isUpdating} className="me-2">
                                  {isUpdating ? <Spinner animation="border" size="sm" /> : 'Save'}
                                </Button>
                                <Button variant="outline-secondary" onClick={handleCancelEdit}>Cancel</Button>
                              </div>
                            )}
                          </Card.Header>
                          <Card.Body>
                            <Form.Group className="mb-3">
                              <Form.Label>Bio</Form.Label>
                              {editMode ? (
                                <Form.Control as="textarea" rows={3} name="bio" value={editData.bio} onChange={handleEditChange} />
                              ) : (
                                <p className="form-control-plaintext">{profile?.bio || 'Not set'}</p>
                              )}
                            </Form.Group>
                            <Form.Group className="mb-3">
                              <Form.Label>Niche</Form.Label>
                              {editMode ? (
                                <MultiSelect options={categoryOptions} value={editData.categories} onChange={(sel) => handleMultiSelectChange('categories', sel)} placeholder="Select niches..." />
                              ) : (
                                <div>
                                  {profile?.niche?.length ? profile.niche.map((item, i) => <Badge key={i} bg="primary" className="me-1 mb-1">{item}</Badge>) : <p className="form-control-plaintext">Not set</p>}
                                </div>
                              )}
                            </Form.Group>
                            <Form.Group className="mb-3">
                              <Form.Label>Content Style</Form.Label>
                              {editMode ? (
                                <MultiSelect options={contentTypeOptions} value={editData.contentTypes} onChange={(sel) => handleMultiSelectChange('contentTypes', sel)} placeholder="Select content styles..." />
                              ) : (
                                <div>
                                  {profile?.contentStyle?.length ? profile.contentStyle.map((style, i) => <Badge key={i} bg="secondary" className="me-1 mb-1">{style}</Badge>) : <p className="form-control-plaintext">Not set</p>}
                                </div>
                              )}
                            </Form.Group>
                            <Form.Group className="mb-3">
                              <Form.Label>Languages</Form.Label>
                              {editMode ? (
                                <MultiSelect options={languageOptions} value={editData.languages || []} onChange={(sel) => handleMultiSelectChange('languages', sel)} placeholder="Select languages..." />
                              ) : (
                                <div>
                                  {profile?.languages?.length ? profile.languages.map((l, i) => <Badge key={i} bg="success" className="me-1 mb-1">{l}</Badge>) : <p className="form-control-plaintext">Not set</p>}
                                </div>
                              )}
                            </Form.Group>
                            <Form.Group className="mb-3">
                              <Form.Label>Reel Post Price ($)</Form.Label>
                              {editMode ? (
                                <Form.Control type="number" name="reelPostPrice" value={editData.reelPostPrice} onChange={handleEditChange} min="0" step="0.01" placeholder="Enter reel post price" />
                              ) : (
                                <p className="form-control-plaintext">{profile?.reelPostPrice ? `$${profile.reelPostPrice}` : 'Not set'}</p>
                              )}
                            </Form.Group>
                            <Form.Group className="mb-3">
                              <Form.Label>Event Attendance Price ($)</Form.Label>
                              {editMode ? (
                                <Form.Control type="number" name="eventAttendancePrice" value={editData.eventAttendancePrice} onChange={handleEditChange} min="0" step="0.01" placeholder="Enter price" />
                              ) : (
                                <p className="form-control-plaintext">{profile?.eventAttendancePrice ? `$${profile.eventAttendancePrice}` : 'Not set'}</p>
                              )}
                            </Form.Group>
                            <Form.Group className="mb-3">
                              <Form.Label>Average Delivery</Form.Label>
                              {editMode ? (
                                <Form.Select name="productBasedDelivery" value={editData.productBasedDelivery} onChange={handleEditChange}>
                                  <option value="7-10 days">7-10 days after product received</option>
                                  <option value="5-7 days">5-7 days after product received</option>
                                  <option value="10-14 days">10-14 days after product received</option>
                                </Form.Select>
                              ) : (
                                <p className="form-control-plaintext">{profile?.productBasedDelivery || '7-10 days after product received'}</p>
                              )}
                            </Form.Group>
                          </Card.Body>
                        </Card>
                      </Col>
                    </Row>
                    {/* Removed legacy Profile Information section */}
                  </Card.Body>
                </Card>
              </Tab.Pane>

              <Tab.Pane eventKey="connect-socials">
                <Card>
                  <Card.Header>
                    <h5 className="mb-0">
                      <i className="bi bi-share me-2"></i>
                      Connect Social Media
                    </h5>
                  </Card.Header>
                  <Card.Body>
                    {/* YouTube Connection Section */}
                    <Row className="mb-4">
                      <Col md={12}>
                        <Card className="border-0 shadow-sm">
                          <Card.Body>
                            <div className="d-flex align-items-center mb-3">
                              <i className="bi bi-youtube text-danger me-3 fs-3"></i>
                              <div>
                                <h6 className="mb-0">YouTube Channel</h6>
                                <small className="text-muted">Connect your YouTube channel to showcase your content</small>
                              </div>
                            </div>

                            {profile?.youtubeChannelId ? (
                              <div>
                                <Alert variant="success" className="mb-3">
                                  <div className="d-flex align-items-center justify-content-between">
                                    <div className="d-flex align-items-center">
                                      <i className="bi bi-check-circle me-2 text-success"></i>
                                      <div>
                                        <strong>{profile.youtubeChannelTitle}</strong>
                                        <div className="small text-muted">
                                          <a 
                                            href={profile.youtubeChannelUrl} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="text-decoration-none"
                                          >
                                            <i className="bi bi-box-arrow-up-right me-1"></i>
                                            View Channel
                                          </a>
                                        </div>
                                      </div>
                                    </div>
                                    <Button
                                      variant="outline-danger"
                                      size="sm"
                                      onClick={handleDisconnectYouTube}
                                    >
                                      <i className="bi bi-x-lg me-1"></i>
                                      Disconnect
                                    </Button>
                                  </div>
                                </Alert>
                              </div>
                            ) : (
                              <div>
                                <Form.Group className="mb-3">
                                  <Form.Label>YouTube Channel URL</Form.Label>
                                  <Form.Control
                                    type="url"
                                    placeholder="https://www.youtube.com/@yourchannel or https://www.youtube.com/channel/UCxxxxx"
                                    value={youtubeChannelUrl}
                                    onChange={(e) => setYoutubeChannelUrl(e.target.value)}
                                    disabled={connectingYoutube}
                                  />
                                  <Form.Text className="text-muted">
                                    Enter your YouTube channel URL. We support various formats including @username, channel ID, and custom URLs.
                                  </Form.Text>
                                </Form.Group>
                                
                                <div className="d-flex gap-2">
                                  <Button 
                                    variant="danger" 
                                    onClick={handleConnectYouTube}
                                    disabled={connectingYoutube || !youtubeChannelUrl.trim()}
                                  >
                                    {connectingYoutube ? (
                                      <>
                                        <Spinner size="sm" className="me-2" />
                                        Connecting...
                                      </>
                                    ) : (
                                      <>
                                        <i className="bi bi-youtube me-2"></i>
                                        Connect YouTube Channel
                                      </>
                                    )}
                                  </Button>
                                </div>
                              </div>
                            )}
                          </Card.Body>
                        </Card>
                      </Col>
                    </Row>

                    {/* Instagram Connection Section */}
                    <Row className="mb-4">
                      <Col md={12}>
                        <Card className="border-0 shadow-sm">
                          <Card.Body>
                            <div className="d-flex align-items-center mb-3">
                              <i className="bi bi-instagram me-3 fs-3"></i>
                              <div>
                                <h6 className="mb-0">Instagram</h6>
                                <small className="text-muted">Connect your Instagram to enable insights and reels</small>
                              </div>
                            </div>
                            {!profile?.instagramUsername ? (
                              <>
                                <Form.Group className="mb-3">
                                  <Form.Label>Instagram Username</Form.Label>
                                  <Form.Control
                                    type="text"
                                    placeholder="Enter your Instagram username (without @)"
                                    value={instagramUsernameInput}
                                    onChange={(e) => setInstagramUsernameInput(e.target.value)}
                                    disabled={savingInstagram}
                                  />
                                  <Form.Text className="text-muted">
                                    We’ll use your username to fetch public profile insights when available.
                                  </Form.Text>
                                </Form.Group>
                                <Button 
                                  variant="primary" 
                                  onClick={handleSaveInstagram} 
                                  disabled={savingInstagram || !instagramUsernameInput.trim()}
                                >
                                  {savingInstagram ? 'Saving…' : 'Connect Instagram'}
                                </Button>
                              </>
                            ) : (
                              <>
                                <Alert variant="success" className="mb-3">
                                  Connected as <strong>@{profile.instagramUsername}</strong>.{' '}
                                  <a
                                    href={`https://instagram.com/${profile.instagramUsername}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-decoration-none"
                                  >
                                    View profile
                                  </a>
                                </Alert>
                                <Button 
                                  variant="outline-danger" 
                                  onClick={handleDisconnectInstagram} 
                                  disabled={savingInstagram}
                                >
                                  Disconnect
                                </Button>
                              </>
                            )}
                          </Card.Body>
                        </Card>
                      </Col>
                    </Row>
                    {/* TikTok Connection Section */}
                    <Row className="mb-4">
                      <Col md={12}>
                        <Card className="border-0 shadow-sm">
                          <Card.Body>
                            <div className="d-flex align-items-center mb-3">
                              <i className="bi bi-tiktok me-3 fs-3"></i>
                              <div>
                                <h6 className="mb-0">TikTok</h6>
                                <small className="text-muted">Connect your TikTok to show your profile to brands</small>
                              </div>
                            </div>
                            {!profile?.tiktokUsername ? (
                              <>
                                <Form.Group className="mb-3">
                                  <Form.Label>TikTok Username</Form.Label>
                                  <Form.Control
                                    type="text"
                                    placeholder="Enter your TikTok username (without @)"
                                    value={tiktokUsernameInput}
                                    onChange={(e) => setTiktokUsernameInput(e.target.value)}
                                    disabled={savingTikTok}
                                  />
                                </Form.Group>
                                <Button 
                                  style={{ backgroundColor: '#ff0050', borderColor: '#ff0050' }}
                                  onClick={handleSaveTikTok}
                                  disabled={savingTikTok || !tiktokUsernameInput.trim()}
                                >
                                  {savingTikTok ? 'Saving…' : 'Connect TikTok'}
                                </Button>
                              </>
                            ) : (
                              <>
                                <Alert variant="success" className="mb-3">
                                  Connected as <strong>@{profile.tiktokUsername}</strong>.
                                </Alert>
                                <Button 
                                  variant="outline-danger" 
                                  onClick={handleDisconnectTikTok} 
                                  disabled={savingTikTok}
                                >
                                  Disconnect
                                </Button>
                              </>
                            )}
                          </Card.Body>
                        </Card>
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>
              </Tab.Pane>

              <Tab.Pane eventKey="instagram">
                <Card>
                  <Card.Header className="d-flex align-items-center justify-content-between">
                    <h5 className="mb-0">
                      <i className="bi bi-instagram me-2"></i>
                      Instagram
                    </h5>
                    {profile?.instagramUsername && (
                      <Badge bg="secondary">@{profile.instagramUsername}</Badge>
                    )}
                  </Card.Header>
                  <Card.Body>
                    {!profile?.instagramUsername && (
                      <Form.Group className="mb-3">
                        <Form.Label>Instagram Username</Form.Label>
                        <Form.Control
                          type="text"
                          placeholder="Enter your Instagram username (without @)"
                          value={instagramUsernameInput}
                          onChange={(e) => setInstagramUsernameInput(e.target.value)}
                          disabled={savingInstagram}
                        />
                        <Form.Text className="text-muted">We’ll use your username to fetch public profile insights when available.</Form.Text>
                      </Form.Group>
                    )}
                    <div className="d-flex gap-2">
                      {!profile?.instagramUsername && (
                        <Button variant="primary" onClick={handleSaveInstagram} disabled={savingInstagram}>{savingInstagram ? 'Saving…' : 'Save Instagram'}</Button>
                      )}
                      {profile?.instagramUsername && (
                        <Button variant="outline-danger" onClick={handleDisconnectInstagram} disabled={savingInstagram}>Disconnect</Button>
                      )}
                    </div>
                    {profile?.instagramUsername ? (
                      <Alert variant="success" className="mt-3">
                        Connected as <strong>@{profile.instagramUsername}</strong>.
                        <a href={`https://instagram.com/${profile.instagramUsername}`} target="_blank" rel="noopener noreferrer" className="ms-1">View profile</a>
                      </Alert>
                    ) : (
                      <Alert variant="info" className="mt-3">Enter your Instagram username and click Save to connect.</Alert>
                    )}

                    {profile?.instagramUsername && (
                      <>
                        <div className="yt-glass-panel mb-3">
                          <div className="d-flex align-items-center justify-content-between">
                            <div className="d-flex align-items-center gap-3">
                              <div className="rounded-circle bg-light d-flex align-items-center justify-content-center" style={{ width: 48, height: 48 }}>
                                <i className="bi bi-instagram text-dark"></i>
                              </div>
                              <div>
                                <div className="fw-semibold">{detailedInstagramData?.profile?.fullName || profile.fullName || 'Profile Name'} <span className="text-muted">@{detailedInstagramData?.profile?.username || profile.instagramUsername}</span></div>
                                <div className="small text-muted">Connected</div>
                              </div>
                            </div>
                            <Button size="sm" variant="outline-primary" className="glass-button" onClick={handleSyncInstagram} disabled={isUpdating}>{isUpdating ? 'Refreshing…' : 'Refresh'}</Button>
                          </div>
                        </div>

                        {(() => {
                          const followersCount = detailedInstagramData?.profile?.followers ?? profile?.latestStats?.followers ?? 0;
                          const reachCount = detailedInstagramData?.analytics?.reach ?? 0;
                          const impressionsCount = detailedInstagramData?.analytics?.impressions ?? 0;
                          const profileVisits = detailedInstagramData?.analytics?.profileVisits ?? Math.round((reachCount || followersCount) * 0.18);
                          return (
                            <div className="ig-overview-panel mb-4">
                              <div className="ig-kpi-grid">
                                <div className="ig-kpi-card">
                                  <div className="d-flex justify-content-between align-items-center"><div className="ig-kpi-title">Followers</div><i className="bi bi-people-fill ig-kpi-icon"></i></div>
                                  <div className="ig-kpi-mini"></div>
                                  <div className="d-flex justify-content-between align-items-center"><span className="fw-bold">{(followersCount || 0).toLocaleString?.() || followersCount || 0}</span><span className="ig-kpi-trend"><i className="bi bi-arrow-up-short up"></i></span></div>
                                </div>
                                <div className="ig-kpi-card">
                                  <div className="d-flex justify-content-between align-items-center"><div className="ig-kpi-title">Reach</div><i className="bi bi-graph-up ig-kpi-icon"></i></div>
                                  <div className="ig-kpi-mini"></div>
                                  <div className="d-flex justify-content-between align-items-center"><span className="fw-bold">{(reachCount || 0).toLocaleString?.() || reachCount || 0}</span><span className="ig-kpi-trend"><i className="bi bi-arrow-up-short up"></i></span></div>
                                </div>
                                <div className="ig-kpi-card">
                                  <div className="d-flex justify-content-between align-items-center"><div className="ig-kpi-title">Impressions</div><i className="bi bi-eye ig-kpi-icon"></i></div>
                                  <div className="ig-kpi-mini"></div>
                                  <div className="d-flex justify-content-between align-items-center"><span className="fw-bold">{(impressionsCount || 0).toLocaleString?.() || impressionsCount || 0}</span><span className="ig-kpi-trend"><i className="bi bi-arrow-down-short down"></i></span></div>
                                </div>
                                <div className="ig-kpi-card">
                                  <div className="d-flex justify-content-between align-items-center"><div className="ig-kpi-title">Profile visits</div><i className="bi bi-clipboard-check ig-kpi-icon"></i></div>
                                  <div className="ig-kpi-mini"></div>
                                  <div className="d-flex justify-content-between align-items-center"><span className="fw-bold">{(profileVisits || 0).toLocaleString?.() || profileVisits || 0}</span><span className="ig-kpi-trend"><i className="bi bi-arrow-up-short up"></i></span></div>
                                </div>
                              </div>
                            </div>
                          );
                        })()}

                        {(() => {
                          const reels = detailedInstagramData?.reels || detailedInstagramData?.posts?.reels || [];
                          if (!reels || reels.length === 0) {
                            return (
                              <div className="reels-section">
                                <div className="d-flex justify-content-between align-items-center mb-3">
                                  <h6 className="mb-0">Top Reels</h6>
                                  <Button variant="primary" size="sm" onClick={handleSyncInstagram} disabled={isUpdating}>{isUpdating ? 'Refreshing…' : 'Refresh Reels'}</Button>
                                </div>
                                <div className="alert alert-info">No Instagram reels found. Connect Instagram or refresh to populate your top reels.</div>
                              </div>
                            );
                          }
                          const topSix = reels.slice(0, 6);
                          const chunks = [];
                          for (let i = 0; i < Math.max(1, Math.ceil(topSix.length / 3)); i++) {
                            chunks.push(topSix.slice(i * 3, i * 3 + 3));
                          }
                          const placeholder = { caption: 'Reel', likesCount: 0, commentsCount: 0 };
                          return (
                            <div className="reels-section">
                              <div className="d-flex justify-content-between align-items-center mb-3">
                                <h6 className="mb-0">Top Reels</h6>
                                <Button variant="outline-primary" size="sm" onClick={handleSyncInstagram} disabled={isUpdating}>{isUpdating ? 'Refreshing…' : 'Refresh Reels'}</Button>
                              </div>
                              <Carousel indicators controls interval={null} pause={'hover'}>
                                {chunks.map((chunk, idx) => (
                                  <Carousel.Item key={idx}>
                                    <Row>
                                      {[0,1,2].map(i => {
                                        const r = chunk[i] || placeholder;
                                        const thumb = r.displayUrl || r.thumbnailUrl || (Array.isArray(r.images) ? r.images[0] : '') || '';
                                        const title = r.title || r.caption || 'Untitled';
                                        const views = r.viewsCount || r.playCount || 0;
                                        const engagementRate = r.engagementRate || 0;
                                        return (
                                          <Col md={4} key={`reel-${idx}-${i}`} className="mb-3">
                                            <div className="reel-card" style={{ background: thumb ? `url(${thumb}) center/cover no-repeat` : undefined, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                              {!thumb && (<i className="bi bi-play-fill fs-2"></i>)}
                                            </div>
                                            <div className="mt-2">
                                              <div className="reel-title">{title}</div>
                                              <div className="reel-metrics">Views {(views || 0).toLocaleString?.() || views} · Eng {engagementRate}%</div>
                                            </div>
                                          </Col>
                                        );
                                      })}
                                    </Row>
                                  </Carousel.Item>
                                ))}
                              </Carousel>
                            </div>
                          );
                        })()}
                        {detailedLoadingIG && !detailedInstagramData && (
                          <div className="yt-glass-panel">
                            <div className="text-center py-4">
                              <Spinner animation="border" role="status" variant="primary"><span className="visually-hidden">Loading detailed Instagram data...</span></Spinner>
                              <p className="mt-2 text-muted">Loading detailed Instagram data...</p>
                            </div>
                          </div>
                        )}
                        {detailedErrorIG && (<Alert variant="warning" className="mt-2">{detailedErrorIG}</Alert>)}
                      </>
                    )}
                  </Card.Body>
                </Card>
              </Tab.Pane>

              <Tab.Pane eventKey="insights">
                {profile?.youtubeChannelId ? (
                  (() => {
                    const recentVideos = detailedYoutubeData?.recentVideos || [];
                    const chartDataAll = recentVideos.map((v, idx) => ({
                      name: v.title || `Video ${idx + 1}`,
                      videoId: v.videoId,
                      views: Number(v.viewCount || 0),
                      likes: Number(v.likeCount || 0),
                      comments: Number(v.commentCount || 0),
                    }));
                    const chartData = selectedVideoId ? chartDataAll.filter(d => d.videoId === selectedVideoId) : chartDataAll;
                    const metricValue = (val, suffix = '') => {
                      if (val === null || val === undefined) return '—';
                      const n = Number(val);
                      return Number.isNaN(n) ? '—' : `${n.toLocaleString()}${suffix}`;
                    };
                    return (
                      <div className="buzzaz-youtube-dashboard">
                        <div className="yt-header buzzaz-gradient-soft mb-4">
                          <div className="d-flex align-items-center justify-content-between">
                            <div>
                              <h3 className="yt-title mb-1">YouTube Dashboard</h3>
                              <p className="yt-subtitle mb-0">Bright, creative insights for your growth</p>
                            </div>
                            <div className="d-flex gap-2">
                              <Button variant="outline-danger" size="sm" onClick={refreshYoutubeData} disabled={youtubeDetailedLoading} className="glass-button">
                                <i className={`bi bi-arrow-clockwise ${youtubeDetailedLoading ? 'spin' : ''}`}></i>
                                {youtubeDetailedLoading ? ' Refreshing...' : ' Refresh Data'}
                              </Button>
                              {youtubeStats?.url && (
                                <a href={youtubeStats.url} target="_blank" rel="noopener noreferrer" className="btn btn-outline-secondary btn-sm glass-button">
                                  <i className="bi bi-youtube me-1"></i>
                                  View Channel
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                        {youtubeError && (<Alert variant="danger" className="mb-3">{youtubeError}</Alert>)}
                        {youtubeDetailedError && (<Alert variant="warning" className="mb-3">{youtubeDetailedError}</Alert>)}
                        <div className="yt-glass-panel mb-4">
                          <div className="d-flex align-items-center justify-content-between mb-3">
                            <h5 className="section-title mb-0"><i className="bi bi-bar-chart-fill me-2"></i>Analytics Overview</h5>
                          </div>
                          <div className="metric-grid">
                            <div className="metric-card">
                              <div className="metric-icon icon-pink"><i className="bi bi-people"></i></div>
                              <div className="metric-content">
                                <div className="metric-label">Subscribers</div>
                                <div className="metric-value">{isLoadingYT ? <Spinner animation="border" size="sm" /> : metricValue(youtubeStats?.subscribers)}</div>
                              </div>
                            </div>
                            <div className="metric-card">
                              <div className="metric-icon icon-lavender"><i className="bi bi-play-btn"></i></div>
                              <div className="metric-content">
                                <div className="metric-label">Videos</div>
                                <div className="metric-value">{isLoadingYT ? <Spinner animation="border" size="sm" /> : metricValue(youtubeStats?.videos)}</div>
                              </div>
                            </div>
                            <div className="metric-card">
                              <div className="metric-icon icon-blue"><i className="bi bi-eye"></i></div>
                              <div className="metric-content">
                                <div className="metric-label">Total Views</div>
                                <div className="metric-value">{isLoadingYT ? <Spinner animation="border" size="sm" /> : metricValue(youtubeStats?.views)}</div>
                              </div>
                            </div>
                            <div className="metric-card">
                              <div className="metric-icon icon-pink"><i className="bi bi-heart"></i></div>
                              <div className="metric-content">
                                <div className="metric-label">Likes</div>
                                <div className="metric-value">{youtubeDetailedLoading ? <Spinner animation="border" size="sm" /> : metricValue(detailedYoutubeData?.analytics?.likes)}</div>
                              </div>
                            </div>
                            <div className="metric-card">
                              <div className="metric-icon icon-lavender"><i className="bi bi-chat"></i></div>
                              <div className="metric-content">
                                <div className="metric-label">Comments</div>
                                <div className="metric-value">{youtubeDetailedLoading ? <Spinner animation="border" size="sm" /> : metricValue(detailedYoutubeData?.analytics?.comments)}</div>
                              </div>
                            </div>
                            <div className="metric-card">
                              <div className="metric-icon icon-blue"><i className="bi bi-clock"></i></div>
                              <div className="metric-content">
                                <div className="metric-label">Watch Time</div>
                                <div className="metric-value">{youtubeDetailedLoading ? <Spinner animation="border" size="sm" /> : metricValue(detailedYoutubeData?.analytics?.estimatedMinutesWatched, '')}</div>
                              </div>
                            </div>
                            <div className="metric-card">
                              <div className="metric-icon icon-purple"><i className="bi bi-stopwatch"></i></div>
                              <div className="metric-content">
                                <div className="metric-label">Avg View Duration</div>
                                <div className="metric-value">{youtubeDetailedLoading ? <Spinner animation="border" size="sm" /> : metricValue(detailedYoutubeData?.analytics?.averageViewDuration)}</div>
                              </div>
                            </div>
                            <div className="metric-card">
                              <div className="metric-icon icon-green"><i className="bi bi-person-plus"></i></div>
                              <div className="metric-content">
                                <div className="metric-label">Subscribers Gained</div>
                                <div className="metric-value text-success">{youtubeDetailedLoading ? <Spinner animation="border" size="sm" /> : metricValue(detailedYoutubeData?.analytics?.subscribersGained)}</div>
                              </div>
                            </div>
                            <div className="metric-card">
                              <div className="metric-icon icon-red"><i className="bi bi-person-dash"></i></div>
                              <div className="metric-content">
                                <div className="metric-label">Subscribers Lost</div>
                                <div className="metric-value text-danger">{youtubeDetailedLoading ? <Spinner animation="border" size="sm" /> : metricValue(detailedYoutubeData?.analytics?.subscribersLost)}</div>
                              </div>
                            </div>
                          </div>
                          {detailedYoutubeData?.lastUpdated && (
                            <div className="text-muted small px-3 pb-3">Last updated: {new Date(detailedYoutubeData.lastUpdated).toLocaleString()}</div>
                          )}
                        </div>
                        {recentVideos.length > 0 && (
                          <div className="yt-glass-panel mb-4">
                            <div className="d-flex align-items-center justify-content-between mb-3">
                              <h5 className="section-title mb-0"><i className="bi bi-collection-play me-2"></i>Recent Videos</h5>
                              <div className="d-flex align-items-center gap-2">
                                {detailedYoutubeData?.channelInfo?.channelId && (
                                  <a href={`https://www.youtube.com/channel/${detailedYoutubeData.channelInfo.channelId}`} target="_blank" rel="noreferrer" className="btn btn-outline-secondary btn-sm">
                                    Open Channel
                                  </a>
                                )}
                                <Button variant="outline-danger" size="sm" onClick={refreshYoutubeData} disabled={youtubeDetailedLoading}>
                                  {youtubeDetailedLoading ? 'Refreshing…' : 'Refresh Data'}
                                </Button>
                              </div>
                            </div>
                            <Carousel interval={null} indicators={true} controls={true} className="recent-videos-carousel">
                              {(() => {
                                const slides = [];
                                for (let i = 0; i < recentVideos.length; i += 3) {
                                  slides.push(recentVideos.slice(i, i + 3));
                                }
                                return slides.map((group, slideIdx) => (
                                  <Carousel.Item key={`rv3-slide-${slideIdx}`}>
                                    <div className="video-slider">
                                      <div className="video-slide-row">
                                        {group.map((video, idx) => {
                                          const thumbs = video.thumbnails || {};
                                          const apiThumb = (thumbs.high && thumbs.high.url) || (thumbs.medium && thumbs.medium.url) || (thumbs.default && thumbs.default.url) || null;
                                          const computedThumb = (!apiThumb && !video.thumbnailUrl && !video.thumbnail && video.videoId) ? `https://i.ytimg.com/vi/${video.videoId}/hqdefault.jpg` : null;
                                          const thumbUrl = apiThumb || video.thumbnail || video.thumbnailUrl || computedThumb;
                                          return (
                                            <div className="video-card" key={video.videoId || `${slideIdx}-${idx}`} onClick={() => handleYtVideoClick(video)} role="button">
                                              {thumbUrl ? (
                                                <div className="video-thumb" style={{ backgroundImage: `url(${thumbUrl})` }} />
                                              ) : (
                                                <div className="video-thumb gradient">
                                                  <i className="bi bi-play-fill"></i>
                                                </div>
                                              )}
                                              <div className="video-title text-truncate" title={video.title}>{video.title}</div>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  </Carousel.Item>
                                ));
                              })()}
                            </Carousel>
                          </div>
                        )}
                        {recentVideos.length > 0 && (
                          <div className="yt-glass-panel mb-4">
                            <div className="d-flex align-items-center justify-content-between mb-3">
                              <h5 className="section-title mb-0"><i className="bi bi-graph-up-arrow me-2"></i>Recent Video Performance</h5>
                              {selectedVideoId && (
                                <Button variant="outline-secondary" size="sm" onClick={() => setSelectedVideoId(null)}>Show All</Button>
                              )}
                            </div>
                            <Row>
                              <Col md={4}>
                                <div className="chart-card">
                                  <h6 className="chart-title"><i className="bi bi-eye me-1"></i> Views</h6>
                                  <ResponsiveContainer width="100%" height={160}>
                                    <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 40, bottom: 0 }}>
                                      <defs>
                                        <linearGradient id="gradViewsPurple" x1="0" y1="0" x2="0" y2="1">
                                          <stop offset="0%" stopColor="#cdb8ff" stopOpacity="0.35" />
                                          <stop offset="100%" stopColor="#b79bff" stopOpacity="0" />
                                        </linearGradient>
                                      </defs>
                                      <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" />
                                      <XAxis dataKey="name" tick={{ fill: '#7b8aa8' }} />
                                      <YAxis width={60} tick={{ fill: '#7b8aa8' }} tickMargin={8} />
                                      <Tooltip />
                                      <Area type="monotone" dataKey="views" fill="url(#gradViewsPurple)" stroke="none" />
                                      <Line type="monotone" dataKey="views" stroke="#b79bff" strokeWidth={3} dot={false} />
                                    </ComposedChart>
                                  </ResponsiveContainer>
                                </div>
                              </Col>
                              <Col md={4}>
                                <div className="chart-card">
                                  <h6 className="chart-title"><i className="bi bi-heart me-1"></i> Likes</h6>
                                  <ResponsiveContainer width="100%" height={160}>
                                    <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 40, bottom: 0 }}>
                                      <defs>
                                        <linearGradient id="gradLikesLightBlue" x1="0" y1="0" x2="0" y2="1">
                                          <stop offset="0%" stopColor="#b9e3ff" stopOpacity="0.35" />
                                          <stop offset="100%" stopColor="#95d3ff" stopOpacity="0" />
                                        </linearGradient>
                                      </defs>
                                      <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" />
                                      <XAxis dataKey="name" tick={{ fill: '#7b8aa8' }} />
                                      <YAxis width={60} tick={{ fill: '#7b8aa8' }} tickMargin={8} />
                                      <Tooltip />
                                      <Area type="monotone" dataKey="likes" fill="url(#gradLikesLightBlue)" stroke="none" />
                                      <Line type="monotone" dataKey="likes" stroke="#95d3ff" strokeWidth={3} dot={false} />
                                    </ComposedChart>
                                  </ResponsiveContainer>
                                </div>
                              </Col>
                              <Col md={4}>
                                <div className="chart-card">
                                  <h6 className="chart-title"><i className="bi bi-chat me-1"></i> Comments</h6>
                                  <ResponsiveContainer width="100%" height={160}>
                                    <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 40, bottom: 0 }}>
                                      <defs>
                                        <linearGradient id="gradCommentsBlue" x1="0" y1="0" x2="0" y2="1">
                                          <stop offset="0%" stopColor="#7fb4ff" stopOpacity="0.35" />
                                          <stop offset="100%" stopColor="#5a9cff" stopOpacity="0" />
                                        </linearGradient>
                                      </defs>
                                      <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" />
                                      <XAxis dataKey="name" tick={{ fill: '#7b8aa8' }} />
                                      <YAxis width={60} tick={{ fill: '#7b8aa8' }} tickMargin={8} />
                                      <Tooltip />
                                      <Area type="monotone" dataKey="comments" fill="url(#gradCommentsBlue)" stroke="none" />
                                      <Line type="monotone" dataKey="comments" stroke="#5a9cff" strokeWidth={3} dot={false} />
                                    </ComposedChart>
                                  </ResponsiveContainer>
                                </div>
                              </Col>
                            </Row>
                            <Row className="g-3 mt-3">
                              {recentVideos.slice(0, 6).map((video, idx) => (
                                <Col md={4} sm={6} xs={12} key={idx}>
                                  <div className="video-meta-card" onClick={() => handleYtVideoClick(video)} role="button" style={{ cursor: 'pointer', borderColor: selectedVideoId === video.videoId ? '#dc3545' : undefined }}>
                                    <div className="meta-title text-truncate">{video.title}</div>
                                  </div>
                                </Col>
                              ))}
                            </Row>
                          </div>
                        )}
                        {youtubeDetailedLoading && !detailedYoutubeData && (
                          <div className="yt-glass-panel">
                            <div className="text-center py-4">
                              <Spinner animation="border" role="status" variant="danger">
                                <span className="visually-hidden">Loading detailed YouTube analytics...</span>
                              </Spinner>
                              <p className="mt-2 text-muted">Loading detailed YouTube analytics...</p>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()
                ) : (
                  <Card>
                    <Card.Header className="d-flex align-items-center">
                      <i className="bi bi-youtube text-danger me-2"></i>
                      <h6 className="mb-0">Connect Your YouTube Channel</h6>
                    </Card.Header>
                    <Card.Body>
                      <Row>
                        <Col md={8} lg={7}>
                          <Form.Group className="mb-3">
                            <Form.Label>Channel URL or Handle</Form.Label>
                            <Form.Control
                              type="url"
                              placeholder="https://www.youtube.com/@yourchannel or https://www.youtube.com/channel/UCxxxxx"
                              value={youtubeChannelUrl}
                              onChange={(e) => setYoutubeChannelUrl(e.target.value)}
                              disabled={connectingYoutube}
                            />
                            <Form.Text className="text-muted">
                              Supports @handle, channel ID, custom URLs, and direct channel links.
                            </Form.Text>
                          </Form.Group>
                          <div className="d-flex gap-2">
                            <Button 
                              variant="danger" 
                              onClick={handleConnectYouTube}
                              disabled={connectingYoutube || !youtubeChannelUrl.trim()}
                            >
                              {connectingYoutube ? (
                                <>
                                  <Spinner size="sm" className="me-2" />
                                  Connecting...
                                </>
                              ) : (
                                <>
                                  <i className="bi bi-youtube me-2"></i>
                                  Connect YouTube
                                </>
                              )}
                            </Button>
                            <Button 
                              variant="outline-secondary" 
                              onClick={() => navigate('/ugc/dashboard?tab=connect-socials')}
                            >
                              More options
                            </Button>
                          </div>
                        </Col>
                      </Row>
                    </Card.Body>
                  </Card>
                )}
              </Tab.Pane>

              <Tab.Pane eventKey="collaborations">
                <Card>
                  <Card.Header>
                    <h5 className="mb-0">Recent Collaborations</h5>
                  </Card.Header>
                  <Card.Body>
                    <p className="text-muted">No collaborations yet. Start connecting with brands to see your collaboration history here.</p>
                  </Card.Body>
                </Card>
              </Tab.Pane>

              {/* Chat Tab */}
              <Tab.Pane eventKey="messages">
                <ChatInterface currentUser={user} />
              </Tab.Pane>
            </Tab.Content>
          </Tab.Container>
        </Col>
      </Row>

      {/* Video Modal */}
      <Modal show={showVideoModal} onHide={handleCloseVideoModal} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>{selectedVideo?.title}</Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-0">
          {selectedVideo && (
            <div className="ratio ratio-16x9">
              <iframe
                src={`https://www.youtube.com/embed/${selectedVideo.videoId}?autoplay=1`}
                title={selectedVideo.title}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <div className="d-flex justify-content-between w-100 align-items-center">
            <div className="text-muted small">
              <i className="bi bi-eye me-1"></i>{Number(selectedVideo?.viewCount || 0).toLocaleString()} views • 
              <i className="bi bi-calendar ms-2 me-1"></i>{selectedVideo && new Date(selectedVideo.publishedAt).toLocaleDateString()}
            </div>
            <div>
              <Button 
                variant="outline-secondary" 
                size="sm" 
                href={selectedVideo ? `https://www.youtube.com/watch?v=${selectedVideo.videoId}` : '#'} 
                target="_blank" 
                rel="noopener noreferrer"
                className="me-2"
              >
                <i className="bi bi-box-arrow-up-right me-1"></i>
                Open in YouTube
              </Button>
              <Button variant="secondary" onClick={handleCloseVideoModal}>
                Close
              </Button>
            </div>
          </div>
        </Modal.Footer>
      </Modal>

      {/* Edit Profile Modal */}
      <EditProfileForm
        show={showEditProfile}
        onHide={() => setShowEditProfile(false)}
        profile={profile}
        onProfileUpdate={fetchProfile}
      />
    </Container>
  );
};

export default UGCDashboard;
