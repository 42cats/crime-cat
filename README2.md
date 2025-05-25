.
├── backend
│   └── backend
│   ├── bin
│   │   ├── default
│   │   ├── generated-sources
│   │   │   └── annotations
│   │   ├── generated-test-sources
│   │   │   └── annotations
│   │   ├── main
│   │   │   ├── application-local.yml
│   │   │   ├── application-prod.yml
│   │   │   ├── com
│   │   │   │   └── crimecat
│   │   │   │   └── backend
│   │   │   │   ├── admin
│   │   │   │   │   ├── controller
│   │   │   │   │   │   ├── AdminCommandController.class
│   │   │   │   │   │   └── AdminNoticeController.class
│   │   │   │   │   └── service
│   │   │   │   │   └── AdminService.class
│   │   │   │   ├── api
│   │   │   │   │   ├── AbstractApiService.class
│   │   │   │   │   ├── ApiBaseConfig.class
│   │   │   │   │   ├── discord
│   │   │   │   │   │   └── DiscordBotApi.class
│   │   │   │   │   └── naver
│   │   │   │   │   ├── api
│   │   │   │   │   │   └── NaverMapApi.class
│   │   │   │   │   └── controller
│   │   │   │   │   └── NaverMapController.class
│   │   │   │   ├── auth
│   │   │   │   │   ├── controller
│   │   │   │   │   │   ├── AuthController.class
│   │   │   │   │   │   └── CsrfController.class
│   │   │   │   │   ├── dto
│   │   │   │   │   │   └── DiscordTokenResponse.class
│   │   │   │   │   ├── filter
│   │   │   │   │   │   ├── DiscordBotTokenFilter.class
│   │   │   │   │   │   └── JwtAuthenticationFilter.class
│   │   │   │   │   ├── handler
│   │   │   │   │   │   ├── BaseOAuth2SuccessHandler.class
│   │   │   │   │   │   ├── CustomOAuth2SuccessHandler.class
│   │   │   │   │   │   ├── LoginSuccessHandler.class
│   │   │   │   │   │   └── SignupSuccessHandler.class
│   │   │   │   │   ├── jwt
│   │   │   │   │   │   └── JwtTokenProvider.class
│   │   │   │   │   └── service
│   │   │   │   │   ├── BaseDiscordOAuth2UserService.class
│   │   │   │   │   ├── DiscordLoginService.class
│   │   │   │   │   ├── DiscordOAuth2UserService.class
│   │   │   │   │   ├── DiscordSignupService.class
│   │   │   │   │   ├── JwtBlacklistService.class
│   │   │   │   │   └── RefreshTokenService.class
│   │   │   │   ├── BackendApplication.class
│   │   │   │   ├── boardPost
│   │   │   │   │   ├── controller
│   │   │   │   │   │   └── BoardPostController.class
│   │   │   │   │   ├── domain
│   │   │   │   │   │   ├── BoardPost.class
│   │   │   │   │   │   ├── BoardPost$BoardPostBuilder.class
│       │   │   │           │   │   ├── BoardPostLike.class
│       │   │   │           │   │   └── BoardPostLike$BoardPostLikeBuilder.class
│   │   │   │   │   ├── dto
│   │   │   │   │   │   ├── BoardPostResponse.class
│   │   │   │   │   │   └── BoardPostResponse$BoardPostResponseBuilder.class
│       │   │   │           │   ├── enums
│       │   │   │           │   │   ├── BoardType.class
│       │   │   │           │   │   └── PostType.class
│       │   │   │           │   ├── repository
│       │   │   │           │   │   ├── BoardPostLikeRepository.class
│       │   │   │           │   │   └── BoardPostRepository.class
│       │   │   │           │   ├── service
│       │   │   │           │   │   └── BoardPostService.class
│       │   │   │           │   └── sort
│       │   │   │           │       └── BoardPostSortType.class
│       │   │   │           ├── character
│       │   │   │           │   ├── controller
│       │   │   │           │   │   └── CharacterController.class
│       │   │   │           │   ├── domain
│       │   │   │           │   │   ├── Character.class
│       │   │   │           │   │   └── CharacterRole.class
│       │   │   │           │   ├── dto
│       │   │   │           │   │   ├── CharacterRoleResponseDto.class
│       │   │   │           │   │   ├── CharacterRolesByCharacterId.class
│       │   │   │           │   │   ├── CharactersFailedResponseDto.class
│       │   │   │           │   │   ├── CharactersResponseDto.class
│       │   │   │           │   │   ├── CharactersSuccessResponseDto.class
│       │   │   │           │   │   ├── DeleteCharacterFailedResponseDto.class
│       │   │   │           │   │   ├── DeleteCharacterResponseDto.class
│       │   │   │           │   │   ├── DeleteCharacterSuccessfulResponseDto.class
│       │   │   │           │   │   ├── SaveCharacterDto.class
│       │   │   │           │   │   ├── SaveCharacterFailedResponseDto.class
│       │   │   │           │   │   ├── SaveCharacterRequestDto.class
│       │   │   │           │   │   ├── SaveCharacterResponseDto.class
│       │   │   │           │   │   └── SaveCharacterSuccessfulResponseDto.class
│       │   │   │           │   ├── repository
│       │   │   │           │   │   ├── CharacterRepository.class
│       │   │   │           │   │   └── CharacterRoleRepository.class
│       │   │   │           │   └── service
│       │   │   │           │       ├── CharacterQueryService.class
│       │   │   │           │       ├── CharacterRoleQueryService.class
│       │   │   │           │       └── CharacterService.class
│       │   │   │           ├── command
│       │   │   │           │   ├── controller
│       │   │   │           │   │   └── CommandController.class
│       │   │   │           │   ├── domain
│       │   │   │           │   │   └── Command.class
│       │   │   │           │   ├── dto
│       │   │   │           │   │   ├── CommandDto.class
│       │   │   │           │   │   ├── CommandDto$CommandDtoBuilder.class
│   │   │   │   │   │   ├── CommandEditRequestDto.class
│   │   │   │   │   │   ├── CommandEditRequestDto$CommandEditRequestDtoBuilder.class
│       │   │   │           │   │   ├── CommandListResponseDto.class
│       │   │   │           │   │   ├── CommandListResponseDto$CommandListResponseDtoBuilder.class
│   │   │   │   │   │   ├── CommandRequestDto.class
│   │   │   │   │   │   ├── CommandRequestDto$CommandRequestDtoBuilder.class
│       │   │   │           │   │   ├── CommandSummaryDto.class
│       │   │   │           │   │   └── CommandSummaryDto$CommandSummaryDtoBuilder.class
│   │   │   │   │   ├── repository
│   │   │   │   │   │   └── CommandRepository.class
│   │   │   │   │   └── service
│   │   │   │   │   └── CommandService.class
│   │   │   │   ├── comment
│   │   │   │   │   ├── controller
│   │   │   │   │   │   ├── CommentController.class
│   │   │   │   │   │   └── CommentPublicController.class
│   │   │   │   │   ├── domain
│   │   │   │   │   │   ├── Comment.class
│   │   │   │   │   │   ├── Comment$CommentBuilder.class
│       │   │   │           │   │   ├── CommentLike.class
│       │   │   │           │   │   └── CommentLike$CommentLikeBuilder.class
│   │   │   │   │   ├── dto
│   │   │   │   │   │   ├── CommentRequest.class
│   │   │   │   │   │   ├── CommentRequest$CommentRequestBuilder.class
│       │   │   │           │   │   ├── CommentResponse.class
│       │   │   │           │   │   └── CommentResponse$CommentResponseBuilder.class
│   │   │   │   │   ├── repository
│   │   │   │   │   │   ├── CommentLikeRepository.class
│   │   │   │   │   │   └── CommentRepository.class
│   │   │   │   │   ├── service
│   │   │   │   │   │   └── CommentService.class
│   │   │   │   │   └── sort
│   │   │   │   │   └── CommentSortType.class
│   │   │   │   ├── common
│   │   │   │   │   └── dto
│   │   │   │   │   ├── MessageResponseDto.class
│   │   │   │   │   └── PageResponseDto.class
│   │   │   │   ├── config
│   │   │   │   │   ├── AdminProperties.class
│   │   │   │   │   ├── CacheConfig.class
│   │   │   │   │   ├── CacheType.class
│   │   │   │   │   ├── CorsConfig.class
│   │   │   │   │   ├── CsrfTokenConfig.class
│   │   │   │   │   ├── JpaConfig.class
│   │   │   │   │   ├── RedisConfig.class
│   │   │   │   │   ├── SecurityConfig.class
│   │   │   │   │   ├── SecurityConfig$DelegatingAuthenticationSuccessHandler.class
│       │   │   │           │   ├── SecurityConfig$DelegatingOAuth2UserService.class
│   │   │   │   │   ├── SecurityConfig$SpaCsrfTokenRequestHandler.class
│       │   │   │           │   ├── ServiceUrlConfig.class
│       │   │   │           │   └── WebConfig.class
│       │   │   │           ├── coupon
│       │   │   │           │   ├── controller
│       │   │   │           │   │   └── CouponController.class
│       │   │   │           │   ├── domain
│       │   │   │           │   │   └── Coupon.class
│       │   │   │           │   ├── dto
│       │   │   │           │   │   ├── CouponCreateRequestDto.class
│       │   │   │           │   │   ├── CouponListResponse.class
│       │   │   │           │   │   ├── CouponRedeemRequestDto.class
│       │   │   │           │   │   ├── CouponRedeemResponseDto.class
│       │   │   │           │   │   ├── CouponResponseDto.class
│       │   │   │           │   │   ├── MessageDto.class
│       │   │   │           │   │   └── WebCouponRequestDto.class
│       │   │   │           │   ├── repository
│       │   │   │           │   │   └── CouponRepository.class
│       │   │   │           │   └── service
│       │   │   │           │       └── CouponService.class
│       │   │   │           ├── exception
│       │   │   │           │   ├── ControllerException.class
│       │   │   │           │   ├── CrimeCatException.class
│       │   │   │           │   ├── DomainException.class
│       │   │   │           │   ├── ErrorResponse.class
│       │   │   │           │   ├── ErrorStatus.class
│       │   │   │           │   ├── ExceptionController.class
│       │   │   │           │   └── ServiceException.class
│       │   │   │           ├── follow
│       │   │   │           │   ├── controller
│       │   │   │           │   │   └── FollowController.class
│       │   │   │           │   ├── domain
│       │   │   │           │   │   ├── Follow.class
│       │   │   │           │   │   └── Follow$FollowBuilder.class
│   │   │   │   │   ├── dto
│   │   │   │   │   │   ├── FollowDto.class
│   │   │   │   │   │   └── FollowDto$FollowDtoBuilder.class
│       │   │   │           │   ├── repository
│       │   │   │           │   │   └── FollowRepository.class
│       │   │   │           │   └── service
│       │   │   │           │       └── FollowService.class
│       │   │   │           ├── gameHistory
│       │   │   │           │   ├── controller
│       │   │   │           │   │   ├── BotGameHistoryController.class
│       │   │   │           │   │   └── WebGameHistoryController.class
│       │   │   │           │   ├── domain
│       │   │   │           │   │   └── GameHistory.class
│       │   │   │           │   ├── dto
│       │   │   │           │   │   ├── CheckPlayResponseDto.class
│       │   │   │           │   │   ├── CheckPlayResponseDto$CheckPlayResponseDtoBuilder.class
│   │   │   │   │   │   ├── GameHistoryUpdateRequestDto.class
│   │   │   │   │   │   ├── IGameHistoryRankingDto.class
│   │   │   │   │   │   ├── SaveUserGameHistoryRequestDto.class
│   │   │   │   │   │   ├── SaveUserHistoryResponseDto.class
│   │   │   │   │   │   ├── UserGameHistoryDto.class
│   │   │   │   │   │   ├── UserGameHistoryFailedResponseDto.class
│   │   │   │   │   │   ├── UserGameHistoryResponseDto.class
│   │   │   │   │   │   ├── UserGameHistorySuccessResponseDto.class
│   │   │   │   │   │   ├── UserGameHistoryToOwnerDto.class
│   │   │   │   │   │   ├── UserGameHistoryToUserDto.class
│   │   │   │   │   │   ├── WebHistoryRequestDto.class
│   │   │   │   │   │   ├── WebHistoryResponseDto.class
│   │   │   │   │   │   └── WebHistoryResponseDto$WebHistoryResponseDtoBuilder.class
│       │   │   │           │   ├── repository
│       │   │   │           │   │   └── GameHistoryRepository.class
│       │   │   │           │   ├── service
│       │   │   │           │   │   ├── BotGameHistoryService.class
│       │   │   │           │   │   ├── GameHistoryQueryService.class
│       │   │   │           │   │   └── WebGameHistoryService.class
│       │   │   │           │   └── sort
│       │   │   │           │       └── GameHistorySortType.class
│       │   │   │           ├── gametheme
│       │   │   │           │   ├── controller
│       │   │   │           │   │   ├── GameThemeController.class
│       │   │   │           │   │   ├── GameThemePublicController.class
│       │   │   │           │   │   ├── MakerTeamController.class
│       │   │   │           │   │   └── MakerTeamPublicController.class
│       │   │   │           │   ├── domain
│       │   │   │           │   │   ├── CrimesceneTheme.class
│       │   │   │           │   │   ├── CrimesceneTheme$CrimesceneThemeBuilder.class
│   │   │   │   │   │   ├── CrimesceneTheme$CrimesceneThemeBuilderImpl.class
│       │   │   │           │   │   ├── GameTheme.class
│       │   │   │           │   │   ├── GameTheme$GameThemeBuilder.class
│   │   │   │   │   │   ├── GameTheme$GameThemeBuilderImpl.class
│       │   │   │           │   │   ├── GameThemeRecommendation.class
│       │   │   │           │   │   ├── GameThemeRecommendation$GameThemeRecommendationBuilder.class
│   │   │   │   │   │   ├── MakerTeam.class
│   │   │   │   │   │   ├── MakerTeam$MakerTeamBuilder.class
│       │   │   │           │   │   ├── MakerTeamMember.class
│       │   │   │           │   │   └── MakerTeamMember$MakerTeamMemberBuilder.class
│   │   │   │   │   ├── dto
│   │   │   │   │   │   ├── AddCrimesceneThemeRequest.class
│   │   │   │   │   │   ├── AddGameThemeRequest.class
│   │   │   │   │   │   ├── AddMemberRequest.class
│   │   │   │   │   │   ├── AuthorDto.class
│   │   │   │   │   │   ├── AuthorDto$AuthorDtoBuilder.class
│       │   │   │           │   │   ├── CreateTeamRequest.class
│       │   │   │           │   │   ├── CrimesceneThemeDetailDto.class
│       │   │   │           │   │   ├── CrimesceneThemeDetailDto$CrimesceneThemeDetailDtoBuilder.class
│   │   │   │   │   │   ├── CrimesceneThemeDetailDto$CrimesceneThemeDetailDtoBuilderImpl.class
│       │   │   │           │   │   ├── CrimesceneThemeDto.class
│       │   │   │           │   │   ├── CrimesceneThemeDto$CrimesceneThemeDtoBuilder.class
│   │   │   │   │   │   ├── CrimesceneThemeDto$CrimesceneThemeDtoBuilderImpl.class
│       │   │   │           │   │   ├── CrimesceneThemeSummeryDto.class
│       │   │   │           │   │   ├── CrimesceneThemeSummeryDto$CrimesceneThemeSummeryDtoBuilder.class
│   │   │   │   │   │   ├── CrimesceneThemeSummeryListDto.class
│   │   │   │   │   │   ├── CrimesceneThemeSummeryListDto$CrimesceneThemeSummeryListDtoBuilder.class
│       │   │   │           │   │   ├── DeleteMembersRequest.class
│       │   │   │           │   │   ├── DeleteMembersResponse.class
│       │   │   │           │   │   ├── DeleteMembersResponse$DeleteMembersResponseBuilder.class
│   │   │   │   │   │   ├── GameThemeDetailDto.class
│   │   │   │   │   │   ├── GameThemeDetailDto$GameThemeDetailDtoBuilder.class
│       │   │   │           │   │   ├── GameThemeDetailDto$GameThemeDetailDtoBuilderImpl.class
│   │   │   │   │   │   ├── GameThemeDto.class
│   │   │   │   │   │   ├── GameThemeDto$GameThemeDtoBuilder.class
│       │   │   │           │   │   ├── GameThemeDto$GameThemeDtoBuilderImpl.class
│   │   │   │   │   │   ├── GetGameThemeResponse.class
│   │   │   │   │   │   ├── GetGameThemeResponse$GetGameThemeResponseBuilder.class
│       │   │   │           │   │   ├── GetGameThemesResponse.class
│       │   │   │           │   │   ├── GetGameThemesResponse$GetGameThemesResponseBuilder.class
│   │   │   │   │   │   ├── GetLikeStatusResponse.class
│   │   │   │   │   │   ├── GetTeamResponse.class
│   │   │   │   │   │   ├── GetTeamResponse$GetTeamResponseBuilder.class
│       │   │   │           │   │   ├── GetTeamsResponse.class
│       │   │   │           │   │   ├── MemberDto.class
│       │   │   │           │   │   ├── MemberDto$MemberDtoBuilder.class
│   │   │   │   │   │   ├── MemberRequestDto.class
│   │   │   │   │   │   ├── TeamDto.class
│   │   │   │   │   │   ├── TeamDto$TeamDtoBuilder.class
│       │   │   │           │   │   ├── UpdateCrimesceneThemeRequest.class
│       │   │   │           │   │   ├── UpdateGameThemeRequest.class
│       │   │   │           │   │   └── UpdateMemberRequest.class
│       │   │   │           │   ├── enums
│       │   │   │           │   │   ├── ThemeType.class
│       │   │   │           │   │   ├── ThemeType$Numbers.class
│   │   │   │   │   │   └── ThemeType$Values.class
│       │   │   │           │   ├── repository
│       │   │   │           │   │   ├── CrimesceneThemeRepository.class
│       │   │   │           │   │   ├── GameThemeRecommendationRepository.class
│       │   │   │           │   │   ├── GameThemeRepository.class
│       │   │   │           │   │   ├── MakerTeamMemberRepository.class
│       │   │   │           │   │   └── MakerTeamRepository.class
│       │   │   │           │   ├── service
│       │   │   │           │   │   ├── GameThemeService.class
│       │   │   │           │   │   ├── MakerTeamService.class
│       │   │   │           │   │   └── ViewCountService.class
│       │   │   │           │   ├── sort
│       │   │   │           │   │   └── GameThemeSortType.class
│       │   │   │           │   ├── specification
│       │   │   │           │   │   └── GameThemeSpecification.class
│       │   │   │           │   └── validator
│       │   │   │           │       ├── MinMaxCheck.class
│       │   │   │           │       ├── MinMaxChecks.class
│       │   │   │           │       ├── MinMaxListValidator.class
│       │   │   │           │       └── MinMaxValidator.class
│       │   │   │           ├── guild
│       │   │   │           │   ├── controller
│       │   │   │           │   │   ├── bot
│       │   │   │           │   │   │   ├── ChannelCleanController.class
│       │   │   │           │   │   │   ├── ChannelRecordController.class
│       │   │   │           │   │   │   ├── GuildController.class
│       │   │   │           │   │   │   ├── GuildMusicController.class
│       │   │   │           │   │   │   ├── GuildObservationController.class
│       │   │   │           │   │   │   └── PasswordNoteController.class
│       │   │   │           │   │   └── web
│       │   │   │           │   │       ├── WebGuildController.class
│       │   │   │           │   │       └── WebPublicGuildController.class
│       │   │   │           │   ├── domain
│       │   │   │           │   │   ├── Clean.class
│       │   │   │           │   │   ├── Guild.class
│       │   │   │           │   │   ├── Music.class
│       │   │   │           │   │   ├── Observation.class
│       │   │   │           │   │   ├── PasswordNote.class
│       │   │   │           │   │   └── Record.class
│       │   │   │           │   ├── dto
│       │   │   │           │   │   ├── bot
│       │   │   │           │   │   │   ├── ChannelCleanDto.class
│       │   │   │           │   │   │   ├── ChannelCleanListDto.class
│       │   │   │           │   │   │   ├── ChannelRecordDto.class
│       │   │   │           │   │   │   ├── ChannelRecordListResponseDto.class
│       │   │   │           │   │   │   ├── ChannelRecordRequestDto.class
│       │   │   │           │   │   │   ├── GuildDto.class
│       │   │   │           │   │   │   ├── GuildDto$GuildDtoBuilder.class
│   │   │   │   │   │   │   ├── GuildMusicDeletedResponseDto.class
│   │   │   │   │   │   │   ├── GuildMusicDto.class
│   │   │   │   │   │   │   ├── GuildMusicListResponseDto.class
│   │   │   │   │   │   │   ├── GuildMusicRequestDto.class
│   │   │   │   │   │   │   ├── GuildResponseDto.class
│   │   │   │   │   │   │   ├── MessageDto.class
│   │   │   │   │   │   │   ├── MessageOnlyResponseDto.class
│   │   │   │   │   │   │   ├── ObservationDto.class
│   │   │   │   │   │   │   ├── ObservationPatchRequestDto.class
│   │   │   │   │   │   │   ├── ObservationPostRequestDto.class
│   │   │   │   │   │   │   ├── PasswordNoteDto.class
│   │   │   │   │   │   │   ├── PasswordNoteDto$PasswordNoteDtoBuilder.class
│       │   │   │           │   │   │   ├── PasswordNoteListResponseDto.class
│       │   │   │           │   │   │   ├── PasswordNoteListResponseDto$PasswordNoteListResponseDtoBuilder.class
│   │   │   │   │   │   │   ├── PasswordNoteResponseDto.class
│   │   │   │   │   │   │   ├── PasswordNoteResponseDto$PasswordNoteResponseDtoBuilder.class
│       │   │   │           │   │   │   ├── PatchPasswordNoteRequestDto.class
│       │   │   │           │   │   │   └── SavePasswordNoteRequestDto.class
│       │   │   │           │   │   └── web
│       │   │   │           │   │       ├── ApiGetGuildInfoDto.class
│       │   │   │           │   │       ├── ChannelDto.class
│       │   │   │           │   │       ├── GuildBotInfoDto.class
│       │   │   │           │   │       ├── GuildInfoResponseDto.class
│       │   │   │           │   │       ├── GuildInfoResponseDto$GuildInfoResponseDtoBuilder.class
│   │   │   │   │   │   ├── GuildResponseDto.class
│   │   │   │   │   │   ├── RoleDto.class
│   │   │   │   │   │   └── RoleTags.class
│   │   │   │   │   ├── exception
│   │   │   │   │   │   └── GuildAlreadyExistsException.class
│   │   │   │   │   ├── repository
│   │   │   │   │   │   ├── ChannelCleanRepository.class
│   │   │   │   │   │   ├── ChannelRecordRepository.class
│   │   │   │   │   │   ├── GuildMusicRepository.class
│   │   │   │   │   │   ├── GuildObservationRepository.class
│   │   │   │   │   │   ├── GuildRepository.class
│   │   │   │   │   │   └── PasswordNoteRepository.class
│   │   │   │   │   ├── service
│   │   │   │   │   │   ├── bot
│   │   │   │   │   │   │   ├── ChannelCleanService.class
│   │   │   │   │   │   │   ├── ChannelRecordService.class
│   │   │   │   │   │   │   ├── GuildMusicService.class
│   │   │   │   │   │   │   ├── GuildObservationService.class
│   │   │   │   │   │   │   ├── GuildQueryService.class
│   │   │   │   │   │   │   ├── GuildService.class
│   │   │   │   │   │   │   ├── PasswordNoteService.class
│   │   │   │   │   │   │   └── PasswordNoteServiceImpl.class
│   │   │   │   │   │   └── web
│   │   │   │   │   │   └── WebGuildService.class
│   │   │   │   │   └── utils
│   │   │   │   │   └── RequestUtil.class
│   │   │   │   ├── hashtag
│   │   │   │   │   ├── controller
│   │   │   │   │   │   └── HashTagController.class
│   │   │   │   │   ├── domain
│   │   │   │   │   │   ├── HashTag.class
│   │   │   │   │   │   ├── HashTag$HashTagBuilder.class
│       │   │   │           │   │   ├── PostHashTag.class
│       │   │   │           │   │   └── PostHashTag$PostHashTagBuilder.class
│   │   │   │   │   └── service
│   │   │   │   │   └── HashTagService.class
│   │   │   │   ├── init
│   │   │   │   │   └── AdminUserRunner.class
│   │   │   │   ├── messagemacro
│   │   │   │   │   ├── controller
│   │   │   │   │   │   ├── BotMessageMacroController.class
│   │   │   │   │   │   └── MessageMacroController.class
│   │   │   │   │   ├── domain
│   │   │   │   │   │   ├── Group.class
│   │   │   │   │   │   ├── Group$GroupBuilder.class
│       │   │   │           │   │   ├── GroupItem.class
│       │   │   │           │   │   ├── GroupItem$GroupItemBuilder.class
│   │   │   │   │   │   └── GroupItem$Type.class
│       │   │   │           │   ├── dto
│       │   │   │           │   │   ├── BotGroupResponseDto.class
│       │   │   │           │   │   ├── BotGroupResponseDto$BotGroupResponseDtoBuilder.class
│   │   │   │   │   │   ├── ButtonDto.class
│   │   │   │   │   │   ├── ButtonDto$ButtonDtoBuilder.class
│       │   │   │           │   │   ├── ContentDto.class
│       │   │   │           │   │   ├── ContentDto$ContentDtoBuilder.class
│   │   │   │   │   │   ├── GroupDto.class
│   │   │   │   │   │   ├── GroupDto$GroupDtoBuilder.class
│       │   │   │           │   │   ├── GroupItemRequestDto.class
│       │   │   │           │   │   ├── GroupItemRequestDto$GroupItemRequestDtoBuilder.class
│   │   │   │   │   │   ├── GroupRequestDto.class
│   │   │   │   │   │   └── GroupRequestDto$GroupRequestDtoBuilder.class
│       │   │   │           │   ├── repository
│       │   │   │           │   │   ├── GroupItemRepository.class
│       │   │   │           │   │   └── GroupRepository.class
│       │   │   │           │   └── service
│       │   │   │           │       └── MessageMacroService.class
│       │   │   │           ├── notice
│       │   │   │           │   ├── controller
│       │   │   │           │   │   └── NoticeController.class
│       │   │   │           │   ├── domain
│       │   │   │           │   │   ├── Notice.class
│       │   │   │           │   │   ├── Notice$NoticeBuilder.class
│   │   │   │   │   │   └── NoticeType.class
│   │   │   │   │   ├── dto
│   │   │   │   │   │   ├── NoticeReorderRequestDto.class
│   │   │   │   │   │   ├── NoticeRequestDto.class
│   │   │   │   │   │   ├── NoticeRequestDto$NoticeRequestDtoBuilder.class
│       │   │   │           │   │   ├── NoticeResponseDto.class
│       │   │   │           │   │   ├── NoticeResponseDto$NoticeResponseDtoBuilder.class
│   │   │   │   │   │   ├── NoticeSummaryResponseDto.class
│   │   │   │   │   │   ├── NoticeSummaryResponseDto$NoticeSummaryResponseDtoBuilder.class
│       │   │   │           │   │   └── PageResultDto.class
│       │   │   │           │   ├── repository
│       │   │   │           │   │   └── NoticeRepository.class
│       │   │   │           │   └── service
│       │   │   │           │       └── NoticeService.class
│       │   │   │           ├── notification
│       │   │   │           │   ├── builder
│       │   │   │           │   │   ├── FriendRequestBuilder.class
│       │   │   │           │   │   ├── GameRecordRequestBuilder.class
│       │   │   │           │   │   ├── GameRecordResponseBuilder.class
│       │   │   │           │   │   ├── NewThemeBuilder.class
│       │   │   │           │   │   ├── NotificationBuilder.class
│       │   │   │           │   │   ├── NotificationBuilders.class
│       │   │   │           │   │   └── SystemNotificationBuilder.class
│       │   │   │           │   ├── config
│       │   │   │           │   │   └── NotificationTemplateConfiguration.class
│       │   │   │           │   ├── controller
│       │   │   │           │   │   └── NotificationController.class
│       │   │   │           │   ├── domain
│       │   │   │           │   │   ├── Notification.class
│       │   │   │           │   │   └── Notification$NotificationBuilder.class
│   │   │   │   │   ├── dto
│   │   │   │   │   │   ├── request
│   │   │   │   │   │   │   ├── GameRecordAcceptDto.class
│   │   │   │   │   │   │   └── GameRecordDeclineDto.class
│   │   │   │   │   │   └── response
│   │   │   │   │   │   ├── NotificationDto.class
│   │   │   │   │   │   ├── NotificationDto$NotificationDtoBuilder.class
│       │   │   │           │   │       ├── NotificationListDto.class
│       │   │   │           │   │       └── NotificationListDto$NotificationListDtoBuilder.class
│   │   │   │   │   ├── enums
│   │   │   │   │   │   ├── NotificationStatus.class
│   │   │   │   │   │   └── NotificationType.class
│   │   │   │   │   ├── event
│   │   │   │   │   │   ├── GameRecordRequestEvent.class
│   │   │   │   │   │   ├── GameRecordResponseEvent.class
│   │   │   │   │   │   ├── NewThemeEvent.class
│   │   │   │   │   │   ├── NotificationEvent.class
│   │   │   │   │   │   ├── NotificationEventPublisher.class
│   │   │   │   │   │   ├── SystemNotificationEvent.class
│   │   │   │   │   │   ├── SystemNotificationEvent$Priority.class
│       │   │   │           │   │   └── SystemNotificationEvent$SystemNotificationType.class
│   │   │   │   │   ├── handler
│   │   │   │   │   │   ├── AbstractNotificationHandler.class
│   │   │   │   │   │   ├── GameRecordRequestHandler.class
│   │   │   │   │   │   └── NotificationHandler.class
│   │   │   │   │   ├── listener
│   │   │   │   │   │   ├── NotificationAsyncConfig.class
│   │   │   │   │   │   └── NotificationEventListener.class
│   │   │   │   │   ├── repository
│   │   │   │   │   │   └── NotificationRepository.class
│   │   │   │   │   ├── service
│   │   │   │   │   │   ├── NotificationHandlerService.class
│   │   │   │   │   │   └── NotificationService.class
│   │   │   │   │   ├── sort
│   │   │   │   │   │   └── NotificationSortType.class
│   │   │   │   │   ├── template
│   │   │   │   │   │   ├── AbstractHandlebarsNotificationTemplate.class
│   │   │   │   │   │   ├── HandlebarsMessageRenderer.class
│   │   │   │   │   │   ├── impl
│   │   │   │   │   │   │   ├── GameRecordRequestTemplate.class
│   │   │   │   │   │   │   ├── GameRecordResponseTemplate.class
│   │   │   │   │   │   │   └── SystemNotificationTemplate.class
│   │   │   │   │   │   ├── NotificationTemplate.class
│   │   │   │   │   │   ├── TemplateRegistry.class
│   │   │   │   │   │   ├── TemplateRegistry$DefaultNotificationTemplate.class
│       │   │   │           │   │   ├── TemplateService.class
│       │   │   │           │   │   ├── TemplateService$RenderedTemplate.class
│   │   │   │   │   │   └── TypedNotificationTemplate.class
│   │   │   │   │   └── utils
│   │   │   │   │   └── JsonUtil.class
│   │   │   │   ├── permission
│   │   │   │   │   ├── controller
│   │   │   │   │   │   ├── PermissionController.class
│   │   │   │   │   │   └── WebUserPermissionController.class
│   │   │   │   │   ├── domain
│   │   │   │   │   │   └── Permission.class
│   │   │   │   │   ├── dto
│   │   │   │   │   │   ├── AllPermissionsWithUserStatusResponseDto.class
│   │   │   │   │   │   ├── DeletePermissionResponseDto.class
│   │   │   │   │   │   ├── ModifyPermissionRequestDto.class
│   │   │   │   │   │   ├── ModifyPermissionResponseDto.class
│   │   │   │   │   │   ├── PermissionExtendResponseDto.class
│   │   │   │   │   │   ├── PermissionPurchaseDataDto.class
│   │   │   │   │   │   ├── PermissionPurchaseDataDto$PermissionPurchaseDataDtoBuilder.class
│       │   │   │           │   │   ├── PermissionPurchaseResponseDto.class
│       │   │   │           │   │   ├── PermissionPurchaseResponseDto$PermissionPurchaseResponseDtoBuilder.class
│   │   │   │   │   │   ├── PermissionPurchaseWebRequestDto.class
│   │   │   │   │   │   ├── PermissionsResponseDto.class
│   │   │   │   │   │   ├── PermissionWithStatusDto.class
│   │   │   │   │   │   ├── PermissionWithStatusDto$PermissionWithStatusDtoBuilder.class
│       │   │   │           │   │   ├── SavePermissionRequestDto.class
│       │   │   │           │   │   └── SavePermissionResponseDto.class
│       │   │   │           │   ├── repository
│       │   │   │           │   │   └── PermissionRepository.class
│       │   │   │           │   └── service
│       │   │   │           │       ├── PermissionQueryService.class
│       │   │   │           │       ├── PermissionService.class
│       │   │   │           │       └── WebUserPermissionService.class
│       │   │   │           ├── point
│       │   │   │           │   ├── controller
│       │   │   │           │   │   └── PointHistoryController.class
│       │   │   │           │   ├── domain
│       │   │   │           │   │   ├── ItemType.class
│       │   │   │           │   │   ├── PointHistory.class
│       │   │   │           │   │   ├── PointHistory$PointHistoryBuilder.class
│   │   │   │   │   │   └── TransactionType.class
│   │   │   │   │   ├── dto
│   │   │   │   │   │   ├── PointHistoryResponseDto.class
│   │   │   │   │   │   ├── PointHistoryResponseDto$PointHistoryResponseDtoBuilder.class
│       │   │   │           │   │   ├── PointHistorySummaryDto.class
│       │   │   │           │   │   └── PointHistorySummaryDto$PointHistorySummaryDtoBuilder.class
│   │   │   │   │   ├── repository
│   │   │   │   │   │   └── PointHistoryRepository.class
│   │   │   │   │   ├── service
│   │   │   │   │   │   ├── PointHistoryQueryService.class
│   │   │   │   │   │   └── PointHistoryService.class
│   │   │   │   │   └── sort
│   │   │   │   │   └── PointHistorySortType.class
│   │   │   │   ├── postComment
│   │   │   │   │   ├── domain
│   │   │   │   │   │   ├── PostComment.class
│   │   │   │   │   │   ├── PostComment$PostCommentBuilder.class
│       │   │   │           │   │   ├── PostCommentLike.class
│       │   │   │           │   │   └── PostCommentLike$PostCommentLikeBuilder.class
│   │   │   │   │   └── repository
│   │   │   │   │   └── PostCommentRepository.class
│   │   │   │   ├── stats
│   │   │   │   │   ├── controller
│   │   │   │   │   │   ├── WebPersonalInfo.class
│   │   │   │   │   │   └── WebStatsInfo.class
│   │   │   │   │   ├── proxy
│   │   │   │   │   │   └── WebStatsInfoServiceProxy.class
│   │   │   │   │   └── service
│   │   │   │   │   └── WebStatsInfoService.class
│   │   │   │   ├── storage
│   │   │   │   │   ├── FileSystemStorageService.class
│   │   │   │   │   ├── StorageFileType.class
│   │   │   │   │   ├── StorageProperties.class
│   │   │   │   │   └── StorageService.class
│   │   │   │   ├── user
│   │   │   │   │   ├── controller
│   │   │   │   │   │   └── UserController.class
│   │   │   │   │   ├── domain
│   │   │   │   │   │   ├── DiscordUser.class
│   │   │   │   │   │   ├── User.class
│   │   │   │   │   │   ├── User$UserBuilder.class
│       │   │   │           │   │   └── UserPermission.class
│       │   │   │           │   ├── dto
│       │   │   │           │   │   ├── TotalGuildRankingByPlayCountDto.class
│       │   │   │           │   │   ├── TotalUserRankingByMakerDto.class
│       │   │   │           │   │   ├── TotalUserRankingByPlayTimeDto.class
│       │   │   │           │   │   ├── TotalUserRankingByPointDto.class
│       │   │   │           │   │   ├── TotalUserRankingDto.class
│       │   │   │           │   │   ├── TotalUserRankingFailedResponseDto.class
│       │   │   │           │   │   ├── TotalUserRankingResponseDto.class
│       │   │   │           │   │   ├── TotalUserRankingSuccessResponseDto.class
│       │   │   │           │   │   ├── UserDbInfoDto.class
│       │   │   │           │   │   ├── UserDbInfoDto$UserDbInfoDtoBuilder.class
│   │   │   │   │   │   ├── UserDbInfoResponseDto.class
│   │   │   │   │   │   ├── UserGrantedPermissionDto.class
│   │   │   │   │   │   ├── UserGrantedPermissionDto$UserGrantedPermissionDtoBuilder.class
│       │   │   │           │   │   ├── UserGrantedPermissionResponseDto.class
│       │   │   │           │   │   ├── UserHasPermissionResponseDto.class
│       │   │   │           │   │   ├── UserInfoRequestDto.class
│       │   │   │           │   │   ├── UserInfoResponseDto.class
│       │   │   │           │   │   ├── UserListResponseDto.class
│       │   │   │           │   │   ├── UserPatchDto.class
│       │   │   │           │   │   ├── UserPatchRequestDto.class
│       │   │   │           │   │   ├── UserPatchResponseDto.class
│       │   │   │           │   │   ├── UserPermissionPurchaseDto.class
│       │   │   │           │   │   ├── UserPermissionPurchaseFailedResponseDto.class
│       │   │   │           │   │   ├── UserPermissionPurchaseRequestDto.class
│       │   │   │           │   │   ├── UserPermissionPurchaseResponseDto.class
│       │   │   │           │   │   ├── UserPermissionPurchaseSuccessResponseDto.class
│       │   │   │           │   │   ├── UserRankingFailedResponseDto.class
│       │   │   │           │   │   ├── UserRankingResponseDto.class
│       │   │   │           │   │   ├── UserRankingSuccessResponseDto.class
│       │   │   │           │   │   └── UserResponseDto.class
│       │   │   │           │   ├── repository
│       │   │   │           │   │   ├── DiscordUserRepository.class
│       │   │   │           │   │   ├── UserPermissionRepository.class
│       │   │   │           │   │   └── UserRepository.class
│       │   │   │           │   └── service
│       │   │   │           │       ├── DiscordUserQueryService.class
│       │   │   │           │       ├── UserPermissionQueryService.class
│       │   │   │           │       ├── UserPermissionService.class
│       │   │   │           │       └── UserService.class
│       │   │   │           ├── userPost
│       │   │   │           │   ├── controller
│       │   │   │           │   │   ├── explore
│       │   │   │           │   │   │   └── ExploreController.class
│       │   │   │           │   │   ├── PublicUserPostCommentController.class
│       │   │   │           │   │   ├── PublicUserPostController.class
│       │   │   │           │   │   ├── saved
│       │   │   │           │   │   │   └── SavedPostController.class
│       │   │   │           │   │   ├── UserPostCommentController.class
│       │   │   │           │   │   └── UserPostController.class
│       │   │   │           │   ├── domain
│       │   │   │           │   │   ├── UserPost.class
│       │   │   │           │   │   ├── UserPost$UserPostBuilder.class
│   │   │   │   │   │   ├── UserPostComment.class
│   │   │   │   │   │   ├── UserPostComment$UserPostCommentBuilder.class
│       │   │   │           │   │   ├── UserPostImage.class
│       │   │   │           │   │   ├── UserPostImage$UserPostImageBuilder.class
│   │   │   │   │   │   ├── UserPostLike.class
│   │   │   │   │   │   └── UserPostLike$UserPostLikeBuilder.class
│       │   │   │           │   ├── dto
│       │   │   │           │   │   ├── CreateUserPostRequest.class
│       │   │   │           │   │   ├── UpdateUserPostRequest.class
│       │   │   │           │   │   ├── UserPostCommentDto.class
│       │   │   │           │   │   ├── UserPostCommentDto$UserPostCommentDtoBuilder.class
│   │   │   │   │   │   ├── UserPostCommentRequest.class
│   │   │   │   │   │   ├── UserPostCommentRequest$UserPostCommentRequestBuilder.class
│       │   │   │           │   │   ├── UserPostDto.class
│       │   │   │           │   │   ├── UserPostDto$UserPostDtoBuilder.class
│   │   │   │   │   │   ├── UserPostGalleryDto.class
│   │   │   │   │   │   ├── UserPostGalleryDto$UserPostGalleryDtoBuilder.class
│       │   │   │           │   │   ├── UserPostGalleryPageDto.class
│       │   │   │           │   │   └── UserPostGalleryPageDto$UserPostGalleryPageDtoBuilder.class
│   │   │   │   │   ├── repository
│   │   │   │   │   │   ├── UserPostCommentRepository.class
│   │   │   │   │   │   ├── UserPostImageRepository.class
│   │   │   │   │   │   ├── UserPostLikeRepository.class
│   │   │   │   │   │   └── UserPostRepository.class
│   │   │   │   │   ├── service
│   │   │   │   │   │   ├── UserPostCommentService.class
│   │   │   │   │   │   ├── UserPostCommentServiceImpl.class
│   │   │   │   │   │   ├── UserPostService.class
│   │   │   │   │   │   └── UserPostServiceImpl.class
│   │   │   │   │   └── sort
│   │   │   │   │   ├── UserPostCommentSortType.class
│   │   │   │   │   └── UserPostSortType.class
│   │   │   │   ├── utils
│   │   │   │   │   ├── AuthenticationUtil.class
│   │   │   │   │   ├── FileUtil.class
│   │   │   │   │   ├── ipInterceptor
│   │   │   │   │   │   └── ClientIpInterceptor.class
│   │   │   │   │   ├── ObjectUtil.class
│   │   │   │   │   ├── ProfileChecker.class
│   │   │   │   │   ├── RedisDbType.class
│   │   │   │   │   ├── RedisInfoDb.class
│   │   │   │   │   ├── sort
│   │   │   │   │   │   ├── SortType.class
│   │   │   │   │   │   └── SortUtil.class
│   │   │   │   │   ├── TokenCookieUtil.class
│   │   │   │   │   └── UserDailyCheckUtil.class
│   │   │   │   └── webUser
│   │   │   │   ├── controller
│   │   │   │   │   ├── WebUserController.class
│   │   │   │   │   └── WebUserPublicController.class
│   │   │   │   ├── domain
│   │   │   │   │   ├── WebUser.class
│   │   │   │   │   └── WebUser$WebUserBuilder.class
│       │   │   │               ├── dto
│       │   │   │               │   ├── FindUserInfo.class
│       │   │   │               │   ├── FindUserInfo$FindUserInfoBuilder.class
│   │   │   │   │   ├── NicknameCheckResponseDto.class
│   │   │   │   │   ├── NicknameCheckResponseDto$NicknameCheckResponseDtoBuilder.class
│       │   │   │               │   ├── NotificationSettingsRequestDto.class
│       │   │   │               │   ├── NotificationSettingsResponseDto.class
│       │   │   │               │   ├── NotificationSettingsResponseDto$NotificationSettingsResponseDtoBuilder.class
│   │   │   │   │   ├── NotificationToggleRequest.class
│   │   │   │   │   ├── ProfileDetailDto.class
│   │   │   │   │   ├── ProfileDetailDto$ProfileDetailDtoBuilder.class
│       │   │   │               │   ├── UserProfileInfoResponseDto.class
│       │   │   │               │   ├── UserProfileInfoResponseDto$UserProfileInfoResponseDtoBuilder.class
│   │   │   │   │   ├── UserSearchResponseDto.class
│   │   │   │   │   ├── UserSearchResponseDto$UserSearchResponseDtoBuilder.class
│       │   │   │               │   ├── WebUserProfileEditRequestDto.class
│       │   │   │               │   └── WebUserProfileEditRequestDto$WebUserProfileEditRequestDtoBuilder.class
│   │   │   │   ├── enums
│   │   │   │   │   ├── LoginMethod.class
│   │   │   │   │   └── UserRole.class
│   │   │   │   ├── repository
│   │   │   │   │   └── WebUserRepository.class
│   │   │   │   └── service
│   │   │   │   └── WebUserService.class
│   │   │   └── postComment
│   │   │   └── domain
│   │   │   ├── PostComment.class
│   │   │   └── PostComment$PostCommentBuilder.class
│       │   └── test
│       │       └── com
│       │           └── crimecat
│       │               └── backend
│       │                   ├── authorization
│       │                   │   ├── AuthIntegrationTest.class
│       │                   │   └── WebUserCreationTest.class
│       │                   ├── BackendApplicationTests.class
│       │                   ├── Command
│       │                   │   ├── CommandServiceControllerTest.class
│       │                   │   └── CommandServiceTest.class
│       │                   ├── coupon
│       │                   │   └── CouponApiTest.class
│       │                   ├── guild
│       │                   │   └── BotGuildServiceTest.class
│       │                   ├── messagemecro
│       │                   │   ├── MessageMacroControllerTest.class
│       │                   │   └── MessageMacroServiceTest.class
│       │                   └── pointHistory
│       │                       └── PointHistoryServiceTest.class
│       ├── build
│       │   ├── classes
│       │   │   └── java
│       │   │       ├── main
│       │   │       │   ├── com
│       │   │       │   │   └── crimecat
│       │   │       │   │       └── backend
│       │   │       │   │           ├── admin
│       │   │       │   │           │   ├── controller
│       │   │       │   │           │   │   ├── AdminCommandController.class
│       │   │       │   │           │   │   └── AdminNoticeController.class
│       │   │       │   │           │   └── service
│       │   │       │   │           │       └── AdminService.class
│       │   │       │   │           ├── api
│       │   │       │   │           │   ├── AbstractApiService.class
│       │   │       │   │           │   ├── ApiBaseConfig.class
│       │   │       │   │           │   ├── discord
│       │   │       │   │           │   │   └── DiscordBotApi.class
│       │   │       │   │           │   └── naver
│       │   │       │   │           │       ├── api
│       │   │       │   │           │       │   └── NaverMapApi.class
│       │   │       │   │           │       └── controller
│       │   │       │   │           │           └── NaverMapController.class
│       │   │       │   │           ├── auth
│       │   │       │   │           │   ├── controller
│       │   │       │   │           │   │   ├── AuthController.class
│       │   │       │   │           │   │   └── CsrfController.class
│       │   │       │   │           │   ├── dto
│       │   │       │   │           │   │   └── DiscordTokenResponse.class
│       │   │       │   │           │   ├── filter
│       │   │       │   │           │   │   ├── DiscordBotTokenFilter.class
│       │   │       │   │           │   │   └── JwtAuthenticationFilter.class
│       │   │       │   │           │   ├── handler
│       │   │       │   │           │   │   ├── BaseOAuth2SuccessHandler.class
│       │   │       │   │           │   │   ├── CustomOAuth2SuccessHandler.class
│       │   │       │   │           │   │   ├── LoginSuccessHandler.class
│       │   │       │   │           │   │   └── SignupSuccessHandler.class
│       │   │       │   │           │   ├── jwt
│       │   │       │   │           │   │   └── JwtTokenProvider.class
│       │   │       │   │           │   └── service
│       │   │       │   │           │       ├── BaseDiscordOAuth2UserService.class
│       │   │       │   │           │       ├── DiscordLoginService.class
│       │   │       │   │           │       ├── DiscordOAuth2UserService.class
│       │   │       │   │           │       ├── DiscordSignupService.class
│       │   │       │   │           │       ├── JwtBlacklistService.class
│       │   │       │   │           │       └── RefreshTokenService.class
│       │   │       │   │           ├── BackendApplication.class
│       │   │       │   │           ├── boardPost
│       │   │       │   │           │   ├── controller
│       │   │       │   │           │   │   └── BoardPostController.class
│       │   │       │   │           │   ├── domain
│       │   │       │   │           │   │   ├── BoardPost.class
│       │   │       │   │           │   │   ├── BoardPost$BoardPostBuilder.class
│   │   │   │   │   │   │   ├── BoardPostLike.class
│   │   │   │   │   │   │   └── BoardPostLike$BoardPostLikeBuilder.class
│       │   │       │   │           │   ├── dto
│       │   │       │   │           │   │   ├── BoardPostResponse.class
│       │   │       │   │           │   │   └── BoardPostResponse$BoardPostResponseBuilder.class
│   │   │   │   │   │   ├── enums
│   │   │   │   │   │   │   ├── BoardType.class
│   │   │   │   │   │   │   └── PostType.class
│   │   │   │   │   │   ├── repository
│   │   │   │   │   │   │   ├── BoardPostLikeRepository.class
│   │   │   │   │   │   │   └── BoardPostRepository.class
│   │   │   │   │   │   ├── service
│   │   │   │   │   │   │   └── BoardPostService.class
│   │   │   │   │   │   └── sort
│   │   │   │   │   │   └── BoardPostSortType.class
│   │   │   │   │   ├── character
│   │   │   │   │   │   ├── controller
│   │   │   │   │   │   │   └── CharacterController.class
│   │   │   │   │   │   ├── domain
│   │   │   │   │   │   │   ├── Character.class
│   │   │   │   │   │   │   └── CharacterRole.class
│   │   │   │   │   │   ├── dto
│   │   │   │   │   │   │   ├── CharacterRoleResponseDto.class
│   │   │   │   │   │   │   ├── CharacterRolesByCharacterId.class
│   │   │   │   │   │   │   ├── CharactersFailedResponseDto.class
│   │   │   │   │   │   │   ├── CharactersResponseDto.class
│   │   │   │   │   │   │   ├── CharactersSuccessResponseDto.class
│   │   │   │   │   │   │   ├── DeleteCharacterFailedResponseDto.class
│   │   │   │   │   │   │   ├── DeleteCharacterResponseDto.class
│   │   │   │   │   │   │   ├── DeleteCharacterSuccessfulResponseDto.class
│   │   │   │   │   │   │   ├── SaveCharacterDto.class
│   │   │   │   │   │   │   ├── SaveCharacterFailedResponseDto.class
│   │   │   │   │   │   │   ├── SaveCharacterRequestDto.class
│   │   │   │   │   │   │   ├── SaveCharacterResponseDto.class
│   │   │   │   │   │   │   └── SaveCharacterSuccessfulResponseDto.class
│   │   │   │   │   │   ├── repository
│   │   │   │   │   │   │   ├── CharacterRepository.class
│   │   │   │   │   │   │   └── CharacterRoleRepository.class
│   │   │   │   │   │   └── service
│   │   │   │   │   │   ├── CharacterQueryService.class
│   │   │   │   │   │   ├── CharacterRoleQueryService.class
│   │   │   │   │   │   └── CharacterService.class
│   │   │   │   │   ├── command
│   │   │   │   │   │   ├── controller
│   │   │   │   │   │   │   └── CommandController.class
│   │   │   │   │   │   ├── domain
│   │   │   │   │   │   │   └── Command.class
│   │   │   │   │   │   ├── dto
│   │   │   │   │   │   │   ├── CommandDto.class
│   │   │   │   │   │   │   ├── CommandDto$CommandDtoBuilder.class
│       │   │       │   │           │   │   ├── CommandEditRequestDto.class
│       │   │       │   │           │   │   ├── CommandEditRequestDto$CommandEditRequestDtoBuilder.class
│   │   │   │   │   │   │   ├── CommandListResponseDto.class
│   │   │   │   │   │   │   ├── CommandListResponseDto$CommandListResponseDtoBuilder.class
│       │   │       │   │           │   │   ├── CommandRequestDto.class
│       │   │       │   │           │   │   ├── CommandRequestDto$CommandRequestDtoBuilder.class
│   │   │   │   │   │   │   ├── CommandSummaryDto.class
│   │   │   │   │   │   │   └── CommandSummaryDto$CommandSummaryDtoBuilder.class
│       │   │       │   │           │   ├── repository
│       │   │       │   │           │   │   └── CommandRepository.class
│       │   │       │   │           │   └── service
│       │   │       │   │           │       └── CommandService.class
│       │   │       │   │           ├── comment
│       │   │       │   │           │   ├── controller
│       │   │       │   │           │   │   ├── CommentController.class
│       │   │       │   │           │   │   └── CommentPublicController.class
│       │   │       │   │           │   ├── domain
│       │   │       │   │           │   │   ├── Comment.class
│       │   │       │   │           │   │   ├── Comment$CommentBuilder.class
│   │   │   │   │   │   │   ├── CommentLike.class
│   │   │   │   │   │   │   └── CommentLike$CommentLikeBuilder.class
│       │   │       │   │           │   ├── dto
│       │   │       │   │           │   │   ├── CommentRequest.class
│       │   │       │   │           │   │   ├── CommentRequest$CommentRequestBuilder.class
│   │   │   │   │   │   │   ├── CommentResponse.class
│   │   │   │   │   │   │   └── CommentResponse$CommentResponseBuilder.class
│       │   │       │   │           │   ├── repository
│       │   │       │   │           │   │   ├── CommentLikeRepository.class
│       │   │       │   │           │   │   └── CommentRepository.class
│       │   │       │   │           │   ├── service
│       │   │       │   │           │   │   └── CommentService.class
│       │   │       │   │           │   └── sort
│       │   │       │   │           │       └── CommentSortType.class
│       │   │       │   │           ├── common
│       │   │       │   │           │   └── dto
│       │   │       │   │           │       ├── MessageResponseDto.class
│       │   │       │   │           │       └── PageResponseDto.class
│       │   │       │   │           ├── config
│       │   │       │   │           │   ├── AdminProperties.class
│       │   │       │   │           │   ├── CacheConfig.class
│       │   │       │   │           │   ├── CacheType.class
│       │   │       │   │           │   ├── CorsConfig.class
│       │   │       │   │           │   ├── CsrfTokenConfig.class
│       │   │       │   │           │   ├── JpaConfig.class
│       │   │       │   │           │   ├── RedisConfig.class
│       │   │       │   │           │   ├── SecurityConfig.class
│       │   │       │   │           │   ├── SecurityConfig$DelegatingAuthenticationSuccessHandler.class
│   │   │   │   │   │   ├── SecurityConfig$DelegatingOAuth2UserService.class
│       │   │       │   │           │   ├── SecurityConfig$SpaCsrfTokenRequestHandler.class
│   │   │   │   │   │   ├── ServiceUrlConfig.class
│   │   │   │   │   │   └── WebConfig.class
│   │   │   │   │   ├── coupon
│   │   │   │   │   │   ├── controller
│   │   │   │   │   │   │   └── CouponController.class
│   │   │   │   │   │   ├── domain
│   │   │   │   │   │   │   └── Coupon.class
│   │   │   │   │   │   ├── dto
│   │   │   │   │   │   │   ├── CouponCreateRequestDto.class
│   │   │   │   │   │   │   ├── CouponListResponse.class
│   │   │   │   │   │   │   ├── CouponRedeemRequestDto.class
│   │   │   │   │   │   │   ├── CouponRedeemResponseDto.class
│   │   │   │   │   │   │   ├── CouponResponseDto.class
│   │   │   │   │   │   │   ├── MessageDto.class
│   │   │   │   │   │   │   └── WebCouponRequestDto.class
│   │   │   │   │   │   ├── repository
│   │   │   │   │   │   │   └── CouponRepository.class
│   │   │   │   │   │   └── service
│   │   │   │   │   │   └── CouponService.class
│   │   │   │   │   ├── exception
│   │   │   │   │   │   ├── ControllerException.class
│   │   │   │   │   │   ├── CrimeCatException.class
│   │   │   │   │   │   ├── DomainException.class
│   │   │   │   │   │   ├── ErrorResponse.class
│   │   │   │   │   │   ├── ErrorStatus.class
│   │   │   │   │   │   ├── ExceptionController.class
│   │   │   │   │   │   └── ServiceException.class
│   │   │   │   │   ├── follow
│   │   │   │   │   │   ├── controller
│   │   │   │   │   │   │   ├── FollowController.class
│   │   │   │   │   │   │   └── PublicFollowController.class
│   │   │   │   │   │   ├── domain
│   │   │   │   │   │   │   ├── Follow.class
│   │   │   │   │   │   │   └── Follow$FollowBuilder.class
│       │   │       │   │           │   ├── dto
│       │   │       │   │           │   │   ├── FollowDto.class
│       │   │       │   │           │   │   └── FollowDto$FollowDtoBuilder.class
│   │   │   │   │   │   ├── repository
│   │   │   │   │   │   │   └── FollowRepository.class
│   │   │   │   │   │   └── service
│   │   │   │   │   │   └── FollowService.class
│   │   │   │   │   ├── gameHistory
│   │   │   │   │   │   ├── controller
│   │   │   │   │   │   │   ├── BotGameHistoryController.class
│   │   │   │   │   │   │   └── WebGameHistoryController.class
│   │   │   │   │   │   ├── domain
│   │   │   │   │   │   │   └── GameHistory.class
│   │   │   │   │   │   ├── dto
│   │   │   │   │   │   │   ├── CheckPlayResponseDto.class
│   │   │   │   │   │   │   ├── CheckPlayResponseDto$CheckPlayResponseDtoBuilder.class
│       │   │       │   │           │   │   ├── GameHistoryUpdateRequestDto.class
│       │   │       │   │           │   │   ├── IGameHistoryRankingDto.class
│       │   │       │   │           │   │   ├── SaveUserGameHistoryRequestDto.class
│       │   │       │   │           │   │   ├── SaveUserHistoryResponseDto.class
│       │   │       │   │           │   │   ├── UserGameHistoryDto.class
│       │   │       │   │           │   │   ├── UserGameHistoryFailedResponseDto.class
│       │   │       │   │           │   │   ├── UserGameHistoryResponseDto.class
│       │   │       │   │           │   │   ├── UserGameHistorySuccessResponseDto.class
│       │   │       │   │           │   │   ├── UserGameHistoryToOwnerDto.class
│       │   │       │   │           │   │   ├── UserGameHistoryToUserDto.class
│       │   │       │   │           │   │   ├── WebHistoryRequestDto.class
│       │   │       │   │           │   │   ├── WebHistoryResponseDto.class
│       │   │       │   │           │   │   └── WebHistoryResponseDto$WebHistoryResponseDtoBuilder.class
│   │   │   │   │   │   ├── repository
│   │   │   │   │   │   │   └── GameHistoryRepository.class
│   │   │   │   │   │   ├── service
│   │   │   │   │   │   │   ├── BotGameHistoryService.class
│   │   │   │   │   │   │   ├── GameHistoryQueryService.class
│   │   │   │   │   │   │   └── WebGameHistoryService.class
│   │   │   │   │   │   └── sort
│   │   │   │   │   │   └── GameHistorySortType.class
│   │   │   │   │   ├── gametheme
│   │   │   │   │   │   ├── controller
│   │   │   │   │   │   │   ├── GameThemeController.class
│   │   │   │   │   │   │   ├── GameThemePublicController.class
│   │   │   │   │   │   │   ├── MakerTeamController.class
│   │   │   │   │   │   │   └── MakerTeamPublicController.class
│   │   │   │   │   │   ├── domain
│   │   │   │   │   │   │   ├── CrimesceneTheme.class
│   │   │   │   │   │   │   ├── CrimesceneTheme$CrimesceneThemeBuilder.class
│       │   │       │   │           │   │   ├── CrimesceneTheme$CrimesceneThemeBuilderImpl.class
│   │   │   │   │   │   │   ├── GameTheme.class
│   │   │   │   │   │   │   ├── GameTheme$GameThemeBuilder.class
│       │   │       │   │           │   │   ├── GameTheme$GameThemeBuilderImpl.class
│   │   │   │   │   │   │   ├── GameThemeRecommendation.class
│   │   │   │   │   │   │   ├── GameThemeRecommendation$GameThemeRecommendationBuilder.class
│       │   │       │   │           │   │   ├── MakerTeam.class
│       │   │       │   │           │   │   ├── MakerTeam$MakerTeamBuilder.class
│   │   │   │   │   │   │   ├── MakerTeamMember.class
│   │   │   │   │   │   │   └── MakerTeamMember$MakerTeamMemberBuilder.class
│       │   │       │   │           │   ├── dto
│       │   │       │   │           │   │   ├── AddCrimesceneThemeRequest.class
│       │   │       │   │           │   │   ├── AddGameThemeRequest.class
│       │   │       │   │           │   │   ├── AddMemberRequest.class
│       │   │       │   │           │   │   ├── AuthorDto.class
│       │   │       │   │           │   │   ├── AuthorDto$AuthorDtoBuilder.class
│   │   │   │   │   │   │   ├── CreateTeamRequest.class
│   │   │   │   │   │   │   ├── CrimesceneThemeDetailDto.class
│   │   │   │   │   │   │   ├── CrimesceneThemeDetailDto$CrimesceneThemeDetailDtoBuilder.class
│       │   │       │   │           │   │   ├── CrimesceneThemeDetailDto$CrimesceneThemeDetailDtoBuilderImpl.class
│   │   │   │   │   │   │   ├── CrimesceneThemeDto.class
│   │   │   │   │   │   │   ├── CrimesceneThemeDto$CrimesceneThemeDtoBuilder.class
│       │   │       │   │           │   │   ├── CrimesceneThemeDto$CrimesceneThemeDtoBuilderImpl.class
│   │   │   │   │   │   │   ├── CrimesceneThemeSummeryDto.class
│   │   │   │   │   │   │   ├── CrimesceneThemeSummeryDto$CrimesceneThemeSummeryDtoBuilder.class
│       │   │       │   │           │   │   ├── CrimesceneThemeSummeryListDto.class
│       │   │       │   │           │   │   ├── CrimesceneThemeSummeryListDto$CrimesceneThemeSummeryListDtoBuilder.class
│   │   │   │   │   │   │   ├── DeleteMembersRequest.class
│   │   │   │   │   │   │   ├── DeleteMembersResponse.class
│   │   │   │   │   │   │   ├── DeleteMembersResponse$DeleteMembersResponseBuilder.class
│       │   │       │   │           │   │   ├── GameThemeDetailDto.class
│       │   │       │   │           │   │   ├── GameThemeDetailDto$GameThemeDetailDtoBuilder.class
│   │   │   │   │   │   │   ├── GameThemeDetailDto$GameThemeDetailDtoBuilderImpl.class
│       │   │       │   │           │   │   ├── GameThemeDto.class
│       │   │       │   │           │   │   ├── GameThemeDto$GameThemeDtoBuilder.class
│   │   │   │   │   │   │   ├── GameThemeDto$GameThemeDtoBuilderImpl.class
│       │   │       │   │           │   │   ├── GetGameThemeResponse.class
│       │   │       │   │           │   │   ├── GetGameThemeResponse$GetGameThemeResponseBuilder.class
│   │   │   │   │   │   │   ├── GetGameThemesResponse.class
│   │   │   │   │   │   │   ├── GetGameThemesResponse$GetGameThemesResponseBuilder.class
│       │   │       │   │           │   │   ├── GetLikeStatusResponse.class
│       │   │       │   │           │   │   ├── GetTeamResponse.class
│       │   │       │   │           │   │   ├── GetTeamResponse$GetTeamResponseBuilder.class
│   │   │   │   │   │   │   ├── GetTeamsResponse.class
│   │   │   │   │   │   │   ├── MemberDto.class
│   │   │   │   │   │   │   ├── MemberDto$MemberDtoBuilder.class
│       │   │       │   │           │   │   ├── MemberRequestDto.class
│       │   │       │   │           │   │   ├── TeamDto.class
│       │   │       │   │           │   │   ├── TeamDto$TeamDtoBuilder.class
│   │   │   │   │   │   │   ├── UpdateCrimesceneThemeRequest.class
│   │   │   │   │   │   │   ├── UpdateGameThemeRequest.class
│   │   │   │   │   │   │   └── UpdateMemberRequest.class
│   │   │   │   │   │   ├── enums
│   │   │   │   │   │   │   ├── ThemeType.class
│   │   │   │   │   │   │   ├── ThemeType$Numbers.class
│       │   │       │   │           │   │   └── ThemeType$Values.class
│   │   │   │   │   │   ├── repository
│   │   │   │   │   │   │   ├── CrimesceneThemeRepository.class
│   │   │   │   │   │   │   ├── GameThemeRecommendationRepository.class
│   │   │   │   │   │   │   ├── GameThemeRepository.class
│   │   │   │   │   │   │   ├── MakerTeamMemberRepository.class
│   │   │   │   │   │   │   └── MakerTeamRepository.class
│   │   │   │   │   │   ├── service
│   │   │   │   │   │   │   ├── GameThemeService.class
│   │   │   │   │   │   │   ├── MakerTeamService.class
│   │   │   │   │   │   │   └── ViewCountService.class
│   │   │   │   │   │   ├── sort
│   │   │   │   │   │   │   └── GameThemeSortType.class
│   │   │   │   │   │   ├── specification
│   │   │   │   │   │   │   └── GameThemeSpecification.class
│   │   │   │   │   │   └── validator
│   │   │   │   │   │   ├── MinMaxCheck.class
│   │   │   │   │   │   ├── MinMaxChecks.class
│   │   │   │   │   │   ├── MinMaxListValidator.class
│   │   │   │   │   │   └── MinMaxValidator.class
│   │   │   │   │   ├── guild
│   │   │   │   │   │   ├── controller
│   │   │   │   │   │   │   ├── bot
│   │   │   │   │   │   │   │   ├── ChannelCleanController.class
│   │   │   │   │   │   │   │   ├── ChannelRecordController.class
│   │   │   │   │   │   │   │   ├── GuildController.class
│   │   │   │   │   │   │   │   ├── GuildMusicController.class
│   │   │   │   │   │   │   │   ├── GuildObservationController.class
│   │   │   │   │   │   │   │   └── PasswordNoteController.class
│   │   │   │   │   │   │   └── web
│   │   │   │   │   │   │   ├── WebGuildController.class
│   │   │   │   │   │   │   └── WebPublicGuildController.class
│   │   │   │   │   │   ├── domain
│   │   │   │   │   │   │   ├── Clean.class
│   │   │   │   │   │   │   ├── Guild.class
│   │   │   │   │   │   │   ├── Music.class
│   │   │   │   │   │   │   ├── Observation.class
│   │   │   │   │   │   │   ├── PasswordNote.class
│   │   │   │   │   │   │   └── Record.class
│   │   │   │   │   │   ├── dto
│   │   │   │   │   │   │   ├── bot
│   │   │   │   │   │   │   │   ├── ChannelCleanDto.class
│   │   │   │   │   │   │   │   ├── ChannelCleanListDto.class
│   │   │   │   │   │   │   │   ├── ChannelRecordDto.class
│   │   │   │   │   │   │   │   ├── ChannelRecordListResponseDto.class
│   │   │   │   │   │   │   │   ├── ChannelRecordRequestDto.class
│   │   │   │   │   │   │   │   ├── GuildDto.class
│   │   │   │   │   │   │   │   ├── GuildDto$GuildDtoBuilder.class
│       │   │       │   │           │   │   │   ├── GuildMusicDeletedResponseDto.class
│       │   │       │   │           │   │   │   ├── GuildMusicDto.class
│       │   │       │   │           │   │   │   ├── GuildMusicListResponseDto.class
│       │   │       │   │           │   │   │   ├── GuildMusicRequestDto.class
│       │   │       │   │           │   │   │   ├── GuildResponseDto.class
│       │   │       │   │           │   │   │   ├── MessageDto.class
│       │   │       │   │           │   │   │   ├── MessageOnlyResponseDto.class
│       │   │       │   │           │   │   │   ├── ObservationDto.class
│       │   │       │   │           │   │   │   ├── ObservationPatchRequestDto.class
│       │   │       │   │           │   │   │   ├── ObservationPostRequestDto.class
│       │   │       │   │           │   │   │   ├── PasswordNoteDto.class
│       │   │       │   │           │   │   │   ├── PasswordNoteDto$PasswordNoteDtoBuilder.class
│   │   │   │   │   │   │   │   ├── PasswordNoteListResponseDto.class
│   │   │   │   │   │   │   │   ├── PasswordNoteListResponseDto$PasswordNoteListResponseDtoBuilder.class
│       │   │       │   │           │   │   │   ├── PasswordNoteResponseDto.class
│       │   │       │   │           │   │   │   ├── PasswordNoteResponseDto$PasswordNoteResponseDtoBuilder.class
│   │   │   │   │   │   │   │   ├── PatchPasswordNoteRequestDto.class
│   │   │   │   │   │   │   │   └── SavePasswordNoteRequestDto.class
│   │   │   │   │   │   │   └── web
│   │   │   │   │   │   │   ├── ApiGetGuildInfoDto.class
│   │   │   │   │   │   │   ├── ChannelDto.class
│   │   │   │   │   │   │   ├── GuildBotInfoDto.class
│   │   │   │   │   │   │   ├── GuildInfoResponseDto.class
│   │   │   │   │   │   │   ├── GuildInfoResponseDto$GuildInfoResponseDtoBuilder.class
│       │   │       │   │           │   │       ├── GuildResponseDto.class
│       │   │       │   │           │   │       ├── RoleDto.class
│       │   │       │   │           │   │       └── RoleTags.class
│       │   │       │   │           │   ├── exception
│       │   │       │   │           │   │   └── GuildAlreadyExistsException.class
│       │   │       │   │           │   ├── repository
│       │   │       │   │           │   │   ├── ChannelCleanRepository.class
│       │   │       │   │           │   │   ├── ChannelRecordRepository.class
│       │   │       │   │           │   │   ├── GuildMusicRepository.class
│       │   │       │   │           │   │   ├── GuildObservationRepository.class
│       │   │       │   │           │   │   ├── GuildRepository.class
│       │   │       │   │           │   │   └── PasswordNoteRepository.class
│       │   │       │   │           │   ├── service
│       │   │       │   │           │   │   ├── bot
│       │   │       │   │           │   │   │   ├── ChannelCleanService.class
│       │   │       │   │           │   │   │   ├── ChannelRecordService.class
│       │   │       │   │           │   │   │   ├── GuildMusicService.class
│       │   │       │   │           │   │   │   ├── GuildObservationService.class
│       │   │       │   │           │   │   │   ├── GuildQueryService.class
│       │   │       │   │           │   │   │   ├── GuildService.class
│       │   │       │   │           │   │   │   ├── PasswordNoteService.class
│       │   │       │   │           │   │   │   └── PasswordNoteServiceImpl.class
│       │   │       │   │           │   │   └── web
│       │   │       │   │           │   │       └── WebGuildService.class
│       │   │       │   │           │   └── utils
│       │   │       │   │           │       └── RequestUtil.class
│       │   │       │   │           ├── hashtag
│       │   │       │   │           │   ├── controller
│       │   │       │   │           │   │   └── HashTagController.class
│       │   │       │   │           │   ├── domain
│       │   │       │   │           │   │   ├── HashTag.class
│       │   │       │   │           │   │   ├── HashTag$HashTagBuilder.class
│   │   │   │   │   │   │   ├── PostHashTag.class
│   │   │   │   │   │   │   └── PostHashTag$PostHashTagBuilder.class
│       │   │       │   │           │   ├── dto
│       │   │       │   │           │   │   ├── HashTagDto.class
│       │   │       │   │           │   │   └── HashTagDto$HashTagDtoBuilder.class
│   │   │   │   │   │   ├── repository
│   │   │   │   │   │   │   ├── HashTagRepository.class
│   │   │   │   │   │   │   └── PostHashTagRepository.class
│   │   │   │   │   │   └── service
│   │   │   │   │   │   └── HashTagService.class
│   │   │   │   │   ├── init
│   │   │   │   │   │   └── AdminUserRunner.class
│   │   │   │   │   ├── messagemacro
│   │   │   │   │   │   ├── controller
│   │   │   │   │   │   │   ├── BotMessageMacroController.class
│   │   │   │   │   │   │   └── MessageMacroController.class
│   │   │   │   │   │   ├── domain
│   │   │   │   │   │   │   ├── Group.class
│   │   │   │   │   │   │   ├── Group$GroupBuilder.class
│       │   │       │   │           │   │   ├── GroupItem.class
│       │   │       │   │           │   │   ├── GroupItem$GroupItemBuilder.class
│   │   │   │   │   │   │   └── GroupItem$Type.class
│       │   │       │   │           │   ├── dto
│       │   │       │   │           │   │   ├── BotGroupResponseDto.class
│       │   │       │   │           │   │   ├── BotGroupResponseDto$BotGroupResponseDtoBuilder.class
│   │   │   │   │   │   │   ├── ButtonDto.class
│   │   │   │   │   │   │   ├── ButtonDto$ButtonDtoBuilder.class
│       │   │       │   │           │   │   ├── ContentDto.class
│       │   │       │   │           │   │   ├── ContentDto$ContentDtoBuilder.class
│   │   │   │   │   │   │   ├── GroupDto.class
│   │   │   │   │   │   │   ├── GroupDto$GroupDtoBuilder.class
│       │   │       │   │           │   │   ├── GroupItemRequestDto.class
│       │   │       │   │           │   │   ├── GroupItemRequestDto$GroupItemRequestDtoBuilder.class
│   │   │   │   │   │   │   ├── GroupRequestDto.class
│   │   │   │   │   │   │   └── GroupRequestDto$GroupRequestDtoBuilder.class
│       │   │       │   │           │   ├── repository
│       │   │       │   │           │   │   ├── GroupItemRepository.class
│       │   │       │   │           │   │   └── GroupRepository.class
│       │   │       │   │           │   └── service
│       │   │       │   │           │       └── MessageMacroService.class
│       │   │       │   │           ├── notice
│       │   │       │   │           │   ├── controller
│       │   │       │   │           │   │   └── NoticeController.class
│       │   │       │   │           │   ├── domain
│       │   │       │   │           │   │   ├── Notice.class
│       │   │       │   │           │   │   ├── Notice$NoticeBuilder.class
│   │   │   │   │   │   │   └── NoticeType.class
│   │   │   │   │   │   ├── dto
│   │   │   │   │   │   │   ├── NoticeReorderRequestDto.class
│   │   │   │   │   │   │   ├── NoticeRequestDto.class
│   │   │   │   │   │   │   ├── NoticeRequestDto$NoticeRequestDtoBuilder.class
│       │   │       │   │           │   │   ├── NoticeResponseDto.class
│       │   │       │   │           │   │   ├── NoticeResponseDto$NoticeResponseDtoBuilder.class
│   │   │   │   │   │   │   ├── NoticeSummaryResponseDto.class
│   │   │   │   │   │   │   ├── NoticeSummaryResponseDto$NoticeSummaryResponseDtoBuilder.class
│       │   │       │   │           │   │   └── PageResultDto.class
│       │   │       │   │           │   ├── repository
│       │   │       │   │           │   │   └── NoticeRepository.class
│       │   │       │   │           │   └── service
│       │   │       │   │           │       └── NoticeService.class
│       │   │       │   │           ├── notification
│       │   │       │   │           │   ├── builder
│       │   │       │   │           │   │   ├── FriendRequestBuilder.class
│       │   │       │   │           │   │   ├── GameRecordRequestBuilder.class
│       │   │       │   │           │   │   ├── GameRecordResponseBuilder.class
│       │   │       │   │           │   │   ├── NewThemeBuilder.class
│       │   │       │   │           │   │   ├── NotificationBuilder.class
│       │   │       │   │           │   │   ├── NotificationBuilders.class
│       │   │       │   │           │   │   └── SystemNotificationBuilder.class
│       │   │       │   │           │   ├── config
│       │   │       │   │           │   │   └── NotificationTemplateConfiguration.class
│       │   │       │   │           │   ├── controller
│       │   │       │   │           │   │   └── NotificationController.class
│       │   │       │   │           │   ├── domain
│       │   │       │   │           │   │   ├── Notification.class
│       │   │       │   │           │   │   └── Notification$NotificationBuilder.class
│   │   │   │   │   │   ├── dto
│   │   │   │   │   │   │   ├── request
│   │   │   │   │   │   │   │   ├── GameRecordAcceptDto.class
│   │   │   │   │   │   │   │   └── GameRecordDeclineDto.class
│   │   │   │   │   │   │   └── response
│   │   │   │   │   │   │   ├── NotificationDto.class
│   │   │   │   │   │   │   ├── NotificationDto$NotificationDtoBuilder.class
│       │   │       │   │           │   │       ├── NotificationListDto.class
│       │   │       │   │           │   │       └── NotificationListDto$NotificationListDtoBuilder.class
│   │   │   │   │   │   ├── enums
│   │   │   │   │   │   │   ├── NotificationStatus.class
│   │   │   │   │   │   │   └── NotificationType.class
│   │   │   │   │   │   ├── event
│   │   │   │   │   │   │   ├── GameRecordRequestEvent.class
│   │   │   │   │   │   │   ├── GameRecordResponseEvent.class
│   │   │   │   │   │   │   ├── NewThemeEvent.class
│   │   │   │   │   │   │   ├── NotificationEvent.class
│   │   │   │   │   │   │   ├── NotificationEventPublisher.class
│   │   │   │   │   │   │   ├── SystemNotificationEvent.class
│   │   │   │   │   │   │   ├── SystemNotificationEvent$Priority.class
│       │   │       │   │           │   │   └── SystemNotificationEvent$SystemNotificationType.class
│   │   │   │   │   │   ├── handler
│   │   │   │   │   │   │   ├── AbstractNotificationHandler.class
│   │   │   │   │   │   │   ├── GameRecordRequestHandler.class
│   │   │   │   │   │   │   └── NotificationHandler.class
│   │   │   │   │   │   ├── listener
│   │   │   │   │   │   │   ├── NotificationAsyncConfig.class
│   │   │   │   │   │   │   └── NotificationEventListener.class
│   │   │   │   │   │   ├── repository
│   │   │   │   │   │   │   └── NotificationRepository.class
│   │   │   │   │   │   ├── service
│   │   │   │   │   │   │   ├── NotificationHandlerService.class
│   │   │   │   │   │   │   └── NotificationService.class
│   │   │   │   │   │   ├── sort
│   │   │   │   │   │   │   └── NotificationSortType.class
│   │   │   │   │   │   ├── template
│   │   │   │   │   │   │   ├── AbstractHandlebarsNotificationTemplate.class
│   │   │   │   │   │   │   ├── HandlebarsMessageRenderer.class
│   │   │   │   │   │   │   ├── impl
│   │   │   │   │   │   │   │   ├── GameRecordRequestTemplate.class
│   │   │   │   │   │   │   │   ├── GameRecordResponseTemplate.class
│   │   │   │   │   │   │   │   └── SystemNotificationTemplate.class
│   │   │   │   │   │   │   ├── NotificationTemplate.class
│   │   │   │   │   │   │   ├── TemplateRegistry.class
│   │   │   │   │   │   │   ├── TemplateRegistry$DefaultNotificationTemplate.class
│       │   │       │   │           │   │   ├── TemplateService.class
│       │   │       │   │           │   │   ├── TemplateService$RenderedTemplate.class
│   │   │   │   │   │   │   └── TypedNotificationTemplate.class
│   │   │   │   │   │   └── utils
│   │   │   │   │   │   └── JsonUtil.class
│   │   │   │   │   ├── permission
│   │   │   │   │   │   ├── controller
│   │   │   │   │   │   │   ├── PermissionController.class
│   │   │   │   │   │   │   └── WebUserPermissionController.class
│   │   │   │   │   │   ├── domain
│   │   │   │   │   │   │   └── Permission.class
│   │   │   │   │   │   ├── dto
│   │   │   │   │   │   │   ├── AllPermissionsWithUserStatusResponseDto.class
│   │   │   │   │   │   │   ├── DeletePermissionResponseDto.class
│   │   │   │   │   │   │   ├── ModifyPermissionRequestDto.class
│   │   │   │   │   │   │   ├── ModifyPermissionResponseDto.class
│   │   │   │   │   │   │   ├── PermissionExtendResponseDto.class
│   │   │   │   │   │   │   ├── PermissionPurchaseDataDto.class
│   │   │   │   │   │   │   ├── PermissionPurchaseDataDto$PermissionPurchaseDataDtoBuilder.class
│       │   │       │   │           │   │   ├── PermissionPurchaseResponseDto.class
│       │   │       │   │           │   │   ├── PermissionPurchaseResponseDto$PermissionPurchaseResponseDtoBuilder.class
│   │   │   │   │   │   │   ├── PermissionPurchaseWebRequestDto.class
│   │   │   │   │   │   │   ├── PermissionsResponseDto.class
│   │   │   │   │   │   │   ├── PermissionWithStatusDto.class
│   │   │   │   │   │   │   ├── PermissionWithStatusDto$PermissionWithStatusDtoBuilder.class
│       │   │       │   │           │   │   ├── SavePermissionRequestDto.class
│       │   │       │   │           │   │   └── SavePermissionResponseDto.class
│       │   │       │   │           │   ├── repository
│       │   │       │   │           │   │   └── PermissionRepository.class
│       │   │       │   │           │   └── service
│       │   │       │   │           │       ├── PermissionQueryService.class
│       │   │       │   │           │       ├── PermissionService.class
│       │   │       │   │           │       └── WebUserPermissionService.class
│       │   │       │   │           ├── point
│       │   │       │   │           │   ├── controller
│       │   │       │   │           │   │   └── PointHistoryController.class
│       │   │       │   │           │   ├── domain
│       │   │       │   │           │   │   ├── ItemType.class
│       │   │       │   │           │   │   ├── PointHistory.class
│       │   │       │   │           │   │   ├── PointHistory$PointHistoryBuilder.class
│   │   │   │   │   │   │   └── TransactionType.class
│   │   │   │   │   │   ├── dto
│   │   │   │   │   │   │   ├── PointHistoryResponseDto.class
│   │   │   │   │   │   │   ├── PointHistoryResponseDto$PointHistoryResponseDtoBuilder.class
│       │   │       │   │           │   │   ├── PointHistorySummaryDto.class
│       │   │       │   │           │   │   └── PointHistorySummaryDto$PointHistorySummaryDtoBuilder.class
│   │   │   │   │   │   ├── repository
│   │   │   │   │   │   │   └── PointHistoryRepository.class
│   │   │   │   │   │   ├── service
│   │   │   │   │   │   │   ├── PointHistoryQueryService.class
│   │   │   │   │   │   │   └── PointHistoryService.class
│   │   │   │   │   │   └── sort
│   │   │   │   │   │   └── PointHistorySortType.class
│   │   │   │   │   ├── postComment
│   │   │   │   │   │   ├── domain
│   │   │   │   │   │   │   ├── PostComment.class
│   │   │   │   │   │   │   ├── PostComment$PostCommentBuilder.class
│       │   │       │   │           │   │   ├── PostCommentLike.class
│       │   │       │   │           │   │   └── PostCommentLike$PostCommentLikeBuilder.class
│   │   │   │   │   │   └── repository
│   │   │   │   │   │   └── PostCommentRepository.class
│   │   │   │   │   ├── stats
│   │   │   │   │   │   ├── controller
│   │   │   │   │   │   │   ├── WebPersonalInfo.class
│   │   │   │   │   │   │   └── WebStatsInfo.class
│   │   │   │   │   │   ├── proxy
│   │   │   │   │   │   │   └── WebStatsInfoServiceProxy.class
│   │   │   │   │   │   └── service
│   │   │   │   │   │   └── WebStatsInfoService.class
│   │   │   │   │   ├── storage
│   │   │   │   │   │   ├── FileSystemStorageService.class
│   │   │   │   │   │   ├── StorageFileType.class
│   │   │   │   │   │   ├── StorageProperties.class
│   │   │   │   │   │   └── StorageService.class
│   │   │   │   │   ├── user
│   │   │   │   │   │   ├── controller
│   │   │   │   │   │   │   └── UserController.class
│   │   │   │   │   │   ├── domain
│   │   │   │   │   │   │   ├── DiscordUser.class
│   │   │   │   │   │   │   ├── User.class
│   │   │   │   │   │   │   ├── User$UserBuilder.class
│       │   │       │   │           │   │   └── UserPermission.class
│       │   │       │   │           │   ├── dto
│       │   │       │   │           │   │   ├── TotalGuildRankingByPlayCountDto.class
│       │   │       │   │           │   │   ├── TotalUserRankingByMakerDto.class
│       │   │       │   │           │   │   ├── TotalUserRankingByPlayTimeDto.class
│       │   │       │   │           │   │   ├── TotalUserRankingByPointDto.class
│       │   │       │   │           │   │   ├── TotalUserRankingDto.class
│       │   │       │   │           │   │   ├── TotalUserRankingFailedResponseDto.class
│       │   │       │   │           │   │   ├── TotalUserRankingResponseDto.class
│       │   │       │   │           │   │   ├── TotalUserRankingSuccessResponseDto.class
│       │   │       │   │           │   │   ├── UserDbInfoDto.class
│       │   │       │   │           │   │   ├── UserDbInfoDto$UserDbInfoDtoBuilder.class
│   │   │   │   │   │   │   ├── UserDbInfoResponseDto.class
│   │   │   │   │   │   │   ├── UserGrantedPermissionDto.class
│   │   │   │   │   │   │   ├── UserGrantedPermissionDto$UserGrantedPermissionDtoBuilder.class
│       │   │       │   │           │   │   ├── UserGrantedPermissionResponseDto.class
│       │   │       │   │           │   │   ├── UserHasPermissionResponseDto.class
│       │   │       │   │           │   │   ├── UserInfoRequestDto.class
│       │   │       │   │           │   │   ├── UserInfoResponseDto.class
│       │   │       │   │           │   │   ├── UserListResponseDto.class
│       │   │       │   │           │   │   ├── UserPatchDto.class
│       │   │       │   │           │   │   ├── UserPatchRequestDto.class
│       │   │       │   │           │   │   ├── UserPatchResponseDto.class
│       │   │       │   │           │   │   ├── UserPermissionPurchaseDto.class
│       │   │       │   │           │   │   ├── UserPermissionPurchaseFailedResponseDto.class
│       │   │       │   │           │   │   ├── UserPermissionPurchaseRequestDto.class
│       │   │       │   │           │   │   ├── UserPermissionPurchaseResponseDto.class
│       │   │       │   │           │   │   ├── UserPermissionPurchaseSuccessResponseDto.class
│       │   │       │   │           │   │   ├── UserRankingFailedResponseDto.class
│       │   │       │   │           │   │   ├── UserRankingResponseDto.class
│       │   │       │   │           │   │   ├── UserRankingSuccessResponseDto.class
│       │   │       │   │           │   │   └── UserResponseDto.class
│       │   │       │   │           │   ├── repository
│       │   │       │   │           │   │   ├── DiscordUserRepository.class
│       │   │       │   │           │   │   ├── UserPermissionRepository.class
│       │   │       │   │           │   │   └── UserRepository.class
│       │   │       │   │           │   └── service
│       │   │       │   │           │       ├── DiscordUserQueryService.class
│       │   │       │   │           │       ├── UserPermissionQueryService.class
│       │   │       │   │           │       ├── UserPermissionService.class
│       │   │       │   │           │       └── UserService.class
│       │   │       │   │           ├── userPost
│       │   │       │   │           │   ├── controller
│       │   │       │   │           │   │   ├── explore
│       │   │       │   │           │   │   │   └── ExploreController.class
│       │   │       │   │           │   │   ├── PublicUserPostCommentController.class
│       │   │       │   │           │   │   ├── PublicUserPostController.class
│       │   │       │   │           │   │   ├── saved
│       │   │       │   │           │   │   │   └── SavedPostController.class
│       │   │       │   │           │   │   ├── UserPostCommentController.class
│       │   │       │   │           │   │   └── UserPostController.class
│       │   │       │   │           │   ├── domain
│       │   │       │   │           │   │   ├── saved
│       │   │       │   │           │   │   │   ├── SavedPost.class
│       │   │       │   │           │   │   │   └── SavedPost$SavedPostBuilder.class
│   │   │   │   │   │   │   ├── UserPost.class
│   │   │   │   │   │   │   ├── UserPost$UserPostBuilder.class
│       │   │       │   │           │   │   ├── UserPostComment.class
│       │   │       │   │           │   │   ├── UserPostComment$UserPostCommentBuilder.class
│   │   │   │   │   │   │   ├── UserPostImage.class
│   │   │   │   │   │   │   ├── UserPostImage$UserPostImageBuilder.class
│       │   │       │   │           │   │   ├── UserPostLike.class
│       │   │       │   │           │   │   └── UserPostLike$UserPostLikeBuilder.class
│   │   │   │   │   │   ├── dto
│   │   │   │   │   │   │   ├── CreateUserPostRequest.class
│   │   │   │   │   │   │   ├── SavedPostRequestDto.class
│   │   │   │   │   │   │   ├── SavedPostRequestDto$SavedPostRequestDtoBuilder.class
│       │   │       │   │           │   │   ├── UpdateUserPostRequest.class
│       │   │       │   │           │   │   ├── UserPostCommentDto.class
│       │   │       │   │           │   │   ├── UserPostCommentDto$UserPostCommentDtoBuilder.class
│   │   │   │   │   │   │   ├── UserPostCommentRequest.class
│   │   │   │   │   │   │   ├── UserPostCommentRequest$UserPostCommentRequestBuilder.class
│       │   │       │   │           │   │   ├── UserPostDto.class
│       │   │       │   │           │   │   ├── UserPostDto$UserPostDtoBuilder.class
│   │   │   │   │   │   │   ├── UserPostGalleryDto.class
│   │   │   │   │   │   │   ├── UserPostGalleryDto$UserPostGalleryDtoBuilder.class
│       │   │       │   │           │   │   ├── UserPostGalleryPageDto.class
│       │   │       │   │           │   │   └── UserPostGalleryPageDto$UserPostGalleryPageDtoBuilder.class
│   │   │   │   │   │   ├── repository
│   │   │   │   │   │   │   ├── saved
│   │   │   │   │   │   │   │   └── SavedPostRepository.class
│   │   │   │   │   │   │   ├── UserPostCommentRepository.class
│   │   │   │   │   │   │   ├── UserPostImageRepository.class
│   │   │   │   │   │   │   ├── UserPostLikeRepository.class
│   │   │   │   │   │   │   └── UserPostRepository.class
│   │   │   │   │   │   ├── service
│   │   │   │   │   │   │   ├── saved
│   │   │   │   │   │   │   │   └── SavedPostService.class
│   │   │   │   │   │   │   ├── UserPostCommentService.class
│   │   │   │   │   │   │   ├── UserPostCommentServiceImpl.class
│   │   │   │   │   │   │   ├── UserPostService.class
│   │   │   │   │   │   │   └── UserPostServiceImpl.class
│   │   │   │   │   │   └── sort
│   │   │   │   │   │   ├── UserPostCommentSortType.class
│   │   │   │   │   │   └── UserPostSortType.class
│   │   │   │   │   ├── utils
│   │   │   │   │   │   ├── AuthenticationUtil.class
│   │   │   │   │   │   ├── FileUtil.class
│   │   │   │   │   │   ├── ipInterceptor
│   │   │   │   │   │   │   └── ClientIpInterceptor.class
│   │   │   │   │   │   ├── ObjectUtil.class
│   │   │   │   │   │   ├── ProfileChecker.class
│   │   │   │   │   │   ├── RedisDbType.class
│   │   │   │   │   │   ├── RedisInfoDb.class
│   │   │   │   │   │   ├── sort
│   │   │   │   │   │   │   ├── SortType.class
│   │   │   │   │   │   │   └── SortUtil.class
│   │   │   │   │   │   ├── TokenCookieUtil.class
│   │   │   │   │   │   └── UserDailyCheckUtil.class
│   │   │   │   │   └── webUser
│   │   │   │   │   ├── controller
│   │   │   │   │   │   ├── WebUserController.class
│   │   │   │   │   │   └── WebUserPublicController.class
│   │   │   │   │   ├── domain
│   │   │   │   │   │   ├── WebUser.class
│   │   │   │   │   │   └── WebUser$WebUserBuilder.class
│       │   │       │   │               ├── dto
│       │   │       │   │               │   ├── FindUserInfo.class
│       │   │       │   │               │   ├── FindUserInfo$FindUserInfoBuilder.class
│   │   │   │   │   │   ├── NicknameCheckResponseDto.class
│   │   │   │   │   │   ├── NicknameCheckResponseDto$NicknameCheckResponseDtoBuilder.class
│       │   │       │   │               │   ├── NotificationSettingsRequestDto.class
│       │   │       │   │               │   ├── NotificationSettingsResponseDto.class
│       │   │       │   │               │   ├── NotificationSettingsResponseDto$NotificationSettingsResponseDtoBuilder.class
│   │   │   │   │   │   ├── NotificationToggleRequest.class
│   │   │   │   │   │   ├── ProfileDetailDto.class
│   │   │   │   │   │   ├── ProfileDetailDto$ProfileDetailDtoBuilder.class
│       │   │       │   │               │   ├── UserProfileInfoResponseDto.class
│       │   │       │   │               │   ├── UserProfileInfoResponseDto$UserProfileInfoResponseDtoBuilder.class
│   │   │   │   │   │   ├── UserSearchResponseDto.class
│   │   │   │   │   │   ├── UserSearchResponseDto$UserSearchResponseDtoBuilder.class
│       │   │       │   │               │   ├── WebUserProfileEditRequestDto.class
│       │   │       │   │               │   └── WebUserProfileEditRequestDto$WebUserProfileEditRequestDtoBuilder.class
│   │   │   │   │   ├── enums
│   │   │   │   │   │   ├── LoginMethod.class
│   │   │   │   │   │   └── UserRole.class
│   │   │   │   │   ├── repository
│   │   │   │   │   │   └── WebUserRepository.class
│   │   │   │   │   └── service
│   │   │   │   │   └── WebUserService.class
│   │   │   │   └── postComment
│   │   │   │   └── domain
│   │   │   │   ├── PostComment.class
│   │   │   │   └── PostComment$PostCommentBuilder.class
│       │   │       └── test
│       │   │           └── com
│       │   │               └── crimecat
│       │   │                   └── backend
│       │   │                       ├── authorization
│       │   │                       │   ├── AuthIntegrationTest.class
│       │   │                       │   └── WebUserCreationTest.class
│       │   │                       ├── BackendApplicationTests.class
│       │   │                       ├── coupon
│       │   │                       │   └── CouponApiTest.class
│       │   │                       ├── messagemecro
│       │   │                       │   ├── MessageMacroControllerTest.class
│       │   │                       │   └── MessageMacroServiceTest.class
│       │   │                       ├── passwordnote
│       │   │                       │   └── PasswordNoteApiTest.class
│       │   │                       └── permission
│       │   │                           └── PermissionApiTest.class
│       │   ├── generated
│       │   │   └── sources
│       │   │       ├── annotationProcessor
│       │   │       │   └── java
│       │   │       │       ├── main
│       │   │       │       └── test
│       │   │       └── headers
│       │   │           └── java
│       │   │               ├── main
│       │   │               └── test
│       │   ├── libs
│       │   │   └── backend-0.0.1-SNAPSHOT.jar
│       │   ├── reports
│       │   │   ├── problems
│       │   │   │   └── problems-report.html
│       │   │   └── tests
│       │   │       └── test
│       │   │           ├── classes
│       │   │           │   └── com.crimecat.backend.messagemecro.MessageMacroServiceTest.html
│       │   │           ├── css
│       │   │           │   ├── base-style.css
│       │   │           │   └── style.css
│       │   │           ├── index.html
│       │   │           ├── js
│       │   │           │   └── report.js
│       │   │           └── packages
│       │   │               └── com.crimecat.backend.messagemecro.html
│       │   ├── resolvedMainClassName
│       │   ├── resources
│       │   │   └── main
│       │   │       ├── application-local.yml
│       │   │       └── application-prod.yml
│       │   ├── test-results
│       │   │   └── test
│       │   │       ├── binary
│       │   │       │   ├── output.bin
│       │   │       │   ├── output.bin.idx
│       │   │       │   └── results.bin
│       │   │       └── TEST-com.crimecat.backend.messagemecro.MessageMacroServiceTest.xml
│       │   └── tmp
│       │       ├── assemble
│       │       ├── bootBuildImage
│       │       ├── bootJar
│       │       │   └── MANIFEST.MF
│       │       ├── bootRun
│       │       ├── bootTestRun
│       │       ├── build
│       │       ├── buildDependents
│       │       ├── buildEnvironment
│       │       ├── buildNeeded
│       │       ├── check
│       │       ├── classes
│       │       ├── clean
│       │       ├── compileJava
│       │       │   ├── compileTransaction
│       │       │   │   ├── backup-dir
│       │       │   │   └── stash-dir
│       │       │   │       ├── AbstractNotificationHandler.class.uniqueId250
│       │       │   │       ├── AdminUserRunner.class.uniqueId254
│       │       │   │       ├── AuthController.class.uniqueId80
│       │       │   │       ├── AuthenticationUtil.class.uniqueId181
│       │       │   │       ├── AuthorDto.class.uniqueId253
│       │       │   │       ├── AuthorDto$AuthorDtoBuilder.class.uniqueId49
│   │   │   │   ├── BaseDiscordOAuth2UserService.class.uniqueId4
│   │   │   │   ├── BaseOAuth2SuccessHandler.class.uniqueId21
│   │   │   │   ├── BoardPost.class.uniqueId251
│   │   │   │   ├── BoardPost$BoardPostBuilder.class.uniqueId174
│       │       │   │       ├── BoardPostController.class.uniqueId274
│       │       │   │       ├── BoardPostLike.class.uniqueId136
│       │       │   │       ├── BoardPostLike$BoardPostLikeBuilder.class.uniqueId59
│   │   │   │   ├── BoardPostLikeRepository.class.uniqueId194
│   │   │   │   ├── BoardPostRepository.class.uniqueId96
│   │   │   │   ├── BoardPostResponse.class.uniqueId153
│   │   │   │   ├── BoardPostResponse$BoardPostResponseBuilder.class.uniqueId208
│       │       │   │       ├── BoardPostService.class.uniqueId248
│       │       │   │       ├── BotGameHistoryController.class.uniqueId48
│       │       │   │       ├── BotGameHistoryService.class.uniqueId63
│       │       │   │       ├── BotMessageMacroController.class.uniqueId217
│       │       │   │       ├── ChannelCleanController.class.uniqueId207
│       │       │   │       ├── ChannelCleanRepository.class.uniqueId56
│       │       │   │       ├── ChannelCleanService.class.uniqueId103
│       │       │   │       ├── ChannelRecordController.class.uniqueId167
│       │       │   │       ├── ChannelRecordDto.class.uniqueId275
│       │       │   │       ├── ChannelRecordListResponseDto.class.uniqueId239
│       │       │   │       ├── ChannelRecordRepository.class.uniqueId273
│       │       │   │       ├── ChannelRecordService.class.uniqueId113
│       │       │   │       ├── Character.class.uniqueId264
│       │       │   │       ├── CharacterController.class.uniqueId215
│       │       │   │       ├── CharacterQueryService.class.uniqueId186
│       │       │   │       ├── CharacterRepository.class.uniqueId116
│       │       │   │       ├── CharacterRole.class.uniqueId20
│       │       │   │       ├── CharacterRoleQueryService.class.uniqueId212
│       │       │   │       ├── CharacterRoleRepository.class.uniqueId79
│       │       │   │       ├── CharacterService.class.uniqueId162
│       │       │   │       ├── Clean.class.uniqueId232
│       │       │   │       ├── Comment.class.uniqueId76
│       │       │   │       ├── Comment$CommentBuilder.class.uniqueId58
│   │   │   │   ├── CommentController.class.uniqueId210
│   │   │   │   ├── CommentLike.class.uniqueId102
│   │   │   │   ├── CommentLike$CommentLikeBuilder.class.uniqueId77
│       │       │   │       ├── CommentLikeRepository.class.uniqueId272
│       │       │   │       ├── CommentPublicController.class.uniqueId123
│       │       │   │       ├── CommentRepository.class.uniqueId271
│       │       │   │       ├── CommentResponse.class.uniqueId200
│       │       │   │       ├── CommentResponse$CommentResponseBuilder.class.uniqueId110
│   │   │   │   ├── CommentService.class.uniqueId22
│   │   │   │   ├── Coupon.class.uniqueId190
│   │   │   │   ├── CouponController.class.uniqueId192
│   │   │   │   ├── CouponRepository.class.uniqueId98
│   │   │   │   ├── CouponService.class.uniqueId124
│   │   │   │   ├── CrimesceneTheme.class.uniqueId175
│   │   │   │   ├── CrimesceneTheme$CrimesceneThemeBuilder.class.uniqueId149
│       │       │   │       ├── CrimesceneTheme$CrimesceneThemeBuilderImpl.class.uniqueId90
│   │   │   │   ├── CrimesceneThemeDetailDto.class.uniqueId27
│   │   │   │   ├── CrimesceneThemeDetailDto$CrimesceneThemeDetailDtoBuilder.class.uniqueId33
│       │       │   │       ├── CrimesceneThemeDetailDto$CrimesceneThemeDetailDtoBuilderImpl.class.uniqueId143
│   │   │   │   ├── CrimesceneThemeDto.class.uniqueId195
│   │   │   │   ├── CrimesceneThemeDto$CrimesceneThemeDtoBuilder.class.uniqueId142
│       │       │   │       ├── CrimesceneThemeDto$CrimesceneThemeDtoBuilderImpl.class.uniqueId121
│   │   │   │   ├── CrimesceneThemeRepository.class.uniqueId159
│   │   │   │   ├── CrimesceneThemeSummeryDto.class.uniqueId66
│   │   │   │   ├── CrimesceneThemeSummeryDto$CrimesceneThemeSummeryDtoBuilder.class.uniqueId13
│       │       │   │       ├── CrimesceneThemeSummeryListDto.class.uniqueId266
│       │       │   │       ├── CrimesceneThemeSummeryListDto$CrimesceneThemeSummeryListDtoBuilder.class.uniqueId39
│   │   │   │   ├── CustomOAuth2SuccessHandler.class.uniqueId161
│   │   │   │   ├── DiscordLoginService.class.uniqueId240
│   │   │   │   ├── DiscordOAuth2UserService.class.uniqueId246
│   │   │   │   ├── DiscordSignupService.class.uniqueId18
│   │   │   │   ├── DiscordUser.class.uniqueId83
│   │   │   │   ├── DiscordUserQueryService.class.uniqueId60
│   │   │   │   ├── DiscordUserRepository.class.uniqueId178
│   │   │   │   ├── ExploreController.class.uniqueId202
│   │   │   │   ├── FindUserInfo.class.uniqueId233
│   │   │   │   ├── FindUserInfo$FindUserInfoBuilder.class.uniqueId50
│       │       │   │       ├── Follow.class.uniqueId17
│       │       │   │       ├── Follow$FollowBuilder.class.uniqueId247
│   │   │   │   ├── FollowController.class.uniqueId70
│   │   │   │   ├── FollowDto.class.uniqueId45
│   │   │   │   ├── FollowDto$FollowDtoBuilder.class.uniqueId214
│       │       │   │       ├── FollowRepository.class.uniqueId115
│       │       │   │       ├── FollowService.class.uniqueId46
│       │       │   │       ├── FriendRequestBuilder.class.uniqueId125
│       │       │   │       ├── GameHistory.class.uniqueId73
│       │       │   │       ├── GameHistoryQueryService.class.uniqueId108
│       │       │   │       ├── GameHistoryRepository.class.uniqueId205
│       │       │   │       ├── GameRecordRequestBuilder.class.uniqueId55
│       │       │   │       ├── GameRecordRequestHandler.class.uniqueId227
│       │       │   │       ├── GameRecordResponseBuilder.class.uniqueId82
│       │       │   │       ├── GameTheme.class.uniqueId196
│       │       │   │       ├── GameTheme$GameThemeBuilder.class.uniqueId54
│   │   │   │   ├── GameTheme$GameThemeBuilderImpl.class.uniqueId62
│       │       │   │       ├── GameThemeController.class.uniqueId137
│       │       │   │       ├── GameThemeDetailDto.class.uniqueId134
│       │       │   │       ├── GameThemeDetailDto$GameThemeDetailDtoBuilder.class.uniqueId147
│   │   │   │   ├── GameThemeDetailDto$GameThemeDetailDtoBuilderImpl.class.uniqueId95
│       │       │   │       ├── GameThemeDto.class.uniqueId11
│       │       │   │       ├── GameThemeDto$GameThemeDtoBuilder.class.uniqueId269
│   │   │   │   ├── GameThemeDto$GameThemeDtoBuilderImpl.class.uniqueId252
│       │       │   │       ├── GameThemePublicController.class.uniqueId38
│       │       │   │       ├── GameThemeRecommendation.class.uniqueId182
│       │       │   │       ├── GameThemeRecommendation$GameThemeRecommendationBuilder.class.uniqueId114
│   │   │   │   ├── GameThemeRecommendationRepository.class.uniqueId67
│   │   │   │   ├── GameThemeRepository.class.uniqueId211
│   │   │   │   ├── GameThemeService.class.uniqueId258
│   │   │   │   ├── GameThemeSpecification.class.uniqueId238
│   │   │   │   ├── GetGameThemeResponse.class.uniqueId129
│   │   │   │   ├── GetGameThemeResponse$GetGameThemeResponseBuilder.class.uniqueId148
│       │       │   │       ├── GetGameThemesResponse.class.uniqueId230
│       │       │   │       ├── GetGameThemesResponse$GetGameThemesResponseBuilder.class.uniqueId158
│   │   │   │   ├── GetTeamResponse.class.uniqueId138
│   │   │   │   ├── GetTeamResponse$GetTeamResponseBuilder.class.uniqueId3
│       │       │   │       ├── GetTeamsResponse.class.uniqueId71
│       │       │   │       ├── Guild.class.uniqueId100
│       │       │   │       ├── GuildAlreadyExistsException.class.uniqueId75
│       │       │   │       ├── GuildController.class.uniqueId270
│       │       │   │       ├── GuildDto.class.uniqueId219
│       │       │   │       ├── GuildDto$GuildDtoBuilder.class.uniqueId223
│   │   │   │   ├── GuildInfoResponseDto.class.uniqueId222
│   │   │   │   ├── GuildInfoResponseDto$GuildInfoResponseDtoBuilder.class.uniqueId74
│       │       │   │       ├── GuildMusicController.class.uniqueId87
│       │       │   │       ├── GuildMusicRepository.class.uniqueId91
│       │       │   │       ├── GuildMusicService.class.uniqueId19
│       │       │   │       ├── GuildObservationController.class.uniqueId198
│       │       │   │       ├── GuildObservationRepository.class.uniqueId184
│       │       │   │       ├── GuildObservationService.class.uniqueId228
│       │       │   │       ├── GuildQueryService.class.uniqueId41
│       │       │   │       ├── GuildRepository.class.uniqueId61
│       │       │   │       ├── GuildResponseDto.class.uniqueId51
│       │       │   │       ├── GuildService.class.uniqueId220
│       │       │   │       ├── HashTag.class.uniqueId23
│       │       │   │       ├── HashTag$HashTagBuilder.class.uniqueId187
│   │   │   │   ├── HashTagController.class.uniqueId78
│   │   │   │   ├── HashTagRepository.class.uniqueId64
│   │   │   │   ├── HashTagService.class.uniqueId106
│   │   │   │   ├── JwtAuthenticationFilter.class.uniqueId40
│   │   │   │   ├── LoginSuccessHandler.class.uniqueId176
│   │   │   │   ├── MakerTeam.class.uniqueId197
│   │   │   │   ├── MakerTeam$MakerTeamBuilder.class.uniqueId173
│       │       │   │       ├── MakerTeamController.class.uniqueId168
│       │       │   │       ├── MakerTeamMember.class.uniqueId57
│       │       │   │       ├── MakerTeamMember$MakerTeamMemberBuilder.class.uniqueId242
│   │   │   │   ├── MakerTeamMemberRepository.class.uniqueId170
│   │   │   │   ├── MakerTeamPublicController.class.uniqueId89
│   │   │   │   ├── MakerTeamRepository.class.uniqueId180
│   │   │   │   ├── MakerTeamService.class.uniqueId268
│   │   │   │   ├── MemberDto.class.uniqueId30
│   │   │   │   ├── MemberDto$MemberDtoBuilder.class.uniqueId68
│       │       │   │       ├── MessageMacroController.class.uniqueId133
│       │       │   │       ├── Music.class.uniqueId256
│       │       │   │       ├── NewThemeBuilder.class.uniqueId263
│       │       │   │       ├── Notification.class.uniqueId151
│       │       │   │       ├── Notification$NotificationBuilder.class.uniqueId126
│   │   │   │   ├── NotificationBuilder.class.uniqueId229
│   │   │   │   ├── NotificationBuilders.class.uniqueId15
│   │   │   │   ├── NotificationController.class.uniqueId185
│   │   │   │   ├── NotificationDto.class.uniqueId262
│   │   │   │   ├── NotificationDto$NotificationDtoBuilder.class.uniqueId259
│       │       │   │       ├── NotificationEventListener.class.uniqueId203
│       │       │   │       ├── NotificationHandlerService.class.uniqueId43
│       │       │   │       ├── NotificationListDto.class.uniqueId199
│       │       │   │       ├── NotificationListDto$NotificationListDtoBuilder.class.uniqueId122
│   │   │   │   ├── NotificationRepository.class.uniqueId261
│   │   │   │   ├── NotificationService.class.uniqueId144
│   │   │   │   ├── NotificationSettingsResponseDto.class.uniqueId235
│   │   │   │   ├── NotificationSettingsResponseDto$NotificationSettingsResponseDtoBuilder.class.uniqueId165
│       │       │   │       ├── Observation.class.uniqueId249
│       │       │   │       ├── ObservationDto.class.uniqueId169
│       │       │   │       ├── PasswordNote.class.uniqueId42
│       │       │   │       ├── PasswordNoteRepository.class.uniqueId201
│       │       │   │       ├── PasswordNoteServiceImpl.class.uniqueId117
│       │       │   │       ├── PointHistory.class.uniqueId276
│       │       │   │       ├── PointHistory$PointHistoryBuilder.class.uniqueId188
│   │   │   │   ├── PointHistoryController.class.uniqueId111
│   │   │   │   ├── PointHistoryQueryService.class.uniqueId72
│   │   │   │   ├── PointHistoryRepository.class.uniqueId93
│   │   │   │   ├── PointHistoryResponseDto.class.uniqueId243
│   │   │   │   ├── PointHistoryResponseDto$PointHistoryResponseDtoBuilder.class.uniqueId120
│       │       │   │       ├── PointHistoryService.class.uniqueId97
│       │       │   │       ├── PostComment.class.uniqueId157
│       │       │   │       ├── PostComment.class.uniqueId257
│       │       │   │       ├── PostComment$PostCommentBuilder.class.uniqueId150
│   │   │   │   ├── PostComment$PostCommentBuilder.class.uniqueId94
│       │       │   │       ├── PostCommentLike.class.uniqueId172
│       │       │   │       ├── PostCommentLike$PostCommentLikeBuilder.class.uniqueId12
│   │   │   │   ├── PostCommentRepository.class.uniqueId0
│   │   │   │   ├── PostHashTag.class.uniqueId204
│   │   │   │   ├── PostHashTag$PostHashTagBuilder.class.uniqueId2
│       │       │   │       ├── PostHashTagRepository.class.uniqueId145
│       │       │   │       ├── ProfileDetailDto.class.uniqueId234
│       │       │   │       ├── ProfileDetailDto$ProfileDetailDtoBuilder.class.uniqueId260
│   │   │   │   ├── PublicFollowController.class.uniqueId132
│   │   │   │   ├── PublicUserPostCommentController.class.uniqueId221
│   │   │   │   ├── PublicUserPostController.class.uniqueId166
│   │   │   │   ├── Record.class.uniqueId88
│   │   │   │   ├── SavedPost.class.uniqueId177
│   │   │   │   ├── SavedPost$SavedPostBuilder.class.uniqueId164
│       │       │   │       ├── SavedPostController.class.uniqueId109
│       │       │   │       ├── SavedPostRepository.class.uniqueId236
│       │       │   │       ├── SavedPostService.class.uniqueId146
│       │       │   │       ├── SecurityConfig.class.uniqueId65
│       │       │   │       ├── SecurityConfig$DelegatingAuthenticationSuccessHandler.class.uniqueId44
│   │   │   │   ├── SecurityConfig$DelegatingOAuth2UserService.class.uniqueId193
│       │       │   │       ├── SecurityConfig$SpaCsrfTokenRequestHandler.class.uniqueId29
│   │   │   │   ├── SignupSuccessHandler.class.uniqueId31
│   │   │   │   ├── SystemNotificationBuilder.class.uniqueId224
│   │   │   │   ├── TeamDto.class.uniqueId216
│   │   │   │   ├── TeamDto$TeamDtoBuilder.class.uniqueId225
│       │       │   │       ├── UpdateCrimesceneThemeRequest.class.uniqueId7
│       │       │   │       ├── UpdateGameThemeRequest.class.uniqueId52
│       │       │   │       ├── User.class.uniqueId183
│       │       │   │       ├── User$UserBuilder.class.uniqueId9
│   │   │   │   ├── UserController.class.uniqueId81
│   │   │   │   ├── UserDbInfoDto.class.uniqueId105
│   │   │   │   ├── UserDbInfoDto$UserDbInfoDtoBuilder.class.uniqueId47
│       │       │   │       ├── UserDbInfoResponseDto.class.uniqueId163
│       │       │   │       ├── UserGameHistoryDto.class.uniqueId156
│       │       │   │       ├── UserGameHistorySuccessResponseDto.class.uniqueId118
│       │       │   │       ├── UserGameHistoryToOwnerDto.class.uniqueId104
│       │       │   │       ├── UserGameHistoryToUserDto.class.uniqueId131
│       │       │   │       ├── UserGrantedPermissionDto.class.uniqueId5
│       │       │   │       ├── UserGrantedPermissionDto$UserGrantedPermissionDtoBuilder.class.uniqueId14
│   │   │   │   ├── UserGrantedPermissionResponseDto.class.uniqueId135
│   │   │   │   ├── UserPatchDto.class.uniqueId130
│   │   │   │   ├── UserPatchResponseDto.class.uniqueId245
│   │   │   │   ├── UserPermission.class.uniqueId86
│   │   │   │   ├── UserPermissionQueryService.class.uniqueId36
│   │   │   │   ├── UserPermissionRepository.class.uniqueId154
│   │   │   │   ├── UserPermissionService.class.uniqueId152
│   │   │   │   ├── UserPost.class.uniqueId1
│   │   │   │   ├── UserPost$UserPostBuilder.class.uniqueId218
│       │       │   │       ├── UserPostComment.class.uniqueId28
│       │       │   │       ├── UserPostComment$UserPostCommentBuilder.class.uniqueId10
│   │   │   │   ├── UserPostCommentController.class.uniqueId24
│   │   │   │   ├── UserPostCommentDto.class.uniqueId231
│   │   │   │   ├── UserPostCommentDto$UserPostCommentDtoBuilder.class.uniqueId141
│       │       │   │       ├── UserPostCommentRepository.class.uniqueId107
│       │       │   │       ├── UserPostCommentService.class.uniqueId84
│       │       │   │       ├── UserPostCommentServiceImpl.class.uniqueId101
│       │       │   │       ├── UserPostController.class.uniqueId6
│       │       │   │       ├── UserPostDto.class.uniqueId34
│       │       │   │       ├── UserPostDto$UserPostDtoBuilder.class.uniqueId37
│   │   │   │   ├── UserPostImage.class.uniqueId35
│   │   │   │   ├── UserPostImage$UserPostImageBuilder.class.uniqueId213
│       │       │   │       ├── UserPostImageRepository.class.uniqueId127
│       │       │   │       ├── UserPostLike.class.uniqueId160
│       │       │   │       ├── UserPostLike$UserPostLikeBuilder.class.uniqueId179
│   │   │   │   ├── UserPostLikeRepository.class.uniqueId92
│   │   │   │   ├── UserPostRepository.class.uniqueId139
│   │   │   │   ├── UserPostService.class.uniqueId26
│   │   │   │   ├── UserPostServiceImpl.class.uniqueId206
│   │   │   │   ├── UserProfileInfoResponseDto.class.uniqueId244
│   │   │   │   ├── UserProfileInfoResponseDto$UserProfileInfoResponseDtoBuilder.class.uniqueId241
│       │       │   │       ├── UserRepository.class.uniqueId171
│       │       │   │       ├── UserSearchResponseDto.class.uniqueId255
│       │       │   │       ├── UserSearchResponseDto$UserSearchResponseDtoBuilder.class.uniqueId85
│   │   │   │   ├── UserService.class.uniqueId189
│   │   │   │   ├── ViewCountService.class.uniqueId119
│   │   │   │   ├── WebGameHistoryController.class.uniqueId140
│   │   │   │   ├── WebGameHistoryService.class.uniqueId226
│   │   │   │   ├── WebGuildController.class.uniqueId237
│   │   │   │   ├── WebGuildService.class.uniqueId209
│   │   │   │   ├── WebPersonalInfo.class.uniqueId191
│   │   │   │   ├── WebPublicGuildController.class.uniqueId25
│   │   │   │   ├── WebStatsInfo.class.uniqueId112
│   │   │   │   ├── WebStatsInfoService.class.uniqueId16
│   │   │   │   ├── WebStatsInfoServiceProxy.class.uniqueId155
│   │   │   │   ├── WebUser.class.uniqueId69
│   │   │   │   ├── WebUser$WebUserBuilder.class.uniqueId99
│   │   │   │   ├── WebUserController.class.uniqueId265
│   │   │   │   ├── WebUserPermissionController.class.uniqueId53
│   │   │   │   ├── WebUserPermissionService.class.uniqueId267
│   │   │   │   ├── WebUserPublicController.class.uniqueId128
│   │   │   │   ├── WebUserRepository.class.uniqueId8
│   │   │   │   └── WebUserService.class.uniqueId32
│   │   │   └── previous-compilation-data.bin
│   │   ├── compileTestJava
│   │   │   ├── compileTransaction
│   │   │   │   ├── backup-dir
│   │   │   │   └── stash-dir
│   │   │   │   └── MessageMacroServiceTest.class.uniqueId0
│   │   │   └── previous-compilation-data.bin
│   │   ├── components
│   │   ├── copyMainConfig
│   │   ├── dependencies
│   │   ├── dependencyInsight
│   │   ├── dependencyManagement
│   │   ├── dependentComponents
│   │   ├── help
│   │   ├── init
│   │   ├── jar
│   │   │   └── MANIFEST.MF
│   │   ├── javadoc
│   │   ├── javaToolchains
│   │   ├── model
│   │   ├── outgoingVariants
│   │   ├── prepareKotlinBuildScriptModel
│   │   ├── processResources
│   │   ├── processTestResources
│   │   ├── projects
│   │   ├── properties
│   │   ├── resolvableConfigurations
│   │   ├── resolveMainClassName
│   │   ├── resolveTestMainClassName
│   │   ├── runSingle
│   │   ├── tasks
│   │   ├── test
│   │   ├── testClasses
│   │   ├── updateDaemonJvm
│   │   └── wrapper
│   ├── build.gradle
│   ├── gradle
│   │   └── wrapper
│   │   ├── gradle-wrapper.jar
│   │   └── gradle-wrapper.properties
│   ├── gradlew
│   ├── gradlew.bat
│   ├── images
│   │   └── avatars
│   ├── settings.gradle
│   ├── src
│   │   ├── main
│   │   │   ├── java
│   │   │   │   ├── com
│   │   │   │   │   └── crimecat
│   │   │   │   │   └── backend
│   │   │   │   │   ├── admin
│   │   │   │   │   │   ├── controller
│   │   │   │   │   │   │   ├── AdminCommandController.java
│   │   │   │   │   │   │   └── AdminNoticeController.java
│   │   │   │   │   │   └── service
│   │   │   │   │   │   └── AdminService.java
│   │   │   │   │   ├── api
│   │   │   │   │   │   ├── AbstractApiService.java
│   │   │   │   │   │   ├── ApiBaseConfig.java
│   │   │   │   │   │   ├── discord
│   │   │   │   │   │   │   └── DiscordBotApi.java
│   │   │   │   │   │   └── naver
│   │   │   │   │   │   ├── api
│   │   │   │   │   │   │   └── NaverMapApi.java
│   │   │   │   │   │   └── controller
│   │   │   │   │   │   └── NaverMapController.java
│   │   │   │   │   ├── auth
│   │   │   │   │   │   ├── controller
│   │   │   │   │   │   │   ├── AuthController.java
│   │   │   │   │   │   │   └── CsrfController.java
│   │   │   │   │   │   ├── dto
│   │   │   │   │   │   │   └── DiscordTokenResponse.java
│   │   │   │   │   │   ├── filter
│   │   │   │   │   │   │   ├── DiscordBotTokenFilter.java
│   │   │   │   │   │   │   └── JwtAuthenticationFilter.java
│   │   │   │   │   │   ├── handler
│   │   │   │   │   │   │   ├── BaseOAuth2SuccessHandler.java
│   │   │   │   │   │   │   ├── CustomOAuth2SuccessHandler.java
│   │   │   │   │   │   │   ├── LoginSuccessHandler.java
│   │   │   │   │   │   │   └── SignupSuccessHandler.java
│   │   │   │   │   │   ├── jwt
│   │   │   │   │   │   │   └── JwtTokenProvider.java
│   │   │   │   │   │   └── service
│   │   │   │   │   │   ├── BaseDiscordOAuth2UserService.java
│   │   │   │   │   │   ├── DiscordLoginService.java
│   │   │   │   │   │   ├── DiscordOAuth2UserService.java
│   │   │   │   │   │   ├── DiscordSignupService.java
│   │   │   │   │   │   ├── JwtBlacklistService.java
│   │   │   │   │   │   └── RefreshTokenService.java
│   │   │   │   │   ├── BackendApplication.java
│   │   │   │   │   ├── boardPost
│   │   │   │   │   │   ├── controller
│   │   │   │   │   │   │   └── BoardPostController.java
│   │   │   │   │   │   ├── domain
│   │   │   │   │   │   │   ├── BoardPost.java
│   │   │   │   │   │   │   └── BoardPostLike.java
│   │   │   │   │   │   ├── dto
│   │   │   │   │   │   │   └── BoardPostResponse.java
│   │   │   │   │   │   ├── enums
│   │   │   │   │   │   │   ├── BoardType.java
│   │   │   │   │   │   │   └── PostType.java
│   │   │   │   │   │   ├── repository
│   │   │   │   │   │   │   ├── BoardPostLikeRepository.java
│   │   │   │   │   │   │   └── BoardPostRepository.java
│   │   │   │   │   │   ├── service
│   │   │   │   │   │   │   └── BoardPostService.java
│   │   │   │   │   │   └── sort
│   │   │   │   │   │   └── BoardPostSortType.java
│   │   │   │   │   ├── character
│   │   │   │   │   │   ├── controller
│   │   │   │   │   │   │   └── CharacterController.java
│   │   │   │   │   │   ├── domain
│   │   │   │   │   │   │   ├── Character.java
│   │   │   │   │   │   │   └── CharacterRole.java
│   │   │   │   │   │   ├── dto
│   │   │   │   │   │   │   ├── CharacterRoleResponseDto.java
│   │   │   │   │   │   │   ├── CharacterRolesByCharacterId.java
│   │   │   │   │   │   │   ├── CharactersFailedResponseDto.java
│   │   │   │   │   │   │   ├── CharactersResponseDto.java
│   │   │   │   │   │   │   ├── CharactersSuccessResponseDto.java
│   │   │   │   │   │   │   ├── DeleteCharacterFailedResponseDto.java
│   │   │   │   │   │   │   ├── DeleteCharacterResponseDto.java
│   │   │   │   │   │   │   ├── DeleteCharacterSuccessfulResponseDto.java
│   │   │   │   │   │   │   ├── SaveCharacterDto.java
│   │   │   │   │   │   │   ├── SaveCharacterFailedResponseDto.java
│   │   │   │   │   │   │   ├── SaveCharacterRequestDto.java
│   │   │   │   │   │   │   ├── SaveCharacterResponseDto.java
│   │   │   │   │   │   │   └── SaveCharacterSuccessfulResponseDto.java
│   │   │   │   │   │   ├── repository
│   │   │   │   │   │   │   ├── CharacterRepository.java
│   │   │   │   │   │   │   └── CharacterRoleRepository.java
│   │   │   │   │   │   └── service
│   │   │   │   │   │   ├── CharacterQueryService.java
│   │   │   │   │   │   ├── CharacterRoleQueryService.java
│   │   │   │   │   │   └── CharacterService.java
│   │   │   │   │   ├── command
│   │   │   │   │   │   ├── controller
│   │   │   │   │   │   │   └── CommandController.java
│   │   │   │   │   │   ├── domain
│   │   │   │   │   │   │   └── Command.java
│   │   │   │   │   │   ├── dto
│   │   │   │   │   │   │   ├── CommandDto.java
│   │   │   │   │   │   │   ├── CommandEditRequestDto.java
│   │   │   │   │   │   │   ├── CommandListResponseDto.java
│   │   │   │   │   │   │   ├── CommandRequestDto.java
│   │   │   │   │   │   │   └── CommandSummaryDto.java
│   │   │   │   │   │   ├── repository
│   │   │   │   │   │   │   └── CommandRepository.java
│   │   │   │   │   │   └── service
│   │   │   │   │   │   └── CommandService.java
│   │   │   │   │   ├── comment
│   │   │   │   │   │   ├── controller
│   │   │   │   │   │   │   ├── CommentController.java
│   │   │   │   │   │   │   └── CommentPublicController.java
│   │   │   │   │   │   ├── domain
│   │   │   │   │   │   │   ├── Comment.java
│   │   │   │   │   │   │   └── CommentLike.java
│   │   │   │   │   │   ├── dto
│   │   │   │   │   │   │   ├── CommentRequest.java
│   │   │   │   │   │   │   └── CommentResponse.java
│   │   │   │   │   │   ├── repository
│   │   │   │   │   │   │   ├── CommentLikeRepository.java
│   │   │   │   │   │   │   └── CommentRepository.java
│   │   │   │   │   │   ├── service
│   │   │   │   │   │   │   └── CommentService.java
│   │   │   │   │   │   └── sort
│   │   │   │   │   │   └── CommentSortType.java
│   │   │   │   │   ├── common
│   │   │   │   │   │   └── dto
│   │   │   │   │   │   ├── MessageResponseDto.java
│   │   │   │   │   │   └── PageResponseDto.java
│   │   │   │   │   ├── config
│   │   │   │   │   │   ├── AdminProperties.java
│   │   │   │   │   │   ├── CacheConfig.java
│   │   │   │   │   │   ├── CacheType.java
│   │   │   │   │   │   ├── CorsConfig.java
│   │   │   │   │   │   ├── CsrfTokenConfig.java
│   │   │   │   │   │   ├── JpaConfig.java
│   │   │   │   │   │   ├── RedisConfig.java
│   │   │   │   │   │   ├── SecurityConfig.java
│   │   │   │   │   │   ├── ServiceUrlConfig.java
│   │   │   │   │   │   └── WebConfig.java
│   │   │   │   │   ├── coupon
│   │   │   │   │   │   ├── controller
│   │   │   │   │   │   │   └── CouponController.java
│   │   │   │   │   │   ├── domain
│   │   │   │   │   │   │   └── Coupon.java
│   │   │   │   │   │   ├── dto
│   │   │   │   │   │   │   ├── CouponCreateRequestDto.java
│   │   │   │   │   │   │   ├── CouponListResponse.java
│   │   │   │   │   │   │   ├── CouponRedeemRequestDto.java
│   │   │   │   │   │   │   ├── CouponRedeemResponseDto.java
│   │   │   │   │   │   │   ├── CouponResponseDto.java
│   │   │   │   │   │   │   ├── MessageDto.java
│   │   │   │   │   │   │   └── WebCouponRequestDto.java
│   │   │   │   │   │   ├── repository
│   │   │   │   │   │   │   └── CouponRepository.java
│   │   │   │   │   │   └── service
│   │   │   │   │   │   └── CouponService.java
│   │   │   │   │   ├── exception
│   │   │   │   │   │   ├── ControllerException.java
│   │   │   │   │   │   ├── CrimeCatException.java
│   │   │   │   │   │   ├── DomainException.java
│   │   │   │   │   │   ├── ErrorResponse.java
│   │   │   │   │   │   ├── ErrorStatus.java
│   │   │   │   │   │   ├── ExceptionController.java
│   │   │   │   │   │   └── ServiceException.java
│   │   │   │   │   ├── follow
│   │   │   │   │   │   ├── controller
│   │   │   │   │   │   │   ├── FollowController.java
│   │   │   │   │   │   │   └── PublicFollowController.java
│   │   │   │   │   │   ├── domain
│   │   │   │   │   │   │   └── Follow.java
│   │   │   │   │   │   ├── dto
│   │   │   │   │   │   │   └── FollowDto.java
│   │   │   │   │   │   ├── repository
│   │   │   │   │   │   │   └── FollowRepository.java
│   │   │   │   │   │   └── service
│   │   │   │   │   │   └── FollowService.java
│   │   │   │   │   ├── gameHistory
│   │   │   │   │   │   ├── controller
│   │   │   │   │   │   │   ├── BotGameHistoryController.java
│   │   │   │   │   │   │   └── WebGameHistoryController.java
│   │   │   │   │   │   ├── domain
│   │   │   │   │   │   │   └── GameHistory.java
│   │   │   │   │   │   ├── dto
│   │   │   │   │   │   │   ├── CheckPlayResponseDto.java
│   │   │   │   │   │   │   ├── GameHistoryUpdateRequestDto.java
│   │   │   │   │   │   │   ├── IGameHistoryRankingDto.java
│   │   │   │   │   │   │   ├── SaveUserGameHistoryRequestDto.java
│   │   │   │   │   │   │   ├── SaveUserHistoryResponseDto.java
│   │   │   │   │   │   │   ├── UserGameHistoryDto.java
│   │   │   │   │   │   │   ├── UserGameHistoryFailedResponseDto.java
│   │   │   │   │   │   │   ├── UserGameHistoryResponseDto.java
│   │   │   │   │   │   │   ├── UserGameHistorySuccessResponseDto.java
│   │   │   │   │   │   │   ├── UserGameHistoryToOwnerDto.java
│   │   │   │   │   │   │   ├── UserGameHistoryToUserDto.java
│   │   │   │   │   │   │   ├── WebHistoryRequestDto.java
│   │   │   │   │   │   │   └── WebHistoryResponseDto.java
│   │   │   │   │   │   ├── repository
│   │   │   │   │   │   │   └── GameHistoryRepository.java
│   │   │   │   │   │   ├── service
│   │   │   │   │   │   │   ├── BotGameHistoryService.java
│   │   │   │   │   │   │   ├── GameHistoryQueryService.java
│   │   │   │   │   │   │   └── WebGameHistoryService.java
│   │   │   │   │   │   └── sort
│   │   │   │   │   │   └── GameHistorySortType.java
│   │   │   │   │   ├── gametheme
│   │   │   │   │   │   ├── controller
│   │   │   │   │   │   │   ├── GameThemeController.java
│   │   │   │   │   │   │   ├── GameThemePublicController.java
│   │   │   │   │   │   │   ├── MakerTeamController.java
│   │   │   │   │   │   │   └── MakerTeamPublicController.java
│   │   │   │   │   │   ├── domain
│   │   │   │   │   │   │   ├── CrimesceneTheme.java
│   │   │   │   │   │   │   ├── GameTheme.java
│   │   │   │   │   │   │   ├── GameThemeRecommendation.java
│   │   │   │   │   │   │   ├── MakerTeam.java
│   │   │   │   │   │   │   └── MakerTeamMember.java
│   │   │   │   │   │   ├── dto
│   │   │   │   │   │   │   ├── AddCrimesceneThemeRequest.java
│   │   │   │   │   │   │   ├── AddGameThemeRequest.java
│   │   │   │   │   │   │   ├── AddMemberRequest.java
│   │   │   │   │   │   │   ├── AuthorDto.java
│   │   │   │   │   │   │   ├── CreateTeamRequest.java
│   │   │   │   │   │   │   ├── CrimesceneThemeDetailDto.java
│   │   │   │   │   │   │   ├── CrimesceneThemeDto.java
│   │   │   │   │   │   │   ├── CrimesceneThemeSummeryDto.java
│   │   │   │   │   │   │   ├── CrimesceneThemeSummeryListDto.java
│   │   │   │   │   │   │   ├── DeleteMembersRequest.java
│   │   │   │   │   │   │   ├── DeleteMembersResponse.java
│   │   │   │   │   │   │   ├── GameThemeDetailDto.java
│   │   │   │   │   │   │   ├── GameThemeDto.java
│   │   │   │   │   │   │   ├── GetGameThemeResponse.java
│   │   │   │   │   │   │   ├── GetGameThemesResponse.java
│   │   │   │   │   │   │   ├── GetLikeStatusResponse.java
│   │   │   │   │   │   │   ├── GetTeamResponse.java
│   │   │   │   │   │   │   ├── GetTeamsResponse.java
│   │   │   │   │   │   │   ├── MemberDto.java
│   │   │   │   │   │   │   ├── MemberRequestDto.java
│   │   │   │   │   │   │   ├── TeamDto.java
│   │   │   │   │   │   │   ├── UpdateCrimesceneThemeRequest.java
│   │   │   │   │   │   │   ├── UpdateGameThemeRequest.java
│   │   │   │   │   │   │   └── UpdateMemberRequest.java
│   │   │   │   │   │   ├── enums
│   │   │   │   │   │   │   └── ThemeType.java
│   │   │   │   │   │   ├── repository
│   │   │   │   │   │   │   ├── CrimesceneThemeRepository.java
│   │   │   │   │   │   │   ├── GameThemeRecommendationRepository.java
│   │   │   │   │   │   │   ├── GameThemeRepository.java
│   │   │   │   │   │   │   ├── MakerTeamMemberRepository.java
│   │   │   │   │   │   │   └── MakerTeamRepository.java
│   │   │   │   │   │   ├── service
│   │   │   │   │   │   │   ├── GameThemeService.java
│   │   │   │   │   │   │   ├── MakerTeamService.java
│   │   │   │   │   │   │   └── ViewCountService.java
│   │   │   │   │   │   ├── sort
│   │   │   │   │   │   │   └── GameThemeSortType.java
│   │   │   │   │   │   ├── specification
│   │   │   │   │   │   │   └── GameThemeSpecification.java
│   │   │   │   │   │   └── validator
│   │   │   │   │   │   ├── MinMaxCheck.java
│   │   │   │   │   │   ├── MinMaxChecks.java
│   │   │   │   │   │   ├── MinMaxListValidator.java
│   │   │   │   │   │   └── MinMaxValidator.java
│   │   │   │   │   ├── guild
│   │   │   │   │   │   ├── controller
│   │   │   │   │   │   │   ├── bot
│   │   │   │   │   │   │   │   ├── ChannelCleanController.java
│   │   │   │   │   │   │   │   ├── ChannelRecordController.java
│   │   │   │   │   │   │   │   ├── GuildController.java
│   │   │   │   │   │   │   │   ├── GuildMusicController.java
│   │   │   │   │   │   │   │   ├── GuildObservationController.java
│   │   │   │   │   │   │   │   └── PasswordNoteController.java
│   │   │   │   │   │   │   └── web
│   │   │   │   │   │   │   ├── WebGuildController.java
│   │   │   │   │   │   │   └── WebPublicGuildController.java
│   │   │   │   │   │   ├── domain
│   │   │   │   │   │   │   ├── Clean.java
│   │   │   │   │   │   │   ├── Guild.java
│   │   │   │   │   │   │   ├── Music.java
│   │   │   │   │   │   │   ├── Observation.java
│   │   │   │   │   │   │   ├── PasswordNote.java
│   │   │   │   │   │   │   └── Record.java
│   │   │   │   │   │   ├── dto
│   │   │   │   │   │   │   ├── bot
│   │   │   │   │   │   │   │   ├── ChannelCleanDto.java
│   │   │   │   │   │   │   │   ├── ChannelCleanListDto.java
│   │   │   │   │   │   │   │   ├── ChannelRecordDto.java
│   │   │   │   │   │   │   │   ├── ChannelRecordListResponseDto.java
│   │   │   │   │   │   │   │   ├── ChannelRecordRequestDto.java
│   │   │   │   │   │   │   │   ├── GuildDto.java
│   │   │   │   │   │   │   │   ├── GuildMusicDeletedResponseDto.java
│   │   │   │   │   │   │   │   ├── GuildMusicDto.java
│   │   │   │   │   │   │   │   ├── GuildMusicListResponseDto.java
│   │   │   │   │   │   │   │   ├── GuildMusicRequestDto.java
│   │   │   │   │   │   │   │   ├── GuildResponseDto.java
│   │   │   │   │   │   │   │   ├── MessageDto.java
│   │   │   │   │   │   │   │   ├── MessageOnlyResponseDto.java
│   │   │   │   │   │   │   │   ├── ObservationDto.java
│   │   │   │   │   │   │   │   ├── ObservationPatchRequestDto.java
│   │   │   │   │   │   │   │   ├── ObservationPostRequestDto.java
│   │   │   │   │   │   │   │   ├── PasswordNoteDto.java
│   │   │   │   │   │   │   │   ├── PasswordNoteListResponseDto.java
│   │   │   │   │   │   │   │   ├── PasswordNoteResponseDto.java
│   │   │   │   │   │   │   │   ├── PatchPasswordNoteRequestDto.java
│   │   │   │   │   │   │   │   └── SavePasswordNoteRequestDto.java
│   │   │   │   │   │   │   └── web
│   │   │   │   │   │   │   ├── ApiGetGuildInfoDto.java
│   │   │   │   │   │   │   ├── ChannelDto.java
│   │   │   │   │   │   │   ├── GuildBotInfoDto.java
│   │   │   │   │   │   │   ├── GuildInfoResponseDto.java
│   │   │   │   │   │   │   ├── GuildResponseDto.java
│   │   │   │   │   │   │   ├── RoleDto.java
│   │   │   │   │   │   │   └── RoleTags.java
│   │   │   │   │   │   ├── exception
│   │   │   │   │   │   │   └── GuildAlreadyExistsException.java
│   │   │   │   │   │   ├── repository
│   │   │   │   │   │   │   ├── ChannelCleanRepository.java
│   │   │   │   │   │   │   ├── ChannelRecordRepository.java
│   │   │   │   │   │   │   ├── GuildMusicRepository.java
│   │   │   │   │   │   │   ├── GuildObservationRepository.java
│   │   │   │   │   │   │   ├── GuildRepository.java
│   │   │   │   │   │   │   └── PasswordNoteRepository.java
│   │   │   │   │   │   ├── service
│   │   │   │   │   │   │   ├── bot
│   │   │   │   │   │   │   │   ├── ChannelCleanService.java
│   │   │   │   │   │   │   │   ├── ChannelRecordService.java
│   │   │   │   │   │   │   │   ├── GuildMusicService.java
│   │   │   │   │   │   │   │   ├── GuildObservationService.java
│   │   │   │   │   │   │   │   ├── GuildQueryService.java
│   │   │   │   │   │   │   │   ├── GuildService.java
│   │   │   │   │   │   │   │   ├── PasswordNoteService.java
│   │   │   │   │   │   │   │   └── PasswordNoteServiceImpl.java
│   │   │   │   │   │   │   └── web
│   │   │   │   │   │   │   └── WebGuildService.java
│   │   │   │   │   │   └── utils
│   │   │   │   │   │   └── RequestUtil.java
│   │   │   │   │   ├── hashtag
│   │   │   │   │   │   ├── controller
│   │   │   │   │   │   │   └── HashTagController.java
│   │   │   │   │   │   ├── domain
│   │   │   │   │   │   │   ├── HashTag.java
│   │   │   │   │   │   │   └── PostHashTag.java
│   │   │   │   │   │   ├── dto
│   │   │   │   │   │   │   └── HashTagDto.java
│   │   │   │   │   │   ├── repository
│   │   │   │   │   │   │   ├── HashTagRepository.java
│   │   │   │   │   │   │   └── PostHashTagRepository.java
│   │   │   │   │   │   └── service
│   │   │   │   │   │   └── HashTagService.java
│   │   │   │   │   ├── init
│   │   │   │   │   │   └── AdminUserRunner.java
│   │   │   │   │   ├── messagemacro
│   │   │   │   │   │   ├── controller
│   │   │   │   │   │   │   ├── BotMessageMacroController.java
│   │   │   │   │   │   │   └── MessageMacroController.java
│   │   │   │   │   │   ├── domain
│   │   │   │   │   │   │   ├── Group.java
│   │   │   │   │   │   │   └── GroupItem.java
│   │   │   │   │   │   ├── dto
│   │   │   │   │   │   │   ├── BotGroupResponseDto.java
│   │   │   │   │   │   │   ├── ButtonDto.java
│   │   │   │   │   │   │   ├── ContentDto.java
│   │   │   │   │   │   │   ├── GroupDto.java
│   │   │   │   │   │   │   ├── GroupItemRequestDto.java
│   │   │   │   │   │   │   └── GroupRequestDto.java
│   │   │   │   │   │   ├── repository
│   │   │   │   │   │   │   ├── GroupItemRepository.java
│   │   │   │   │   │   │   └── GroupRepository.java
│   │   │   │   │   │   └── service
│   │   │   │   │   │   └── MessageMacroService.java
│   │   │   │   │   ├── notice
│   │   │   │   │   │   ├── controller
│   │   │   │   │   │   │   └── NoticeController.java
│   │   │   │   │   │   ├── domain
│   │   │   │   │   │   │   ├── Notice.java
│   │   │   │   │   │   │   └── NoticeType.java
│   │   │   │   │   │   ├── dto
│   │   │   │   │   │   │   ├── NoticeReorderRequestDto.java
│   │   │   │   │   │   │   ├── NoticeRequestDto.java
│   │   │   │   │   │   │   ├── NoticeResponseDto.java
│   │   │   │   │   │   │   ├── NoticeSummaryResponseDto.java
│   │   │   │   │   │   │   └── PageResultDto.java
│   │   │   │   │   │   ├── repository
│   │   │   │   │   │   │   └── NoticeRepository.java
│   │   │   │   │   │   └── service
│   │   │   │   │   │   └── NoticeService.java
│   │   │   │   │   ├── notification
│   │   │   │   │   │   ├── builder
│   │   │   │   │   │   │   ├── FriendRequestBuilder.java
│   │   │   │   │   │   │   ├── GameRecordRequestBuilder.java
│   │   │   │   │   │   │   ├── GameRecordResponseBuilder.java
│   │   │   │   │   │   │   ├── NewThemeBuilder.java
│   │   │   │   │   │   │   ├── NotificationBuilder.java
│   │   │   │   │   │   │   ├── NotificationBuilders.java
│   │   │   │   │   │   │   └── SystemNotificationBuilder.java
│   │   │   │   │   │   ├── config
│   │   │   │   │   │   │   └── NotificationTemplateConfiguration.java
│   │   │   │   │   │   ├── controller
│   │   │   │   │   │   │   └── NotificationController.java
│   │   │   │   │   │   ├── domain
│   │   │   │   │   │   │   └── Notification.java
│   │   │   │   │   │   ├── dto
│   │   │   │   │   │   │   ├── request
│   │   │   │   │   │   │   │   ├── GameRecordAcceptDto.java
│   │   │   │   │   │   │   │   └── GameRecordDeclineDto.java
│   │   │   │   │   │   │   └── response
│   │   │   │   │   │   │   ├── NotificationDto.java
│   │   │   │   │   │   │   └── NotificationListDto.java
│   │   │   │   │   │   ├── enums
│   │   │   │   │   │   │   ├── NotificationStatus.java
│   │   │   │   │   │   │   └── NotificationType.java
│   │   │   │   │   │   ├── event
│   │   │   │   │   │   │   ├── GameRecordRequestEvent.java
│   │   │   │   │   │   │   ├── GameRecordResponseEvent.java
│   │   │   │   │   │   │   ├── NewThemeEvent.java
│   │   │   │   │   │   │   ├── NotificationEvent.java
│   │   │   │   │   │   │   ├── NotificationEventPublisher.java
│   │   │   │   │   │   │   └── SystemNotificationEvent.java
│   │   │   │   │   │   ├── handler
│   │   │   │   │   │   │   ├── AbstractNotificationHandler.java
│   │   │   │   │   │   │   ├── GameRecordRequestHandler.java
│   │   │   │   │   │   │   └── NotificationHandler.java
│   │   │   │   │   │   ├── listener
│   │   │   │   │   │   │   ├── NotificationAsyncConfig.java
│   │   │   │   │   │   │   └── NotificationEventListener.java
│   │   │   │   │   │   ├── repository
│   │   │   │   │   │   │   └── NotificationRepository.java
│   │   │   │   │   │   ├── service
│   │   │   │   │   │   │   ├── NotificationHandlerService.java
│   │   │   │   │   │   │   └── NotificationService.java
│   │   │   │   │   │   ├── sort
│   │   │   │   │   │   │   └── NotificationSortType.java
│   │   │   │   │   │   ├── template
│   │   │   │   │   │   │   ├── AbstractHandlebarsNotificationTemplate.java
│   │   │   │   │   │   │   ├── HandlebarsMessageRenderer.java
│   │   │   │   │   │   │   ├── impl
│   │   │   │   │   │   │   │   ├── GameRecordRequestTemplate.java
│   │   │   │   │   │   │   │   ├── GameRecordResponseTemplate.java
│   │   │   │   │   │   │   │   └── SystemNotificationTemplate.java
│   │   │   │   │   │   │   ├── NotificationTemplate.java
│   │   │   │   │   │   │   ├── TemplateRegistry.java
│   │   │   │   │   │   │   ├── TemplateService.java
│   │   │   │   │   │   │   └── TypedNotificationTemplate.java
│   │   │   │   │   │   └── utils
│   │   │   │   │   │   └── JsonUtil.java
│   │   │   │   │   ├── permission
│   │   │   │   │   │   ├── controller
│   │   │   │   │   │   │   ├── PermissionController.java
│   │   │   │   │   │   │   └── WebUserPermissionController.java
│   │   │   │   │   │   ├── domain
│   │   │   │   │   │   │   └── Permission.java
│   │   │   │   │   │   ├── dto
│   │   │   │   │   │   │   ├── AllPermissionsWithUserStatusResponseDto.java
│   │   │   │   │   │   │   ├── DeletePermissionResponseDto.java
│   │   │   │   │   │   │   ├── ModifyPermissionRequestDto.java
│   │   │   │   │   │   │   ├── ModifyPermissionResponseDto.java
│   │   │   │   │   │   │   ├── PermissionExtendResponseDto.java
│   │   │   │   │   │   │   ├── PermissionPurchaseDataDto.java
│   │   │   │   │   │   │   ├── PermissionPurchaseResponseDto.java
│   │   │   │   │   │   │   ├── PermissionPurchaseWebRequestDto.java
│   │   │   │   │   │   │   ├── PermissionsResponseDto.java
│   │   │   │   │   │   │   ├── PermissionWithStatusDto.java
│   │   │   │   │   │   │   ├── SavePermissionRequestDto.java
│   │   │   │   │   │   │   └── SavePermissionResponseDto.java
│   │   │   │   │   │   ├── repository
│   │   │   │   │   │   │   └── PermissionRepository.java
│   │   │   │   │   │   └── service
│   │   │   │   │   │   ├── PermissionQueryService.java
│   │   │   │   │   │   ├── PermissionService.java
│   │   │   │   │   │   └── WebUserPermissionService.java
│   │   │   │   │   ├── point
│   │   │   │   │   │   ├── controller
│   │   │   │   │   │   │   └── PointHistoryController.java
│   │   │   │   │   │   ├── domain
│   │   │   │   │   │   │   ├── ItemType.java
│   │   │   │   │   │   │   ├── PointHistory.java
│   │   │   │   │   │   │   └── TransactionType.java
│   │   │   │   │   │   ├── dto
│   │   │   │   │   │   │   ├── PointHistoryResponseDto.java
│   │   │   │   │   │   │   └── PointHistorySummaryDto.java
│   │   │   │   │   │   ├── repository
│   │   │   │   │   │   │   └── PointHistoryRepository.java
│   │   │   │   │   │   ├── service
│   │   │   │   │   │   │   ├── PointHistoryQueryService.java
│   │   │   │   │   │   │   └── PointHistoryService.java
│   │   │   │   │   │   └── sort
│   │   │   │   │   │   └── PointHistorySortType.java
│   │   │   │   │   ├── postComment
│   │   │   │   │   │   ├── domain
│   │   │   │   │   │   │   ├── PostComment.java
│   │   │   │   │   │   │   └── PostCommentLike.java
│   │   │   │   │   │   └── repository
│   │   │   │   │   │   └── PostCommentRepository.java
│   │   │   │   │   ├── stats
│   │   │   │   │   │   ├── controller
│   │   │   │   │   │   │   ├── WebPersonalInfo.java
│   │   │   │   │   │   │   └── WebStatsInfo.java
│   │   │   │   │   │   ├── proxy
│   │   │   │   │   │   │   └── WebStatsInfoServiceProxy.java
│   │   │   │   │   │   └── service
│   │   │   │   │   │   └── WebStatsInfoService.java
│   │   │   │   │   ├── storage
│   │   │   │   │   │   ├── FileSystemStorageService.java
│   │   │   │   │   │   ├── StorageFileType.java
│   │   │   │   │   │   ├── StorageProperties.java
│   │   │   │   │   │   └── StorageService.java
│   │   │   │   │   ├── user
│   │   │   │   │   │   ├── controller
│   │   │   │   │   │   │   └── UserController.java
│   │   │   │   │   │   ├── domain
│   │   │   │   │   │   │   ├── DiscordUser.java
│   │   │   │   │   │   │   ├── User.java
│   │   │   │   │   │   │   └── UserPermission.java
│   │   │   │   │   │   ├── dto
│   │   │   │   │   │   │   ├── TotalGuildRankingByPlayCountDto.java
│   │   │   │   │   │   │   ├── TotalUserRankingByMakerDto.java
│   │   │   │   │   │   │   ├── TotalUserRankingByPlayTimeDto.java
│   │   │   │   │   │   │   ├── TotalUserRankingByPointDto.java
│   │   │   │   │   │   │   ├── TotalUserRankingDto.java
│   │   │   │   │   │   │   ├── TotalUserRankingFailedResponseDto.java
│   │   │   │   │   │   │   ├── TotalUserRankingResponseDto.java
│   │   │   │   │   │   │   ├── TotalUserRankingSuccessResponseDto.java
│   │   │   │   │   │   │   ├── UserDbInfoDto.java
│   │   │   │   │   │   │   ├── UserDbInfoResponseDto.java
│   │   │   │   │   │   │   ├── UserGrantedPermissionDto.java
│   │   │   │   │   │   │   ├── UserGrantedPermissionResponseDto.java
│   │   │   │   │   │   │   ├── UserHasPermissionResponseDto.java
│   │   │   │   │   │   │   ├── UserInfoRequestDto.java
│   │   │   │   │   │   │   ├── UserInfoResponseDto.java
│   │   │   │   │   │   │   ├── UserListResponseDto.java
│   │   │   │   │   │   │   ├── UserPatchDto.java
│   │   │   │   │   │   │   ├── UserPatchRequestDto.java
│   │   │   │   │   │   │   ├── UserPatchResponseDto.java
│   │   │   │   │   │   │   ├── UserPermissionPurchaseDto.java
│   │   │   │   │   │   │   ├── UserPermissionPurchaseFailedResponseDto.java
│   │   │   │   │   │   │   ├── UserPermissionPurchaseRequestDto.java
│   │   │   │   │   │   │   ├── UserPermissionPurchaseResponseDto.java
│   │   │   │   │   │   │   ├── UserPermissionPurchaseSuccessResponseDto.java
│   │   │   │   │   │   │   ├── UserRankingFailedResponseDto.java
│   │   │   │   │   │   │   ├── UserRankingResponseDto.java
│   │   │   │   │   │   │   ├── UserRankingSuccessResponseDto.java
│   │   │   │   │   │   │   └── UserResponseDto.java
│   │   │   │   │   │   ├── repository
│   │   │   │   │   │   │   ├── DiscordUserRepository.java
│   │   │   │   │   │   │   ├── UserPermissionRepository.java
│   │   │   │   │   │   │   └── UserRepository.java
│   │   │   │   │   │   └── service
│   │   │   │   │   │   ├── DiscordUserQueryService.java
│   │   │   │   │   │   ├── UserPermissionQueryService.java
│   │   │   │   │   │   ├── UserPermissionService.java
│   │   │   │   │   │   └── UserService.java
│   │   │   │   │   ├── userPost
│   │   │   │   │   │   ├── controller
│   │   │   │   │   │   │   ├── explore
│   │   │   │   │   │   │   │   └── ExploreController.java
│   │   │   │   │   │   │   ├── PublicUserPostCommentController.java
│   │   │   │   │   │   │   ├── PublicUserPostController.java
│   │   │   │   │   │   │   ├── saved
│   │   │   │   │   │   │   │   └── SavedPostController.java
│   │   │   │   │   │   │   ├── UserPostCommentController.java
│   │   │   │   │   │   │   └── UserPostController.java
│   │   │   │   │   │   ├── domain
│   │   │   │   │   │   │   ├── saved
│   │   │   │   │   │   │   │   └── SavedPost.java
│   │   │   │   │   │   │   ├── UserPost.java
│   │   │   │   │   │   │   ├── UserPostComment.java
│   │   │   │   │   │   │   ├── UserPostImage.java
│   │   │   │   │   │   │   └── UserPostLike.java
│   │   │   │   │   │   ├── dto
│   │   │   │   │   │   │   ├── CreateUserPostRequest.java
│   │   │   │   │   │   │   ├── SavedPostRequestDto.java
│   │   │   │   │   │   │   ├── UpdateUserPostRequest.java
│   │   │   │   │   │   │   ├── UserPostCommentDto.java
│   │   │   │   │   │   │   ├── UserPostCommentRequest.java
│   │   │   │   │   │   │   ├── UserPostDto.java
│   │   │   │   │   │   │   ├── UserPostGalleryDto.java
│   │   │   │   │   │   │   └── UserPostGalleryPageDto.java
│   │   │   │   │   │   ├── repository
│   │   │   │   │   │   │   ├── saved
│   │   │   │   │   │   │   │   └── SavedPostRepository.java
│   │   │   │   │   │   │   ├── UserPostCommentRepository.java
│   │   │   │   │   │   │   ├── UserPostImageRepository.java
│   │   │   │   │   │   │   ├── UserPostLikeRepository.java
│   │   │   │   │   │   │   └── UserPostRepository.java
│   │   │   │   │   │   ├── service
│   │   │   │   │   │   │   ├── saved
│   │   │   │   │   │   │   │   └── SavedPostService.java
│   │   │   │   │   │   │   ├── UserPostCommentService.java
│   │   │   │   │   │   │   ├── UserPostCommentServiceImpl.java
│   │   │   │   │   │   │   ├── UserPostService.java
│   │   │   │   │   │   │   └── UserPostServiceImpl.java
│   │   │   │   │   │   └── sort
│   │   │   │   │   │   ├── UserPostCommentSortType.java
│   │   │   │   │   │   └── UserPostSortType.java
│   │   │   │   │   ├── utils
│   │   │   │   │   │   ├── AuthenticationUtil.java
│   │   │   │   │   │   ├── FileUtil.java
│   │   │   │   │   │   ├── ipInterceptor
│   │   │   │   │   │   │   └── ClientIpInterceptor.java
│   │   │   │   │   │   ├── ObjectUtil.java
│   │   │   │   │   │   ├── ProfileChecker.java
│   │   │   │   │   │   ├── RedisDbType.java
│   │   │   │   │   │   ├── RedisInfoDb.java
│   │   │   │   │   │   ├── sort
│   │   │   │   │   │   │   ├── SortType.java
│   │   │   │   │   │   │   └── SortUtil.java
│   │   │   │   │   │   ├── TokenCookieUtil.java
│   │   │   │   │   │   └── UserDailyCheckUtil.java
│   │   │   │   │   └── webUser
│   │   │   │   │   ├── controller
│   │   │   │   │   │   ├── WebUserController.java
│   │   │   │   │   │   └── WebUserPublicController.java
│   │   │   │   │   ├── domain
│   │   │   │   │   │   └── WebUser.java
│   │   │   │   │   ├── dto
│   │   │   │   │   │   ├── FindUserInfo.java
│   │   │   │   │   │   ├── NicknameCheckResponseDto.java
│   │   │   │   │   │   ├── NotificationSettingsRequestDto.java
│   │   │   │   │   │   ├── NotificationSettingsResponseDto.java
│   │   │   │   │   │   ├── NotificationToggleRequest.java
│   │   │   │   │   │   ├── ProfileDetailDto.java
│   │   │   │   │   │   ├── UserProfileInfoResponseDto.java
│   │   │   │   │   │   ├── UserSearchResponseDto.java
│   │   │   │   │   │   └── WebUserProfileEditRequestDto.java
│   │   │   │   │   ├── enums
│   │   │   │   │   │   ├── LoginMethod.java
│   │   │   │   │   │   └── UserRole.java
│   │   │   │   │   ├── repository
│   │   │   │   │   │   └── WebUserRepository.java
│   │   │   │   │   └── service
│   │   │   │   │   └── WebUserService.java
│   │   │   │   └── postComment
│   │   │   │   └── domain
│   │   │   │   └── PostComment.java
│   │   │   └── resources
│   │   │   ├── application-local.yml
│   │   │   └── application-prod.yml
│   │   └── test
│   │   └── java
│   │   └── com
│   │   └── crimecat
│   │   └── backend
│   │   ├── authorization
│   │   │   ├── AuthIntegrationTest.java
│   │   │   └── WebUserCreationTest.java
│   │   ├── BackendApplicationTests.java
│   │   ├── Command
│   │   │   ├── CommandServiceControllerTest.java
│   │   │   └── CommandServiceTest.java
│   │   ├── coupon
│   │   │   └── CouponApiTest.java
│   │   ├── guild
│   │   │   └── BotGuildServiceTest.java
│   │   ├── messagemecro
│   │   │   ├── MessageMacroControllerTest.java
│   │   │   └── MessageMacroServiceTest.java
│   │   └── pointHistory
│   │   └── PointHistoryServiceTest.java
│   └── upload-dir
├── backup
│   ├── 20250509_210813
│   ├── 20250509_210931
│   ├── 20250509_210947
│   ├── 20250509_211715
│   ├── 20250509_212243
│   ├── 20250520_111035
│   ├── 20250520_111122
│   ├── 20250520_111300
│   └── backup.sh
├── bot
│   ├── Commands
│   │   ├── 계산.js
│   │   ├── 고양이.js
│   │   ├── 관전.js
│   │   ├── 관전설정.js
│   │   ├── 권한삭제.js
│   │   ├── 권한생성.js
│   │   ├── 권한수정.js
│   │   ├── 권한업글.js
│   │   ├── 귀여워.js
│   │   ├── 기록.js
│   │   ├── 기록삭제.js
│   │   ├── 길드공개.js
│   │   ├── 로그.js
│   │   ├── 배포.js
│   │   ├── 버튼.js
│   │   ├── 볼륨.js
│   │   ├── 부여.js
│   │   ├── 비번.js
│   │   ├── 비번삭제.js
│   │   ├── 비번설정.js
│   │   ├── 비번수정.js
│   │   ├── 삭제.js
│   │   ├── 설문.js
│   │   ├── 셋팅.js
│   │   ├── 심문.js
│   │   ├── 심문초기화.js
│   │   ├── 알림.js
│   │   ├── 야옹이.js
│   │   ├── 이미지.js
│   │   ├── 정보.js
│   │   ├── 제거.js
│   │   ├── 주사위.js
│   │   ├── 주소삭제.js
│   │   ├── 주소추가.js
│   │   ├── 청소.js
│   │   ├── 추가.js
│   │   ├── 캐릭터.js
│   │   ├── 캐릭터제거.js
│   │   ├── 캐릭터추가.js
│   │   ├── 컨텍스트.js
│   │   ├── 코드사용.js
│   │   ├── 코드생성.js
│   │   ├── 타이머.js
│   │   ├── 투표.js
│   │   ├── 파일삭제.js
│   │   ├── 파일업로드.js
│   │   ├── 프로필.js
│   │   ├── 해제.js
│   │   ├── api
│   │   │   ├── channel
│   │   │   │   └── channel.js
│   │   │   ├── character
│   │   │   │   └── character.js
│   │   │   ├── coupon
│   │   │   │   └── coupon.js
│   │   │   ├── guild
│   │   │   │   ├── guild.js
│   │   │   │   ├── music.js
│   │   │   │   └── observer.js
│   │   │   ├── history
│   │   │   │   └── history.js
│   │   │   ├── messageMacro
│   │   │   │   └── messageMacro.js
│   │   │   ├── passwordNote
│   │   │   │   └── passwordNote.js
│   │   │   └── user
│   │   │   ├── permission.js
│   │   │   └── user.js
│   │   ├── bc.js
│   │   ├── cdb.js
│   │   ├── dm.js
│   │   ├── ping.js
│   │   ├── showguild.js
│   │   └── utility
│   │   ├── addObserverPemission.js
│   │   ├── AudioPlayerManager.js
│   │   ├── broadcastGameStart.js
│   │   ├── buttonsBuilder.js
│   │   ├── cleaner.js
│   │   ├── clientVariables.js
│   │   ├── Debounce.js
│   │   ├── deleteMsg.js
│   │   ├── delimiterGeter.js
│   │   ├── loadCommand.js
│   │   ├── loadEvent.js
│   │   ├── loadResponse.js
│   │   ├── logger.js
│   │   ├── ping.js
│   │   ├── PlaylistManager.js
│   │   ├── redis.js
│   │   ├── server.js
│   │   ├── termsSender.js
│   │   ├── updateActivity.js
│   │   ├── UrlManager.js
│   │   ├── user.js
│   │   ├── UserinfoInRedis.js
│   │   ├── userInfoToImage.js
│   │   └── ytdlpUpdate.js
│   ├── deploy.js
│   ├── ecosystem.config.js
│   ├── Events
│   │   ├── Guild
│   │   │   └── addUserInGuild.js
│   │   ├── interaction
│   │   │   ├── autoComplete.js
│   │   │   ├── buttonClick.js
│   │   │   ├── inputModal.js
│   │   │   ├── interactionCreate.js
│   │   │   └── selectMenu.js
│   │   ├── Message
│   │   │   ├── dmMessage.js
│   │   │   └── messageCreate.js
│   │   └── Voice
│   │   └── voiceChannelConnectionState.js
│   ├── main.js
│   ├── nodemon.json
│   ├── package-lock.json
│   ├── package.json
│   ├── prompt
│   │   └── 1328921864252293130
│   │   ├── 박도윤.prpt
│   │   ├── 한수현.prpt
│   │   └── 황도윤.prpt
│   ├── Response
│   │   ├── Autocomplete
│   │   │   ├── channelName.js
│   │   │   ├── fileNames.js
│   │   │   ├── guildNames.js
│   │   │   ├── logFileName.js
│   │   │   ├── musicTitle.js
│   │   │   ├── passwordKey.js
│   │   │   ├── permissionPrice.js
│   │   │   └── roleNames.js
│   │   ├── Buttons
│   │   │   ├── assignObserver.js
│   │   │   ├── characterChoice.js
│   │   │   ├── endVote.js
│   │   │   ├── formEvent.js
│   │   │   ├── logHandler.js
│   │   │   ├── messageMacro.js
│   │   │   ├── musicPlayerButton.js
│   │   │   ├── pageNation.js
│   │   │   ├── request.js
│   │   │   └── voteChoice.js
│   │   ├── Modals
│   │   │   ├── broadcastModal.js
│   │   │   ├── editPasswordNote.js
│   │   │   ├── saveChannelMessage.js
│   │   │   └── savePasswordNote.js
│   │   └── SelectMenus
│   │   └── playListUrl.js
│   ├── templet.js
│   └── update_logger.js
├── config
│   ├── application-local.yml
│   ├── application-prod.yml
│   ├── dockercompose
│   │   ├── docker-compose.dev.yaml
│   │   ├── docker-compose.local.yaml
│   │   └── docker-compose.prod.yaml
│   ├── nginx
│   │   ├── dev.nginx.conf
│   │   ├── local.nginx.conf
│   │   └── prod.nginx.conf
│   └── README.md
├── database
│   └── mariadb
│   └── data
├── discord
│   ├── db.opt
│   ├── guild_url.frm
│   ├── guild_url.ibd
│   ├── guild.frm
│   ├── guild.ibd
│   ├── history.frm
│   ├── history.ibd
│   ├── user_url.frm
│   ├── user_url.ibd
│   ├── users.frm
│   └── users.ibd
├── docker
│   ├── adminer
│   │   ├── adminer.sh
│   │   └── Dockerfile
│   ├── backend
│   │   └── Dockerfile
│   ├── caddy
│   │   ├── Caddyfile
│   │   ├── dockerfile
│   │   └── entrypoint.sh
│   ├── discord
│   │   ├── Dockerfile
│   │   └── entrypoint.sh
│   ├── frontend
│   │   ├── Dockerfile
│   │   └── entrypoint.sh
│   ├── mariadb
│   │   ├── db
│   │   │   ├── config
│   │   │   │   └── my.cnf
│   │   │   ├── init
│   │   │   │   ├── 01-create-databases.template.sql
│   │   │   │   ├── 02-create-tables.template.sql
│   │   │   │   ├── 02b-create-tables-rest.template.sql
│   │   │   │   └── 03-alter-tables-edit.template.sql
│   │   │   ├── migrations
│   │   │   │   ├── schema_version.sql
│   │   │   │   ├── V1.1.0
│   │   │   │   │   ├── V1.1.0_001_add_emai_alret_on_web_user_table.sql
│   │   │   │   │   ├── V1.1.0_002_add_is_individual_to_maker_teams_table.sql
│   │   │   │   │   ├── V1.1.0_003_update_maker_team_members_table.sql
│   │   │   │   │   ├── V1.1.0_004_update_maker_team_members_table.sql
│   │   │   │   │   ├── V1.1.0_005_update_game_themes_table.sql
│   │   │   │   │   ├── V1.1.0_006_rename_user_id_to_web_user_id_on_game_theme_recommendations_table.sql
│   │   │   │   │   ├── V1.1.0_007_add_comment_tables.sql
│   │   │   │   │   ├── V1.1.0_008_change_gamehistory_table_discord_user_to_user.sql
│   │   │   │   │   ├── V1.1.0_009_update_crimescene_table.sql
│   │   │   │   │   ├── V1.1.0_010_add_is_public_to_guilds.sql
│   │   │   │   │   ├── V1.1.0_010_add_post_post_comment_table.sql
│   │   │   │   │   └── V1.1.0_011_update_game_themes_permit_like_comment.sql
│   │   │   │   ├── V1.2.0
│   │   │   │   │   └── V1.2.0_001_complete_notification_system.sql
│   │   │   │   ├── V1.2.1
│   │   │   │   │   └── V1.2.1_001_dynamic_nullable_and_updatable.sql
│   │   │   │   ├── V1.2.2
│   │   │   │   │   ├── V1.2.2_001_user_post_feat_tables.sql
│   │   │   │   │   └── V1.2.2_002_user_post_privacy_comment_tables.sql
│   │   │   │   ├── V1.2.3
│   │   │   │   │   └── V1.2.3_001_follow_table.sql
│   │   │   │   └── V1.2.4
│   │   │   │   └── V1.2.4_001_hashtag_and_saved_post_tables.sql
│   │   │   └── schema_version.sql
│   │   ├── Dockerfile
│   │   ├── migration.sh
│   │   └── script.sh
│   ├── nextjs
│   │   └── dockerfile
│   ├── nginx
│   │   ├── certs
│   │   │   ├── dev.crimecat.org-key.pem
│   │   │   └── dev.crimecat.org.pem
│   │   ├── conf
│   │   │   ├── http.d
│   │   │   │   └── nginx.conf
│   │   │   └── nginx.conf
│   │   ├── dockerfile
│   │   └── tools
│   │   └── nginx.sh
│   ├── redis
│   │   └── dockerfile
│   └── webserver
│   ├── dockerfile
│   └── entrypoint.sh
├── docker-compose.yaml
├── frontend
│   ├── bun.lockb
│   ├── components.json
│   ├── dist
│   │   ├── assets
│   │   │   ├── index-BmwrMwXp.css
│   │   │   └── index-DMz3IVKR.js
│   │   ├── content
│   │   │   ├── image
│   │   │   │   ├── character.png
│   │   │   │   ├── default.png
│   │   │   │   ├── donation.JPG
│   │   │   │   ├── icon.png
│   │   │   │   ├── insomnia.png
│   │   │   │   ├── insomniaSecond.jpg
│   │   │   │   ├── nonpagenation.png
│   │   │   │   ├── pagenation.png
│   │   │   │   ├── permissioncheck.png
│   │   │   │   └── player.png
│   │   │   └── video
│   │   │   ├── botAppAdd.mp4
│   │   │   └── observerCommand.mp4
│   │   ├── index.html
│   │   ├── placeholder.svg
│   │   └── vite.svg
│   ├── eslint.config.js
│   ├── index.html
│   ├── package-lock.json
│   ├── package.json
│   ├── postcss.config.js
│   ├── public
│   │   ├── content
│   │   │   ├── image
│   │   │   │   ├── 404.png
│   │   │   │   ├── character.png
│   │   │   │   ├── default_bar2.png
│   │   │   │   ├── default_image_none_bg.png
│   │   │   │   ├── default_image.png
│   │   │   │   ├── default_image2.png
│   │   │   │   ├── default.png
│   │   │   │   ├── donation.JPG
│   │   │   │   ├── emptyNotice.png
│   │   │   │   ├── hero_crime_butterfly.png
│   │   │   │   ├── hero_crime_poisonNight.jpg
│   │   │   │   ├── hero_crime.png
│   │   │   │   ├── icon.png
│   │   │   │   ├── insomnia.png
│   │   │   │   ├── insomniaSecond.jpg
│   │   │   │   ├── Login.png
│   │   │   │   ├── LoginError.png
│   │   │   │   ├── logo_bg.png
│   │   │   │   ├── logo_dark.png
│   │   │   │   ├── logo_light.png
│   │   │   │   ├── mystery_place_dark.png
│   │   │   │   ├── mystery_place_light.png
│   │   │   │   ├── mystery_place.png
│   │   │   │   ├── nonpagenation.png
│   │   │   │   ├── pagenation.png
│   │   │   │   ├── permissioncheck.png
│   │   │   │   └── player.png
│   │   │   └── video
│   │   │   ├── botAppAdd.mp4
│   │   │   └── observerCommand.mp4
│   │   ├── favicon
│   │   │   ├── android-chrome-192x192.png
│   │   │   ├── android-chrome-512x512.png
│   │   │   ├── apple-touch-icon.png
│   │   │   ├── browserconfig.xml
│   │   │   ├── favicon-16x16.png
│   │   │   ├── favicon-32x32.png
│   │   │   ├── favicon.ico
│   │   │   ├── manifest.json
│   │   │   └── site.webmanifest
│   │   ├── placeholder.svg
│   │   └── vite.svg
│   ├── README.md
│   ├── server.js
│   ├── src
│   │   ├── api
│   │   │   ├── authService.ts
│   │   │   ├── boardPostService.ts
│   │   │   ├── commandsService.ts
│   │   │   ├── commentService.ts
│   │   │   ├── couponService.ts
│   │   │   ├── dailycheckService.ts
│   │   │   ├── follow
│   │   │   │   └── index.ts
│   │   │   ├── gameHistoryService.ts
│   │   │   ├── guildsService.ts
│   │   │   ├── mainstatsService.ts
│   │   │   ├── messageButtonService.ts
│   │   │   ├── naverMapService.ts
│   │   │   ├── noticesService.ts
│   │   │   ├── notificationService.ts
│   │   │   ├── permissionService.ts
│   │   │   ├── profile
│   │   │   │   ├── account.ts
│   │   │   │   ├── api-spec.md
│   │   │   │   ├── badges.ts
│   │   │   │   ├── detail.ts
│   │   │   │   ├── index.ts
│   │   │   │   ├── nickname.ts
│   │   │   │   ├── notifications.ts
│   │   │   │   ├── profile.ts
│   │   │   │   ├── themes.ts
│   │   │   │   └── types.ts
│   │   │   ├── searchUserService.ts
│   │   │   ├── sns
│   │   │   │   ├── exploreService.ts
│   │   │   │   ├── hashtagService.ts
│   │   │   │   ├── index.ts
│   │   │   │   ├── locationService.ts
│   │   │   │   └── savePostService.ts
│   │   │   ├── statsService.ts
│   │   │   ├── teamsService.ts
│   │   │   ├── themesService.ts
│   │   │   ├── userGrantedPermissionService.ts
│   │   │   ├── userInfoService.ts
│   │   │   └── userPost
│   │   │   ├── userPostCommentService.ts
│   │   │   └── userPostService.ts
│   │   ├── App.css
│   │   ├── App.tsx
│   │   ├── atoms
│   │   │   ├── auth.ts
│   │   │   ├── notification.ts
│   │   │   └── theme.ts
│   │   ├── components
│   │   │   ├── AuthInitializer.tsx
│   │   │   ├── boards
│   │   │   │   ├── BoardFilter.tsx
│   │   │   │   ├── BoardHeader.tsx
│   │   │   │   ├── BoardPagination.tsx
│   │   │   │   └── BoardPostItem.tsx
│   │   │   ├── button.tsx
│   │   │   ├── commands
│   │   │   │   ├── CommandForm.tsx
│   │   │   │   └── CommandList.tsx
│   │   │   ├── comments
│   │   │   │   ├── CommentForm.tsx
│   │   │   │   ├── CommentItem.tsx
│   │   │   │   ├── CommentList.tsx
│   │   │   │   └── index.ts
│   │   │   ├── content.tsx
│   │   │   ├── dashboard
│   │   │   │   ├── DailyCheckCard.tsx
│   │   │   │   ├── PlayInfoCard.tsx
│   │   │   │   ├── ProfileCard.tsx
│   │   │   │   └── TeamDetailModal.tsx
│   │   │   ├── DesktopPermissionCard.tsx
│   │   │   ├── draggable.tsx
│   │   │   ├── ExpiryInfo.tsx
│   │   │   ├── game
│   │   │   │   ├── GameHistoryFilter.tsx
│   │   │   │   ├── GameHistoryItem.tsx
│   │   │   │   └── GamePagination.tsx
│   │   │   ├── group.tsx
│   │   │   ├── Hero.tsx
│   │   │   ├── home
│   │   │   │   ├── AnnouncementSection.tsx
│   │   │   │   ├── BotAddSection.tsx
│   │   │   │   ├── CurrentGamesSection.tsx
│   │   │   │   ├── GameAdsSection.tsx
│   │   │   │   ├── LatestPostsSection.tsx
│   │   │   │   └── StatsSection.tsx
│   │   │   ├── MarkdownRenderer.tsx
│   │   │   ├── message-editor
│   │   │   │   ├── ContentList.tsx
│   │   │   │   ├── SortableButton.tsx
│   │   │   │   ├── SortableButtonList.tsx
│   │   │   │   └── SortableGroup.tsx
│   │   │   ├── MobilePermissionCard.tsx
│   │   │   ├── Navbar.tsx
│   │   │   ├── notices
│   │   │   │   └── NoticeForm.tsx
│   │   │   ├── notification
│   │   │   │   ├── GameRecordAcceptModal.tsx
│   │   │   │   ├── GameRecordDeclineModal.tsx
│   │   │   │   ├── GameRecordNotificationItem.tsx
│   │   │   │   └── SystemNotificationItem.tsx
│   │   │   ├── NotificationBadge.tsx
│   │   │   ├── NotificationDropdown.tsx
│   │   │   ├── NotificationIcon.tsx
│   │   │   ├── NotificationItem.tsx
│   │   │   ├── PageTransition.tsx
│   │   │   ├── PermissionBadge.tsx
│   │   │   ├── PermissionButton.tsx
│   │   │   ├── PermissionHeader.tsx
│   │   │   ├── PrivateRoute.tsx
│   │   │   ├── profile
│   │   │   │   ├── BadgeSelectModal.tsx
│   │   │   │   ├── comments
│   │   │   │   │   ├── CommentForm.tsx
│   │   │   │   │   ├── CommentItem.tsx
│   │   │   │   │   ├── CommentList.tsx
│   │   │   │   │   └── index.ts
│   │   │   │   ├── CropImageModal.tsx
│   │   │   │   ├── ModalCommentList.tsx
│   │   │   │   ├── NotificationSettings.tsx
│   │   │   │   ├── post-comments
│   │   │   │   │   ├── index.ts
│   │   │   │   │   ├── PostCommentForm.tsx
│   │   │   │   │   ├── PostCommentItem.tsx
│   │   │   │   │   └── PostCommentList.tsx
│   │   │   │   ├── post-detail
│   │   │   │   │   ├── DesktopPostLayout.tsx
│   │   │   │   │   ├── index.ts
│   │   │   │   │   ├── MobilePostLayout.tsx
│   │   │   │   │   ├── PostImageSection.tsx
│   │   │   │   │   └── PostInfoContent.tsx
│   │   │   │   ├── PostDetailModal.tsx
│   │   │   │   ├── PostModalCommentList.tsx
│   │   │   │   ├── ProfileAvatar.tsx
│   │   │   │   ├── ProfileBio.tsx
│   │   │   │   ├── ProfileDetailModal.tsx
│   │   │   │   ├── ProfileFollowerList.tsx
│   │   │   │   ├── ProfileFollowingList.tsx
│   │   │   │   ├── ProfileForm.tsx
│   │   │   │   ├── ProfileHeader.tsx
│   │   │   │   ├── ProfilePostGrid.tsx
│   │   │   │   ├── ProfileThemeGrid.tsx
│   │   │   │   ├── SocialLinks.tsx
│   │   │   │   ├── theme-detail
│   │   │   │   │   ├── DesktopThemeLayout.tsx
│   │   │   │   │   ├── index.ts
│   │   │   │   │   ├── MobileThemeLayout.tsx
│   │   │   │   │   ├── tab-custom.css
│   │   │   │   │   ├── ThemeImageSection.tsx
│   │   │   │   │   └── ThemeInfoContent.tsx
│   │   │   │   ├── ThemeDetailModal.tsx
│   │   │   │   ├── ThemeDetailModal.tsx.part2.backup
│   │   │   │   └── UserListItem.tsx
│   │   │   ├── sns
│   │   │   │   ├── common
│   │   │   │   │   └── LazyImage.tsx
│   │   │   │   ├── explore
│   │   │   │   ├── hashtag
│   │   │   │   │   └── HashTagInput.tsx
│   │   │   │   ├── location
│   │   │   │   │   └── LocationPicker.tsx
│   │   │   │   ├── post
│   │   │   │   │   ├── ImageCarousel.tsx
│   │   │   │   │   ├── PostCard.tsx
│   │   │   │   │   └── PostGrid.tsx
│   │   │   │   └── save
│   │   │   │   └── SaveButton.tsx
│   │   │   ├── themes
│   │   │   │   ├── detail
│   │   │   │   │   ├── index.ts
│   │   │   │   │   ├── ThemeActions.tsx
│   │   │   │   │   ├── ThemeComments.tsx
│   │   │   │   │   ├── ThemeContent.tsx
│   │   │   │   │   ├── ThemeGuildInfo.tsx
│   │   │   │   │   ├── ThemeHeader.tsx
│   │   │   │   │   ├── ThemeInfoGrid.tsx
│   │   │   │   │   ├── ThemeModals.tsx
│   │   │   │   │   └── ThemeTeamInfo.tsx
│   │   │   │   ├── filters
│   │   │   │   │   ├── DifficultyFilter.tsx
│   │   │   │   │   ├── NumberRangeFilter.tsx
│   │   │   │   │   ├── ThemeFilters.tsx
│   │   │   │   │   └── types.ts
│   │   │   │   ├── modals
│   │   │   │   │   ├── ContactUserModal.tsx
│   │   │   │   │   ├── GuildInfoModal.tsx
│   │   │   │   │   ├── GuildSelectModal.tsx
│   │   │   │   │   ├── LocalSearchModal.tsx
│   │   │   │   │   ├── TeamInfoModal.tsx
│   │   │   │   │   └── TeamSelectModal.tsx
│   │   │   │   ├── Pagination.tsx
│   │   │   │   ├── ThemeCard.tsx
│   │   │   │   ├── ThemeForm.tsx
│   │   │   │   ├── ThemeGrid.tsx
│   │   │   │   └── type
│   │   │   │   ├── CrimeSceneFields.tsx
│   │   │   │   ├── EscapeRoomFields.tsx
│   │   │   │   ├── MurderMysteryFields.tsx
│   │   │   │   └── RealWorldFields.tsx
│   │   │   ├── ThemeToggle.tsx
│   │   │   ├── ui
│   │   │   │   ├── accordion.tsx
│   │   │   │   ├── alert-dialog.tsx
│   │   │   │   ├── alert.tsx
│   │   │   │   ├── aspect-ratio.tsx
│   │   │   │   ├── avatar.tsx
│   │   │   │   ├── badge.tsx
│   │   │   │   ├── breadcrumb.tsx
│   │   │   │   ├── button.tsx
│   │   │   │   ├── calendar.tsx
│   │   │   │   ├── card.tsx
│   │   │   │   ├── carousel.tsx
│   │   │   │   ├── channel-select.tsx
│   │   │   │   ├── chart.tsx
│   │   │   │   ├── checkbox.tsx
│   │   │   │   ├── collapsible.tsx
│   │   │   │   ├── command.tsx
│   │   │   │   ├── context-menu.tsx
│   │   │   │   ├── dialog.tsx
│   │   │   │   ├── drawer.tsx
│   │   │   │   ├── dropdown-menu.tsx
│   │   │   │   ├── form.tsx
│   │   │   │   ├── hover-card.tsx
│   │   │   │   ├── input-otp.tsx
│   │   │   │   ├── input.tsx
│   │   │   │   ├── label.tsx
│   │   │   │   ├── menubar.tsx
│   │   │   │   ├── navigation-menu.tsx
│   │   │   │   ├── pagination
│   │   │   │   │   └── index.tsx
│   │   │   │   ├── pagination.tsx
│   │   │   │   ├── popover.tsx
│   │   │   │   ├── progress.tsx
│   │   │   │   ├── radio-group.tsx
│   │   │   │   ├── resizable.tsx
│   │   │   │   ├── scroll-area.tsx
│   │   │   │   ├── select.tsx
│   │   │   │   ├── separator.tsx
│   │   │   │   ├── sheet.tsx
│   │   │   │   ├── sidebar.tsx
│   │   │   │   ├── skeleton.tsx
│   │   │   │   ├── slider.tsx
│   │   │   │   ├── sonner.tsx
│   │   │   │   ├── switch.tsx
│   │   │   │   ├── table.tsx
│   │   │   │   ├── tabs.tsx
│   │   │   │   ├── textarea.tsx
│   │   │   │   ├── toast.tsx
│   │   │   │   ├── toaster.tsx
│   │   │   │   ├── toggle-group.tsx
│   │   │   │   ├── toggle.tsx
│   │   │   │   └── tooltip.tsx
│   │   │   ├── UserPermissionCard.tsx
│   │   │   └── utils
│   │   │   └── permissionCardUtils.ts
│   │   ├── config
│   │   │   └── apiConfig.ts
│   │   ├── contexts
│   │   │   └── ChannelContext.tsx
│   │   ├── hooks
│   │   │   ├── profile
│   │   │   │   ├── index.ts
│   │   │   │   └── useProfileAPI.ts
│   │   │   ├── use-mobile.tsx
│   │   │   ├── useAuth.ts
│   │   │   ├── useDebounce.ts
│   │   │   ├── useFormValidator.ts
│   │   │   ├── useNotification.ts
│   │   │   ├── useProcessedNotifications.ts
│   │   │   ├── useReadNotifications.ts
│   │   │   ├── useTheme.ts
│   │   │   └── useToast.ts
│   │   ├── index.css
│   │   ├── layout
│   │   │   ├── DashboardLayout.tsx
│   │   │   └── MainLayout.tsx
│   │   ├── lib
│   │   │   ├── api
│   │   │   │   └── followApi.ts
│   │   │   ├── api.ts
│   │   │   ├── dateFormat.tsx
│   │   │   ├── reactQuery.ts
│   │   │   ├── types
│   │   │   │   └── board.ts
│   │   │   ├── types.ts
│   │   │   ├── UTCToKSTMultiline.tsx
│   │   │   └── utils.ts
│   │   ├── main.tsx
│   │   ├── pages
│   │   │   ├── commands
│   │   │   │   ├── CommandDetail.tsx
│   │   │   │   ├── Commands.tsx
│   │   │   │   ├── CreateCommand.tsx
│   │   │   │   └── EditCommand.tsx
│   │   │   ├── community
│   │   │   │   ├── BoardList.tsx
│   │   │   │   ├── BoardPostDetail.tsx
│   │   │   │   ├── BoardWrite.tsx
│   │   │   │   ├── CreatorBoard.tsx
│   │   │   │   ├── CreatorPostDetail.tsx
│   │   │   │   ├── FreeBoard.tsx
│   │   │   │   ├── FreePostDetail.tsx
│   │   │   │   ├── QuestionBoard.tsx
│   │   │   │   └── QuestionPostDetail.tsx
│   │   │   ├── ContactPage.tsx
│   │   │   ├── dashboard
│   │   │   │   ├── Dashboard.tsx
│   │   │   │   ├── DashbordProfileCard.tsx
│   │   │   │   ├── Guilds.tsx
│   │   │   │   ├── Profile.tsx
│   │   │   │   └── Teams.tsx
│   │   │   ├── DonationPage.tsx
│   │   │   ├── follows
│   │   │   │   └── FollowsPage.tsx
│   │   │   ├── GameHistoryOwnerBoard.tsx
│   │   │   ├── Index.tsx
│   │   │   ├── Login.tsx
│   │   │   ├── LoginError.tsx
│   │   │   ├── MessageButtonEditor.tsx
│   │   │   ├── NotFound.tsx
│   │   │   ├── notices
│   │   │   │   ├── CreateNotice.tsx
│   │   │   │   ├── EditNotice.tsx
│   │   │   │   ├── NoticeDetail.tsx
│   │   │   │   └── NoticeList.tsx
│   │   │   ├── notifications
│   │   │   │   └── NotificationListPage.tsx
│   │   │   ├── PointHistory
│   │   │   │   └── PointHistoryPage.tsx
│   │   │   ├── posts
│   │   │   │   ├── PostDetailPage.tsx
│   │   │   │   ├── PostEditorPage.tsx
│   │   │   │   └── PostsPage.tsx
│   │   │   ├── PrivacyPage.tsx
│   │   │   ├── profile
│   │   │   │   └── ProfilePage.tsx
│   │   │   ├── sns
│   │   │   │   ├── SNSCreatePage.tsx
│   │   │   │   ├── SNSExplorePage.tsx
│   │   │   │   ├── SNSFeedPage.tsx
│   │   │   │   ├── SNSPostDetailPage.tsx
│   │   │   │   └── SNSSavedPage.tsx
│   │   │   ├── TermsPage.tsx
│   │   │   ├── themes
│   │   │   │   ├── CreateTheme.tsx
│   │   │   │   ├── EditTheme.tsx
│   │   │   │   ├── ThemeDetail.tsx
│   │   │   │   └── ThemeList.tsx
│   │   │   ├── Unauthorized.tsx
│   │   │   └── UserGameHistoryPage.tsx
│   │   ├── types
│   │   │   ├── comment.ts
│   │   │   ├── gameHistory.ts
│   │   │   ├── notification.ts
│   │   │   └── pointHistory.ts
│   │   ├── utils
│   │   │   ├── authUtils.ts
│   │   │   ├── guard.ts
│   │   │   ├── highlight.tsx
│   │   │   ├── notificationDebug.ts
│   │   │   ├── notificationOptimization.ts
│   │   │   ├── notificationRouting.ts
│   │   │   └── validators.ts
│   │   └── vite-env.d.ts
│   ├── tailwind.config.ts
│   ├── tsconfig.app.json
│   ├── tsconfig.json
│   ├── tsconfig.node.json
│   └── vite.config.ts
├── images
│   ├── avatars
│   │   ├── 419fe4e7-d6eb-4246-9df4-b4fb1ebaf2c2.jpg
│   │   └── a2a8bea5-c131-40ec-b970-4c1683dddea2.jpg
│   ├── gamethemes
│   │   ├── 4df8cf97-6514-4122-9831-ce596177a02c.png
│   │   └── 79e8ad70-3851-4620-9c0e-b5655d99f483.jpg
│   ├── images
│   │   └── gamethemes
│   │   └── c1359d70-d8dc-4a27-8653-3c6ce5c0bd44.jpg
│   └── userpost
│   ├── 04cfd853-c7d4-4ea0-98b9-c0d011535cd4.jpg
│   ├── 080f5eba-bb20-4b8d-bc16-b07eede198bd.jpg
│   ├── 0a9548ee-a2c6-411b-879a-8433188144e9.jpg
│   ├── 1b57a7b6-2e16-42a0-b7ea-69708aad7538.png
│   ├── 32997fca-9382-4e7a-a63c-81b09fe0874d.jpg
│   ├── 4045737e-6bd6-4ec2-9f44-d5824ecf8b83.png
│   ├── 43e47116-cf63-45e5-bbe2-be7073bb9e1c.jpg
│   ├── 450ce1dd-d7e5-4d5c-b28d-80a768eb47f5.jpg
│   ├── 5dab3fd6-3ca8-409b-8ea5-c4ea7b3ab9cd.jpg
│   ├── 61cc8ab3-0e6d-443c-bd19-32d29a47f8c9.jpg
│   ├── 6f698819-0054-4fff-a29c-4278aeffbdb0.jpg
│   ├── 82fc6894-b7f7-4c6b-88f5-941e1ecb2c5e.jpg
│   ├── 953ae40e-100e-46fb-bb14-0e6f52412bce.jpg
│   ├── 9683f7df-2cdf-4628-a39d-3cea2040b408.jpg
│   ├── bcacac3d-ab73-4548-b27d-a29a5c671708.jpg
│   ├── c4180154-f113-4b59-8d1c-803f2dadb6a3.jpg
│   ├── c7afca59-18f2-4371-8668-c695abe6299b.png
│   ├── cbec049c-c8d7-476c-95ab-a692eb359f8f.png
│   └── d5afd50c-5b1e-43e8-9da0-7c3f2af45fcb.jpg
├── Makefile
├── package-lock.json
├── package.json
├── README.md
└── README2.md

801 directories, 2487 files
