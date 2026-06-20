// Local storage data layer – mirrors entity data for guest mode.
// When authenticated, data lives in entities (cloud). When not, it lives here.

const STORE_KEY = 'lift_user_data';

export function getStore() {
  try {
    return JSON.parse(localStorage.getItem(STORE_KEY) || '{}');
  } catch {
    return {};
  }
}

function saveStore(data) {
  localStorage.setItem(STORE_KEY, JSON.stringify(data));
}

// ── Generic CRUD helpers ──

function listAll(store, key, sort, limit) {
  let items = (store[key] || []).slice();
  if (sort) {
    const desc = sort.startsWith('-');
    const field = desc ? sort.slice(1) : sort;
    items.sort((a, b) => {
      const av = a[field] ?? '';
      const bv = b[field] ?? '';
      if (av < bv) return desc ? 1 : -1;
      if (av > bv) return desc ? -1 : 1;
      return 0;
    });
  }
  if (limit) items = items.slice(0, limit);
  return items;
}

function filterItems(store, key, query, sort, limit) {
  let items = (store[key] || []).filter(item => {
    return Object.entries(query).every(([k, v]) => item[k] === v);
  });
  if (sort) {
    const desc = sort.startsWith('-');
    const field = desc ? sort.slice(1) : sort;
    items.sort((a, b) => {
      const av = a[field] ?? '';
      const bv = b[field] ?? '';
      if (av < bv) return desc ? 1 : -1;
      if (av > bv) return desc ? -1 : 1;
      return 0;
    });
  }
  if (limit) items = items.slice(0, limit);
  return items;
}

function createOne(store, key, data) {
  const now = new Date().toISOString();
  const record = {
    ...data,
    id: 'local_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8),
    created_date: now,
    updated_date: now,
  };
  store[key] = [...(store[key] || []), record];
  saveStore(store);
  return record;
}

function bulkCreate(store, key, dataArray) {
  const now = new Date().toISOString();
  const records = dataArray.map((data, i) => ({
    ...data,
    id: 'local_' + (Date.now() + i) + '_' + Math.random().toString(36).slice(2, 8),
    created_date: now,
    updated_date: now,
  }));
  store[key] = [...(store[key] || []), ...records];
  saveStore(store);
  return records;
}

function updateOne(store, key, id, data) {
  const idx = (store[key] || []).findIndex(r => r.id === id);
  if (idx === -1) return null;
  store[key][idx] = { ...store[key][idx], ...data, updated_date: new Date().toISOString() };
  saveStore(store);
  return store[key][idx];
}

function deleteOne(store, key, id) {
  const before = (store[key] || []).length;
  store[key] = (store[key] || []).filter(r => r.id !== id);
  if (store[key].length === before) return false;
  saveStore(store);
  return true;
}

function getOne(store, key, id) {
  return (store[key] || []).find(r => r.id === id) || null;
}

// ── Entity-specific local stores ──

export const localEntities = {
  WorkoutTemplate: {
    list(sort, limit) {
      return listAll(getStore(), 'templates', sort, limit);
    },
    filter(query, sort, limit) {
      return filterItems(getStore(), 'templates', query, sort, limit);
    },
    create(data) {
      return createOne(getStore(), 'templates', data);
    },
    bulkCreate(dataArray) {
      return bulkCreate(getStore(), 'templates', dataArray);
    },
    update(id, data) {
      return updateOne(getStore(), 'templates', id, data);
    },
    delete(id) {
      return deleteOne(getStore(), 'templates', id);
    },
    get(id) {
      return getOne(getStore(), 'templates', id);
    },
  },

  Exercise: {
    list(sort, limit) {
      return listAll(getStore(), 'exercises', sort, limit);
    },
    filter(query, sort, limit) {
      return filterItems(getStore(), 'exercises', query, sort, limit);
    },
    create(data) {
      return createOne(getStore(), 'exercises', data);
    },
    bulkCreate(dataArray) {
      return bulkCreate(getStore(), 'exercises', dataArray);
    },
    update(id, data) {
      return updateOne(getStore(), 'exercises', id, data);
    },
    delete(id) {
      return deleteOne(getStore(), 'exercises', id);
    },
    get(id) {
      return getOne(getStore(), 'exercises', id);
    },
  },

  ExerciseDetail: {
    list(sort, limit) {
      return listAll(getStore(), 'exerciseDetails', sort, limit);
    },
    filter(query, sort, limit) {
      return filterItems(getStore(), 'exerciseDetails', query, sort, limit);
    },
    create(data) {
      return createOne(getStore(), 'exerciseDetails', data);
    },
    update(id, data) {
      return updateOne(getStore(), 'exerciseDetails', id, data);
    },
    delete(id) {
      return deleteOne(getStore(), 'exerciseDetails', id);
    },
    get(id) {
      return getOne(getStore(), 'exerciseDetails', id);
    },
  },
};

// ── Profile photo ──

export function getLocalProfilePhoto() {
  return localStorage.getItem('profilePhoto') || null;
}

export function setLocalProfilePhoto(url) {
  localStorage.setItem('profilePhoto', url);
}

// ── Migration: push all local data to cloud entities ──

export async function migrateLocalToCloud(rawClient) {
  const store = getStore();

  if (store.templates?.length) {
    const toCreate = store.templates.map(({ id, created_date, updated_date, created_by_id, ...rest }) => rest);
    await rawClient.entities.WorkoutTemplate.bulkCreate(toCreate);
  }
  if (store.exercises?.length) {
    for (const ex of store.exercises) {
      const { id, created_date, updated_date, created_by_id, ...rest } = ex;
      await rawClient.entities.Exercise.create(rest);
    }
  }
  if (store.exerciseDetails?.length) {
    for (const detail of store.exerciseDetails) {
      const { id, created_date, updated_date, created_by_id, ...rest } = detail;
      await rawClient.entities.ExerciseDetail.create(rest);
    }
  }
  const photo = getLocalProfilePhoto();
  if (photo) {
    await rawClient.auth.updateMe({ profilePhoto: photo });
  }

  // Clear local store after successful migration
  localStorage.removeItem(STORE_KEY);
  localStorage.removeItem('profilePhoto');
}

// ── Has any local data? Used for second-device detection ──

export function hasLocalData() {
  const store = getStore();
  return !!(store.templates?.length || store.exercises?.length || store.exerciseDetails?.length);
}