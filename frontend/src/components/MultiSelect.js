import React, { useState, useRef, useEffect } from 'react';
import { Form, Badge } from 'react-bootstrap';
import { createPortal } from 'react-dom';

const MultiSelect = ({ 
  options = [], 
  value = [], 
  onChange, 
  placeholder = "Select options...",
  label,
  isInvalid = false,
  disabled = false,
  // Optional: render an icon or element before each option label
  optionIconRenderer
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef(null);
  const controlRef = useRef(null);
  const [dropdownRect, setDropdownRect] = useState({ left: 0, top: 0, width: 0 });

  useEffect(() => {
    const handleClickOutside = (event) => {
      const inDropdown = dropdownRef.current && dropdownRef.current.contains(event.target);
      const inControl = controlRef.current && controlRef.current.contains(event.target);
      if (!inDropdown && !inControl) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const updatePosition = () => {
      if (!controlRef.current) return;
      const rect = controlRef.current.getBoundingClientRect();
      setDropdownRect({ left: rect.left, top: rect.bottom, width: rect.width });
    };
    if (isOpen) {
      updatePosition();
      window.addEventListener('scroll', updatePosition, true);
      window.addEventListener('resize', updatePosition);
    }
    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [isOpen]);

  const filteredOptions = options.filter(option =>
    option.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleToggleOption = (option) => {
    console.log('handleToggleOption called with:', option);
    console.log('current value:', value);
    const newValue = value.includes(option)
      ? value.filter(item => item !== option)
      : [...value, option];
    console.log('new value:', newValue);
    onChange(newValue);
  };

  const handleRemoveOption = (optionToRemove) => {
    console.log('handleRemoveOption called with:', optionToRemove);
    const newValue = value.filter(item => item !== optionToRemove);
    console.log('new value after removal:', newValue);
    onChange(newValue);
  };

  return (
    <div className="position-relative" ref={dropdownRef}>
      {label && <Form.Label>{label}</Form.Label>}
      
      <div
        className={`form-control d-flex flex-wrap align-items-center gap-1 ${
          isInvalid ? 'is-invalid' : ''
        } ${disabled ? 'disabled' : ''}`}
        style={{ 
          minHeight: '38px', 
          cursor: disabled ? 'not-allowed' : 'pointer',
          backgroundColor: disabled ? '#e9ecef' : 'white'
        }}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        ref={controlRef}
      >
        {value.length === 0 ? (
          <span className="text-muted">{placeholder}</span>
        ) : (
          value.map((item, index) => (
            <Badge 
              key={index} 
              bg="primary" 
              className="d-flex align-items-center gap-1"
              style={{ fontSize: '0.75rem' }}
            >
              {optionIconRenderer && (
                <span className="me-1" style={{ display: 'inline-flex', alignItems: 'center' }}>
                  {optionIconRenderer(item)}
                </span>
              )}
              <span>{item}</span>
              {!disabled && (
                <i 
                  className="bi bi-x cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveOption(item);
                  }}
                  style={{ cursor: 'pointer' }}
                ></i>
              )}
            </Badge>
          ))
        )}
        
        {!disabled && (
          <i 
            className={`bi bi-chevron-${isOpen ? 'up' : 'down'} ms-auto text-muted`}
            style={{ fontSize: '0.8rem' }}
          ></i>
        )}
      </div>

      {isOpen && !disabled && createPortal(
        (
          <div
            ref={dropdownRef}
            className="bg-white border rounded shadow-sm"
            style={{
              position: 'fixed',
              left: dropdownRect.left,
              top: dropdownRect.top,
              width: dropdownRect.width,
              zIndex: 9999,
              maxHeight: '200px',
              overflowY: 'auto',
              marginTop: '4px'
            }}
          >
            <div className="p-2 border-bottom">
              <Form.Control
                type="text"
                placeholder="Search options..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                size="sm"
              />
            </div>
            <div className="py-1">
              {filteredOptions.length === 0 ? (
                <div className="px-3 py-2 text-muted">No options found</div>
              ) : (
                filteredOptions.map((option, index) => (
                  <div
                    key={index}
                    className={`px-3 py-2 cursor-pointer d-flex align-items-center justify-content-between ${
                      value.includes(option) ? 'bg-primary bg-opacity-10' : ''
                    }`}
                    style={{ cursor: 'pointer' }}
                    onClick={() => handleToggleOption(option)}
                  >
                    <span className="d-flex align-items-center">
                      <span className={`ms-check me-2 ${value.includes(option) ? 'selected' : ''}`}>
                        {value.includes(option) ? (
                          <i className="bi bi-check-lg text-white"></i>
                        ) : null}
                      </span>
                      {optionIconRenderer && (
                        <span className="me-2" style={{ display: 'inline-flex', alignItems: 'center' }}>
                          {optionIconRenderer(option)}
                        </span>
                      )}
                      <span>{option}</span>
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        ),
        document.body
      )}
    </div>
  );
};

export default MultiSelect;
