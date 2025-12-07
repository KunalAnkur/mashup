/**
 * Generate a thumbnail from a video file
 * @param file - The video file to generate thumbnail from
 * @param time - Time in seconds to capture (default: 1 second)
 * @param width - Thumbnail width in pixels (default: 50)
 * @param height - Thumbnail height in pixels (default: 80)
 * @returns Promise<Blob | null> - Blob of the thumbnail image
 */
export const generateVideoThumbnail = async (
  file: File,
  time: number = 1,
  width: number = 80,
  height: number = 50
): Promise<Blob | null> => {
  return new Promise((resolve) => {
    // Check if file is a video (check both MIME type and file extension)
    const isVideo = file.type.startsWith('video/') || 
                    /\.(mp4|mkv|webm|avi|mov|mpeg|mpg|3gp|wmv|flv|m3u8)$/i.test(file.name);
    
    if (!isVideo) {
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

    // Set up video element with better compatibility
    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;
    video.crossOrigin = 'anonymous'; // Help with CORS issues
    video.setAttribute('webkit-playsinline', 'true');
    video.setAttribute('playsinline', 'true');

    // Create object URL for the video file
    const url = URL.createObjectURL(file);
    
    let resolved = false;
    let timeoutId: NodeJS.Timeout | null = null;
    const TIMEOUT = 10000; // 10 second timeout

    const cleanup = () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      URL.revokeObjectURL(url);
      video.remove();
      canvas.remove();
    };

    const resolveOnce = (result: Blob | null) => {
      if (resolved) return;
      resolved = true;
      cleanup();
      resolve(result);
    };

    // Set timeout to prevent hanging
    timeoutId = setTimeout(() => {
      console.warn(`Thumbnail generation timeout for ${file.name}`);
      resolveOnce(null);
    }, TIMEOUT);

    // Set thumbnail dimensions (small size for performance)
    const THUMBNAIL_WIDTH = width;
    const THUMBNAIL_HEIGHT = height;

    // Try multiple time positions if the first one fails
    const tryCaptureAtTime = (targetTime: number, attempt: number = 0) => {
      if (resolved) return;

      try {
        // Always use fixed thumbnail dimensions (50x80)
        canvas.width = THUMBNAIL_WIDTH;
        canvas.height = THUMBNAIL_HEIGHT;

        // Seek to the target time
        const seekTime = Math.min(Math.max(targetTime, 0), video.duration || 1);
        video.currentTime = seekTime;
      } catch (error) {
        console.error(`Error seeking video for ${file.name}:`, error);
        // Try a different time position
        if (attempt < 3) {
          setTimeout(() => tryCaptureAtTime(targetTime + 0.5, attempt + 1), 500);
        } else {
          resolveOnce(null);
        }
      }
    };

    video.onloadedmetadata = () => {
      if (resolved) return;
      
      const duration = video.duration;
      const videoWidth = video.videoWidth;
      const videoHeight = video.videoHeight;

      console.log(`Video metadata loaded for ${file.name}:`, {
        duration,
        videoWidth,
        videoHeight,
        type: file.type,
        thumbnailSize: `${THUMBNAIL_WIDTH}x${THUMBNAIL_HEIGHT}`
      });

      // If duration is invalid or very short, try at 0
      const targetTime = (duration && duration > 0 && !isNaN(duration)) 
        ? Math.min(time, duration * 0.1) // Use 10% of duration or specified time, whichever is smaller
        : 0;

      // Set canvas to fixed thumbnail dimensions (50x80)
      canvas.width = THUMBNAIL_WIDTH;
      canvas.height = THUMBNAIL_HEIGHT;

      // Try to capture at the target time
      tryCaptureAtTime(targetTime);
    };

    video.onseeked = () => {
      if (resolved) return;

      try {
        // Ensure canvas is set to thumbnail dimensions
        canvas.width = THUMBNAIL_WIDTH;
        canvas.height = THUMBNAIL_HEIGHT;

        // Draw the video frame to canvas, scaling to thumbnail size
        // This will scale the video frame to fit the 50x80 thumbnail while maintaining aspect ratio
        const videoWidth = video.videoWidth;
        const videoHeight = video.videoHeight;
        
        if (videoWidth > 0 && videoHeight > 0) {
          // Calculate scaling to fit thumbnail dimensions while maintaining aspect ratio
          const scale = Math.min(THUMBNAIL_WIDTH / videoWidth, THUMBNAIL_HEIGHT / videoHeight);
          const scaledWidth = videoWidth * scale;
          const scaledHeight = videoHeight * scale;
          const x = (THUMBNAIL_WIDTH - scaledWidth) / 2;
          const y = (THUMBNAIL_HEIGHT - scaledHeight) / 2;
          
          // Fill background with black
          ctx.fillStyle = '#000000';
          ctx.fillRect(0, 0, THUMBNAIL_WIDTH, THUMBNAIL_HEIGHT);
          
          // Draw video frame centered and scaled
          ctx.drawImage(video, x, y, scaledWidth, scaledHeight);
        } else {
          // Fallback: draw video at thumbnail size
          ctx.drawImage(video, 0, 0, THUMBNAIL_WIDTH, THUMBNAIL_HEIGHT);
        }
        
        // Convert canvas to Blob instead of data URL
        canvas.toBlob((blob) => {
          if (blob && blob.size > 0) {
            console.log(`Thumbnail generated successfully for ${file.name} (${THUMBNAIL_WIDTH}x${THUMBNAIL_HEIGHT})`);
            resolveOnce(blob);
          } else {
            // Retry with a different time if thumbnail is invalid
            const duration = video.duration;
            if (duration && duration > 1) {
              setTimeout(() => tryCaptureAtTime(duration * 0.5, 1), 500);
            } else {
              resolveOnce(null);
            }
          }
        }, 'image/jpeg', 0.7);
      } catch (error) {
        console.error(`Error drawing thumbnail for ${file.name}:`, error);
        // Try a different time position
        const duration = video.duration;
        if (duration && duration > 1) {
          setTimeout(() => tryCaptureAtTime(duration * 0.5, 1), 500);
        } else {
          resolveOnce(null);
        }
      }
    };

    video.onerror = (e) => {
      if (resolved) return;
      console.error(`Error loading video ${file.name} for thumbnail:`, e, {
        error: video.error,
        code: video.error?.code,
        message: video.error?.message
      });
      resolveOnce(null);
    };

    // Handle case where video can play but metadata might not load
    video.oncanplay = () => {
      if (resolved) return;
      // If metadata hasn't loaded but video can play, try to capture at current time
      if (!video.videoWidth || !video.videoHeight) {
        setTimeout(() => {
          if (!resolved && video.readyState >= 2) {
            tryCaptureAtTime(0);
          }
        }, 1000);
      }
    };

    // Load the video
    video.src = url;
    video.load(); // Explicitly call load to ensure video starts loading
  });
};

/**
 * Generate thumbnails for multiple video files
 * @param files - Array of files to generate thumbnails for
 * @returns Promise<Record<string, Blob>> - Map of file name to thumbnail Blob
 */
export const generateVideoThumbnails = async (
  files: File[]
): Promise<Record<string, Blob>> => {
  const thumbnails: Record<string, Blob> = {};

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

