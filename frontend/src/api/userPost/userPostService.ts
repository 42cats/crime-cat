import { apiClient } from "@/lib/api";

export interface UserPostGalleryDto {
    postId: string;
    authorNickname: string;
    thumbnailUrl: string | null; // 0번째 이미지 또는 null
    content: string;
    likeCount: number;
    liked: boolean;
    hashTags?: string[]; // 해시태그 추가
    locationName?: string; // 위치 정보 추가
}

export interface UserPostDto {
    authorId: string;
    postId: string;
    content: string;
    authorNickname: string;
    authorAvatarUrl: string;
    imageUrls: string[];
    likeCount: number;
    liked: boolean;
    createdAt: string;
    hashTags?: string[]; // 해시태그 추가
    locationName?: string; // 위치 정보 추가
    locationId?: string; // 위치 ID 추가
    latitude?: number; // 위도 추가
    longitude?: number; // 경도 추가
}

export interface UserPostGalleryPageDto {
    content: UserPostGalleryDto[];
    pageable: {
        pageNumber: number;
        pageSize: number;
    };
    totalElements: number;
    totalPages: number;
}

// 위치 인터페이스
export interface Location {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
}

class UserPostService {
    // 특정 사용자의 포스트 갤러리 가져오기
    async getUserPosts(
        userId: string,
        page: number = 0,
        size: number = 12
    ): Promise<UserPostGalleryPageDto> {
        try {
            return await apiClient.get(`/public/user-posts/gallery/${userId}`, {
                params: {
                    page,
                    size,
                    sort: "LATEST", // 최신순 정렬
                },
                headers: {
                    Accept: "application/json",
                },
            });
        } catch (error) {
            console.error("사용자 포스트 갤러리 로드 실패:", error);
            return {
                content: [],
                pageable: { pageNumber: 0, pageSize: 12 },
                totalElements: 0,
                totalPages: 0,
            };
        }
    }

    // 특정 포스트 상세 정보 가져오기
    async getUserPostDetail(postId: string): Promise<UserPostDto> {
        try {
            return await apiClient.get(`/user-posts/${postId}`, {
                headers: {
                    Accept: "application/json",
                },
            });
        } catch (error) {
            console.error("포스트 상세 정보 로드 실패:", error);
            throw error;
        }
    }

    // 포스트 좋아요 토글
    async togglePostLike(postId: string): Promise<boolean> {
        try {
            return await apiClient.post(
                `/user-posts/${postId}/likes/toggle`,
                {},
                {
                    headers: {
                        Accept: "application/json",
                    },
                }
            );
        } catch (error) {
            console.error("포스트 좋아요 토글 실패:", error);
            throw error;
        }
    }

    // 현재 사용자가 특정 포스트에 좋아요 눌렀는지 확인
    async checkPostLike(postId: string): Promise<boolean> {
        try {
            return await apiClient.get(`/user-posts/${postId}/likes/me`, {
                headers: {
                    Accept: "application/json",
                },
            });
        } catch (error) {
            console.error("포스트 좋아요 확인 실패:", error);
            throw error;
        }
    }

    // 내 포스트 리스트 가져오기
    async getMyPosts(
        page: number = 0,
        size: number = 12,
        search?: string
    ): Promise<UserPostGalleryPageDto> {
        try {
            const params: any = {
                page,
                size,
                sort: "LATEST",
            };
            
            if (search && search.trim()) {
                params.search = search.trim();
            }
            
            return await apiClient.get("/user-posts/my", {
                params,
                headers: {
                    Accept: "application/json",
                },
            });
        } catch (error) {
            console.error("내 포스트 목록 로드 실패:", error);
            return {
                content: [],
                pageable: { pageNumber: 0, pageSize: 12 },
                totalElements: 0,
                totalPages: 0,
            };
        }
    }

