// Browser-only storage service using Cloudinary unsigned uploads.
// IMPORTANT: Do not put your API secret in the frontend.
// Create an unsigned upload preset in Cloudinary and set the following env vars in a .env file at the project root:
// REACT_APP_CLOUDINARY_CLOUD_NAME=dgpocgkx3
// REACT_APP_CLOUDINARY_UPLOAD_PRESET=your_unsigned_preset
export class StorageService {

  /**
   * Upload a product image to Cloudinary
   * @param {File} file - The image file to upload
   * @param {string} productId - The product ID to associate with the image
   * @returns {Promise<string>} - The secure URL of the uploaded image
   */
  async uploadProductImage(file, productId, folder = 'products') {
    try {
      if (!file || !productId) {
        throw new Error('File and productId are required');
      }

      // Validate the image file
      const validation = this.validateImageFile(file);
      if (!validation.isValid) {
        throw new Error(validation.error);
      }

      // Prefer CRA env vars, but provide fallbacks for robustness in dev
      const cloudName =
        process.env.REACT_APP_CLOUDINARY_CLOUD_NAME ||
        (typeof window !== 'undefined' && window.CLOUDINARY_CLOUD_NAME) ||
        (typeof localStorage !== 'undefined' && localStorage.getItem('CLOUDINARY_CLOUD_NAME')) ||
        '';
      const uploadPreset =
        process.env.REACT_APP_CLOUDINARY_UPLOAD_PRESET ||
        (typeof window !== 'undefined' && window.CLOUDINARY_UPLOAD_PRESET) ||
        (typeof localStorage !== 'undefined' && localStorage.getItem('CLOUDINARY_UPLOAD_PRESET')) ||
        '';
      if (!cloudName || !uploadPreset) {
        const missing = [
          !cloudName ? 'REACT_APP_CLOUDINARY_CLOUD_NAME' : null,
          !uploadPreset ? 'REACT_APP_CLOUDINARY_UPLOAD_PRESET' : null,
        ].filter(Boolean).join(', ');
        if (process.env.NODE_ENV !== 'production') {
          // Helpful hint in dev
          // eslint-disable-next-line no-console
          console.warn('Cloudinary env check (dev):', { cloudName, uploadPreset, missing, source: 'env|window|localStorage' });
        }
        throw new Error(`Cloudinary is not configured. Missing: ${missing}. You can set them in Frontend/.env or temporarily via browser console: window.CLOUDINARY_CLOUD_NAME='your_cloud'; window.CLOUDINARY_UPLOAD_PRESET='your_preset'; then retry.`);
      }

      // Create a unique public_id for the image
      const timestamp = Date.now();
      const publicId = `${productId}_${timestamp}`;

      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', uploadPreset);
      formData.append('folder', folder);
      formData.append('public_id', publicId);
      // Some optional transformations for web-friendly images
      // Note: For unsigned uploads, transformations usually apply on delivery (via URL). Here we keep upload simple.

      const endpoint = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
      const res = await fetch(endpoint, {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error?.message || `Cloudinary upload failed with status ${res.status}`);
      }
      const data = await res.json();
      return data.secure_url;
    } catch (error) {
      console.error('Error uploading product image to Cloudinary:', error);
      throw new Error(`Failed to upload image: ${error.message}`);
    }
  }

  /**
   * Convenience helper for flash sale images (uploads to 'flash-sale' folder)
   */
  async uploadFlashImage(file, productId) {
    return this.uploadProductImage(file, productId, 'flashsale');
  }

  /**
   * Delete a product image from Cloudinary (not supported from client without a secure backend).
   * This is a no-op on the client to avoid exposing secrets. Consider implementing a secure backend endpoint.
   * @param {string} imageUrl - The URL of the image to delete
   * @returns {Promise<void>}
   */
  async deleteProductImage(imageUrl) {
    console.warn('deleteProductImage is not supported on the client. Implement a secure backend to delete Cloudinary assets. URL:', imageUrl);
  }

  // Listing images via Admin API is not safe from the client; omit in frontend.

  /**
   * Convert file to base64 string for Cloudinary upload
   * @param {File} file - The file to convert
   * @returns {Promise<string>} - Base64 string
   */
  fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  }

  /**
   * Generate a preview URL for an image file (before upload)
   * @param {File} file - The image file
   * @returns {string} - Object URL for preview
   */
  createPreviewUrl(file) {
    if (!file) return null;
    return URL.createObjectURL(file);
  }

  /**
   * Clean up an object URL created for preview
   * @param {string} previewUrl
   */
  revokePreviewUrl(previewUrl) {
    if (previewUrl && typeof previewUrl === 'string') {
      try {
        URL.revokeObjectURL(previewUrl);
      } catch (_) {
        // ignore
      }
    }
  }

  /**
   * Validate image file
   * @param {File} file - The file to validate
   * @returns {object} - Validation result with isValid and error message
   */
  validateImageFile(file) {
    const maxSize = 10 * 1024 * 1024; // 10MB for Cloudinary (more flexible than Firebase)
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];

    if (!file) {
      return { isValid: false, error: 'No file selected' };
    }

    if (!allowedTypes.includes(file.type)) {
      return {
        isValid: false,
        error: 'Invalid file type. Only JPEG, PNG, WebP, and GIF images are allowed'
      };
    }

    if (file.size > maxSize) {
      return {
        isValid: false,
        error: 'File size too large. Maximum size is 10MB'
      };
    }

    return { isValid: true };
  }
}

// Create and export a singleton instance
const storageService = new StorageService();
export default storageService;
