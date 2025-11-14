/**
 * @fileoverview Centralized Game State Management for Bingo/Scavenger Hunt
 * 
 * This module provides robust, transactional-safe helpers for managing game state
 * in Firestore. Supports both client admin UI and server-side Cloud Functions.
 * 
 * @module firebase/gameState
 */

import { db } from './client';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  runTransaction,
  onSnapshot,
  serverTimestamp,
  writeBatch,
  arrayUnion,
  Timestamp
} from 'firebase/firestore';

// ============================================================================
// FIRESTORE DOCUMENT SCHEMA
// ============================================================================
/**
 * Canonical Firestore schema for /games/{gameId}
 * 
 * @typedef {Object} GameDocument
 * @property {'manual'|'auto'|'server'} mode - Game operation mode
 * @property {'idle'|'scheduled'|'running'|'paused'|'ended'} status - Current game status
 * @property {number[]} numbers - Full pre-generated sequence of numbers
 * @property {number} batchSize - Numbers drawn per interval (default: 1)
 * @property {number} intervalSec - Seconds between auto-draws (default: 30)
 * @property {number} currentIndex - Last drawn index in numbers array (-1 = none drawn)
 * @property {DrawnNumber[]} numbersDrawn - Chronological history of drawn numbers
 * @property {Timestamp|null} nextAt - Scheduled time for next auto-draw
 * @property {Timestamp|null} startedAt - When game was started
 * @property {Timestamp|null} scheduledFor - When game is scheduled to begin
 * @property {boolean} serverMode - True if using Cloud Function scheduler
 * @property {string} lastUpdatedBy - UID of last admin who modified game
 * @property {Timestamp} createdAt - Document creation timestamp
 * @property {Timestamp} updatedAt - Last modification timestamp
 * 
 * @typedef {Object} DrawnNumber
 * @property {number} number - The drawn number
 * @property {number} drawIndex - Sequential draw index (0, 1, 2...)
 * @property {Timestamp} drawnAt - Server timestamp when drawn
 * @property {string} drawnBy - UID or identifier of who drew it
 */

// Default game schema
const DEFAULT_GAME_SCHEMA = {
  mode: 'manual',
  status: 'idle',
  numbers: [],
  batchSize: 1,
  intervalSec: 30,
  currentIndex: -1,
  numbersDrawn: [],
  nextAt: null,
  startedAt: null,
  scheduledFor: null,
  serverMode: false,
  lastUpdatedBy: 'system',
  createdAt: null,
  updatedAt: null
};

// ============================================================================
// SECURITY RECOMMENDATIONS (Include in Firestore Rules)
// ============================================================================
/**
 * RECOMMENDED FIRESTORE SECURITY RULES:
 * 
 * rules_version = '2';
 * service cloud.firestore {
 *   match /databases/{database}/documents {
 *     match /games/{gameId} {
 *       // Public read access for all users
 *       allow read: if true;
 *       
 *       // Only authenticated admins can write
 *       allow write: if request.auth != null && 
 *                       request.auth.token.admin == true;
 *       
 *       // Validate payload structure on writes
 *       allow update: if request.resource.data.keys().hasAll([
 *         'mode', 'status', 'numbers', 'currentIndex'
 *       ]);
 *     }
 *   }
 * }
 * 
 * SERVER-SIDE (Cloud Functions):
 * - Always verify request.auth.uid or use secret header validation
 * - Check nextAt timestamp before publishing to prevent duplicate draws
 * - Use runTransaction for all state-modifying operations
 */

// ============================================================================
// UTILITY: SIMPLE SEEDED RNG
// ============================================================================
/**
 * Simple seeded pseudo-random number generator (Mulberry32)
 * Provides deterministic random sequences when seed is provided.
 * 
 * @param {number} seed - Seed value for deterministic output
 * @returns {Function} Returns a function that generates random numbers [0, 1)
 * @private
 */
