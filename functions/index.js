/**
 * Cloud Functions for Bingo Game
 * 
 * Note: This file is kept minimal since the admin uses client-side automator.
 * The autoRevealBingo function can be removed if not needed.
 * No startBingoNow HTTP function - admin uses manual controls only.
 * 
 * Deploy: firebase deploy --only functions
 * Node: 18+ (ensure functions/package.json specifies "node": "18")
 */

const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();
const db = admin.firestore();
const FieldValue = admin.firestore.FieldValue;

const DEFAULT_TOTAL_NUMBERS = 99;

/**
 * Optional: Scheduled function that can be used for fully automated games
 * You can remove this if you only want manual/automator control from admin panel
 */
exports.autoRevealBingo = functions.pubsub
  .schedule("every 1 minutes")
  .onRun(async (context) => {
    const gameId = "bingo";
    const gameRef = db.doc(`games/${gameId}`);

    try {
      console.log("[autoRevealBingo] Tick started");
      
      const snap = await gameRef.get();

      if (!snap.exists) {
        console.log("[autoRevealBingo] No game document exists, skipping");
        return null;
      }

      const data = snap.data() || {};
      
      // Only run if there's a specific flag set (optional - add autoMode field if needed)
      // For now, this function does nothing to avoid conflicts with manual admin control
      console.log("[autoRevealBingo] Skipping - admin uses manual control");
      
      return null;
    } catch (err) {
      console.error("[autoRevealBingo] Error:", err);
      return null;
    }
  });

/**
 * DEPLOYMENT:
 * firebase deploy --only functions
 * 
 * NOTES:
 * - autoRevealBingo is kept as placeholder, does nothing by default
 * - All game control is done from admin panel via client-side automator
 * - No HTTP functions needed since admin clicks buttons directly
 * - Can safely remove autoRevealBingo if not needed
 */