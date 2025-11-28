/**
 * Generate a thumbnail from a video file
 * @param file - The video file to generate thumbnail from
 * @param time - Time in seconds to capture (default: 1 second)
 * @returns Promise<string> - Data URL of the thumbnail image
 */
export const generateVideoThumbnail = async (
  file: File,
  time: number = 1
): Promise<string | null> => {
  return new Promise((resolve) => {
    // Check if file is a video
    if (!file.type.startsWith('video/')) {
      resolve(null);
      return;
    }

    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      resolve(null);
      return;
    }

    // Set up video element
    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;

    // Create object URL for the video file
    const url = URL.createObjectURL(file);

    video.onloadedmetadata = () => {
      // Set canvas dimensions to match video
      canvas.width = video.videoWidth || 320;
      canvas.height = video.videoHeight || 240;

      // Seek to the specified time
      video.currentTime = Math.min(time, video.duration || 1);
    };

    video.onseeked = () => {
      try {
        // Draw the video frame to canvas
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Convert canvas to data URL
        const thumbnail = canvas.toDataURL('image/jpeg', 0.8);
        
        // Clean up
        URL.revokeObjectURL(url);
        video.remove();
        canvas.remove();
        
        resolve(thumbnail);
      } catch (error) {
        console.error('Error generating thumbnail:', error);
        URL.revokeObjectURL(url);
        video.remove();
        canvas.remove();
        resolve(null);
      }
    };

    video.onerror = () => {
      console.error('Error loading video for thumbnail');
      URL.revokeObjectURL(url);
      video.remove();
      canvas.remove();
      resolve(null);
    };

    // Load the video
    video.src = url;
  });
};

/**
 * Generate thumbnails for multiple video files
 * @param files - Array of files to generate thumbnails for
 * @returns Promise<Record<string, string>> - Map of file name to thumbnail data URL
 */
export const generateVideoThumbnails = async (
  files: File[]
): Promise<Record<string, string>> => {
  const thumbnails: Record<string, string> = {};

  await Promise.all(
    files.map(async (file) => {
      if (file.type.startsWith('video/')) {
        const thumbnail = await generateVideoThumbnail(file);
        if (thumbnail) {
          thumbnails[file.name] = thumbnail;
        }
      }
    })
  );

  return thumbnails;
};