function seededRNG(seed) {
  return function() {
    seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ============================================================================
// CORE HELPER FUNCTIONS
// ============================================================================

/**
 * Get Firestore DocumentReference for a game
 * 
 * @param {string} [gameId='bingo'] - Game identifier
 * @returns {DocumentReference} Firestore document reference
 * 
 * @example
 * const bingoRef = getGameDocRef('bingo');
 * const scavengerRef = getGameDocRef('scavenger');
 */
export function getGameDocRef(gameId = 'bingo') {
  if (!gameId || typeof gameId !== 'string') {
    throw new TypeError('gameId must be a non-empty string');
  }
  return doc(db, 'games', gameId);
}

/**
 * Create or initialize a game document with canonical schema
 * Idempotent - safe to call multiple times
 * 
 * @param {string} [gameId='bingo'] - Game identifier
 * @param {Object} [initialData={}] - Additional fields to merge with schema
 * @returns {Promise<{success: boolean, data: GameDocument}>}
 * 
 * @example
 * // Create new bingo game with custom sequence
 * const result = await createOrInitializeGame('bingo', {
 *   numbers: [1, 2, 3, 4, 5],
 *   lastUpdatedBy: 'admin-uid-123'
 * });
 */
export async function createOrInitializeGame(gameId = 'bingo', initialData = {}) {
  try {
    const docRef = getGameDocRef(gameId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      // Document exists - optionally merge new fields
      if (Object.keys(initialData).length > 0) {
        await updateDoc(docRef, {
          ...initialData,
          updatedAt: serverTimestamp()
        });
      }
      const updated = await getDoc(docRef);
      return { success: true, data: updated.data() };
    }

    // Create new document with canonical schema
    const gameData = {
      ...DEFAULT_GAME_SCHEMA,
      ...initialData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    await setDoc(docRef, gameData);
    const created = await getDoc(docRef);
    
    return { success: true, data: created.data() };
  } catch (error) {
    console.error(`[createOrInitializeGame] Error for gameId=${gameId}:`, error);
    throw new Error(`Failed to create/initialize game: ${error.message}`);
  }
}

/**
 * Save a new number sequence and reset game state
 * Atomically replaces numbers array and resets draw state
 * 
 * @param {string} [gameId='bingo'] - Game identifier
 * @param {number[]} numbersArray - Array of numbers for the sequence
 * @param {Object} [options={}] - Optional parameters
 * @param {string} [options.adminUid='admin'] - UID of admin making change
 * @returns {Promise<{success: boolean, data: GameDocument}>}
 * 
 * @throws {TypeError} If numbersArray is invalid
 * @throws {Error} If sequence length > 200 or contains non-integers
 * 
 * @example
 * await saveSequence('bingo', [1, 2, 3, 4, 5], { adminUid: 'admin-123' });
 */
export async function saveSequence(gameId = 'bingo', numbersArray, options = {}) {
  const { adminUid = 'admin' } = options;

  // Validation
  if (!Array.isArray(numbersArray)) {
    throw new TypeError('numbersArray must be an array');
  }
  if (numbersArray.length === 0 || numbersArray.length > 200) {
    throw new Error('Sequence length must be between 1 and 200');
  }
  if (!numbersArray.every(n => Number.isInteger(n))) {
    throw new Error('All numbers in sequence must be integers');
  }

  try {
    const docRef = getGameDocRef(gameId);
    
    await updateDoc(docRef, {
      numbers: numbersArray,
      currentIndex: -1,
      numbersDrawn: [],
      status: 'idle',
      nextAt: null,
      startedAt: null,
      lastUpdatedBy: adminUid,
      updatedAt: serverTimestamp()
    });

    const updated = await getDoc(docRef);
    return { success: true, data: updated.data() };
  } catch (error) {
    console.error(`[saveSequence] Error for gameId=${gameId}:`, error);
    throw new Error(`Failed to save sequence: ${error.message}`);
  }
}

/**
 * Publish next number(s) in sequence using atomic transaction
 * Handles concurrency safely with transaction-based updates
 * 
 * @param {string} [gameId='bingo'] - Game identifier
 * @param {Object} [options={}] - Draw options
 * @param {string} [options.adminUid='admin'] - UID of admin drawing numbers
 * @param {number} [options.batchSize=1] - Number of items to draw
 * @param {number|null} [options.scheduledNextAt=null] - Timestamp for next scheduled draw
 * @returns {Promise<{success: boolean, newIndex: number, drawn: DrawnNumber[], isEnded: boolean}>}
 * 
 * @example
 * // Admin UI manually draws next number
 * const result = await publishNextNumber('bingo', {
 *   adminUid: 'admin-uid-123',
 *   batchSize: 1
 * });
 * console.log('Drew:', result.drawn); // [{ number: 42, drawIndex: 0, ... }]
 * 
 * @example
 * // Cloud Function draws with scheduled next time
 * const result = await publishNextNumber('bingo', {
 *   adminUid: 'cloud-function',
 *   batchSize: 1,
 *   scheduledNextAt: Date.now() + 30000
 * });
 */
export async function publishNextNumber(gameId = 'bingo', options = {}) {
  const { adminUid = 'admin', batchSize = 1, scheduledNextAt = null } = options;
  const docRef = getGameDocRef(gameId);

  // Retry logic for transaction conflicts
  const maxRetries = 3;
  let attempt = 0;

  while (attempt < maxRetries) {
    try {
      const result = await runTransaction(db, async (transaction) => {
        const docSnap = await transaction.get(docRef);
        
        if (!docSnap.exists()) {
          throw new Error('Game document does not exist');
        }

        const data = docSnap.data();
        const { numbers = [], currentIndex = -1, numbersDrawn = [] } = data;

        // Validate sequence exists
        if (numbers.length === 0) {
          throw new Error('No number sequence available');
        }

        // Check if sequence is exhausted
        if (currentIndex >= numbers.length - 1) {
          return { success: true, newIndex: currentIndex, drawn: [], isEnded: true };
        }

        // Calculate how many numbers to draw
        const availableCount = numbers.length - currentIndex - 1;
        const actualBatchSize = Math.min(batchSize, availableCount);
        const newIndex = Math.min(currentIndex + actualBatchSize, numbers.length - 1);

        // Build array of newly drawn numbers
        const newlyDrawn = [];
        for (let i = currentIndex + 1; i <= newIndex; i++) {
          newlyDrawn.push({
            number: numbers[i],
            drawIndex: numbersDrawn.length + newlyDrawn.length,
            drawnAt: serverTimestamp(),
            drawnBy: adminUid
          });
        }

        // Determine new status
        const isEnded = newIndex >= numbers.length - 1;
        const newStatus = isEnded ? 'ended' : (data.mode === 'auto' || data.mode === 'server' ? 'running' : data.status);

        // Atomic update within transaction
        transaction.update(docRef, {
          currentIndex: newIndex,
          numbersDrawn: [...numbersDrawn, ...newlyDrawn],
          status: newStatus,
          nextAt: isEnded ? null : (scheduledNextAt ? Timestamp.fromMillis(scheduledNextAt) : data.nextAt),
          lastUpdatedBy: adminUid,
          updatedAt: serverTimestamp()
        });

        return {
          success: true,
          newIndex,
          drawn: newlyDrawn,
          isEnded
        };
      });

      return result;
    } catch (error) {
      attempt++;
      
      if (attempt >= maxRetries) {
        console.error(`[publishNextNumber] Max retries reached for gameId=${gameId}:`, error);
        throw new Error(`Failed to publish number after ${maxRetries} attempts: ${error.message}`);
      }

      // Exponential backoff
      const delay = Math.pow(2, attempt) * 100;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

/**
 * Start auto-draw mode with optional server-side scheduling
 * 
 * @param {string} [gameId='bingo'] - Game identifier
 * @param {Object} options - Auto mode configuration
 * @param {string} [options.adminUid='admin'] - UID of admin starting auto mode
 * @param {number} [options.intervalSec=30] - Seconds between draws
 * @param {number} [options.batchSize=1] - Numbers to draw per interval
 * @param {boolean} [options.serverMode=false] - Use Cloud Function scheduler
 * @param {number|null} [options.startAt=null] - Timestamp to start (null = now)
 * @returns {Promise<{success: boolean, data: GameDocument, cloudFunctionPayload?: Object}>}
 * 
 * @example
 * // Start client-side auto mode
 * await startAutoMode('bingo', {
 *   adminUid: 'admin-123',
 *   intervalSec: 30,
 *   batchSize: 1
 * });
 * 
 * @example
 * // Start server-side mode with Cloud Function
 * const result = await startAutoMode('bingo', {
 *   adminUid: 'admin-123',
 *   intervalSec: 60,
 *   serverMode: true
 * });
 * // Use result.cloudFunctionPayload to configure Cloud Scheduler
 */
export async function startAutoMode(gameId = 'bingo', options = {}) {
  const {
    adminUid = 'admin',
    intervalSec = 30,
    batchSize = 1,
    serverMode = false,
    startAt = null
  } = options;

  try {
    const docRef = getGameDocRef(gameId);
    const now = Date.now();
    const startTime = startAt || now;
    const isScheduled = startAt && startAt > now;

    const updateData = {
      mode: serverMode ? 'server' : 'auto',
      status: isScheduled ? 'scheduled' : 'running',
      intervalSec,
      batchSize,
      nextAt: Timestamp.fromMillis(startTime + (isScheduled ? 0 : intervalSec * 1000)),
      lastUpdatedBy: adminUid,
      updatedAt: serverTimestamp()
    };

    if (!isScheduled) {
      updateData.startedAt = serverTimestamp();
    } else {
      updateData.scheduledFor = Timestamp.fromMillis(startTime);
    }

    if (serverMode) {
      updateData.serverMode = true;
    }

    await updateDoc(docRef, updateData);
    const updated = await getDoc(docRef);

    const result = { success: true, data: updated.data() };

    // Provide Cloud Function payload if server mode
    if (serverMode) {
      result.cloudFunctionPayload = {
        gameId,
        intervalSec,
        batchSize,
        endpoint: `https://YOUR-REGION-YOUR-PROJECT.cloudfunctions.net/drawNextNumber`,
        schedulerConfig: {
          schedule: `*/${intervalSec} * * * *`, // Cron format
          timeZone: 'UTC',
          httpTarget: {
            uri: `https://YOUR-REGION-YOUR-PROJECT.cloudfunctions.net/drawNextNumber`,
            httpMethod: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: Buffer.from(JSON.stringify({ gameId, batchSize })).toString('base64')
          }
        }
      };
    }

    return result;
  } catch (error) {
    console.error(`[startAutoMode] Error for gameId=${gameId}:`, error);
    throw new Error(`Failed to start auto mode: ${error.message}`);
  }
}

/**
 * Pause auto-draw mode
 * 
 * @param {string} [gameId='bingo'] - Game identifier
 * @param {Object} options - Pause options
 * @param {string} [options.adminUid='admin'] - UID of admin pausing
 * @returns {Promise<{success: boolean, data: GameDocument}>}
 * 
 * @example
 * await pauseAutoMode('bingo', { adminUid: 'admin-123' });
 */
export async function pauseAutoMode(gameId = 'bingo', options = {}) {
  const { adminUid = 'admin' } = options;

  try {
    const docRef = getGameDocRef(gameId);
    
    await updateDoc(docRef, {
      status: 'paused',
      nextAt: null,
      lastUpdatedBy: adminUid,
      updatedAt: serverTimestamp()
    });

    const updated = await getDoc(docRef);
    return { success: true, data: updated.data() };
  } catch (error) {
    console.error(`[pauseAutoMode] Error for gameId=${gameId}:`, error);
    throw new Error(`Failed to pause auto mode: ${error.message}`);
  }
}

/**
 * Resume auto-draw mode from paused state
 * 
 * @param {string} [gameId='bingo'] - Game identifier
 * @param {Object} options - Resume options
 * @param {string} [options.adminUid='admin'] - UID of admin resuming
 * @param {number} options.intervalSec - Seconds between draws
 * @param {number} options.batchSize - Numbers per draw
 * @returns {Promise<{success: boolean, data: GameDocument}>}
 * 
 * @example
 * await resumeAutoMode('bingo', {
 *   adminUid: 'admin-123',
 *   intervalSec: 30,
 *   batchSize: 1
 * });
 */
export async function resumeAutoMode(gameId = 'bingo', options = {}) {
  const { adminUid = 'admin', intervalSec, batchSize } = options;

  if (!intervalSec || !batchSize) {
    throw new TypeError('intervalSec and batchSize are required');
  }

  try {
    const docRef = getGameDocRef(gameId);
    const now = Date.now();

    await updateDoc(docRef, {
      status: 'running',
      intervalSec,
      batchSize,
      nextAt: Timestamp.fromMillis(now + intervalSec * 1000),
      lastUpdatedBy: adminUid,
      updatedAt: serverTimestamp()
    });

    const updated = await getDoc(docRef);
    return { success: true, data: updated.data() };
  } catch (error) {
    console.error(`[resumeAutoMode] Error for gameId=${gameId}:`, error);
    throw new Error(`Failed to resume auto mode: ${error.message}`);
  }
}

/**
 * Reset game state to initial conditions
 * 
 * @param {string} [gameId='bingo'] - Game identifier
 * @param {Object} options - Reset options
 * @param {string} [options.adminUid='admin'] - UID of admin resetting
 * @param {boolean} [options.preserveSequence=true] - Keep current number sequence
 * @returns {Promise<{success: boolean, data: GameDocument}>}
 * 
 * @example
 * // Reset but keep sequence
 * await resetGame('bingo', { adminUid: 'admin-123', preserveSequence: true });
 * 
 * @example
 * // Full reset including sequence
 * await resetGame('bingo', { adminUid: 'admin-123', preserveSequence: false });
 */
export async function resetGame(gameId = 'bingo', options = {}) {
  const { adminUid = 'admin', preserveSequence = true } = options;

  try {
    const docRef = getGameDocRef(gameId);
    
    const resetData = {
      currentIndex: -1,
      numbersDrawn: [],
      status: 'idle',
      nextAt: null,
      startedAt: null,
      scheduledFor: null,
      mode: 'manual',
      lastUpdatedBy: adminUid,
      updatedAt: serverTimestamp()
    };

    if (!preserveSequence) {
      resetData.numbers = [];
    }

    await updateDoc(docRef, resetData);

    const updated = await getDoc(docRef);
    return { success: true, data: updated.data() };
  } catch (error) {
    console.error(`[resetGame] Error for gameId=${gameId}:`, error);
    throw new Error(`Failed to reset game: ${error.message}`);
  }
}

/**
 * Attach real-time listener to game state changes
 * 
 * @param {string} [gameId='bingo'] - Game identifier
 * @param {Function} onUpdateCallback - Called with normalized game data on updates
 * @returns {Function} Unsubscribe function to stop listening
 * 
 * @example
 * // Client UI subscribes to game updates
 * const unsubscribe = listenToGame('bingo', (gameData) => {
 *   console.log('Current index:', gameData.currentIndex);
 *   console.log('Next draw at:', gameData.nextAt);
 *   console.log('Status:', gameData.status);
 *   
 *   // Display countdown if nextAt is set
 *   if (gameData.nextAt) {
 *     const secondsUntil = (gameData.nextAt.toMillis() - Date.now()) / 1000;
 *     console.log(`Next number in ${secondsUntil} seconds`);
 *   }
 * });
 * 
 * // Later: cleanup listener
 * unsubscribe();
 */
export function listenToGame(gameId = 'bingo', onUpdateCallback) {
  if (typeof onUpdateCallback !== 'function') {
    throw new TypeError('onUpdateCallback must be a function');
  }

  const docRef = getGameDocRef(gameId);
  
  const unsubscribe = onSnapshot(
    docRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        onUpdateCallback(data);
      } else {
        console.warn(`[listenToGame] Game document ${gameId} does not exist`);
        onUpdateCallback(null);
      }
    },
    (error) => {
      console.error(`[listenToGame] Error listening to gameId=${gameId}:`, error);
      onUpdateCallback(null);
    }
  );

  return unsubscribe;
}

/**
 * Get current game state once (no real-time updates)
 * 
 * @param {string} [gameId='bingo'] - Game identifier
 * @returns {Promise<GameDocument|null>} Current game data or null if not found
 * 
 * @example
 * const gameData = await getGameOnce('bingo');
 * console.log('Current numbers drawn:', gameData.numbersDrawn.length);
 */
export async function getGameOnce(gameId = 'bingo') {
  try {
    const docRef = getGameDocRef(gameId);
    const docSnap = await getDoc(docRef);
    
    return docSnap.exists() ? docSnap.data() : null;
  } catch (error) {
    console.error(`[getGameOnce] Error for gameId=${gameId}:`, error);
    throw new Error(`Failed to get game: ${error.message}`);
  }
}

/**
 * Generate random number sequence with optional deterministic seed
 * 
 * @param {Object} options - Generation options
 * @param {number} [options.rangeMin=1] - Minimum number (inclusive)
 * @param {number} [options.rangeMax=90] - Maximum number (inclusive)
 * @param {number} [options.count=25] - How many unique numbers to generate
 * @param {number|null} [options.seed=null] - Seed for deterministic output
 * @returns {number[]} Array of unique random integers
 * 
 * @throws {Error} If count > available range or invalid parameters
 * 
 * @example
 * // Generate random bingo sequence
 * const sequence = generateRandomSequence({
 *   rangeMin: 1,
 *   rangeMax: 90,
 *   count: 25
 * });
 * 
 * @example
 * // Generate deterministic sequence (same seed = same output)
 * const sequence1 = generateRandomSequence({ count: 10, seed: 12345 });
 * const sequence2 = generateRandomSequence({ count: 10, seed: 12345 });
 * // sequence1 === sequence2
 */
export function generateRandomSequence(options = {}) {
  const {
    rangeMin = 1,
    rangeMax = 90,
    count = 25,
    seed = null
  } = options;

  // Validation
  if (!Number.isInteger(rangeMin) || !Number.isInteger(rangeMax)) {
    throw new Error('rangeMin and rangeMax must be integers');
  }
  if (rangeMin >= rangeMax) {
    throw new Error('rangeMin must be less than rangeMax');
  }
  if (!Number.isInteger(count) || count <= 0) {
    throw new Error('count must be a positive integer');
  }
  
  const availableCount = rangeMax - rangeMin + 1;
  if (count > availableCount) {
    throw new Error(`Cannot generate ${count} unique numbers from range [${rangeMin}, ${rangeMax}]`);
  }

  // Use seeded RNG if seed provided, otherwise Math.random
  const rng = seed !== null ? seededRNG(seed) : Math.random;

  // Fisher-Yates shuffle approach
  const pool = [];
  for (let i = rangeMin; i <= rangeMax; i++) {
    pool.push(i);
  }

  const result = [];
  for (let i = 0; i < count; i++) {
    const randomIndex = Math.floor(rng() * pool.length);
    result.push(pool[randomIndex]);
    pool.splice(randomIndex, 1);
  }

  return result;
}

/**
 * Generate recommended Cloud Function configuration for server-mode scheduling
 * This is NOT a scheduler - it returns configuration for Cloud Scheduler/Pub/Sub
 * 
 * @param {string} gameId - Game identifier
 * @param {Object} options - Scheduling options
 * @param {number} options.startAt - Start timestamp (ms)
 * @param {number} options.intervalSec - Seconds between draws
 * @param {number} options.batchSize - Numbers per draw
 * @returns {Object} Configuration object with endpoint, payload, and best practices
 * 
 * @example
 * const config = scheduleServerJobHint('bingo', {
 *   startAt: Date.now() + 60000,
 *   intervalSec: 30,
 *   batchSize: 1
 * });
 * console.log('Deploy Cloud Function at:', config.endpoint);
 * console.log('Use this payload:', config.payload);
 */
export function scheduleServerJobHint(gameId, options = {}) {
  const { startAt, intervalSec, batchSize } = options;

  if (!intervalSec || !batchSize) {
    throw new TypeError('intervalSec and batchSize are required');
  }

  return {
    gameId,
    endpoint: `https://YOUR-REGION-YOUR-PROJECT.cloudfunctions.net/drawNextNumber`,
    
    // HTTP Cloud Function payload
    httpPayload: {
      gameId,
      batchSize,
      idempotencyKey: `${gameId}-${Date.now()}`, // Prevent duplicate processing
    },
    
    // Pub/Sub topic payload
    pubsubPayload: {
      data: Buffer.from(JSON.stringify({
        gameId,
        batchSize,
        timestamp: Date.now()
      })).toString('base64')
    },
    
    // Cloud Scheduler configuration
    schedulerConfig: {
      name: `draw-${gameId}-numbers`,
      schedule: `*/${intervalSec} * * * *`, // Every N seconds (cron format)
      timeZone: 'UTC',
      httpTarget: {
        uri: `https://YOUR-REGION-YOUR-PROJECT.cloudfunctions.net/drawNextNumber`,
        httpMethod: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Cloud-Scheduler': 'true' // Optional: verify in function
        },
        body: Buffer.from(JSON.stringify({
          gameId,
          batchSize
        })).toString('base64')
      }
    },

    // Best practices notes
    bestPractices: {
      idempotency: 'Include timestamp/UUID in payload. Cloud Function should check if nextAt has passed before drawing.',
      
      authentication: [
        'Option 1: Use Firebase Callable Function - auto-verifies Auth token',
        'Option 2: HTTP function with secret header (store in Secret Manager)',
        'Option 3: Service account authentication for scheduler requests'
      ],
      
      safeDraw: [
        'Always read nextAt timestamp before calling publishNextNumber',
        'Check: if (now < nextAt) return early // Not time yet',
        'Use runTransaction to prevent race conditions',
        'Handle game ended state gracefully',
        'Log all draws for audit trail'
      ],
      
      exampleCloudFunction: `
// Example Cloud Function for server-mode auto-draw
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { publishNextNumber, getGameOnce } from './gameState';

admin.initializeApp();

export const drawNextNumber = functions.https.onRequest(async (req, res) => {
  try {
    // Verify request (option: check secret header)
    const secret = req.headers['x-cloud-scheduler-secret'];
    if (secret !== process.env.SCHEDULER_SECRET) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { gameId, batchSize } = req.body;
    
    // Safety check: verify it's time to draw
    const game = await getGameOnce(gameId);
    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }
    
    const now = Date.now();
    if (game.nextAt && game.nextAt.toMillis() > now) {
      return res.json({ message: 'Not time yet', nextAt: game.nextAt.toMillis() });
    }
    
    if (game.status !== 'running') {
      return res.json({ message: 'Game not running', status: game.status });
    }
    
    // Draw next number(s)
    const result = await publishNextNumber(gameId, {
      adminUid: 'cloud-function',
      batchSize,
      scheduledNextAt: now + (game.intervalSec * 1000)
    });
    
    return res.json({ success: true, ...result });
  } catch (error) {
    console.error('Draw error:', error);
    return res.status(500).json({ error: error.message });
  }
});
      `
    },
    
    // Testing recommendations
    testingRecommendations: {
      unit: [
        'Use @firebase/rules-unit-testing to mock Firestore',
        'Test publishNextNumber concurrency with parallel transactions',
        'Verify idempotency - calling same function twice should be safe',
        'Test edge cases: sequence exhaustion, invalid gameId, missing data'
      ],
      
      integration: [
        'Test full auto-mode flow: start -> draw -> pause -> resume -> end',
        'Verify real-time listeners receive updates correctly',
        'Test server-mode with actual Cloud Scheduler (dev environment)',
        'Load test: simulate multiple admins drawing simultaneously'
      ]
    }
  };
}

// ============================================================================
// EXAMPLE USAGE PATTERNS
// ============================================================================

/**
 * EXAMPLE 1: Admin UI - Manual Draw
 * 
 * import { publishNextNumber, listenToGame } from '@/firebase/gameState';
 * 
 * function BingoAdmin() {
 *   const [gameState, setGameState] = useState(null);
 *   
 *   useEffect(() => {
 *     const unsubscribe = listenToGame('bingo', (data) => {
 *       setGameState(data);
 *     });
 *     return unsubscribe;
 *   }, []);
 *   
 *   const handleDrawNext = async () => {
 *     try {
 *       const result = await publishNextNumber('bingo', {
 *         adminUid: currentUser.uid,
 *         batchSize: 1
 *       });
 *       
 *       if (result.isEnded) {
 *         alert('Game ended! All numbers drawn.');
 *       } else {
 *         console.log('Drew number:', result.drawn[0].number);
 *       }
 *     } catch (error) {
 *       console.error('Failed to draw:', error);
 *     }
 *   };
 *   
 *   return (
 *     <button onClick={handleDrawNext} disabled={gameState?.status === 'ended'}>
 *       Draw Next Number
 *     </button>
 *   );
 * }
 */

/**
 * EXAMPLE 2: Client Display - Countdown Timer
 * 
 * import { listenToGame } from '@/firebase/gameState';
 * 
 * function BingoDisplay() {
 *   const [gameState, setGameState] = useState(null);
 *   const [countdown, setCountdown] = useState(null);
 *   
 *   useEffect(() => {
 *     const unsubscribe = listenToGame('bingo', (data) => {
 *       setGameState(data);
 *     });
 *     return unsubscribe;
 *   }, []);
 *   
 *   useEffect(() => {
 *     if (!gameState?.nextAt) {
 *       setCountdown(null);
 *       return;
 *     }
 *     
 *     const timer = setInterval(() => {
 *       const now = Date.now();
 *       const nextMs = gameState.nextAt.toMillis();
 *       const remaining = Math.max(0, Math.floor((nextMs - now) / 1000));
 *       setCountdown(remaining);
 *       
 *       if (remaining === 0) clearInterval(timer);
 *     }, 1000);
 *     
 *     return () => clearInterval(timer);
 *   }, [gameState?.nextAt]);
 *   
 *   return (
 *     <div>
 *       <h2>Latest Number: {gameState?.numbersDrawn.slice(-1)[0]?.number || '--'}</h2>
 *       {countdown !== null && <p>Next draw in: {countdown}s</p>}
 *     </div>
 *   );
 * }
 */

/**
 * EXAMPLE 3: Cloud Function - Safe Server-Side Draw
 * 
 * // Cloud Function with proper safety checks
 * import { publishNextNumber, getGameOnce } from './gameState';
 * 
 * export async function scheduledDraw(gameId: string, batchSize: number) {
 *   try {
 *     // 1. Verify game state before drawing
 *     const game = await getGameOnce(gameId);
 *     
 *     if (!game) {
 *       throw new Error('Game not found');
 *     }
 *     
 *     // 2. Check if it's actually time to draw (prevent duplicate draws)
 *     const now = Date.now();
 *     if (game.nextAt && game.nextAt.toMillis() > now) {
 *       console.log('Not time to draw yet');
 *       return { skipped: true, reason: 'too_early' };
 *     }
 *     
 *     // 3. Verify game is in running state
 *     if (game.status !== 'running') {
 *       console.log('Game not running:', game.status);
 *       return { skipped: true, reason: 'not_running' };
 *     }
 *     
 *     // 4. Draw next number(s) atomically
 *     const result = await publishNextNumber(gameId, {
 *       adminUid: 'cloud-scheduler',
 *       batchSize,
 *       scheduledNextAt: now + (game.intervalSec * 1000)
 *     });
 *     
 *     // 5. Log for audit trail
 *     console.log(`Drew ${result.drawn.length} numbers for ${gameId}:`, 
 *                 result.drawn.map(d => d.number));
 *     
 *     return result;
 *   } catch (error) {
 *     console.error('Scheduled draw failed:', error);
 *     throw error;
 *   }
 * }
 */

/**
 * EXAMPLE 4: Initialize Game with Random Sequence
 * 
 * import { createOrInitializeGame, generateRandomSequence, saveSequence } from '@/firebase/gameState';
 * 
 * async function setupNewBingoGame() {
 *   // 1. Create game document
 *   await createOrInitializeGame('bingo', {
 *     lastUpdatedBy: 'setup-script'
 *   });
 *   
 *   // 2. Generate random sequence
 *   const sequence = generateRandomSequence({
 *     rangeMin: 1,
 *     rangeMax: 90,
 *     count: 90
 *   });
 *   
 *   // 3. Save sequence
 *   await saveSequence('bingo', sequence, {
 *     adminUid: 'setup-script'
 *   });
 *   
 *   console.log('Bingo game ready with sequence:', sequence);
 * }
 */

/**
 * EXAMPLE 5: Testing Concurrent Draws
 * 
 * import { publishNextNumber } from '@/firebase/gameState';
 * 
 * async function testConcurrency() {
 *   // Simulate 3 admins trying to draw at exact same time
 *   const promises = [
 *     publishNextNumber('bingo', { adminUid: 'admin1', batchSize: 1 }),
 *     publishNextNumber('bingo', { adminUid: 'admin2', batchSize: 1 }),
 *     publishNextNumber('bingo', { adminUid: 'admin3', batchSize: 1 })
 *   ];
 *   
 *   const results = await Promise.allSettled(promises);
 *   
 *   // Only ONE should succeed, others retry and get next number
 *   // Transaction ensures no duplicate draws
 *   results.forEach((result, i) => {
 *     if (result.status === 'fulfilled') {
 *       console.log(`Admin ${i+1} drew:`, result.value.drawn);
 *     }
 *   });
 * }
 */

// ============================================================================
// UNIT TEST SUGGESTIONS
// ============================================================================

/**
 * TESTING STRATEGY:
 * 
 * 1. Mock Firestore with @firebase/rules-unit-testing
 * 
 * import { initializeTestEnvironment } from '@firebase/rules-unit-testing';
 * 
 * const testEnv = await initializeTestEnvironment({
 *   projectId: 'test-project',
 *   firestore: {
 *     rules: `
 *       rules_version = '2';
 *       service cloud.firestore {
 *         match /databases/{database}/documents {
 *           match /games/{gameId} {
 *             allow read: if true;
 *             allow write: if request.auth.uid != null;
 *           }
 *         }
 *       }
 *     `
 *   }
 * });
 * 
 * 2. Test Transaction Safety
 * 
 * test('publishNextNumber handles concurrency', async () => {
 *   const db = testEnv.authenticatedContext('admin1').firestore();
 *   
 *   // Setup game
 *   await createOrInitializeGame('test-game', {
 *     numbers: [1, 2, 3, 4, 5]
 *   });
 *   
 *   // Concurrent draws
 *   const [result1, result2] = await Promise.all([
 *     publishNextNumber('test-game', { adminUid: 'admin1' }),
 *     publishNextNumber('test-game', { adminUid: 'admin2' })
 *   ]);
 *   
 *   // Verify no duplicate draws
 *   expect(result1.newIndex).not.toBe(result2.newIndex);
 *   
 *   const final = await getGameOnce('test-game');
 *   expect(final.numbersDrawn).toHaveLength(2);
 *   expect(new Set(final.numbersDrawn.map(d => d.number)).size).toBe(2);
 * });
 * 
 * 3. Test Edge Cases
 * 
 * test('publishNextNumber handles exhausted sequence', async () => {
 *   await saveSequence('test-game', [1, 2, 3]);
 *   
 *   await publishNextNumber('test-game', { batchSize: 3 });
 *   
 *   const result = await publishNextNumber('test-game', { batchSize: 1 });
 *   expect(result.isEnded).toBe(true);
 *   expect(result.drawn).toHaveLength(0);
 * });
 * 
 * 4. Test Auto Mode Flow
 * 
 * test('auto mode lifecycle', async () => {
 *   await createOrInitializeGame('test-game');
 *   await saveSequence('test-game', [1, 2, 3, 4, 5]);
 *   
 *   // Start
 *   await startAutoMode('test-game', { intervalSec: 1, batchSize: 1 });
 *   let game = await getGameOnce('test-game');
 *   expect(game.status).toBe('running');
 *   
 *   // Pause
 *   await pauseAutoMode('test-game', { adminUid: 'admin' });
 *   game = await getGameOnce('test-game');
 *   expect(game.status).toBe('paused');
 *   
 *   // Resume
 *   await resumeAutoMode('test-game', { intervalSec: 1, batchSize: 1 });
 *   game = await getGameOnce('test-game');
 *   expect(game.status).toBe('running');
 * });
 */