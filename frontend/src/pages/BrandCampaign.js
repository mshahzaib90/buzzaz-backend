import React from 'react';
import { Container, Row, Col, Button, InputGroup, Form, Spinner, Table, Modal } from 'react-bootstrap';
import api from '../services/api';
import CreateCampaignWizard from '../components/brand/CreateCampaignWizard';

const BrandCampaign = () => {
  const [campaigns, setCampaigns] = React.useState([]);
  const [isCampaignsLoading, setIsCampaignsLoading] = React.useState(false);
  const [campaignSearch, setCampaignSearch] = React.useState('');
  const [showCampaignSearch, setShowCampaignSearch] = React.useState(false);
  const [campaignSearchDraft, setCampaignSearchDraft] = React.useState('');
  const [calendarDate, setCalendarDate] = React.useState(new Date());
  const [selectedDay, setSelectedDay] = React.useState(null);
  const [showCreateModal, setShowCreateModal] = React.useState(false);
  const [isReorderMode, setIsReorderMode] = React.useState(false);
  const [viewCampaign, setViewCampaign] = React.useState(null);

  const [draggedIndex, setDraggedIndex] = React.useState(null);

  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
    e.currentTarget.style.opacity = '0.4';
  };

  const handleDragEnd = (e) => {
    e.currentTarget.style.opacity = '1';
    setDraggedIndex(null);
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e, dropIndex) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) return;

    const newCampaigns = [...campaigns];
    const itemToMove = newCampaigns[draggedIndex];
    
    newCampaigns.splice(draggedIndex, 1);
    newCampaigns.splice(dropIndex, 0, itemToMove);
    
    setCampaigns(newCampaigns);
  };

  const fetchCampaigns = React.useCallback(async () => {
    try {
      setIsCampaignsLoading(true);
      const res = await api.get('/user/campaigns');
      setCampaigns(res.data?.campaigns || []);
    } catch (err) {
      console.error('Failed to load campaigns', err);
    } finally {
      setIsCampaignsLoading(false);
    }
  }, []);



  const handleWizardSubmit = async (formData) => {
    try {
      const participants = Array.isArray(formData.selectedCreators) ? formData.selectedCreators : [];
      const serviceKeyLabels = {
        reelPostPrice: 'Reel',
        storyPrice: 'Story',
        eventAttendancePrice: 'Event Attendance',
        multiplePlatformsPrice: 'Multiple Platforms'
      };
      const allServiceKeys = new Set(
        Object.values(formData.creatorServices || {}).flat().filter(Boolean)
      );
      const deliverables = [...allServiceKeys]
        .map((k) => serviceKeyLabels[k] || k)
        .join(', ');

      const estimatedBudgetFromForm = (() => {
        const raw = String(formData.budget || '').trim();
        const num = Number(raw.replace(/[^0-9.]/g, ''));
        return Number.isFinite(num) && num > 0 ? num : undefined;
      })();

      const payload = {
        name: String(formData.name || '').trim(),
        description: String(formData.description || ''),
        startDate: formData.startDate,
        endDate: formData.endDate,
        participants,
        estimatedBudget: estimatedBudgetFromForm,
        deliverables,
        metadata: {
          workflow: formData.workflow,
          socials: formData.socials,
          audience: {
            location: formData.location,
            gender: formData.gender,
            ageMin: formData.ageMin,
            ageMax: formData.ageMax,
            interests: formData.interests,
            goal: formData.goal,
            notes: formData.audienceNotes
          },
          budget: {
            amount: formData.budget,
            currency: formData.currency,
            type: formData.budgetType,
            maxSpendPerCreator: formData.maxSpendPerCreator
          },
          platformDistribution: formData.platformDistribution,
          notes: formData.notes,
          creatorServices: formData.creatorServices
        }
      };

      const res = await api.post('/user/campaigns', payload);
      if (res.data?.success) {
        setShowCreateModal(false);
        fetchCampaigns();
      } else {
        console.error(res.data?.message || 'Failed to create campaign');
      }
    } catch (error) {
      console.error(error.response?.data?.message || error.message || 'Failed to create campaign');
    }
  };

  React.useEffect(() => { fetchCampaigns(); }, [fetchCampaigns]);

  // Force page background to white
  React.useEffect(() => {
    const app = document.querySelector('.App');
    if (app) {
      const originalBg = app.style.backgroundColor;
      app.style.backgroundColor = '#fff';
      return () => {
        app.style.backgroundColor = originalBg;
      };
    }
  }, []);

  const filteredCampaignsForTable = React.useMemo(() => {
    const term = (campaignSearch || '').toLowerCase();
    const list = Array.isArray(campaigns) ? campaigns : [];
    const arr = term
      ? list.filter((c) => String(c.name || '').toLowerCase().includes(term))
      : list;
    return arr;
  }, [campaigns, campaignSearch]);

  const [currentPage, setCurrentPage] = React.useState(1);
  const ITEMS_PER_PAGE = 10;

  // Reset page when search changes
  React.useEffect(() => {
      setCurrentPage(1);
  }, [campaignSearch]);

  const totalPages = Math.ceil(filteredCampaignsForTable.length / ITEMS_PER_PAGE);
  const paginatedCampaigns = React.useMemo(() => {
      const start = (currentPage - 1) * ITEMS_PER_PAGE;
      return filteredCampaignsForTable.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredCampaignsForTable, currentPage]);

  const prevMonth = () => {
    setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1, 1));
  };
  const nextMonth = () => {
    setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 1));
  };

  const monthStart = React.useMemo(() => new Date(calendarDate.getFullYear(), calendarDate.getMonth(), 1), [calendarDate]);
  const monthEnd = React.useMemo(() => new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 0), [calendarDate]);
  const startDayIdx = monthStart.getDay(); // 0 is Sunday
  const daysInMonth = monthEnd.getDate();
  
  // Previous month data for padding
  const prevMonthEnd = React.useMemo(() => new Date(calendarDate.getFullYear(), calendarDate.getMonth(), 0), [calendarDate]);
  const prevMonthDays = prevMonthEnd.getDate();

  const calendarDays = React.useMemo(() => {
    const days = [];
    // Padding from prev month
    for (let i = startDayIdx - 1; i >= 0; i--) {
        days.push({ day: prevMonthDays - i, currentMonth: false, date: new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1, prevMonthDays - i) });
    }
    // Current month
    for (let i = 1; i <= daysInMonth; i++) {
        days.push({ day: i, currentMonth: true, date: new Date(calendarDate.getFullYear(), calendarDate.getMonth(), i) });
    }
    // Padding for next month to fill 6 rows (42 days)
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
        days.push({ day: i, currentMonth: false, date: new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, i) });
    }
    return days;
  }, [calendarDate, startDayIdx, daysInMonth, prevMonthDays]);

  const monthLabel = React.useMemo(() => monthStart.toLocaleString('en-US', { month: 'long', year: 'numeric' }), [monthStart]);
  const selectedDateText = React.useMemo(() => {
    if (!selectedDay) return '';
    const d = new Date(calendarDate.getFullYear(), calendarDate.getMonth(), selectedDay);
    return d.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric' });
  }, [calendarDate, selectedDay]);
  const tasksOnSelectedDay = React.useMemo(() => {
    if (!selectedDay) return 0;
    const d = new Date(calendarDate.getFullYear(), calendarDate.getMonth(), selectedDay).setHours(0,0,0,0);
    const arr = Array.isArray(campaigns) ? campaigns : [];
    const count = arr.filter((c) => {
      const s = c.startDate ? new Date(c.startDate).setHours(0,0,0,0) : null;
      const e = c.endDate ? new Date(c.endDate).setHours(0,0,0,0) : null;
      if (s && e) return d >= s && d <= e;
      if (s) return d === s;
      return false;
    }).length;
    return count;
  }, [campaigns, calendarDate, selectedDay]);

  // When reordering, show all matched campaigns without pagination
  const displayCampaigns = isReorderMode ? filteredCampaignsForTable : paginatedCampaigns;

  return (
    <div style={{ backgroundColor: '#fff', minHeight: 'calc(100vh - 80px)' }}>
    <Container className="py-4 container-brand-1400">
      <Row>
        <Col>
          <Container className="py-3 container-brand-1400 campaigns-section">
            <Row className="align-items-center justify-content-between mb-3">
              <Col>
                <h2 className="h4 mb-0">Campaigns</h2>
                <div className="text-muted small">{filteredCampaignsForTable.length} Campaigns</div>
              </Col>
              <Col className="d-flex justify-content-end align-items-center gap-2">
                <div className="text-end">
                    <Button 
                        variant="primary" 
                        className="mb-1"
                        onClick={() => setShowCreateModal(true)}
                        style={{
                            background: 'var(--accent)', 
                            borderColor: 'var(--accent)', 
                            fontWeight: '600',
                            padding: '8px 20px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}
                    >
                        <i className="bi bi-plus-lg"></i> Create campaign
                    </Button>
                </div>
              </Col>
            </Row>
            <div className="mb-4">
              <div className="campaign-header-tabs">
                <div className="campaign-tab-item active">
                  All campaigns
                </div>
              </div>
              <div className="d-flex justify-content-between align-items-center">
                 <div>
                    <InputGroup 
                        className="campaigns-search" 
                        style={{ 
                            width: showCampaignSearch ? '260px' : '40px', 
                            transition: 'width 200ms ease' 
                        }}
                    >
                        <Button 
                            variant="light" 
                            disabled={isReorderMode}
                            onClick={() => {
                                // Toggle input visibility; when closing, apply the drafted value
                                if (showCampaignSearch) setCampaignSearch(campaignSearchDraft);
                                setShowCampaignSearch(!showCampaignSearch);
                            }}
                            style={{background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', color: '#64748b', opacity: isReorderMode ? 0.5 : 1}}
                            title={showCampaignSearch ? 'Apply search' : 'Search campaigns'}
                        >
                            <i className="bi bi-search"></i>
                        </Button>
                        {showCampaignSearch && (
                            <Form.Control 
                                autoFocus
                                type="text" 
                                placeholder="Search campaigns..."
                                value={campaignSearchDraft}
                                onChange={(e) => setCampaignSearchDraft(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        setCampaignSearch(campaignSearchDraft);
                                        e.currentTarget.blur();
                                    } else if (e.key === 'Escape') {
                                        setShowCampaignSearch(false);
                                    }
                                }}
                                style={{ borderRadius: '8px', marginLeft: 8 }}
                            />
                        )}
                    </InputGroup>
                 </div>
                 <div className="d-flex align-items-center gap-2">
                    <Button 
                        variant={isReorderMode ? "primary" : "light"} 
                        className="fw-semibold small" 
                        onClick={() => {
                            if (!isReorderMode) {
                                setCampaignSearch('');
                                setCampaignSearchDraft('');
                                setShowCampaignSearch(false);
                            }
                            setIsReorderMode(!isReorderMode);
                        }}
                        style={{
                            background: isReorderMode ? 'var(--accent)' : '#fff', 
                            border: isReorderMode ? '1px solid var(--accent)' : '1px solid #e2e8f0', 
                            color: isReorderMode ? '#fff' : '#334155', 
                            height: '38px', 
                            display: 'flex', 
                            alignItems: 'center', 
                            borderRadius: '8px'
                        }}
                    >
                        {isReorderMode ? 'Save sequence' : 'Edit sequence'}
                    </Button>
                 </div>
              </div>
            </div>
            <Row>
              <Col md={3} className="mb-3">
                <div className="calendar-wrapper bg-white" style={{border: 'none'}}>
                  <div className="d-flex align-items-center justify-content-between mb-3 position-relative">
                    <div className="d-flex align-items-center gap-2">
                        <span className="fw-bold" style={{fontSize: '1.1rem'}}>Task</span>
                        <i className="bi bi-question-circle text-muted" style={{fontSize: '0.9rem'}}></i>
                    </div>
                  </div>
                  
                  <div className="d-flex align-items-center justify-content-center gap-3 mb-3">
                    <i className="bi bi-chevron-left small cursor-pointer" onClick={prevMonth} style={{cursor: 'pointer', fontSize: '0.8rem'}}></i>
                    <div className="fw-semibold" style={{fontSize: '0.95rem'}}>{monthLabel}</div>
                    <i className="bi bi-chevron-right small cursor-pointer" onClick={nextMonth} style={{cursor: 'pointer', fontSize: '0.8rem'}}></i>
                  </div>

                  <div className="calendar-grid small mt-2">
                    <div className="calendar-header d-flex justify-content-between mb-2">
                      <span className="text-muted" style={{fontSize: '0.75rem'}}>S</span>
                      <span className="text-muted" style={{fontSize: '0.75rem'}}>M</span>
                      <span className="text-muted" style={{fontSize: '0.75rem'}}>T</span>
                      <span className="text-muted" style={{fontSize: '0.75rem'}}>W</span>
                      <span className="text-muted" style={{fontSize: '0.75rem'}}>T</span>
                      <span className="text-muted" style={{fontSize: '0.75rem'}}>F</span>
                      <span className="text-muted" style={{fontSize: '0.75rem'}}>S</span>
                    </div>
                    <div className="calendar-days d-flex flex-wrap row-gap-2">
                      {calendarDays && calendarDays.map((d, i) => {
                        const isSelected = d.currentMonth && selectedDay === d.day;
                        return (
                          <div
                            key={i}
                            className={`calendar-day text-center ${isSelected ? 'active' : ''} ${!d.currentMonth ? 'text-muted-light' : ''}`}
                            onClick={() => d.currentMonth && setSelectedDay(d.day)}
                            style={{
                                width: 'calc(100%/7)', 
                                height: '32px', 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center',
                                borderRadius: '50%',
                                cursor: d.currentMonth ? 'pointer' : 'default',
                                fontSize: '0.9rem',
                                color: d.currentMonth ? (isSelected ? '#fff' : 'inherit') : '#cbd5e1',
                                backgroundColor: isSelected ? '#4cc3ff' : 'transparent',
                                fontWeight: isSelected ? '600' : 'normal'
                            }}
                          >
                            {d.day}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <div className="mt-4 text-muted" style={{fontSize: '0.9rem'}}>
                    {selectedDay ? (tasksOnSelectedDay > 0 ? `${tasksOnSelectedDay} task${tasksOnSelectedDay > 1 ? 's' : ''} on ${selectedDateText}` : `There are no tasks on ${selectedDateText}`) : ''}
                  </div>
                </div>
              </Col>
              <Col md={9}>
                {isCampaignsLoading ? (
                  <div className="text-center py-4">
                    <Spinner animation="border" size="sm" />
                  </div>
                ) : (
                  <Table responsive className="small">
                    <thead>
                      <tr>
                        <th style={{borderBottom: 'none', color: '#64748b', fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase', padding: '16px'}}>
                            CAMPAIGN NAME <i className="bi bi-chevron-expand ms-1"></i>
                        </th>
                        <th style={{borderBottom: 'none', color: '#64748b', fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase', padding: '16px'}}>
                            SOCIAL NETWORK <i className="bi bi-chevron-expand ms-1"></i>
                        </th>
                        <th style={{borderBottom: 'none', color: '#64748b', fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase', padding: '16px'}}>
                            START DATE <i className="bi bi-chevron-expand ms-1"></i>
                        </th>
                        <th style={{borderBottom: 'none', color: '#64748b', fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase', padding: '16px'}}>
                            END DATE <i className="bi bi-chevron-expand ms-1"></i>
                        </th>
                        <th style={{borderBottom: 'none', color: '#64748b', fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase', padding: '16px'}}>
                            LAST UPDATE <i className="bi bi-chevron-expand ms-1"></i>
                        </th>
                        <th style={{borderBottom: 'none', color: '#64748b', fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase', padding: '16px'}}>
                            BUDGET <i className="bi bi-chevron-expand ms-1"></i>
                        </th>
                        <th style={{borderBottom: 'none', color: '#64748b', fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase', padding: '16px'}}>
                            STATUS
                        </th>
                        <th style={{borderBottom: 'none', color: '#64748b', fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase', padding: '16px'}}>
                            ACTIONS
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayCampaigns && displayCampaigns.length > 0 ? (
                        displayCampaigns.map((c, idx) => {
                          const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }) : '-';
                          const budget = typeof c.budget === 'number' ? c.budget : 0;
                          const lastUpdate = c.updatedAt || c.createdAt || c.endDate || c.startDate;
                          const status = (!c.status || c.status === 'Draft') ? 'In Progress' : c.status;
                          return (
                            <tr 
                                key={c.id} 
                                className="campaign-row" 
                                style={{
                                    borderBottom: '1px solid #f1f5f9',
                                    cursor: isReorderMode ? 'grab' : 'default',
                                    backgroundColor: '#fff' // ensure opacity change is visible
                                }}
                                draggable={isReorderMode}
                                onDragStart={(e) => isReorderMode && handleDragStart(e, idx)}
                                onDragEnd={(e) => isReorderMode && handleDragEnd(e)}
                                onDragOver={(e) => isReorderMode && handleDragOver(e, idx)}
                                onDrop={(e) => isReorderMode && handleDrop(e, idx)}
                            >
                              <td style={{padding: '16px', fontWeight: '500', color: '#334155'}}>
                                {isReorderMode && (
                                    <i className="bi bi-grip-vertical text-muted me-2" style={{cursor: 'grab'}}></i>
                                )}
                                {c.name}
                              </td>
                              <td style={{padding: '16px'}}><i className="bi bi-instagram" style={{fontSize: '1.2rem'}}></i></td>
                              <td style={{padding: '16px', color: '#64748b'}}>{fmtDate(c.startDate)}</td>
                              <td style={{padding: '16px', color: '#64748b'}}>{fmtDate(c.endDate)}</td>
                              <td style={{padding: '16px', color: '#64748b'}}>{fmtDate(lastUpdate)}</td>
                              <td style={{padding: '16px', color: '#334155', fontWeight: '500'}}>{budget.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</td>
                              <td style={{padding: '16px'}}>
                                <div className="d-flex align-items-center gap-2">
                                  <span className="status-dot"></span>
                                  <span style={{color: '#334155', fontWeight: '500'}}>{status}</span>
                                  <i className="bi bi-chevron-down small text-muted ms-1"></i>
                                </div>
                              </td>
                              <td style={{padding: '16px'}}>
                                <Button 
                                  variant="outline-info" 
                                  size="sm" 
                                  onClick={() => setViewCampaign(c)}
                                  style={{ borderRadius: '10px' }}
                                >
                                  View
                                </Button>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan="8" className="text-center py-5 text-muted">No campaigns found</td>
                        </tr>
                      )}
                    </tbody>
                  </Table>
                )}
                {!isReorderMode && totalPages > 1 && (
                <Row className="align-items-center justify-content-center mt-4 pb-4">
                  <Col xs="auto" className="d-flex align-items-center gap-2">
                    <Button 
                        variant="outline-secondary" 
                        size="sm" 
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        style={{
                            borderRadius: '8px', 
                            color: 'var(--accent)', 
                            borderColor: 'var(--accent)',
                            background: '#f0f9ff', 
                            padding: '6px 16px',
                            fontWeight: '500',
                            border: '1px solid var(--accent)'
                        }}
                    >
                        Previous
                    </Button>
                    <div className="d-flex align-items-center justify-content-center" 
                         style={{
                             width: '32px', 
                             height: '32px', 
                             background: 'var(--accent)', 
                             color: '#fff', 
                             borderRadius: '6px', 
                             fontWeight: '600',
                             fontSize: '0.9rem',
                             boxShadow: '0 2px 4px rgba(76, 195, 255, 0.3)'
                         }}>
                        {currentPage}
                    </div>
                    <Button 
                        variant="outline-secondary" 
                        size="sm" 
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        style={{
                            borderRadius: '8px', 
                            color: 'var(--accent)', 
                            borderColor: 'var(--accent)',
                            background: '#f0f9ff',
                            padding: '6px 16px',
                            fontWeight: '500',
                            border: '1px solid var(--accent)'
                        }}
                    >
                        Next
                    </Button>
                  </Col>
                </Row>
                )}
              </Col>
            </Row>
          </Container>
          <CreateCampaignWizard 
            show={showCreateModal} 
            onHide={() => setShowCreateModal(false)} 
            onSubmit={handleWizardSubmit} 
          />
        </Col>
      </Row>
    </Container>
    {/* View Campaign Modal */}
    <Modal show={!!viewCampaign} onHide={() => setViewCampaign(null)} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Campaign Details</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {viewCampaign && (
          <>
            <h5 className="mb-3 text-primary">{viewCampaign.name}</h5>
            <Row className="mb-4">
              <Col md={6}>
                <div className="mb-2">
                    <small className="text-muted d-block">Duration</small>
                    <span>
                        {viewCampaign.startDate ? new Date(viewCampaign.startDate).toLocaleDateString() : '-'} - {viewCampaign.endDate ? new Date(viewCampaign.endDate).toLocaleDateString() : '-'}
                    </span>
                </div>
              </Col>
              <Col md={6}>
                <div className="mb-2">
                    <small className="text-muted d-block">Estimated Budget</small>
                    <span className="fw-bold text-success">
                        {(() => {
                          const v = viewCampaign.estimatedBudget ?? viewCampaign.budget;
                          const hasValue = v !== null && v !== undefined && String(v).trim?.() !== '';
                          if (!hasValue) return 'N/A';
                          const num = Number(v);
                          if (!Number.isFinite(num)) return String(v);
                          return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(num);
                        })()}
                    </span>
                </div>
              </Col>
            </Row>

            <div className="mb-4">
                <h6 className="fw-bold">Deliverables</h6>
                <div className="p-3 bg-light rounded border">
                    {viewCampaign.deliverables ? (
                        <p className="mb-0" style={{ whiteSpace: 'pre-wrap' }}>{viewCampaign.deliverables}</p>
                    ) : (
                        <span className="text-muted fst-italic">No deliverables specified</span>
                    )}
                </div>
            </div>

            <div className="mb-4">
                <h6 className="fw-bold">Description</h6>
                <p className="text-muted" style={{ whiteSpace: 'pre-wrap' }}>
                    {viewCampaign.description || 'No description provided.'}
                </p>
            </div>

            <div>
                <h6 className="fw-bold mb-3">Selected Influencers {(Array.isArray(viewCampaign.participantDetails) ? `(${viewCampaign.participantDetails.length})` : '')}</h6>
                {Array.isArray(viewCampaign.participantDetails) && viewCampaign.participantDetails.length > 0 ? (
                    <Row className="g-3">
                        {viewCampaign.participantDetails.map(p => (
                            <Col key={p.id || p.uid || p.email} md={6} lg={4}>
                                <div className="d-flex align-items-center p-2 border rounded bg-white shadow-sm h-100">
                                    <img 
                                        src={p.avatar || `https://i.pravatar.cc/150?u=${p.id || p.uid || p.email}`} 
                                        alt={p.name || p.displayName || p.fullName || 'Creator'}
                                        style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }}
                                        className="me-3"
                                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                    />
                                    <div className="overflow-hidden">
                                        <div className="fw-bold text-truncate">{p.name || p.displayName || p.fullName || p.email}</div>
                                        <div className="d-flex align-items-center gap-2">
                                          <small className="text-muted text-capitalize">{(p.role || '').replace('_', ' ')}</small>
                                          {(() => {
                                            const s = (p.status || '').toLowerCase();
                                            if (!s || s === 'pending') {
                                              return <span className="badge bg-warning text-dark">Pending</span>;
                                            }
                                            if (s === 'accepted') {
                                              return <span className="badge bg-success">Accepted</span>;
                                            }
                                            if (s === 'declined') {
                                              return <span className="badge bg-danger">Declined</span>;
                                            }
                                            return null;
                                          })()}
                                        </div>
                                    </div>
                                </div>
                            </Col>
                        ))}
                    </Row>
                ) : (
                    <div className="text-center p-4 bg-light rounded border border-dashed">
                        <i className="bi bi-people text-muted mb-2" style={{ fontSize: '1.5rem' }}></i>
                        <p className="text-muted mb-0">No influencers selected for this campaign.</p>
                    </div>
                )}
            </div>
          </>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={() => setViewCampaign(null)}>Close</Button>
      </Modal.Footer>
    </Modal>
    </div>
  );
};

export default BrandCampaign;
