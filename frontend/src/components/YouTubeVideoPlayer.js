import React, { useState } from 'react';
import { Card, Row, Col, Button, Badge, Modal } from 'react-bootstrap';

const YouTubeVideoPlayer = ({ videos = [] }) => {
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const handleVideoClick = (video) => {
    console.log('Video clicked:', video);
    console.log('Video URL:', video.videoUrl);
    console.log('Embed URL:', video.embedUrl);
    setSelectedVideo(video);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedVideo(null);
  };

  const getEmbedUrl = (video) => {
    // Use embedUrl if available, otherwise fall back to extracting from videoUrl
    if (video && video.embedUrl) {
      console.log('Using embedUrl:', video.embedUrl);
      return video.embedUrl;
    }
    
    // Fallback to original logic for backward compatibility
    const videoUrl = video?.videoUrl || video;
    console.log('Extracting embed URL from videoUrl:', videoUrl);
    
    if (!videoUrl || typeof videoUrl !== 'string') {
      console.error('Invalid video URL:', videoUrl);
      return '';
    }

    // Extract video ID from various YouTube URL formats
    let videoId = '';
    
    // Standard YouTube URL: https://www.youtube.com/watch?v=VIDEO_ID
    if (videoUrl.includes('youtube.com/watch?v=')) {
      videoId = videoUrl.split('v=')[1]?.split('&')[0];
    }
    // Short YouTube URL: https://youtu.be/VIDEO_ID
    else if (videoUrl.includes('youtu.be/')) {
      videoId = videoUrl.split('youtu.be/')[1]?.split('?')[0];
    }
    // If it's already an embed URL or just a video ID
    else if (videoUrl.includes('youtube.com/embed/')) {
      return videoUrl;
    }
    // Assume it's just a video ID
    else {
      videoId = videoUrl;
    }

    const embedUrl = `https://www.youtube.com/embed/${videoId}`;
    console.log('Generated embed URL:', embedUrl);
    return embedUrl;
  };

  const getThumbnailUrl = (videoUrl) => {
    if (!videoUrl) return '';
    
    // Extract video ID from YouTube URL
    const videoId = videoUrl.split('v=')[1] || videoUrl.split('/').pop();
    return `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
  };

  const formatDuration = (duration) => {
    if (!duration) return '';
    
    // Parse ISO 8601 duration (PT15M30S)
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return duration;
    
    const hours = parseInt(match[1]) || 0;
    const minutes = parseInt(match[2]) || 0;
    const seconds = parseInt(match[3]) || 0;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (!videos || videos.length === 0) {
    return (
      <Card>
        <Card.Body className="text-center py-5">
          <i className="bi bi-camera-video text-muted display-4 mb-3"></i>
          <h6 className="text-muted">No Recent Videos</h6>
          <p className="text-muted">No recent videos found for this channel.</p>
        </Card.Body>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <Card.Header className="d-flex justify-content-between align-items-center">
          <h6 className="mb-0">Recent Videos</h6>
          <Badge bg="danger">{videos.length} videos</Badge>
        </Card.Header>
        <Card.Body>
          <Row>
            {videos.slice(0, 10).map((video, index) => (
              <Col lg={6} xl={4} key={video.videoId || index} className="mb-4">
                <Card className="h-100 shadow-sm video-card">
                  <div 
                    className="position-relative"
                    onClick={() => handleVideoClick(video)}
                    style={{ cursor: 'pointer' }}
                  >
                    {/* YouTube Logo */}
                    <img 
                      src="/images/youtube-logo.svg"
                      alt="YouTube Video"
                      className="card-img-top"
                      style={{ 
                        height: '180px', 
                        objectFit: 'contain',
                        borderRadius: '0.375rem 0.375rem 0 0',
                        backgroundColor: '#f8f9fa',
                        padding: '20px'
                      }}
                    />
                    

                    
                    {/* Duration badge */}
                    {video.duration && (
                      <Badge 
                        bg="dark" 
                        className="position-absolute"
                        style={{ bottom: '8px', right: '8px' }}
                      >
                        {formatDuration(video.duration)}
                      </Badge>
                    )}
                  </div>
                  
                  <Card.Body className="p-3">
                    <h6 
                      className="card-title mb-2 text-truncate" 
                      title={video.title}
                      style={{ fontSize: '0.9rem', lineHeight: '1.3' }}
                    >
                      {video.title}
                    </h6>
                    
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <small className="text-muted">
                        <i className="bi bi-eye me-1"></i>
                        {(video.viewCount || 0).toLocaleString()}
                      </small>
                      <small className="text-muted">
                        <i className="bi bi-heart me-1"></i>
                        {(video.likeCount || 0).toLocaleString()}
                      </small>
                    </div>
                    
                    <div className="d-flex justify-content-between align-items-center">
                      <small className="text-muted">
                        {formatDate(video.publishedAt)}
                      </small>
                      <small className="text-muted">
                        <i className="bi bi-chat me-1"></i>
                        {(video.commentCount || 0).toLocaleString()}
                      </small>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
          
          {/* Modal Video Player */}
          <Modal show={showModal} onHide={handleCloseModal} size="lg" centered>
            <Modal.Header closeButton>
              <Modal.Title className="text-truncate">
                {selectedVideo?.title}
              </Modal.Title>
            </Modal.Header>
            <Modal.Body className="p-0">
              {selectedVideo && (
                 <div className="ratio ratio-16x9">
                   <iframe
                     src={getEmbedUrl(selectedVideo)}
                     title={selectedVideo.title}
                     allowFullScreen
                     allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                     style={{ border: 'none' }}
                   ></iframe>
                 </div>
               )}
            </Modal.Body>
            <Modal.Footer className="d-flex justify-content-between align-items-center">
              <div className="d-flex gap-3 flex-wrap">
                <small className="text-muted">
                  <i className="bi bi-eye me-1"></i>
                  {(selectedVideo?.viewCount || 0).toLocaleString()} views
                </small>
                <small className="text-muted">
                  <i className="bi bi-heart me-1"></i>
                  {(selectedVideo?.likeCount || 0).toLocaleString()} likes
                </small>
                <small className="text-muted">
                  <i className="bi bi-chat me-1"></i>
                  {(selectedVideo?.commentCount || 0).toLocaleString()} comments
                </small>
                <small className="text-muted">
                  {selectedVideo && formatDate(selectedVideo.publishedAt)}
                </small>
              </div>
              <div>
                {selectedVideo?.videoUrl && (
                  <Button 
                    variant="outline-danger" 
                    size="sm"
                    href={selectedVideo.videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <i className="bi bi-youtube me-1"></i>
                    Watch on YouTube
                  </Button>
                )}
              </div>
            </Modal.Footer>
          </Modal>
        </Card.Body>
      </Card>

      <style jsx>{`
        .video-card:hover {
          transform: translateY(-2px);
          transition: transform 0.2s ease-in-out;
          box-shadow: 0 4px 8px rgba(0,0,0,0.1) !important;
        }
      `}</style>
    </>
  );
};

export default YouTubeVideoPlayer;