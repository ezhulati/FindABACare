import { useState, useMemo } from 'react';

interface PhotoGalleryProps {
  photos: string[];
  venueName: string;
}

// Derive Supabase Storage base URL from the public env var
const SUPABASE_URL = import.meta.env.PUBLIC_SUPABASE_URL || 'https://gvfkyfzukwnjomksuvaq.supabase.co';
const SUPABASE_STORAGE = `${SUPABASE_URL}/storage/v1/object/public`;

// Convert photo URL to full Supabase Storage URL if it's a relative path
const getPhotoUrl = (photoKey: string): string => {
  // If it's already a full URL (starts with http/https), return as-is
  if (photoKey.startsWith('http://') || photoKey.startsWith('https://')) {
    return photoKey;
  }

  // If it's a relative path starting with /venue-photos/, convert to Supabase Storage URL
  if (photoKey.startsWith('/venue-photos/')) {
    const filename = photoKey.replace('/venue-photos/', '');
    return `${SUPABASE_STORAGE}/venue-photos/${filename}`;
  }

  // Otherwise, assume it's a relative public path
  return photoKey;
};

export default function PhotoGallery({ photos, venueName }: PhotoGalleryProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Convert all photo URLs once when component mounts
  const photoUrls = useMemo(() => photos.map(getPhotoUrl), [photos]);

  const openLightbox = (index: number) => {
    setCurrentIndex(index);
    setLightboxOpen(true);
    document.body.style.overflow = 'hidden';
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
    document.body.style.overflow = 'auto';
  };

  const nextPhoto = () => {
    setCurrentIndex((prev) => (prev + 1) % photoUrls.length);
  };

  const prevPhoto = () => {
    setCurrentIndex((prev) => (prev - 1 + photoUrls.length) % photoUrls.length);
  };

  return (
    <>
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 p-2">
          {photoUrls.map((photoUrl, index) => (
            <div
              key={index}
              className="aspect-video relative overflow-hidden rounded-lg cursor-pointer group"
              onClick={() => openLightbox(index)}
            >
              <img
                src={photoUrl}
                alt={`${venueName} - Photo ${index + 1}`}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                loading={index < 4 ? 'eager' : 'lazy'}
              />
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-opacity duration-300 flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"
                  />
                </svg>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Lightbox */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-50 bg-black bg-opacity-95 flex items-center justify-center"
          onClick={closeLightbox}
        >
          <button
            className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors"
            onClick={closeLightbox}
            aria-label="Close lightbox"
          >
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>

          {photoUrls.length > 1 && (
            <>
              <button
                className="absolute left-4 text-white hover:text-gray-300 transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  prevPhoto();
                }}
                aria-label="Previous photo"
              >
                <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>

              <button
                className="absolute right-4 text-white hover:text-gray-300 transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  nextPhoto();
                }}
                aria-label="Next photo"
              >
                <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            </>
          )}

          <div
            className="max-w-5xl max-h-[90vh] relative"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={photoUrls[currentIndex]}
              alt={`${venueName} - Photo ${currentIndex + 1}`}
              className="max-w-full max-h-[90vh] object-contain"
            />
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-75 text-white px-4 py-2 rounded-full text-sm">
              {currentIndex + 1} / {photoUrls.length}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
