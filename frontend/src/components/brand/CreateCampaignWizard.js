import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Row, Col } from 'react-bootstrap';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { influencersAPI, getUploadsUrl } from '../../services/api';
import '../../styles/campaign-wizard.css';

const STEPS = [
    { id: 1, label: 'General Info', icon: '1', isIcon: false },
    { id: 2, label: 'Targets', icon: 'bi bi-bullseye', isIcon: true },
    { id: 3, label: 'Budget', icon: 'bi bi-wallet2', isIcon: true },
    { id: 4, label: 'Select Creators', icon: 'bi bi-person-fill', isIcon: true }
];

const WORKFLOW_OPTIONS = [
    { value: 'PR Campaign', icon: 'bi bi-megaphone' },
    { value: 'Paid Collaboration', icon: 'bi bi-cash-stack' },
    { value: 'Affiliate Campaign', icon: 'bi bi-tags' },
    { value: 'Gifting Campaign', icon: 'bi bi-gift' }
];

const SOCIAL_NETWORKS = [
    { id: 'instagram', label: 'Instagram', iconClass: 'bi bi-instagram icon-insta' },
    { id: 'youtube', label: 'YouTube', iconClass: 'bi bi-youtube icon-youtube' }
];

const AVAILABLE_INTERESTS = [
    'Fashion', 'Travel', 'Food & Drink', 'Gaming', 'Technology',
    'Home & Garden', 'Parenting', 'Pets', 'Music', 'Art & Design',
    'Business', 'Education', 'Sports', 'Wellness', 'Photography',
    'Automotive', 'Books & Literature', 'Finance', 'Lifestyle'
];

const DEMOGRAPHICS_OPTIONS = ['All', 'Male', 'Female'];

