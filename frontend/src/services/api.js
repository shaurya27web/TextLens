const BASE_URL = 'http://192.168.31.227:5000/api';

const request = async (method, endpoint, body = null) => {
  try {
    const options = {
      method,
      headers: { 'Content-Type': 'application/json' },
    };
    if (body) options.body = JSON.stringify(body);

    const response = await fetch(`${BASE_URL}${endpoint}`, options);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

export const ocrAPI = {
  processBase64Image: (imageBase64, title, language = 'eng') =>
    request('POST', '/ocr/process-base64', { imageBase64, title, language }),
};

export const documentsAPI = {
  getAll: (page = 1, limit = 20) =>
    request('GET', `/documents?page=${page}&limit=${limit}`),
  getById: (id) => request('GET', `/documents/${id}`),
  update: (id, title) => request('PUT', `/documents/${id}`, { title }),
  delete: (id) => request('DELETE', `/documents/${id}`),
};