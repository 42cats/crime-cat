import React from 'react';

interface PostImageSectionProps {
  imageUrls: string[];
  currentIndex: number;
  handlePrevImage: () => void;
  handleNextImage: () => void;
}

const PostImageSection: React.FC<PostImageSectionProps> = ({
  imageUrls,
  currentIndex,
  handlePrevImage,
  handleNextImage
}) => {
  // 이미지가 없는 경우 플레이스홀더 표시
  if (!imageUrls || imageUrls.length === 0) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center text-white">
        <p className="text-gray-400">이미지가 없는 포스트입니다.</p>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full flex items-center justify-center">
      <img
        src={imageUrls[currentIndex]}
        alt={`포스트 이미지 ${currentIndex + 1}`}
        className="max-h-full max-w-full object-contain"
      />

      {/* 이미지가 2개 이상인 경우 네비게이션 버튼 표시 */}
      {imageUrls.length > 1 && (
        <>
          <button
            onClick={handlePrevImage}
            className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/30 text-white p-2 rounded-full"
          >
            &lt;
          </button>
          <button
            onClick={handleNextImage}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/30 text-white p-2 rounded-full"
          >
            &gt;
          </button>

          {/* 이미지 인디케이터 */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
            {imageUrls.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full ${
                  index === currentIndex
                    ? "bg-white"
                    : "bg-white/50"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default PostImageSection;