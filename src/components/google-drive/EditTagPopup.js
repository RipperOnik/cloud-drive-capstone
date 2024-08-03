import React, { useState, useEffect } from 'react';
import '../../styles/addTagPopup.css';

function EditTagPopup({ onClose, onSave, onRemove, tag }) {
  const [tagName, setTagName] = useState('');
  const [tagColor, setTagColor] = useState('');

  const colors = [
    { name: 'Red', value: '#f44336' },
    { name: 'Green', value: '#4CAF50' },
    { name: 'Blue', value: '#2196F3' },
    { name: 'Yellow', value: '#FFEB3B' },
    { name: 'Orange', value: '#FF9800' },
    { name: 'Purple', value: '#9C27B0' },
    { name: 'Grey', value: '#9E9E9E' }
  ];

  useEffect(() => {
    if (tag) {
      setTagName(tag.tagName);
      setTagColor(tag.tagColor);
    }
  }, [tag]);

  const handleSave = () => {
    if (tagName && tagColor) {
      onSave({ 
        id: tag.id, 
        tagName: tagName,
        tagColor: tagColor,
        userId: tag.userId,
        createdAt: tag.createdAt,
        updatedAt: new Date().toString(),
      });
    } else {
      alert('Please fill in both fields.');
    }
  };

  const handleRemove = () => {
      onRemove({ id : tag.id });
  }

  const toggleColor = (color) => {
    setTagColor((prevColor) => (prevColor === color ? '' : color));
  };

  return (
    <div className="add-tag-popup">
      <div className="add-tag-popup-content">
        <h3>Edit Tag</h3>
        <div className="form-group">
          <label>Tag Name:</label>
          <input
            type="text"
            value={tagName}
            onChange={(e) => setTagName(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label>Tag Color:</label>
          <div className="color-dots-container">
            {colors.map((color) => (
              <span
                key={color.value}
                className={`color-dot ${tagColor === color.value ? 'selected' : ''}`}
                style={{ backgroundColor: color.value }}
                onClick={() => toggleColor(color.value)}
                title={color.name}
              ></span>
            ))}
          </div>
        </div>
        <div className="buttons">
          <button className="save-button" onClick={handleSave}>Save</button>
          <button className="delete-button" onClick={handleRemove}>Delete</button>
          <button className="cancel-button" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

export default EditTagPopup;
