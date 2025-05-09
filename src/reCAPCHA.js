// reCAPTCHA.js - Centralized reCAPTCHA management
import { getAuth } from "firebase/auth";
import { RecaptchaVerifier } from "firebase/auth";

// Track initialization state
let recaptchaInstance = null;
let isInitializing = false;
let initializationPromise = null;

/**
 * Safely initializes a new reCAPTCHA instance
 * 
 * @param {Object} options - Configuration options
 * @param {string} options.containerId - DOM ID for the reCAPTCHA container (default: "recaptcha-container")
 * @param {string} options.size - reCAPTCHA size (default: "invisible")
 * @returns {Promise<RecaptchaVerifier>} - The initialized reCAPTCHA instance
 */
export const initializeRecaptcha = async (options = {}) => {
  // If already initializing, return the existing promise
  if (isInitializing && initializationPromise) {
    return initializationPromise;
  }
  
  // Set initialization flag
  isInitializing = true;
  
  // Create new initialization promise
  initializationPromise = new Promise(async (resolve, reject) => {
    try {
      // Clean up existing instance if it exists
      if (recaptchaInstance) {
        try {
          await recaptchaInstance.clear();
          console.log("✅ Cleared existing reCAPTCHA instance");
        } catch (clearError) {
          console.warn("⚠️ Error clearing existing reCAPTCHA:", clearError);
          // Continue even if clearing fails
        }
        recaptchaInstance = null;
      }
      
      // Default options
      const containerId = options.containerId || "recaptcha-container";
      const size = options.size || "invisible";
      
      // Verify container exists
      const container = document.getElementById(containerId);
      if (!container) {
        throw new Error(`reCAPTCHA container #${containerId} not found in DOM`);
      }
      
      // Get Firebase Auth instance
      const auth = getAuth();
      if (!auth) {
        throw new Error("Firebase Auth is not initialized");
      }
      
      // Create and render the reCAPTCHA
      recaptchaInstance = new RecaptchaVerifier(
        containerId,
        {
          size,
          callback: () => console.log("✅ reCAPTCHA verified"),
          "expired-callback": () => console.log("⚠️ reCAPTCHA expired")
        },
        auth // ✅ 반드시 마지막 인자에 위치해야 함!
      );
      
      // Force rendering to ensure it's ready
      await recaptchaInstance.render();
      console.log("✅ reCAPTCHA successfully rendered");
      
      resolve(recaptchaInstance);
    } catch (error) {
      console.error("❌ reCAPTCHA initialization failed:", error);
      reject(error);
    } finally {
      isInitializing = false;
    }
  });
  
  return initializationPromise;
};

/**
 * Gets the current reCAPTCHA instance or creates a new one
 * 
 * @param {Object} options - Configuration options for new instance if needed
 * @returns {Promise<RecaptchaVerifier>} - reCAPTCHA instance
 */
export const getRecaptchaVerifier = async (options = {}) => {
  if (recaptchaInstance) {
    return recaptchaInstance;
  }
  
  return initializeRecaptcha(options);
};

/**
 * Clears the current reCAPTCHA instance
 * 
 * @returns {Promise<void>}
 */
export const clearRecaptchaVerifier = async () => {
  if (!recaptchaInstance) return;
  
  try {
    await recaptchaInstance.clear();
    recaptchaInstance = null;
    console.log("✅ reCAPTCHA instance cleared");
  } catch (error) {
    console.error("❌ Error clearing reCAPTCHA:", error);
    throw error;
  }
};
