import { createClient } from '@base44/sdk';
import { appParams } from '@/lib/app-params';
import { localEntities, migrateLocalToCloud } from '@/lib/dataLayer';

const { appId, token, functionsVersion, appBaseUrl } = appParams;

//Create a client with authentication required
const rawClient = createClient({
  appId,
  token,
  functionsVersion,
  serverUrl: '',
  requiresAuth: false,
  appBaseUrl
});

// ── Cloud/guest mode routing ──
// When the user is authenticated, entity calls go to the cloud.
// When not (guest mode), they use localStorage mirrored entities.

let _isCloud = false;

export function setCloudMode(enabled) {
  _isCloud = enabled;
}

export function isCloudMode() {
  return _isCloud;
}

export async function migrateToCloud() {
  await migrateLocalToCloud(rawClient);
  _isCloud = true;
}

function wrapEntity(name, rawEntity) {
  const local = localEntities[name];
  const methods = ['list', 'filter', 'create', 'bulkCreate', 'update', 'delete', 'get', 'schema'];

  return new Proxy(rawEntity, {
    get(target, prop) {
      const original = target[prop];
      if (typeof original !== 'function' || !methods.includes(prop)) {
        return original;
      }
      return async (...args) => {
        if (_isCloud) {
          return original.apply(target, args);
        }
        if (typeof local[prop] === 'function') {
          return local[prop](...args);
        }
        // Fallback: try cloud, if it fails return empty
        try {
          return await original.apply(target, args);
        } catch {
          return prop === 'list' || prop === 'filter' ? [] : null;
        }
      };
    }
  });
}

export const base44 = {
  ...rawClient,
  entities: {
    WorkoutTemplate: wrapEntity('WorkoutTemplate', rawClient.entities.WorkoutTemplate),
    Exercise: wrapEntity('Exercise', rawClient.entities.Exercise),
    ExerciseDetail: wrapEntity('ExerciseDetail', rawClient.entities.ExerciseDetail),
    User: rawClient.entities.User,
  },
  _rawClient: rawClient,
};