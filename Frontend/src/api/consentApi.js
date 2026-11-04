import axiosClient from './axiosClient';

const VISITOR_KEY = 'visitor-id';

function makeId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.floor(Math.random() * 16);
    return (c === 'x' ? r : (r % 4) + 8).toString(16);
  });
}

// A random id that the browser makes for itself and keeps. It lets the server count the OK on the notice
// without knowing who the visitor is.
function getVisitorId() {
  try {
    let id = localStorage.getItem(VISITOR_KEY);
    if (!id) {
      id = makeId();
      localStorage.setItem(VISITOR_KEY, id);
    }
    return id;
  } catch {
    return makeId();
  }
}

export const recordStorageNotice = () => axiosClient.post('/api/Consent/notice', { visitorId: getVisitorId() });
