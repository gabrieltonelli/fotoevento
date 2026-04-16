/**
 * Resizes an image on the client side to avoid uploading huge files.
 * @param {File} file - The original image file
 * @param {Object} options - Resize options
 * @returns {Promise<File>} - The resized image file
 */
export async function resizeImage(file, { 
    maxWidth = Number(import.meta.env.VITE_MAX_IMAGE_WIDTH) || 1200, 
    maxHeight = Number(import.meta.env.VITE_MAX_IMAGE_HEIGHT) || 1200, 
    quality = 0.8 
} = {}) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                // Calculate new dimensions
                if (width > height) {
                    if (width > maxWidth) {
                        height *= maxWidth / width;
                        width = maxWidth;
                    }
                } else {
                    if (height > maxHeight) {
                        width *= maxHeight / height;
                        height = maxHeight;
                    }
                }

                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                // Convert to blob
                canvas.toBlob(
                    (blob) => {
                        if (blob) {
                            const resizedFile = new File([blob], file.name, {
                                type: file.type,
                                lastModified: Date.now(),
                            });
                            resolve(resizedFile);
                        } else {
                            reject(new Error('Canvas toBlob failed'));
                        }
                    },
                    file.type,
                    quality
                );
            };
            img.onerror = () => reject(new Error('Failed to load image'));
        };
        reader.onerror = () => reject(new Error('Failed to read file'));
    });
}
