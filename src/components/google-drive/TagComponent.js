import React, { useState } from 'react';
import "../../styles/file.css"
import { database } from '../../firebase'

function TagComponent({ file, selectedTag, tags}) {
  return (
    <div className="tag-container w-100 hstack gap-2">
      {tags.map((tag, index) => (
      <div className='tag-dot-button' key={index}>
         <div className={`large-tag-dot ${tag.id === selectedTag.id ? 'selected' : ''}`}
            style={{ backgroundColor: tag.tagColor }}
            onClick={() => {
              selectTag(file, tag);
            }}
      />  
      </div>
      ))}
    </div>
  );
}

function selectTag(file, selectedTag){
    // if already selected tag is clicked => untag
    if (file.tags.id == selectedTag.id){
      database.files.selectTag(file.id, {});
    }
    else{
      database.files.selectTag(file.id, selectedTag);
    }
}

export default TagComponent;