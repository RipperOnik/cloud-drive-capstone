import React, { useState } from 'react';
import AddTagPopup from './AddTagPopup';
import '../../styles/file.css';
import EditTagPopup from './EditTagPopup';
import { database } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext';
// import { ReactComponent as EditTag } from '../../../public/images/edit-tag.svg';



function TagSideBar({ tags, setTags, onTagClick, selectedTagIndex, setSelectedTagIndex}) {
  const [isAddTagPopupOpen, setAddTagPopupOpen] = useState(false);
  const [isEditTagPopupOpen, setEditTagPopupOpen] = useState(false);
  const { currentUser } = useAuth()

  const handleOpenAddTagPopup = () => setAddTagPopupOpen(true);
  const handleCloseAddTagPopup = () => setAddTagPopupOpen(false);
  const handleOpenEditTagPopup = () => setEditTagPopupOpen(true);
  const handleCloseEditTagPopup = () => setEditTagPopupOpen(false);
  const handleSaveAddedTag = async (addedTag) => {
    // displaying on UI
    setTags([...tags, addedTag]);
    setAddTagPopupOpen(false);

    try {
      // saving to database
      database.tags.add({
        tagName: addedTag.tagName,
        tagColor: addedTag.tagColor,
        userId: currentUser.uid,
        createdAt: new Date().toString(),
        updatedAt: new Date().toString(),
      })
    } catch (e) {
      console.error('Error adding tag: ', e);
    }
  };

  const handleSaveEditedTag = async (editedTag) => {
    // updating the tag in the UI
    setTags(tags.map(tag => tag.id === editedTag.id ? editedTag : tag));
    setEditTagPopupOpen(false);
    try {
      // saving to database
      database.tags.update(editedTag.id, currentUser, editedTag);
    } catch (e) {
      console.error('Error updating tag: ', e);
    }
  };

  const handleRemoveEditedTag = async (removedTag) => {
    // updating the tag in the UI
    setTags(tags.filter(tag => tag.id !== removedTag.id));
    setEditTagPopupOpen(false);
    try {
      // saving to database
      database.tags.remove(removedTag.id, currentUser);
    } catch (e) {
      console.error('Error removing tag: ', e);
    }
  };

  return (
    <div className="w-100 vstack" style={{ paddingLeft: 40 }}>
      {tags.map((tag, index) => (
        <div className={`hstack collapsable ${index === selectedTagIndex ? 'selected' : ''}`}  
          key={index} 
          onClick={() => {
            setSelectedTagIndex(index);
            onTagClick(tag.id);
          }}
        >
          <div className="tag-button" style={{ backgroundColor: tag.tagColor }} />  
          <span style={{ marginLeft: 5, flexGrow: 1 }}>{tag.tagName}</span>
          <button className="edit-tag-button" onClick={(e) => {
              e.stopPropagation();
              setSelectedTagIndex(index);
              handleOpenEditTagPopup();
             }}>
            <img className="edit-tag-button-svg" src={'./images/edit-tag.svg'} />
          </button>
          </div>
      ))}
      {/* maximum tags can added is 7 */}
      <div className="hstack collapsable" onClick={tags.length > 6 ? null : handleOpenAddTagPopup} 
            style={tags.length > 6 ? { cursor: 'not-allowed' } : {}}
            title={tags.length > 6 ? "Maximum number of tags is 7" : ""}>
            <div style={{ fontSize: 26, marginLeft: 7 }}>+</div>
        <span style={{ marginLeft: 12 }}>Add New Tag</span>
      </div>
      {isAddTagPopupOpen && (
        <AddTagPopup onClose={handleCloseAddTagPopup} onSave={handleSaveAddedTag} />
      )}
      {isEditTagPopupOpen && (
        <EditTagPopup onClose={handleCloseEditTagPopup} onSave={handleSaveEditedTag} onRemove={handleRemoveEditedTag} tag={tags[selectedTagIndex]}/>
      )}
      
    </div>
  );
};

export default TagSideBar;