const LOCATION_OPTIONS = [
    { label: 'Worldwide', code: 'world', flag: '🌐' },
    { label: 'Afghanistan', code: 'af', flag: '🇦🇫' },
    { label: 'Albania', code: 'al', flag: '🇦🇱' },
    { label: 'Algeria', code: 'dz', flag: '🇩🇿' },
    { label: 'Andorra', code: 'ad', flag: '🇦🇩' },
    { label: 'Angola', code: 'ao', flag: '🇦🇴' },
    { label: 'Argentina', code: 'ar', flag: '🇦🇷' },
    { label: 'Armenia', code: 'am', flag: '🇦🇲' },
    { label: 'Australia', code: 'au', flag: '🇦🇺' },
    { label: 'Austria', code: 'at', flag: '🇦🇹' },
    { label: 'Azerbaijan', code: 'az', flag: '🇦🇿' },
    { label: 'Bahrain', code: 'bh', flag: '🇧🇭' },
    { label: 'Bangladesh', code: 'bd', flag: '🇧🇩' },
    { label: 'Belarus', code: 'by', flag: '🇧🇾' },
    { label: 'Belgium', code: 'be', flag: '🇧🇪' },
    { label: 'Belize', code: 'bz', flag: '🇧🇿' },
    { label: 'Benin', code: 'bj', flag: '🇧🇯' },
    { label: 'Bhutan', code: 'bt', flag: '🇧🇹' },
    { label: 'Bolivia', code: 'bo', flag: '🇧🇴' },
    { label: 'Bosnia and Herzegovina', code: 'ba', flag: '🇧🇦' },
    { label: 'Botswana', code: 'bw', flag: '🇧🇼' },
    { label: 'Brazil', code: 'br', flag: '🇧🇷' },
    { label: 'Brunei', code: 'bn', flag: '🇧🇳' },
    { label: 'Bulgaria', code: 'bg', flag: '🇧🇬' },
    { label: 'Burkina Faso', code: 'bf', flag: '🇧🇫' },
    { label: 'Burundi', code: 'bi', flag: '🇧🇮' },
    { label: 'Cambodia', code: 'kh', flag: '🇰🇭' },
    { label: 'Cameroon', code: 'cm', flag: '🇨🇲' },
    { label: 'Canada', code: 'ca', flag: '🇨🇦' },
    { label: 'Cape Verde', code: 'cv', flag: '🇨🇻' },
    { label: 'Central African Republic', code: 'cf', flag: '🇨🇫' },
    { label: 'Chad', code: 'td', flag: '🇹🇩' },
    { label: 'Chile', code: 'cl', flag: '🇨🇱' },
    { label: 'China', code: 'cn', flag: '🇨🇳' },
    { label: 'Colombia', code: 'co', flag: '🇨🇴' },
    { label: 'Comoros', code: 'km', flag: '🇰🇲' },
    { label: 'Congo', code: 'cg', flag: '🇨🇬' },
    { label: 'Costa Rica', code: 'cr', flag: '🇨🇷' },
    { label: 'Croatia', code: 'hr', flag: '🇭🇷' },
    { label: 'Cuba', code: 'cu', flag: '🇨🇺' },
    { label: 'Cyprus', code: 'cy', flag: '🇨🇾' },
    { label: 'Czech Republic', code: 'cz', flag: '🇨🇿' },
    { label: 'Denmark', code: 'dk', flag: '🇩🇰' },
    { label: 'Djibouti', code: 'dj', flag: '🇩🇯' },
    { label: 'Dominican Republic', code: 'do', flag: '🇩🇴' },
    { label: 'Ecuador', code: 'ec', flag: '🇪🇨' },
    { label: 'Egypt', code: 'eg', flag: '🇪🇬' },
    { label: 'El Salvador', code: 'sv', flag: '🇸🇻' },
    { label: 'Estonia', code: 'ee', flag: '🇪🇪' },
    { label: 'Ethiopia', code: 'et', flag: '🇪🇹' },
    { label: 'Finland', code: 'fi', flag: '🇫🇮' },
    { label: 'France', code: 'fr', flag: '🇫🇷' },
    { label: 'Gabon', code: 'ga', flag: '🇬🇦' },
    { label: 'Gambia', code: 'gm', flag: '🇬🇲' },
    { label: 'Georgia', code: 'ge', flag: '🇬🇪' },
    { label: 'Germany', code: 'de', flag: '🇩🇪' },
    { label: 'Ghana', code: 'gh', flag: '🇬🇭' },
    { label: 'Greece', code: 'gr', flag: '🇬🇷' },
    { label: 'Guatemala', code: 'gt', flag: '🇬🇹' },
    { label: 'Guinea', code: 'gn', flag: '🇬🇳' },
    { label: 'Haiti', code: 'ht', flag: '🇭🇹' },
    { label: 'Honduras', code: 'hn', flag: '🇭🇳' },
    { label: 'Hong Kong', code: 'hk', flag: '🇭🇰' },
    { label: 'Hungary', code: 'hu', flag: '🇭🇺' },
    { label: 'Iceland', code: 'is', flag: '🇮🇸' },
    { label: 'India', code: 'in', flag: '🇮🇳' },
    { label: 'Indonesia', code: 'id', flag: '🇮🇩' },
    { label: 'Iran', code: 'ir', flag: '🇮🇷' },
    { label: 'Iraq', code: 'iq', flag: '🇮🇶' },
    { label: 'Ireland', code: 'ie', flag: '🇮🇪' },
    { label: 'Israel', code: 'il', flag: '🇮🇱' },
    { label: 'Italy', code: 'it', flag: '🇮🇹' },
    { label: 'Jamaica', code: 'jm', flag: '🇯🇲' },
    { label: 'Japan', code: 'jp', flag: '🇯🇵' },
    { label: 'Jordan', code: 'jo', flag: '🇯🇴' },
    { label: 'Kazakhstan', code: 'kz', flag: '🇰🇿' },
    { label: 'Kenya', code: 'ke', flag: '🇰🇪' },
    { label: 'Kuwait', code: 'kw', flag: '🇰🇼' },
    { label: 'Kyrgyzstan', code: 'kg', flag: '🇰🇬' },
    { label: 'Laos', code: 'la', flag: '🇱🇦' },
    { label: 'Latvia', code: 'lv', flag: '🇱🇻' },
    { label: 'Lebanon', code: 'lb', flag: '🇱🇧' },
    { label: 'Liberia', code: 'lr', flag: '🇱🇷' },
    { label: 'Libya', code: 'ly', flag: '🇱🇾' },
    { label: 'Liechtenstein', code: 'li', flag: '🇱🇮' },
    { label: 'Lithuania', code: 'lt', flag: '🇱🇹' },
    { label: 'Luxembourg', code: 'lu', flag: '🇱🇺' },
    { label: 'Macau', code: 'mo', flag: '🇲🇴' },
    { label: 'Macedonia', code: 'mk', flag: '🇲🇰' },
    { label: 'Madagascar', code: 'mg', flag: '🇲🇬' },
    { label: 'Malaysia', code: 'my', flag: '🇲🇾' },
    { label: 'Maldives', code: 'mv', flag: '🇲🇻' },
    { label: 'Mali', code: 'ml', flag: '🇲🇱' },
    { label: 'Malta', code: 'mt', flag: '🇲🇹' },
    { label: 'Mexico', code: 'mx', flag: '🇲🇽' },
    { label: 'Moldova', code: 'md', flag: '🇲🇩' },
    { label: 'Monaco', code: 'mc', flag: '🇲🇨' },
    { label: 'Mongolia', code: 'mn', flag: '🇲🇳' },
    { label: 'Montenegro', code: 'me', flag: '🇲🇪' },
    { label: 'Morocco', code: 'ma', flag: '🇲🇦' },
    { label: 'Mozambique', code: 'mz', flag: '🇲🇿' },
    { label: 'Myanmar', code: 'mm', flag: '🇲🇲' },
    { label: 'Namibia', code: 'na', flag: '🇳🇦' },
    { label: 'Nepal', code: 'np', flag: '🇳🇵' },
    { label: 'Netherlands', code: 'nl', flag: '🇳🇱' },
    { label: 'New Zealand', code: 'nz', flag: '🇳🇿' },
    { label: 'Nicaragua', code: 'ni', flag: '🇳🇮' },
    { label: 'Niger', code: 'ne', flag: '🇳🇪' },
    { label: 'Nigeria', code: 'ng', flag: '🇳🇬' },
    { label: 'North Korea', code: 'kp', flag: '🇰🇵' },
    { label: 'Norway', code: 'no', flag: '🇳🇴' },
    { label: 'Oman', code: 'om', flag: '🇴🇲' },
    { label: 'Pakistan', code: 'pk', flag: '🇵🇰' },
    { label: 'Panama', code: 'pa', flag: '🇵🇦' },
    { label: 'Paraguay', code: 'py', flag: '🇵🇾' },
    { label: 'Peru', code: 'pe', flag: '🇵🇪' },
    { label: 'Philippines', code: 'ph', flag: '🇵🇭' },
    { label: 'Poland', code: 'pl', flag: '��' },
    { label: 'Portugal', code: 'pt', flag: '🇵🇹' },
    { label: 'Puerto Rico', code: 'pr', flag: '🇵🇷' },
    { label: 'Qatar', code: 'qa', flag: '🇶🇦' },
    { label: 'Romania', code: 'ro', flag: '🇷🇴' },
    { label: 'Russia', code: 'ru', flag: '🇷🇺' },
    { label: 'Rwanda', code: 'rw', flag: '🇷🇼' },
    { label: 'Saudi Arabia', code: 'sa', flag: '��' },
    { label: 'Senegal', code: 'sn', flag: '🇸🇳' },
    { label: 'Serbia', code: 'rs', flag: '🇷🇸' },
    { label: 'Singapore', code: 'sg', flag: '🇸🇬' },
    { label: 'Slovakia', code: 'sk', flag: '🇸🇰' },
    { label: 'Slovenia', code: 'si', flag: '🇸🇮' },
    { label: 'Somalia', code: 'so', flag: '🇸🇴' },
    { label: 'South Africa', code: 'za', flag: '🇿🇦' },
    { label: 'South Korea', code: 'kr', flag: '🇰🇷' },
    { label: 'Spain', code: 'es', flag: '🇪🇸' },
    { label: 'Sri Lanka', code: 'lk', flag: '🇱🇰' },
    { label: 'Sudan', code: 'sd', flag: '🇸🇩' },
    { label: 'Sweden', code: 'se', flag: '🇸🇪' },
    { label: 'Switzerland', code: 'ch', flag: '🇨🇭' },
    { label: 'Syria', code: 'sy', flag: '🇸🇾' },
    { label: 'Taiwan', code: 'tw', flag: '🇹🇼' },
    { label: 'Tajikistan', code: 'tj', flag: '🇹🇯' },
    { label: 'Tanzania', code: 'tz', flag: '🇹🇿' },
    { label: 'Thailand', code: 'th', flag: '🇹🇭' },
    { label: 'Tunisia', code: 'tn', flag: '🇹🇳' },
    { label: 'Turkey', code: 'tr', flag: '🇹🇷' },
    { label: 'Turkmenistan', code: 'tm', flag: '🇹🇲' },
    { label: 'Uganda', code: 'ug', flag: '🇺🇬' },
    { label: 'Ukraine', code: 'ua', flag: '🇺🇦' },
    { label: 'United Arab Emirates', code: 'ae', flag: '🇦🇪' },
    { label: 'United Kingdom', code: 'gb', flag: '🇬🇧' },
    { label: 'United States', code: 'us', flag: '🇺🇸' },
    { label: 'Uruguay', code: 'uy', flag: '🇺🇾' },
    { label: 'Uzbekistan', code: 'uz', flag: '🇺🇿' },
    { label: 'Venezuela', code: 've', flag: '🇻🇪' },
    { label: 'Vietnam', code: 'vn', flag: '🇻🇳' },
    { label: 'Yemen', code: 'ye', flag: '🇾🇪' },
    { label: 'Zambia', code: 'zm', flag: '🇿🇲' },
    { label: 'Zimbabwe', code: 'zw', flag: '🇿🇼' }
];

const CURRENCIES = [
    { code: 'USD', flag: '🇺🇸', label: 'US Dollar' },
    { code: 'EUR', flag: '🇪🇺', label: 'Euro' },
    { code: 'GBP', flag: '🇬🇧', label: 'British Pound' },
    { code: 'AUD', flag: '🇦🇺', label: 'Australian Dollar' },
    { code: 'CAD', flag: '🇨🇦', label: 'Canadian Dollar' },
    { code: 'JPY', flag: '🇯🇵', label: 'Japanese Yen' }
];

const BUDGET_TYPES = [
    { id: 'Fixed Budget', label: 'Fixed Budget', desc: 'Set a hard cap for the campaign' },
    { id: 'Flexible Budget', label: 'Flexible Budget', desc: 'Allow for budget adjustments' }
];

const UGC_OPTIONS = [
    'Reel post', 'Static post', 'Reel + Static post',
    'Story video (reel style)', 'Story shoutout', 'Story unboxing',
    'Event attendance', 'Outdoor shoots'
];

const INFLUENCER_OPTIONS = [
    'Reel post', 'Story', 'Event attendance', 'Multiple Platforms'
];

