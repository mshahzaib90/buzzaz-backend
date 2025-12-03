import React, { useState, useEffect, useCallback } from 'react';
import { Container, Row, Col, Card, Nav, Tab, Button, Alert, Spinner, Badge, Form, Modal } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import { ugcCreatorAPI } from '../api/ugcAPI';
import { getUploadsUrl } from '../services/api';
import MultiSelect from '../components/MultiSelect';
import ChatInterface from '../components/Chat/ChatInterface';
import EditProfileForm from '../components/EditProfileForm';

const UGCDashboard = () => {
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

  const [activeTab, setActiveTab] = useState('profile');
  const [profile, setProfile] = useState(null);
  const [youtubeChannelUrl, setYoutubeChannelUrl] = useState('');
  const [connectingYoutube, setConnectingYoutube] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showEditProfile, setShowEditProfile] = useState(false);
  
  // YouTube insights state
  const [youtubeStats, setYoutubeStats] = useState(null);
  const [detailedYoutubeData, setDetailedYoutubeData] = useState(null);
  const [isLoadingYT, setIsLoadingYT] = useState(false);
  const [youtubeDetailedLoading, setYoutubeDetailedLoading] = useState(false);
  const [youtubeError, setYoutubeError] = useState('');
  const [youtubeDetailedError, setYoutubeDetailedError] = useState('');
  
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

  // Helper function to safely extract filename from sampleContent
  const getSampleContentFilename = (sampleContent) => {
    // Handle null or undefined
    if (!sampleContent) {
      return 'No file';
    }
    
    // Handle string (normal case)
    if (typeof sampleContent === 'string') {
      return sampleContent;
    }
    
    // Handle array (for link type)
    if (Array.isArray(sampleContent)) {
      if (sampleContent.length > 0) {
        return getSampleContentFilename(sampleContent[0]); // Recursive call for first element
      }
      return 'No links';
    }
    
    // Handle object (the problematic case)
    if (typeof sampleContent === 'object' && sampleContent !== null) {
      // Try common filename properties
      if (sampleContent.filename) return sampleContent.filename;
      if (sampleContent.name) return sampleContent.name;
      if (sampleContent.url) return sampleContent.url;
      if (sampleContent.value) return sampleContent.value;
      if (sampleContent.path) return sampleContent.path;
      
      // Try to get the first string value from the object
      const values = Object.values(sampleContent);
      for (const value of values) {
        if (typeof value === 'string' && value.trim() !== '') {
          return value;
        }
      }
      
      // If all else fails, return a descriptive string instead of [object Object]
      return `Object with keys: ${Object.keys(sampleContent).join(', ')}`;
    }
    
    // Fallback for any other type
    return String(sampleContent);
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

  const getProfileCompletionMessage = (missingFields) => {
    const fieldLabels = {
      fullName: 'Full Name',
      bio: 'Bio',
      location: 'Location',
      reelPostPrice: 'Reel Post Price',
      staticPostPrice: 'Static Post Price',
      reelStaticComboPrice: 'Reel + Static Combo Price',
      storyVideoPrice: 'Story Video Price',
      storyShoutoutPrice: 'Story Shoutout Price',
      storyUnboxingPrice: 'Story Unboxing Price',
      eventAttendancePrice: 'Event Attendance Price',
      outdoorShootPrice: 'Outdoor Shoot Price',
      expressDeliveryCharge: 'Express Delivery Charge',
      niche: 'Niche',
      contentStyle: 'Content Style'
    };
    
    const missingLabels = missingFields.map(field => fieldLabels[field] || field);
    
    if (missingLabels.length === 1) {
      return `Please complete your ${missingLabels[0]} to finish your profile.`;
    } else if (missingLabels.length === 2) {
      return `Please complete your ${missingLabels.join(' and ')} to finish your profile.`;
    } else {
      const lastField = missingLabels.pop();
      return `Please complete your ${missingLabels.join(', ')}, and ${lastField} to finish your profile.`;
    }
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
  }, [profile?.youtubeChannelId, profile?.youtubeChannelTitle, profile?.youtubeChannelUrl, profile?.youtubeSubscribers, profile?.youtubeViews, profile?.youtubeVideos]);

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

  // Switch away from insights tab if YouTube is disconnected
  useEffect(() => {
    if (activeTab === 'insights' && !profile?.youtubeChannelId) {
      setActiveTab('profile');
    }
  }, [activeTab, profile?.youtubeChannelId]);


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

  // Sample Content / Portfolio handlers
  const handleSampleContentTypeChange = (e) => {
    const newType = e.target.value;
    setEditData(prev => ({
      ...prev,
      sampleContentType: newType,
      sampleContent: newType === 'link' ? '' : prev.sampleContent,
      sampleLinks: newType === 'link' ? [''] : []
    }));
  };

  const handleSampleLinkChange = (index, value) => {
    const newLinks = [...editData.sampleLinks];
    newLinks[index] = value;
    setEditData(prev => ({
      ...prev,
      sampleLinks: newLinks
    }));
  };

  const addSampleLink = () => {
    setEditData(prev => ({
      ...prev,
      sampleLinks: [...prev.sampleLinks, '']
    }));
  };

  const removeSampleLink = (index) => {
    if (editData.sampleLinks.length > 1) {
      const newLinks = editData.sampleLinks.filter((_, i) => i !== index);
      setEditData(prev => ({
        ...prev,
        sampleLinks: newLinks
      }));
    }
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      // Store only the first file since backend expects single file
      setEditData(prev => ({
        ...prev,
        sampleContent: files[0] // Store single file instead of array
      }));
    }
  };

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
      <Container className="mt-4">
        <div className="text-center">
          <Spinner animation="border" role="status" variant="primary">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
        </div>
      </Container>
    );
  }

  return (
    <Container className="mt-4">
      <Row>
        <Col>
          <h2 className="mb-4">UGC Creator Dashboard</h2>
          
          {/* Modern Profile Completion Alert */}
          {profile && calculateCompletionPercentage(profile) < 100 && (
            <div className="profile-completion-alert-v2">
              <div className="alert-backdrop"></div>
              <div className="alert-content">
                <div className="alert-header">
                  <div className="alert-icon-wrapper">
                    <div className="alert-icon">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 1H5C3.89 1 3 1.89 3 3V21C3 22.11 3.89 23 5 23H19C20.11 23 21 22.11 21 21V9M19 9H14V4H5V21H19V9Z" fill="currentColor"/>
                      </svg>
                    </div>
                  </div>
                  <div className="alert-text-content">
                    <h3 className="alert-title">Complete Your Profile</h3>
                    <p className="alert-subtitle">Unlock your full potential and attract premium opportunities</p>
                  </div>
                  <div className="alert-percentage">
                    <div className="percentage-circle">
                      <svg className="percentage-svg" width="80" height="80">
                        <defs>
                          <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#3b82f6" />
                            <stop offset="100%" stopColor="#8b5cf6" />
                          </linearGradient>
                        </defs>
                        <circle
                          cx="40"
                          cy="40"
                          r="32"
                          fill="none"
                          stroke="#e5e7eb"
                          strokeWidth="6"
                        />
                        <circle
                          cx="40"
                          cy="40"
                          r="32"
                          fill="none"
                          stroke="url(#progressGradient)"
                          strokeWidth="6"
                          strokeDasharray={`${2 * Math.PI * 32}`}
                          strokeDashoffset={`${2 * Math.PI * 32 * (1 - (profile ? calculateCompletionPercentage(profile) : 0) / 100)}`}
                          strokeLinecap="round"
                          transform="rotate(-90 40 40)"
                        />
                      </svg>
                      <div className="percentage-text">
                        {profile ? calculateCompletionPercentage(profile) : 0}%
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="alert-progress">
                  <div className="progress-bar-container">
                    <div className="progress-track">
                      <div 
                        className="progress-fill" 
                        style={{ width: `${profile ? calculateCompletionPercentage(profile) : 0}%` }}
                      >
                        <div className="progress-shine"></div>
                      </div>
                    </div>
                    <div className="progress-text">
                      {profile ? calculateCompletionPercentage(profile) : 0}% Complete
                    </div>
                  </div>
                </div>
                
                {profile && checkProfileCompletion(profile).missingFields.length > 0 && (
                  <div className="alert-missing-fields">
                    <h4 className="missing-fields-title">Missing Fields:</h4>
                    <div className="missing-fields-list">
                      {checkProfileCompletion(profile).missingFields.map((field, index) => (
                        <span key={index} className="missing-field-badge">
                          {getProfileCompletionMessage([field]).replace('Please complete your ', '').replace(' to unlock premium opportunities.', '')}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}
          {success && <Alert variant="success" dismissible onClose={() => setSuccess('')}>{success}</Alert>}

          <Tab.Container activeKey={activeTab} onSelect={setActiveTab}>
            <Nav variant="tabs" className="mb-4">
              <Nav.Item>
                <Nav.Link eventKey="profile">Profile</Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="connect-socials">
                  <i className="bi bi-share me-2"></i>
                  Connect Socials
                </Nav.Link>
              </Nav.Item>
              {/* Only show Insights tab when YouTube is connected */}
              {profile?.youtubeChannelId && (
                <Nav.Item>
                  <Nav.Link eventKey="insights">
                    <i className="bi bi-graph-up me-2"></i>
                    Insights
                  </Nav.Link>
                </Nav.Item>
              )}
              <Nav.Item>
                <Nav.Link eventKey="collaborations">Collaborations</Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="chat">
                  <i className="bi bi-chat-dots me-2"></i>
                  Messages
                </Nav.Link>
              </Nav.Item>
            </Nav>

            <Tab.Content>
              <Tab.Pane eventKey="profile">
                <Card>
                  <Card.Header className="d-flex justify-content-between align-items-center">
                    <h5 className="mb-0">Profile Information</h5>
                    {!editMode ? (
                      <Button variant="outline-primary" onClick={handleEdit}>
                        Edit Profile
                      </Button>
                    ) : (
                      <div>
                        <Button 
                          variant="success" 
                          onClick={handleSaveProfile}
                          disabled={isUpdating}
                          className="me-2"
                        >
                          {isUpdating ? <Spinner animation="border" size="sm" /> : 'Save'}
                        </Button>
                        <Button variant="outline-secondary" onClick={handleCancelEdit}>
                          Cancel
                        </Button>
                      </div>
                    )}
                  </Card.Header>
                  <Card.Body>
                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Full Name</Form.Label>
                          {editMode ? (
                            <Form.Control
                              type="text"
                              name="fullName"
                              value={editData.fullName}
                              onChange={handleEditChange}
                            />
                          ) : (
                            <p className="form-control-plaintext">{profile?.fullName || 'Not set'}</p>
                          )}
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Phone Number</Form.Label>
                          {editMode ? (
                            <Form.Control
                              type="tel"
                              name="phoneNumber"
                              value={editData.phoneNumber}
                              onChange={handleEditChange}
                            />
                          ) : (
                            <p className="form-control-plaintext">{profile?.phoneNumber || 'Not set'}</p>
                          )}
                        </Form.Group>
                      </Col>
                    </Row>

                    {/* Average Delivery Time Section */}
                    <Row>
                      <Col md={12}>
                        <h6 className="mb-3 text-primary">Average Delivery Time</h6>
                      </Col>
                    </Row>
                    
                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Product-based UGC</Form.Label>
                          {editMode ? (
                            <Form.Select
                              name="productBasedDelivery"
                              value={editData.productBasedDelivery}
                              onChange={handleEditChange}
                            >
                              <option value="7-10 days">7-10 days after product received</option>
                              <option value="5-7 days">5-7 days after product received</option>
                              <option value="10-14 days">10-14 days after product received</option>
                            </Form.Select>
                          ) : (
                            <p className="form-control-plaintext">
                              {profile?.productBasedDelivery || '7-10 days after product received'}
                            </p>
                          )}
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>No Product UGC</Form.Label>
                          {editMode ? (
                            <Form.Select
                              name="noProductDelivery"
                              value={editData.noProductDelivery}
                              onChange={handleEditChange}
                            >
                              <option value="5-7 days">5-7 days after brief confirmation</option>
                              <option value="3-5 days">3-5 days after brief confirmation</option>
                              <option value="7-10 days">7-10 days after brief confirmation</option>
                            </Form.Select>
                          ) : (
                            <p className="form-control-plaintext">
                              {profile?.noProductDelivery || '5-7 days after brief confirmation'}
                            </p>
                          )}
                        </Form.Group>
                      </Col>
                    </Row>

                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Express Delivery</Form.Label>
                          {editMode ? (
                            <Form.Select
                              name="expressDelivery"
                              value={editData.expressDelivery}
                              onChange={handleEditChange}
                            >
                              <option value="48-72 hours">48-72 hours</option>
                              <option value="24-48 hours">24-48 hours</option>
                              <option value="72-96 hours">72-96 hours</option>
                            </Form.Select>
                          ) : (
                            <p className="form-control-plaintext">
                              {profile?.expressDelivery || '48-72 hours'}
                            </p>
                          )}
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Outdoor Shoot & Event Attendance</Form.Label>
                          {editMode ? (
                            <Form.Select
                              name="outdoorEventDelivery"
                              value={editData.outdoorEventDelivery}
                              onChange={handleEditChange}
                            >
                              <option value="4-5 days">4-5 days for editing after shoot</option>
                              <option value="3-4 days">3-4 days for editing after shoot</option>
                              <option value="5-7 days">5-7 days for editing after shoot</option>
                            </Form.Select>
                          ) : (
                            <p className="form-control-plaintext">
                              {profile?.outdoorEventDelivery || '4-5 days for editing after shoot'}
                            </p>
                          )}
                        </Form.Group>
                      </Col>
                    </Row>

                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Revisions</Form.Label>
                          {editMode ? (
                            <Form.Select
                              name="revisionsDelivery"
                              value={editData.revisionsDelivery}
                              onChange={handleEditChange}
                            >
                              <option value="3-4 days">3-4 days</option>
                              <option value="2-3 days">2-3 days</option>
                              <option value="4-5 days">4-5 days</option>
                            </Form.Select>
                          ) : (
                            <p className="form-control-plaintext">
                              {profile?.revisionsDelivery || '3-4 days'}
                            </p>
                          )}
                        </Form.Group>
                      </Col>
                    </Row>

                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Location</Form.Label>
                          {editMode ? (
                            <Form.Control
                              type="text"
                              name="location"
                              value={editData.location}
                              onChange={handleEditChange}
                            />
                          ) : (
                            <p className="form-control-plaintext">{profile?.location || 'Not set'}</p>
                          )}
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>City</Form.Label>
                          {editMode ? (
                            <Form.Control
                              type="text"
                              name="city"
                              value={editData.city}
                              onChange={handleEditChange}
                            />
                          ) : (
                            <p className="form-control-plaintext">{profile?.city || 'Not set'}</p>
                          )}
                        </Form.Group>
                      </Col>
                    </Row>

                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Country</Form.Label>
                          {editMode ? (
                            <Form.Control
                              type="text"
                              name="country"
                              value={editData.country}
                              onChange={handleEditChange}
                            />
                          ) : (
                            <p className="form-control-plaintext">{profile?.country || 'Not set'}</p>
                          )}
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Date of Birth</Form.Label>
                          {editMode ? (
                            <Form.Control
                              type="date"
                              name="dateOfBirth"
                              value={editData.dateOfBirth}
                              onChange={handleEditChange}
                            />
                          ) : (
                            <p className="form-control-plaintext">{profile?.dateOfBirth || 'Not set'}</p>
                          )}
                        </Form.Group>
                      </Col>
                    </Row>

                    <Row>
                      <Col md={4}>
                        <Form.Group className="mb-3">
                          <Form.Label>Gender</Form.Label>
                          {editMode ? (
                            <Form.Select
                              name="gender"
                              value={editData.gender}
                              onChange={handleEditChange}
                            >
                              <option value="">Select gender</option>
                              <option value="male">Male</option>
                              <option value="female">Female</option>
                              <option value="non-binary">Non-binary</option>
                              <option value="prefer-not-to-say">Prefer not to say</option>
                            </Form.Select>
                          ) : (
                            <p className="form-control-plaintext">{profile?.gender || 'Not set'}</p>
                          )}
                        </Form.Group>
                      </Col>
                      <Col md={4}>
                        <Form.Group className="mb-3">
                          <Form.Label>Marital Status</Form.Label>
                          {editMode ? (
                            <Form.Select
                              name="maritalStatus"
                              value={editData.maritalStatus}
                              onChange={handleEditChange}
                            >
                              <option value="">Select status</option>
                              <option value="single">Single</option>
                              <option value="married">Married</option>
                              <option value="divorced">Divorced</option>
                              <option value="widowed">Widowed</option>
                              <option value="prefer-not-to-say">Prefer not to say</option>
                            </Form.Select>
                          ) : (
                            <p className="form-control-plaintext">{profile?.maritalStatus || 'Not set'}</p>
                          )}
                        </Form.Group>
                      </Col>
                      <Col md={4}>
                        <Form.Group className="mb-3">
                          <Form.Label>Children</Form.Label>
                          {editMode ? (
                            <Form.Select
                              name="children"
                              value={editData.children}
                              onChange={handleEditChange}
                            >
                              <option value="">Select</option>
                              <option value="yes">Yes</option>
                              <option value="no">No</option>
                            </Form.Select>
                          ) : (
                            <p className="form-control-plaintext">{profile?.children || 'Not set'}</p>
                          )}
                        </Form.Group>
                      </Col>
                    </Row>

                    <Form.Group className="mb-3">
                      <Form.Label>Bio</Form.Label>
                      {editMode ? (
                        <Form.Control
                          as="textarea"
                          rows={3}
                          name="bio"
                          value={editData.bio}
                          onChange={handleEditChange}
                        />
                      ) : (
                        <p className="form-control-plaintext">{profile?.bio || 'Not set'}</p>
                      )}
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>Sample Content / Portfolio</Form.Label>
                      {editMode ? (
                        <div>
                          {/* Content Type Selection */}
                          <div className="mb-3">
                            <Form.Check
                              type="radio"
                              id="sampleContentTypeUpload"
                              name="sampleContentType"
                              label="Upload File"
                              value="upload"
                              checked={editData.sampleContentType === 'upload'}
                              onChange={handleSampleContentTypeChange}
                              className="mb-2"
                            />
                            <Form.Check
                              type="radio"
                              id="sampleContentTypeLink"
                              name="sampleContentType"
                              label="Links"
                              value="link"
                              checked={editData.sampleContentType === 'link'}
                              onChange={handleSampleContentTypeChange}
                            />
                          </div>

                          {/* Upload File Option */}
                          {editData.sampleContentType === 'upload' && (
                            <div className="mb-3">
                              <Form.Control
                                type="file"
                                multiple
                                accept="image/*,video/*,.pdf,.doc,.docx"
                                onChange={handleFileUpload}
                              />
                              <Form.Text className="text-muted">
                                Supported formats: Images, Videos, PDF, Word documents (Multiple files allowed)
                              </Form.Text>
                              {editData.sampleContent && (
                                <div className="mt-2">
                                  {Array.isArray(editData.sampleContent) ? (
                                    // Multiple files selected
                                    <div>
                                      <div className="mb-2">
                                        <Badge bg="info">
                                          {editData.sampleContent.length} file(s) selected
                                        </Badge>
                                      </div>
                                      {editData.sampleContent.map((file, index) => (
                                        <Badge key={index} bg="success" className="me-1 mb-1">
                                          {file.name}
                                        </Badge>
                                      ))}
                                    </div>
                                  ) : (
                                    // Single file or existing content
                                    <Badge bg="success">
                                      {typeof editData.sampleContent === 'object' 
                                        ? `New file: ${editData.sampleContent.name}` 
                                        : `Current file: ${editData.sampleContent}`}
                                    </Badge>
                                  )}
                                </div>
                              )}
                            </div>
                          )}

                          {/* Links Option */}
                          {editData.sampleContentType === 'link' && (
                            <div>
                              {editData.sampleLinks?.map((link, index) => (
                                <div key={index} className="mb-2 d-flex">
                                  <Form.Control
                                    type="url"
                                    placeholder="Enter portfolio link (e.g., https://...)"
                                    value={link}
                                    onChange={(e) => handleSampleLinkChange(index, e.target.value)}
                                    className="me-2"
                                  />
                                  {editData.sampleLinks.length > 1 && (
                                    <Button
                                      variant="outline-danger"
                                      size="sm"
                                      onClick={() => removeSampleLink(index)}
                                    >
                                      Remove
                                    </Button>
                                  )}
                                </div>
                              ))}
                              <Button
                                variant="outline-primary"
                                size="sm"
                                onClick={addSampleLink}
                                className="mt-2"
                              >
                                + Add Another Link
                              </Button>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div>
                          {profile?.sampleContent ? (
                            <div>
                              {profile.sampleContentType === 'upload' ? (
                                <div>
                                  <Badge bg="info" className="me-2">Uploaded Portfolio</Badge>
                                  <div className="mt-3">
                                    <div className="d-flex align-items-center mb-2">
                                      <strong className="me-2">Portfolio Image:</strong>
                                      <Badge bg="success" className="me-2">
                                        {getSampleContentFilename(profile.sampleContent)}
                                      </Badge>
                                    </div>
                                    <div className="portfolio-image-container">
                                      <img 
                                        src={getUploadsUrl(getSampleContentFilename(profile.sampleContent))}
                                        alt="Portfolio Sample"
                                        className="img-fluid rounded shadow-sm"
                                        style={{ 
                                          maxWidth: '300px', 
                                          maxHeight: '300px', 
                                          objectFit: 'cover',
                                          border: '2px solid #28a745'
                                        }}
                                        onLoad={(e) => {
                                          console.log(`✅ Portfolio image loaded: ${getSampleContentFilename(profile.sampleContent)}`);
                                          e.target.style.border = '2px solid #28a745';
                                        }}
                                        onError={(e) => {
                                          const filename = getSampleContentFilename(profile.sampleContent);
                                          console.error(`❌ Portfolio image failed to load: ${filename}`);
                                          e.target.style.border = '2px solid #dc3545';
                                          e.target.alt = `Failed to load: ${filename}`;
                                        }}
                                      />
                                    </div>
                                  </div>
                                </div>
                              ) : profile.sampleContentType === 'link' ? (
                                <div>
                                  <Badge bg="info" className="me-2">Sample Links</Badge>
                                  {Array.isArray(profile.sampleContent) ? (
                                    <ul className="list-unstyled mt-2">
                                      {profile.sampleContent.map((link, index) => (
                                        <li key={index} className="mb-1">
                                          <a href={String(link)} target="_blank" rel="noopener noreferrer" className="text-decoration-none">
                                            <i className="bi bi-link-45deg me-1"></i>
                                            {String(link)}
                                          </a>
                                        </li>
                                      ))}
                                    </ul>
                                  ) : (
                                    <div className="mt-2">
                                      <a href={getSampleContentFilename(profile.sampleContent)} target="_blank" rel="noopener noreferrer" className="text-decoration-none">
                                        <i className="bi bi-link-45deg me-1"></i>
                                        {getSampleContentFilename(profile.sampleContent)}
                                      </a>
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <span>{getSampleContentFilename(profile.sampleContent)}</span>
                              )}
                            </div>
                          ) : (
                            <p className="form-control-plaintext text-muted">No sample content uploaded</p>
                          )}
                        </div>
                      )}
                    </Form.Group>

                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Niche</Form.Label>
                          {editMode ? (
                            <MultiSelect
                              options={categoryOptions}
                              value={editData.categories}
                              onChange={(selected) => handleMultiSelectChange('categories', selected)}
                              placeholder="Select niches..."
                            />
                          ) : (
                            <div>
                              {profile?.niche?.length > 0 ? (
                                profile.niche.map((item, index) => (
                                  <Badge key={index} bg="primary" className="me-1 mb-1">
                                    {item}
                                  </Badge>
                                ))
                              ) : (
                                <p className="form-control-plaintext">Not set</p>
                              )}
                            </div>
                          )}
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Content Style</Form.Label>
                          {editMode ? (
                            <MultiSelect
                              options={contentTypeOptions}
                              value={editData.contentTypes}
                              onChange={(selected) => handleMultiSelectChange('contentTypes', selected)}
                              placeholder="Select content styles..."
                            />
                          ) : (
                            <div>
                              {profile?.contentStyle?.length > 0 ? (
                                profile.contentStyle.map((style, index) => (
                                  <Badge key={index} bg="secondary" className="me-1 mb-1">
                                    {style}
                                  </Badge>
                                ))
                              ) : (
                                <p className="form-control-plaintext">Not set</p>
                              )}
                            </div>
                          )}
                        </Form.Group>
                      </Col>
                    </Row>

                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Face / Faceless</Form.Label>
                          {editMode ? (
                            <Form.Select
                              name="faceOrFaceless"
                              value={editData.faceOrFaceless}
                              onChange={handleEditChange}
                            >
                              <option value="">Select content type</option>
                              <option value="face">Face</option>
                              <option value="faceless">Faceless</option>
                            </Form.Select>
                          ) : (
                            <p className="form-control-plaintext">{profile?.faceOrFaceless || 'Not set'}</p>
                          )}
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Languages</Form.Label>
                          <div>
                            {profile?.languages?.length > 0 ? (
                              profile.languages.map((language, index) => (
                                <Badge key={index} bg="success" className="me-1 mb-1">
                                  {language}
                                </Badge>
                              ))
                            ) : (
                              <p className="form-control-plaintext">Not set</p>
                            )}
                          </div>
                        </Form.Group>
                      </Col>
                    </Row>

                    {/* Detailed Pricing Structure */}
                    <Row>
                      <Col md={12}>
                        <h6 className="mb-3 text-primary">Content Pricing ($)</h6>
                      </Col>
                    </Row>
                    
                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Reel Post</Form.Label>
                          {editMode ? (
                            <Form.Control
                              type="number"
                              name="reelPostPrice"
                              value={editData.reelPostPrice}
                              onChange={handleEditChange}
                              min="0"
                              step="0.01"
                              placeholder="Enter reel post price"
                            />
                          ) : (
                            <p className="form-control-plaintext">
                              {profile?.reelPostPrice ? `$${profile.reelPostPrice}` : 'Not set'}
                            </p>
                          )}
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Static Post</Form.Label>
                          {editMode ? (
                            <Form.Control
                              type="number"
                              name="staticPostPrice"
                              value={editData.staticPostPrice}
                              onChange={handleEditChange}
                              min="0"
                              step="0.01"
                              placeholder="Enter static post price"
                            />
                          ) : (
                            <p className="form-control-plaintext">
                              {profile?.staticPostPrice ? `$${profile.staticPostPrice}` : 'Not set'}
                            </p>
                          )}
                        </Form.Group>
                      </Col>
                    </Row>

                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Reel + Static Post Combo</Form.Label>
                          {editMode ? (
                            <Form.Control
                              type="number"
                              name="reelStaticComboPrice"
                              value={editData.reelStaticComboPrice}
                              onChange={handleEditChange}
                              min="0"
                              step="0.01"
                              placeholder="Enter combo price"
                            />
                          ) : (
                            <p className="form-control-plaintext">
                              {profile?.reelStaticComboPrice ? `$${profile.reelStaticComboPrice}` : 'Not set'}
                            </p>
                          )}
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Story Video (Reel Style)</Form.Label>
                          {editMode ? (
                            <Form.Control
                              type="number"
                              name="storyVideoPrice"
                              value={editData.storyVideoPrice}
                              onChange={handleEditChange}
                              min="0"
                              step="0.01"
                              placeholder="Enter story video price"
                            />
                          ) : (
                            <p className="form-control-plaintext">
                              {profile?.storyVideoPrice ? `$${profile.storyVideoPrice}` : 'Not set'}
                            </p>
                          )}
                        </Form.Group>
                      </Col>
                    </Row>

                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Story Shoutout</Form.Label>
                          {editMode ? (
                            <Form.Control
                              type="number"
                              name="storyShoutoutPrice"
                              value={editData.storyShoutoutPrice}
                              onChange={handleEditChange}
                              min="0"
                              step="0.01"
                              placeholder="Enter story shoutout price"
                            />
                          ) : (
                            <p className="form-control-plaintext">
                              {profile?.storyShoutoutPrice ? `$${profile.storyShoutoutPrice}` : 'Not set'}
                            </p>
                          )}
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Story Unboxing</Form.Label>
                          {editMode ? (
                            <Form.Control
                              type="number"
                              name="storyUnboxingPrice"
                              value={editData.storyUnboxingPrice}
                              onChange={handleEditChange}
                              min="0"
                              step="0.01"
                              placeholder="Enter story unboxing price"
                            />
                          ) : (
                            <p className="form-control-plaintext">
                              {profile?.storyUnboxingPrice ? `$${profile.storyUnboxingPrice}` : 'Not set'}
                            </p>
                          )}
                        </Form.Group>
                      </Col>
                    </Row>

                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Event Attendance</Form.Label>
                          {editMode ? (
                            <Form.Control
                              type="number"
                              name="eventAttendancePrice"
                              value={editData.eventAttendancePrice}
                              onChange={handleEditChange}
                              min="0"
                              step="0.01"
                              placeholder="Enter event attendance price"
                            />
                          ) : (
                            <p className="form-control-plaintext">
                              {profile?.eventAttendancePrice ? `$${profile.eventAttendancePrice}` : 'Not set'}
                            </p>
                          )}
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Outdoor Shoots</Form.Label>
                          {editMode ? (
                            <Form.Control
                              type="number"
                              name="outdoorShootPrice"
                              value={editData.outdoorShootPrice}
                              onChange={handleEditChange}
                              min="0"
                              step="0.01"
                              placeholder="Enter outdoor shoot price"
                            />
                          ) : (
                            <p className="form-control-plaintext">
                              {profile?.outdoorShootPrice ? `$${profile.outdoorShootPrice}` : 'Not set'}
                            </p>
                          )}
                        </Form.Group>
                      </Col>
                    </Row>

                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Express Delivery Charge</Form.Label>
                          {editMode ? (
                            <Form.Control
                              type="number"
                              name="expressDeliveryCharge"
                              value={editData.expressDeliveryCharge}
                              onChange={handleEditChange}
                              min="0"
                              step="0.01"
                              placeholder="Enter express delivery charge"
                            />
                          ) : (
                            <p className="form-control-plaintext">
                              {profile?.expressDeliveryCharge ? `$${profile.expressDeliveryCharge}` : 'Not set'}
                            </p>
                          )}
                        </Form.Group>
                      </Col>
                    </Row>



                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Content Type</Form.Label>
                          {editMode ? (
                            <Form.Select
                              name="contentType"
                              value={editData.contentType}
                              onChange={handleEditChange}
                            >
                              <option value="">Select content type</option>
                              <option value="UGC Videos">UGC Videos</option>
                              <option value="Product Reviews">Product Reviews</option>
                              <option value="Unboxing">Unboxing</option>
                              <option value="Tutorials">Tutorials</option>
                              <option value="Testimonials">Testimonials</option>
                              <option value="Behind the Scenes">Behind the Scenes</option>
                              <option value="Lifestyle Content">Lifestyle Content</option>
                              <option value="Brand Storytelling">Brand Storytelling</option>
                              <option value="Social Media Posts">Social Media Posts</option>
                            </Form.Select>
                          ) : (
                            <p className="form-control-plaintext">{profile?.contentType || 'Not set'}</p>
                          )}
                        </Form.Group>
                      </Col>
                    </Row>
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

                    {/* Future Social Media Platforms */}
                    <Row>

                    </Row>
                  </Card.Body>
                </Card>
              </Tab.Pane>

              {/* Insights Tab */}
              <Tab.Pane eventKey="insights">
                {profile?.youtubeChannelId ? (
                  <div>
                    {/* YouTube Stats Overview */}
                    <Card className="mb-4">
                      <Card.Header>
                        <div className="d-flex justify-content-between align-items-center">
                          <h5 className="mb-0">
                            <i className="bi bi-youtube text-danger me-2"></i>
                            YouTube Channel Overview
                          </h5>
                          <Button 
                            variant="outline-primary" 
                            size="sm"
                            onClick={refreshYoutubeData}
                            disabled={youtubeDetailedLoading}
                          >
                            {youtubeDetailedLoading ? (
                              <>
                                <Spinner size="sm" className="me-2" />
                                Refreshing...
                              </>
                            ) : (
                              <>
                                <i className="bi bi-arrow-clockwise me-2"></i>
                                Refresh Data
                              </>
                            )}
                          </Button>
                        </div>
                      </Card.Header>
                      <Card.Body>
                        {isLoadingYT ? (
                          <div className="text-center py-4">
                            <Spinner animation="border" />
                            <p className="mt-2">Loading YouTube statistics...</p>
                          </div>
                        ) : youtubeError ? (
                          <Alert variant="danger">{youtubeError}</Alert>
                        ) : youtubeStats ? (
                          <Row>
                            <Col md={3}>
                              <div className="text-center">
                                <h3 className="text-danger">{youtubeStats.subscribers?.toLocaleString() || 0}</h3>
                                <p className="text-muted mb-0">Subscribers</p>
                              </div>
                            </Col>
                            <Col md={3}>
                              <div className="text-center">
                                <h3 className="text-primary">{youtubeStats.views?.toLocaleString() || 0}</h3>
                                <p className="text-muted mb-0">Total Views</p>
                              </div>
                            </Col>
                            <Col md={3}>
                              <div className="text-center">
                                <h3 className="text-success">{youtubeStats.videos?.toLocaleString() || 0}</h3>
                                <p className="text-muted mb-0">Videos</p>
                              </div>
                            </Col>
                            <Col md={3}>
                              <div className="text-center">
                                <h6 className="text-truncate">{youtubeStats.title}</h6>
                                <a href={youtubeStats.url} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-outline-danger">
                                  <i className="bi bi-youtube me-1"></i>
                                  View Channel
                                </a>
                              </div>
                            </Col>
                          </Row>
                        ) : (
                          <Alert variant="info">No YouTube statistics available</Alert>
                        )}
                      </Card.Body>
                    </Card>

                    {/* Detailed Analytics */}
                    <Card>
                      <Card.Header>
                        <h5 className="mb-0">
                          <i className="bi bi-graph-up me-2"></i>
                          Detailed Analytics
                        </h5>
                      </Card.Header>
                      <Card.Body>
                        {youtubeDetailedLoading ? (
                          <div className="text-center py-4">
                            <Spinner animation="border" />
                            <p className="mt-2">Loading detailed analytics...</p>
                          </div>
                        ) : youtubeDetailedError ? (
                          <Alert variant="warning">
                            {youtubeDetailedError}
                            {youtubeDetailedError.includes('refresh') && (
                              <div className="mt-2">
                                <Button 
                                  variant="primary" 
                                  size="sm"
                                  onClick={refreshYoutubeData}
                                  disabled={youtubeDetailedLoading}
                                >
                                  Refresh YouTube Data
                                </Button>
                              </div>
                            )}
                          </Alert>
                        ) : detailedYoutubeData ? (
                          <div>
                            {/* Recent Videos */}
                            {detailedYoutubeData.recentVideos && detailedYoutubeData.recentVideos.length > 0 && (
                              <div>
                                <div className="d-flex align-items-center justify-content-between mb-4">
                                  <h5 className="mb-0 fw-bold text-dark">
                                    <i className="bi bi-play-circle-fill text-danger me-2"></i>
                                    Recent Videos
                                  </h5>
                                  <small className="text-muted">Latest {detailedYoutubeData.recentVideos.length} videos</small>
                                </div>
                                <Row className="g-4">
                                  {detailedYoutubeData.recentVideos.slice(0, 6).map((video, index) => (
                                    <Col lg={4} md={6} key={index}>
                                      <Card 
                                        className="h-100 border-0 shadow-lg video-card"
                                        style={{
                                          borderRadius: '16px',
                                          overflow: 'hidden',
                                          transition: 'all 0.3s ease',
                                          cursor: 'pointer'
                                        }}
                                        onMouseEnter={(e) => {
                                          e.currentTarget.style.transform = 'translateY(-8px)';
                                          e.currentTarget.style.boxShadow = '0 20px 40px rgba(0,0,0,0.15)';
                                        }}
                                        onMouseLeave={(e) => {
                                          e.currentTarget.style.transform = 'translateY(0)';
                                          e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.1)';
                                        }}
                                      >
                                        <div className="position-relative overflow-hidden">
                                          {video.thumbnail ? (
                                            <Card.Img 
                                              variant="top" 
                                              src={video.thumbnail} 
                                              style={{ 
                                                height: '180px', 
                                                objectFit: 'cover',
                                                transition: 'transform 0.3s ease'
                                              }}
                                              onClick={() => handleVideoPlay(video)}
                                              onMouseEnter={(e) => {
                                                e.target.style.transform = 'scale(1.05)';
                                              }}
                                              onMouseLeave={(e) => {
                                                e.target.style.transform = 'scale(1)';
                                              }}
                                              onError={(e) => {
                                                e.target.style.display = 'none';
                                              }}
                                            />
                                          ) : (
                                            <div 
                                              style={{ 
                                                height: '180px', 
                                                backgroundColor: '#f8f9fa',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                color: '#6c757d',
                                                fontSize: '14px',
                                                border: '1px solid #dee2e6',
                                                cursor: 'pointer'
                                              }}
                                              onClick={() => handleVideoPlay(video)}
                                            >
                                              <i className="fas fa-play-circle" style={{ fontSize: '48px', opacity: 0.5 }}></i>
                                            </div>
                                          )}
                                          <div 
                                            className="position-absolute top-50 start-50 translate-middle play-overlay"
                                            style={{
                                              background: 'linear-gradient(135deg, #dc3545, #c82333)',
                                              borderRadius: '50%',
                                              width: '60px',
                                              height: '60px',
                                              display: 'flex',
                                              alignItems: 'center',
                                              justifyContent: 'center',
                                              opacity: 0.9,
                                              transition: 'all 0.3s ease',
                                              boxShadow: '0 8px 25px rgba(220, 53, 69, 0.3)'
                                            }}
                                            onClick={() => handleVideoPlay(video)}
                                            onMouseEnter={(e) => {
                                              e.target.style.transform = 'scale(1.1)';
                                              e.target.style.opacity = '1';
                                            }}
                                            onMouseLeave={(e) => {
                                              e.target.style.transform = 'scale(1)';
                                              e.target.style.opacity = '0.9';
                                            }}
                                          >
                                            <i className="bi bi-play-fill text-white" style={{ fontSize: '1.8rem', marginLeft: '4px' }}></i>
                                          </div>
                                          <div 
                                            className="position-absolute bottom-0 end-0 m-2 px-2 py-1"
                                            style={{
                                              backgroundColor: 'rgba(0,0,0,0.8)',
                                              borderRadius: '6px',
                                              fontSize: '0.75rem',
                                              color: 'white',
                                              fontWeight: '500'
                                            }}
                                          >
                                            {video.duration || '0:00'}
                                          </div>
                                        </div>
                                        <Card.Body className="d-flex flex-column p-4">
                                          <Card.Title 
                                            className="text-truncate mb-3 fw-bold" 
                                            style={{ 
                                              fontSize: '1rem',
                                              lineHeight: '1.4',
                                              color: '#2c3e50',
                                              minHeight: '1.4rem'
                                            }}
                                            title={video.title}
                                          >
                                            {video.title}
                                          </Card.Title>
                                          {/* Video Metrics */}
                                          <div className="mb-3">
                                            {/* Primary Metrics Row */}
                                            <div className="d-flex justify-content-between align-items-center mb-2" style={{ fontSize: '0.85rem' }}>
                                              <div className="d-flex align-items-center">
                                                <i className="bi bi-eye-fill me-1 text-primary"></i>
                                                <span className="fw-medium">{formatNumber(video.viewCount) || '0'}</span>
                                                <span className="text-muted ms-1">views</span>
                                              </div>
                                              <div className="d-flex align-items-center">
                                                <i className="bi bi-calendar3 me-1 text-success"></i>
                                                <span>{new Date(video.publishedAt).toLocaleDateString()}</span>
                                              </div>
                                            </div>
                                            
                                            {/* Secondary Metrics Row */}
                                            <div className="d-flex justify-content-between align-items-center" style={{ fontSize: '0.8rem' }}>
                                              <div className="d-flex align-items-center">
                                                <i className="bi bi-heart-fill me-1 text-danger"></i>
                                                <span className="fw-medium">{formatNumber(video.likeCount) || '0'}</span>
                                                <span className="text-muted ms-1">likes</span>
                                              </div>
                                              <div className="d-flex align-items-center">
                                                <i className="bi bi-chat-fill me-1 text-info"></i>
                                                <span className="fw-medium">{formatNumber(video.commentCount) || '0'}</span>
                                                <span className="text-muted ms-1">comments</span>
                                              </div>
                                              <div className="d-flex align-items-center">
                                                <i className="bi bi-clock-fill me-1 text-warning"></i>
                                                <span className="fw-medium">{video.duration || '0:00'}</span>
                                              </div>
                                            </div>
                                          </div>
                                          <div className="mt-auto">
                                            <Button 
                                              variant="danger"
                                              size="sm"
                                              className="w-100 fw-bold"
                                              style={{
                                                borderRadius: '10px',
                                                padding: '10px 16px',
                                                background: 'linear-gradient(135deg, #dc3545, #c82333)',
                                                border: 'none',
                                                transition: 'all 0.3s ease',
                                                fontSize: '0.9rem'
                                              }}
                                              onClick={() => handleVideoPlay(video)}
                                              onMouseEnter={(e) => {
                                                e.target.style.transform = 'translateY(-2px)';
                                                e.target.style.boxShadow = '0 8px 20px rgba(220, 53, 69, 0.3)';
                                              }}
                                              onMouseLeave={(e) => {
                                                e.target.style.transform = 'translateY(0)';
                                                e.target.style.boxShadow = 'none';
                                              }}
                                            >
                                              <i className="bi bi-play-circle-fill me-2"></i>
                                              Watch Now
                                            </Button>
                                          </div>
                                        </Card.Body>
                                      </Card>
                                    </Col>
                                  ))}
                                </Row>
                              </div>
                            )}
                          </div>
                        ) : (
                          <Alert variant="info">
                            No detailed analytics available. Click "Refresh Data" to load your YouTube analytics.
                          </Alert>
                        )}
                      </Card.Body>
                    </Card>
                  </div>
                ) : (
                  <Card>
                    <Card.Body className="text-center py-5">
                      <i className="bi bi-youtube text-muted" style={{ fontSize: '3rem' }}></i>
                      <h5 className="mt-3">Connect Your YouTube Channel</h5>
                      <p className="text-muted">
                        Connect your YouTube channel to view detailed insights and analytics.
                      </p>
                      <Button 
                        variant="primary" 
                        onClick={() => setActiveTab('connect-socials')}
                      >
                        Connect YouTube
                      </Button>
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
              <Tab.Pane eventKey="chat">
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
              <i className="bi bi-eye me-1"></i>{selectedVideo?.views?.toLocaleString()} views • 
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