import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { influencerAPI } from '../services/api';
import { ugcCreatorAPI } from '../api/ugcAPI';


const ConnectSocial = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [instagramUsername, setInstagramUsername] = useState('');
  const [youtubeInput, setYoutubeInput] = useState('');
  const [tiktokUsername, setTiktokUsername] = useState('');
  const [isLoadingIG, setIsLoadingIG] = useState(false);
  const [isLoadingYT, setIsLoadingYT] = useState(false);
  const [isLoadingTT, setIsLoadingTT] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!user) return;
    // Pre-fill from existing profile if available
    // For UGC creators, we might have username already saved in their profile
  }, [user]);

  const handleConnectInstagram = async () => {
    setError('');
    setSuccess('');
    if (!instagramUsername.trim()) {
      setError('Please enter an Instagram username');
      return;
    }

    try {
      if (user?.role === 'influencer') {
        setIsLoadingIG(true);
        try {
          const validation = await influencerAPI.validateApify(instagramUsername.trim());
          if (validation?.data?.success) {
            // Support both structures: { success, data: { profile } } and { success, profileData }
            const payload = validation?.data?.data || validation?.data;
            const profile = payload?.profile || payload?.profileData || {};
            const updateData = {
              instagramUsername: instagramUsername.trim(),
              followers: profile?.followers || profile?.followersCount || 0,
              following: profile?.following || profile?.followingCount || 0,
              postsCount: profile?.postsCount || profile?.mediaCount || 0,
              engagementRate: profile?.engagementRate || 0
            };
            await influencerAPI.updateProfile(user.uid, updateData);
            setSuccess('Instagram account connected successfully');
          } else {
            throw new Error(validation?.data?.message || 'Instagram validation failed');
          }
        } catch (apiErr) {
          console.error('Instagram validation failed, saving username fallback:', apiErr);
          await influencerAPI.updateProfile(user.uid, { instagramUsername: instagramUsername.trim() });
          setSuccess('Instagram username saved. Analytics will be fetched when available.');
        }
      } else if (user?.role === 'ugc_creator') {
        setIsLoadingIG(true);
        await ugcCreatorAPI.updateProfile(user.uid, { instagramUsername: instagramUsername.trim() });
        setSuccess('Instagram username saved to your profile');
      } else {
        setError('Only influencers or UGC creators can connect social accounts');
      }
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to connect Instagram');
    } finally {
      setIsLoadingIG(false);
    }
  };

  // Removed unused helper to satisfy no-unused-vars

  const handleConnectYouTube = async () => {
    setError('');
    setSuccess('');
    if (!youtubeInput.trim()) {
      setError('Please enter a YouTube channel URL, handle, or name');
      return;
    }

    try {
      setIsLoadingYT(true);
      const channelQuery = youtubeInput.trim();

      console.log('=== YOUTUBE CONNECTION DEBUG ===');
      console.log('User role:', user?.role);
      console.log('User UID:', user?.uid);
      console.log('Channel query:', channelQuery);

      if (user?.role === 'influencer') {
        console.log('Calling influencerAPI.connectYouTubeChannel...');
        const response = await influencerAPI.connectYouTubeChannel(user.uid, channelQuery);
        const data = response?.data || response;
        console.log('Backend connect response:', data);
        if (data?.success) {
          setSuccess('YouTube channel linked to your influencer profile');
        } else {
          const msg = data?.message || 'Failed to connect YouTube channel. Please check input and try again.';
          setError(msg);
          return;
        }
      } else if (user?.role === 'ugc_creator') {
        // For UGC creators, save the provided URL or handle without external API calls
        const payload = {};
        const trimmed = channelQuery;
        const idMatch = trimmed.match(/channel\/([A-Za-z0-9_-]+)/i);
        if (idMatch) {
          payload.youtubeChannelId = idMatch[1];
          payload.youtubeChannelUrl = `https://www.youtube.com/channel/${idMatch[1]}`;
        } else {
          if (/^https?:\/\//i.test(trimmed)) {
            payload.youtubeChannelUrl = trimmed;
          } else {
            payload.youtubeChannelUrl = `https://www.youtube.com/@${trimmed.replace(/^@/, '')}`;
          }
        }
        console.log('Calling ugcCreatorAPI.updateProfile with payload:', payload);
        const response = await ugcCreatorAPI.updateProfile(user.uid, payload);
        console.log('UGC update response:', response?.data || response);
        setSuccess('YouTube channel saved to your UGC creator profile');
      } else {
        setError('Only influencers or UGC creators can connect social accounts');
      }
      console.log('=== END YOUTUBE CONNECTION DEBUG ===');
      setYoutubeInput('');
    } catch (err) {
      console.error('YouTube connect error:', err);
      const msg = err?.response?.data?.message || err?.message || 'Failed to connect YouTube';
      setError(msg);
    } finally {
      setIsLoadingYT(false);
    }
  };

  const handleConnectTikTok = async () => {
    setError('');
    setSuccess('');
    if (!tiktokUsername.trim()) {
      setError('Please enter a TikTok username');
      return;
    }

    try {
      setIsLoadingTT(true);
      
      console.log('=== TIKTOK CONNECTION DEBUG ===');
      console.log('TikTok username:', tiktokUsername.trim());
      console.log('User role:', user?.role);
      console.log('User UID:', user?.uid);

      if (user?.role === 'influencer') {
        console.log('Validating TikTok username first...');
        try {
          // First validate the TikTok username
          const validationResponse = await influencerAPI.validateTikTok(tiktokUsername.trim());
          console.log('TikTok validation response:', validationResponse?.data);
          
          if (validationResponse?.data?.success) {
            // If validation is successful, update the profile
            const payload = {
              tiktokUsername: tiktokUsername.trim()
            };
            
            console.log('Updating profile with payload:', payload);
            const updateResponse = await influencerAPI.updateProfile(user.uid, payload);
            console.log('Profile update response:', updateResponse?.data);
            setSuccess('TikTok username validated and linked to your influencer profile');
          } else {
            setError('TikTok username validation failed. Please check the username and try again.');
          }
        } catch (apiError) {
          console.error('TikTok API Error:', apiError);
          console.error('API Error Response:', apiError?.response);
          throw apiError;
        }
      } else if (user?.role === 'ugc_creator') {
        console.log('Calling ugcCreatorAPI.updateProfile...');
        try {
          const payload = {
            tiktokUsername: tiktokUsername.trim()
          };
          const response = await ugcCreatorAPI.updateProfile(user.uid, payload);
          console.log('API Response Status:', response?.status);
          console.log('API Response Data:', response?.data);
          setSuccess('TikTok username linked to your UGC creator profile');
        } catch (apiError) {
          console.error('API Error:', apiError);
          console.error('API Error Response:', apiError?.response);
          throw apiError;
        }
      } else {
        setError('Only influencers or UGC creators can connect social accounts');
      }
      console.log('=== END TIKTOK CONNECTION DEBUG ===');
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to connect TikTok';
      setError(msg);
    } finally {
      setIsLoadingTT(false);
    }
  };

  if (!user) {
    return (
      <Container className="py-5">
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '50vh' }}>
          <Spinner animation="border" role="status" variant="primary">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
        </div>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <Row>
        <Col>
          <Button variant="outline-secondary" className="mb-3" onClick={() => navigate(-1)}>
            <i className="bi bi-arrow-left me-2"></i>
            Back
          </Button>

          <h3 className="mb-3">Connect Social Accounts</h3>
          <p className="text-muted">Available for influencers and UGC creators.</p>

          {error && (
            <Alert variant="danger" className="mb-3" dismissible onClose={() => setError('')}>
              <i className="bi bi-exclamation-triangle me-2"></i>
              {error}
            </Alert>
          )}
          {success && (
            <Alert variant="success" className="mb-3" dismissible onClose={() => setSuccess('')}>
              <i className="bi bi-check-circle me-2"></i>
              {success}
            </Alert>
          )}

          <Row>
            <Col md={6} className="mb-4">
              <Card>
                <Card.Header>
                  <h6 className="mb-0">Instagram</h6>
                </Card.Header>
                <Card.Body>
                  <Form.Group className="mb-3">
                    <Form.Label>Instagram Username</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="e.g. johndoe"
                      value={instagramUsername}
                      onChange={(e) => setInstagramUsername(e.target.value)}
                    />
                  </Form.Group>
                  <div className="d-flex gap-2">
                    <Button variant="primary" onClick={handleConnectInstagram} disabled={isLoadingIG}>
                      {isLoadingIG ? (
                        <>
                          <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />
                          Connecting...
                        </>
                      ) : (
                        <>
                          <i className="bi bi-instagram me-2"></i>
                          Connect Instagram
                        </>
                      )}
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            </Col>

            <Col md={6} className="mb-4">
              <Card>
                <Card.Header>
                  <h6 className="mb-0">YouTube</h6>
                </Card.Header>
                <Card.Body>
                  <Form.Group className="mb-3">
                    <Form.Label>Channel URL, handle (@name), or name</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="e.g. https://www.youtube.com/@creatorname"
                      value={youtubeInput}
                      onChange={(e) => setYoutubeInput(e.target.value)}
                    />
                  </Form.Group>
                  <div className="d-flex gap-2">
                    <Button variant="danger" onClick={handleConnectYouTube} disabled={isLoadingYT}>
                      {isLoadingYT ? (
                        <>
                          <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />
                          Connecting...
                        </>
                      ) : (
                        <>
                          <i className="bi bi-youtube me-2"></i>
                          Connect YouTube
                        </>
                      )}
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            </Col>

            <Col md={6} className="mb-4">
              <Card>
                <Card.Header>
                  <h6 className="mb-0">TikTok</h6>
                </Card.Header>
                <Card.Body>
                  <Form.Group className="mb-3">
                    <Form.Label>TikTok Username</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="e.g. @username or username"
                      value={tiktokUsername}
                      onChange={(e) => setTiktokUsername(e.target.value)}
                    />
                  </Form.Group>
                  <div className="d-flex gap-2">
                    <Button 
                      style={{
                        backgroundColor: '#ff0050',
                        borderColor: '#ff0050',
                        color: 'white'
                      }}
                      onClick={handleConnectTikTok} 
                      disabled={isLoadingTT}
                    >
                      {isLoadingTT ? (
                        <>
                          <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />
                          Connecting...
                        </>
                      ) : (
                        <>
                          <i className="bi bi-tiktok me-2"></i>
                          Connect TikTok
                        </>
                      )}
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Col>
      </Row>
    </Container>
  );
};

export default ConnectSocial;