const MOCK_CREATORS = [
    {
        id: 'c1',
        name: 'Shakub',
        handle: '@Shakub',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-1.2.1&auto=format&fit=crop&w=100&q=80',
        verified: true,
        tags: ['Fashion', 'Lifestyle'],
        location: 'United States',
        followers: '320k',
        engagement: '5.2%',
        platforms: ['instagram', 'youtube'],
        price: 3500,
        pricing: { reelPostPrice: 3500, storyPrice: 1000, eventAttendancePrice: 5000, multiplePlatformsPrice: 6000 }
    },
    {
        id: 'c2',
        name: 'Ali Ausat',
        handle: '@a_arname',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=crop&w=100&q=80',
        verified: true,
        tags: ['Beauty', 'Skincare', 'Lifestyle'],
        location: 'United States',
        followers: '180k',
        engagement: '4.1%',
        platforms: ['instagram'],
        price: 2200,
        pricing: { reelPostPrice: 2200, storyPrice: 800, eventAttendancePrice: 3000, multiplePlatformsPrice: 4000 }
    },
    {
        id: 'c3',
        name: 'bismahkhan',
        handle: '@Shakub',
        avatar: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?ixlib=rb-1.2.1&auto=format&fit=crop&w=100&q=80',
        verified: true,
        tags: ['Beauty', 'Skincare', 'Lifestyle'],
        location: 'United States',
        followers: '160k',
        engagement: '6.8%',
        platforms: ['instagram'],
        price: 1800,
        pricing: { reelPostPrice: 1800, storyPrice: 600, eventAttendancePrice: 2500, multiplePlatformsPrice: 3500 }
    },
    {
        id: 'c4',
        name: 'Test User File',
        handle: '@thulgories',
        avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-1.2.1&auto=format&fit=crop&w=100&q=80',
        verified: true,
        tags: ['Fashion', 'Lifestyle'],
        location: 'United States',
        followers: '169k',
        engagement: '6.2%',
        platforms: ['instagram'],
        price: 2500,
        pricing: { reelPostPrice: 2500, storyPrice: 900, eventAttendancePrice: 3500, multiplePlatformsPrice: 4500 }
    },
    {
        id: 'c5',
        name: 'Muhammad Shakuzb',
        handle: '@Shakub',
        verified: true,
        avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?ixlib=rb-1.2.1&auto=format&fit=crop&w=100&q=80',
        tags: ['Fitness', 'Wellness'],
        location: 'United States',
        followers: '160k',
        engagement: '4.9%',
        platforms: ['instagram'],
        price: 1900,
        pricing: { reelPostPrice: 1900, storyPrice: 700, eventAttendancePrice: 2800, multiplePlatformsPrice: 3800 }
    },
    {
        id: 'c6',
        name: 'Dev Influencer',
        handle: '@Shalgaris',
        verified: true,
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-1.2.1&auto=format&fit=crop&w=100&q=80',
        tags: ['Gaming', 'Tech'],
        location: 'United States',
        followers: '130k',
        engagement: '8.0%',
        platforms: ['youtube', 'twitch'],
        price: 4500,
        pricing: { reelPostPrice: 4500, storyPrice: 2000, eventAttendancePrice: 6000, multiplePlatformsPrice: 7000 }
    },
    {
        id: 'c7',
        name: 'USG New',
        handle: '@3hakub',
        verified: true,
        avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?ixlib=rb-1.2.1&auto=format&fit=crop&w=100&q=80',
        tags: ['Skincare', 'Wellness'],
        location: 'United States',
        followers: '121k',
        engagement: '7.1%',
        platforms: ['instagram', 'tiktok'],
        price: 1500,
        pricing: { reelPostPrice: 1500, storyPrice: 500, eventAttendancePrice: 2000, multiplePlatformsPrice: 3000 }
    },
    {
        id: 'c8',
        name: 'ALMAS KHAN',
        handle: '@g_armaries',
        verified: true,
        avatar: 'https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?ixlib=rb-1.2.1&auto=format&fit=crop&w=100&q=80',
        tags: ['Skincare', 'Wellness'],
        location: 'United States',
        followers: '90k',
        engagement: '9.5%',
        platforms: ['instagram', 'youtube'],
        price: 2800,
        pricing: { reelPostPrice: 2800, storyPrice: 1000, eventAttendancePrice: 4000, multiplePlatformsPrice: 5000 }
    }
];