    // 포스트 생성 (해시태그, 위치 정보, 비밀글 설정 포함)
    async createPost(
        content: string, 
        images?: File[],
        location?: Location | null,
        isPrivate?: boolean,
        isFollowersOnly?: boolean
    ): Promise<void> {
        try {
            console.log("포스트 생성 시작:", {
                content,
                imageCount: images?.length,
                location,
                isPrivate,
                isFollowersOnly
            });

            const formData = new FormData();
            formData.append("content", content);
            
            // 비밀글 설정
            formData.append("isPrivate", String(isPrivate || false));
            formData.append("isFollowersOnly", String(isFollowersOnly || false));

            // 이미지 추가
            if (images && images.length > 0) {
                // 이미지 파일 유효성 한번 더 검사
                const validImages = images.filter((img) =>
                    img.type.startsWith("image/")
                );

                console.log("올바른 이미지 파일:", validImages.length);

                validImages.forEach((image, index) => {
                    formData.append(
                        "images",
                        image,
                        `image_${index}.${image.name.split(".").pop()}`
                    );
                    // 파일명에 확장자 추가하여 서버에서 이미지 형식 인식 확실하게
                });
            }

            // 위치 정보 추가 (선택적)
            if (location) {
                formData.append("locationName", location.name);
                formData.append("locationId", location.id);
                formData.append("latitude", location.latitude.toString());
                formData.append("longitude", location.longitude.toString());
            }

            // FormData 내용 로깅 (디버깅용)
            const formDataEntries = [...formData.entries()];
            console.log(
                "FormData 내용:",
                formDataEntries.map((entry) => {
                    if (entry[1] instanceof File) {
                        return {
                            key: entry[0],
                            type: "File",
                            name: entry[1].name,
                            size: entry[1].size,
                        };
                    }
                    return { key: entry[0], value: entry[1] };
                })
            );

            await apiClient.post("/user-posts", formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });

            console.log("포스트 생성 성공");
        } catch (error) {
            console.error("포스트 생성 실패:", error);
            throw error;
        }
    }

    // 포스트 업데이트 (해시태그, 위치 정보, 비밀글 설정 포함)
    async updatePost(
        postId: string,
        content: string,
        newImages?: File[],
        keepImageUrls?: string[],
        location?: Location | null,
        isPrivate?: boolean,
        isFollowersOnly?: boolean
    ): Promise<void> {
        try {
            console.log("포스트 업데이트 시작:", {
                postId,
                content,
                newImagesCount: newImages?.length,
                keepImageUrls,
                location,
                isPrivate,
                isFollowersOnly
            });

            const formData = new FormData();
            formData.append("content", content);
            
            // 비밀글 설정
            formData.append("isPrivate", String(isPrivate || false));
            formData.append("isFollowersOnly", String(isFollowersOnly || false));

            // 유효한 이미지만 추가
            let validImages: File[] = [];
            if (newImages && newImages.length > 0) {
                validImages = newImages.filter((img) =>
                    img.type.startsWith("image/")
                );
                console.log("올바른 이미지 파일:", validImages.length);

                // 이미지 추가
                validImages.forEach((image, index) => {
                    // 파일명에 확장자 추가하여 서버에서 이미지 형식 인식 확실하게
                    const fileName = `image_${index}.${image.name
                        .split(".")
                        .pop()}`;
                    formData.append("newImages", image, fileName);
                });
            }

            // UUID 추가 - JSON 요소로 변환하여 추가
            if (validImages.length > 0) {
                const newImageIds = validImages.map(() => crypto.randomUUID());
                formData.append("newImageIds", JSON.stringify(newImageIds));
                console.log("newImageIds 추가:", newImageIds);
            }

            // 유지할 이미지 URL 추가
            if (keepImageUrls && keepImageUrls.length > 0) {
                // 배열로 JSON 직렬화하여 한번에 전송
                formData.append("keepImageUrls", JSON.stringify(keepImageUrls));
                console.log("keepImageUrls 추가:", keepImageUrls);
            }

            // 위치 정보 업데이트 (선택적)
            if (location) {
                formData.append("locationName", location.name);
                formData.append("locationId", location.id);
                formData.append("latitude", location.latitude.toString());
                formData.append("longitude", location.longitude.toString());
            } else {
                // 위치 정보 제거 플래그
                formData.append("removeLocation", "true");
            }

            // FormData 내용 로깅 (디버깅용)
            const formDataEntries = [...formData.entries()];
            console.log(
                "FormData 내용:",
                formDataEntries.map((entry) => {
                    if (entry[1] instanceof File) {
                        return {
                            key: entry[0],
                            type: "File",
                            name: entry[1].name,
                            size: entry[1].size,
                        };
                    }
                    return { key: entry[0], value: entry[1] };
                })
            );

            await apiClient.patch(`/user-posts/${postId}/partial`, formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });

            console.log("포스트 업데이트 성공");
        } catch (error) {
            console.error("포스트 업데이트 실패:", error);
            throw error;
        }
    }

    // 포스트 삭제
    async deletePost(postId: string): Promise<void> {
        try {
            await apiClient.delete(`/user-posts/${postId}`);
        } catch (error) {
            console.error("포스트 삭제 실패:", error);
            throw error;
        }
    }
}

export const userPostService = new UserPostService();
