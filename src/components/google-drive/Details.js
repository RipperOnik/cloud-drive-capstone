import React, { useEffect } from 'react';
import { Collapse } from 'react-bootstrap';
import '../../styles/detail.css';

export default function Details({ element, setShowDetails, showDetails, tags }) {
  if (element) {
    const isFile = element.url;
    const size = convertSize(element.size);
    const createdAt = defineDate(element.createdAt);

    return (
      <div style={{ minHeight: '150px', margin: '2px' }}>
        <Collapse in={showDetails} dimension="width" id="sidebar-details" className="h-100">
          <div id="collapsed-details" className="h-100">
            <div className="details h-100">
              <a href={element.url} target="_blank" rel="noopener noreferrer" className="details-file d-flex" style={{ gap: '8px' }}>
                <img
                  src={isFile ? `./images/${element.type}.svg` : './images/folder.svg'}
                  alt="file"
                  style={{ width: '35px' }}
                  onError={(e) => (e.target.src = './images/file.svg')}
                />
                <div style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{element.name}</div>
              </a>
              <button
                type="button"
                className="btn-close"
                style={{ width: '2px', position: 'absolute', right: '10px', top: '3px' }}
                onClick={() => setShowDetails(false)}
              />
              <div className="details-body">
                <Detail name="Size" value={size} />
                <Detail name="Type" value={capitalize(isFile ? element.type : 'folder')} />
                <Detail name="Created" value={createdAt} />
                <Detail name="Tag" value={element.tags.tagName ? element.tags.tagName : ""} />
              </div>
            </div>
          </div>
        </Collapse>
      </div>
    );
  } else {
    return (
      <div style={{ minHeight: '150px', margin: '2px' }}>
        <Collapse in={showDetails} dimension="width" id="sidebar-details" className="h-100">
          <div id="collapsed-details" className="h-100">
            <div className="details h-100">
              <button
                type="button"
                className="btn-close"
                style={{ width: '2px', position: 'absolute', right: '10px', top: '3px' }}
                onClick={() => setShowDetails(false)}
              />
              <div className="details-body">
                <div className="text-muted">Select a file or folder</div>
                <div className="text-muted">to view its details</div>
                <img src="./images/view.svg" alt="view" width={200} />
              </div>
            </div>
          </div>
        </Collapse>
      </div>
    );
  }
}

export function Detail({ name, value }) {
  return (
    <div>
      <div>{name}</div>
      <div className="text-muted">{value}</div>
    </div>
  );
}

export function convertSize(size) {
  let counter = 0;
  while (size >= 1024) {
    size /= 1024;
    counter++;
  }
  let appendage = 'B';
  switch (counter) {
    case 1:
      appendage = 'KB';
      break;
    case 2:
      appendage = 'MB';
      break;
    case 3:
      appendage = 'GB';
      break;
    default:
      break;
  }
  size = Math.round(size);
  return `${size} ${appendage}`;
}

export function defineDate(dateStr) {
  const date = new Date(dateStr);
  const curDate = new Date();
  const months = { 0: 'Jan', 1: 'Feb', 2: 'Mar', 3: 'Apr', 4: 'May', 5: 'Jun', 6: 'Jul', 7: 'Aug', 8: 'Sep', 9: 'Oct', 10: 'Nov', 11: 'Dec' };
  if (date.getFullYear() === curDate.getFullYear()) {
    if (date.getDate() === curDate.getDate() && date.getMonth() === curDate.getMonth()) {
      return 'Today';
    }
    return `${date.getDate()} ${months[date.getMonth()]}`;
  } else {
    return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
  }
}

export function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
