import React, { useState, useRef, useEffect } from 'react';
import { Form, Badge } from 'react-bootstrap';

const MultiSelect = ({ 
  options = [], 
  value = [], 
  onChange, 
  placeholder = "Select options...",
  label,
  isInvalid = false,
  disabled = false 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

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
              {item}
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

      {isOpen && !disabled && (
        <div 
          className="position-absolute w-100 bg-white border rounded shadow-sm mt-1"
          style={{ zIndex: 1050, maxHeight: '200px', overflowY: 'auto' }}
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
                  onMouseEnter={(e) => e.target.classList.add('bg-light')}
                  onMouseLeave={(e) => {
                    if (!value.includes(option)) {
                      e.target.classList.remove('bg-light');
                    }
                  }}
                >
                  <span>{option}</span>
                  {value.includes(option) && (
                    <i className="bi bi-check text-primary"></i>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MultiSelect;
