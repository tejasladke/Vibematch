export class CloudinaryService {
  /**
   * Uploads an image (base64 string, data URL, or remote URL) to Cloudinary
   * Falls back to returning the valid data URL / placeholder for development previews.
   */
  public static async uploadImage(
    imageData: string,
    folder: 'avatars' | 'plans' | 'chat' = 'plans'
  ): Promise<{ success: boolean; url: string; error?: string }> {
    if (!imageData) {
      return { success: false, url: '', error: 'No image data provided' };
    }

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    // Check if Cloudinary credentials are configured
    if (cloudName && apiKey && apiSecret) {
      try {
        console.log(`[Cloudinary] Uploading to folder: ${folder}...`);
        // Cloudinary API endpoint call
        const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
        const formData = new URLSearchParams();
        formData.append('file', imageData);
        formData.append('upload_preset', 'planmate_preset');
        formData.append('folder', `planmate/${folder}`);

        const response = await fetch(uploadUrl, {
          method: 'POST',
          body: formData,
        });

        if (response.ok) {
          const result = await response.json();
          return { success: true, url: result.secure_url };
        }
      } catch (err) {
        console.warn('[Cloudinary] Remote upload failed, using local/data URL fallback:', (err as Error).message);
      }
    }

    // Development fallback: If imageData is already a data URL or valid http(s) URL, use it directly
    return {
      success: true,
      url: imageData,
    };
  }
}
