const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

export async function fetchHealth() {
  try {
    const res = await fetch(`${API_BASE}/health`);
    if (!res.ok) throw new Error(`Health check failed with status: ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error('API health check error:', err);
    return { status: 'error', error: err.message };
  }
}

export async function fetchSchema() {
  try {
    const res = await fetch(`${API_BASE}/schema`);
    if (!res.ok) throw new Error(`Schema request failed: ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error('API schema fetch error:', err);
    throw err;
  }
}

export async function fetchEdaSummary() {
  try {
    const res = await fetch(`${API_BASE}/eda/summary`);
    if (!res.ok) throw new Error(`EDA summary failed: ${res.status}`);
    const json = await res.json();
    return json.data;
  } catch (err) {
    console.error('API EDA summary error:', err);
    throw err;
  }
}

export async function fetchEdaCharts() {
  try {
    const res = await fetch(`${API_BASE}/eda/charts`);
    if (!res.ok) throw new Error(`EDA charts failed: ${res.status}`);
    const json = await res.json();
    return json.charts;
  } catch (err) {
    console.error('API EDA charts error:', err);
    throw err;
  }
}

export async function fetchModelMetrics() {
  try {
    const res = await fetch(`${API_BASE}/model/metrics`);
    if (!res.ok) throw new Error(`Model metrics failed: ${res.status}`);
    const json = await res.json();
    return json.data;
  } catch (err) {
    console.error('API Model metrics error:', err);
    throw err;
  }
}

export async function fetchModelFeatures() {
  try {
    const res = await fetch(`${API_BASE}/model/features`);
    if (!res.ok) throw new Error(`Model features failed: ${res.status}`);
    const json = await res.json();
    return json.data;
  } catch (err) {
    console.error('API Model features error:', err);
    throw err;
  }
}

export async function predictStudentDepression(formData) {
  try {
    const res = await fetch(`${API_BASE}/predict`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || `Prediction failed with status: ${res.status}`);
    }
    return data;
  } catch (err) {
    console.error('API predict error:', err);
    throw err;
  }
}