const CreateCampaignWizard = ({ show, onHide, onSubmit }) => {
    const INITIAL_FORM_DATA = {
        name: '',
        workflow: 'PR Campaign',
        socials: ['instagram'], // Default selected
        description: '',
        // Step 2 Data
        location: 'Worldwide',
        gender: 'All',
        ageMin: 18,
        ageMax: 45,
        interests: ['Skincare', 'Beauty', 'Fitness'],
        goal: 'Brand Awareness',
        audienceNotes: '',
        // Step 3 Data
        budget: '50,000',
        currency: 'USD',
        budgetType: 'Fixed Budget',
        platformDistribution: { instagram: 60, youtube: 40 },
        ugcRequirements: [],
        influencerRequirements: [],
        maxSpendPerCreator: '',
        notes: '',
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        // Step 4 Data
        selectedCreators: [], // Start empty; will pre-select from props if needed
        creatorServices: {} // { creatorId: ['reelPostPrice', 'storyPrice'] }
    };

    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState(INITIAL_FORM_DATA);

    useEffect(() => {
        if (show) {
            setStep(1);
            setFormData(INITIAL_FORM_DATA);
        }
    }, [show]);

    const [showWorkflowDropdown, setShowWorkflowDropdown] = useState(false);
    const [showInterestDropdown, setShowInterestDropdown] = useState(false);
    const [showDemographicsDropdown, setShowDemographicsDropdown] = useState(false);
    const [showLocationDropdown, setShowLocationDropdown] = useState(false);
    const [showCurrencyDropdown, setShowCurrencyDropdown] = useState(false);
    const [showBudgetTypeDropdown, setShowBudgetTypeDropdown] = useState(false);

    // Mock data for Step 2
    const GOALS = [
        { id: 'brand_awareness', label: 'Brand Awareness', icon: 'bi bi-check-circle-fill', color: '#EC4899' },
        { id: 'sales', label: 'Sales Conversion', icon: 'bi bi-circle', color: '#64748b' },
        { id: 'app_installs', label: 'App Installs', icon: 'bi bi-circle', color: '#64748b' },
        { id: 'content', label: 'Content Creation', icon: 'bi bi-circle', color: '#64748b' }
    ];

    const handleNext = () => {
        if (step < 4) setStep(step + 1);
        else {
            // Final submit
            onSubmit(formData);
        }
    };

    const handleBack = () => {
        if (step > 1) setStep(step - 1);
        else onHide();
    };

    const toggleSocial = (id) => {
        setFormData(prev => {
            const current = prev.socials;
            if (current.includes(id)) {
                return { ...prev, socials: current.filter(s => s !== id) };
            } else {
                return { ...prev, socials: [...current, id] };
            }
        });
    };

    const renderProgressBar = () => (
        <div className="wizard-header">
            <button className="wizard-close-btn" onClick={onHide}>
                <i className="bi bi-x-lg"></i>
            </button>
            
            <div className="wizard-progress-bar">
                <div className="wizard-progress-line"></div>
                {STEPS.map((s) => (
                    <div key={s.id} className={`wizard-step ${step === s.id ? 'active' : ''} ${step > s.id ? 'completed' : ''}`}>
                        <div className="wizard-step-icon">
                            {step === s.id ? (
                                <span>{s.id}</span>
                            ) : s.isIcon ? (
                                <i className={s.icon} style={{ fontSize: '1.4rem' }}></i>
                            ) : (
                                <span>{s.icon}</span>
                            )}
                        </div>
                        <span className="wizard-step-label">{s.label}</span>
                    </div>
                ))}
            </div>
        </div>
    );

    const renderStep1 = () => (
        <div className="animate-fade-in">
            <h2 className="wizard-title">General Information</h2>
            <p className="wizard-subtitle">Set up your campaign details to find the right creators</p>

            <div className="wizard-cols-2">
                <div>
                    <label className="wizard-input-label">Campaign Name</label>
                    <input 
                        type="text" 
                        className="wizard-input" 
                        placeholder="Enter campaign name"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                    />

                    <label className="wizard-input-label mt-4">Social Networks</label>
                    <div className="d-flex flex-wrap gap-2">
                        {SOCIAL_NETWORKS.map(net => (
                            <div 
                                key={net.id} 
                                className={`social-option ${formData.socials.includes(net.id) ? 'selected' : ''}`}
                                onClick={() => toggleSocial(net.id)}
                            >
                                <i className={`${net.iconClass} social-icon`}></i>
                                <span style={{ fontWeight: 500 }}>{net.label}</span>
                                {formData.socials.includes(net.id) && (
                                    <div className="social-check">
                                        <i className="bi bi-check" style={{ fontSize: '1.2rem' }}></i>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                <div>
                    <label className="wizard-input-label">Campaign Workflow</label>
                    <div className="position-relative">
                        <div 
                            className="wizard-input d-flex justify-content-between align-items-center"
                            style={{ cursor: 'pointer' }}
                            onClick={() => setShowWorkflowDropdown(!showWorkflowDropdown)}
                        >
                            <div className="d-flex align-items-center gap-2">
                                <i className={WORKFLOW_OPTIONS.find(o => o.value === formData.workflow)?.icon || 'bi bi-grid'} style={{ color: '#7E5BFF' }}></i>
                                <span>{formData.workflow}</span>
                            </div>
                            <i className="bi bi-chevron-down text-muted"></i>
                        </div>
                        
                        {showWorkflowDropdown && (
                            <div className="wizard-dropdown-menu">
                                {WORKFLOW_OPTIONS.map(opt => (
                                    <div 
                                        key={opt.value} 
                                        className={`wizard-dropdown-item ${formData.workflow === opt.value ? 'selected' : ''}`}
                                        onClick={() => {
                                            setFormData({...formData, workflow: opt.value});
                                            setShowWorkflowDropdown(false);
                                        }}
                                    >
                                        <i className={`${opt.icon} ${opt.iconClass}`} style={{ fontSize: '1.1rem' }}></i>
                                        <span>{opt.value}</span>
                                        {formData.workflow === opt.value && <i className="bi bi-check ms-auto text-primary"></i>}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="mt-2">
                <label className="wizard-input-label">Campaign Description</label>
                <textarea 
                    className="wizard-input" 
                    rows={4} 
                    placeholder="Describe your campaign, expectations, and deliverables."
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                ></textarea>
            </div>
        </div>
    );

    const renderStep2 = () => (
        <div className="animate-fade-in">
            <h2 className="wizard-title">Define Your Target Audience</h2>
            <p className="wizard-subtitle">Specify your desired audience and campaign goals</p>

            {/* Target Location */}
            <div className="mb-4">
                <label className="wizard-input-label">Target Location</label>
                <div className="position-relative">
                    <div 
                        className="wizard-input d-flex align-items-center gap-2" 
                        style={{ cursor: 'pointer' }}
                        onClick={() => setShowLocationDropdown(!showLocationDropdown)}
                    >
                        {(() => {
                            const opt = LOCATION_OPTIONS.find(l => l.label === formData.location);
                            if (!opt || opt.code === 'world') {
                                return <span style={{ fontSize: '1.2rem' }}>🌐</span>;
                            }
                            return <img src={`https://flagcdn.com/w40/${opt.code}.png`} alt={opt.label} style={{ width: '24px', objectFit: 'contain' }} />;
                        })()}
                        <span style={{ fontWeight: 500 }}>{formData.location}</span>
                        <i className="bi bi-chevron-down ms-auto text-muted"></i>
                    </div>

                    {showLocationDropdown && (
                        <div className="wizard-dropdown-menu" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                            {LOCATION_OPTIONS.map(opt => (
                                <div 
                                    key={opt.label} 
                                    className={`wizard-dropdown-item ${formData.location === opt.label ? 'selected' : ''}`}
                                    onClick={() => {
                                        setFormData({...formData, location: opt.label});
                                        setShowLocationDropdown(false);
                                    }}
                                >
                                    {opt.code === 'world' ? (
                                        <span style={{ fontSize: '1.2rem' }}>{opt.flag}</span>
                                    ) : (
                                        <img src={`https://flagcdn.com/w40/${opt.code}.png`} alt={opt.label} style={{ width: '24px', objectFit: 'contain' }} />
                                    )}
                                    <span>{opt.label}</span>
                                    {formData.location === opt.label && <i className="bi bi-check ms-auto text-primary"></i>}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Demographics Row */}
            <div className="wizard-cols-2 mb-4">
                <div>
                    <label className="wizard-input-label">Target Demographics</label>
                    <div className="position-relative">
                        <div 
                            className="wizard-input d-flex justify-content-between align-items-center"
                            style={{ cursor: 'pointer' }}
                            onClick={() => setShowDemographicsDropdown(!showDemographicsDropdown)}
                        >
                            <span>{formData.gender}</span>
                            <i className="bi bi-chevron-down text-muted"></i>
                        </div>

                        {showDemographicsDropdown && (
                            <div className="wizard-dropdown-menu">
                                {DEMOGRAPHICS_OPTIONS.map(opt => (
                                    <div 
                                        key={opt} 
                                        className={`wizard-dropdown-item ${formData.gender === opt ? 'selected' : ''}`}
                                        onClick={() => {
                                            setFormData({...formData, gender: opt});
                                            setShowDemographicsDropdown(false);
                                        }}
                                    >
                                        <span>{opt}</span>
                                        {formData.gender === opt && <i className="bi bi-check ms-auto text-primary"></i>}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
                <div>
                    <label className="wizard-input-label">Age Range</label>
                    <div className="age-input-group">
                        <input 
                            type="number" 
                            className="age-input" 
                            value={formData.ageMin} 
                            onChange={(e) => setFormData({...formData, ageMin: e.target.value})}
                        />
                        <span className="text-muted mx-2">
                            <i className="bi bi-arrow-right-short"></i>
                        </span>
                        <input 
                            type="number" 
                            className="age-input" 
                            value={formData.ageMax} 
                            onChange={(e) => setFormData({...formData, ageMax: e.target.value})}
                        />
                        <i className="bi bi-chevron-right text-muted ms-auto" style={{ fontSize: '0.8rem' }}></i>
                    </div>
                </div>
            </div>

            {/* Target Interests */}
            <div className="mb-4">
                <label className="wizard-input-label">Target Interests</label>
                <div className="d-flex flex-wrap gap-2 align-items-center">
                    {formData.interests.map((interest, idx) => {
                        // Cycle through colors
                        const colors = ['blue', 'purple', 'pink'];
                        const colorClass = colors[idx % colors.length];
                        return (
                            <div key={interest} className={`interest-chip ${colorClass}`}>
                                <i className="bi bi-check-lg"></i>
                                {interest}
                                <i 
                                    className="bi bi-x interest-chip-remove"
                                    onClick={() => {
                                        const newInterests = formData.interests.filter(i => i !== interest);
                                        setFormData({...formData, interests: newInterests});
                                    }}
                                ></i>
                            </div>
                        );
                    })}
                    <div className="position-relative">
                        <button 
                            className="btn-add-interest"
                            onClick={() => setShowInterestDropdown(!showInterestDropdown)}
                        >
                            <i className="bi bi-plus-lg me-1"></i> Add Interests
                        </button>
                        
                        {showInterestDropdown && (
                            <div 
                                className="wizard-dropdown-menu" 
                                style={{ 
                                    minWidth: '220px', 
                                    width: 'max-content',
                                    top: '100%', 
                                    left: '0', 
                                    marginTop: '8px',
                                    maxHeight: '300px',
                                    overflowY: 'auto'
                                }}
                            >
                                {AVAILABLE_INTERESTS
                                    .filter(i => !formData.interests.includes(i))
                                    .map(interest => (
                                    <div 
                                        key={interest}
                                        className="wizard-dropdown-item"
                                        onClick={() => {
                                            setFormData(prev => ({
                                                ...prev,
                                                interests: [...prev.interests, interest]
                                            }));
                                            setShowInterestDropdown(false);
                                        }}
                                    >
                                        <span>{interest}</span>
                                        <i className="bi bi-plus ms-auto text-muted"></i>
                                    </div>
                                ))}
                                {AVAILABLE_INTERESTS.filter(i => !formData.interests.includes(i)).length === 0 && (
                                    <div className="p-3 text-muted text-center" style={{ fontSize: '0.9rem' }}>
                                        No more interests available
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Campaign Goal */}
            <div className="mb-4">
                <label className="wizard-input-label">Campaign Goal</label>
                <div className="d-flex flex-wrap gap-3">
                    {GOALS.map(goal => {
                        const isSelected = formData.goal === goal.label;
                        return (
                            <div 
                                key={goal.id} 
                                className={`goal-option ${isSelected ? 'selected' : ''}`}
                                onClick={() => setFormData({...formData, goal: goal.label})}
                            >
                                <div className={`goal-check ${isSelected ? 'active' : ''}`}>
                                    {isSelected && <i className="bi bi-check" style={{ fontSize: '1.2rem' }}></i>}
                                </div>
                                <span style={{ fontWeight: 500 }}>{goal.label}</span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Audience Notes */}
            <div>
                <div className="wizard-input d-flex gap-3 align-items-start" style={{ minHeight: '100px' }}>
                    <div className="d-flex flex-column align-items-center gap-1 mt-1">
                        <div style={{ 
                            width: '24px', 
                            height: '24px', 
                            background: '#E0F2FE', 
                            borderRadius: '6px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#0284C7'
                        }}>
                            <i className="bi bi-justify-left" style={{ fontSize: '0.9rem' }}></i>
                        </div>
                    </div>
                    <div className="flex-grow-1">
                        <label className="wizard-input-label mb-1" style={{ fontSize: '0.95rem' }}>More About the Target Audience</label>
                        <textarea 
                            className="w-100 border-0 bg-transparent" 
                            style={{ outline: 'none', resize: 'none', fontSize: '0.95rem', color: '#64748b' }}
                            placeholder="Describe any specific details that would help creators tailor their content."
                            rows={2}
                            value={formData.audienceNotes}
                            onChange={(e) => setFormData({...formData, audienceNotes: e.target.value})}
                        ></textarea>
                    </div>
                    <i className="bi bi-slash-lg text-muted mt-auto mb-1" style={{ fontSize: '0.8rem', opacity: 0.5 }}></i>
                </div>
            </div>
        </div>
    );

    const renderStep3 = () => {
        // Calculate daily budget
        const calculateDailyBudget = () => {
            if (!formData.startDate || !formData.endDate || !formData.budget) return 0;
            const start = new Date(formData.startDate);
            const end = new Date(formData.endDate);
            const diffTime = Math.abs(end - start);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // inclusive
            if (diffDays <= 0) return 0;
            const total = parseFloat(formData.budget.replace(/,/g, '')) || 0;
            return (total / diffDays).toLocaleString('en-US', { maximumFractionDigits: 2 });
        };

        // Handle Slider Change
        const handleSliderChange = (e, platform) => {
            setFormData(prev => ({
                ...prev,
                platformDistribution: {
                    ...prev.platformDistribution,
                    [platform]: parseInt(e.target.value)
                }
            }));
        };

        return (
            <div className="animate-fade-in">
                <h2 className="wizard-title">Establish Your Campaign Budget</h2>
                <p className="wizard-subtitle">Determine your budget and campaign timeline</p>

                {/* Campaign Budget Card */}
                <div className="budget-card">
                    <h5 className="mb-4" style={{ fontWeight: 600, color: '#1e293b' }}>Campaign Budget</h5>
                    
                    <div className="row g-4 mb-4">
                        <div className="col-md-6">
                            <label className="wizard-input-label">Total Budget</label>
                            <div className="currency-select-group">
                                <input 
                                    type="text" 
                                    className="wizard-input" 
                                    value={formData.budget}
                                    onChange={(e) => setFormData({...formData, budget: e.target.value})}
                                />
                                <div className="position-absolute" style={{ right: '12px' }}>
                                    <div 
                                        className="d-flex align-items-center gap-1" 
                                        style={{ cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600, color: '#64748b' }}
                                        onClick={() => setShowCurrencyDropdown(!showCurrencyDropdown)}
                                    >
                                        <span>{formData.currency}</span>
                                        <i className="bi bi-chevron-down"></i>
                                    </div>
                                    {showCurrencyDropdown && (
                                        <div className="wizard-dropdown-menu" style={{ width: '150px', right: 0, left: 'auto' }}>
                                            {CURRENCIES.map(c => (
                                                <div 
                                                    key={c.code} 
                                                    className={`wizard-dropdown-item ${formData.currency === c.code ? 'selected' : ''}`}
                                                    onClick={() => {
                                                        setFormData({...formData, currency: c.code});
                                                        setShowCurrencyDropdown(false);
                                                    }}
                                                >
                                                    <span>{c.flag}</span>
                                                    <span>{c.code}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="col-md-6">
                            <label className="wizard-input-label">Allocation Type</label>
                            <div className="position-relative">
                                <div 
                                    className="wizard-input d-flex justify-content-between align-items-center"
                                    style={{ cursor: 'pointer' }}
                                    onClick={() => setShowBudgetTypeDropdown(!showBudgetTypeDropdown)}
                                >
                                    <span>{formData.budgetType}</span>
                                    <i className="bi bi-chevron-down text-muted"></i>
                                </div>
                                {showBudgetTypeDropdown && (
                                    <div className="wizard-dropdown-menu">
                                        {BUDGET_TYPES.map(type => (
                                            <div 
                                                key={type.id} 
                                                className={`wizard-dropdown-item ${formData.budgetType === type.id ? 'selected' : ''}`}
                                                onClick={() => {
                                                    setFormData({...formData, budgetType: type.id});
                                                    setShowBudgetTypeDropdown(false);
                                                }}
                                            >
                                                <div className="d-flex flex-column">
                                                    <span style={{ fontWeight: 500 }}>{type.label}</span>
                                                    <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{type.desc}</span>
                                                </div>
                                                {formData.budgetType === type.id && <i className="bi bi-check ms-auto text-primary"></i>}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                </div>

                {/* Campaign Deliverables */}
                <div className="budget-card mb-4">
                    <h5 className="mb-4" style={{ fontWeight: 600, color: '#1e293b' }}>Campaign Deliverables</h5>
                    
                    <div className="row g-4">
                        <div className="col-md-6">
                            <label className="wizard-input-label mb-3">UGC</label>
                            <div className="d-flex flex-column gap-2">
                                {UGC_OPTIONS.map(opt => (
                                    <label key={opt} className="d-flex align-items-center gap-2 cursor-pointer">
                                        <input 
                                            type="checkbox" 
                                            className="form-check-input" 
                                            checked={formData.ugcRequirements.includes(opt)}
                                            onChange={(e) => {
                                                if (e.target.checked) {
                                                    setFormData({...formData, ugcRequirements: [...formData.ugcRequirements, opt]});
                                                } else {
                                                    setFormData({...formData, ugcRequirements: formData.ugcRequirements.filter(i => i !== opt)});
                                                }
                                            }}
                                        />
                                        <span style={{ fontSize: '0.9rem', color: '#475569' }}>{opt}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                        
                        <div className="col-md-6">
                            <label className="wizard-input-label mb-3">Influencer</label>
                            <div className="d-flex flex-column gap-2">
                                {INFLUENCER_OPTIONS.map(opt => (
                                    <label key={opt} className="d-flex align-items-center gap-2 cursor-pointer">
                                        <input 
                                            type="checkbox" 
                                            className="form-check-input" 
                                            checked={formData.influencerRequirements.includes(opt)}
                                            onChange={(e) => {
                                                if (e.target.checked) {
                                                    setFormData({...formData, influencerRequirements: [...formData.influencerRequirements, opt]});
                                                } else {
                                                    setFormData({...formData, influencerRequirements: formData.influencerRequirements.filter(i => i !== opt)});
                                                }
                                            }}
                                        />
                                        <span style={{ fontSize: '0.9rem', color: '#475569' }}>{opt}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Campaign Dates Card */}
                <div className="budget-card">
                    <h5 className="mb-4" style={{ fontWeight: 600, color: '#1e293b' }}>Campaign Dates</h5>
                    <div className="row g-4">
                        <div className="col-md-6">
                            <label className="wizard-input-label">Start Date</label>
                            <input 
                                type="date" 
                                className="wizard-input" 
                                value={formData.startDate}
                                onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                            />
                        </div>
                        <div className="col-md-6">
                            <label className="wizard-input-label">End Date</label>
                            <input 
                                type="date" 
                                className="wizard-input" 
                                value={formData.endDate}
                                onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                            />
                        </div>
                    </div>
                </div>

                {/* Additional Inputs removed */}
            </div>
        );
    };

    const [creatorsList, setCreatorsList] = useState(MOCK_CREATORS);

    useEffect(() => {
        let mounted = true;
        const loadCreators = async () => {
            try {
                const res = await influencersAPI.getList({ limit: 24 });
                const rows = res.data?.length ? res.data : res.data?.influencers || res.data?.creators || [];
                
                // Helper to generate consistent fake numbers based on ID
                const getFakeCount = (seedStr, min, max) => {
                   let hash = 0;
                   for (let i = 0; i < seedStr.length; i++) {
                     hash = ((hash << 5) - hash) + seedStr.charCodeAt(i);
                     hash |= 0;
                   }
                   const seed = Math.abs(hash);
                   return min + (seed % (max - min));
                };

                const formatFollowers = (val) => {
                     if (val >= 1000000) return (val/1000000).toFixed(1) + 'M';
                     if (val >= 1000) return (val/1000).toFixed(1) + 'k';
                     return val.toLocaleString();
                };

                // Map to UI creator shape
                const normalizeCreator = (r) => {
                    if (!r) return null;
                    const id = r.id || r._id || r.uid || r.userId || 'unknown';
                    
                    let followers = r.followers ?? r.followers_count ?? r.followersCount ?? 0;
                    let engagementRate = r.engagementRate ?? r.engagement_rate ?? 0;

                    if (!followers) followers = getFakeCount(id + 'followers', 1500, 800000);
                    if (!engagementRate) engagementRate = getFakeCount(id + 'engagement', 15, 85) / 10;

                    const rawAvatar = r.avatarUrl || r.avatar || r.avatar_url;
                    let finalAvatar = rawAvatar;
                    if (rawAvatar && typeof rawAvatar === 'string' && !rawAvatar.startsWith('http') && !rawAvatar.startsWith('data:')) {
                        finalAvatar = getUploadsUrl(rawAvatar);
                    }

                    return {
                        id,
                        name: r.fullName || r.name || r.displayName || r.display_name || r.email || r.instagramUsername || r.instagram_username || r.username || 'Unknown',
                        handle: r.instagramUsername ? `@${r.instagramUsername}` : (r.handle || ''),
                        avatar: finalAvatar,
                        location: r.location || r.city || r.country || 'Pakistan',
                        verified: !!r.isVerified,
                        tags: r.niche || r.tags || [],
                        followers: formatFollowers(followers),
                        followersCount: Number(followers) || 0,
                        engagement: `${engagementRate}%`,
                        engagementScore: Number(engagementRate) || 0,
                        platforms: ['instagram', 'youtube'].filter(p => {
                            if (p === 'instagram') return !!(r.instagramUsername || r.username || r.avatar_url);
                            if (p === 'youtube') return !!r.youtubeChannelId || !!r.youtubeChannelTitle;
                            return false;
                        }),
                        price: r.price || (r.pricing?.reelPostPrice ? Number(r.pricing.reelPostPrice) : 1500),
                        basePrice: r.price || (r.pricing?.reelPostPrice ? Number(r.pricing.reelPostPrice) : 1500),
                        pricing: r.pricing || { reelPostPrice: 1500, storyPrice: 500, eventAttendancePrice: 2000, multiplePlatformsPrice: 3000 }
                    };
                };

                const mapped = (rows || []).map(normalizeCreator).filter(Boolean);
                if (mounted && mapped.length) setCreatorsList(mapped);
            } catch (e) {
                // keep mock creators on error
                console.error('Failed to load creators for wizard:', e);
            }
        };
        if (show) loadCreators();
        return () => { mounted = false; };
    }, [show]);

    const [filterQuery, setFilterQuery] = useState('');
    const [filterCategory, setFilterCategory] = useState('all');
    const [sortBy, setSortBy] = useState('best_match');
    const [showCategoriesDropdown, setShowCategoriesDropdown] = useState(false);
    const [showSortDropdown, setShowSortDropdown] = useState(false);

    const allCategories = Array.from(new Set((creatorsList || []).flatMap(c => Array.isArray(c.tags) ? c.tags : [])));
    const getVisibleCreators = () => {
        let list = [...creatorsList];
        const q = (filterQuery || '').trim().toLowerCase();
        if (q) {
            list = list.filter(c => {
                const name = String(c.name || '').toLowerCase();
                const handle = String(c.handle || '').toLowerCase();
                return name.includes(q) || handle.includes(q);
            });
        }
        if (filterCategory && filterCategory !== 'all') {
            const cat = String(filterCategory || '').toLowerCase();
            list = list.filter(c => (c.tags || []).some(t => String(t || '').toLowerCase() === cat));
        }
        const byPrice = (c) => {
            const p = c.pricing && (c.pricing.reelPostPrice || c.pricing.storyPrice || c.pricing.eventAttendancePrice || c.pricing.multiplePlatformsPrice);
            return Number(p || c.basePrice || 0);
        };
        if (sortBy === 'followers_high') {
            list.sort((a, b) => (b.followersCount || 0) - (a.followersCount || 0));
        } else if (sortBy === 'followers_low') {
            list.sort((a, b) => (a.followersCount || 0) - (b.followersCount || 0));
        } else if (sortBy === 'price_high') {
            list.sort((a, b) => byPrice(b) - byPrice(a));
        } else if (sortBy === 'price_low') {
            list.sort((a, b) => byPrice(a) - byPrice(b));
        } else {
            list.sort((a, b) => (b.engagementScore || 0) - (a.engagementScore || 0));
        }
        return list;
    };
    const visibleCreators = getVisibleCreators();

    const renderStep4 = () => {
        const toggleCreator = (id) => {
            setFormData(prev => {
                const current = prev.selectedCreators;
                const currentServices = { ...prev.creatorServices };
                
                if (current.includes(id)) {
                    // Remove
                    const newSelected = current.filter(c => c !== id);
                    delete currentServices[id];
                    return { ...prev, selectedCreators: newSelected, creatorServices: currentServices };
                } else {
                    // Add with default service (e.g. reel)
                    currentServices[id] = ['reelPostPrice'];
                    return { ...prev, selectedCreators: [...current, id], creatorServices: currentServices };
                }
            });
        };

        const toggleCreatorService = (creatorId, serviceKey) => {
            setFormData(prev => {
                const currentServices = { ...prev.creatorServices };
                const creatorServicesList = currentServices[creatorId] || [];
                
                if (creatorServicesList.includes(serviceKey)) {
                    // Prevent removing the last service? Or allow removing all?
                    // Let's allow removing but if all removed, maybe warn or just 0 budget
                    currentServices[creatorId] = creatorServicesList.filter(s => s !== serviceKey);
                } else {
                    currentServices[creatorId] = [...creatorServicesList, serviceKey];
                }
                return { ...prev, creatorServices: currentServices };
            });
        };

        const handleOnDragEnd = (result) => {
            if (!result.destination) return;

            const items = Array.from(formData.selectedCreators);
            const [reorderedItem] = items.splice(result.source.index, 1);
            items.splice(result.destination.index, 0, reorderedItem);

            setFormData(prev => ({
                ...prev,
                selectedCreators: items
            }));
        };

        const selectedCreatorsList = formData.selectedCreators
            .map(id => creatorsList.find(c => c.id === id))
            .filter(Boolean);
        
        const totalEstimatedBudget = selectedCreatorsList.reduce((acc, curr) => {
            const services = formData.creatorServices[curr.id] || [];
            const creatorTotal = services.reduce((sum, sKey) => {
                const price = curr.pricing && curr.pricing[sKey] ? Number(curr.pricing[sKey]) : 0;
                return sum + price;
            }, 0);
            return acc + creatorTotal;
        }, 0);

        const SERVICE_LABELS = {
            reelPostPrice: 'Reel',
            storyPrice: 'Story',
            eventAttendancePrice: 'Event Attendance',
            multiplePlatformsPrice: 'Multiple Platforms'
        };

        return (
            <div className="animate-fade-in" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <h2 className="wizard-title">Select Creators</h2>
                <p className="wizard-subtitle">Choose influencers & UGC creators for this campaign.</p>

                <div className="wizard-split-layout">
                    {/* Main Content - Creator Grid */}
                    <div className="creators-main-panel">
                        {/* Filter Bar */}
                        <div className="filter-bar">
                            <div className="search-input-wrapper">
                                <i className="bi bi-search"></i>
                                <input
                                    type="text"
                                    className="search-input"
                                    placeholder="Search by name or username"
                                    value={filterQuery}
                                    onChange={(e) => setFilterQuery(e.target.value)}
                                />
                            </div>
                            <div className="d-flex align-items-center">
                                <div className="filter-dropdown-trigger" onClick={() => setShowCategoriesDropdown(!showCategoriesDropdown)}>
                                    <span>{filterCategory === 'all' ? 'All categories' : filterCategory}</span>
                                    <i className="bi bi-chevron-down text-muted" style={{ fontSize: '0.8rem' }}></i>
                                    {showCategoriesDropdown && (
                                        <div className="dropdown-panel">
                                            <div className="dropdown-item" onClick={(e) => { e.stopPropagation(); setFilterCategory('all'); setShowCategoriesDropdown(false); }}>All</div>
                                            {allCategories.map(cat => (
                                                <div key={cat} className="dropdown-item" onClick={(e) => { e.stopPropagation(); setFilterCategory(cat); setShowCategoriesDropdown(false); }}>
                                                    {cat}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div className="filter-dropdown-trigger" onClick={() => setShowSortDropdown(!showSortDropdown)}>
                                    <span className="text-muted me-2">Sort by:</span>
                                    <span style={{ fontWeight: 600 }}>
                                        {sortBy === 'best_match' ? 'Best Match'
                                            : sortBy === 'followers_high' ? 'Followers (High)'
                                            : sortBy === 'followers_low' ? 'Followers (Low)'
                                            : sortBy === 'price_high' ? 'Price (High)'
                                            : 'Price (Low)'}
                                    </span>
                                    <i className="bi bi-chevron-down text-muted ms-1" style={{ fontSize: '0.8rem' }}></i>
                                    {showSortDropdown && (
                                        <div className="dropdown-panel">
                                            <div className="dropdown-item" onClick={(e) => { e.stopPropagation(); setSortBy('best_match'); setShowSortDropdown(false); }}>Best Match</div>
                                            <div className="dropdown-item" onClick={(e) => { e.stopPropagation(); setSortBy('followers_high'); setShowSortDropdown(false); }}>Followers (High)</div>
                                            <div className="dropdown-item" onClick={(e) => { e.stopPropagation(); setSortBy('followers_low'); setShowSortDropdown(false); }}>Followers (Low)</div>
                                            <div className="dropdown-item" onClick={(e) => { e.stopPropagation(); setSortBy('price_high'); setShowSortDropdown(false); }}>Price (High)</div>
                                            <div className="dropdown-item" onClick={(e) => { e.stopPropagation(); setSortBy('price_low'); setShowSortDropdown(false); }}>Price (Low)</div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Filter Tags (Mock) */}
                        <div className="d-flex gap-2 mb-3">
                            <div className="px-3 py-1 bg-white border rounded-3 text-muted d-flex align-items-center gap-2" style={{ fontSize: '0.9rem' }}>
                                Filters
                            </div>
                        </div>

                        {/* Creator Grid */}
                        <div className="creators-grid">
                            {visibleCreators.map(creator => {
                                const isSelected = formData.selectedCreators.includes(creator.id);
                                return (
                                    <div 
                                        key={creator.id} 
                                        className={`creator-card ${isSelected ? 'selected' : ''}`}
                                        onClick={() => toggleCreator(creator.id)}
                                    >
                                        <div className="selection-checkbox">
                                            <i className="bi bi-check-lg"></i>
                                        </div>
                                        <div className="creator-header">
                                            <img 
                                                src={creator.avatar || `https://i.pravatar.cc/150?u=${creator.id}`} 
                                                alt={creator.name} 
                                                className="creator-avatar"
                                                onError={(e) => { 
                                                    e.target.onerror = null; 
                                                    e.target.src = `https://i.pravatar.cc/150?u=${creator.id}`; 
                                                }} 
                                            />
                                            <div className="creator-info">
                                                <h4>
                                                    {creator.name} 
                                                    {creator.verified && <i className="bi bi-patch-check-fill verified-badge"></i>}
                                                </h4>
                                                <div className="creator-handle">{creator.handle}</div>
                                            </div>
                                        </div>
                                        
                                        <div className="creator-tags">
                                            {creator.tags.map((tag, idx) => (
                                                <span key={tag} className={`creator-tag ${['pink', 'purple', 'blue'][idx % 3]}`}>
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>

                                        <div className="creator-stats-row">
                                            <div className="stat-item">
                                                <i className="bi bi-people"></i>
                                                <span className="stat-value">{creator.followers}</span>
                                            </div>
                                            <div className="stat-item">
                                                <i className="bi bi-activity"></i>
                                                <span className="stat-value">{creator.engagement}</span>
                                            </div>
                                            <div className="stat-item">
                                                {(() => {
                                                    const loc = (creator.location || '').toLowerCase();
                                                    let code = null;
                                                    if (loc.includes('pakistan')) code = 'pk';
                                                    else if (loc.includes('united states') || loc.includes('usa') || loc.includes('us')) code = 'us';
                                                    else if (loc.includes('uk') || loc.includes('united kingdom')) code = 'gb';
                                                    else if (loc.includes('canada')) code = 'ca';
                                                    else if (loc.includes('australia')) code = 'au';
                                                    else if (loc.includes('india')) code = 'in';
                                                    else if (loc.includes('uae') || loc.includes('emirates')) code = 'ae';
                                                    
                                                    return code ? (
                                                        <img src={`https://flagcdn.com/w20/${code}.png`} alt={creator.location} style={{ width: '16px' }} />
                                                    ) : (
                                                        <i className="bi bi-globe" style={{ fontSize: '14px' }}></i>
                                                    );
                                                })()}
                                                <span className="stat-value">{creator.location || 'Unknown'}</span>
                                            </div>
                                        </div>

                                        <div className="mt-3 d-flex gap-2 justify-content-center">
                                            {creator.platforms.includes('instagram') && <i className="bi bi-instagram" style={{ color: '#E1306C' }}></i>}
                                            {creator.platforms.includes('youtube') && <i className="bi bi-youtube" style={{ color: '#FF0000' }}></i>}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Right Sidebar - Selected Creators */}
                    <div className="creators-sidebar">
                        <div className="sidebar-header">
                            <h5 className="m-0" style={{ fontWeight: 600, color: '#1e293b' }}>Selected Creators</h5>
                            <div className="d-flex gap-2">
                                <span className="badge bg-light text-dark border">
                                    <i className="bi bi-people-fill me-1" style={{ color: '#EC4899' }}></i>
                                    {selectedCreatorsList.length} Selected
                                </span>
                            </div>
                        </div>

                        <div className="selected-creators-list">
                            {selectedCreatorsList.length === 0 ? (
                                <div className="text-center text-muted py-5">
                                    <i className="bi bi-person-plus display-6 mb-3 d-block opacity-25"></i>
                                    <p className="small">Select creators from the list to add them to your campaign.</p>
                                </div>
                            ) : (
                                <DragDropContext onDragEnd={handleOnDragEnd}>
                                    <Droppable droppableId="selected-creators">
                                        {(provided) => (
                                            <div
                                                {...provided.droppableProps}
                                                ref={provided.innerRef}
                                            >
                                                {selectedCreatorsList.map((creator, index) => {
                                                    const creatorServices = formData.creatorServices[creator.id] || [];
                                                    const creatorTotal = creatorServices.reduce((sum, sKey) => {
                                                        return sum + (creator.pricing && creator.pricing[sKey] ? Number(creator.pricing[sKey]) : 0);
                                                    }, 0);

                                                    return (
                                                        <Draggable key={creator.id} draggableId={creator.id} index={index}>
                                                            {(provided) => (
                                                                <div 
                                                                    ref={provided.innerRef}
                                                                    {...provided.draggableProps}
                                                                    className="selected-creator-item align-items-start"
                                                                    style={{ ...provided.draggableProps.style }}
                                                                >
                                                                    {/* Drag Handle */}
                                                                    <div 
                                                                        {...provided.dragHandleProps}
                                                                        className="me-2 mt-2 text-muted"
                                                                        style={{ cursor: 'grab' }}
                                                                    >
                                                                        <i className="bi bi-grip-vertical"></i>
                                                                    </div>

                                                                    <div style={{ flex: 1, minWidth: 0 }}>
                                                                        {/* Name Left Aligned */}
                                                                        <div className="text-start mb-3">
                                                                            <h6 className="fw-bold mb-0" style={{ fontSize: '1rem' }}>{creator.name}</h6>
                                                                        </div>

                                                                        <div className="d-flex gap-3">
                                                                            {/* Avatar Left */}
                                                                            <div className="flex-shrink-0 pt-1">
                                                                                <img 
                                                                                    src={creator.avatar || `https://i.pravatar.cc/150?u=${creator.id}`} 
                                                                                    alt={creator.name} 
                                                                                    style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover' }}
                                                                                    onError={(e) => { 
                                                                                        e.target.onerror = null; 
                                                                                        e.target.src = `https://i.pravatar.cc/150?u=${creator.id}`; 
                                                                                    }}
                                                                                />
                                                                            </div>

                                                                            {/* Services Right */}
                                                                            <div className="flex-grow-1">
                                                                                <div className="d-flex flex-column gap-2">
                                                                                    {['reelPostPrice', 'storyPrice', 'eventAttendancePrice', 'multiplePlatformsPrice'].map(sKey => {
                                                                                        const price = creator.pricing && creator.pricing[sKey] ? Number(creator.pricing[sKey]) : null;
                                                                                        if (!price) return null;

                                                                                        const isChecked = creatorServices.includes(sKey);

                                                                                        return (
                                                                                            <label key={sKey} className="d-flex align-items-center justify-content-between cursor-pointer" style={{ fontSize: '0.85rem' }}>
                                                                                                <div className="d-flex align-items-center gap-2">
                                                                                                    <input 
                                                                                                        type="checkbox" 
                                                                                                        className="form-check-input mt-0"
                                                                                                        checked={isChecked}
                                                                                                        onChange={() => toggleCreatorService(creator.id, sKey)}
                                                                                                    />
                                                                                                    <span className="text-muted">{SERVICE_LABELS[sKey]}</span>
                                                                                                </div>
                                                                                                <span className="fw-bold text-primary">${price.toLocaleString()}</span>
                                                                                            </label>
                                                                                        );
                                                                                    })}
                                                                                </div>

                                                                                {/* Total per Creator */}
                                                                                <div className="mt-3 pt-2 border-top d-flex justify-content-between align-items-center">
                                                                                    <span className="fw-bold text-dark small">Total</span>
                                                                                    <span className="fw-bold text-dark">
                                                                                        {creatorTotal > 0 ? `${creatorTotal.toLocaleString()} USD` : '0 USD'}
                                                                                    </span>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                    {/* Delete Icon to remove influencer */}
                                                                    <i 
                                                                        className="bi bi-trash ms-2 mt-2" 
                                                                        style={{ fontSize: '0.9rem', cursor: 'pointer', color: 'black' }}
                                                                        onClick={() => toggleCreator(creator.id)}
                                                                        title="Remove Creator"
                                                                    ></i>
                                                                </div>
                                                            )}
                                                        </Draggable>
                                                    );
                                                })}
                                                {provided.placeholder}
                                            </div>
                                        )}
                                    </Droppable>
                                </DragDropContext>
                            )}
                        </div>

                        <div className="budget-summary">
                            <div className="summary-row">
                                <span>Estimated Budget:</span>
                                <span className="fw-bold">${totalEstimatedBudget.toLocaleString()}</span>
                            </div>
                            <div className="summary-total">
                                <span>Total Estimated</span>
                                <span style={{ color: '#1e293b' }}>${totalEstimatedBudget.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const renderStepPlaceholder = (num) => (
        <div className="text-center py-5">
            <h3 className="text-muted">Step {num} Content Placeholder</h3>
            <p>This section is under construction.</p>
        </div>
    );

    return (
        <Modal 
            show={show} 
            onHide={onHide} 
            size="xl" 
            centered 
            contentClassName="campaign-wizard-modal-content"
            backdrop="static" // Prevent accidental close
        >
            {renderProgressBar()}
            
            <div className="wizard-body">
                {step === 1 && renderStep1()}
                {step === 2 && renderStep2()}
                {step === 3 && renderStep3()}
                {step === 4 && renderStep4()}
            </div>

            <div className="wizard-footer">
                <button className="btn-wizard-back" onClick={handleBack}>
                    {step === 1 ? 'Cancel' : 'Back'}
                </button>
                <div>
                    <button className="btn-wizard-save" onClick={onHide}>Save Draft</button>
                    <button className="btn-wizard-next" onClick={handleNext}>
                        {step === 4 ? 'Create Campaign' : 'Next'} 
                        <i className="bi bi-arrow-right"></i>
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default CreateCampaignWizard;
