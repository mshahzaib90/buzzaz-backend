import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Nav, Tab, Button, Alert, Spinner, Form, Table, Modal, Carousel } from 'react-bootstrap';
import { Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ComposedChart, Area, PieChart, Pie, Cell } from 'recharts';
import { useAuth } from '../context/AuthContext';
import api, { influencerAPI, userAPI } from '../services/api';
import ChatInterface from '../components/Chat/ChatInterface';
import '../styles/dashboard.css';

const InfluencerDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('profile');
  const [profile, setProfile] = useState(null);
  const [statsHistory, setStatsHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  // Instagram posts engagement state removed due to unused UI paths
  
  // Detailed Instagram data state
  const [detailedInstagramData, setDetailedInstagramData] = useState(null);
  
  // Video player state for reels
  const [selectedReel, setSelectedReel] = useState(null);
  const [showReelModal, setShowReelModal] = useState(false);

  // One-time guard to avoid multiple auto-refreshes when sample data is detected
  const hasAutoRefreshedYT = useRef(false);

  // Normalize reels to ensure URLs and thumbnails exist regardless of scraper field names
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
  // YouTube analytics state
  const [youtubeStats, setYoutubeStats] = useState(null);
  const [isLoadingYT, setIsLoadingYT] = useState(false);
  const [youtubeError, setYoutubeError] = useState('');
  const [detailedYoutubeData, setDetailedYoutubeData] = useState(null);
  const [youtubeDetailedLoading, setYoutubeDetailedLoading] = useState(false);
  const [youtubeDetailedError, setYoutubeDetailedError] = useState('');
  const [ytAutoRefreshed, setYtAutoRefreshed] = useState(false);
  const [selectedVideoId, setSelectedVideoId] = useState(null);
  // YouTube video modal state
  const [showYtModal, setShowYtModal] = useState(false);
  const [selectedYtVideo, setSelectedYtVideo] = useState(null);
  // Profile tab: sort option for Recent Video Performance table
  const [profileSortBy, setProfileSortBy] = useState('date_desc');
  
  // Instagram connection modal state
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState('');
  const [connectUsername, setConnectUsername] = useState('');
  const [connectLoading, setConnectLoading] = useState(false);
  
  const { user } = useAuth();

  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState({
    fullName: '',
    bio: '',
    location: '',
    categories: [],
    contentTypes: []
  });

  // Options per user request
  const categoryOptions = [
    'Beauty', 'Fashion', 'Skincare', 'Tech', 'Lifestyle', 'Food', 'Vegan Food',
    'Vegetarian Food', 'Cafes', 'Fitness', 'Haircare', 'Makeup', 'Home Decor',
    'Meal Prep', 'Self-care', 'Parenting & Family', 'Modest fashion', 'Student Life',
    'Jewelry', 'Travel', 'Health & Wellness', 'Pets', 'Cooking', 'Educational Content',
    'Comedy', 'Entertainment', 'Finance & Investment', 'Gaming & Esports',
    'Sustainable Living', 'Cars', 'Men\'s Grooming', 'Music', 'Books'
  ];

  const contentTypeOptions = [
    'Product Demo', 'Tutorial', 'ASMR', 'Review', 'How to use', 'DIY', 'Unboxing',
    'Taste Test', 'Day in my life (Vlog)', 'Comparison videos', 'Outfit styling',
    'Skits', 'POVs', 'Storytelling', 'Long Form Video', 'Podcast', 'Hauls', 'Challenges'
  ];

  const languageOptions = ['English', 'Urdu', 'Sindhi', 'Punjabi', 'Balochi', 'Pashto'];

  // Handlers for YouTube video click-to-play
  const handleYtVideoClick = (video) => {
    if (!video) return;
    setSelectedVideoId(video.videoId);
    setSelectedYtVideo(video);
    setShowYtModal(true);
  };

  const handleCloseYtModal = () => {
    setShowYtModal(false);
    setSelectedYtVideo(null);
  };

  // Sanitize YouTube channel URLs to prevent malformed protocols and duplicate domains
  const safeUrl = (input) => {
    let s = String(input || '').trim();
    if (!s) return '';
    // Fix single-slash protocol (https:/ -> https://)
    s = s.replace(/^https?:\/(?!\/)/i, (m) => m.replace(':/', '://'));
    // If starts with www.youtube.com/, ensure https:// prefix
    if (/^www\.youtube\.com\//i.test(s)) {
      s = `https://${s}`;
    }
    // Convert bare @handle to full handle URL
    if (/^@[\w\-.]+$/i.test(s)) {
      s = `https://www.youtube.com/${s}`;
    }
    // Strip accidental concatenation like: /channel/https:/www.youtube.com/@handle -> /@handle
    s = s.replace(/\/channel\/https?:\/{1,2}www\.youtube\.com\/(#[^\s]+|@[^\s/]+)/i, (m, p1) => `/${p1}`);
    // Remove duplicate domain patterns
    s = s.replace(/(https?:\/\/(?:www\.)?youtube\.com)\/+https?:\/+(?:www\.)?youtube\.com\//i, '$1/');
    // Remove any stray spaces
    s = s.replace(/\s+/g, '');
    return s;
  };

  // Backfill Instagram username from user.socialConnections if influencer profile is missing it
  const backfillInstagramFromUser = useCallback(async (currentProfile) => {
    try {
      const res = await userAPI.getProfile();
      const igConn = res?.data?.user?.socialConnections?.instagram;
      const igUsername = igConn?.username || '';

      if (igConn?.connected && igUsername && !currentProfile?.instagramUsername) {
        try {
          await influencerAPI.updateProfile(user.uid, { instagramUsername: igUsername });
          setProfile({ ...(currentProfile || {}), instagramUsername: igUsername });
        } catch (upErr) {
          console.warn('Failed to upsert instagramUsername from user socialConnections:', upErr);
          setProfile({ ...(currentProfile || {}), instagramUsername: igUsername });
        }
      }
    } catch (err) {
      console.warn('Unable to read user socialConnections for Instagram backfill:', err);
    }
  }, [user?.uid]);

  

  const fetchProfile = useCallback(async () => {
    console.log('=== fetchProfile called ===');
    console.log('User UID:', user.uid);
    try {
      const response = await influencerAPI.getProfile();
      const profileData = {
        ...response.data.profile,
        latestStats: response.data.latestStats
      };
      setProfile(profileData);
      if (!profileData?.instagramUsername) {
        backfillInstagramFromUser(profileData);
      }
      setEditData({
        fullName: response.data.profile.fullName || '',
        bio: response.data.profile.bio || '',
        location: response.data.profile.location || '',
        categories: response.data.profile.categories || [],
        contentTypes: response.data.profile.contentTypes || [],
        languages: response.data.profile.languages || [],
        priceRangeMin: response.data.profile.priceRangeMin ?? '',
        priceRangeMax: response.data.profile.priceRangeMax ?? '',
        reelPrice: response.data.profile.reelPrice ?? '',
        storyPrice: response.data.profile.storyPrice ?? '',
        eventPrice: response.data.profile.eventPrice ?? '',
        multiplePlatformsPrice: response.data.profile.multiplePlatformsPrice ?? '',
        averageDeliveryTime: response.data.profile.averageDeliveryTime ?? '',
        deliveryProductBased: response.data.profile.deliveryProductBased ?? '',
        deliveryNoProduct: response.data.profile.deliveryNoProduct ?? '',
        deliveryOutdoorShoot: response.data.profile.deliveryOutdoorShoot ?? '',
        deliveryRevisions: response.data.profile.deliveryRevisions ?? ''
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
      if (error?.response?.status === 404) {
        setError('Profile not found. Redirecting to onboarding...');
        setTimeout(() => {
          navigate('/influencer/wizard', { replace: true });
        }, 500);
      } else {
        setError('Failed to load profile data');
      }
    } finally {
      setIsLoading(false);
    }
  }, [navigate, user?.uid, backfillInstagramFromUser]);

  const fetchStatsHistory = useCallback(async () => {
    try {
      const response = await influencerAPI.getStats(user.uid, 30);
      setStatsHistory(response.data.stats);
    } catch (error) {
      console.error('Error fetching stats history:', error);
    }
  }, [user?.uid]);

  useEffect(() => {
    if (user?.uid) {
      fetchProfile();
      fetchStatsHistory();
    }
  }, [user?.uid, fetchProfile, fetchStatsHistory]);

  useEffect(() => {
    const t = setTimeout(() => {
      setIsLoading(false);
    }, 8000);
    return () => clearTimeout(t);
  }, []);

  

  // Refresh YouTube data (fetch from API and save to database)
  const refreshYoutubeData = useCallback(async () => {
    setYoutubeDetailedLoading(true);
    setYoutubeDetailedError('');

    try {
      const response = await influencerAPI.refreshYouTubeAnalytics(user.uid);
      console.log('YouTube data refreshed:', response);
      setSuccess('YouTube data refreshed successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error refreshing YouTube data:', error);
      let errorMessage = 'Failed to refresh YouTube data';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      setYoutubeDetailedError(errorMessage);
    } finally {
      setYoutubeDetailedLoading(false);
    }
  }, [user?.uid]);

  // Fetch detailed YouTube analytics from our backend
  const fetchDetailedYoutubeData = useCallback(async () => {
    setYoutubeDetailedLoading(true);
    setYoutubeDetailedError('');

    try {
      const response = await influencerAPI.getYouTubeAnalyticsDetailed(user.uid);
      const payload = response.data || {};

      // Normalize PG response shape (summary + analytics) to expected structure with channelInfo
      const channelInfo = payload.channelInfo || payload.summary || {};
      const recentVideos = payload.recentVideos || payload.analytics?.recentVideos || [];
      const agg = payload.aggregatedMetrics || {};
      const ana = payload.analytics || {};

      const totalLikesFromVideos = recentVideos.reduce((sum, v) => sum + Number(v.likeCount ?? v.likes ?? 0), 0);
      const totalCommentsFromVideos = recentVideos.reduce((sum, v) => sum + Number(v.commentCount ?? v.comments ?? 0), 0);

      const normalized = {
        ...payload,
        channelInfo: {
          channelId: channelInfo.channelId || channelInfo.channel_id || '',
          channelTitle: channelInfo.channelTitle || channelInfo.channel_title || '',
          subscriberCount: Number(channelInfo.subscriberCount ?? channelInfo.subscriber_count ?? 0),
          viewCount: Number(channelInfo.viewCount ?? channelInfo.view_count ?? 0),
          videoCount: Number(channelInfo.videoCount ?? channelInfo.video_count ?? 0),
          channelUrl: safeUrl(channelInfo.channelUrl || channelInfo.channel_url || (channelInfo.channelId ? `https://www.youtube.com/channel/${channelInfo.channelId}` : '')),
        },
        // Provide a metrics object expected by the dashboard
        metrics: {
          likes: Number(ana.totalLikes ?? agg.totalLikes ?? totalLikesFromVideos ?? 0),
          comments: Number(ana.totalComments ?? agg.totalComments ?? totalCommentsFromVideos ?? 0),
          estimatedMinutesWatched: Number(ana.estimatedMinutesWatched ?? agg.estimatedMinutesWatched ?? 0),
          averageViewDuration: Number(ana.averageViewDuration ?? agg.averageViewDuration ?? 0),
          subscribersGained: Number(ana.subscribersGained ?? 0),
          subscribersLost: Number(ana.subscribersLost ?? 0),
        },
        // Persist data source hint from backend to drive UI badges
        dataSource: ana?.dataSource || payload.dataSource || null,
        recentVideos,
      };

      setDetailedYoutubeData(normalized);
      console.log('Loaded detailed YouTube data (normalized):', normalized);

      // If payload looks like sample data, attempt a one-time auto refresh
      try {
        const vids = normalized?.recentVideos || [];
        const looksMock = (normalized?.dataSource === 'mock') || vids.some(v => v.videoId === 'dQw4w9WgXcQ' || v.videoId === 'jNQXAC9IVRw');
        if (looksMock && !hasAutoRefreshedYT.current) {
          hasAutoRefreshedYT.current = true;
          await refreshYoutubeData();
        }
      } catch (ignore) {}
      
    } catch (error) {
      console.error('Error loading detailed YouTube data:', error);
      
      let errorMessage = 'Failed to load detailed YouTube analytics';
      
      if (error.response?.status === 404) {
        errorMessage = 'No YouTube analytics data found. Please refresh your YouTube data first.';
      } else if (error.response?.status === 401) {
        errorMessage = 'Authentication failed. Please refresh the page and try again.';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      setYoutubeDetailedError(errorMessage);
    } finally {
      setYoutubeDetailedLoading(false);
    }
  }, [user?.uid, refreshYoutubeData]);

  
  

  // Fetch YouTube stats from backend (after refresh defined to avoid TDZ)
  const fetchYouTubeStats = useCallback(async () => {
    setYoutubeError('');
    setIsLoadingYT(true);
    try {
      const response = await influencerAPI.getYouTubeAnalyticsDetailed(user.uid);
      const payload = response?.data || {};
      const ci = payload.channelInfo || payload.summary;
      if (ci && (ci.channelId || ci.channel_id)) {
        const channelId = ci.channelId || ci.channel_id;
        const channelTitle = ci.channelTitle || ci.channel_title || '';
        const subscribers = Number(ci.subscriberCount ?? ci.subscriber_count ?? 0);
        const videos = Number(ci.videoCount ?? ci.video_count ?? 0);
        const views = Number(ci.viewCount ?? ci.view_count ?? 0);
        const channelUrl = safeUrl(ci.channelUrl || ci.channel_url || (channelId ? `https://www.youtube.com/channel/${channelId}` : ''));
        setYoutubeStats({
          title: channelTitle,
          url: channelUrl,
          subscribers,
          videos,
          views,
        });
      } else {
        setYoutubeError('YouTube channel data not available');
      }
    } catch (err) {
      console.error('Error fetching YouTube stats:', err);
      setYoutubeError('Failed to load YouTube analytics');
    } finally {
      setIsLoadingYT(false);
    }
  }, [user?.uid]);

  // Reel video modal handlers
  const handleReelClick = (reel) => {
    console.log('Reel clicked:', reel);
    setSelectedReel(reel);
    setShowReelModal(true);
  };

  const handleCloseReelModal = () => {
    setShowReelModal(false);
    setSelectedReel(null);
  };

  // Load Instagram data from Firebase (database only)
  const fetchDetailedInstagramData = useCallback(async () => {
    console.log('=== fetchDetailedInstagramData called ===');
    console.log('Profile:', profile);
    console.log('Profile Instagram Username:', profile?.instagramUsername);
    console.log('User:', user);
    console.log('User UID:', user?.uid);
    
    if (!profile?.instagramUsername) {
      console.log('No Instagram username found, returning early');
      return;
    }
    
    

    try {
      const apiUrl = `/influencer/${user.uid}/instagram/detailed`;
      console.log('Making API call to:', apiUrl);
      
      const response = await api.get(apiUrl);
      console.log('API Response:', response);
      console.log('API Response Data:', response.data);
      
      // Normalize reels so the UI always has a usable reelUrl and thumbnail
      const payload = response.data || {};
      const normalizedReels = normalizeReels(payload.reels || payload.posts?.reels || []);
      const finalData = { ...payload, reels: normalizedReels };
      setDetailedInstagramData(finalData);
      console.log('Loaded Instagram data from database:', finalData);
      
    } catch (error) {
      console.error('Error loading Instagram data from database:', error);
      console.error('Error response:', error.response);
      console.error('Error status:', error.response?.status);
      console.error('Error data:', error.response?.data);
      
      let errorMessage = 'Failed to load Instagram data from database';
      
      if (error.response?.status === 404) {
        errorMessage = 'No Instagram data found. Please refresh your Instagram data first.';
      } else if (error.response?.status === 401) {
        errorMessage = 'Authentication failed. Please refresh the page and try again.';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      setError(errorMessage);
    } finally {
      // no-op
    }
  }, [profile, user]);

  

  // Refresh data function
  const refreshData = useCallback(async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        fetchProfile(),
        fetchDetailedInstagramData(),
        fetchYouTubeStats(),
        fetchDetailedYoutubeData()
      ]);
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [fetchProfile, fetchDetailedInstagramData, fetchYouTubeStats, fetchDetailedYoutubeData]);

  // Auto-refresh data every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      if (profile?.id) {
        refreshData();
      }
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [profile?.id, refreshData]);

  // Fetch YouTube stats and detailed data when user context is available
  useEffect(() => {
    if (user?.uid) {
      fetchYouTubeStats();
      fetchDetailedYoutubeData();
    }
  }, [user?.uid, fetchYouTubeStats, fetchDetailedYoutubeData]);

  // Fetch Instagram detailed data when insights tab is active
  useEffect(() => {
    if (activeTab === 'insights') {
      fetchDetailedInstagramData();
    }
  }, [activeTab, profile?.instagramUsername, user?.uid, fetchDetailedInstagramData]);

  // Fetch detailed YouTube data when YouTube tab is active
  useEffect(() => {
    if (activeTab === 'youtube') {
      fetchDetailedYoutubeData();
    }
  }, [activeTab, user?.uid, fetchDetailedYoutubeData]);

  // Ensure real-time: if no detailed data after load, auto trigger backend refresh once
  useEffect(() => {
    if (
      activeTab === 'youtube' &&
      !youtubeDetailedLoading &&
      !detailedYoutubeData &&
      !ytAutoRefreshed
    ) {
      refreshYoutubeData().finally(() => setYtAutoRefreshed(true));
    }
  }, [activeTab, youtubeDetailedLoading, detailedYoutubeData, ytAutoRefreshed, refreshYoutubeData]);

  // Fetch Instagram data when profile is loaded and has Instagram username
  useEffect(() => {
    if (profile?.instagramUsername) {
      fetchDetailedInstagramData();
    }
  }, [profile?.instagramUsername, user?.uid, fetchDetailedInstagramData]);

  

  const handleUpdateProfile = async () => {
    setIsUpdating(true);
    setError('');
    setSuccess('');

    try {
      await influencerAPI.updateProfile(user.uid, editData);
      setSuccess('Profile updated successfully!');
      setEditMode(false);
      await fetchProfile();
    } catch (error) {
      console.error('Error updating profile:', error);
      setError(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setIsUpdating(false);
    }
  };

  // Start edit mode and prefill with current profile values
  const handleEditStart = () => {
    setEditData({
      fullName: profile?.fullName || '',
      bio: profile?.bio || '',
      location: profile?.location || '',
      categories: profile?.categories || [],
      contentTypes: profile?.contentTypes || [],
      languages: profile?.languages || [],
      priceRangeMin: profile?.priceRangeMin ?? '',
      priceRangeMax: profile?.priceRangeMax ?? '',
      reelPrice: profile?.reelPrice ?? '',
      storyPrice: profile?.storyPrice ?? '',
      eventPrice: profile?.eventPrice ?? '',
      multiplePlatformsPrice: profile?.multiplePlatformsPrice ?? '',
      averageDeliveryTime: profile?.averageDeliveryTime ?? '',
      deliveryProductBased: profile?.deliveryProductBased ?? '',
      deliveryNoProduct: profile?.deliveryNoProduct ?? '',
      deliveryOutdoorShoot: profile?.deliveryOutdoorShoot ?? '',
      deliveryRevisions: profile?.deliveryRevisions ?? ''
    });
    setEditMode(true);
  };

  const handleCancelEdit = () => {
    setEditMode(false);
    setEditData({
      fullName: profile?.fullName || '',
      bio: profile?.bio || '',
      location: profile?.location || '',
      categories: profile?.categories || [],
      contentTypes: profile?.contentTypes || [],
      languages: profile?.languages || [],
      priceRangeMin: profile?.priceRangeMin ?? '',
      priceRangeMax: profile?.priceRangeMax ?? '',
      reelPrice: profile?.reelPrice ?? '',
      storyPrice: profile?.storyPrice ?? '',
      eventPrice: profile?.eventPrice ?? '',
      multiplePlatformsPrice: profile?.multiplePlatformsPrice ?? '',
      averageDeliveryTime: profile?.averageDeliveryTime ?? '',
      deliveryProductBased: profile?.deliveryProductBased ?? '',
      deliveryNoProduct: profile?.deliveryNoProduct ?? '',
      deliveryOutdoorShoot: profile?.deliveryOutdoorShoot ?? '',
      deliveryRevisions: profile?.deliveryRevisions ?? ''
    });
  };

  const handleEditFieldChange = (field, value) => {
    if (field === 'categories' || field === 'contentTypes' || field === 'languages') {
      const arr = Array.isArray(value)
        ? value
        : (value || '')
            .split(',')
            .map(v => v.trim())
            .filter(Boolean);
      setEditData(prev => ({ ...prev, [field]: arr }));
    } else {
      setEditData(prev => ({ ...prev, [field]: value }));
    }
  };

  // Refresh Instagram data by fetching from API and saving to Firebase
  const handleSyncInstagram = async () => {
    if (!profile?.instagramUsername) {
      setError('No Instagram username found to sync');
      return;
    }

    setIsUpdating(true);
    setError('');
    setSuccess('');

    try {
      // Call the refresh endpoint to fetch and save data
      const refreshRes = await api.post(`/influencer/${user.uid}/instagram/refresh`);
      const reelsCount = refreshRes?.data?.stats?.reelsCount;
      
      // After refresh, poll detailed endpoint briefly until reels appear
      let fetchedData = null;
      const maxAttempts = 4;
      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
          const res = await api.get(`/influencer/${user.uid}/instagram/detailed`);
          const reels = res.data?.reels || res.data?.posts?.reels || [];
          if (Array.isArray(reels) && reels.length > 0) {
            const normalizedReels = normalizeReels(reels);
            fetchedData = { ...res.data, reels: normalizedReels };
            break;
          }
        } catch {}
        // Backoff between attempts (2s, 3s, 4s...)
        await new Promise(r => setTimeout(r, 1000 + attempt * 1000));
      }

      if (fetchedData) {
        setDetailedInstagramData(fetchedData);
        setSuccess(`Instagram reels refreshed${typeof reelsCount === 'number' ? ` (${reelsCount} saved)` : ''}!`);
      } else {
        // Fallback: still reload once using existing helper and inform user
        await fetchDetailedInstagramData();
        setSuccess(`Instagram data refreshed${typeof reelsCount === 'number' ? ` (${reelsCount} saved)` : ''}, but no reels found yet.`);
      }
      
      // Refresh profile data afterwards
      await fetchProfile();
    } catch (error) {
      console.error('Error refreshing Instagram data:', error);
      setError(error.response?.data?.message || 'Failed to refresh Instagram data');
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle platform connection modal
  const handleConnectPlatform = (platform) => {
    setSelectedPlatform(platform);
    setShowConnectModal(true);
    setConnectUsername('');
  };

  // Handle Instagram connection
  const handleConnectInstagram = async () => {
    if (!connectUsername.trim()) {
      setError('Please enter a valid Instagram username');
      return;
    }

    setConnectLoading(true);
    setError('');

    try {
      console.log('Attempting to connect Instagram username:', connectUsername);
      
      // Validate Instagram username via API
      const response = await influencerAPI.validateApify(connectUsername);
      console.log('API Response:', response.data);
      
      if (response.data.success) {
        // Support both structures: { success, data: { profile } } and { success, profileData }
        const payload = response?.data?.data || response?.data;
        const profile = payload?.profile || payload?.profileData || {};
        console.log('Parsed profile data:', profile);
        
        // Update profile with Instagram data
        const updateData = {
          instagramUsername: connectUsername,
          followers: profile.followers || profile.followersCount || 0,
          following: profile.following || profile.followingCount || 0,
          postsCount: profile.postsCount || profile.mediaCount || 0,
          engagementRate: profile.engagementRate || 0
        };

        console.log('Updating profile with data:', updateData);
        await influencerAPI.updateProfile(user.uid, updateData);
        
        // Immediately reflect connection in local state to avoid requiring a page reload
        const sanitizedUsername = String(connectUsername || '')
          .trim()
          .replace(/^@/, '');
        setProfile(prev => ({ ...(prev || {}), instagramUsername: sanitizedUsername }));

        setShowConnectModal(false);
        setSuccess('Instagram account connected successfully!');
        
        // Refresh profile data for eventual consistency
        await fetchProfile();
        // Also kick off detailed data load so insights populate
        await fetchDetailedInstagramData();
      } else {
        setError('Failed to validate Instagram username. Please check and try again.');
      }
    } catch (err) {
      console.error('Instagram connection error:', err);
      setError('Failed to validate Instagram automatically. Saving your username...');
      try {
        const trimmed = connectUsername.trim();
        if (trimmed) {
          await influencerAPI.updateProfile(user.uid, { instagramUsername: trimmed });
          setShowConnectModal(false);
          setSuccess('Instagram username saved. Analytics will be fetched when available.');
          await fetchProfile();
        }
      } catch (updateErr) {
        console.error('Fallback save of Instagram username failed:', updateErr);
        setError('Failed to connect Instagram account. Please try again.');
      }
    } finally {
      setConnectLoading(false);
    }
  };

  const formatChartData = (data) => {
    return data.map(item => ({
      date: new Date(item.timestamp).toLocaleDateString(),
      followers: item.followers,
      following: item.following,
      posts: item.postsCount,
      engagementRate: (item.engagementRate * 100).toFixed(2)
    }));
  };

  // Provide gender distribution data for the pie chart
  const getGenderData = () => {
    const gender = (profile?.gender || '').toLowerCase();
    const male = gender === 'male' ? 100 : 0;
    const female = gender === 'female' ? 100 : 0;
    // If no gender is set, return empty to show the "No gender data" state
    if (male === 0 && female === 0) return [];
    return [
      { name: 'Male', value: male },
      { name: 'Female', value: female }
    ];
  };

  // Determine profile completeness for top warning banner
  const isProfileComplete = (p) => {
    if (!p) return false;
    const hasBio = !!(p.bio && String(p.bio).trim());
    const hasLocation = !!(p.location && String(p.location).trim());
    const hasNiche = Array.isArray(p.categories) ? p.categories.length > 0 : Array.isArray(p.niche) ? p.niche.length > 0 : false;
    const hasContentStyle = Array.isArray(p.contentTypes) ? p.contentTypes.length > 0 : Array.isArray(p.contentStyle) ? p.contentStyle.length > 0 : false;
    const hasLanguages = Array.isArray(p.languages) ? p.languages.length > 0 : !!(p.language && String(p.language).trim());
    return hasBio && hasLocation && hasNiche && hasContentStyle && hasLanguages;
  };

  if (isLoading) {
    return (
      <Container fluid className="py-5">
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '50vh' }}>
          <Spinner animation="border" role="status" variant="primary">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
        </div>
      </Container>
    );
  }

  if (!profile) {
    return (
      <Container fluid className="py-5">
        <Alert variant="warning" className="d-flex justify-content-between align-items-center">
          <div>
            <i className="bi bi-exclamation-triangle me-2"></i>
            Profile not found. Please complete your onboarding process.
          </div>
          <Button variant="primary" onClick={() => navigate('/influencer/wizard')}>
            Start Onboarding
          </Button>
        </Alert>
      </Container>
    );
  }

  const chartData = formatChartData(statsHistory);
  const genderData = getGenderData();
  // Toggle for showing Audience History chart (hidden per request)
  const showAudienceHistory = false;
  // Toggle for header search visibility (hidden per request)
  const showHeaderSearch = false;
  // Toggle for showing Followers by Gender chart (hidden per request)
  const showGenderChart = false;

  // Build Audience History chart data (0-100%) using engagementRate
  const audienceChartData = (chartData && chartData.length)
    ? chartData.map(d => ({
        date: d.date,
        followersPercent: typeof d.engagementRate === 'string' ? parseFloat(d.engagementRate) : (d.engagementRate || 0),
      }))
    : [
        { date: 'Sat', followersPercent: 20 },
        { date: 'Sun', followersPercent: 40 },
        { date: 'Mon', followersPercent: 55 },
        { date: 'Tue', followersPercent: 75 },
        { date: 'Wed', followersPercent: 60 },
        { date: 'Thu', followersPercent: 80 },
        { date: 'Fri', followersPercent: 65 },
      ];

  // Compute gender donut display values and center label
  const femalePercent = Math.round((genderData.find(g => g.name === 'Female')?.value) || 0);
  const malePercent = Math.round((genderData.find(g => g.name === 'Male')?.value) || 0);
  const genderDisplayData = [
    { name: 'Female', value: femalePercent },
    { name: 'Male', value: malePercent },
  ];
  const centerLabel = femalePercent >= malePercent ? 'Female' : 'Male';
  const centerPercent = femalePercent >= malePercent ? femalePercent : malePercent;

  // Determine YouTube connection using either profile or detailed data
  const youtubeConnected = Boolean(
    profile?.youtubeChannelId ||
    detailedYoutubeData?.channelInfo?.channelId ||
    detailedYoutubeData?.summary?.channelId ||
    youtubeStats?.url
  );

  // Resolve latest stats with fallback to profile fields when snapshot is missing
  const latestStats = profile.latestStats || {
    followers: profile.followers,
    following: profile.following,
    postsCount: profile.postsCount,
    isPrivate: profile.isPrivate,
    isVerified: profile.isVerified,
  };

  return (
    <Container fluid className="py-4">
      <Row>
        <Col>
          {/* Revert: remove custom pastel header to keep previous layout */}

          {error && (
            <Alert variant="danger" className="mb-3">
              <i className="bi bi-exclamation-triangle me-2"></i>
              {error}
            </Alert>
          )}

          {success && (
            <Alert variant="success" className="mb-3">
              <i className="bi bi-check-circle me-2"></i>
              {success}
            </Alert>
          )}

          {!isProfileComplete(profile) && (
            <Alert variant="warning" className="mb-3">
              <i className="bi bi-exclamation-triangle me-2"></i>
              Your Profile is incomplete please complete yout profile
            </Alert>
          )}

          <Tab.Container activeKey={activeTab} onSelect={setActiveTab}>
            <Row>
              <Col md={3} lg={2} className="mb-4">
                <div className="sidebar-glass p-3 h-100 d-flex flex-column">
                  <div className="d-flex align-items-center mb-4">
                    <span className="fs-5 sidebar-logo">BUZZAZ</span>
                  </div>
                  <Nav className="flex-column">
                    <Button type="button" className="glass-button mb-2" onClick={() => setActiveTab('profile')}>
                      <i className="bi bi-person me-2"></i>
                      Profile
                    </Button>
                    <Button type="button" className="glass-button mb-2" onClick={() => setActiveTab('insights')}>
                      <i className="bi bi-instagram me-2"></i>
                      Instagram
                    </Button>
                    <Button type="button" className="glass-button mb-2" onClick={() => setActiveTab('youtube')}>
                      <i className="bi bi-youtube me-2"></i>
                      YouTube
                    </Button>
                    <Button type="button" className="glass-button mb-2" onClick={() => setActiveTab('chat')}>
                      <i className="bi bi-chat-dots me-2"></i>
                      Messages
                    </Button>
                  </Nav>
                </div>
              </Col>
              <Col md={9} lg={activeTab === 'profile' ? 7 : 10}>
                <Tab.Content>
              {/* Profile Tab */}
              <Tab.Pane eventKey="profile">
                <div className="profile-dashboard">
                {/* Top metric boxes removed per request */}
                <Row className="mb-1">
                  <Col lg={12} className="mb-2">
                    <div className="d-flex align-items-center justify-content-between mb-3">
                      <h5 className="mb-0">Dashboard</h5>
                      {showHeaderSearch && (
                        <div className="input-group header-search" style={{ maxWidth: 360 }}>
                          <span className="input-group-text bg-transparent border-0"><i className="bi bi-search"></i></span>
                          <input type="text" className="form-control header-search-control" placeholder="Search..." />
                        </div>
                      )}
                    </div>
                    <div className="stat-grid">
                      {/* Followers */}
                      <div className="metric-card">
                        <div className="metric-icon icon-blue"><i className="bi bi-people"></i></div>
                        <div className="metric-content">
                          <div className="metric-label">Total Followers</div>
                          <div className="metric-value">{(latestStats?.followers ?? profile?.followers ?? 0)?.toLocaleString?.() || (latestStats?.followers ?? profile?.followers ?? 0)}</div>
                          <div className="metric-progress mt-2"><div className="metric-progress-bar progress-yellow" style={{ width: '38%' }}></div></div>
                          <div className="metric-progress-text"><span>0%</span><span>38%</span></div>
                        </div>
                      </div>
                      {/* Total Views */}
                      <div className="metric-card">
                        <div className="metric-icon icon-blue"><i className="bi bi-eye"></i></div>
                        <div className="metric-content">
                          <div className="metric-label">Total Views</div>
                          <div className="metric-value">{(youtubeStats?.views ?? profile?.tiktokTotalViews ?? 0)?.toLocaleString?.() || (youtubeStats?.views ?? profile?.tiktokTotalViews ?? 0)}</div>
                          <div className="metric-progress mt-2"><div className="metric-progress-bar progress-yellow" style={{ width: '85%' }}></div></div>
                          <div className="metric-progress-text"><span>0%</span><span>85%</span></div>
                        </div>
                      </div>
                      {/* Relationships */}
                      <div className="metric-card">
                        <div className="metric-icon icon-lavender"><i className="bi bi-people-fill"></i></div>
                        <div className="metric-content">
                          <div className="metric-label">Relationships</div>
                          <div className="metric-value">{(profile?.relationshipsCount ?? profile?.relationships?.length ?? 0)?.toLocaleString?.() || (profile?.relationshipsCount ?? (profile?.relationships?.length ?? 0))}</div>
                          <div className="metric-progress mt-2"><div className="metric-progress-bar progress-yellow" style={{ width: '65%' }}></div></div>
                          <div className="metric-progress-text"><span>0%</span><span>65%</span></div>
                        </div>
                      </div>
                      {/* Total Earned */}
                      <div className="metric-card">
                        <div className="metric-icon icon-green"><i className="bi bi-cash-stack"></i></div>
                        <div className="metric-content">
                          <div className="metric-label">Total Earned</div>
                          <div className="metric-value">${(profile?.totalEarnings ?? profile?.earningsTotal ?? profile?.earnings?.total ?? 0)?.toLocaleString?.() || (profile?.totalEarnings ?? profile?.earningsTotal ?? profile?.earnings?.total ?? 0)}</div>
                          <div className="metric-progress mt-2"><div className="metric-progress-bar progress-green" style={{ width: '85%' }}></div></div>
                          <div className="metric-progress-text"><span>0%</span><span>85%</span></div>
                        </div>
                      </div>
                    </div>
                  </Col>

                  {/* Right sidebar moved to the outer column */}
                </Row>

                {/* Middle Section: Audience History + Followers by Gender */}
                <Row className="mb-2">
                  {/* Audience History (hidden per request) */}
                  {showAudienceHistory && (
                    <Col lg={8} className="mb-4">
                      <div className="chart-card">
                        <div className="d-flex align-items-center justify-content-between mb-2">
                          <h6 className="chart-title mb-0">Audience History</h6>
                          <div>
                            <button type="button" className="btn btn-sm btn-light border rounded-3">Feedback</button>
                          </div>
                        </div>
                        <div style={{ height: 220 }}>
                          <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={audienceChartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                              <defs>
                                <linearGradient id="audienceFill" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="0%" stopColor="#7dd3fc" stopOpacity={0.8} />
                                  <stop offset="100%" stopColor="#7dd3fc" stopOpacity={0.2} />
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} />
                              <XAxis dataKey="date" />
                              <YAxis tickFormatter={(v) => `${v}%`} domain={[0, 100]} />
                              <Tooltip />
                              <Area type="monotone" dataKey="followersPercent" fill="url(#audienceFill)" stroke="#06b6d4" />
                              <Line type="monotone" dataKey="followersPercent" stroke="#06b6d4" strokeWidth={3} dot={{ r: 4, fill: '#06b6d4' }} />
                            </ComposedChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </Col>
                  )}

                  {/* Followers by Gender (hidden per request) */}
                  {showGenderChart && genderData?.length > 0 && (
                    <Col lg={4} className="mb-4">
                      <div className="chart-card">
                        <h6 className="chart-title mb-2">Followers by Gender</h6>
                        <div className="donut-chart-wrapper">
                          <ResponsiveContainer width="100%" height={220}>
                            <PieChart>
                              <Pie
                                data={genderDisplayData}
                                dataKey="value"
                                nameKey="name"
                                innerRadius={60}
                                outerRadius={90}
                                paddingAngle={2}
                                startAngle={90}
                                endAngle={-270}
                              >
                                {genderDisplayData.map((entry, idx) => (
                                  <Cell key={`cell-${idx}`} fill={entry.name === 'Female' ? '#14b8a6' : '#3b82f6'} />
                                ))}
                              </Pie>
                            </PieChart>
                          </ResponsiveContainer>
                          <div className="donut-center">
                            <div className="fw-semibold">{centerLabel}</div>
                            <div className="text-primary fw-bold">{centerPercent}%</div>
                          </div>
                        </div>
                        <div className="d-flex justify-content-between px-2 mt-2">
                          <div className="d-flex align-items-center gap-2">
                            <span className="legend-dot" style={{ backgroundColor: '#14b8a6' }}></span>
                            <span className="small">{femalePercent}% Female</span>
                          </div>
                          <div className="d-flex align-items-center gap-2">
                            <span className="legend-dot" style={{ backgroundColor: '#3b82f6' }}></span>
                            <span className="small">{malePercent}% Male</span>
                          </div>
                        </div>
                      </div>
                    </Col>
                  )}
                </Row>

                {/* Recent Posts Performance section removed */}

                {/* Recent Video Performance (Profile Tab) - Table view */}
                {(() => {
                  const recent = detailedYoutubeData?.recentVideos || [];
                  if (!recent || recent.length === 0) return null;

                  const formatNumber = (n) => (Number(n || 0)).toLocaleString();
                  const computeStars = (v) => {
                    const views = Number(v.viewCount || 0);
                    const likes = Number(v.likeCount || 0);
                    const ratio = views ? likes / views : 0;
                    if (ratio >= 0.08) return 5;
                    if (ratio >= 0.05) return 4;
                    if (ratio >= 0.03) return 3;
                    if (ratio >= 0.015) return 2;
                    return 1;
                  };

                  const rows = recent.map(v => ({
                    id: v.id || v.videoId || v.etag || String(Math.random()),
                    title: v.title || v.videoTitle || 'Untitled',
                    created: new Date(v.publishedAt || v.published_at || Date.now()),
                    views: Number(v.viewCount || 0),
                    likes: Number(v.likeCount || 0),
                    comments: Number(v.commentCount || 0),
                    stars: computeStars(v),
                    thumb: (v.thumbnails?.high?.url || v.thumbnails?.medium?.url || v.thumbnails?.default?.url || v.thumbnail || v.thumbnailUrl || '/images/logo192.png')
                  }));

                  const sorted = [...rows].sort((a, b) => {
                    switch (profileSortBy) {
                      case 'date_asc':
                        return a.created - b.created;
                      case 'views_desc':
                        return b.views - a.views;
                      case 'likes_desc':
                        return b.likes - a.likes;
                      case 'comments_desc':
                        return b.comments - a.comments;
                      case 'date_desc':
                      default:
                        return b.created - a.created;
                    }
                  });

                  return (
                    <div className="yt-glass-panel mb-4">
                      <div className="d-flex align-items-center justify-content-between mb-3">
                        <h5 className="section-title mb-0"><i className="bi bi-table me-2"></i>Recent Video Performance</h5>
                        <Form.Select size="sm" className="sort-select w-auto" value={profileSortBy} onChange={(e) => setProfileSortBy(e.target.value)}>
                          <option value="date_desc">Sort By</option>
                          <option value="date_desc">Newest</option>
                          <option value="date_asc">Oldest</option>
                          <option value="views_desc">Views</option>
                          <option value="likes_desc">Likes</option>
                          <option value="comments_desc">Comments</option>
                        </Form.Select>
                      </div>
                      <div className="recent-table-card">
                        <Table responsive className="recent-table mb-0">
                          <thead>
                            <tr>
                              <th>Post Name</th>
                              <th>Created</th>
                              <th>Quality</th>
                              <th>Potential Reach</th>
                              <th>Actual Reach</th>
                              
                            </tr>
                          </thead>
                          <tbody>
                            {sorted.map(row => {
                              const minReach = row.views;
                              const maxReach = Math.round(row.views * 1.8);
                              const createdLabel = row.created.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
                              return (
                                <tr key={row.id}>
                                  <td>
                                    <div className="d-flex align-items-center gap-2">
                                      <span className="fw-semibold text-wrap" style={{ maxWidth: '320px' }}>{row.title}</span>
                                    </div>
                                  </td>
                                  <td className="text-muted">{createdLabel}</td>
                                  <td>
                                    <div className="stars">
                                      {[0,1,2,3,4].map(i => (
                                        <i key={i} className={`bi ${i < row.stars ? 'bi-star-fill star-filled' : 'bi-star star-empty'}`}></i>
                                      ))}
                                    </div>
                                  </td>
                                  <td>{formatNumber(minReach)}–{formatNumber(maxReach)}</td>
                                  <td>{formatNumber(row.views)}</td>
                                  
                                </tr>
                              );
                            })}
                          </tbody>
                        </Table>
                      </div>
                    </div>
                  );
                })()}
                </div>
              </Tab.Pane>

              {/* Insights Tab - Pastel Instagram Dashboard */}
              <Tab.Pane eventKey="insights">
                {profile?.instagramUsername ? (
                  <>
                    {/* Profile summary */}
                    <div className="yt-glass-panel mb-3">
                      <div className="d-flex align-items-center justify-content-between">
                        <div className="d-flex align-items-center gap-3">
                          <div className="rounded-circle bg-light d-flex align-items-center justify-content-center" style={{ width: 48, height: 48 }}>
                            <i className="bi bi-instagram text-dark"></i>
                          </div>
                          <div>
                            <div className="fw-semibold">{detailedInstagramData?.profile?.fullName || profile.fullName || 'Profile Name'} <span className="text-muted">@{detailedInstagramData?.profile?.username || profile.instagramUsername}</span></div>
                            <div className="small text-muted">Connected</div>
                            {(() => {
                              const bioText =
                                detailedInstagramData?.profile?.bio ||
                                detailedInstagramData?.profile?.biography ||
                                profile?.instagramBio ||
                                profile?.bio || '';
                              return bioText ? (
                                <div className="small text-muted mt-1">{bioText}</div>
                              ) : null;
                            })()}
                          </div>
                        </div>
                        <Button size="sm" variant="outline-primary" className="glass-button">Edit</Button>
                      </div>
                    </div>

                    {/* Instagram Overview — exact-match panel */}
                    {(() => {
                      const followersCount = detailedInstagramData?.profile?.followers ?? latestStats.followers ?? 0;
                      const reachCount = detailedInstagramData?.analytics?.reach ?? 0;
                      const impressionsCount = detailedInstagramData?.analytics?.impressions ?? 0;
                      const profileVisits = detailedInstagramData?.analytics?.profileVisits ?? Math.round((reachCount || followersCount) * 0.18);
                      // Prefer backend-provided breakdown; fallback to derived
                      // Removed unused followersReach to satisfy lint

                      // Charts section removed; drop unused demo data to satisfy lint

                      return (
                        <div className="ig-overview-panel mb-4">
                          {/* KPI row: Followers, Reach, Impressions, Engagement, Profile visits */}
                          <div className="ig-kpi-grid">
                            <div className="ig-kpi-card">
                              <div className="d-flex justify-content-between align-items-center">
                                <div className="ig-kpi-title">Followers</div>
                                <i className="bi bi-people-fill ig-kpi-icon"></i>
                              </div>
                              <div className="ig-kpi-mini"></div>
                              <div className="d-flex justify-content-between align-items-center">
                                <span className="fw-bold">{followersCount.toLocaleString?.() || followersCount}</span>
                                <span className="ig-kpi-trend"><i className="bi bi-arrow-up-short up"></i></span>
                              </div>
                            </div>
                            <div className="ig-kpi-card">
                              <div className="d-flex justify-content-between align-items-center">
                                <div className="ig-kpi-title">Reach</div>
                                <i className="bi bi-graph-up ig-kpi-icon"></i>
                              </div>
                              <div className="ig-kpi-mini"></div>
                              <div className="d-flex justify-content-between align-items-center">
                                <span className="fw-bold">{reachCount.toLocaleString?.() || reachCount}</span>
                                <span className="ig-kpi-trend"><i className="bi bi-arrow-up-short up"></i></span>
                              </div>
                            </div>
                            <div className="ig-kpi-card">
                              <div className="d-flex justify-content-between align-items-center">
                                <div className="ig-kpi-title">Impressions</div>
                                <i className="bi bi-eye ig-kpi-icon"></i>
                              </div>
                              <div className="ig-kpi-mini"></div>
                              <div className="d-flex justify-content-between align-items-center">
                                <span className="fw-bold">{impressionsCount.toLocaleString?.() || impressionsCount}</span>
                                <span className="ig-kpi-trend"><i className="bi bi-arrow-down-short down"></i></span>
                              </div>
                            </div>
                            <div className="ig-kpi-card">
                              <div className="d-flex justify-content-between align-items-center">
                                <div className="ig-kpi-title">Profile visits</div>
                                <i className="bi bi-clipboard-check ig-kpi-icon"></i>
                              </div>
                              <div className="ig-kpi-mini"></div>
                              <div className="d-flex justify-content-between align-items-center">
                                <span className="fw-bold">{profileVisits.toLocaleString?.() || profileVisits}</span>
                                <span className="ig-kpi-trend"><i className="bi bi-arrow-up-short up"></i></span>
                              </div>
                            </div>
                          </div>

                          {/* Charts section removed as requested */}
                        </div>
                      );
                    })()}

                    {/* Audience + Demographics section removed as requested */}

                    {/* Top Reels slider - Instagram only */}
                    {(() => {
                      const reels = detailedInstagramData?.reels || detailedInstagramData?.posts?.reels || [];
                      if (!reels || reels.length === 0) {
                        return (
                          <div className="reels-section">
                            <div className="d-flex justify-content-between align-items-center mb-3">
                              <h6 className="mb-0">Top Reels</h6>
                              <Button 
                                variant="primary" 
                                size="sm" 
                                onClick={handleSyncInstagram}
                                disabled={isUpdating}
                              >
                                {isUpdating ? (
                                  <>
                                    <Spinner animation="border" size="sm" className="me-2" />
                                    Refreshing...
                                  </>
                                ) : (
                                  <>
                                    <i className="bi bi-arrow-clockwise me-1"></i>
                                    Refresh Reels
                                  </>
                                )}
                              </Button>
                            </div>
                            <div className="alert alert-info">
                              No Instagram reels found. Connect Instagram or refresh to populate your top reels.
                            </div>
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
                            <Button 
                              variant="outline-primary" 
                              size="sm" 
                              onClick={handleSyncInstagram}
                              disabled={isUpdating}
                            >
                              {isUpdating ? (
                                <>
                                  <Spinner animation="border" size="sm" className="me-2" />
                                  Refreshing...
                                </>
                              ) : (
                                <>
                                  <i className="bi bi-arrow-clockwise me-1"></i>
                                  Refresh Reels
                                </>
                              )}
                            </Button>
                          </div>
                          <Carousel indicators controls interval={null}>
                            {chunks.map((chunk, idx) => (
                              <Carousel.Item key={idx}>
                                <Row>
                                  {[0,1,2].map(i => {
                                    const r = chunk[i] || placeholder;
                                    const thumb = r.displayUrl || r.thumbnailUrl || (Array.isArray(r.images) ? r.images[0] : '') || '';
                                    const title = r.title || r.caption || 'Untitled';
                                    const views = r.viewsCount || r.playCount || 0;
                                    const engagementRate = r.engagementRate || 0;
                                    const onClick = () => handleReelClick(r);
                                    return (
                                      <Col md={4} key={`reel-${idx}-${i}`} className="mb-3">
                                        <div 
                                          className="reel-card"
                                          onClick={onClick}
                                          style={{
                                            cursor: 'pointer',
                                            background: thumb ? `url(${thumb}) center/cover no-repeat` : undefined,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                          }}
                                        >
                                          {!thumb && (<i className="bi bi-play-fill fs-2"></i>)}
                                        </div>
                                        <div className="mt-2">
                                          <div className="reel-title">{title}</div>
                                          <div className="reel-metrics">Views {views.toLocaleString?.() || views} · Eng {engagementRate}%</div>
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
                  </>
                ) : (
                  <div className="text-center py-5">
                    <i className="bi bi-instagram display-4 text-muted mb-3"></i>
                    <h6 className="text-muted">Instagram Not Connected</h6>
                    <p className="text-muted mb-3">Connect your Instagram account to view insights</p>
                    <Button variant="outline-primary" onClick={() => handleConnectPlatform('instagram')} style={{ borderRadius: '20px' }}>
                      <i className="bi bi-instagram me-2"></i>
                      Connect Instagram
                    </Button>
                  </div>
                )}
              </Tab.Pane>

              {/* YouTube Tab */}
              <Tab.Pane eventKey="youtube">
                {youtubeConnected ? (
                  (() => {
                    const recentVideos = detailedYoutubeData?.recentVideos || [];

                    const chartDataAll = recentVideos
                      .map(v => ({
                        name: new Date(v.publishedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
                        views: Number(v.viewCount || 0),
                        likes: Number(v.likeCount || 0),
                        comments: Number(v.commentCount || 0),
                        videoId: v.videoId,
                      }))
                      .sort((a, b) => new Date(a.name) - new Date(b.name));

                    const chartData = selectedVideoId
                      ? chartDataAll.filter(d => d.videoId === selectedVideoId)
                      : chartDataAll;

                    // Removed unused constants to satisfy lint

                    const metricValue = (val, suffix = '') => {
                      if (val === null || val === undefined) return '—';
                      const n = Number(val);
                      return Number.isNaN(n) ? '—' : `${n.toLocaleString()}${suffix}`;
                    };

                    return (
                      <div className="buzzaz-youtube-dashboard">
                        {/* Header */}
                        <div className="yt-header buzzaz-gradient-soft mb-4">
                          <div className="d-flex align-items-center justify-content-between">
                            <div>
                              <h3 className="yt-title mb-1">YouTube Dashboard</h3>
                              <p className="yt-subtitle mb-0">Bright, creative insights for your growth</p>
                            </div>
                            <div className="d-flex gap-2">
                              <Button 
                                variant="outline-danger" 
                                size="sm" 
                                onClick={refreshYoutubeData}
                                disabled={youtubeDetailedLoading}
                                className="glass-button"
                              >
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

                        {youtubeError && (
                          <Alert variant="danger" className="mb-3">{youtubeError}</Alert>
                        )}
                        {youtubeDetailedError && (
                          <Alert variant="warning" className="mb-3">{youtubeDetailedError}</Alert>
                        )}

                        {/* Analytics Overview */}
                        <div className="yt-glass-panel mb-4">
                          <div className="d-flex align-items-center justify-content-between mb-3">
                            <h5 className="section-title mb-0"><i className="bi bi-bar-chart-fill me-2"></i>Analytics Overview</h5>
                            {(() => {
                              const looksMock = (detailedYoutubeData?.dataSource === 'mock');
                              return (
                                <span className={`badge ${looksMock ? 'bg-secondary' : 'bg-success'}`}>
                                  {looksMock ? 'Sample Data' : 'Live API'}
                                </span>
                              );
                            })()}
                          </div>
                          <div className="metric-grid">
                            {/* 1 */}
                            <div className="metric-card">
                              <div className="metric-icon icon-pink"><i className="bi bi-people"></i></div>
                              <div className="metric-content">
                                <div className="metric-label">Subscribers</div>
                                <div className="metric-value">{isLoadingYT ? <Spinner animation="border" size="sm" /> : metricValue(youtubeStats?.subscribers)}</div>
                              </div>
                            </div>
                            {/* 2 */}
                            <div className="metric-card">
                              <div className="metric-icon icon-lavender"><i className="bi bi-play-btn"></i></div>
                              <div className="metric-content">
                                <div className="metric-label">Videos</div>
                                <div className="metric-value">{isLoadingYT ? <Spinner animation="border" size="sm" /> : metricValue(youtubeStats?.videos)}</div>
                              </div>
                            </div>
                            {/* 3 */}
                            <div className="metric-card">
                              <div className="metric-icon icon-blue"><i className="bi bi-eye"></i></div>
                              <div className="metric-content">
                                <div className="metric-label">Total Views</div>
                                <div className="metric-value">{isLoadingYT ? <Spinner animation="border" size="sm" /> : metricValue(youtubeStats?.views)}</div>
                              </div>
                            </div>
                            {/* 4 */}
                            <div className="metric-card">
                              <div className="metric-icon icon-pink"><i className="bi bi-heart"></i></div>
                              <div className="metric-content">
                                <div className="metric-label">Likes</div>
                                <div className="metric-value">{youtubeDetailedLoading ? <Spinner animation="border" size="sm" /> : metricValue(detailedYoutubeData?.metrics?.likes)}</div>
                              </div>
                            </div>
                            {/* 5 */}
                            <div className="metric-card">
                              <div className="metric-icon icon-lavender"><i className="bi bi-chat"></i></div>
                              <div className="metric-content">
                                <div className="metric-label">Comments</div>
                                <div className="metric-value">{youtubeDetailedLoading ? <Spinner animation="border" size="sm" /> : metricValue(detailedYoutubeData?.metrics?.comments)}</div>
                              </div>
                            </div>
                            {/* 6 */}
                            <div className="metric-card">
                              <div className="metric-icon icon-blue"><i className="bi bi-clock"></i></div>
                              <div className="metric-content">
                                <div className="metric-label">Watch Time</div>
                                <div className="metric-value">{youtubeDetailedLoading ? <Spinner animation="border" size="sm" /> : metricValue(detailedYoutubeData?.metrics?.estimatedMinutesWatched, '')}</div>
                              </div>
                            </div>
                            {/* 7 */}
                            <div className="metric-card">
                              <div className="metric-icon icon-purple"><i className="bi bi-stopwatch"></i></div>
                              <div className="metric-content">
                                <div className="metric-label">Avg View Duration</div>
                                <div className="metric-value">{youtubeDetailedLoading ? <Spinner animation="border" size="sm" /> : metricValue(detailedYoutubeData?.metrics?.averageViewDuration)}</div>
                              </div>
                            </div>
                            {/* 8 */}
                            <div className="metric-card">
                              <div className="metric-icon icon-green"><i className="bi bi-person-plus"></i></div>
                              <div className="metric-content">
                                <div className="metric-label">Subscribers Gained</div>
                                <div className="metric-value text-success">{youtubeDetailedLoading ? <Spinner animation="border" size="sm" /> : metricValue(detailedYoutubeData?.metrics?.subscribersGained)}</div>
                              </div>
                            </div>
                            {/* 9 */}
                            <div className="metric-card">
                              <div className="metric-icon icon-red"><i className="bi bi-person-dash"></i></div>
                              <div className="metric-content">
                                <div className="metric-label">Subscribers Lost</div>
                                <div className="metric-value text-danger">{youtubeDetailedLoading ? <Spinner animation="border" size="sm" /> : metricValue(detailedYoutubeData?.metrics?.subscribersLost)}</div>
                              </div>
                            </div>
                          </div>
                          {detailedYoutubeData?.metadata?.lastUpdated && (
                            <div className="text-muted small px-3 pb-3">Last updated: {new Date(detailedYoutubeData.metadata.lastUpdated).toLocaleString()}</div>
                          )}
                        </div>

                        {/* Recent Videos */}
                        <div className="yt-glass-panel mb-4">
                            <div className="d-flex align-items-center justify-content-between mb-3">
                              <h5 className="section-title mb-0"><i className="bi bi-collection-play me-2"></i>Recent Videos</h5>
                              <div className="d-flex align-items-center gap-2">
                                {(() => {
                              const ci = detailedYoutubeData?.channelInfo || {};
                              const href = safeUrl(ci.channelUrl || ci.channel_url || (ci.channelId ? `https://www.youtube.com/channel/${ci.channelId}` : ''));
                              return href ? (
                                <a
                                  href={href}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="btn btn-outline-secondary btn-sm"
                                >
                                      Open Channel
                                    </a>
                                  ) : null;
                                })()}
                                <Button
                                  variant="outline-danger"
                                  size="sm"
                                  onClick={refreshYoutubeData}
                                  disabled={youtubeDetailedLoading}
                                >
                                  {youtubeDetailedLoading ? 'Refreshing…' : 'Refresh Data'}
                                </Button>
                                {(() => {
                                  const looksMock = (detailedYoutubeData?.dataSource === 'mock');
                                  return (
                                    <span className={`badge ${looksMock ? 'bg-secondary' : 'bg-success'}`}>
                                      {looksMock ? 'Sample Data' : 'Live API'}
                                    </span>
                                  );
                                })()}
                              </div>
                            </div>
                            {recentVideos.length > 0 ? (
                              // Slider: 3 videos per slide
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
                            ) : (
                              <div className="text-center text-muted py-4">
                                <i className="bi bi-collection-play fs-3 d-block mb-2"></i>
                                No recent videos found. Try Refresh Data.
                              </div>
                            )}
                          </div>

                        {/* Recent Video Performance */}
                        {recentVideos.length > 0 && (
                          <div className="yt-glass-panel mb-4">
                            <div className="d-flex align-items-center justify-content-between mb-3">
                              <h5 className="section-title mb-0"><i className="bi bi-graph-up-arrow me-2"></i>Recent Video Performance</h5>
                              {selectedVideoId && (
                                <Button variant="outline-secondary" size="sm" onClick={() => setSelectedVideoId(null)}>
                                  Show All
                                </Button>
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

                            {/* Titles only in 2 rows, 3 per row */}
                            <Row className="g-3 mt-3">
              {(recentVideos || []).slice(0, 30).map((video, idx) => (
                                <Col md={4} sm={6} xs={12} key={idx}>
                                  <div 
                                    className="video-meta-card"
                                    onClick={() => handleYtVideoClick(video)}
                                    role="button"
                                    style={{ cursor: 'pointer', borderColor: selectedVideoId === video.videoId ? '#dc3545' : undefined }}
                                  >
                                    <div className="meta-title text-truncate">{video.title}</div>
                                  </div>
                                </Col>
                              ))}
                            </Row>
                          </div>
                        )}

                        {/* Loading State */}
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
                  <Row className="mb-4">
                    <Col lg={12}>
                      <Card>
                        <Card.Body className="text-center py-5">
                          <i className="bi bi-youtube display-4 text-muted mb-3"></i>
                          <h6 className="text-muted">YouTube Not Connected</h6>
                          <p className="text-muted mb-3">Connect your YouTube channel to view real-time analytics</p>
                          <Button variant="danger" href="/connect-social">
                            <i className="bi bi-youtube me-2"></i>
                            Connect YouTube
                          </Button>
                        </Card.Body>
                      </Card>
                    </Col>
                  </Row>
                )}
              </Tab.Pane>

              {/* Chat Tab */}
              <Tab.Pane eventKey="chat">
                <ChatInterface currentUser={user} />
              </Tab.Pane>
            </Tab.Content>
              </Col>
              {activeTab === 'profile' && (
                <Col lg={3} className="d-none d-lg-block ps-lg-3">
                  <div className="profile-sidebar-glass p-3 h-100 d-flex flex-column">
                    {/* Top Profile Section */}
                    <div className="profile-sidebar-bg rounded-4 position-relative p-3">
                      {/* Removed megaphone and bell icon buttons per request */}
                      <div className="position-absolute top-0 end-0 p-2">
                        <Button className="edit-chip rounded-3" size="sm" onClick={handleEditStart}>Edit</Button>
                      </div>

                      <div className="d-flex flex-column align-items-center pt-5 pb-3">
                        <div className="profile-avatar-ring mb-3">
                          {profile?.profileImage ? (
                            <img
                              src={profile.profileImage}
                              alt="Profile"
                              className="profile-avatar-img"
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'flex';
                              }}
                            />
                          ) : null}
                          <div
                            className="profile-avatar-fallback"
                            style={{ display: profile?.profileImage ? 'none' : 'flex' }}
                          >
                            <i className="bi bi-person-fill"></i>
                          </div>
                        </div>
                        <div className="profile-name text-center">{profile?.fullName || profile?.name || ''}</div>
                        {(profile?.username || profile?.instagramUsername) && (
                          <div className="profile-handle text-center">@{profile?.username || profile?.instagramUsername}</div>
                        )}
                      </div>

                      {/* Creator Profile Information Card */}
                      <Card className="creator-info-card mt-2">
                        <Card.Header className="border-0">
                          <h6 className="mb-0">Influencer Profile Information</h6>
                        </Card.Header>
                        <Card.Body className="p-0">
                          {/* Bio */}
                          <div className="d-flex justify-content-between align-items-center py-2 border-top">
                            <div className="fw-semibold">Bio</div>
                            <div className="text-muted" style={{ flex: 1, textAlign: 'right' }}>
                              {editMode ? (
                                <Form.Control
                                  as="textarea"
                                  rows={2}
                                  value={editData.bio}
                                  onChange={(e) => handleEditFieldChange('bio', e.target.value)}
                                  size="sm"
                                />
                              ) : (
                                (profile.bio || '')
                              )}
                            </div>
                          </div>

                          {/* Niche */}
                          <div className="d-flex justify-content-between align-items-center py-2 border-top">
                            <div className="fw-semibold">Niche</div>
                            <div style={{ flex: 1, textAlign: 'right' }}>
                              {editMode ? (
                                <Form.Select
                                  multiple
                                  size="sm"
                                  value={editData.categories || []}
                                  onChange={(e) => {
                                    const selected = Array.from(e.target.selectedOptions).map(o => o.value);
                                    handleEditFieldChange('categories', selected);
                                  }}
                                >
                                  {categoryOptions.map((opt) => (
                                    <option key={opt} value={opt}>{opt}</option>
                                  ))}
                                </Form.Select>
                              ) : (
                                <span className="text-muted">{(profile.categories || [])?.join(', ')}</span>
                              )}
                            </div>
                          </div>

                          {/* Content Style */}
                          <div className="d-flex justify-content-between align-items-center py-2 border-top">
                            <div className="fw-semibold">Content Style</div>
                            <div style={{ flex: 1, textAlign: 'right' }}>
                              {editMode ? (
                                <Form.Select
                                  multiple
                                  size="sm"
                                  value={editData.contentTypes || []}
                                  onChange={(e) => {
                                    const selected = Array.from(e.target.selectedOptions).map(o => o.value);
                                    handleEditFieldChange('contentTypes', selected);
                                  }}
                                >
                                  {contentTypeOptions.map((opt) => (
                                    <option key={opt} value={opt}>{opt}</option>
                                  ))}
                                </Form.Select>
                              ) : (
                                <span className="text-muted">{(profile.contentTypes || [])?.join(', ')}</span>
                              )}
                            </div>
                          </div>

                          {/* Language(s) */}
                          <div className="d-flex justify-content-between align-items-center py-2 border-top">
                            <div className="fw-semibold">Language(s)</div>
                            <div style={{ flex: 1, textAlign: 'right' }}>
                              {editMode ? (
                                <Form.Select
                                  multiple
                                  size="sm"
                                  value={editData.languages || []}
                                  onChange={(e) => {
                                    const selected = Array.from(e.target.selectedOptions).map(o => o.value);
                                    handleEditFieldChange('languages', selected);
                                  }}
                                >
                                  {languageOptions.map((opt) => (
                                    <option key={opt} value={opt}>{opt}</option>
                                  ))}
                                </Form.Select>
                              ) : (
                                <span className="text-muted">{(profile?.languages?.join(', ') || profile?.language || '')}</span>
                              )}
                            </div>
                          </div>

                          {/* Location */}
                          <div className="d-flex justify-content-between align-items-center py-2 border-top">
                            <div className="fw-semibold">Location</div>
                            <div className="text-muted" style={{ flex: 1, textAlign: 'right' }}>
                              {editMode ? (
                                <Form.Control
                                  type="text"
                                  value={editData.location}
                                  onChange={(e) => handleEditFieldChange('location', e.target.value)}
                                  size="sm"
                                />
                              ) : (
                                (profile.location || '')
                              )}
                            </div>
                          </div>

                          {/* Price Range */}
                          <div className="d-flex justify-content-between align-items-center py-2 border-top">
                            <div className="fw-semibold">Price Range</div>
                            <div style={{ flex: 1, textAlign: 'right' }}>
                              {editMode ? (
                                <div className="d-flex gap-2 justify-content-end">
                                  <Form.Control
                                    type="number"
                                    placeholder="Min"
                                    value={editData.priceRangeMin ?? ''}
                                    onChange={(e) => handleEditFieldChange('priceRangeMin', e.target.value ? Number(e.target.value) : '')}
                                    size="sm"
                                    style={{ maxWidth: '120px' }}
                                  />
                                  <Form.Control
                                    type="number"
                                    placeholder="Max"
                                    value={editData.priceRangeMax ?? ''}
                                    onChange={(e) => handleEditFieldChange('priceRangeMax', e.target.value ? Number(e.target.value) : '')}
                                    size="sm"
                                    style={{ maxWidth: '120px' }}
                                  />
                                </div>
                              ) : (
                                <span className="text-muted">
                                  {typeof profile.priceRangeMin !== 'undefined' || typeof profile.priceRangeMax !== 'undefined'
                                    ? `${profile.priceRangeMin ?? ''}${profile.priceRangeMin || profile.priceRangeMax ? ' - ' : ''}${profile.priceRangeMax ?? ''}`
                                    : ''}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Reel post price */}
                          <div className="d-flex justify-content-between align-items-center py-2 border-top">
                            <div className="fw-semibold">Reel post</div>
                            <div style={{ flex: 1, textAlign: 'right' }}>
                              {editMode ? (
                                <Form.Control
                                  type="number"
                                  placeholder="Enter price"
                                  value={editData.reelPrice ?? ''}
                                  onChange={(e) => handleEditFieldChange('reelPrice', e.target.value ? Number(e.target.value) : '')}
                                  size="sm"
                                  style={{ maxWidth: '180px', marginLeft: 'auto' }}
                                />
                              ) : (
                                <span className="text-muted">{typeof profile.reelPrice !== 'undefined' ? profile.reelPrice : ''}</span>
                              )}
                            </div>
                          </div>

                          {/* Story price */}
                          <div className="d-flex justify-content-between align-items-center py-2 border-top">
                            <div className="fw-semibold">Story</div>
                            <div style={{ flex: 1, textAlign: 'right' }}>
                              {editMode ? (
                                <Form.Control
                                  type="number"
                                  placeholder="Enter price"
                                  value={editData.storyPrice ?? ''}
                                  onChange={(e) => handleEditFieldChange('storyPrice', e.target.value ? Number(e.target.value) : '')}
                                  size="sm"
                                  style={{ maxWidth: '180px', marginLeft: 'auto' }}
                                />
                              ) : (
                                <span className="text-muted">{typeof profile.storyPrice !== 'undefined' ? profile.storyPrice : ''}</span>
                              )}
                            </div>
                          </div>

                          {/* Event attendance price */}
                          <div className="d-flex justify-content-between align-items-center py-2 border-top">
                            <div className="fw-semibold">Event attendance</div>
                            <div style={{ flex: 1, textAlign: 'right' }}>
                              {editMode ? (
                                <Form.Control
                                  type="number"
                                  placeholder="Enter price"
                                  value={editData.eventPrice ?? ''}
                                  onChange={(e) => handleEditFieldChange('eventPrice', e.target.value ? Number(e.target.value) : '')}
                                  size="sm"
                                  style={{ maxWidth: '180px', marginLeft: 'auto' }}
                                />
                              ) : (
                                <span className="text-muted">{typeof profile.eventPrice !== 'undefined' ? profile.eventPrice : ''}</span>
                              )}
                            </div>
                          </div>

                          {/* Multiple Platforms price */}
                          <div className="d-flex justify-content-between align-items-center py-2 border-top">
                            <div className="fw-semibold">Multiple Platforms</div>
                            <div style={{ flex: 1, textAlign: 'right' }}>
                              {editMode ? (
                                <Form.Control
                                  type="number"
                                  placeholder="Enter price"
                                  value={editData.multiplePlatformsPrice ?? ''}
                                  onChange={(e) => handleEditFieldChange('multiplePlatformsPrice', e.target.value ? Number(e.target.value) : '')}
                                  size="sm"
                                  style={{ maxWidth: '180px', marginLeft: 'auto' }}
                                />
                              ) : (
                                <span className="text-muted">{typeof profile.multiplePlatformsPrice !== 'undefined' ? profile.multiplePlatformsPrice : ''}</span>
                              )}
                            </div>
                          </div>

                          {/* Average Delivery Time */}
                          <div className="d-flex justify-content-between align-items-center py-2 border-top">
                            <div className="fw-semibold">Average Delivery Time</div>
                            <div style={{ flex: 1, textAlign: 'right' }}>
                              {editMode ? (
                                <Form.Control
                                  type="text"
                                  placeholder="e.g. 5-7 days after brief confirmation"
                                  value={editData.averageDeliveryTime ?? ''}
                                  onChange={(e) => handleEditFieldChange('averageDeliveryTime', e.target.value)}
                                  size="sm"
                                />
                              ) : (
                                <span className="text-muted">{profile.averageDeliveryTime || ''}</span>
                              )}
                            </div>
                          </div>

                          {/* Product-based delivery */}
                          <div className="d-flex justify-content-between align-items-center py-2 border-top">
                            <div className="fw-semibold">Product-based</div>
                            <div style={{ flex: 1, textAlign: 'right' }}>
                              {editMode ? (
                                <Form.Control
                                  type="text"
                                  placeholder="5-7 days after the product is received"
                                  value={editData.deliveryProductBased ?? ''}
                                  onChange={(e) => handleEditFieldChange('deliveryProductBased', e.target.value)}
                                  size="sm"
                                />
                              ) : (
                                <span className="text-muted">{profile.deliveryProductBased || ''}</span>
                              )}
                            </div>
                          </div>

                          {/* No product delivery */}
                          <div className="d-flex justify-content-between align-items-center py-2 border-top">
                            <div className="fw-semibold">No product</div>
                            <div style={{ flex: 1, textAlign: 'right' }}>
                              {editMode ? (
                                <Form.Control
                                  type="text"
                                  placeholder="5-7 days after brief confirmation"
                                  value={editData.deliveryNoProduct ?? ''}
                                  onChange={(e) => handleEditFieldChange('deliveryNoProduct', e.target.value)}
                                  size="sm"
                                />
                              ) : (
                                <span className="text-muted">{profile.deliveryNoProduct || ''}</span>
                              )}
                            </div>
                          </div>

                          {/* Outdoor Shoot & Event Attendance delivery */}
                          <div className="d-flex justify-content-between align-items-center py-2 border-top">
                            <div className="fw-semibold" style={{ width: "110px" }}>Outdoor Shoot & Event Attendance</div>
                            <div style={{ flex: 1, textAlign: 'right' }}>
                              {editMode ? (
                                <Form.Control
                                  type="text"
                                  placeholder="5-7 days for editing after the shoot is done"
                                  value={editData.deliveryOutdoorShoot ?? ''}
                                  onChange={(e) => handleEditFieldChange('deliveryOutdoorShoot', e.target.value)}
                                  size="sm"
                                  style={{ maxWidth: '420px', marginLeft: 'auto' }}
                                />
                              ) : (
                                <span className="text-muted">{profile.deliveryOutdoorShoot || ''}</span>
                              )}
                            </div>
                          </div>

                          {/* 3 Revisions */}
                          <div className="d-flex justify-content-between align-items-center py-2 border-top">
                            <div className="fw-semibold">3 Revisions</div>
                            <div style={{ flex: 1, textAlign: 'right' }}>
                              {editMode ? (
                                <Form.Control
                                  type="text"
                                  placeholder="3-4 days"
                                  value={editData.deliveryRevisions ?? ''}
                                  onChange={(e) => handleEditFieldChange('deliveryRevisions', e.target.value)}
                                  size="sm"
                                />
                              ) : (
                                <span className="text-muted">{profile.deliveryRevisions || ''}</span>
                              )}
                            </div>
                          </div>

                          {editMode && (
                            <div className="d-flex justify-content-end gap-2 p-2 border-top">
                              <Button variant="secondary" size="sm" onClick={handleCancelEdit} disabled={isUpdating}>
                                Cancel
                              </Button>
                              <Button variant="primary" size="sm" onClick={handleUpdateProfile} disabled={isUpdating}>
                                {isUpdating ? 'Saving…' : 'Save'}
                              </Button>
                            </div>
                          )}
                        </Card.Body>
                      </Card>
                    </div>
                  </div>
                </Col>
                )}
            </Row>
          </Tab.Container>
        </Col>
      </Row>

      {/* Connection Modal */}
      <Modal 
        show={showConnectModal}
        onHide={() => setShowConnectModal(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>
            Connect {selectedPlatform?.charAt(0).toUpperCase() + selectedPlatform?.slice(1)}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="text-center mb-4">
            <div 
              className="rounded-circle d-inline-flex align-items-center justify-content-center mb-3"
              style={{
                width: '80px',
                height: '80px',
                backgroundColor: selectedPlatform === 'instagram' ? '#e3f2fd' : '#e0f7fa'
              }}
            >
              <i 
                className={`bi bi-${selectedPlatform} fs-1`}
                style={{
                  color: selectedPlatform === 'instagram' ? '#2196f3' : '#17a2b8'
                }}
              ></i>
            </div>
            <h5 className="mb-2">Connect Your {selectedPlatform?.charAt(0).toUpperCase() + selectedPlatform?.slice(1)} Account</h5>
            <p className="text-muted">
              Sync your {selectedPlatform} data to get insights and track your performance
            </p>
          </div>
          
          {selectedPlatform === 'instagram' && (
            <Form>
              <Form.Group className="mb-3">
                <Form.Label>Instagram Username</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Enter your Instagram username (without @)"
                  value={connectUsername}
                  onChange={(e) => setConnectUsername(e.target.value)}
                />
              </Form.Group>
            </Form>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button 
            variant="primary" 
            onClick={handleConnectInstagram}
            disabled={connectLoading}
          >
            {connectLoading ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Connecting...
              </>
            ) : (
              <>
                <i className={`bi bi-${selectedPlatform} me-2`}></i>
                Connect {selectedPlatform?.charAt(0).toUpperCase() + selectedPlatform?.slice(1)}
              </>
            )}
          </Button>
          <Button 
            variant="secondary" 
            onClick={() => setShowConnectModal(false)}
          >
            Cancel
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Video Modal for YouTube */}
      <Modal 
        show={showYtModal} 
        onHide={handleCloseYtModal} 
        size="lg" 
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="bi bi-youtube me-2"></i>
            {selectedYtVideo?.title || 'YouTube Video'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-0">
          {selectedYtVideo && (
            <div className="ratio ratio-16x9">
              <iframe
                src={`${selectedYtVideo.embedUrl || `https://www.youtube.com/embed/${selectedYtVideo.videoId}`}?autoplay=1`}
                title={selectedYtVideo.title || 'YouTube video'}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
              ></iframe>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          {selectedYtVideo && (
            <Button 
              variant="outline-secondary" 
              size="sm" 
              as="a"
              href={`https://www.youtube.com/watch?v=${selectedYtVideo.videoId}`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="me-2"
            >
              <i className="bi bi-box-arrow-up-right me-1"></i>
              Open in YouTube
            </Button>
          )}
          <Button variant="secondary" onClick={handleCloseYtModal}>Close</Button>
        </Modal.Footer>
      </Modal>

      {/* Video Modal for Instagram Reels */}
      <Modal 
        show={showReelModal} 
        onHide={handleCloseReelModal} 
        size="lg" 
        centered
        className="video-modal"
      >
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="bi bi-play-circle me-2"></i>
            Instagram Reel
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-0">
          {selectedReel && (
            <div className="video-container" style={{ position: 'relative', backgroundColor: '#000' }}>
              {selectedReel.videoUrl ? (
                <video 
                  controls 
                  autoPlay 
                  muted 
                  loop
                  style={{ 
                    width: '100%', 
                    height: 'auto',
                    maxHeight: '70vh',
                    objectFit: 'contain'
                  }}
                  poster={selectedReel.thumbnailUrl || selectedReel.displayUrl}
                >
                  <source src={selectedReel.videoUrl} type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              ) : (
                // Fallback to image preview when direct video url is unavailable
                (selectedReel.displayUrl || selectedReel.thumbnailUrl) ? (
                  <div className="ratio ratio-16x9">
                    <img 
                      src={selectedReel.displayUrl || selectedReel.thumbnailUrl}
                      alt={selectedReel.caption || 'Instagram reel preview'}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </div>
                ) : (
                  <div className="d-flex align-items-center justify-content-center" style={{ height: '400px', backgroundColor: '#f8f9fa' }}>
                    <div className="text-center">
                      <i className="bi bi-exclamation-triangle display-4 text-muted mb-3"></i>
                      <h6 className="text-muted">Video not available</h6>
                      <p className="small text-muted">The video URL is not accessible</p>
                    </div>
                  </div>
                )
              )}
              
              {/* Video overlay with stats */}
              <div className="position-absolute top-0 start-0 w-100 p-3" style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0.7) 0%, transparent 100%)' }}>
                <div className="d-flex justify-content-between align-items-start text-white">
                  <div>
                    <small className="opacity-75">
                      {selectedReel.timestamp ? new Date(selectedReel.timestamp).toLocaleDateString() : 'Unknown date'}
                    </small>
                  </div>
                  <div className="text-end">
                    {selectedReel.videoDuration && (
                      <div className="badge bg-dark bg-opacity-75 mb-1">
                        <i className="bi bi-clock me-1"></i>
                        {selectedReel.videoDuration}s
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <div className="d-flex justify-content-between align-items-center w-100">
            <div className="d-flex gap-3">
              {selectedReel?.likesCount && (
                <small className="text-muted">
                  <i className="bi bi-heart me-1"></i>
                  {selectedReel.likesCount.toLocaleString()} likes
                </small>
              )}
              {selectedReel?.commentsCount && (
                <small className="text-muted">
                  <i className="bi bi-chat me-1"></i>
                  {selectedReel.commentsCount.toLocaleString()} comments
                </small>
              )}
              {selectedReel?.viewsCount && (
                <small className="text-muted">
                  <i className="bi bi-eye me-1"></i>
                  {selectedReel.viewsCount.toLocaleString()} views
                </small>
              )}
            </div>
            <div>
              {(() => {
                const reelLink = selectedReel?.reelUrl || selectedReel?.url || (selectedReel?.shortCode ? `https://www.instagram.com/p/${selectedReel.shortCode}/` : null);
                return reelLink ? (
                  <a 
                    href={reelLink} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="btn btn-outline-primary btn-sm me-2"
                  >
                    <i className="bi bi-instagram me-1"></i>
                    View on Instagram
                  </a>
                ) : null;
              })()}
              <Button variant="secondary" onClick={handleCloseReelModal}>
                Close
              </Button>
            </div>
          </div>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default InfluencerDashboard;
